import uuid
import random
from datetime import datetime, timedelta
from app.db.database import SessionLocal
from app.models.domain import Bank, Account, Device, Terminal

# Simulated bounding box around Pune/NCR
# Pune approx: 18.5204, 73.8567
LAT_MIN, LAT_MAX = 18.4, 18.6
LNG_MIN, LNG_MAX = 73.7, 74.0

def generate_base_data(db, num_banks=5, num_accounts=1000, num_devices=200, num_terminals=50):
    banks = []
    for i in range(num_banks):
        bank = Bank(id=f"B{i}", name=f"Bank_{i}")
        db.add(bank)
        banks.append(bank)
    db.commit()

    accounts = []
    for i in range(num_accounts):
        acc = Account(
            id=f"A{i}",
            bank_id=random.choice(banks).id,
            account_age_days=random.randint(1, 3650),
            risk_profile=random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.8, 0.15, 0.05])[0],
            location_region="PUNE",
            historical_transaction_volume=random.uniform(1000, 100000)
        )
        db.add(acc)
        accounts.append(acc)
    db.commit()

    for i in range(num_devices):
        dev = Device(
            id=f"D{i}",
            device_type=random.choice(["MOBILE", "WEB"]),
            associated_account_ids=[random.choice(accounts).id],
            historical_usage=random.randint(1, 100)
        )
        db.add(dev)
    
    for i in range(num_terminals):
        term = Terminal(
            id=f"T{i}",
            bank_id=random.choice(banks).id,
            terminal_type="ATM",
            latitude=random.uniform(LAT_MIN, LAT_MAX),
            longitude=random.uniform(LNG_MIN, LNG_MAX),
            h3_cell="dummy_h3", # We can update this later with actual h3 index
            synthetic_neighborhood=f"Region_{random.randint(1, 10)}",
            historical_usage=random.randint(100, 5000)
        )
        db.add(term)
    db.commit()
    print("Synthetic data generated successfully.")

if __name__ == '__main__':
    db = SessionLocal()
    generate_base_data(db)
    db.close()
