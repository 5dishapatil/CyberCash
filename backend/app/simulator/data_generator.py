import uuid
import random
import bcrypt
from datetime import datetime, timedelta
from app.db.database import SessionLocal, engine
from app.models.domain import Base, Bank, Account, Device, Terminal, User

LAT_MIN, LAT_MAX = 18.4, 18.6
LNG_MIN, LNG_MAX = 73.7, 74.0

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def generate_base_data(db, num_banks=10, num_accounts=10000, num_devices=2000, num_terminals=500):
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("Generating Banks...")
    banks = []
    for i in range(num_banks):
        bank = Bank(id=f"B{i}", name=f"Bank_of_Pune_{i}")
        db.add(bank)
        banks.append(bank)
    db.commit()

    print("Generating Users (Auth Seed)...")
    roles = [
        ("bank_officer", "BANK", "Bank Officer Demo", "B0"),
        ("lea_officer", "LEA", "Law Enforcement Demo", None),
        ("i4c_analyst", "I4C", "I4C Intelligence Demo", None),
        ("supervisor", "SUPERVISOR", "Command Supervisor Demo", None),
        ("judge_admin", "JUDGE", "Judge Admin Demo", None)
    ]
    for username, role, fullname, b_id in roles:
        u = User(
            id=str(uuid.uuid4()),
            username=username,
            hashed_password=hash_password("demo123"),
            role=role,
            full_name=fullname,
            bank_id=b_id
        )
        db.add(u)
    db.commit()

    print("Generating Accounts...")
    accounts = []
    for i in range(num_accounts):
        acc = Account(
            id=f"A{i}",
            bank_id=random.choice(banks).id,
            account_age_days=random.randint(1, 3650),
            risk_profile=random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.85, 0.10, 0.05])[0],
            location_region="PUNE",
            historical_transaction_volume=random.uniform(1000, 1000000)
        )
        db.add(acc)
        accounts.append(acc)
    db.commit()

    print("Generating Devices...")
    for i in range(num_devices):
        dev = Device(
            id=f"D{i}",
            device_type=random.choice(["MOBILE", "WEB", "API"]),
            associated_account_ids=[random.choice(accounts).id for _ in range(random.randint(1, 3))],
            historical_usage=random.randint(1, 1000)
        )
        db.add(dev)
    
    print("Generating Terminals...")
    for i in range(num_terminals):
        term = Terminal(
            id=f"T{i}",
            bank_id=random.choice(banks).id,
            terminal_type="ATM",
            latitude=random.uniform(LAT_MIN, LAT_MAX),
            longitude=random.uniform(LNG_MIN, LNG_MAX),
            h3_cell="89283082803ffff", 
            synthetic_neighborhood=f"Region_{random.randint(1, 20)}",
            historical_usage=random.randint(100, 50000)
        )
        db.add(term)
    db.commit()
    print("Synthetic base data generated successfully.")

if __name__ == '__main__':
    db = SessionLocal()
    generate_base_data(db)
    db.close()
