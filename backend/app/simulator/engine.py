import asyncio
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import Transaction, Account, Incident, Prediction
from app.ml.predictor import calculate_current_features, predict_cashout, rank_candidate_terminals

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
        if len(accounts) < 2:
            return None
        src = random.choice(accounts)
        dst = random.choice(accounts)
        amount = random.uniform(100, 10000)
        
        tx = Transaction(
            id=f"TX{random.randint(100000,999999)}",
            timestamp=self.simulation_time,
            source_account=src.id,
            destination_account=dst.id,
            amount=amount,
            transaction_type="TRANSFER",
            bank_id=src.bank_id,
            risk_signal="LOW"
        )
        db.add(tx)
        db.commit()
        return {
            "id": tx.id,
            "timestamp": tx.timestamp.isoformat(),
            "source": tx.source_account,
            "destination": tx.destination_account,
            "amount": tx.amount,
            "risk": tx.risk_signal
        }

    async def trigger_fraud_cascade(self):
        # Create a deterministic fraud cascade
        db = SessionLocal()
        accounts = db.query(Account).limit(10).all()
        if len(accounts) < 5: return
        
        victim = accounts[0]
        mules = accounts[1:5]
        
        # Victim to Mule 1
        tx1 = Transaction(
            id=f"TXF_{random.randint(1000,9999)}", timestamp=self.simulation_time,
            source_account=victim.id, destination_account=mules[0].id,
            amount=480000, transaction_type="TRANSFER", bank_id=victim.bank_id, risk_signal="HIGH"
        )
        db.add(tx1)
        
        # Mule 1 fan-out
        for m in mules[1:]:
            tx = Transaction(
                id=f"TXF_{random.randint(1000,9999)}", timestamp=self.simulation_time,
                source_account=mules[0].id, destination_account=m.id,
                amount=480000 / 3, transaction_type="TRANSFER", bank_id=mules[0].bank_id, risk_signal="HIGH"
            )
            db.add(tx)
        
        # Create incident
        inc = Incident(
            id=f"INC_{random.randint(1000,9999)}", incident_type="MULE_CASCADE",
            creation_time=self.simulation_time, trigger_source="SYSTEM",
            amount_at_risk=480000, risk_level="HIGH", status="NEW"
        )
        db.add(inc)
        db.commit()
        
        # Run ML Predictor
        features = calculate_current_features(db, mules[0].id, self.simulation_time)
        prob = predict_cashout(features)
        terminals = rank_candidate_terminals(db, mules[0].id, prob)
        
        pred = Prediction(
            id=f"PRD_{random.randint(1000,9999)}", incident_id=inc.id,
            timestamp=self.simulation_time, cashout_probability=prob,
            estimated_time_window_start=self.simulation_time + datetime.timedelta(minutes=5),
            estimated_time_window_end=self.simulation_time + datetime.timedelta(minutes=30),
            predicted_region_h3="89283082803ffff", top_k_terminals=terminals,
            confidence=0.85, explanations=[{"reason": "Rapid fan-out from new mule", "weight": 0.9}],
            recommended_action="Enhanced monitoring"
        )
        db.add(pred)
        db.commit()
        
        await self._broadcast({"type": "ALERT", "data": {"incident_id": inc.id}})
        db.close()

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception as e:
                pass

engine = SimulationEngine()
