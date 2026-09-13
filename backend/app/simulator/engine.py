import asyncio
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import Transaction, Account, Incident, Prediction
from app.ml.predictor import predict_cashout, rank_candidate_terminals

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.simulation_time = datetime.datetime.now()
        self.speed = 1.0
        self.subscribers = []

    async def start(self):
        self.running = True
        asyncio.create_task(self._run_loop())

    def pause(self):
        self.running = False
        
    def set_speed(self, speed):
        self.speed = speed

    async def _run_loop(self):
        db = SessionLocal()
        while self.running:
            self.simulation_time += datetime.timedelta(seconds=1 * self.speed)
            if random.random() < 0.2:
                event = self._generate_legit_transaction(db)
                if event:
                    await self._broadcast({"type": "EVENT", "data": event})
            await asyncio.sleep(1)
        db.close()

    def _generate_legit_transaction(self, db: Session):
        accounts = db.query(Account).limit(100).all()
        if len(accounts) < 2: return None
        src, dst = random.sample(accounts, 2)
        amount = random.uniform(100, 10000)
        
        tx = Transaction(
            id=f"TX{random.randint(100000,999999)}",
            timestamp=self.simulation_time, source_account=src.id, destination_account=dst.id,
            amount=amount, transaction_type="TRANSFER", bank_id=src.bank_id, risk_signal="LOW"
        )
        db.add(tx)
        db.commit()
        return {"id": tx.id, "timestamp": tx.timestamp.isoformat(), "source": tx.source_account, "destination": tx.destination_account, "amount": tx.amount, "risk": tx.risk_signal}

    def _snapshot_prediction(self, db: Session, inc_id: str, account_id: str):
        prob, features = predict_cashout(db, account_id, self.simulation_time)
        loc_conf, terminals, max_travel_time = rank_candidate_terminals(db, account_id, self.simulation_time)
        radius_km = (max_travel_time / 60.0) * 30.0 if max_travel_time > 0 else 10.0
        
        pred = Prediction(
            id=f"PRD_{random.randint(10000,99999)}", incident_id=inc_id,
            timestamp=self.simulation_time, cashout_probability=prob,
            estimated_time_window_start=self.simulation_time + datetime.timedelta(minutes=5),
            estimated_time_window_end=self.simulation_time + datetime.timedelta(minutes=30),
            predicted_region_h3=str(radius_km), 
            top_k_terminals=terminals if loc_conf != "LOW" else [],
            confidence=0.85 if loc_conf != "LOW" else 0.4,
            explanations=[
                {"reason": f"Calibrated P(Cashout|T)={prob:.2f}. Actual Velocity={features['velocity_5m']}.", "weight": 0.9},
                {"reason": f"Location Confidence: {loc_conf}. Features strict point-in-time.", "weight": 1.0}
            ],
            recommended_action="Enhanced monitoring" if loc_conf == "LOW" else "Escalate to LEA patrol",
            model_version="V1.0 Calibrated"
        )
        db.add(pred)
        db.commit()

    async def trigger_fraud_cascade(self, seed=42):
        random.seed(seed)
        db = SessionLocal()
        accounts = db.query(Account).limit(10).all()
        victim = accounts[0]
        mules = accounts[1:5]
        
        inc = Incident(
            id=f"INC_{random.randint(1000,9999)}", incident_type="MULE_CASCADE",
            creation_time=self.simulation_time, trigger_source="SYSTEM",
            amount_at_risk=480000, risk_level="HIGH", status="NEW"
        )
        db.add(inc)
        db.commit()
        
        # Step 1: L1 transfer
        tx1 = Transaction(
            id=f"TXF_{random.randint(1000,9999)}", timestamp=self.simulation_time,
            source_account=victim.id, destination_account=mules[0].id,
            amount=480000, transaction_type="TRANSFER", bank_id=victim.bank_id, risk_signal="HIGH"
        )
        db.add(tx1)
        db.commit()
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        # Advance time by 2 minutes
        self.simulation_time += datetime.timedelta(minutes=2)
        
        # Step 2: L2 Fan-out
        for m in mules[1:]:
            tx = Transaction(
                id=f"TXF_{random.randint(1000,9999)}", timestamp=self.simulation_time,
                source_account=mules[0].id, destination_account=m.id,
                amount=480000 / 3, transaction_type="TRANSFER", bank_id=mules[0].bank_id, risk_signal="HIGH"
            )
            db.add(tx)
        db.commit()
        
        # Snapshot 2
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        # Advance time by 5 minutes
        self.simulation_time += datetime.timedelta(minutes=5)
        
        # Snapshot 3 (Evolution)
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        await self._broadcast({"type": "ALERT", "data": {"incident_id": inc.id}})
        db.close()

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception as e:
                pass

engine = SimulationEngine()
