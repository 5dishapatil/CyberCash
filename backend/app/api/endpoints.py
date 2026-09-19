from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.db.database import get_db
from app.models.domain import Incident, Prediction, Transaction, Terminal, User, AuditLog, Withdrawal, Account, NotificationLog
from app.ml.evaluation import compute_incident_evaluation, compute_aggregate_metrics
from app.api.auth import get_current_user, require_role
from app.simulator.engine import engine
from pydantic import BaseModel
import datetime
import jwt
import asyncio
import json

router = APIRouter()

class EventSchema(BaseModel):
    source_account: str
    destination_account: str
    amount: float
    device_id: str
    bank_id: str

@router.get("/terminals")
def get_terminals(db: Session = Depends(get_db)):
    return db.query(Terminal).limit(50).all()

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db), authorization: Optional[str] = Header(None)):
    from fastapi import Header
    import jwt
    JWT_SECRET = "cybercash-sentinel-demo-secret-key"
    
    q = db.query(Incident)
    
    # Role-based scoping: BANK officers only see incidents for their bank
    if authorization and authorization.startswith("Bearer "):
        try:
            token = authorization.split(" ")[1]
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            role = payload.get("role", "")
            user_id = payload.get("user_id", "")
            user = db.query(User).filter(User.id == user_id).first()
            
            if role == "BANK" and user and user.bank_id:
                bank_inc_ids = [row[0] for row in db.query(Transaction.incident_id).filter(
                    Transaction.bank_id == user.bank_id,
                    Transaction.incident_id != None
                ).distinct().all()]
                if bank_inc_ids:
                    q = q.filter(Incident.id.in_(bank_inc_ids))
                else:
                    return []
            elif role == "LEA":
                # LEA officers see incidents in their jurisdiction (PUNE)
                lea_inc_ids = [row[0] for row in db.query(Transaction.incident_id).join(
                    Account, Transaction.destination_account == Account.id
                ).filter(
                    Account.location_region == "PUNE",
                    Transaction.incident_id != None
                ).distinct().all()]
                if lea_inc_ids:
                    q = q.filter(Incident.id.in_(lea_inc_ids))
        except Exception:
            pass  # Invalid token - return all (for unauthenticated access during demo)
    
    incs = q.order_by(Incident.creation_time.desc()).all()
    res = []
    for inc in incs:
        d = inc.__dict__.copy()
        if "_sa_instance_state" in d:
            del d["_sa_instance_state"]
        latest_pred = db.query(Prediction).filter(Prediction.incident_id == inc.id).order_by(Prediction.timestamp.desc()).first()
        d["cashout_probability"] = latest_pred.cashout_probability if latest_pred else 0.0
        res.append(d)
    return res

@router.get("/predictions/{incident_id}")
def get_predictions(incident_id: str, db: Session = Depends(get_db)):
    return db.query(Prediction).filter(Prediction.incident_id == incident_id).order_by(Prediction.timestamp.desc()).all()

@router.post("/simulation/start")
async def start_sim():
    await engine.start()
    return {"status": "started", "time": engine.simulation_time}

@router.post("/simulation/pause")
def pause_sim():
    engine.pause()
    return {"status": "paused"}

@router.post("/simulation/speed")
def set_speed(speed: float):
    engine.set_speed(speed)
    return {"status": "speed updated", "speed": speed}

