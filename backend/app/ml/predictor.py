import joblib
import pandas as pd
import os
from sqlalchemy.orm import Session
from app.models.domain import Terminal, Transaction, Device
from app.simulator.spatial import spatial_engine
from app.ml.features import calculate_point_in_time_features
from app.ml.calibration import PlattScaler, CalibratedModel

MODEL_PATH = "app/ml/models/calibrated_baseline_v1.pkl"
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    return model

def predict_cashout(db: Session, account_id: str, simulation_time):
    features = calculate_point_in_time_features(db, account_id, simulation_time)
    m = load_model()
    if not m: return 0.05, features
    
    df = pd.DataFrame([features])
    prob = m.predict_proba(df)[0]
    return float(prob), features

def rank_candidate_terminals(db: Session, account_id: str, simulation_time):
    # 1. Resolve Location (No hardcoded origin)
    # Get latest transaction source/device to approximate location
    latest_tx = db.query(Transaction).filter(
        (Transaction.source_account == account_id) | (Transaction.destination_account == account_id),
        Transaction.timestamp <= simulation_time
    ).order_by(Transaction.timestamp.desc()).first()
    
    # In a real system, we'd cross-reference device IP location or known home branch.
    # For synthetic prototype, we fall back to a region center if no tx exists.
    origin_lat, origin_lng = 18.5204, 73.8567 # Default fallback Pune
    if latest_tx and latest_tx.device_id:
        dev = db.query(Device).filter(Device.id == latest_tx.device_id).first()
        if dev:
            # Assuming Device has location in a real system. Using fallback for demo.
            origin_lat, origin_lng = 18.5204, 73.8567 

    # 2. Affinity Leakage Fixed (timestamp <= simulation_time)
    txs = db.query(Transaction).filter(
        Transaction.destination_account == account_id,
        Transaction.timestamp <= simulation_time
    ).all()
    associated_banks = {tx.bank_id for tx in txs if tx.bank_id}
    
    terminals = db.query(Terminal).all()
    candidates = []
    
    # 3. Dynamic Time Window
    # For V1, assuming fixed 30 min window for reachability
    time_window_mins = 30.0 
    
    for t in terminals:
        travel_time = spatial_engine.estimate_travel_time(origin_lat, origin_lng, t.latitude, t.longitude)
        if travel_time <= time_window_mins:
            reachability_score = max(0, 1.0 - (travel_time / time_window_mins))
            affinity_score = 1.0 if t.bank_id in associated_banks else 0.1
            
            w1, w2 = 0.7, 0.3
            location_score = (w1 * reachability_score) + (w2 * affinity_score)
            
            candidates.append({
                "terminal_id": t.id,
                "bank_id": t.bank_id,
                "lat": t.latitude,
                "lng": t.longitude,
                "h3_cell": t.h3_cell,
                "travel_time": travel_time,
                "spatial_score": location_score
            })
            
    if not candidates:
        return "LOW", [], 0.0
        
    candidates.sort(key=lambda x: x["spatial_score"], reverse=True)
    top_k = candidates[:5]
    
    # Rename to likelihood score
    total_score = sum(c["spatial_score"] for c in top_k)
    for c in top_k:
        c["prob"] = c["spatial_score"] / total_score if total_score > 0 else 0
        c["reason"] = f"Reachable ({int(c['travel_time'])}m). Affinity matched."

    max_prob = top_k[0]["prob"] if top_k else 0
    if max_prob < 0.25 or len(candidates) > 50:
        return "LOW", top_k, max(c["travel_time"] for c in top_k)
    elif max_prob < 0.5:
        return "MEDIUM", top_k, max(c["travel_time"] for c in top_k)
    else:
        return "HIGH", top_k, max(c["travel_time"] for c in top_k)
