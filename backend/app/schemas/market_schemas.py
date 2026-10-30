"""Pydantic request and response schemas for MandiMitra AI."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CropSummary(BaseModel):
    name: str
    mandis_reporting: int
    avg_price_quintal: float
    min_price_quintal: float
    max_price_quintal: float
    unit: str = "₹/quintal"

class MandiOut(BaseModel):
    mandi_id: str
    mandi_name: str
    district: str
    state: str
    latitude: Optional[float]
    longitude: Optional[float]
    market_type: str
    storage_facility: bool
    cold_storage_per_day_per_q: float
    handling_charge_per_q: float

class PriceHistoryPoint(BaseModel):
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrivals_quintals: Optional[float]
    is_simulated_history: bool

class PriceForecastPoint(BaseModel):
    date: str
    day_offset: int
    day_name: str
    forecast_modal_price: float
    lower_bound_80: float
    upper_bound_80: float
    forecast_arrivals_quintals: float
    uncertainty_range: float

class PriceForecastResponse(BaseModel):
    mandi_id: str
    mandi_name: str
    district: str
    state: str
    commodity: str
    base_date: str
    current_modal_price: float
    forecast_7d_modal: float
    forecast_14d_modal: float
    is_baseline_fallback: bool
    model_used: str
    model_mae: float
    anomalies: Dict[str, Any]
    forecast: List[PriceForecastPoint]

class TransportCostRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    vehicle_tonnage: float = Field(default=5.0, description="Payload capacity in tonnes")
    fuel_rate_per_km: float = Field(default=35.0, description="₹ per km including diesel & driver")

class TransportCostResponse(BaseModel):
    distance_km: float
    travel_time_hours: float
    total_transport_cost: float
    cost_per_quintal: float
    route_type: str

class NetRealizationRequest(BaseModel):
    crop: str = "Tomato"
    quantity_tonnes: float = Field(gt=0, description="Produce quantity in metric tonnes (1 tonne = 10 quintals)")
    harvest_date: str
    selling_date: Optional[str] = None
    farmer_lat: float
    farmer_lon: float
    farmer_location_name: Optional[str] = "Farmer's Field"
    selected_mandi_id: Optional[str] = None
    custom_transport_cost_per_km: Optional[float] = 35.0
    custom_handling_cost_per_q: Optional[float] = 15.0
    custom_storage_cost_per_day_per_q: Optional[float] = 3.5
    custom_spoilage_rate_pct_per_day: Optional[float] = 1.5

class MandiComparisonItem(BaseModel):
    mandi_id: str
    mandi_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    distance_km: float
    travel_time_hours: float
    forecasted_price_per_q: float
    gross_revenue: float
    transport_cost: float
    handling_cost: float
    storage_cost: float
    spoilage_loss: float
    net_realization: float
    net_realization_per_q: float
    roi_score: float
    is_best_choice: bool
    recommended_date: str
    storage_days: int
    recommendation_reason: str

class OptimizationRequest(BaseModel):
    crop: str = "Tomato"
    total_harvest_tonnes: float = Field(gt=0, description="Available quantity in tonnes")
    harvest_date: str
    farmer_lat: float
    farmer_lon: float
    farmer_location_name: str = "Farmer Farm"
    max_mandis_to_split: int = Field(default=3, ge=1, le=5)
    max_share_per_mandi_pct: float = Field(default=70.0, ge=20.0, le=100.0)
    allow_storage: bool = True
    max_storage_days: int = Field(default=7, ge=0, le=14)
    custom_spoilage_pct_per_day: float = 1.5
    custom_cold_storage_rate_per_day_per_q: float = 3.5

class AllocationItem(BaseModel):
    mandi_id: str
    mandi_name: str
    district: str
    state: str
    allocated_tonnes: float
    allocated_quintals: float
    allocation_percentage: float
    selling_date: str
    storage_days: int
    distance_km: float
    expected_price_per_q: float
    gross_revenue: float
    transport_expense: float
    handling_expense: float
    storage_expense: float
    spoilage_expense: float
    net_realization: float
    net_per_quintal: float

class OptimizationResponse(BaseModel):
    total_harvest_tonnes: float
    total_harvest_quintals: float
    total_expected_revenue: float
    total_transport_costs: float
    total_handling_costs: float
    total_storage_costs: float
    total_spoilage_losses: float
    total_net_realization: float
    average_net_per_quintal: float
    allocations: List[AllocationItem]
    comparison_to_local_single_mandi: Dict[str, Any]
    explanation_summary: str
    actionable_takeaways: List[str]

class ScenarioSimulationRequest(BaseModel):
    base_request: NetRealizationRequest
    modified_quantity_tonnes: Optional[float] = None
    modified_selling_date: Optional[str] = None
    modified_transport_cost_multiplier: Optional[float] = 1.0
    expected_price_shock_pct: Optional[float] = 0.0
    spoilage_rate_modifier_pct: Optional[float] = 1.0
