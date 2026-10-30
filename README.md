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
* **Net Realization Engine:** $\text{Net Profit} = \text{Gross Revenue} - \text{Transport} - \text{Handling} - \text{Storage} - \text{Perishable Degradation}$.
* **Machine Learning Price Forecasting:** XGBoost & Random Forest models predict 7–14 day price trajectories with 80% confidence intervals.
* **Harvest Allocation Optimizer:** Mixed-integer / Linear Programming (SciPy Highs solver) automatically determines the optimal multi-mandi, multi-day quantity split.
* **Weather & Spoilage Intelligence:** Real-time 7-day agro-meteorological risk evaluation via Open-Meteo.
* **Geospatial Logistics:** OpenStreetMap and OSRM highway route calculation for accurate driving distances and durations.
* **Bilingual UI:** Native support for English and Kannada (ಕನ್ನಡ).

---

## 🛠 Technology Stack

### Frontend
* **React 19** + **Vite 8**
* **Tailwind CSS v4** (Agricultural palette: Forest Green `#164B35`, Sage Green `#DDEBDD`, Golden Yellow `#E9B44C`)
* **Leaflet & React-Leaflet** (Interactive OpenStreetMap market routing)
* **Recharts** (Time-series forecast bands with uncertainty intervals)
* **Lucide React** (Farmer-friendly accessible iconography)
* **React Router v7**

### Backend
* **Python 3.10+ / 3.13**
* **FastAPI** + **Uvicorn**
* **Scikit-Learn** & **XGBoost** (Predictive time-series regressors)
* **SciPy Highs Optimizer** (Linear programming harvest distributor)
* **SQLAlchemy** + **PostgreSQL** (with local SQLite fallback)
* **Open-Meteo API** (Meteorological observations and agro-climatic forecasting)
* **OSRM Routing Engine** (Highway driving distance and duration)

---

## 📂 Project Architecture

```
mandimitra-ai/
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/           # Navbar, Footer, CostBreakdownCard, PriceChart, LeafletMap, StatCard
│   │   ├── pages/                # All 10 Application Pages
│   │   ├── context/              # LanguageContext (English/Kannada), FarmerStateContext
│   │   ├── services/             # api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vercel.json               # SPA routing rules for Vercel
│   └── package.json
│
├── backend/                      # FastAPI Python Backend
│   ├── app/
│   │   ├── api/endpoints.py      # REST APIs (/crops, /markets, /weather, /prices, /recommendations, /optimize, /scenarios)
│   │   ├── services/             # Weather, Transport (OSRM), NetRealization engines
│   │   ├── ml/                   # XGBoost/RF Price & Arrival Forecasters, Anomaly Detector
│   │   ├── optimization/         # SciPy Highs Linear Programming Harvest Optimizer
│   │   ├── database/             # SQLAlchemy connection
│   │   ├── models/               # ORM database models
│   │   ├── schemas/              # Pydantic validation schemas
│   │   └── main.py               # FastAPI entrypoint
│   ├── datasets/
│   │   ├── raw/                  # Ingested Agmarknet mandi market records (10,222+ rows)
│   │   ├── processed/            # Cleaned history, master timeseries, locations DB
│   │   └── final/                # Model-ready dataset for ML training
│   ├── trained_models/           # Saved .joblib model artifacts & evaluation metrics
│   ├── reports/                  # Data Quality Report & ML Evaluation Report
│   ├── tests/                    # test_platform.py (11 integration tests)
│   ├── render.yaml               # Render Cloud deployment blueprint
│   └── requirements.txt
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🏃 Step-by-Step Local Setup (Windows 11 & VS Code)

### 1. Open Project in VS Code
Open the project directory:
```powershell
cd C:\Users\kpran\.gemini\antigravity\scratch\mandimitra-ai
code .
```

### 2. Start the Backend (Terminal 1)
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```
* Backend API will run at: `http://127.0.0.1:8000`
* Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 3. Start the Frontend (Terminal 2)
```powershell
cd frontend
npm run dev
```
* Frontend Web App will open at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the full platform test suite (validates all 11 unit, integration, and optimizer constraints):
```powershell
cd backend
python -m tests.test_platform
```

---

## ☁️ Deployment Instructions

### Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"New Project"**.
3. Import the repository and set the **Root Directory** to `frontend`.
4. Set Environment Variable:
   * `VITE_API_BASE_URL`: `https://your-backend-app.onrender.com`
5. Click **Deploy**.

### Deploy Backend to Render
1. Sign in to [Render](https://render.com).
2. Click **"New +"** -> **"Web Service"** and link your repository.
3. Set the **Root Directory** to `backend`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add Environment Variables:
   * `FRONTEND_URL`: `https://your-frontend-app.vercel.app`
   * `DATABASE_URL`: Hosted PostgreSQL connection string (Supabase / Render Postgres).
7. Health check endpoint: `/api/health`.

---

## 📄 License & Attribution
* **Market Prices & Volumes:** Government of India AGMARKNET / data.gov.in
* **Meteorological Data:** Open-Meteo (Non-commercial open-access tier)
* **Routing & Maps:** OpenStreetMap & Project OSRM
