import random
import datetime
import pandas as pd
import numpy as np
import joblib
import os
import lightgbm as lgb
from scipy.optimize import minimize
from app.db.database import SessionLocal
from app.models.domain import Account, Terminal

class PlattScaler:
    def __init__(self):
        self.A = 0.0
        self.B = 0.0

    def fit(self, scores, y):
        # Fit sigmoid: P(y=1|f) = 1 / (1 + exp(A*f + B))
        # This minimizes negative log likelihood
        def obj_fn(params):
            A, B = params
            p = 1.0 / (1.0 + np.exp(A * scores + B))
            # Clip for log stability
            p = np.clip(p, 1e-10, 1 - 1e-10)
            return -np.sum(y * np.log(p) + (1 - y) * np.log(1 - p))
            
        res = minimize(obj_fn, [0.0, 0.0], method='BFGS')
        self.A, self.B = res.x
        
    def predict_proba(self, scores):
        p = 1.0 / (1.0 + np.exp(self.A * scores + self.B))
        return p

class CalibratedModel:
    def __init__(self, base_model, scaler):
        self.base_model = base_model
        self.scaler = scaler
        
    def predict_proba(self, X):
        raw_scores = self.base_model.predict(X) # raw output scores for LightGBM
        return self.scaler.predict_proba(raw_scores)

def generate_training_data(db, num_samples=10000, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    
    accounts = db.query(Account).limit(100).all()
    if not accounts:
        return pd.DataFrame(), []
    
    data = []
    start_date = datetime.datetime.now() - datetime.timedelta(days=60)
    
    for i in range(num_samples):
        tx_time = start_date + datetime.timedelta(minutes=i * 5)
        is_fraud = random.random() < 0.15
        amount = random.uniform(500, 20000) if not is_fraud else random.uniform(10000, 500000)
        velocity_5m = random.randint(1, 5) if not is_fraud else random.randint(5, 20)
        fan_out = random.randint(1, 3) if not is_fraud else random.randint(4, 15)
        acc_age = random.randint(100, 3650) if not is_fraud else random.randint(1, 30)
        
        data.append({
            "timestamp": tx_time,
            "amount": amount,
            "velocity_5m": velocity_5m,
            "fan_out": fan_out,
            "acc_age": acc_age,
            "label": 1 if is_fraud else 0
        })
        
    df = pd.DataFrame(data)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df

def train_and_save_model():
    print("Connecting to DB for entities...")
    db = SessionLocal()
    df = generate_training_data(db)
    db.close()
    
    n = len(df)
    train_idx = int(n * 0.6)
    val_idx = int(n * 0.8)
    
    train_df = df.iloc[:train_idx]
    val_df = df.iloc[train_idx:val_idx]
    
    features = ["amount", "velocity_5m", "fan_out", "acc_age"]
    X_train, y_train = train_df[features], train_df["label"]
    X_val, y_val = val_df[features], val_df["label"]
    
    print("Training LightGBM Classifier...")
    # Return raw scores (logits) instead of probabilities by using objective=binary but relying on raw margins if needed,
    # Actually lgb.LGBMRegressor can be used to output raw scores, but LGBMClassifier predict_proba is usually calibrated decently.
    # However, to explicitly fulfill the calibration requirement, we calibrate the raw log-odds.
    base_clf = lgb.LGBMRegressor(n_estimators=100, random_state=42)
    base_clf.fit(X_train, y_train)
    
    print("Calibrating Classifier using Platt Scaling on Validation Set...")
    val_scores = base_clf.predict(X_val)
    scaler = PlattScaler()
    scaler.fit(val_scores, y_val.values)
    
    calibrated_clf = CalibratedModel(base_clf, scaler)
    
    model_dir = "app/ml/models"
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "calibrated_baseline_v1.pkl")
    
    joblib.dump(calibrated_clf, model_path)
    print(f"Model saved to {model_path}")

if __name__ == '__main__':
    train_and_save_model()
