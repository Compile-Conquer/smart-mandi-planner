"""Pydantic schemas for Digital Twin, Storage, Batch Inventory, and Alerts."""
from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ==========================================
# BATCH INVENTORY SCHEMAS
# ==========================================

class BatchCreateRequest(BaseModel):
    batch_id: str = Field(..., example="TOM-004", description="Unique batch identifier")
    farmer_id: Optional[str] = Field(default="DEMO-FARMER-001", example="DEMO-FARMER-001")
    farmer_name: str = Field(default="Farmer", example="Ramesh Gowda")
    crop: str = Field(default="Tomato")
    variety: str = Field(default="Hybrid-Local", example="Arka Rakshak")
    quantity_stored_kg: Optional[float] = Field(default=None, gt=0, example=450.0, description="Quantity stored in kilograms")
    initial_quantity_kg: Optional[float] = Field(default=None, gt=0, example=450.0, description="Alternative field for initial quantity")
    harvest_date: str = Field(..., example="2026-10-28")
    storage_entry_date: Optional[str] = Field(default=None, example="2026-10-29")
    entry_date: Optional[str] = Field(default=None, example="2026-10-29")
    initial_maturity_stage: Optional[str] = Field(default="Breaker", example="Breaker")
    current_maturity_stage: Optional[str] = Field(default=None)
    storage_bay: Optional[str] = Field(default="Bay 1", example="Bay 1")
    storage_room: Optional[str] = Field(default="Room A - Bay 1")
    quality_grade: Optional[str] = Field(default="A")
    notes: Optional[str] = None
    is_demo: bool = Field(default=False)

class BatchUpdateRequest(BaseModel):
    farmer_name: Optional[str] = None
    variety: Optional[str] = None
    storage_bay: Optional[str] = None
    storage_room: Optional[str] = None
    current_maturity_stage: Optional[str] = None
    quality_condition: Optional[str] = None
    spoilage_risk: Optional[str] = None

class BatchSaleRequest(BaseModel):
    quantity_sold_kg: float = Field(gt=0, description="Quantity sold in kg, must not exceed remaining stock")
    sale_price_per_kg: float = Field(gt=0, description="Realized sale price in Rs./kg")
    sale_date: Optional[str] = None
    destination_mandi: Optional[str] = None
    buyer_name: Optional[str] = "APMC Wholesaler"
    buyer_mandi: Optional[str] = "Kolar APMC"
    notes: Optional[str] = None

class BatchSaleOut(BaseModel):
    id: int
    batch_id: str
    quantity_sold_kg: float
    sale_price_per_kg: float
    sale_date: datetime
    buyer_name: str
    buyer_mandi: Optional[str] = None
    destination_mandi: Optional[str] = None
    net_sale_amount: float
    total_amount: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class TomatoBatchOut(BaseModel):
    id: int
    batch_id: str
    farmer_id: str
    farmer_name: str
    crop: str
    variety: str
    quantity_stored_kg: float
    initial_quantity_kg: Optional[float] = None
    quantity_sold_kg: float
    remaining_quantity_kg: float
    harvest_date: date
    storage_entry_date: date
    initial_maturity_stage: str
    current_maturity_stage: str
    storage_bay: str = "Bay 1"
    storage_room: str = "Room A - Bay 1"
    quality_condition: str
    quality_grade: Optional[str] = "A"
    spoilage_risk: str
    estimated_shelf_life_days: int
    shelf_life_days_remaining: Optional[int] = None
    degree_hours_accumulated: float
    explanation_notes: Optional[str] = None
    is_demo: bool
    created_at: datetime
    sales: List[BatchSaleOut] = []

    class Config:
        from_attributes = True

# ==========================================
# SENSOR & DIGITAL TWIN SCHEMAS
# ==========================================

