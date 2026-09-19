import os
import sys
import uuid
import random
import datetime
import shutil
import asyncio
import json
import math
import hashlib

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
from app.models.domain import Incident, Prediction, Terminal, Transaction

EVAL_SEED = 42

def compute_percentile(arr, p):
    if not arr: return 0.0
    arr.sort()
    k = (len(arr) - 1) * p
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return arr[int(k)]
    d0 = arr[int(f)] * (c - k)
    d1 = arr[int(c)] * (k - f)
    return d0 + d1

def bootstrap_ci(data_list, metric_func, rng, n_iterations=1000):
    if not data_list: return [0.0, 0.0]
    n = len(data_list)
    values = []
    for _ in range(n_iterations):
        sample = rng.choices(data_list, k=n)
        values.append(metric_func(sample))
    values.sort()
    return [values[int(0.025 * n_iterations)], values[int(0.975 * n_iterations)]]

async def run_evaluation(seed_offset=0):
    rng = random.Random(EVAL_SEED + seed_offset)
    
    engine = SimulationEngine()
    engine.simulation_time = datetime.datetime(2026, 7, 1, 10, 0, 0)
    db = SessionLocal()
    
    db.query(Incident).delete()
    db.query(Prediction).delete()
    db.query(Transaction).filter(Transaction.timestamp >= datetime.datetime(2026, 7, 1, 0, 0, 0)).delete(synchronize_session=False)
    db.commit()
    
    # Generate scenarios
    scenarios = []
    for _ in range(30): scenarios.append((1, "legit", "legitimate remittance"))
    for _ in range(30): scenarios.append((2, "legit", "legitimate remittance"))
    for _ in range(12): scenarios.append((3, "fraud", "classic fraud"))
    for _ in range(12): scenarios.append((8, "fraud", "sleeper mule"))
    for _ in range(12): scenarios.append((9, "fraud", "cross-bank"))
    for _ in range(10): scenarios.append((5, "adv", "ATM switching"))
    for _ in range(10): scenarios.append((6, "adv", "geographic switching"))
    for _ in range(10): scenarios.append((7, "adv", "amount splitting"))
    for _ in range(12): scenarios.append((10, "hard_neg", "hard negatives"))
    
    rng.shuffle(scenarios)
    
    for sid, stype, sname in scenarios:
        s_seed = rng.randint(1, 999999)
        await engine.trigger_fraud_cascade(scenario_id=sid, seed=s_seed, clear_db=False)
    
    incidents = db.query(Incident).filter(Incident.ground_truth_terminal != None).order_by(Incident.id.asc()).all()
    all_terminals = [t.id for t in db.query(Terminal).order_by(Terminal.id.asc()).all()]
    
    results = []
    
    for inc in incidents:
        ev = compute_incident_evaluation(db, inc.id)
        if "error" in ev: continue
        # Find which scenario type this was based on risk and incident type
        cat = "legitimate remittance"
        if inc.incident_type == "MULE_CASCADE": cat = "classic fraud"
        elif inc.incident_type == "SLEEPER_MULE": cat = "sleeper mule"
        elif inc.incident_type == "CROSS_BANK_CASCADE": cat = "cross-bank"
        elif inc.incident_type == "ATM_SWITCHING": cat = "ATM switching"
        elif inc.incident_type == "GEO_SWITCHING": cat = "geographic switching"
        elif inc.incident_type == "AMOUNT_SPLITTING": cat = "amount splitting"
        elif inc.incident_type == "FALSE_POSITIVE": cat = "hard negatives"
        
        ev["category"] = cat
        ev["actual_fraud"] = (cat not in ["legitimate remittance", "hard negatives"])
        
        # Calculate baseline accuracy
        predictions = db.query(Prediction).filter(Prediction.incident_id == inc.id).order_by(Prediction.timestamp.asc()).all()
        baseline_brier = 0.25 # baseline probability 0.5
        
        baseline_p1 = 0.0
        baseline_p5 = 0.0
        baseline_r5 = 0.0
        
        if inc.ground_truth_terminal and len(all_terminals) >= 5:
            # Deterministic baseline: top 5 terminals by ID
            baseline_top5 = all_terminals[:5]
            if inc.ground_truth_terminal == baseline_top5[0]:
                baseline_p1 = 1.0
            if inc.ground_truth_terminal in baseline_top5:
                baseline_p5 = 1.0
                baseline_r5 = 1.0
            
        ev["baseline_brier"] = baseline_brier
        ev["baseline_p1"] = baseline_p1
        ev["baseline_p5"] = baseline_p5
        ev["baseline_r5"] = baseline_r5
        ev["is_abstained"] = predictions[-1].top_k_terminals == [] if predictions else False
        
        # Strip incident_id to make output inherently deterministic on contents alone
        ev.pop("incident_id", None)
        ev.pop("actual_time", None)
        ev.pop("actual_terminal", None)
        ev.pop("predicted_terminals", None)
        
        results.append(ev)

    # Deterministic sort
    results.sort(key=lambda x: json.dumps(x, sort_keys=True))
    return results

