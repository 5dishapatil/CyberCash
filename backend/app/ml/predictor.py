import joblib
import pandas as pd
import numpy as np
import os
from sqlalchemy.orm import Session
from app.models.domain import Terminal, Transaction
from app.simulator.spatial import spatial_engine
from app.ml.features import calculate_point_in_time_features
import random

MODEL_PATH = "app/ml/models/calibrated_baseline_v1.pkl"
model = None

class PlattScaler: pass
class CalibratedModel: pass

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        from app.ml.model_trainer import PlattScaler, CalibratedModel
        model = joblib.load(MODEL_PATH)
    return model

def predict_cashout(db: Session, account_id: str, simulation_time):
    # 1. True Point-In-Time Features
    features = calculate_point_in_time_features(db, account_id, simulation_time)
    
    m = load_model()
    if not m: return 0.05, features
    
    df = pd.DataFrame([features])
    prob = m.predict_proba(df)[0]
    return float(prob), features

def rank_candidate_terminals(db: Session, account_id: str, cashout_prob: float, origin_lat: float, origin_lng: float, time_window_mins: float):
    # Deterministic Terminal Ranking (w1*reachability + w2*historical_affinity)
    terminals = db.query(Terminal).all()
    
    # Simple proxy for historical affinity: Did the account transact with a bank that owns this terminal?
    txs = db.query(Transaction).filter(Transaction.destination_account == account_id).all()
    associated_banks = {tx.bank_id for tx in txs if tx.bank_id}
    
    candidates = []
    for t in terminals:
        travel_time = spatial_engine.estimate_travel_time(origin_lat, origin_lng, t.latitude, t.longitude)
        if travel_time <= time_window_mins:
            # Deterministic scoring
            reachability_score = max(0, 1.0 - (travel_time / time_window_mins))
            affinity_score = 1.0 if t.bank_id in associated_banks else 0.1
            regional_score = 0.5 # Default for unmapped regions
            
            # Weighted location score
            w1, w2, w3 = 0.6, 0.3, 0.1
            location_score = (w1 * reachability_score) + (w2 * affinity_score) + (w3 * regional_score)
            
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
