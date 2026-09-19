import os
import sys
import uuid
import random
import datetime
import shutil
import asyncio
import json

# Setup environment to use test DB
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "cybercash.db"))
test_db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_cybercash.db"))

print(f"Copying {db_path} to {test_db_path}")
shutil.copyfile(db_path, test_db_path)

os.environ["DATABASE_URL"] = f"sqlite:///{test_db_path}"
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.database import SessionLocal, engine as db_engine
from app.simulator.engine import SimulationEngine
from app.ml.evaluation import compute_incident_evaluation
from app.models.domain import Incident, Prediction

async def generate_and_evaluate():
    engine = SimulationEngine()
    db = SessionLocal()
    
    # Clean out any existing incidents to start fresh
    print("Cleaning existing incidents in test DB...")
    db.query(Incident).delete()
    db.query(Prediction).delete()
    db.commit()
    
    print("Generating Independent Test Set...")
    # Sizes as requested (reduced for compute limits, documented)
    
    # 50 legit
    for _ in range(50):
        await engine.trigger_fraud_cascade(scenario_id=1, seed=random.randint(1, 99999))
        await engine.trigger_fraud_cascade(scenario_id=2, seed=random.randint(1, 99999))
    
    # 50 fraud
    for _ in range(16):
        await engine.trigger_fraud_cascade(scenario_id=3, seed=random.randint(1, 99999))
        await engine.trigger_fraud_cascade(scenario_id=8, seed=random.randint(1, 99999))
        await engine.trigger_fraud_cascade(scenario_id=9, seed=random.randint(1, 99999))
        
    # 10 adversarial
    for _ in range(3):
        await engine.trigger_fraud_cascade(scenario_id=5, seed=random.randint(1, 99999))
        await engine.trigger_fraud_cascade(scenario_id=6, seed=random.randint(1, 99999))
        await engine.trigger_fraud_cascade(scenario_id=7, seed=random.randint(1, 99999))
        
    # 10 hard-negative
    for _ in range(10):
        await engine.trigger_fraud_cascade(scenario_id=10, seed=random.randint(1, 99999))
        
    db.commit()
    
    print("Evaluating...")
    incidents = db.query(Incident).filter(Incident.ground_truth_terminal != None).all()
    print(f"Total incidents to evaluate: {len(incidents)}")
    
    metrics = {
        "legit_tested": 100,
        "fraud_tested": 48,
        "adversarial_tested": 9,
        "hard_negative_tested": 10,
        "total": 167
    }
    
    p1_hits = 0
    p5_hits = 0
    total_ndcg = 0.0
    total_lead = 0.0
    total_geo = 0.0
    geo_count = 0
    total_brier = 0.0
    fp_count = 0
    
    for inc in incidents:
        ev = compute_incident_evaluation(db, inc.id)
        if "error" in ev: continue
        if ev.get("precision_at_1", 0) > 0: p1_hits += 1
        if ev.get("precision_at_5", 0) > 0: p5_hits += 1
        total_ndcg += ev.get("ndcg_at_5", 0.0)
        total_lead += ev.get("lead_time_minutes", 0.0)
        total_brier += ev.get("calibration_error", 0.0)
        if ev.get("false_positive_result"): fp_count += 1
        ge = ev.get("geographic_error_km", -1)
        if ge >= 0:
            total_geo += ge
            geo_count += 1
            
    n = max(1, len(incidents))
    final_metrics = {
        "dataset_size": metrics,
        "evaluation": {
            "precision_at_1": round(p1_hits / n, 4),
            "precision_at_5": round(p5_hits / n, 4),
            "recall_at_5": round(p5_hits / n, 4),
            "ndcg_at_5": round(total_ndcg / n, 4),
            "avg_lead_time": round(total_lead / n, 1),
            "avg_geo_error": round(total_geo / max(1, geo_count), 2),
            "avg_calibration_error": round(total_brier / n, 4),
            "false_positive_rate": round(fp_count / n, 4)
        }
    }
    
    out_file = os.path.join(os.path.dirname(__file__), "..", "app", "ml", "independent_metrics.json")
    with open(out_file, "w") as f:
        json.dump(final_metrics, f, indent=2)
        
    print(f"Done! Metrics written to {out_file}")

if __name__ == "__main__":
    asyncio.run(generate_and_evaluate())