def compute_metrics(results):
    n = len(results)
    if n == 0: return {}
    
    positives = sum(1 for r in results if r["actual_fraud"])
    negatives = n - positives
    
    tp = sum(1 for r in results if r["actual_fraud"] and r["cashout_probability"] > 0.5)
    tn = sum(1 for r in results if not r["actual_fraud"] and r["cashout_probability"] <= 0.5)
    fp = sum(1 for r in results if not r["actual_fraud"] and r["cashout_probability"] > 0.5)
    fn = sum(1 for r in results if r["actual_fraud"] and r["cashout_probability"] <= 0.5)
    
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
    
    p1 = sum(r.get("precision_at_1", 0) for r in results) / n
    p5 = sum(r.get("precision_at_5", 0) for r in results) / n
    r5 = sum(r.get("recall_at_5", 0) for r in results) / n
    ndcg5 = sum(r.get("ndcg_at_5", 0) for r in results) / n
    brier = sum(r.get("calibration_error", 0) for r in results) / n
    
    lead_times = [r["lead_time_minutes"] for r in results if r["lead_time_minutes"] > 0]
    geo_errors = [r["geographic_error_km"] for r in results if r["geographic_error_km"] >= 0]
    
    def bootstrap_p1(data): return sum(r.get("precision_at_1", 0) for r in data) / len(data)
    def bootstrap_p5(data): return sum(r.get("precision_at_5", 0) for r in data) / len(data)
    def bootstrap_r5(data): return sum(r.get("recall_at_5", 0) for r in data) / len(data)
    def bootstrap_brier(data): return sum(r.get("calibration_error", 0) for r in data) / len(data)
    
    rng = random.Random(EVAL_SEED)
    ci_p1 = bootstrap_ci(results, bootstrap_p1, rng)
    ci_p5 = bootstrap_ci(results, bootstrap_p5, rng)
    ci_r5 = bootstrap_ci(results, bootstrap_r5, rng)
    ci_brier = bootstrap_ci(results, bootstrap_brier, rng)
    
    # Calibration bins
    bins = [0, 0, 0, 0, 0]
    bin_totals = [0, 0, 0, 0, 0]
    bin_actuals = [0, 0, 0, 0, 0]
    for r in results:
        p = r["cashout_probability"]
        idx = min(4, int(p * 5))
        bins[idx] += 1
        bin_totals[idx] += p
        bin_actuals[idx] += 1 if r["actual_fraud"] else 0
        
    calibration_table = []
    for i in range(5):
        if bins[i] > 0:
            calibration_table.append({
                "bin": f"{i*0.2:.1f}-{(i+1)*0.2:.1f}",
                "predicted_prob": bin_totals[i] / bins[i],
                "actual_freq": bin_actuals[i] / bins[i],
                "sample_count": bins[i]
            })

    # Abstention
    abstained_count = sum(1 for r in results if r.get("is_abstained"))
    non_abstained = [r for r in results if not r.get("is_abstained")]
    abstained_p5 = sum(r.get("precision_at_5", 0) for r in non_abstained) / max(1, len(non_abstained))
    
    return {
        "sample_count": n,
        "positives": positives,
        "negatives": negatives,
        "confusion_matrix": {"TP": tp, "TN": tn, "FP": fp, "FN": fn},
        "classification": {
            "Precision": precision,
            "Recall": recall,
            "F1": f1,
            "FPR": fpr
        },
        "ranking": {
            "Precision@1": p1, "Precision@5": p5, "Recall@5": r5, "NDCG@5": ndcg5
        },
        "calibration": {
            "Brier_Score": brier,
            "table": calibration_table
        },
        "lead_time": {
            "mean": sum(lead_times) / max(1, len(lead_times)) if lead_times else 0,
            "median": compute_percentile(lead_times, 0.5),
            "p90": compute_percentile(lead_times, 0.9)
        },
        "geo_error": {
            "mean": sum(geo_errors) / max(1, len(geo_errors)) if geo_errors else 0,
            "median": compute_percentile(geo_errors, 0.5),
            "p90": compute_percentile(geo_errors, 0.9)
        },
        "baseline": {
            "Brier_Score": sum(r.get("baseline_brier", 0) for r in results) / n,
            "Precision@1": sum(r.get("baseline_p1", 0) for r in results) / n,
            "Precision@5": sum(r.get("baseline_p5", 0) for r in results) / n,
            "Recall@5": sum(r.get("baseline_r5", 0) for r in results) / n
        },
        "uncertainty": {
            "Precision@1_95CI": ci_p1,
            "Precision@5_95CI": ci_p5,
            "Recall@5_95CI": ci_r5,
            "Brier_95CI": ci_brier
        },
        "abstention": {
            "rate": abstained_count / n,
            "accuracy_non_abstained_p5": abstained_p5,
            "coverage": 1.0 - (abstained_count / n)
        }
    }

