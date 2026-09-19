import uuid
import datetime
import asyncio
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.models.domain import NotificationLog, Incident

class WebhookAdapter:
    async def send(self, incident, db: Session):
        print(f"[WEBHOOK] Sending alert to CFCFRMS API for incident {incident.id}")
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role="API",
            channel="WEBHOOK",
            message=f"JSON Payload: {{'incident_id': '{incident.id}', 'risk': '{incident.risk_level}'}}",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class EmailSimulationAdapter:
    async def send(self, incident, role: str, db: Session):
        print(f"[EMAIL] Simulating email alert to {role} mailing list for incident {incident.id}")
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role=role,
            channel="EMAIL",
            message=f"URGENT: High Risk Incident {incident.id} Detected.",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class SMSSimulationAdapter:
    async def send(self, incident, role: str, db: Session):
        print(f"[SMS] Simulating SMS alert to duty officers ({role}) for {incident.id}")
        log = NotificationLog(
            id=f"NOTIF_{uuid.uuid4().hex[:8]}",
            incident_id=incident.id,
            recipient_role=role,
            channel="SMS",
            message=f"CyberCash Sentinel Alert: {incident.id}",
            delivery_status="SENT"
        )
        db.add(log)
        return True

class NotificationRouter:
    def __init__(self):
        self.webhook = WebhookAdapter()
        self.email = EmailSimulationAdapter()
        self.sms = SMSSimulationAdapter()

    async def route_incident(self, incident_id: str):
        db = SessionLocal()
        try:
            inc = db.query(Incident).filter(Incident.id == incident_id).first()
            if not inc: return

            await self.webhook.send(inc, db)
            
            roles = ["I4C", "LEA"]
            if inc.risk_level == "HIGH":
                for r in roles:
                    await self.email.send(inc, r, db)
                    await self.sms.send(inc, r, db)
            
            db.commit()
        except Exception as e:
            print("Notification router failed:", e)
        finally:
            db.close()

notification_router = NotificationRouter()
