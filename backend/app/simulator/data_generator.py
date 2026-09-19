import uuid
import random
import bcrypt
import math
import datetime
from app.db.database import SessionLocal, engine
from app.models.domain import Base, Bank, Account, Device, Terminal, User, Transaction, Withdrawal, Incident

LAT_MIN, LAT_MAX = 18.4, 18.6
LNG_MIN, LNG_MAX = 73.7, 74.0

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def generate_base_data(db, num_banks=10, num_accounts=1000, num_devices=500, num_terminals=200):
    print("Dropping and recreating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    print("Generating Banks, Users, Accounts, Terminals...")
    banks = [Bank(id=f"B{i}", name=f"Bank_of_Pune_{i}") for i in range(num_banks)]
    db.add_all(banks)
    db.commit()

    roles = [
        ("bank_officer", "BANK", "Bank Officer", "B0"),
        ("lea_officer", "LEA", "Law Enforcement", None),
        ("i4c_analyst", "I4C", "I4C Analyst", None),
        ("supervisor", "SUPERVISOR", "Supervisor", None),
        ("judge_admin", "JUDGE", "Judge", None)
    ]
    for username, role, fullname, b_id in roles:
        u = User(id=str(uuid.uuid4()), username=username, hashed_password=hash_password("demo123"), role=role, full_name=fullname, bank_id=b_id)
        db.add(u)
    
    accounts = []
    for i in range(num_accounts):
        acc = Account(id=f"A{i}", bank_id=random.choice(banks).id, account_age_days=random.randint(1, 3650), risk_profile=random.choices(["LOW", "MEDIUM", "HIGH"], weights=[0.85, 0.10, 0.05])[0], location_region="PUNE", historical_transaction_volume=random.uniform(1000, 1000000))
        accounts.append(acc)
    db.add_all(accounts)

    terminals = []
    for i in range(num_terminals):
        term = Terminal(id=f"T{i}", bank_id=random.choice(banks).id, terminal_type="ATM", latitude=random.uniform(LAT_MIN, LAT_MAX), longitude=random.uniform(LNG_MIN, LNG_MAX), h3_cell="89283082803ffff", synthetic_neighborhood=f"Region_{random.randint(1, 20)}", historical_usage=random.randint(100, 50000))
        terminals.append(term)
    db.add_all(terminals)
    db.commit()
    devices = []
    for i in range(num_devices):
        assoc_accs = [random.choice(accounts).id for _ in range(random.randint(1, 3))]
        dev = Device(id=f"D{i}", device_type=random.choice(["MOBILE", "DESKTOP", "TABLET"]), associated_account_ids=assoc_accs, historical_usage=random.randint(10, 1000))
        devices.append(dev)
    db.add_all(devices)
    db.commit()
    
    print("Generating Temporal Training Data (60 Days)...")
    start_time = datetime.datetime.now() - datetime.timedelta(days=60)
    current_time = start_time
    
    # Generate scenarios
    for _ in range(3000):
        scenario_type = random.choices(["fraud", "hard_negative", "normal"], weights=[0.15, 0.10, 0.75])[0]
        
        if scenario_type == "fraud":
            victim = random.choice(accounts)
            l1 = random.choice(accounts)
            l2_nodes = random.sample(accounts, 3)
            amount = random.uniform(50000, 500000)
            
            current_time += datetime.timedelta(minutes=random.randint(1, 30))
            db.add(Transaction(id=f"TX_{uuid.uuid4().hex[:8]}", timestamp=current_time, source_account=victim.id, destination_account=l1.id, amount=amount, transaction_type="TRANSFER", bank_id=victim.bank_id, risk_signal="HIGH", device_id=random.choice(devices).id))
            
            current_time += datetime.timedelta(minutes=random.randint(1, 10))
            for l2 in l2_nodes:
                db.add(Transaction(id=f"TX_{uuid.uuid4().hex[:8]}", timestamp=current_time, source_account=l1.id, destination_account=l2.id, amount=amount/3, transaction_type="TRANSFER", bank_id=l1.bank_id, risk_signal="HIGH", device_id=random.choice(devices).id))
            
            delay_mins = random.randint(15, 60)
            cashout_time = current_time + datetime.timedelta(minutes=delay_mins)
            target_terminal = random.choice(terminals)
            db.add(Withdrawal(id=f"WD_{uuid.uuid4().hex[:8]}", timestamp=cashout_time, account_id=l2_nodes[0].id, terminal_id=target_terminal.id, amount=amount/3, fraud_label=True))
            current_time = cashout_time
            
        elif scenario_type == "hard_negative":
            # Looks like a cascade (e.g. salary disbursement or legit business)
            src = random.choice(accounts)
            l1 = random.choice(accounts)
            l2_nodes = random.sample(accounts, 3)
            amount = random.uniform(100000, 1000000)
            
            current_time += datetime.timedelta(minutes=random.randint(1, 30))
            db.add(Transaction(id=f"TX_{uuid.uuid4().hex[:8]}", timestamp=current_time, source_account=src.id, destination_account=l1.id, amount=amount, transaction_type="TRANSFER", bank_id=src.bank_id, risk_signal="MEDIUM", device_id=random.choice(devices).id))
            
            current_time += datetime.timedelta(minutes=random.randint(1, 10))
            for l2 in l2_nodes:
                db.add(Transaction(id=f"TX_{uuid.uuid4().hex[:8]}", timestamp=current_time, source_account=l1.id, destination_account=l2.id, amount=amount/3, transaction_type="TRANSFER", bank_id=l1.bank_id, risk_signal="LOW", device_id=random.choice(devices).id))
                
            # No immediate cashout, or if there is, it's legitimate
            if random.random() < 0.2:
                delay_mins = random.randint(120, 1440) # 2 hours to 1 day later
                cashout_time = current_time + datetime.timedelta(minutes=delay_mins)
                target_terminal = random.choice(terminals)
                db.add(Withdrawal(id=f"WD_{uuid.uuid4().hex[:8]}", timestamp=cashout_time, account_id=l2_nodes[0].id, terminal_id=target_terminal.id, amount=amount/6, fraud_label=False))
                current_time = cashout_time
                
        else:
            src, dst = random.sample(accounts, 2)
            amount = random.uniform(500, 15000)
            current_time += datetime.timedelta(minutes=random.randint(1, 30))
            db.add(Transaction(id=f"TX_{uuid.uuid4().hex[:8]}", timestamp=current_time, source_account=src.id, destination_account=dst.id, amount=amount, transaction_type="TRANSFER", bank_id=src.bank_id, risk_signal="LOW", device_id=random.choice(devices).id))
            
            if random.random() < 0.1:
                current_time += datetime.timedelta(minutes=random.randint(30, 300))
                db.add(Withdrawal(id=f"WD_{uuid.uuid4().hex[:8]}", timestamp=current_time, account_id=dst.id, terminal_id=random.choice(terminals).id, amount=amount, fraud_label=False))
                
    db.commit()
    print("Database seeding and temporal graph generation complete.")

if __name__ == '__main__':
    db = SessionLocal()
    generate_base_data(db)
    db.close()
