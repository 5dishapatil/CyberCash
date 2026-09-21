# CyberCash: Advanced AI-Driven Anti-Money Laundering & Fraud Detection Platform

## End-to-End Technical Implementation & Pitch Document

This document serves as the comprehensive technical specification and architectural defense for the CyberCash prototype. It details the precise tech stack, algorithmic decisions, synthetic data engineering, and module architectures required to field technical questions from engineers, stakeholders, and investors.

---

### 1. Executive Summary & Core Concept

**The Problem:** 
Modern cyber-financial crimes (e.g., mule account networks, localized ATM cashouts, structured laundering, smurfing) operate at velocities that traditional, rule-based banking firewalls cannot match. By the time human analysts detect the anomaly, the funds have already exited the digital ecosystem via physical ATMs.

**The Solution:** 
CyberCash is a real-time, AI-driven graph correlation engine. It ingests high-velocity transaction streams, builds temporal relationship graphs in memory, and utilizes point-in-time machine learning to forecast the probability of a physical cashout *before* it occurs. It wraps this engine in a military-grade geospatial and network analysis interface for Financial Intelligence Units (FIU) and Law Enforcement Agencies (LEA).

---

### 2. Architecture & Tech Stack Decisions

To balance rapid prototyping with production-like performance, we made highly deliberate technology choices.

#### Frontend Stack
*   **Framework:** **Next.js 16 (Turbopack) + React 19**. Next.js allows us to strictly separate server-side API routing from client-side interactive rendering. Turbopack ensures instant HMR (Hot Module Replacement) during rapid iteration.
*   **Styling:** **Tailwind CSS**. Enables rapid, utility-first UI development without the bloat of traditional CSS frameworks, allowing us to easily build the "dark mode, military-grade" dashboard aesthetic.
*   **Data Visualization:** 
    *   **React Flow (`@xyflow/react`)**: Chosen for its robust node-edge physics engine to render complex money-laundering topologies interactively.
    *   **Recharts**: Lightweight and heavily optimized for React, used to plot our real-time AI probability forecasting.
    *   **Leaflet (`react-leaflet`)**: Open-source mapping that supports OpenStreetMap tiles, allowing us to plot physical ATM infrastructure without relying on paid Google Maps APIs.

#### Backend Stack
*   **API Layer:** **FastAPI (Python 3.12+)**. Chosen for its native asynchronous capabilities (`asyncio`) and automatic OpenAPI validation via **Pydantic**. It easily handles high-throughput transaction ingestion.
*   **Database:** **SQLAlchemy + SQLite**. For this prototype, SQLite provides zero-configuration portability. 
    *   *Trade-off Note:* In a true production environment with millions of daily transactions, this would be migrated to **PostgreSQL** (for relational data), **TimescaleDB** (for temporal feature extraction), and **Neo4j** (for instantaneous multi-hop graph queries).

---

### 3. Data Engineering & Synthetic Dataset Generation

**The Challenge:** 
Real-world banking fraud data is strictly confidential, heavily regulated by PII/GDPR laws, and highly imbalanced (fraud represents <0.1% of transactions). You cannot simply download a dataset that represents complex, modern mule networks.

**The Implementation:** 
We engineered a sophisticated discrete-event synthetic data generator (`backend/app/simulator/data_generator.py`).
1.  **Topology Generation:** We procedurally generated Banks, Accounts, Devices (with localized IPs), and Terminals (ATMs seeded with realistic geographic Lat/Lon bounding boxes).
2.  **Behavioral Seeding:** Instead of purely random transactions, the engine simulates localized behaviors:
    *   *Legitimate baselines:* Normal salary deposits, utility payments, and ATM withdrawals.
    *   *Adversarial Scenarios:* Programmatic smurfing (many small deposits to evade reporting thresholds), fast-flux mule networks, and coordinated multi-ATM cashout events.
3.  **Temporal Integrity:** Transactions are generated sequentially, mimicking actual human and machine timing, creating a robust, mathematically sound foundation for our ML models.

---

### 4. Machine Learning Pipeline & Algorithm Choice

#### Algorithm Selection: LightGBM vs. XGBoost / Deep Learning
We specifically chose **LightGBM (Gradient Boosting)** to power the core predictive engine.
*   **Why not Deep Learning (e.g., Graph Neural Networks)?** While GNNs are excellent for graph topologies, their inference latency is currently too high for our real-time (sub-50ms) transaction blocking requirements, and they require exorbitant GPU compute. 
*   **Why LightGBM over XGBoost?** Financial fraud relies heavily on tabular data (amounts, time-deltas, categorical IDs). LightGBM grows trees leaf-wise (rather than level-wise like XGBoost). This results in exceptionally faster training times, lower memory footprint, and native handling of categorical features, making it the industry standard for imbalanced tabular fraud detection.

#### Feature Engineering & Point-in-Time Accuracy
A common mistake in ML fraud models is "data leakage"—using future knowledge to predict past events. We engineered `calculate_point_in_time_features()` which mathematically guarantees that when evaluating a transaction at `Timestamp T`, features like `velocity_5m` (volume in the last 5 minutes), `fan_in` (number of unique senders), and `acc_age` are calculated *strictly* using data prior to `T`.

#### Model Calibration (Platt Scaling)
Tree-based models (like LightGBM) output arbitrary risk scores, not true mathematical probabilities. If a system automatically freezes funds at a "60% risk", that percentage must be statistically reliable. We applied **Platt Scaling** (`app/ml/calibration.py` via `scikit-learn`) to calibrate the raw margins into strict, reliable percentages (0% to 100%). This allows FIU operators to set confident, legally-defensible automated response thresholds.

---

### 5. Core Application Modules & Workflows

1.  **Geospatial (GIS) Intelligence:**
    *   Cross-references live transaction threats against geographic ATMs.
    *   *Technical Resilience:* We implemented smart fallback logic. If the AI payload drops geographic coordinates to save bandwidth, the frontend map automatically cross-references the `terminal_id` against the global infrastructure state, or deterministically generates coordinates. It guarantees the map never fails to plot a threat.
2.  **Global Fraud Network (Macro Graph):**
    *   Takes isolated incidents and cross-correlates them. If two separate fraud rings route money through the same seemingly innocent account, the graph visually links them.
    *   Clicking a terminal seamlessly pulls live hardware telemetry (Vault Cash Level, CCTV Status) using deterministic hash algorithms to simulate deep hardware API integration.
3.  **Incident Workspaces & AI Forecasting:**
    *   Provides an isolated sandbox for analysts. 
    *   Features an intelligent dual-line chart: A solid line tracks historical probability up to the present moment, while a dashed algorithmic line projects the forecast +15 and +30 minutes into the future based on threat velocity.
4.  **Audit & Security Ledger:**
    *   A hyper-secure dossier view. Clicking an action doesn't just show a log text; it triggers an asynchronous backend reconstruction. It fetches the exact transactional trace (Source ➔ Destination) and the associated spatial ATM nodes at that exact millisecond, proving absolute evidentiary chain-of-custody for Law Enforcement.

---

### 6. Conclusion

CyberCash is not a simple dashboard; it is a full-stack, distributed intelligence platform. By combining LightGBM point-in-time predictions with React Flow and OpenStreetMap, we bridge the gap between abstract mathematical risk and actionable, real-world law enforcement response.
