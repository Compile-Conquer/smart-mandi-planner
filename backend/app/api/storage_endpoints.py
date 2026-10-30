"""FastAPI Router for Storage Intelligence, Digital Twin, Batch Inventory, and Alerts."""
import datetime as dt
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session

from ..database.connection import get_db
from ..models.db_models import (
    TomatoBatch,
    BatchSaleRecord,
    SensorReading,
    StorageFacilityState,
    StorageAlert
)
from ..schemas.storage_schemas import (
    BatchCreateRequest,
    BatchUpdateRequest,
    BatchSaleRequest,
    BatchSaleOut,
    TomatoBatchOut,
    SensorTelemetryIn,
    FacilityStateOut,
    StorageAlertOut,
    AlertStatusUpdate,
    StorageSimulationRequest,
    StorageSimulationResponse
)
from ..services.digital_twin_manager import digital_twin_manager
from ..services.freshness_engine import freshness_engine
from ..services.alert_manager import alert_manager
from ..services.storage_simulation_engine import storage_simulation_engine

router = APIRouter(prefix="/api/storage", tags=["Cold Storage Digital Twin & Inventory"])

# ==========================================
# 1. FACILITY & SENSOR TELEMETRY APIS
# ==========================================

@router.get("/facility", response_model=FacilityStateOut)
def get_facility_overview(db: Session = Depends(get_db)):
    """Retrieve Digital Twin cold-storage chamber state, environmental metrics, and capacities."""
    return digital_twin_manager.get_facility_state(db)

@router.post("/sensor/dht22")
def ingest_sensor_telemetry(telemetry: SensorTelemetryIn, db: Session = Depends(get_db)):
    """Ingest live temperature & humidity telemetry from Wokwi ESP32 + DHT22."""
    if telemetry.temperature_c < -20.0 or telemetry.temperature_c > 70.0:
        raise HTTPException(status_code=422, detail="Temperature reading out of physical sensor bounds.")
    if telemetry.humidity_pct < 0.0 or telemetry.humidity_pct > 100.0:
        raise HTTPException(status_code=422, detail="Humidity reading out of physical percentage bounds.")

    return digital_twin_manager.ingest_sensor_reading(
        db=db,
        device_id=telemetry.device_id,
        temperature_c=telemetry.temperature_c,
        humidity_pct=telemetry.humidity_pct,
        source=telemetry.source,
        is_simulated=telemetry.is_simulated
    )

