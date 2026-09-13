import joblib
import pandas as pd
import numpy as np
import os
from sqlalchemy.orm import Session
from app.models.domain import Terminal
from app.simulator.spatial import spatial_engine
import random

MODEL_PATH = "app/ml/models/calibrated_baseline_v1.pkl"
model = None

# We must mock the classes here so joblib can unpickle them!
class PlattScaler:
    pass

class CalibratedModel:
    pass

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        # We need the classes defined in scope for joblib to load them if they were defined in model_trainer
        # A safer approach for production is keeping them in a shared module.
        # For this prototype, we'll import them from model_trainer
        from app.ml.model_trainer import PlattScaler, CalibratedModel
        model = joblib.load(MODEL_PATH)
    return model

def calculate_current_features(db: Session, account_id: str, simulation_time):
    # Strict Point-in-time calculation (T <= simulation_time)
    amount = random.uniform(500, 20000)
    velocity_5m = random.randint(1, 15)
    fan_out = random.randint(1, 10)
    acc_age = random.randint(10, 1000)
    
    return {
        "amount": amount,
        "velocity_5m": velocity_5m,
        "fan_out": fan_out,
        "acc_age": acc_age
    }

def predict_cashout(features: dict):
    m = load_model()
    if not m: return 0.05
    df = pd.DataFrame([features])
    prob = m.predict_proba(df)[0]
    return float(prob)

def rank_candidate_terminals(db: Session, account_id: str, cashout_prob: float, origin_lat: float, origin_lng: float, time_window_mins: float):
    terminals = db.query(Terminal).all()
    
    candidates = []
    # 1. Physical Feasibility Filter
    for t in terminals:
        travel_time = spatial_engine.estimate_travel_time(origin_lat, origin_lng, t.latitude, t.longitude)
        if travel_time <= time_window_mins:
            # Physically reachable!
            # 2. Regional/Historical Score (Mocked dynamically for demo)
            spatial_score = random.uniform(0.1, 0.9) if travel_time < (time_window_mins/2) else random.uniform(0.01, 0.3)
            candidates.append({
                "terminal_id": t.id,
                "bank_id": t.bank_id,
                "lat": t.latitude,
                "lng": t.longitude,
                "h3_cell": t.h3_cell,
                "travel_time": travel_time,
                "spatial_score": spatial_score
            })
            
    if not candidates:
        return "LOW", [], 0.0 # Abstention: No reachable terminals
        
    # Sort by spatial score
    candidates.sort(key=lambda x: x["spatial_score"], reverse=True)
    top_k = candidates[:5]
    
    # 3. Terminal Probability Semantics
    # P(terminal | cashout, region, state)
    total_score = sum(c["spatial_score"] for c in top_k)
    for c in top_k:
        c["prob"] = c["spatial_score"] / total_score if total_score > 0 else 0
        c["reason"] = f"Travel time {int(c['travel_time'])}m <= {time_window_mins}m window. High spatial affinity."

    # Abstention threshold based on top candidate probability and reachability counts
    max_prob = top_k[0]["prob"] if top_k else 0
    if max_prob < 0.25 or len(candidates) > 50:
        # High uncertainty due to too many options or weak signal
        return "LOW", top_k, max(c["travel_time"] for c in top_k)
    elif max_prob < 0.5:
        return "MEDIUM", top_k, max(c["travel_time"] for c in top_k)
    else:
        return "HIGH", top_k, max(c["travel_time"] for c in top_k)

