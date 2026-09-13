from app.models.domain import Transaction, Account, Device, Terminal
from sqlalchemy.orm import Session
import datetime

def extract_features(db: Session, account_id: str, current_time: datetime.datetime):
    five_mins_ago = current_time - datetime.timedelta(minutes=5)
    recent_txs = db.query(Transaction).filter(
        Transaction.source_account == account_id,
        Transaction.timestamp >= five_mins_ago
    ).all()
    
    velocity = sum([t.amount for t in recent_txs])
    count_5m = len(recent_txs)
    
    account = db.query(Account).filter(Account.id == account_id).first()
    acc_age = account.account_age_days if account else 0
    
    return {
        "velocity_5m": velocity,
        "count_5m": count_5m,
        "account_age": acc_age,
    }
