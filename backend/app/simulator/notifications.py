import uuid
import datetime
import asyncio
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import NotificationLog, Incident, Transaction, Account

class WebhookAdapter:
    async def send(self, incident, db: Session):
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role="API",
            recipient_id="CFCFRMS_GATEWAY",
            channel="WEBHOOK",
            message=f'{{"incident_id": "{incident.id}", "risk": "{incident.risk_level}", "amount": {incident.amount_at_risk}, "action": "FLAG_TRANSACTION"}}',
            delivery_status="SENT"
        )
        db.add(log)
        return True

class EmailSimulationAdapter:
    async def send(self, incident, role: str, recipient_id: str, db: Session):
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role=role,
            recipient_id=recipient_id,
            channel="EMAIL",
            message=f"URGENT DISPATCH: High Risk Incident {incident.id} detected. Amount at risk: Rs.{incident.amount_at_risk:,.0f}. Immediate review required.",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class SMSSimulationAdapter:
    async def send(self, incident, role: str, recipient_id: str, db: Session):
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role=role,
            recipient_id=recipient_id,
            channel="SMS",
            message=f"CYBERCASH ALERT: {incident.id} | RISK: {incident.risk_level} | ACTION REQUIRED",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class DashboardNotificationAdapter:
    async def send(self, incident, role: str, db: Session):
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role=role,
            recipient_id=f"{role}_COMMAND_DESK",
            channel="WS_DASHBOARD",
            message=f"Active threat {incident.id} flagged with risk {incident.risk_level}.",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class NotificationRouter:
    def __init__(self):
        self.webhook = WebhookAdapter()
        self.email = EmailSimulationAdapter()
        self.sms = SMSSimulationAdapter()
        self.dashboard = DashboardNotificationAdapter()

    async def route_incident(self, incident_id: str):
        db = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc: return

            # Only send high-priority alert routes for HIGH risk incidents
            if inc.risk_level == "HIGH":
                # 1. External API Webhook
                await self.webhook.send(inc, db)
                
                # 2. I4C Global Command
                await self.email.send(inc, "I4C", "ops@i4c.gov.in", db)
                await self.sms.send(inc, "I4C", "+91-11-2345-0001", db)
                await self.dashboard.send(inc, "I4C", db)
                
                # 3. LEA Jurisdictional Unit
                await self.email.send(inc, "LEA", "cybercell.pune@mahapolice.gov.in", db)
                await self.sms.send(inc, "LEA", "+91-20-2612-3344", db)
                await self.dashboard.send(inc, "LEA", db)
                
                # 4. Bank/FI Security Desk
                # Identify banks involved in this incident
                txs = db.query(Transaction).filter(Transaction.incident_id == incident_id).all()
                banks = {tx.bank_id for tx in txs if tx.bank_id}
                for b_id in (banks or ["B0"]):
                    await self.email.send(inc, "BANK", f"fraud_desk@{b_id.lower()}.bank.in", db)
                    await self.sms.send(inc, "BANK", f"+91-BANK-{b_id}", db)
                    await self.dashboard.send(inc, "BANK", db)

            db.commit()
        except Exception as e:
            print("Notification router failed:", e)
        finally:
            db.close()

notification_router = NotificationRouter()
