import datetime
import pandas as pd
import numpy as np
import joblib
import os
import random
import lightgbm as lgb
from app.db.database import SessionLocal
from app.models.domain import Account, Withdrawal, Transaction
from app.ml.features import calculate_point_in_time_features
from app.ml.calibration import PlattScaler, CalibratedModel

def build_dataset(db):
    print("Extracting actual temporal events from DB...")
    txs = db.query(Transaction).order_by(Transaction.timestamp.asc()).all()
    withdrawals = db.query(Withdrawal).all()
    
    wd_map = {}
    for w in withdrawals:
        if w.account_id not in wd_map:
            wd_map[w.account_id] = []
        wd_map[w.account_id].append(w.timestamp)
        
    data = []
    sampled_txs = random.sample(txs, min(2000, len(txs))) if txs else []
    
    count = 0
    for tx in sampled_txs:
        count += 1
        if count % 200 == 0:
            print(f"Processed {count}/{len(sampled_txs)} samples...")
            
        T = tx.timestamp
        acc_id = tx.destination_account
        
        label = 0
        if acc_id in wd_map:
            for wd_time in wd_map[acc_id]:
                delta = (wd_time - T).total_seconds() / 60.0
                if 0 <= delta <= 30:
                    label = 1
                    break
                    
        feats = calculate_point_in_time_features(db, acc_id, T)
        feats["timestamp"] = T
        feats["label"] = label
        data.append(feats)
        
    df = pd.DataFrame(data)
    if not df.empty:
        df = df.sort_values("timestamp").reset_index(drop=True)
    return df

def train_and_save_model():
    db = SessionLocal()
    df = build_dataset(db)
    db.close()
    
    if df.empty or df['label'].sum() == 0:
        print("No valid training data.")
        return
        
    print(f"Dataset built. Total samples: {len(df)}, Positives: {df['label'].sum()}")
    
    n = len(df)
    train_idx = int(n * 0.6)
    val_idx = int(n * 0.8)
    
    train_df = df.iloc[:train_idx]
    val_df = df.iloc[train_idx:val_idx]
    
    feature_cols = ["amount_5m", "amount_24h", "velocity_5m", "fan_in", "fan_out", "acc_age"]
    X_train, y_train = train_df[feature_cols], train_df["label"]
    X_val, y_val = val_df[feature_cols], val_df["label"]
    
    base_clf = lgb.LGBMRegressor(n_estimators=100, random_state=42)
    base_clf.fit(X_train, y_train)
    
    val_scores = base_clf.predict(X_val)
    scaler = PlattScaler()
    scaler.fit(val_scores, y_val.values)
    
    calibrated_clf = CalibratedModel(base_clf, scaler)
    
    model_dir = "app/ml/models"
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(calibrated_clf, os.path.join(model_dir, "calibrated_baseline_v1.pkl"))
    print("Model training and calibration complete.")

if __name__ == '__main__':
    train_and_save_model()
