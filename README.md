# CyberCash Sentinel

Predictive analytics framework for cybercrime complaints.

## How to run locally

### 1. Start the Backend (FastAPI + SQLite)

Open a new PowerShell terminal and run:
\\\powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
\\\
The backend API will be available at http://localhost:8000/docs

### 2. Start the Frontend (Next.js)

Open a second PowerShell terminal and run:
\\\powershell
cd frontend
npm run dev
\\\
The frontend dashboard will be available at http://localhost:3000
