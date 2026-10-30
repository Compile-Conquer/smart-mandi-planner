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
def get_weather(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    location_name: Optional[str] = Query("Farm Location")
):
    """Retrieve 7-day meteorological forecast, live current conditions, and harvesting/transport risk evaluation."""
    return weather_service.get_weather_forecast(lat, lon, location_name)

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
def get_arrivals_forecast(mandi_id: str, commodity: str = "Tomato", days_ahead: int = 14):
    """Retrieve historical market arrivals, ML forecasted inflow, and supply pressure dynamics."""
    try:
        return prediction_service.forecast_mandi_arrivals(mandi_id=mandi_id, commodity=commodity, days_ahead=days_ahead)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Arrival forecast error: {str(e)}")

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
    """Interactive What-If Scenario Simulator: recalculates profit under varying market parameters."""
    base_req = req.base_request
    
    # 1. Base Run
    base_results = get_mandi_recommendations(base_req)
    if not base_results:
        raise HTTPException(status_code=400, detail="Unable to calculate baseline recommendations.")
        
    # If farmer selected a specific mandi, evaluate that; otherwise use the top recommended mandi
    target_mandi_id = base_req.selected_mandi_id
    if target_mandi_id:
        base_match = next((m for m in base_results if m["mandi_id"] == target_mandi_id), base_results[0])
    else:
        base_match = base_results[0]
        target_mandi_id = base_match["mandi_id"]

    # 2. Modified Run on the SAME mandi target
    mod_qty = float(req.modified_quantity_tonnes if req.modified_quantity_tonnes is not None else base_req.quantity_tonnes)
    mod_selling_date = req.modified_selling_date or base_req.selling_date or base_req.harvest_date
    trans_mult = float(req.modified_transport_cost_multiplier if req.modified_transport_cost_multiplier is not None else 1.0)
    spoil_mult = float(req.spoilage_rate_modifier_pct if req.spoilage_rate_modifier_pct is not None else 1.0)
    price_shock = float(req.expected_price_shock_pct if req.expected_price_shock_pct is not None else 0.0)

    mod_req = NetRealizationRequest(
        crop=base_req.crop,
        quantity_tonnes=mod_qty,
        harvest_date=base_req.harvest_date,
        selling_date=mod_selling_date,
        farmer_lat=base_req.farmer_lat,
        farmer_lon=base_req.farmer_lon,
        farmer_location_name=base_req.farmer_location_name,
        selected_mandi_id=target_mandi_id,
        custom_transport_cost_per_km=(base_req.custom_transport_cost_per_km or 35.0) * trans_mult,
        custom_handling_cost_per_q=base_req.custom_handling_cost_per_q or 15.0,
        custom_storage_cost_per_day_per_q=base_req.custom_storage_cost_per_day_per_q or 3.5,
        custom_spoilage_rate_pct_per_day=(base_req.custom_spoilage_rate_pct_per_day or 1.5) * spoil_mult
    )
    
    mod_results = get_mandi_recommendations(mod_req)
    mod_match = next((m for m in mod_results if m["mandi_id"] == target_mandi_id), mod_results[0]) if mod_results else None

    if not mod_match:
        raise HTTPException(status_code=500, detail="Scenario calculation failed for modified parameters.")

    # Apply price shock
    if price_shock != 0.0:
        shock_factor = 1.0 + (price_shock / 100.0)
        mod_match["forecasted_price_per_q"] = round(mod_match["forecasted_price_per_q"] * shock_factor, 1)
        mod_match["gross_revenue"] = round(mod_qty * 10.0 * mod_match["forecasted_price_per_q"], 2)
        total_ded = mod_match["transport_cost"] + mod_match["handling_cost"] + mod_match["storage_cost"] + mod_match["spoilage_loss"]
        mod_match["total_expenses"] = round(total_ded, 2)
        mod_match["net_realization"] = round(mod_match["gross_revenue"] - total_ded, 2)
        mod_match["net_realization_per_q"] = round(mod_match["net_realization"] / (mod_qty * 10.0), 2)

    diff_net = round(mod_match["net_realization"] - base_match["net_realization"], 2)
    pct_change = round((diff_net / max(1.0, abs(base_match["net_realization"]))) * 100.0, 1)

    if diff_net < 0:
        advice = (
            f"Adverse market conditions or cost increases compress expected net profit by Rs.{abs(diff_net):,.0f} ({pct_change}%). "
            f"Consider dispatching earlier to avoid storage spoilage, or evaluate closer mandis to curb freight expenses."
        )
    elif diff_net > 0:
        advice = (
            f"Favorable conditions or holding strategy expanded net realization by +Rs.{diff_net:,.0f} (+{pct_change}%). "
            f"The increased sale price more than justifies the logistics and holding commitments."
        )
    else:
        advice = "No net variance observed under the current simulated parameters."

    return {
        "mandi_id": target_mandi_id,
        "mandi_name": base_match["mandi_name"],
        "base_scenario": base_match,
        "simulated_scenario": mod_match,
        "net_profit_difference_rupees": diff_net,
        "net_profit_difference_percentage": pct_change,
        "metrics_comparison": {
            "gross_revenue_diff": round(mod_match["gross_revenue"] - base_match["gross_revenue"], 2),
            "transport_cost_diff": round(mod_match["transport_cost"] - base_match["transport_cost"], 2),
            "storage_cost_diff": round(mod_match["storage_cost"] - base_match["storage_cost"], 2),
            "spoilage_loss_diff": round(mod_match["spoilage_loss"] - base_match["spoilage_loss"], 2),
            "total_expenses_diff": round(mod_match["total_expenses"] - base_match["total_expenses"], 2),
            "net_per_quintal_diff": round(mod_match["net_realization_per_q"] - base_match["net_realization_per_q"], 2)
        },
        "impact_analysis": advice
    }
