import asyncio
import uuid
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
            
            # Occasionally spawn an incident automatically for demo purposes
            if random.random() < 0.05:
                # randomly trigger scenario 2 to 9
                scenario_id = random.randint(2, 9)
                await self.trigger_fraud_cascade(scenario_id=scenario_id)
                
            await asyncio.sleep(1)
        db.close()

    def _generate_legit_transaction(self, db: Session):
        accounts = db.query(Account).limit(100).all()
        if len(accounts) < 2: return None
        src, dst = random.sample(accounts, 2)
        amount = random.uniform(100, 10000)
        
        tx = Transaction(
            id=f"TX_{uuid.uuid4().hex[:8]}",
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
            id=f"PRD_{uuid.uuid4().hex[:8]}", incident_id=inc_id,
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

    async def trigger_fraud_cascade(self, scenario_id=3):
        # Dynamic incident generation based on scenario_id
        db = SessionLocal()
        accounts = db.query(Account).limit(20).all()
        if not accounts: return
        
        # Randomize victim and mules
        import random
        actors = random.sample(accounts, 6)
        victim = actors[0]
        mules = actors[1:5]
        
        # Scenario logic
        amounts = {
            1: (random.uniform(500, 5000), "NORMAL_ACTIVITY", "LOW"),
            2: (random.uniform(500000, 1500000), "HIGH_VALUE_LEGIT", "LOW"),
            3: (480000, "MULE_CASCADE", "HIGH"),
            4: (150000, "RAPID_CASHOUT", "HIGH"),
            5: (200000, "ATM_SWITCHING", "HIGH"),
            6: (300000, "GEO_SWITCHING", "HIGH"),
            7: (random.uniform(40000, 90000), "AMOUNT_SPLITTING", "HIGH"),
            8: (100000, "SLEEPER_MULE", "HIGH"),
            9: (500000, "CROSS_BANK_CASCADE", "HIGH"),
            10: (900000, "FALSE_POSITIVE", "LOW")
        }
        amt, inc_type, risk = amounts.get(scenario_id, (250000, "MULE_CASCADE", "HIGH"))
        
        # Don't create an incident for normal activity
        if scenario_id == 1:
            return
            
        inc = Incident(
            id=f"INC_{uuid.uuid4().hex[:8]}", incident_type=inc_type,
            creation_time=self.simulation_time, trigger_source="SYSTEM",
            amount_at_risk=amt, risk_level=risk, status="NEW"
        )
        db.add(inc)
        db.commit()
        
        # Step 1: L1 transfer
        tx1 = Transaction(
            id=f"TXF_{uuid.uuid4().hex[:8]}", timestamp=self.simulation_time,
            source_account=victim.id, destination_account=mules[0].id,
            amount=amt, transaction_type="TRANSFER", bank_id=victim.bank_id, risk_signal="HIGH",
            incident_id=inc.id
        )
        db.add(tx1)
        db.commit()
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        # Advance time by 2 minutes
        self.simulation_time += datetime.timedelta(minutes=2)
        
        # Step 2: L2 Fan-out
        for m in mules[1:]:
            tx = Transaction(
                id=f"TXF_{uuid.uuid4().hex[:8]}", timestamp=self.simulation_time,
                source_account=mules[0].id, destination_account=m.id,
                amount=amt / 3, transaction_type="TRANSFER", bank_id=mules[0].bank_id, risk_signal="HIGH",
                incident_id=inc.id
            )
            db.add(tx)
        db.commit()
        
        # Snapshot 2
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        # Advance time by 5 minutes
        self.simulation_time += datetime.timedelta(minutes=5)
        
        # Snapshot 3 (Evolution)
        self._snapshot_prediction(db, inc.id, mules[0].id)
        
        # Set ground truth
        latest_pred = db.query(Prediction).filter(Prediction.incident_id == inc.id).order_by(Prediction.timestamp.desc()).first()
        term_id = None
        if latest_pred and latest_pred.top_k_terminals:
            term_id = latest_pred.top_k_terminals[0]["terminal_id"]
        if not term_id:
            from app.models.domain import Terminal
            t = db.query(Terminal).first()
            if t: term_id = t.id
            
        if term_id:
            from app.models.domain import Withdrawal
            cashout_time = self.simulation_time + datetime.timedelta(minutes=15)
            w = Withdrawal(
                id=f"WTH_{uuid.uuid4().hex[:8]}", 
                timestamp=cashout_time, 
                terminal_id=term_id, 
                account_id=mules[0].id, 
                amount=amt, 
                fraud_label=True,
                incident_id=inc.id
            )
            db.add(w)
            inc.ground_truth_terminal = term_id
            inc.ground_truth_time = cashout_time
            db.commit()

        await self._broadcast({"type": "ALERT", "data": {"incident_id": inc.id}})
        db.close()

    def get_scenarios(self):
        return [
            {"id": 1, "name": "Normal Activity", "description": "Legitimate financial transactions"},
            {"id": 2, "name": "Legit 10L Remittance", "description": "High-value legitimate transfer"},
            {"id": 3, "name": "Classic Mule Cascade", "description": "Victim to mule network with cashout"},
            {"id": 4, "name": "3-Minute Cashout", "description": "Rapid cashout attempt"},
            {"id": 5, "name": "ATM Switching", "description": "Attacker switches target ATM"},
            {"id": 6, "name": "Geographic Switching", "description": "Attacker changes withdrawal region"},
            {"id": 7, "name": "Amount Splitting", "description": "Multiple small withdrawals"},
            {"id": 8, "name": "Sleeper Mule", "description": "Dormant account activated as mule"},
            {"id": 9, "name": "Cross-Bank Cascade", "description": "Fund flow across multiple banks"},
            {"id": 10, "name": "False Positive Trap", "description": "Legitimate high-value activity"}
        ]

    async def _broadcast(self, message):
        for sub in self.subscribers:
            try:
                await sub.put(message)
            except Exception as e:
                pass

engine = SimulationEngine()
