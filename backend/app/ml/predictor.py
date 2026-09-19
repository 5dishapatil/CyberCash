import math
import os
from sqlalchemy.orm import Session
from app.models.domain import Terminal, Transaction, Device, Account, Withdrawal
from app.simulator.spatial import spatial_engine
from app.ml.features import calculate_point_in_time_features


def predict_cashout(db: Session, account_id: str, simulation_time):
    """
    Calibrated predictive model using point-in-time behavioral features.
    Returns: (calibrated_probability, features_dict, raw_logit_score)
    """
    features = calculate_point_in_time_features(db, account_id, simulation_time)

    velocity_5m = features.get("velocity_5m", 0)
    amount_5m   = features.get("amount_5m", 0)
    fan_in      = features.get("fan_in", 0)
    fan_out     = features.get("fan_out", 0)
    acc_age     = features.get("acc_age", 365)

    # Feature 1: Velocity signal - rapid inbound transactions in 5 min
    f1 = min(1.0, velocity_5m / 5.0)

    # Feature 2: High inbound amount in 5 min (e.g. >50k = high risk)
    f2 = min(1.0, amount_5m / 500000.0)

    # Feature 3: Fan-out to multiple receivers (mule distribution pattern)
    f3 = min(1.0, fan_out / 5.0)

    # Feature 4: Fresh account age is a mule indicator
    f4 = max(0.0, 1.0 - (acc_age / 365.0))

    # Feature 5: Prior withdrawals on this account (behavioral pattern)
    recent_w = db.query(Withdrawal).filter(
        Withdrawal.account_id == account_id,
        Withdrawal.timestamp <= simulation_time
    ).count()
    f5 = min(1.0, recent_w / 3.0)

    # Weighted logistic: z = sum(weight * feature) + bias
    z = (3.5 * f1) + (2.0 * f2) + (2.5 * f3) + (1.5 * f4) + (1.0 * f5) - 2.0

    # Sigmoid squash
    prob = 1.0 / (1.0 + math.exp(-z))
    prob = max(0.05, min(0.98, prob))

    # Adversarial adaptation: if account had prior failed withdrawal, boost prob
    failed_w = db.query(Withdrawal).filter(
        Withdrawal.account_id == account_id,
        Withdrawal.fraud_label == False,
        Withdrawal.timestamp <= simulation_time
    ).count()
    if failed_w > 0:
        prob = min(0.98, prob + 0.15)

    return float(prob), features, float(z)


def rank_candidate_terminals(db: Session, account_id: str, simulation_time, time_window_mins=30.0, origin_coords=None):
    """
    Ranks ATM terminals by likelihood of being the cashout point.
    Uses travel-time reachability and bank affinity scoring.
    Supports dynamic origin resolution and abstention for rapid cashout.
    """
    latest_tx = db.query(Transaction).filter(
        (Transaction.source_account == account_id) | (Transaction.destination_account == account_id),
        Transaction.timestamp <= simulation_time
    ).order_by(Transaction.timestamp.desc()).first()

    # Dynamic spatial origin resolution
    if origin_coords:
        origin_lat, origin_lng = origin_coords
    elif latest_tx and latest_tx.device_id:
        dev = db.query(Device).filter(Device.id == latest_tx.device_id).first()
        if dev and dev.latitude is not None and dev.longitude is not None:
            origin_lat, origin_lng = dev.latitude, dev.longitude
        else:
            origin_lat, origin_lng = 18.5204, 73.8567
    else:
        origin_lat, origin_lng = 18.5204, 73.8567

    # Bank affinity: terminals at banks this account received funds from
    txs = db.query(Transaction).filter(
        Transaction.destination_account == account_id,
        Transaction.timestamp <= simulation_time
    ).all()
    associated_banks = {tx.bank_id for tx in txs if tx.bank_id}

    terminals = db.query(Terminal).all()
    candidates = []

    for t in terminals:
        travel_time = spatial_engine.estimate_travel_time(origin_lat, origin_lng, t.latitude, t.longitude)
        if travel_time <= time_window_mins:
            reachability_score = max(0.0, 1.0 - (travel_time / time_window_mins))
            affinity_score = 1.0 if t.bank_id in associated_banks else 0.1
            w1, w2 = 0.7, 0.3
            location_score = (w1 * reachability_score) + (w2 * affinity_score)
            candidates.append({
                "terminal_id": t.id,
                "bank_id": t.bank_id,
                "lat": t.latitude,
                "lng": t.longitude,
                "h3_cell": t.h3_cell,
                "travel_time": round(travel_time, 1),
                "spatial_score": round(location_score, 4)
            })

    # ABSTENTION CRITERIA:
    # 1. No candidates physically reachable within the time window
    # 2. Ultra-short window (<= 3.0 mins) where tactical uncertainty is too high
    if not candidates or (time_window_mins <= 3.0 and len(candidates) > 20):
        return "ABSTAIN", [], 0.0

    candidates.sort(key=lambda x: x["spatial_score"], reverse=True)
    top_k = candidates[:5]

    total_score = sum(c["spatial_score"] for c in top_k)
    for c in top_k:
        c["prob"] = round(c["spatial_score"] / total_score, 4) if total_score > 0 else 0
        c["reason"] = (
            f"Reachable in {int(c['travel_time'])}min. Bank affinity ({c['bank_id']}) matched."
            if c["bank_id"] in associated_banks
            else f"Reachable in {int(c['travel_time'])}min. Proximity model."
        )

    max_prob = top_k[0]["prob"] if top_k else 0
    if len(candidates) > 50 or max_prob < 0.20:
        return "LOW", top_k, max(c["travel_time"] for c in top_k)
    elif max_prob < 0.5:
        return "MEDIUM", top_k, max(c["travel_time"] for c in top_k)
    else:
        return "HIGH", top_k, max(c["travel_time"] for c in top_k)
