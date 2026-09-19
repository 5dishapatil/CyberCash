from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String) # BANK, LEA, I4C, SUPERVISOR, JUDGE
    bank_id = Column(String, ForeignKey("banks.id"), nullable=True) # Only for BANK role
    full_name = Column(String)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, ForeignKey("users.id"))
    action = Column(String)
    details = Column(String)
    hash_chain = Column(String, nullable=True)

class Bank(Base):
    __tablename__ = "banks"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)

class Account(Base):
    __tablename__ = "accounts"
    id = Column(String, primary_key=True, index=True)
    bank_id = Column(String, ForeignKey("banks.id"))
    account_age_days = Column(Integer)
    risk_profile = Column(String)
    location_region = Column(String)
    historical_transaction_volume = Column(Float)
    status = Column(String, default="ACTIVE")
    
class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True, index=True)
    device_type = Column(String)
    associated_account_ids = Column(JSON) # List of account IDs
    historical_usage = Column(Integer)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

class Terminal(Base):
    __tablename__ = "terminals"
    id = Column(String, primary_key=True, index=True)
    bank_id = Column(String, ForeignKey("banks.id"))
    terminal_type = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    h3_cell = Column(String, index=True)
    synthetic_neighborhood = Column(String)
    historical_usage = Column(Integer)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    source_account = Column(String, ForeignKey("accounts.id"))
    destination_account = Column(String, ForeignKey("accounts.id"))
    amount = Column(Float)
    transaction_type = Column(String)
    device_id = Column(String, ForeignKey("devices.id"))
    bank_id = Column(String, ForeignKey("banks.id"))
    risk_signal = Column(String)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)

class Withdrawal(Base):
    __tablename__ = "withdrawals"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    account_id = Column(String, ForeignKey("accounts.id"))
    terminal_id = Column(String, ForeignKey("terminals.id"))
    amount = Column(Float)
    fraud_label = Column(Boolean)
    incident_id = Column(String, ForeignKey("incidents.id"), nullable=True)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(String, primary_key=True, index=True)
    incident_type = Column(String)
    creation_time = Column(DateTime, index=True)
    trigger_source = Column(String)
    amount_at_risk = Column(Float)
    ground_truth_terminal = Column(String, nullable=True)
    ground_truth_time = Column(DateTime, nullable=True)
    prediction_status = Column(String)
    risk_level = Column(String, default="LOW")
    status = Column(String, default="NEW") # NEW, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, RESOLVED
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    active = Column(Boolean, default=True)

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(String, primary_key=True, index=True)
    incident_id = Column(String, ForeignKey("incidents.id"))
    timestamp = Column(DateTime, index=True)
    cashout_probability = Column(Float)
    estimated_time_window_start = Column(DateTime)
    estimated_time_window_end = Column(DateTime)
    predicted_region_h3 = Column(String)
    top_k_terminals = Column(JSON) # [{"terminal_id": "...", "prob": 0.8}]
    confidence = Column(Float)
    explanations = Column(JSON)
    recommended_action = Column(String)
    model_version = Column(String, default="V1.0 Baseline")
    raw_score = Column(Float, nullable=True)
    feature_snapshot = Column(JSON, nullable=True)



class NotificationLog(Base):
    __tablename__ = "notification_logs"
    id = Column(String, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    incident_id = Column(String, ForeignKey("incidents.id"))
    recipient_role = Column(String)
    recipient_id = Column(String, nullable=True) # e.g. bank_id or jurisdiction
    channel = Column(String) # WEBHOOK, EMAIL, SMS, WS
    message = Column(String)
    delivery_status = Column(String) # SENT, FAILED, PENDING


from sqlalchemy import event
import hashlib

def calculate_audit_hash(mapper, connection, target):
    if not target.timestamp:
        import datetime
        target.timestamp = datetime.datetime.utcnow()
    # Very simplistic for prototype: we just query max id
    # In a real system you'd lock the table or use the prev row precisely
    prev_hash = "GENESIS_BLOCK_00000000"
    try:
        # this is hacky for a listener, but good enough for the SIH prototype demo
        res = connection.execute("SELECT hash_chain FROM audit_logs ORDER BY id DESC LIMIT 1").fetchone()
        if res and res[0]:
            prev_hash = res[0]
    except Exception:
        pass
    
    payload = f"{prev_hash}|{target.action}|{target.user_id}|{target.details}|{target.timestamp}"
    target.hash_chain = hashlib.sha256(payload.encode()).hexdigest()

event.listen(AuditLog, 'before_insert', calculate_audit_hash)