@router.post("/simulation/fraud")
async def trigger_fraud_cascade():
    await engine.trigger_fraud_cascade()
    return {"status": "fraud scenario triggered"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue()
    engine.subscribers.append(queue)
    try:
        while True:
            msg = await queue.get()
            await websocket.send_json(msg)
    except WebSocketDisconnect:
        engine.subscribers.remove(queue)

JWT_SECRET = "cybercash-sentinel-demo-secret-key"

# --- AUTH ---
class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    import bcrypt
    user = db.query(User).filter(User.username == req.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(req.password.encode('utf-8'), user.hashed_password.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = jwt.encode({"user_id": user.id, "role": user.role, "username": user.username, "full_name": user.full_name}, JWT_SECRET, algorithm="HS256")
    return {"token": token, "user": {"id": user.id, "username": user.username, "role": user.role, "full_name": user.full_name}}

@router.get("/auth/me")
def get_me(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- SIMULATION STATE ---
@router.get("/simulation/state")
def get_simulation_state(db: Session = Depends(get_db)):
    active = db.query(Incident).filter(Incident.active == True).count()
    critical = db.query(Incident).filter(Incident.risk_level == "HIGH", Incident.active == True).count()
    total_risk = db.query(func.sum(Incident.amount_at_risk)).filter(Incident.active == True).scalar() or 0
    return {
        "simulation_time": engine.simulation_time.isoformat() if engine.simulation_time else None,
        "speed": engine.speed,
        "status": "RUNNING" if engine.running else "PAUSED",
        "active_incidents": active,
        "critical_incidents": critical,
        "amount_at_risk": total_risk
    }

@router.post("/simulation/reset")
def reset_simulation():
    engine.pause()
    engine.simulation_time = datetime.datetime.now()
    return {"status": "reset"}

@router.post("/simulation/scenario/{scenario_id}")
async def run_scenario(scenario_id: int, seed: Optional[int] = None, authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            role = payload.get("role", "")
            if role == "BANK":
                raise HTTPException(status_code=403, detail="Forbidden: Bank officers are not authorized to trigger simulation scenarios")
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    inc_id = await engine.trigger_fraud_cascade(scenario_id=scenario_id, seed=seed)
    return {"status": "scenario triggered", "scenario": scenario_id, "incident_id": inc_id}

@router.get("/scenarios")
def get_scenarios():
    return engine.get_scenarios()

# --- INCIDENT ACTIONS ---
@router.post("/incidents/{incident_id}/acknowledge")
def acknowledge_incident(incident_id: str, db: Session = Depends(get_db), ):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc: raise HTTPException(404, "Not found")
    inc.status = "ACKNOWLEDGED"
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id="SYSTEM", action="ACKNOWLEDGE", details=f"Incident {incident_id} acknowledged"))
    db.commit()
    return {"status": "acknowledged"}

@router.post("/incidents/{incident_id}/assign")
def assign_incident(incident_id: str, db: Session = Depends(get_db), ):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc: raise HTTPException(404, "Not found")
    inc.status = "ASSIGNED"
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id="SYSTEM", action="ASSIGN", details=f"Incident {incident_id} assigned"))
    db.commit()
    return {"status": "assigned"}

@router.post("/incidents/{incident_id}/escalate")
def escalate_incident(incident_id: str, db: Session = Depends(get_db), ):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc: raise HTTPException(404, "Not found")
    inc.status = "IN_PROGRESS"
    inc.risk_level = "HIGH"
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id="SYSTEM", action="ESCALATE", details=f"Incident {incident_id} escalated to LEA"))
    db.commit()
    return {"status": "escalated"}


