# MandiMitra AI 🌾

### *"Don't just sell your harvest. Sell it smarter."*

MandiMitra AI is a full-stack, production-ready agricultural market intelligence and decision-support platform designed to maximize Indian farmers' **NET PROFIT REALIZATION**, rather than naively chasing the highest market spot price.

---

## 🚀 Key Problem & Innovation

Farmers frequently transport produce to mandis advertising high prices today, only to discover that:

1. Long transport distances consume massive diesel freight (₹35–₹50/km).
2. Unexpected arrival gluts collapse prices by the time their trucks arrive.
3. Rain downpours and ambient heat cause severe perishable spoilage.
4. Mandi market cess and handling fees eat into margins.

**MandiMitra AI solves this with:**

- **Net Realization Engine:** `Net Profit = Gross Revenue − Transport − Handling − Storage − Perishable Degradation`.
- **Machine Learning Price Forecasting:** XGBoost & Random Forest models predict 7–14 day price trajectories with 80% confidence intervals.
- **Harvest Allocation Optimizer:** Mixed-integer / Linear Programming (SciPy HiGHS solver) automatically determines the optimal multi-mandi, multi-day quantity split.
- **Weather & Spoilage Intelligence:** Real-time 7-day agro-meteorological risk evaluation via Open-Meteo.
- **Geospatial Logistics:** OpenStreetMap and OSRM highway route calculation for accurate driving distances and durations.
- **Bilingual UI:** Native support for English and Kannada (ಕನ್ನಡ).

---

## 🛠 Technology Stack

### Frontend
- React 19 + Vite 8
- Tailwind CSS v4 (Agricultural palette: Forest Green `#164B35`, Sage Green `#DDEBDD`, Golden Yellow `#E9B44C`)
- Leaflet & React-Leaflet (Interactive OpenStreetMap market routing)
- Recharts (Time-series forecast bands with uncertainty intervals)
- Lucide React (Farmer-friendly accessible iconography)
- React Router v7

### Backend
- Python 3.10+ / 3.13
- FastAPI + Uvicorn
- Scikit-Learn & XGBoost (Predictive time-series regressors)
- SciPy HiGHS Optimizer (Linear programming harvest distributor)
- SQLAlchemy + PostgreSQL (with local SQLite fallback)
- Open-Meteo API (Meteorological observations and agro-climatic forecasting)
- OSRM Routing Engine (Highway driving distance and duration)

---

## 📂 Project Architecture

```text
mandimitra-ai/
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/            # Navbar, Footer, CostBreakdownCard, PriceChart, LeafletMap, StatCard
│   │   ├── pages/                 # All 10 Application Pages
│   │   ├── context/               # LanguageContext (English/Kannada), FarmerStateContext
│   │   ├── services/              # api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── render.yaml                # Render deployment configuration (if used)
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/endpoints.py       # REST APIs (/crops, /markets, /weather, /prices, /recommendations, /optimize, /scenarios)
│   │   ├── services/              # Weather, Transport (OSRM), NetRealization engines
│   │   ├── ml/                    # XGBoost/RF Price & Arrival Forecasters, Anomaly Detector
│   │   ├── optimization/          # SciPy HiGHS Linear Programming Harvest Optimizer
│   │   ├── database/              # SQLAlchemy connection
│   │   ├── models/                # ORM database models
│   │   ├── schemas/               # Pydantic validation schemas
│   │   └── main.py                # FastAPI entrypoint
│   ├── datasets/
│   │   ├── raw/                   # Ingested Agmarknet mandi market records (10,222+ rows)
│   │   ├── processed/             # Cleaned history, master timeseries, locations DB
│   │   └── final/                 # Model-ready dataset for ML training
│   ├── trained_models/            # Saved .joblib model artifacts & evaluation metrics
│   ├── reports/                   # Data Quality Report & ML Evaluation Report
│   ├── tests/                     # test_platform.py (11 integration tests)
│   ├── render.yaml                # Render deployment blueprint
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🏃 Step-by-Step Local Setup (Windows 11 & VS Code)

### 1. Open Project in VS Code

Open the project directory in VS Code:

```bash
cd path\to\mandimitra-ai
code .
```

### 2. Start the Backend (Terminal 1)

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Backend API:
`http://127.0.0.1:8000`

