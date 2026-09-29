# CyberCash Sentinel 🛡️
**Predictive Analytics Framework for Cybercrime Complaints**

CyberCash Sentinel is a next-generation predictive intelligence platform designed to proactively intercept financial cybercrime. By ingesting early-stage cybercrime complaints, live transaction signals, and historical patterns, the platform’s AI forecasts likely physical cash withdrawal locations (ATMs) in advance, generating actionable intelligence for timely law enforcement intervention.

---

## 🚀 Key Deliverables & Features

- **Predictive Analytics Engine**  
  An AI/ML-based system utilizing LightGBM algorithms to analyze historical cybercrime and financial data. It detects subtle burst patterns and transaction velocities to predict potential withdrawal hotspots and generate 15-30 minute advance warnings.
- **Risk Heatmap Dashboard**  
  A full-screen, GIS-enabled dashboard that visualizes real-time and potential risk zones. It leverages H3 spatial indices to dynamically map candidate ATMs, color-coding them by threat imminence (High Risk vs. Medium Risk).
- **Secure Law Enforcement Interface**  
  A secure, role-based (RBAC) Command Centre for investigators to access alerts, review high-risk incident dossiers, visualize illicit network money flows, and generate presentation-grade PDF intelligence reports for evidentiary documentation.
- **Alert & Notification System**  
  An automated trigger system integrated directly into the dashboard timeline, issuing real-time notifications for critical threat developments so ground teams know exactly when and where to deploy.

---

## 🛠️ Architecture & Tech Stack

The platform uses a decoupled microservices architecture designed for rapid intelligence delivery and smooth geospatial visualization.

**Frontend (Client Interface)**
- **Framework:** Next.js 14, React 18
- **Styling:** Tailwind CSS (Premium Dark Cyber-Ops Theme)
- **Data Visualization:** Recharts, React Flow (Network Graphs)
- **Reporting:** jsPDF, jsPDF-AutoTable (9-page highly structured intelligence exports)
- **Icons & UI:** Lucide React

**Backend (Intelligence Engine & API)**
- **Framework:** Python 3.9+, FastAPI
- **Database:** SQLite (Relational entity tracking)
- **Machine Learning:** LightGBM, Scikit-learn, Pandas, NumPy
- **Server:** Uvicorn (ASGI)
- **Geospatial Processing:** H3 hierarchical indexing logic built into prediction models

---

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/5dishapatil/CyberCash.git
cd CyberCash
```

### 2. Backend Setup (FastAPI)
```bash
cd backend
# Create and activate a virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*The backend will now be running on http://localhost:8000*

### 3. Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend will now be running on http://localhost:3000*

---

## 🔒 Security & Environment
- **Prototype Status:** This system runs in a Demonstration Environment using synthetic simulation data.
- **API Keys:** No external API keys are required to run the prototype. The system operates natively using internal ML models and locally generated mock data sets.

---

## 📖 Using the Prototype
1. Navigate to `http://localhost:3000` in your browser.
2. Use the **Quick Demo Access** buttons on the login screen (e.g., `i4c_analyst`) to bypass authentication using synthetic credentials.
3. Explore the **Command Centre** to see live threat queues.
4. Drill down into the **Incidents** and **Network Analysis** tabs to visualize mule networks.
5. Export intelligence dossiers from the **Reports** tab to view the automated 9-page PDF generation.

---
*Developed for Proactive Financial Cybercrime Intervention — Ministry of Home Affairs / I4C Prototype*
