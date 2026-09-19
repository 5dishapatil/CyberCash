import asyncio
import uuid
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import Transaction, Account, Incident, Prediction, Terminal, Withdrawal, Device, Bank
from app.simulator.notifications import notification_router
from app.ml.predictor import predict_cashout, rank_candidate_terminals

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.simulation_time = datetime.datetime.now()
        self.speed = 1.0
        self.subscribers = []

    async def start(self):
        self.running = True
        asyncio.create_task(self._run_loop())

    def pause(self):
        self.running = False
        
    def set_speed(self, speed):
        self.speed = speed

    async def _run_loop(self):
        db = SessionLocal()
        while self.running:
            self.simulation_time += datetime.timedelta(seconds=1 * self.speed)
            if random.random() < 0.2:
                event = self._generate_legit_transaction(db)
                if event:
                    await self._broadcast({"type": "EVENT", "data": event})
            await asyncio.sleep(1)
        db.close()

    def _generate_legit_transaction(self, db: Session):
        accounts = db.query(Account).limit(100).all()
        if len(accounts) < 2: return None
        src, dst = random.sample(accounts, 2)
        amount = random.uniform(100, 10000)
        
        tx = Transaction(
            id=f"TX_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time, source_account=src.id, destination_account=dst.id,
            amount=amount, transaction_type="TRANSFER", bank_id=src.bank_id, risk_signal="LOW"
        )
        db.add(tx)
        db.commit()
        return {"id": tx.id, "timestamp": tx.timestamp.isoformat(), "source": tx.source_account, "destination": tx.destination_account, "amount": tx.amount, "risk": tx.risk_signal}

    def _snapshot_prediction(self, db: Session, inc_id: str, account_id: str, time_window_mins=30.0, origin_coords=None):
        prob, features, raw_score = predict_cashout(db, account_id, self.simulation_time)
        loc_conf, terminals, max_travel_time = rank_candidate_terminals(
            db, account_id, self.simulation_time, time_window_mins=time_window_mins, origin_coords=origin_coords
        )
        radius_km = (max_travel_time / 60.0) * 30.0 if max_travel_time > 0 else 10.0
        
        # Abstention handling
        is_abstained = (loc_conf == "ABSTAIN" or loc_conf == "LOW")
        top_candidates = [] if is_abstained else terminals
        conf_score = 0.35 if is_abstained else (0.85 if loc_conf == "HIGH" else 0.60)
        action = (
            "Abstain from tactical terminal deployment; maintain regional monitor due to rapid withdrawal velocity."
            if is_abstained else "Escalate to LEA patrol dispatch"
        )
        
        pred = Prediction(
            id=f"PRD_{uuid.uuid4().hex[:8]}", incident_id=inc_id,
            timestamp=self.simulation_time, cashout_probability=prob,
            estimated_time_window_start=self.simulation_time + datetime.timedelta(minutes=1 if time_window_mins <= 3 else 5),
            estimated_time_window_end=self.simulation_time + datetime.timedelta(minutes=int(time_window_mins)),
            predicted_region_h3=str(round(radius_km, 1)) if not is_abstained else "REGION_WIDE_UNCERTAIN", 
            top_k_terminals=top_candidates,
            confidence=conf_score,
            explanations=[
                {"reason": f"Calibrated P(Cashout|T)={prob:.2f}. Feature logit z={raw_score:.2f}.", "weight": 0.9},
                {"reason": f"Location Confidence: {loc_conf}. Travel window={time_window_mins}m.", "weight": 1.0}
            ],
            recommended_action=action,
            model_version="V1.0 Calibrated Logistic",
            raw_score=raw_score,
            feature_snapshot=features
        )
        db.add(pred)
        db.commit()
        return pred

    async def trigger_fraud_cascade(self, scenario_id=3, seed=None):
        """
        Executes a deterministic or dynamic scenario based on scenario_id.
        Accepts optional seed for reproducible replays.
        """
        db = SessionLocal()
        rng = random.Random(seed) if seed is not None else random.Random()
        
        accounts = db.query(Account).all()
        if not accounts or len(accounts) < 6:
            db.close()
            return None
        
        # Deterministic account picking
        actors = rng.sample(accounts, min(8, len(accounts)))
        victim = actors[0]
        mules = actors[1:5]
        
        # ── SCENARIO 1: NORMAL ACTIVITY ─────────────────────────────────────
        if scenario_id == 1:
            # Just a low-value transfer, no incident
            src, dst = rng.sample(accounts, 2)
            tx = Transaction(
                id=f"TX_{rng.randint(10000000, 99999999)}",
                timestamp=self.simulation_time,
                source_account=src.id, destination_account=dst.id,
                amount=float(rng.randint(500, 5000)),
                transaction_type="TRANSFER", bank_id=src.bank_id, risk_signal="LOW"
            )
            db.add(tx)
            db.commit()
            db.close()
            return None
            
        # ── SCENARIO 2: LEGIT 10L REMITTANCE ────────────────────────────────
        if scenario_id == 2:
            amt = 1000000.0
            inc = Incident(
                id=f"INC_{rng.randint(10000000, 99999999)}",
                incident_type="HIGH_VALUE_LEGIT",
                creation_time=self.simulation_time,
                trigger_source="SYSTEM",
                amount_at_risk=amt,
                risk_level="LOW",
                status="NEW"
            )
            db.add(inc)
            db.commit()
            
            # Legitimate single high-value transfer, NO mule cascade
            tx = Transaction(
                id=f"TX_{rng.randint(10000000, 99999999)}",
                timestamp=self.simulation_time,
                source_account=victim.id, destination_account=mules[0].id,
                amount=amt, transaction_type="INTERNATIONAL_REMITTANCE",
                bank_id=victim.bank_id, risk_signal="LOW",
                incident_id=inc.id
            )
            db.add(tx)
            db.commit()
            
            # Prediction snapshot: low probability because fan_out=0, prior fraud=0
            self._snapshot_prediction(db, inc.id, mules[0].id)
            # Notice: No notifications routed for LOW risk!
            db.close()
            return inc.id

        # ── SCENARIO 6: GEOGRAPHIC SHIFT SETUP ──────────────────────────────
        origin_coords = None
        if scenario_id == 6:
            # Shift location to North Pune (Nigdi / Pimpri) ~ 18.65, 73.78
            origin_coords = (18.6500, 73.7800)

        # ── SCENARIO 4: 3-MINUTE CASHOUT SETUP ──────────────────────────────
        time_window_mins = 3.0 if scenario_id == 4 else 30.0

        # ── SCENARIO 9: CROSS-BANK SETUP ────────────────────────────────────
        if scenario_id == 9:
            # Force distinct banks for victim, mule 0, mule 1, and ATM
            banks = db.query(Bank).all()
            if len(banks) >= 4:
                victim.bank_id = banks[0].id
                mules[0].bank_id = banks[1].id
                mules[1].bank_id = banks[2].id

        # Amount and type configuration
        amounts_map = {
            3: (480000.0, "MULE_CASCADE", "HIGH"),
            4: (150000.0, "RAPID_CASHOUT", "HIGH"),
            5: (200000.0, "ATM_SWITCHING", "HIGH"),
            6: (300000.0, "GEO_SWITCHING", "HIGH"),
            7: (75000.0,  "AMOUNT_SPLITTING", "HIGH"),
            8: (100000.0, "SLEEPER_MULE", "HIGH"),
            9: (500000.0, "CROSS_BANK_CASCADE", "HIGH"),
            10: (900000.0, "FALSE_POSITIVE", "LOW")
        }
        amt, inc_type, risk = amounts_map.get(scenario_id, (250000.0, "MULE_CASCADE", "HIGH"))

        inc_id = f"INC_{rng.randint(10000000, 99999999)}"
        inc = Incident(
            id=inc_id, incident_type=inc_type,
            creation_time=self.simulation_time, trigger_source="SYSTEM",
            amount_at_risk=amt, risk_level=risk, status="NEW"
        )
        db.add(inc)
        db.commit()

        # Route notifications if HIGH risk
        if risk == "HIGH":
            asyncio.create_task(notification_router.route_incident(inc.id))

        # Step 1: L1 transfer
        tx1 = Transaction(
            id=f"TXF_{rng.randint(10000000, 99999999)}", timestamp=self.simulation_time,
            source_account=victim.id, destination_account=mules[0].id,
            amount=amt, transaction_type="TRANSFER", bank_id=victim.bank_id, risk_signal="HIGH",
            incident_id=inc.id
        )
        db.add(tx1)
        db.commit()
        self._snapshot_prediction(db, inc.id, mules[0].id, time_window_mins=time_window_mins, origin_coords=origin_coords)

        # Advance simulation time
        step_advance = 1 if scenario_id == 4 else 2
        self.simulation_time += datetime.timedelta(minutes=step_advance)

        # Step 2: L2 Fan-out
        for m in mules[1:4]:
            tx = Transaction(
                id=f"TXF_{rng.randint(10000000, 99999999)}", timestamp=self.simulation_time,
                source_account=mules[0].id, destination_account=m.id,
                amount=amt / 3, transaction_type="TRANSFER", bank_id=mules[0].bank_id, risk_signal="HIGH",
                incident_id=inc.id
            )
            db.add(tx)
        db.commit()

        # Snapshot 2
        self._snapshot_prediction(db, inc.id, mules[0].id, time_window_mins=time_window_mins, origin_coords=origin_coords)

        self.simulation_time += datetime.timedelta(minutes=step_advance)

        # Snapshot 3
        latest_pred = self._snapshot_prediction(db, inc.id, mules[0].id, time_window_mins=time_window_mins, origin_coords=origin_coords)

        # Set ground truth terminal
        term_id = None
        if scenario_id == 5:
            # ATM Switching: Attacker chooses an unexpected terminal not in top-1
            all_terms = db.query(Terminal).all()
            if len(all_terms) > 3:
                term_id = all_terms[3].id
        elif latest_pred and latest_pred.top_k_terminals:
            term_id = latest_pred.top_k_terminals[0]["terminal_id"]
        
        if not term_id:
            t = db.query(Terminal).first()
            if t: term_id = t.id

        if term_id:
            lead_mins = 3 if scenario_id == 4 else 15
            cashout_time = self.simulation_time + datetime.timedelta(minutes=lead_mins)
            
            # PROACTIVE INTERVENTION CHECK
            db.refresh(mules[0])
            db.refresh(inc)
            
            if mules[0].status == "HOLD" or inc.status in ["FUNDS_HELD", "RESOLVED"]:
                print(f"[PROACTIVE INTERVENTION SUCCESS] Blocked withdrawal of {amt} for account {mules[0].id}")
            else:
                w = Withdrawal(
                    id=f"WTH_{rng.randint(10000000, 99999999)}", 
                    timestamp=cashout_time, 
                    terminal_id=term_id, 
                    account_id=mules[0].id, 
                    amount=amt, 
                    fraud_label=(risk == "HIGH"),
                    incident_id=inc.id
                )
                db.add(w)
                inc.ground_truth_terminal = term_id
                inc.ground_truth_time = cashout_time
                db.commit()

        await self._broadcast({"type": "ALERT", "data": {"incident_id": inc.id}})
        db.close()
        return inc.id

    def get_scenarios(self):
        return [
            {"id": 1, "name": "Normal Activity", "description": "Legitimate financial transactions"},
            {"id": 2, "name": "Legit 10L Remittance", "description": "High-value legitimate transfer (no fraud alert)"},
            {"id": 3, "name": "Classic Mule Cascade", "description": "Victim to mule network with cashout"},
            {"id": 4, "name": "3-Minute Cashout", "description": "Rapid cashout attempt (spatial abstention)"},
            {"id": 5, "name": "ATM Switching", "description": "Attacker switches target ATM dynamically"},
            {"id": 6, "name": "Geographic Switching", "description": "Attacker changes device/withdrawal region"},
            {"id": 7, "name": "Amount Splitting", "description": "Multiple small withdrawals"},
            {"id": 8, "name": "Sleeper Mule", "description": "Dormant account activated as mule"},
            {"id": 9, "name": "Cross-Bank Cascade", "description": "Fund flow across multiple distinct banks"},
            {"id": 10, "name": "False Positive Trap", "description": "Legitimate high-value payroll activity"}
        ]

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception:
                pass

engine = SimulationEngine()
