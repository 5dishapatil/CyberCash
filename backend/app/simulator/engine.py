import asyncio
import random
import datetime
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import Transaction, Account, Incident, Prediction

class SimulationEngine:
    def __init__(self):
        self.running = False
        self.simulation_time = datetime.datetime.now()
        self.speed = 1.0 # 1 real second = 1 sim second
        self.subscribers = []

    async def start(self):
        self.running = True
        asyncio.create_task(self._run_loop())

    def pause(self):
        self.running = False

    async def _run_loop(self):
        db = SessionLocal()
        while self.running:
            # Advance simulation time
            self.simulation_time += datetime.timedelta(seconds=1 * self.speed)
            
            # Decide if we generate a legitimate transaction or fraud
            if random.random() < 0.2: # 20% chance per tick to generate something
                event = self._generate_legit_transaction(db)
                if event:
                    await self._broadcast({"type": "EVENT", "data": event})
            
            await asyncio.sleep(1) # tick every real second
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

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception as e:
                print(e)

engine = SimulationEngine()
