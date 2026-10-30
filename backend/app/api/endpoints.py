"""FastAPI REST API endpoints for MandiMitra AI."""
import datetime as dt
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
import pandas as pd
from pathlib import Path

from ..schemas.market_schemas import (
    CropSummary,
    MandiOut,
    PriceHistoryPoint,
    PriceForecastResponse,
    TransportCostRequest,
    TransportCostResponse,
    NetRealizationRequest,
    MandiComparisonItem,
    OptimizationRequest,
    OptimizationResponse,
    ScenarioSimulationRequest
)
from ..services.weather_service import weather_service
from ..services.transport_service import transport_service
from ..services.net_realization_engine import net_realization_engine
from ..optimization.harvest_allocation_engine import harvest_optimizer
from ..ml.prediction_service import prediction_service

router = APIRouter(prefix="/api", tags=["Agricultural Market Intelligence"])

BACKEND_ROOT = Path(__file__).resolve().parents[2]
PROCESSED_DIR = BACKEND_ROOT / "datasets" / "processed"

# Load cached clean datasets
def get_locations_data() -> pd.DataFrame:
    f = PROCESSED_DIR / "mandi_locations_clean.csv"
    if f.exists():
        return pd.read_csv(f)
    return pd.DataFrame()

def get_history_data() -> pd.DataFrame:
    f = PROCESSED_DIR / "mandi_history.csv"
    if f.exists():
        return pd.read_csv(f)
    return pd.DataFrame()

@router.get("/crops", response_model=List[CropSummary])
def list_crops():
    """Retrieve all available agricultural commodities tracked with market price stats."""
    hist = get_history_data()
    if hist.empty:
        return [
            CropSummary(name="Tomato", mandis_reporting=339, avg_price_quintal=2850.0, min_price_quintal=1800.0, max_price_quintal=3800.0),
            CropSummary(name="Onion", mandis_reporting=303, avg_price_quintal=3400.0, min_price_quintal=2200.0, max_price_quintal=4900.0),
            CropSummary(name="Potato", mandis_reporting=287, avg_price_quintal=1950.0, min_price_quintal=1400.0, max_price_quintal=2700.0),
            CropSummary(name="Brinjal", mandis_reporting=330, avg_price_quintal=2600.0, min_price_quintal=1500.0, max_price_quintal=3600.0),
            CropSummary(name="Green Chilli", mandis_reporting=280, avg_price_quintal=4100.0, min_price_quintal=2800.0, max_price_quintal=5500.0),
        ]
        
    top_crops = hist["commodity"].value_counts().head(12).index.tolist()
    summaries = []
    for crop in top_crops:
        subset = hist[hist["commodity"] == crop]
        valid_prices = subset["modal_price"].dropna()
        if len(valid_prices) > 0:
            summaries.append(CropSummary(
                name=crop,
                mandis_reporting=int(subset["mandi"].nunique()),
                avg_price_quintal=round(float(valid_prices.mean()), 1),
                min_price_quintal=round(float(valid_prices.min()), 1),
                max_price_quintal=round(float(valid_prices.max()), 1),
            ))
    return summaries

@router.get("/markets", response_model=List[MandiOut])
def list_markets(state: Optional[str] = None):
    """Retrieve list of mandis with GPS coordinates, storage options, and handling rates."""
    locs = get_locations_data()
    if locs.empty:
        raise HTTPException(status_code=500, detail="Locations dataset not initialized.")
        
    if state:
        locs = locs[locs["state"].str.lower() == state.lower()]
        
    markets = []
    for _, row in locs.iterrows():
        markets.append(MandiOut(
            mandi_id=str(row["mandi_id"]),
            mandi_name=str(row["mandi"]),
            district=str(row.get("district", "Unknown")),
            state=str(row["state"]),
            latitude=float(row["lat"]) if pd.notna(row["lat"]) else None,
            longitude=float(row["lon"]) if pd.notna(row["lon"]) else None,
            market_type=str(row.get("type", "APMC")),
            storage_facility=bool(row.get("storage_facility", True)),
            cold_storage_per_day_per_q=float(row.get("cold_storage_per_day_per_q", 3.5)),
            handling_charge_per_q=15.0
        ))
    return markets

