import asyncio
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import Transaction, Account, Incident, Prediction, Terminal
from app.ml.features import extract_features
from app.ml.model import predictor

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.simulation_time = datetime.datetime.now()
        self.speed = 1.0 # 1 real second = 1 sim second
        self.subscribers = []
        self.fraud_queue = [] # Queue for scheduled fraud transactions

    async def start(self):
        if not self.running:
            self.running = True
            asyncio.create_task(self._run_loop())

    def pause(self):
        self.running = False

    def schedule_fraud(self):
        print("Scheduling Fraud Cascade")
        db = SessionLocal()
        accounts = db.query(Account).limit(5).all()
        if len(accounts) < 5:
            db.close()
            return
        
        victim = accounts[0]
        mule1 = accounts[1]
        mule2 = accounts[2]
        
        # Schedule in the future
        t1 = self.simulation_time + datetime.timedelta(seconds=2)
        t2 = self.simulation_time + datetime.timedelta(seconds=5)
        
        self.fraud_queue.append((t1, victim.id, mule1.id, 95000))
        self.fraud_queue.append((t2, mule1.id, mule2.id, 90000))
        db.close()

    async def _run_loop(self):
        db = SessionLocal()
        while self.running:
            self.simulation_time += datetime.timedelta(seconds=1 * self.speed)
            
            # Process fraud queue
            to_remove = []
            for item in self.fraud_queue:
                t, src, dst, amount = item
                if self.simulation_time >= t:
                    event = self._process_tx(db, src, dst, amount, is_fraud=True)
                    if event:
                        await self._broadcast({"type": "EVENT", "data": event})
                        # Trigger Prediction
                        await self._trigger_prediction(db, dst, event["id"])
                    to_remove.append(item)
            for item in to_remove:
                self.fraud_queue.remove(item)

            # Legitimate traffic
            if random.random() < 0.2:
                event = self._generate_legit_transaction(db)
                if event:
                    await self._broadcast({"type": "EVENT", "data": event})
            
            await asyncio.sleep(1)
        db.close()
        
    async def _trigger_prediction(self, db, target_account_id, trigger_tx_id):
        features = extract_features(db, target_account_id, self.simulation_time)
        prob = predictor.predict(features)
        
        if prob > 0.5:
            # Create incident
            incident = Incident(
                id=f"INC{random.randint(100,999)}",
                incident_type="CASH_OUT_RISK",
                creation_time=self.simulation_time,
                trigger_source=trigger_tx_id,
                amount_at_risk=features.get("velocity_5m", 0),
                risk_level="HIGH"
            )
            db.add(incident)
            
            # Select dummy top k terminals
            terminals = db.query(Terminal).limit(3).all()
            top_k = [{"terminal_id": t.id, "prob": random.uniform(0.5, 0.9), "lat": t.latitude, "lng": t.longitude} for t in terminals]
            
            pred = Prediction(
                id=f"PRD{random.randint(100,999)}",
                incident_id=incident.id,
                timestamp=self.simulation_time,
                cashout_probability=prob,
                predicted_region_h3="dummy_h3",
                top_k_terminals=top_k,
                confidence=0.85
            )
            db.add(pred)
            db.commit()
            
            await self._broadcast({
                "type": "ALERT",
                "data": {
                    "incident_id": incident.id,
                    "probability": prob,
                    "target_account": target_account_id,
                    "top_k": top_k
                }
            })

    def _process_tx(self, db, src_id, dst_id, amount, is_fraud=False):
        tx = Transaction(
            id=f"TX{random.randint(100000,999999)}",
            timestamp=self.simulation_time,
            source_account=src_id,
            destination_account=dst_id,
            amount=amount,
            transaction_type="TRANSFER",
            bank_id="B0", # dummy
            risk_signal="HIGH" if is_fraud else "LOW"
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

    def _generate_legit_transaction(self, db: Session):
        accounts = db.query(Account).limit(100).all()
        if len(accounts) < 2:
            return None
        src = random.choice(accounts)
        dst = random.choice(accounts)
        amount = random.uniform(100, 5000)
        return self._process_tx(db, src.id, dst.id, amount, is_fraud=False)

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception as e:
                print(e)

engine = SimulationEngine()