class SensorTelemetryIn(BaseModel):
    device_id: str = Field(default="WOKWI_ESP32_DHT22_01")
    temperature_c: Optional[float] = Field(default=None, ge=-20.0, le=70.0)
    temperature: Optional[float] = Field(default=None)
    humidity_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    humidity: Optional[float] = Field(default=None)
    door_open: Optional[bool] = False
    power_status: Optional[str] = "Grid Active"
    timestamp: Optional[str] = None
    is_simulated: bool = False
    source: str = "WOKWI_SIMULATOR"

class FacilityStateOut(BaseModel):
    facility_id: str
    room_name: str
    current_temperature: float
    temperature_c: float
    current_humidity: float
    humidity_percent: float
    humidity_pct: float
    target_temperature: float
    target_humidity: float
    refrigeration_status: str
    cooling_status: Optional[str] = None
    power_status: str
    door_status: str
    door_open: bool = False
    total_capacity_kg: float
    occupied_capacity_kg: float
    available_capacity_kg: float
    occupancy_pct: float = 0.0
    connection_status: str
    last_sensor_timestamp: Optional[datetime] = None
    last_updated_time: Optional[str] = None
    telemetry_source: str = "WOKWI_SIMULATOR"
    is_stale: bool = False
    simulation_active: bool
    active_scenario_name: str
    total_active_batches: int
    total_active_alerts: int
    bays: Optional[Dict[str, Any]] = None

# ==========================================
# ALERT SCHEMAS
# ==========================================

class StorageAlertOut(BaseModel):
    id: int
    alert_id: str
    alert_type: str
    severity: str
    occurrence_count: int = 1
    title: str
    description: str
    message: Optional[str] = None
    batch_id: Optional[str] = None
    event_source: str
    recommended_action: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(ACTIVE|ACKNOWLEDGED|RESOLVED)$")

# ==========================================
# WHAT-IF STORAGE SIMULATION SCHEMAS
# ==========================================

class StorageSimulationRequest(BaseModel):
    scenario_type: Optional[str] = Field(default=None, example="POWER_FAILURE_2H")
    scenario_name: Optional[str] = Field(default=None, example="2-Hour Grid Power Outage")
    ambient_temperature_c: Optional[float] = Field(default=None, description="Outside ambient temp in °C")
    ambient_temp_c: Optional[float] = Field(default=None)
    duration_hours: float = Field(default=2.0, ge=0.25, le=72.0)
    ambient_humidity_pct: Optional[float] = Field(default=None)
    ambient_rh: Optional[float] = Field(default=None)
    initial_temperature_c: Optional[float] = None
    initial_humidity_pct: Optional[float] = None

class SimulationStepPoint(BaseModel):
    minute: int
    hour_label: Optional[str] = None
    temperature_c: float
    humidity_pct: float
    refrigeration_status: str
    power_status: str
    door_status: str

class BatchImpactSummary(BaseModel):
    batch_id: str
    variety: str
    storage_bay: Optional[str] = "Bay 1"
    quantity_kg: float
    initial_stage: str
    original_stage: Optional[str] = None
    estimated_stage_after_scenario: str
    projected_stage: Optional[str] = None
    baseline_spoilage_risk: str
    simulated_spoilage_risk: str
    projected_spoilage_risk: Optional[str] = None
    shelf_life_days_lost: Optional[float] = 1.0
    risk_elevated: bool
    urgency_recommendation: str

class StorageSimulationResponse(BaseModel):
    scenario_type: str
    scenario_name: str
    duration_hours: float
    initial_temperature_c: float
    final_temperature_c: float
    initial_humidity_pct: float
    final_humidity_pct: float
    ambient_temperature_c: float
    peak_temperature_c: float
    final_humidity_percent: float
    quality_loss_percentage: float
    timeline: List[SimulationStepPoint]
    hourly_timeline: List[Dict[str, Any]] = []
    affected_batches: List[BatchImpactSummary]
    total_stored_kg: float
    quantity_urgent_inspection_kg: float
    quantity_normal_kg: float
    strategic_advice: str
    recommendation: Optional[str] = None
    comparison_with_normal: Dict[str, Any]