@router.get("/sensor/history")
def get_sensor_history(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve timestamped environmental history readings."""
    readings = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).limit(limit).all()
    # Reverse to return chronologically
    return [
        {
            "id": r.id,
            "device_id": r.device_id,
            "temperature_c": round(r.temperature_c, 1),
            "humidity_pct": round(r.humidity_pct, 1),
            "timestamp": r.timestamp.strftime("%H:%M:%S") if r.timestamp else "",
            "full_timestamp": r.timestamp.isoformat() if r.timestamp else "",
            "source": r.source,
            "is_simulated": r.is_simulated
        }
        for r in reversed(readings)
    ]

@router.post("/sensor/toggle-mode")
def toggle_simulation_mode(offline_mode: bool = Query(True), db: Session = Depends(get_db)):
    """Toggle between Wokwi live hardware/simulator listening and Offline Simulation Mode."""
    facility = digital_twin_manager.initialize_facility(db)
    facility.simulation_active = offline_mode
    facility.connection_status = "OFFLINE SIMULATION MODE" if offline_mode else "SENSOR DISCONNECTED"
    db.commit()
    return {
        "status": "success",
        "simulation_active": facility.simulation_active,
        "connection_status": facility.connection_status
    }

# ==========================================
# 2. MULTI-BATCH INVENTORY APIS
# ==========================================

@router.get("/batches", response_model=List[TomatoBatchOut])
def list_batches(
    search: Optional[str] = None,
    spoilage_risk: Optional[str] = None,
    maturity_stage: Optional[str] = None,
    include_exhausted: bool = True,
    db: Session = Depends(get_db)
):
    """Retrieve all tomato batches with optional filtering and sorting."""
    # Ensure demo batches exist
    digital_twin_manager.initialize_facility(db)
    
    query = db.query(TomatoBatch)
    if not include_exhausted:
        query = query.filter(TomatoBatch.remaining_quantity_kg > 0)
    if spoilage_risk and spoilage_risk != "ALL":
        query = query.filter(TomatoBatch.spoilage_risk == spoilage_risk)
    if maturity_stage and maturity_stage != "ALL":
        query = query.filter(TomatoBatch.current_maturity_stage == maturity_stage)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            TomatoBatch.batch_id.ilike(term) | 
            TomatoBatch.farmer_name.ilike(term) | 
            TomatoBatch.variety.ilike(term)
        )
        
    batches = query.order_by(TomatoBatch.created_at.desc()).all()
    return batches

@router.get("/batches/{batch_id}", response_model=TomatoBatchOut)
def get_batch_details(batch_id: str, db: Session = Depends(get_db)):
    """Retrieve full batch metadata, freshness condition, and sale history."""
    batch = db.query(TomatoBatch).filter(TomatoBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    return batch

@router.post("/batches", response_model=TomatoBatchOut)
def create_batch(req: BatchCreateRequest, db: Session = Depends(get_db)):
    """Create a new stored tomato batch with strict parameter validation."""
    b_id = req.batch_id.strip().upper()
    existing = db.query(TomatoBatch).filter(TomatoBatch.batch_id == b_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Batch ID '{b_id}' already exists.")

    try:
        h_date = dt.datetime.strptime(req.harvest_date, "%Y-%m-%d").date()
        entry_str = req.storage_entry_date or req.entry_date or req.harvest_date
        e_date = dt.datetime.strptime(entry_str, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid date format. Use YYYY-MM-DD.")

    if e_date < h_date:
        raise HTTPException(status_code=422, detail="Storage entry date cannot be before harvest date.")

    qty = req.quantity_stored_kg if req.quantity_stored_kg is not None else req.initial_quantity_kg
    if not qty or qty <= 0:
        raise HTTPException(status_code=422, detail="Storage quantity must be greater than zero.")

    facility = digital_twin_manager.initialize_facility(db)
    available_space = facility.total_capacity_kg - facility.occupied_capacity_kg
    if qty > available_space:
        raise HTTPException(
            status_code=400, 
            detail=f"Requested storage quantity ({qty} kg) exceeds available capacity ({available_space} kg)."
        )

    bay = req.storage_bay or ("Bay 1" if "Bay 1" in (req.storage_room or "") else ("Bay 2" if "Bay 2" in (req.storage_room or "") else ("Bay 3" if "Bay 3" in (req.storage_room or "") else "Bay 1")))
    room = req.storage_room or f"Room A - {bay}"
    stage = req.initial_maturity_stage or req.current_maturity_stage or "Breaker"

    # Calculate initial freshness
    today = dt.date.today()
    fresh = freshness_engine.estimate_freshness(
        initial_stage=stage,
        storage_entry_date=e_date,
        current_date=today,
        avg_temp_exposure_c=facility.current_temperature,
        avg_humidity_exposure_pct=facility.current_humidity,
        variety=req.variety
    )

    batch = TomatoBatch(
        batch_id=b_id,
        farmer_id=req.farmer_id or "DEMO-FARMER-001",
        farmer_name=req.farmer_name or "Farmer",
        crop=req.crop or "Tomato",
        variety=req.variety or "Hybrid-Local",
        quantity_stored_kg=qty,
        quantity_sold_kg=0.0,
        remaining_quantity_kg=qty,
        harvest_date=h_date,
        storage_entry_date=e_date,
        initial_maturity_stage=stage,
        current_maturity_stage=fresh["current_stage"],
        storage_bay=bay,
        storage_room=room,
        quality_condition=fresh["quality_condition"],
        spoilage_risk=fresh["spoilage_risk"],
        estimated_shelf_life_days=fresh["estimated_shelf_life_days"],
        degree_hours_accumulated=fresh["degree_hours_accumulated"],
        explanation_notes=fresh["explanation"],
        is_demo=req.is_demo
    )
    db.add(batch)
    facility.occupied_capacity_kg += qty
    db.commit()
    db.refresh(batch)
    return batch

@router.patch("/batches/{batch_id}", response_model=TomatoBatchOut)
def update_batch(batch_id: str, req: BatchUpdateRequest, db: Session = Depends(get_db)):
    """Update batch details."""
    batch = db.query(TomatoBatch).filter(TomatoBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    for field, value in req.dict(exclude_unset=True).items():
        setattr(batch, field, value)

    db.commit()
    db.refresh(batch)
    return batch

@router.post("/batches/{batch_id}/sales", response_model=BatchSaleOut)
def record_batch_sale(batch_id: str, req: BatchSaleRequest, db: Session = Depends(get_db)):
    """Record a partial or full sale against a batch with strict stock validation."""
    batch = db.query(TomatoBatch).filter(TomatoBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    if req.quantity_sold_kg <= 0:
        raise HTTPException(status_code=422, detail="Quantity sold must be greater than zero.")

    if req.quantity_sold_kg > batch.remaining_quantity_kg:
        raise HTTPException(
            status_code=400, 
            detail=f"Sale quantity ({req.quantity_sold_kg} kg) exceeds available stock ({batch.remaining_quantity_kg} kg)."
        )

    # Create sale record
    total_amount = round(req.quantity_sold_kg * req.sale_price_per_kg, 2)
    destination = req.destination_mandi or req.buyer_mandi or "Kolar APMC"
    sale = BatchSaleRecord(
        batch_id=batch_id,
        quantity_sold_kg=req.quantity_sold_kg,
        sale_price_per_kg=req.sale_price_per_kg,
        buyer_name=req.buyer_name or "APMC Wholesaler",
        buyer_mandi=destination,
        destination_mandi=destination,
        net_sale_amount=total_amount,
        total_amount=total_amount,
        notes=req.notes
    )
    db.add(sale)

    # Update batch remaining stock strictly: Remaining = Original - Total Sold
    batch.quantity_sold_kg += req.quantity_sold_kg
    batch.remaining_quantity_kg = round(batch.quantity_stored_kg - batch.quantity_sold_kg, 2)

    # Free up facility capacity
    facility = db.query(StorageFacilityState).filter(StorageFacilityState.facility_id == "FACILITY_ROOM_A").first()
    if facility:
        facility.occupied_capacity_kg = max(0.0, facility.occupied_capacity_kg - req.quantity_sold_kg)

    db.commit()
    db.refresh(sale)
    return sale

# ==========================================
# 3. FRESHNESS & ALERTS APIS
# ==========================================

@router.get("/freshness/{batch_id}")
def get_batch_freshness(batch_id: str, db: Session = Depends(get_db)):
    """Recalculate and return biological ripeness stage and spoilage risk."""
    batch = db.query(TomatoBatch).filter(TomatoBatch.batch_id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    facility = digital_twin_manager.initialize_facility(db)
    today = dt.date.today()
    fresh = freshness_engine.estimate_freshness(
        initial_stage=batch.initial_maturity_stage,
        storage_entry_date=batch.storage_entry_date,
        current_date=today,
        avg_temp_exposure_c=facility.current_temperature,
        avg_humidity_exposure_pct=facility.current_humidity,
        variety=batch.variety
    )

    batch.current_maturity_stage = fresh["current_stage"]
    batch.quality_condition = fresh["quality_condition"]
    batch.spoilage_risk = fresh["spoilage_risk"]
    batch.estimated_shelf_life_days = fresh["estimated_shelf_life_days"]
    batch.degree_hours_accumulated = fresh["degree_hours_accumulated"]
    batch.explanation_notes = fresh["explanation"]
    db.commit()

    return {
        "batch_id": batch.batch_id,
        "variety": batch.variety,
        "crop": batch.crop,
        "storage_bay": batch.storage_bay or "Bay 1",
        "current_stage": fresh["current_stage"],
        "initial_stage": batch.initial_maturity_stage,
        "spoilage_risk": fresh["spoilage_risk"],
        "spoilage_risk_score": fresh.get("spoilage_risk_score", 15.0),
        "estimated_shelf_life_days": fresh["estimated_shelf_life_days"],
        "degree_hours_accumulated": fresh["degree_hours_accumulated"],
        "quality_condition": fresh["quality_condition"],
        "explanation": fresh["explanation"],
        "recommendation": fresh.get("recommendation", "Sell produce promptly to capture peak market value."),
        "current_facility_temp_c": round(facility.current_temperature, 1),
        "remaining_quantity_kg": batch.remaining_quantity_kg,
        "freshness": fresh
    }

@router.get("/alerts", response_model=List[StorageAlertOut])
def list_active_alerts(db: Session = Depends(get_db)):
    """Retrieve all active and acknowledged facility alerts."""
    return db.query(StorageAlert).filter(StorageAlert.status.in_(["ACTIVE", "ACKNOWLEDGED"])).order_by(StorageAlert.created_at.desc()).all()

@router.get("/alerts/history", response_model=List[StorageAlertOut])
def list_alert_history(limit: int = 40, db: Session = Depends(get_db)):
    """Retrieve alert audit history."""
    return db.query(StorageAlert).order_by(StorageAlert.created_at.desc()).limit(limit).all()

@router.post("/alerts/{alert_id}/status")
def update_alert_status(alert_id: str, action: AlertStatusUpdate, db: Session = Depends(get_db)):
    """Acknowledge or resolve an active alert."""
    alert = db.query(StorageAlert).filter(StorageAlert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail=f"Alert '{alert_id}' not found.")

    alert.status = action.status
    if action.status == "RESOLVED":
        alert.resolved_at = dt.datetime.now()

    db.commit()
    return {"status": "success", "alert_id": alert_id, "new_status": alert.status}

# ==========================================
# 4. WHAT-IF STORAGE SIMULATION API
# ==========================================

@router.post("/simulate", response_model=StorageSimulationResponse)
def execute_storage_simulation(req: StorageSimulationRequest, db: Session = Depends(get_db)):
    """Run physics-based What-If simulation (e.g. 2hr/4hr power outage) and compute batch impact."""
    facility = digital_twin_manager.initialize_facility(db)
    init_t = req.initial_temperature_c if req.initial_temperature_c is not None else facility.current_temperature
    init_h = req.initial_humidity_pct if req.initial_humidity_pct is not None else facility.current_humidity

    ambient_temp = req.ambient_temperature_c if req.ambient_temperature_c is not None else (req.ambient_temp_c if req.ambient_temp_c is not None else 30.0)

    # Determine scenario type from scenario_type, scenario_name, or default
    raw_type = req.scenario_type or req.scenario_name or "POWER_FAILURE_2H"
    sc_upper = raw_type.upper()
    if "4" in sc_upper and ("HOUR" in sc_upper or "4H" in sc_upper or "SEVERE" in sc_upper):
        resolved_type = "POWER_FAILURE_4H"
    elif "2" in sc_upper and ("HOUR" in sc_upper or "2H" in sc_upper):
        resolved_type = "POWER_FAILURE_2H"
    elif "TEMP" in sc_upper or "COMPRESSOR" in sc_upper or "SPIKE" in sc_upper:
        resolved_type = "TEMP_SPIKE"
    elif "HUMID" in sc_upper or "DROP" in sc_upper or "DEHUMID" in sc_upper:
        resolved_type = "HUMIDITY_DROP"
    elif "DOOR" in sc_upper or "BREACH" in sc_upper:
        resolved_type = "DOOR_OPEN_PROLONGED"
    elif "NORMAL" in sc_upper:
        resolved_type = "NORMAL"
    else:
        resolved_type = raw_type

    return storage_simulation_engine.simulate_storage_scenario(
        db=db,
        scenario_type=resolved_type,
        ambient_temp_c=ambient_temp,
        duration_hours=req.duration_hours,
        initial_temp_c=init_t,
        initial_hum_pct=init_h
    )