Interactive Swagger Docs:
`http://127.0.0.1:8000/docs`

### 3. Start the Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Frontend:
`http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the full platform test suite (validates all 11 unit, integration, and optimizer constraints):

```bash
cd backend
python -m tests.test_platform
```

---

## ☁️ Cloud Deployment – Render

MandiMitra AI is deployed entirely on **Render**, with the frontend hosted as a Static Site and the backend running as a Web Service.

### 🌐 Live Application

| Service | Deployment URL |
|---|---|
| Frontend | https://smart-mandi-frontend.onrender.com |
| Backend API | https://smart-mandi-backend-9wmp.onrender.com |
| Backend Swagger Docs | https://smart-mandi-backend-9wmp.onrender.com/docs |
| Backend Health Check | https://smart-mandi-backend-9wmp.onrender.com/api/health |

### 1. Frontend Deployment – Render Static Site

1. Sign in to [Render](https://render.com/).
2. Select **New + → Static Site**.
3. Connect your GitHub repository.
4. Configure the following settings:

| Setting | Value |
|---|---|
| Name | `smart-mandi-frontend` |
| Root Directory | `frontend` |
| Build Command | `npm install && npm run build` |
| Publish Directory | `dist` |

5. Add the following environment variable:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://smart-mandi-backend-9wmp.onrender.com` |

6. Configure SPA routing so React Router routes correctly on page refresh. Add a Render rewrite rule:

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

7. Click **Deploy**.

**Live Frontend:**  
https://smart-mandi-frontend.onrender.com

### 2. Backend Deployment – Render Web Service

1. Sign in to [Render](https://render.com/).
2. Select **New + → Web Service**.
3. Connect the same GitHub repository.
4. Configure the following settings:

| Setting | Value |
|---|---|
| Name | `smart-mandi-backend-9wmp` |
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |

5. Add the following environment variables:

| Key | Value |
|---|---|
| `FRONTEND_URL` | `https://smart-mandi-frontend.onrender.com` |
| `DATABASE_URL` | Your hosted PostgreSQL connection string (if using PostgreSQL) |

6. Click **Deploy** and wait for the deployment to complete.

**Live Backend:**  
https://smart-mandi-backend-9wmp.onrender.com

**API Documentation:**  
https://smart-mandi-backend-9wmp.onrender.com/docs

**Health Check:**  
https://smart-mandi-backend-9wmp.onrender.com/api/health

### 3. Deployment Architecture

```text
              FARMER / USER
                    |
                    v
       +---------------------------+
       |     RENDER STATIC SITE    |
       |                           |
       |  React 19 + Vite Frontend |
       +---------------------------+
                    |
                    | HTTPS API Requests
                    v
       +---------------------------+
       |     RENDER WEB SERVICE    |
       |                           |
       |       FastAPI Backend     |
       |                           |
       |  ML Forecasting Models    |
       |  Net Realization Engine   |
       |  Harvest Optimizer        |
       |  Weather & Routing APIs   |
       +---------------------------+
                    |
                    v
       +---------------------------+
       |       DATA LAYER          |
       |                           |
       | PostgreSQL / SQLite       |
       | Trained ML Models         |
       | Agricultural Datasets     |
       +---------------------------+
```

**Note:** Ensure backend CORS configuration allows requests from `https://smart-mandi-frontend.onrender.com`. Also ensure the backend loads its trained model artifacts and datasets correctly in the Render deployment environment.

---

## 📄 License & Attribution

- **Market Prices & Volumes:** Government of India AGMARKNET / data.gov.in
- **Meteorological Data:** Open-Meteo (Non-commercial open-access tier)
- **Routing & Maps:** OpenStreetMap & Project OSRM

---

## 🌾 MandiMitra AI

**Empowering Indian farmers with intelligent agricultural market decisions.**

*"Don't just sell your harvest. Sell it smarter."*
