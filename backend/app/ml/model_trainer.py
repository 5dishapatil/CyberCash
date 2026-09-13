import random
import datetime
import pandas as pd
import numpy as np
import joblib
import os
import lightgbm as lgb
from app.db.database import SessionLocal
from app.models.domain import Account, Terminal

def generate_training_data(db, num_samples=5000):
    accounts = db.query(Account).limit(100).all()
    if not accounts:
        return pd.DataFrame(), []
    
    data = []
    labels = []
    
    for _ in range(num_samples):
        is_fraud = random.random() < 0.15
        amount = random.uniform(500, 20000) if not is_fraud else random.uniform(10000, 500000)
        velocity_5m = random.randint(1, 5) if not is_fraud else random.randint(5, 20)
        fan_out = random.randint(1, 3) if not is_fraud else random.randint(4, 15)
        acc_age = random.randint(100, 3650) if not is_fraud else random.randint(1, 30)
        
        data.append([amount, velocity_5m, fan_out, acc_age])
        labels.append(1 if is_fraud else 0)
        
    df = pd.DataFrame(data, columns=["amount", "velocity_5m", "fan_out", "acc_age"])
    return df, labels

def train_and_save_model():
    print("Connecting to DB for entities...")
    db = SessionLocal()
    df, y = generate_training_data(db)
    db.close()
    
    print("Training LightGBM Classifier...")
    clf = lgb.LGBMClassifier(n_estimators=100, random_state=42)
    clf.fit(df, y)
    
    model_dir = "app/ml/models"
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "baseline_v1.pkl")
    joblib.dump(clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == '__main__':
    train_and_save_model()