async def generate_and_evaluate():
    print("Run 1: Evaluating...")
    res1 = await run_evaluation(seed_offset=0)
    met1 = compute_metrics(res1)
    
    print("Run 2: Reproducibility Check...")
    res2 = await run_evaluation(seed_offset=0)
    met2 = compute_metrics(res2)
    
    h1 = hashlib.sha256(json.dumps(met1, sort_keys=True).encode()).hexdigest()
    h2 = hashlib.sha256(json.dumps(met2, sort_keys=True).encode()).hexdigest()
    
    print(f"Run 1:\nreproducibility_hash = {h1}\n")
    print(f"Run 2:\nreproducibility_hash = {h2}\n")
    if h1 == h2:
        print("REPRODUCIBILITY: PASS")
    else:
        print("REPRODUCIBILITY: FAIL")
        
    # Breakdown
    breakdown = {}
    for cat in set(r["category"] for r in res1):
        cat_res = [r for r in res1 if r["category"] == cat]
        breakdown[cat] = compute_metrics(cat_res)
        
    final_output = {
        "dataset_version": "1.0",
        "random_seed": EVAL_SEED,
        "evaluation_unit": "incident",
        "scenario_count": len(res1),
        "incident_count": len(res1),
        "positive_count": met1["positives"],
        "negative_count": met1["negatives"],
        "reproducibility_hash": h1,
        "aggregate_metrics": met1,
        "adversarial_breakdown": breakdown
    }
    
    out_file = os.path.join(os.path.dirname(__file__), "..", "app", "ml", "independent_metrics.json")
    with open(out_file, "w") as f:
        json.dump(final_output, f, indent=2)
    print(f"Done! Evaluated {len(res1)} incidents. Output written to {out_file}")

if __name__ == "__main__":
    asyncio.run(generate_and_evaluate())
