from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from app.db.database import Base
import datetime

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
    
class Device(Base):
    __tablename__ = "devices"
    id = Column(String, primary_key=True, index=True)
    device_type = Column(String)
    associated_account_ids = Column(JSON) # List of account IDs
    historical_usage = Column(Integer)

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

