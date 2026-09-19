import math
from sqlalchemy.orm import Session
from app.models.domain import Incident, Prediction, Withdrawal, Terminal

def compute_precision_at_k(predicted_terminals: list, actual_terminal_id: str, k: int = 5) -> dict:
    """Check if actual terminal is in top-K predicted terminals."""
    if not predicted_terminals or not actual_terminal_id:
        return {"hit": False, "rank": None, "k": k}
    top_k_ids = [t["terminal_id"] for t in predicted_terminals[:k]]
    if actual_terminal_id in top_k_ids:
        rank = top_k_ids.index(actual_terminal_id) + 1
        return {"hit": True, "rank": rank, "k": k}
    return {"hit": False, "rank": None, "k": k}

def compute_lead_time(prediction_time, actual_cashout_time) -> float:
    """Minutes of advance warning."""
    if not prediction_time or not actual_cashout_time:
        return 0.0
    delta = (actual_cashout_time - prediction_time).total_seconds() / 60.0
    return max(0.0, delta)

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

def compute_geographic_error(predicted_terminal_id: str, actual_terminal_id: str, db: Session) -> float:
    """Haversine distance in km between predicted and actual terminal."""
    if not predicted_terminal_id or not actual_terminal_id:
        return -1.0
    pred_t = db.query(Terminal).filter(Terminal.id == predicted_terminal_id).first()
    act_t = db.query(Terminal).filter(Terminal.id == actual_terminal_id).first()
    if not pred_t or not act_t:
        return -1.0
    return haversine(pred_t.latitude, pred_t.longitude, act_t.latitude, act_t.longitude)

def compute_incident_evaluation(db: Session, incident_id: str) -> dict:
    """Compute all evaluation metrics for a resolved incident."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        return {"error": "Incident not found"}
    
    predictions = db.query(Prediction).filter(Prediction.incident_id == incident_id).order_by(Prediction.timestamp.asc()).all()
    if not predictions:
        return {"error": "No predictions"}
    
    latest_pred = predictions[-1]
    first_pred = predictions[0]
    
    actual_terminal = incident.ground_truth_terminal
    actual_time = incident.ground_truth_time
    
    top_k = latest_pred.top_k_terminals or []
    
    p_at_1 = compute_precision_at_k(top_k, actual_terminal, 1)
    p_at_5 = compute_precision_at_k(top_k, actual_terminal, 5)
    lead = compute_lead_time(first_pred.timestamp, actual_time)
    
    geo_error = -1.0
    if top_k and actual_terminal:
        geo_error = compute_geographic_error(top_k[0]["terminal_id"], actual_terminal, db)
    
    return {
        "incident_id": incident_id,
        "status": incident.status,
        "precision_at_1": p_at_1,
        "precision_at_5": p_at_5,
        "lead_time_minutes": lead,
        "geographic_error_km": geo_error,
        "cashout_probability": latest_pred.cashout_probability,
        "num_predictions": len(predictions),
        "actual_terminal": actual_terminal,
        "actual_time": str(actual_time) if actual_time else None,
        "predicted_terminals": [t["terminal_id"] for t in top_k[:5]]
    }

def compute_aggregate_metrics(db: Session) -> dict:
    """Compute system-wide evaluation metrics from all resolved incidents."""
    resolved = db.query(Incident).filter(Incident.status == "RESOLVED", Incident.ground_truth_terminal != None).all()
    if not resolved:
        return {"total_evaluated": 0, "precision_at_5": 0, "avg_lead_time": 0, "avg_geo_error": 0}
    
    hits = 0
    total_lead = 0.0
    total_geo = 0.0
    geo_count = 0
    
    for inc in resolved:
        ev = compute_incident_evaluation(db, inc.id)
        if ev.get("precision_at_5", {}).get("hit"):
            hits += 1
        total_lead += ev.get("lead_time_minutes", 0)
        ge = ev.get("geographic_error_km", -1)
        if ge >= 0:
            total_geo += ge
            geo_count += 1
    
    n = len(resolved)
    return {
        "total_evaluated": n,
        "precision_at_5": hits / n if n > 0 else 0,
        "avg_lead_time": total_lead / n if n > 0 else 0,
        "avg_geo_error": total_geo / geo_count if geo_count > 0 else 0
    }