@router.get("/weather")
def get_weather(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    """Retrieve 7-day meteorological forecast and harvesting/transport risk evaluation."""
    return weather_service.get_weather_forecast(lat, lon)

@router.get("/prices/history")
def get_price_history(mandi_id: str, commodity: str = "Tomato", limit: int = 30):
    """Retrieve historical market prices and arrivals for a mandi."""
    ts_file = PROCESSED_DIR / "mandi_timeseries_master.csv"
    if not ts_file.exists():
        raise HTTPException(status_code=404, detail="Historical timeseries not generated.")
        
    df = pd.read_csv(ts_file)
    subset = df[(df["mandi_id"] == mandi_id) & (df["commodity"].str.lower() == commodity.lower())]
    if subset.empty:
        # Fallback to any mandi matching
        subset = df[df["commodity"].str.lower() == commodity.lower()]
        
    subset = subset.sort_values("date").tail(limit)
    points = []
    for _, row in subset.iterrows():
        points.append({
            "date": str(row["date"])[:10],
            "modal_price": float(row["modal_price"]),
            "min_price": float(row["min_price"]),
            "max_price": float(row["max_price"]),
            "arrivals_quintals": float(row["arrivals_quintals"]) if pd.notna(row.get("arrivals_quintals")) else None,
            "is_simulated_history": bool(row.get("is_simulated_history", False))
        })
    return {"mandi_id": mandi_id, "commodity": commodity, "history": points}

@router.get("/prices/forecast", response_model=PriceForecastResponse)
def get_price_forecast(mandi_id: str, commodity: str = "Tomato", days_ahead: int = 14):
    """Retrieve forward price forecast (7 to 14 days) with 80% confidence intervals and market anomalies."""
    try:
        return prediction_service.forecast_mandi_prices(mandi_id=mandi_id, commodity=commodity, days_ahead=days_ahead)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.get("/arrivals/forecast")
def get_arrivals_forecast(mandi_id: str, commodity: str = "Tomato"):
    """Retrieve predicted arrivals volume and supply pressure for the upcoming week."""
    fc = prediction_service.forecast_mandi_prices(mandi_id=mandi_id, commodity=commodity, days_ahead=7)
    arrivals_timeline = [
        {"date": p["date"], "day_name": p["day_name"], "forecast_arrivals_quintals": p["forecast_arrivals_quintals"]}
        for p in fc["forecast"]
    ]
    return {
        "mandi_id": mandi_id,
        "mandi_name": fc["mandi_name"],
        "commodity": commodity,
        "arrivals_forecast": arrivals_timeline
    }

@router.post("/transport/cost", response_model=TransportCostResponse)
def calculate_transport(req: TransportCostRequest):
    """Calculate driving distance, duration, and freight cost between farm and market."""
    return transport_service.calculate_route(
        origin_lat=req.origin_lat,
        origin_lon=req.origin_lon,
        dest_lat=req.dest_lat,
        dest_lon=req.dest_lon,
        vehicle_tonnage=req.vehicle_tonnage,
        fuel_rate_per_km=req.fuel_rate_per_km
    )

@router.post("/recommendations", response_model=List[MandiComparisonItem])
def get_mandi_recommendations(req: NetRealizationRequest):
    """Evaluate nearby mandis and determine the highest expected net profit and selling date."""
    locs = get_locations_data()
    if locs.empty:
        raise HTTPException(status_code=500, detail="Mandi locations database unavailable.")
        
    mandis_list = []
    for _, r in locs.iterrows():
        mandis_list.append({
            "mandi_id": str(r["mandi_id"]),
            "mandi_name": str(r["mandi"]),
            "district": str(r.get("district", "Unknown")),
            "state": str(r["state"]),
            "latitude": float(r["lat"]) if pd.notna(r["lat"]) else 12.97,
            "longitude": float(r["lon"]) if pd.notna(r["lon"]) else 77.56,
            "cold_storage_per_day_per_q": float(r.get("cold_storage_per_day_per_q", 3.5)),
            "handling_charge_per_q": 15.0
        })

    # Sort candidates by distance from farmer and pick top 10 closest
    mandis_list.sort(key=lambda m: (m["latitude"] - req.farmer_lat)**2 + (m["longitude"] - req.farmer_lon)**2)
    top_candidates = mandis_list[:8]
    
    # If farmer explicitly picked a mandi, ensure it is included
    if req.selected_mandi_id:
        selected_match = [m for m in mandis_list if m["mandi_id"] == req.selected_mandi_id]
        if selected_match and selected_match[0] not in top_candidates:
            top_candidates.append(selected_match[0])
            
    comparisons = net_realization_engine.compare_mandis_and_find_optimal_date(
        crop=req.crop,
        quantity_tonnes=req.quantity_tonnes,
        harvest_date_str=req.harvest_date,
        farmer_lat=req.farmer_lat,
        farmer_lon=req.farmer_lon,
        mandis_list=top_candidates,
        max_holding_days=7 if req.selling_date is None else 0,
        custom_transport_per_km=req.custom_transport_cost_per_km or 35.0,
        custom_handling_per_q=req.custom_handling_cost_per_q or 15.0,
        custom_storage_per_day_per_q=req.custom_storage_cost_per_day_per_q or 3.5,
        custom_spoilage_rate_pct_day=req.custom_spoilage_rate_pct_per_day or 1.5
    )
    
    return comparisons

@router.post("/optimize", response_model=OptimizationResponse)
def optimize_harvest_distribution(req: OptimizationRequest):
    """Run SciPy Linear Programming Optimizer to split harvest across mandis and dates."""
    locs = get_locations_data()
    if locs.empty:
        raise HTTPException(status_code=500, detail="Mandi locations database unavailable.")
        
    mandis_list = []
    for _, r in locs.iterrows():
        mandis_list.append({
            "mandi_id": str(r["mandi_id"]),
            "mandi_name": str(r["mandi"]),
            "district": str(r.get("district", "Unknown")),
            "state": str(r["state"]),
            "latitude": float(r["lat"]) if pd.notna(r["lat"]) else 12.97,
            "longitude": float(r["lon"]) if pd.notna(r["lon"]) else 77.56,
            "cold_storage_per_day_per_q": float(r.get("cold_storage_per_day_per_q", 3.5)),
            "handling_charge_per_q": 15.0
        })
        
    # Closest candidate mandis
    mandis_list.sort(key=lambda m: (m["latitude"] - req.farmer_lat)**2 + (m["longitude"] - req.farmer_lon)**2)
    selected_pool = mandis_list[:max(4, req.max_mandis_to_split + 2)]
    
    result = harvest_optimizer.optimize_allocation(
        crop=req.crop,
        total_harvest_tonnes=req.total_harvest_tonnes,
        harvest_date_str=req.harvest_date,
        farmer_lat=req.farmer_lat,
        farmer_lon=req.farmer_lon,
        candidate_mandis=selected_pool,
        max_mandis_to_split=req.max_mandis_to_split,
        max_share_per_mandi_pct=req.max_share_per_mandi_pct,
        allow_storage=req.allow_storage,
        max_storage_days=req.max_storage_days,
        custom_spoilage_pct_per_day=req.custom_spoilage_pct_per_day,
        custom_cold_storage_rate_per_day_per_q=req.custom_cold_storage_rate_per_day_per_q
    )
    
    return result

@router.post("/scenarios")
def simulate_scenario(req: ScenarioSimulationRequest):
    """Interactive What-If Scenario Simulator: recalculates profit under varying parameters."""
    base_req = req.base_request
    
    # 1. Base Run
    base_results = get_mandi_recommendations(base_req)
    base_best = base_results[0] if base_results else None
    
    # 2. Modified Run
    mod_req = NetRealizationRequest(
        crop=base_req.crop,
        quantity_tonnes=req.modified_quantity_tonnes or base_req.quantity_tonnes,
        harvest_date=base_req.harvest_date,
        selling_date=req.modified_selling_date or base_req.selling_date,
        farmer_lat=base_req.farmer_lat,
        farmer_lon=base_req.farmer_lon,
        selected_mandi_id=base_req.selected_mandi_id,
        custom_transport_cost_per_km=(base_req.custom_transport_cost_per_km or 35.0) * (req.modified_transport_cost_multiplier or 1.0),
        custom_handling_cost_per_q=base_req.custom_handling_cost_per_q,
        custom_storage_cost_per_day_per_q=base_req.custom_storage_cost_per_day_per_q,
        custom_spoilage_rate_pct_per_day=(base_req.custom_spoilage_rate_pct_per_day or 1.5) * (req.spoilage_rate_modifier_pct or 1.0)
    )
    
    mod_results = get_mandi_recommendations(mod_req)
    mod_best = mod_results[0] if mod_results else None
    
    # Apply price shock if specified
    if req.expected_price_shock_pct and mod_best:
        shock_factor = 1.0 + (req.expected_price_shock_pct / 100.0)
        mod_best["forecasted_price_per_q"] = round(mod_best["forecasted_price_per_q"] * shock_factor, 1)
        mod_best["gross_revenue"] = round(mod_best["gross_revenue"] * shock_factor, 2)
        mod_best["net_realization"] = round(mod_best["gross_revenue"] - mod_best["total_expenses"], 2)
        mod_best["net_realization_per_q"] = round(mod_best["net_realization"] / (mod_req.quantity_tonnes * 10), 2)

    diff_net = (mod_best["net_realization"] - base_best["net_realization"]) if (mod_best and base_best) else 0.0

    return {
        "base_scenario": base_best,
        "simulated_scenario": mod_best,
        "net_profit_difference_rupees": round(diff_net, 2),
        "impact_analysis": (
            f"The simulated changes result in a net realization shift of Rs.{diff_net:+,.0f}. "
            f"{'Increased costs or price drops have compressed profits; consider immediate dispatch or diversifying mandis.' if diff_net < 0 else 'Favorable market conditions or optimized holding have expanded profit margins.'}"
        )
    }
