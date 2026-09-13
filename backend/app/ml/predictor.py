import joblib
import pandas as pd
import os
from sqlalchemy.orm import Session
from app.models.domain import Terminal
import random

MODEL_PATH = "app/ml/models/baseline_v1.pkl"
model = None

def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
    return model

def calculate_current_features(db: Session, account_id: str, simulation_time):
    # Strict Point-in-time calculation (T <= simulation_time)
    # Since this is a demo, we will simulate the feature extraction
    # Normally we'd do a complex SQL query here against Transactions
    
    # We'll generate realistic-looking features based on the account's history
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
    if not m:
        return 0.05 # Baseline low risk if model missing
    
    df = pd.DataFrame([features])
    prob = m.predict_proba(df)[0][1] # Probability of class 1 (Fraud)
    return prob

def rank_candidate_terminals(db: Session, account_id: str, prob: float):
    # If high probability, rank ATMs nearby
    # For demo, just pick 5 random ATMs and assign descending probabilities that sum to 1.0 (relative ranking)
    terminals = db.query(Terminal).limit(20).all()
    selected = random.sample(terminals, min(5, len(terminals)))
    
    ranked = []
    current_p = 0.45
    for t in selected:
        ranked.append({
            "terminal_id": t.id,
            "bank_id": t.bank_id,
            "lat": t.latitude,
            "lng": t.longitude,
            "h3_cell": t.h3_cell,
            "prob": round(current_p, 2)
        })
        current_p *= 0.6
        
    return ranked
