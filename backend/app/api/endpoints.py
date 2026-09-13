from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.domain import Incident, Prediction, Transaction, Terminal, User
from app.simulator.engine import engine
from pydantic import BaseModel
import asyncio
import json

router = APIRouter()

class EventSchema(BaseModel):
    source_account: str
    destination_account: str
    amount: float
    device_id: str
    bank_id: str

@router.get("/terminals")
def get_terminals(db: Session = Depends(get_db)):
    return db.query(Terminal).limit(50).all()

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.creation_time.desc()).all()

@router.get("/predictions/{incident_id}")
def get_predictions(incident_id: str, db: Session = Depends(get_db)):
    return db.query(Prediction).filter(Prediction.incident_id == incident_id).order_by(Prediction.timestamp.desc()).all()

@router.post("/simulation/start")
async def start_sim():
    await engine.start()
    return {"status": "started", "time": engine.simulation_time}

@router.post("/simulation/pause")
def pause_sim():
    engine.pause()
    return {"status": "paused"}

@router.post("/simulation/speed")
def set_speed(speed: float):
    engine.set_speed(speed)
    return {"status": "speed updated", "speed": speed}

@router.post("/simulation/fraud")
async def trigger_fraud_cascade():
    await engine.trigger_fraud_cascade()
    return {"status": "fraud scenario triggered"}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue()
    engine.subscribers.append(queue)
    try:
        while True:
            msg = await queue.get()
            await websocket.send_json(msg)
    except WebSocketDisconnect:
        engine.subscribers.remove(queue)