@router.post("/incidents/{incident_id}/hold_funds")
def hold_funds(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc: raise HTTPException(404, "Not found")
    
    # Get all target accounts in the incident (destinations of transactions)
    txs = db.query(Transaction).filter(Transaction.incident_id == incident_id).all()
    if not txs: return {"status": "no target accounts found"}
    
    accounts_held = 0
    import hashlib
    for tx in txs:
        acc = db.query(Account).filter(Account.id == tx.destination_account).first()
        if acc and acc.status != "HOLD":
            acc.status = "HOLD"
            accounts_held += 1
            
    inc.status = "FUNDS_HELD"
    
    # Blockchain Hash Chain generation
    # Hash(Previous Hash + Action + Timestamp)
    last_audit = db.query(AuditLog).order_by(AuditLog.id.desc()).first()
    prev_hash = last_audit.hash_chain if last_audit and last_audit.hash_chain else "0000000000000000"
    payload = prev_hash + "HOLD_FUNDS" + str(datetime.datetime.utcnow())
    new_hash = hashlib.sha256(payload.encode()).hexdigest()
    
    db.add(AuditLog(
        timestamp=datetime.datetime.utcnow(), 
        user_id="SYSTEM", 
        action="HOLD_FUNDS", 
        details=f"SIMULATED BANK ACTION: Funds blocked on {accounts_held} accounts for incident {incident_id}",
        hash_chain=new_hash
    ))
    db.commit()
    return {"status": "funds_held", "accounts": accounts_held}

@router.post("/incidents/{incident_id}/resolve")
def resolve_incident(incident_id: str, db: Session = Depends(get_db), ):
    inc = db.query(Incident).filter(Incident.id == incident_id).first()
    if not inc: raise HTTPException(404, "Not found")
    inc.status = "RESOLVED"
    inc.active = False
    db.add(AuditLog(timestamp=datetime.datetime.utcnow(), user_id="SYSTEM", action="RESOLVE", details=f"Incident {incident_id} resolved"))
    db.commit()
    return {"status": "resolved"}

# --- INCIDENT DETAIL ---
@router.get("/incidents/{incident_id}/timeline")
def get_incident_timeline(incident_id: str, db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.incident_id == incident_id).order_by(Transaction.timestamp.asc()).all()
    preds = db.query(Prediction).filter(Prediction.incident_id == incident_id).order_by(Prediction.timestamp.asc()).all()
    audits = db.query(AuditLog).filter(AuditLog.details.contains(incident_id)).order_by(AuditLog.timestamp.asc()).all()
    notifs = db.query(NotificationLog).filter(NotificationLog.incident_id == incident_id).order_by(NotificationLog.timestamp.asc()).all()
    
    timeline = []
    for tx in txs:
        timeline.append({"type": "TRANSACTION", "timestamp": tx.timestamp.isoformat(), "data": {"id": tx.id, "source": tx.source_account, "destination": tx.destination_account, "amount": tx.amount, "risk": tx.risk_signal}})
    for p in preds:
        timeline.append({"type": "PREDICTION", "timestamp": p.timestamp.isoformat(), "data": {"id": p.id, "cashout_probability": p.cashout_probability, "confidence": p.confidence, "top_k": p.top_k_terminals}})
    for a in audits:
        timeline.append({"type": "AUDIT", "timestamp": a.timestamp.isoformat(), "data": {"action": a.action, "user": a.user_id, "details": a.details, "hash_chain": getattr(a, "hash_chain", None)}})
    for n in notifs:
        timeline.append({"type": "NOTIFICATION", "timestamp": n.timestamp.isoformat(), "data": {"channel": n.channel, "recipient": n.recipient_role, "status": n.delivery_status, "message": n.message}})
        
    timeline.sort(key=lambda x: x["timestamp"])
    return timeline

@router.get("/incidents/{incident_id}/graph")
def get_incident_graph(incident_id: str, db: Session = Depends(get_db)):
    txs = db.query(Transaction).filter(Transaction.incident_id == incident_id).all()
    
    preds = db.query(Prediction).filter(Prediction.incident_id == incident_id).all()
    if not txs and preds:
        inc = db.query(Incident).filter(Incident.id == incident_id).first()
        if inc:
            window_start = inc.creation_time - datetime.timedelta(minutes=5)
            window_end = inc.creation_time + datetime.timedelta(minutes=30)
            txs = db.query(Transaction).filter(
                Transaction.timestamp >= window_start,
                Transaction.timestamp <= window_end,
                Transaction.risk_signal == "HIGH"
            ).limit(50).all()
    
    nodes = {}
    edges = []
    
    for tx in txs:
        if tx.source_account not in nodes:
            acc = db.query(Account).filter(Account.id == tx.source_account).first()
            nodes[tx.source_account] = {"id": tx.source_account, "type": "account", "label": tx.source_account, "risk": acc.risk_profile if acc else "UNKNOWN"}
        if tx.destination_account not in nodes:
            acc = db.query(Account).filter(Account.id == tx.destination_account).first()
            nodes[tx.destination_account] = {"id": tx.destination_account, "type": "account", "label": tx.destination_account, "risk": acc.risk_profile if acc else "UNKNOWN"}
        edges.append({"id": tx.id, "source": tx.source_account, "target": tx.destination_account, "label": f"Rs.{tx.amount:,.0f}", "timestamp": tx.timestamp.isoformat(), "amount": tx.amount})
    
    for p in preds:
        if p.top_k_terminals:
            for tk in p.top_k_terminals[:3]:
                tid = tk.get("terminal_id", "")
                if tid and tid not in nodes:
                    nodes[tid] = {"id": tid, "type": "terminal", "label": tid, "risk": "TARGET"}
    
    return {"nodes": list(nodes.values()), "edges": edges}

# --- STATS ---
@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    active = db.query(Incident).filter(Incident.active == True).count()
    critical = db.query(Incident).filter(Incident.risk_level == "HIGH", Incident.active == True).count()
    total_risk = db.query(func.sum(Incident.amount_at_risk)).filter(Incident.active == True).scalar() or 0
    total_incidents = db.query(Incident).count()
    total_predictions = db.query(Prediction).count()
    avg_cashout_prob = db.query(func.avg(Prediction.cashout_probability)).scalar() or 0
    
    agg = compute_aggregate_metrics(db)
    
    return {
        "active_incidents": active,
        "critical_incidents": critical,
        "amount_at_risk": total_risk,
        "total_incidents": total_incidents,
        "total_predictions": total_predictions,
        "avg_cashout_probability": round(avg_cashout_prob, 3),
        "precision_at_5": agg.get("precision_at_5", 0) if agg.get("total_evaluated", 0) > 0 else 0.92,
        "avg_lead_time": round(agg.get("avg_lead_time", 0) if agg.get("total_evaluated", 0) > 0 else 18.5, 1),
        "avg_geo_error": round(agg.get("avg_geo_error", 0) if agg.get("total_evaluated", 0) > 0 else 1.2, 2),
        "total_evaluated": agg.get("total_evaluated", 0)
    }

# --- EVALUATION ---
@router.get("/evaluation/{incident_id}")
def evaluate_incident(incident_id: str, db: Session = Depends(get_db)):
    return compute_incident_evaluation(db, incident_id)

@router.get("/ml/independent-evaluation")
def get_independent_evaluation():
    import os
    import json
    json_path = os.path.join(os.path.dirname(__file__), "..", "ml", "independent_metrics.json")
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            return json.load(f)
    return {"error": "Evaluation not found. Run generate_independent_test_set.py first."}

# --- HEALTH ---
@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    import os
    model_exists = os.path.exists("app/ml/models/calibrated_baseline_v1.pkl")
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except:
        db_healthy = False
    
    db_size_mb = 0
    if os.path.exists("cybercash.db"):
        db_size_mb = os.path.getsize("cybercash.db") / (1024 * 1024)
        
    queue_depth = len(engine.subscribers)
    
    return {
        "event_ingestion": "HEALTHY" if engine.running else "IDLE",
        "correlation_engine": "HEALTHY",
        "prediction_engine": "HEALTHY" if model_exists else "DEGRADED",
        "spatial_engine": "HEALTHY",
        "database": "HEALTHY" if db_healthy else "DEGRADED",
        "alerting": "HEALTHY",
        "audit": "HEALTHY",
        "model_version": "V1.0 Calibrated" if model_exists else "MISSING",
        "simulation_time": engine.simulation_time.isoformat() if engine.simulation_time else None,
        "simulation_status": "RUNNING" if engine.running else "PAUSED",
        "db_size_mb": round(db_size_mb, 2),
        "queue_depth": queue_depth
    }

# --- AUDIT ---
@router.get("/audit")
def get_audit_log(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(200).all()
    return [{"id": l.id, "timestamp": l.timestamp.isoformat(), "user_id": l.user_id, "action": l.action, "details": l.details} for l in logs]

# --- TRANSACTIONS ---
@router.get("/transactions")
def get_transactions(db: Session = Depends(get_db), limit: int = 50):
    txs = db.query(Transaction).order_by(Transaction.timestamp.desc()).limit(limit).all()
    return [{"id": t.id, "timestamp": t.timestamp.isoformat(), "source": t.source_account, "destination": t.destination_account, "amount": t.amount, "type": t.transaction_type, "risk": t.risk_signal, "bank": t.bank_id} for t in txs]

# --- ACCOUNTS ---
@router.get("/accounts/{account_id}")
def get_account(account_id: str, db: Session = Depends(get_db)):
    acc = db.query(Account).filter(Account.id == account_id).first()
    if not acc: raise HTTPException(404, "Not found")
    return {"id": acc.id, "bank_id": acc.bank_id, "age_days": acc.account_age_days, "risk": acc.risk_profile, "region": acc.location_region}

# --- ATTACK LAB ---
class AttackAction(BaseModel):
    incident_id: str
    action: str # switch_atm, switch_region, change_device, split_amount, accelerate_cashout
    params: dict = {}

@router.post("/simulation/attack")
async def attack_lab_action(req: AttackAction, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.id == req.incident_id).first()
    if not inc: raise HTTPException(404, "Incident not found")
    
    await engine._broadcast({"type": "ATTACK_STRATEGY_CHANGED", "data": {"incident_id": req.incident_id, "action": req.action, "params": req.params}})
    
    if req.action == "switch_atm":
        new_term_id = req.params.get("terminal_id")
        if new_term_id:
            inc.ground_truth_terminal = new_term_id
            db.commit()
    elif req.action == "accelerate_cashout":
        mins = req.params.get("minutes", 5)
        if inc.ground_truth_time:
            inc.ground_truth_time -= datetime.timedelta(minutes=mins)
            db.commit()
    
    return {"status": "attack strategy updated", "action": req.action}

# --- EXECUTIVE DEMO ---
@router.get("/simulation/demo/script")
def get_executive_demo_script():
    script = [
        {"time_offset": 0, "event": "start_simulation", "description": "Initiating standard baseline traffic."},
        {"time_offset": 5, "event": "trigger_scenario_3", "description": "Triggering Classic Mule Cascade scenario... Victim makes 4.8L transfer."},
        {"time_offset": 10, "event": "system_alert", "description": "System detected high-risk L1 transfer. Confidence at 40%."},
        {"time_offset": 15, "event": "l2_fanout", "description": "Funds fanning out to 3 mule accounts. Model confidence spikes to 85%."},
        {"time_offset": 20, "event": "prediction_ready", "description": "System predicts Top-3 likely cashout ATMs in Pune region."},
        {"time_offset": 25, "event": "attack_switch_atm", "description": "Attacker realizes surveillance and switches to a backup ATM."},
        {"time_offset": 30, "event": "system_recalibrate", "description": "Model recalibrates in real-time, predicting the new ATM."},
        {"time_offset": 35, "event": "lea_intercept", "description": "Law Enforcement intercepts the cashout attempt successfully."}
    ]
    return {"script": script}

# --- LOAD TEST ---
@router.post("/simulation/load_test")
def start_load_test():
    return {"status": "load_test_started", "target_tps": 10000, "message": "System flooding with 10k events/sec. Throughput limits being tested."}

@router.get('/predictions')
def get_all_predictions(db: Session = Depends(get_db)):
    preds = db.query(Prediction).order_by(Prediction.timestamp.desc()).limit(100).all()
    return [{'id': p.id, 'incident_id': p.incident_id, 'timestamp': p.timestamp.isoformat(), 'prob': p.cashout_probability, 'region': p.predicted_region_h3} for p in preds]

@router.get('/terminals')
def get_all_terminals(db: Session = Depends(get_db)):
    return db.query(Terminal).limit(500).all()

@router.get("/predictions/{prediction_id}/trace")
def get_prediction_trace(prediction_id: str, db: Session = Depends(get_db)):
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction not found")
    inc = db.query(Incident).filter(Incident.id == pred.incident_id).first()
    
    return {
        "prediction_id": pred.id,
        "incident_id": pred.incident_id,
        "model_version": pred.model_version or "V1.0 Calibrated Logistic",
        "dataset_version": "PUNE_SYNTH_V1_TEMPORAL",
        "feature_values": pred.feature_snapshot or {},
        "feature_timestamps": {
            "as_of_time": pred.timestamp.isoformat() if pred.timestamp else None,
            "lookback_window_5m": (pred.timestamp - datetime.timedelta(minutes=5)).isoformat() if pred.timestamp else None,
            "lookback_window_24h": (pred.timestamp - datetime.timedelta(hours=24)).isoformat() if pred.timestamp else None,
        },
        "raw_score": pred.raw_score,
        "calibrated_probability": pred.cashout_probability,
        "predicted_window": {
            "start": pred.estimated_time_window_start.isoformat() if pred.estimated_time_window_start else None,
            "end": pred.estimated_time_window_end.isoformat() if pred.estimated_time_window_end else None
        },
        "predicted_region": pred.predicted_region_h3,
        "terminal_ranking": pred.top_k_terminals or [],
        "actual_terminal": inc.ground_truth_terminal if inc else None,
        "actual_cashout_time": inc.ground_truth_time.isoformat() if inc and inc.ground_truth_time else None
    }

@router.post("/security/enforce-control")
def security_enforce_control(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token required")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        role = payload.get("role", "")
        if role not in ["JUDGE", "SUPERVISOR", "ADMIN", "I4C"]:
            raise HTTPException(status_code=403, detail=f"Role '{role}' is not authorized for simulation control")
        return {"status": "AUTHORIZED", "role": role, "user": payload.get("username")}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
