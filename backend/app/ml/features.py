from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.domain import Transaction, Account, Withdrawal
import datetime

def calculate_point_in_time_features(db: Session, account_id: str, simulation_time: datetime.datetime):
    # Strictly query events <= simulation_time
    
    # 1. Total transaction volume in last 24 hours
    start_24h = simulation_time - datetime.timedelta(hours=24)
    txs_24h = db.query(Transaction).filter(
        Transaction.destination_account == account_id,
        Transaction.timestamp <= simulation_time,
        Transaction.timestamp >= start_24h
    ).all()
    
    amount_24h = sum(tx.amount for tx in txs_24h)
    
    # 2. Velocity in last 5 minutes
    start_5m = simulation_time - datetime.timedelta(minutes=5)
    txs_5m = [tx for tx in txs_24h if tx.timestamp >= start_5m]
    velocity_5m = len(txs_5m)
    amount_5m = sum(tx.amount for tx in txs_5m)
    
    # 3. Fan-out (unique destination accounts from this account)
    # To see if this account is acting as a mule distributor
    out_txs = db.query(Transaction.destination_account).filter(
        Transaction.source_account == account_id,
        Transaction.timestamp <= simulation_time,
        Transaction.timestamp >= start_24h
    ).distinct().all()
    fan_out = len(out_txs)
    
    # 4. Account Age
    account = db.query(Account).filter(Account.id == account_id).first()
    acc_age = account.account_age_days if account else 365
    
    # 5. Network Degree (In-degree)
    in_txs = db.query(Transaction.source_account).filter(
        Transaction.destination_account == account_id,
        Transaction.timestamp <= simulation_time,
        Transaction.timestamp >= start_24h
    ).distinct().all()
    fan_in = len(in_txs)

    return {
        "amount_5m": amount_5m,
        "amount_24h": amount_24h,
        "velocity_5m": velocity_5m,
        "fan_in": fan_in,
        "fan_out": fan_out,
        "acc_age": acc_age
    }
