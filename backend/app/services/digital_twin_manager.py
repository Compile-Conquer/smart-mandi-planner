"""Digital Twin State Manager and Facility Orchestrator."""
import datetime as dt
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models.db_models import StorageFacilityState, TomatoBatch, SensorReading
from .alert_manager import alert_manager
from .freshness_engine import freshness_engine

DEMO_BATCHES = [
    {
        "batch_id": "TOM-AUTO-99",
        "farmer_id": "DEMO-FARMER-099",
        "farmer_name": "Nagaraj Patil",
        "crop": "Tomato",
        "variety": "Avinash-2 (Hybrid)",
        "quantity_stored_kg": 800.0,
        "quantity_sold_kg": 0.0,
        "remaining_quantity_kg": 800.0,
        "days_ago_harvest": 3,
        "days_ago_entry": 2,
        "initial_maturity_stage": "Breaker",
        "storage_room": "Room A - Bay 1",
        "storage_bay": "Bay 1",
        "is_demo": True
    },
    {
        "batch_id": "TOM-001",
        "farmer_id": "DEMO-FARMER-001",
        "farmer_name": "Ramesh Gowda",
        "crop": "Tomato",
        "variety": "Arka Rakshak (Hybrid)",
        "quantity_stored_kg": 500.0,
        "quantity_sold_kg": 0.0,
        "remaining_quantity_kg": 500.0,
        "days_ago_harvest": 5,
        "days_ago_entry": 4,
        "initial_maturity_stage": "Mature Green",
        "storage_room": "Room A - Bay 2",
        "storage_bay": "Bay 2",
        "is_demo": True
    },
    {
        "batch_id": "TOM-002",
        "farmer_id": "DEMO-FARMER-002",
        "farmer_name": "Shivanna Patil",
        "crop": "Tomato",
        "variety": "Roma Plum",
        "quantity_stored_kg": 300.0,
        "quantity_sold_kg": 0.0,
        "remaining_quantity_kg": 300.0,
        "days_ago_harvest": 7,
        "days_ago_entry": 6,
        "initial_maturity_stage": "Turning",
        "storage_room": "Room A - Bay 2",
        "storage_bay": "Bay 2",
        "is_demo": True
    },
    {
        "batch_id": "TOM-003",
        "farmer_id": "DEMO-FARMER-003",
        "farmer_name": "Anand Kumar",
        "crop": "Tomato",
        "variety": "Desi Local",
        "quantity_stored_kg": 200.0,
        "quantity_sold_kg": 0.0,
        "remaining_quantity_kg": 200.0,
        "days_ago_harvest": 9,
        "days_ago_entry": 8,
        "initial_maturity_stage": "Pink",
        "storage_room": "Room A - Bay 3",
        "storage_bay": "Bay 3",
        "is_demo": True
    }
]

class DigitalTwinManager:
    @staticmethod
    def initialize_facility(db: Session) -> StorageFacilityState:
        facility = db.query(StorageFacilityState).filter(StorageFacilityState.facility_id == "FACILITY_ROOM_A").first()
        if not facility:
            facility = StorageFacilityState(
                facility_id="FACILITY_ROOM_A",
                room_name="Primary Cold Storage Chamber A",
                current_temperature=12.8,
                current_humidity=87.5,
                target_temperature=12.5,
                target_humidity=88.0,
                refrigeration_status="RUNNING",
                power_status="MAINS_ONLINE",
                door_status="CLOSED",
                total_capacity_kg=15000.0,
                occupied_capacity_kg=1800.0,
                connection_status="OFFLINE SIMULATION MODE",
                simulation_active=True,
                active_scenario_name="Normal Storage"
            )
            db.add(facility)
            db.commit()
            db.refresh(facility)
        else:
            if facility.total_capacity_kg != 15000.0:
                facility.total_capacity_kg = 15000.0
                db.commit()

        # Seed initial demo batches if empty
        batch_count = db.query(TomatoBatch).count()
        if batch_count == 0:
            today = dt.date.today()
            for b_info in DEMO_BATCHES:
                h_date = today - dt.timedelta(days=b_info["days_ago_harvest"])
                e_date = today - dt.timedelta(days=b_info["days_ago_entry"])
                
                # Compute initial freshness
                fresh = freshness_engine.estimate_freshness(
                    initial_stage=b_info["initial_maturity_stage"],
                    storage_entry_date=e_date,
                    current_date=today,
                    avg_temp_exposure_c=12.8,
                    avg_humidity_exposure_pct=87.5,
                    variety=b_info["variety"]
                )

                batch = TomatoBatch(
                    batch_id=b_info["batch_id"],
                    farmer_id=b_info["farmer_id"],
                    farmer_name=b_info["farmer_name"],
                    crop=b_info["crop"],
                    variety=b_info["variety"],
                    quantity_stored_kg=b_info["quantity_stored_kg"],
                    quantity_sold_kg=b_info["quantity_sold_kg"],
                    remaining_quantity_kg=b_info["remaining_quantity_kg"],
                    harvest_date=h_date,
                    storage_entry_date=e_date,
                    initial_maturity_stage=b_info["initial_maturity_stage"],
                    current_maturity_stage=fresh["current_stage"],
                    storage_bay=b_info.get("storage_bay", "Bay 1"),
                    storage_room=b_info["storage_room"],
                    quality_condition=fresh["quality_condition"],
                    spoilage_risk=fresh["spoilage_risk"],
                    estimated_shelf_life_days=fresh["estimated_shelf_life_days"],
                    degree_hours_accumulated=fresh["degree_hours_accumulated"],
                    explanation_notes=fresh["explanation"],
                    is_demo=True
                )
                db.add(batch)
            db.commit()
        else:
            # Ensure any existing batches have storage_bay correctly synchronized from storage_room
            existing_batches = db.query(TomatoBatch).all()
            dirty = False
            for b in existing_batches:
                if "Bay 2" in (b.storage_room or "") or b.batch_id in ["TOM-001", "TOM-002"]:
                    if b.storage_bay != "Bay 2":
                        b.storage_bay = "Bay 2"
                        dirty = True
                elif "Bay 3" in (b.storage_room or "") or b.batch_id == "TOM-003":
                    if b.storage_bay != "Bay 3":
                        b.storage_bay = "Bay 3"
                        dirty = True
                elif "Bay 1" in (b.storage_room or "") or b.batch_id == "TOM-AUTO-99":
                    if b.storage_bay != "Bay 1":
                        b.storage_bay = "Bay 1"
                        dirty = True
            if dirty:
                db.commit()

        return facility

    @staticmethod
    def get_facility_state(db: Session) -> Dict[str, Any]:
        facility = DigitalTwinManager.initialize_facility(db)
        
        now = dt.datetime.now()
        is_stale = False
        telemetry_source = "WOKWI_SIMULATOR"

        # Check latest physical/simulated sensor reading
        latest_reading = db.query(SensorReading).order_by(SensorReading.timestamp.desc()).first()
        if latest_reading and latest_reading.timestamp:
            elapsed_sec = (now - latest_reading.timestamp).total_seconds()
            if elapsed_sec <= 60:
                facility.current_temperature = latest_reading.temperature_c
                facility.current_humidity = latest_reading.humidity_pct
                facility.last_sensor_timestamp = latest_reading.timestamp
                facility.connection_status = "WOKWI SENSOR CONNECTED"
                telemetry_source = latest_reading.source or "WOKWI_ESP32_DHT22"
                is_stale = False
            else:
                is_stale = True
                telemetry_source = latest_reading.source or "WOKWI_ESP32_DHT22"
                if facility.connection_status == "WOKWI SENSOR CONNECTED":
                    facility.connection_status = "SENSOR DISCONNECTED"
        else:
            if not facility.simulation_active:
                facility.connection_status = "SENSOR DISCONNECTED"

        # Update occupied capacity across all remaining batches
        active_batches_records = db.query(TomatoBatch).filter(TomatoBatch.remaining_quantity_kg > 0).all()
        occupied = sum(b.remaining_quantity_kg for b in active_batches_records)
        facility.occupied_capacity_kg = occupied
        db.commit()

        # Compute per-bay allocations for Chamber A (Bay 1, Bay 2, Bay 3)
        bays_info = {
            "Bay 1": {"batches": [], "occupied_kg": 0.0, "capacity_kg": 5000.0, "status": "OPTIMAL"},
            "Bay 2": {"batches": [], "occupied_kg": 0.0, "capacity_kg": 5000.0, "status": "OPTIMAL"},
            "Bay 3": {"batches": [], "occupied_kg": 0.0, "capacity_kg": 5000.0, "status": "OPTIMAL"}
        }

        for b in active_batches_records:
            bay_name = b.storage_bay or ("Bay 1" if "Bay 1" in (b.storage_room or "") else ("Bay 2" if "Bay 2" in (b.storage_room or "") else ("Bay 3" if "Bay 3" in (b.storage_room or "") else "Bay 1")))
            if bay_name not in bays_info:
                bays_info[bay_name] = {"batches": [], "occupied_kg": 0.0, "capacity_kg": 5000.0, "status": "OPTIMAL"}
            bays_info[bay_name]["batches"].append({
                "batch_id": b.batch_id,
                "variety": b.variety,
                "remaining_quantity_kg": b.remaining_quantity_kg,
                "spoilage_risk": b.spoilage_risk,
                "current_maturity_stage": b.current_maturity_stage
            })
            bays_info[bay_name]["occupied_kg"] += b.remaining_quantity_kg
            if b.spoilage_risk == "High":
                bays_info[bay_name]["status"] = "ATTENTION"

        for b_name, b_data in bays_info.items():
            b_data["occupied_kg"] = round(b_data["occupied_kg"], 1)
            b_data["available_kg"] = round(max(0.0, b_data["capacity_kg"] - b_data["occupied_kg"]), 1)
            b_data["occupancy_pct"] = round((b_data["occupied_kg"] / b_data["capacity_kg"]) * 100, 1)
            if b_data["occupied_kg"] == 0:
                b_data["status"] = "EMPTY"

        occupancy_pct = round((facility.occupied_capacity_kg / max(1.0, facility.total_capacity_kg)) * 100, 1)
        alerts = alert_manager.evaluate_facility_alerts(db, facility)

        temp_val = round(facility.current_temperature, 1)
        hum_val = round(facility.current_humidity, 1)
        time_str = facility.last_sensor_timestamp.strftime("%I:%M:%S %p") if facility.last_sensor_timestamp else now.strftime("%I:%M:%S %p")

        return {
            "facility_id": facility.facility_id,
            "room_name": facility.room_name,
            "current_temperature": temp_val,
            "temperature_c": temp_val,
            "current_humidity": hum_val,
            "humidity_percent": hum_val,
            "humidity_pct": hum_val,
            "target_temperature": facility.target_temperature,
            "target_humidity": facility.target_humidity,
            "refrigeration_status": facility.refrigeration_status,
            "cooling_status": facility.refrigeration_status,
            "power_status": facility.power_status,
            "door_status": facility.door_status,
            "door_open": facility.door_status == "OPEN",
            "total_capacity_kg": facility.total_capacity_kg,
            "occupied_capacity_kg": round(facility.occupied_capacity_kg, 1),
            "available_capacity_kg": round(max(0.0, facility.total_capacity_kg - facility.occupied_capacity_kg), 1),
            "occupancy_pct": occupancy_pct,
            "connection_status": facility.connection_status,
            "last_sensor_timestamp": facility.last_sensor_timestamp,
            "last_updated_time": time_str,
            "telemetry_source": telemetry_source,
            "is_stale": is_stale,
            "simulation_active": facility.simulation_active,
            "active_scenario_name": facility.active_scenario_name,
            "total_active_batches": len(active_batches_records),
            "total_active_alerts": len(alerts),
            "bays": bays_info
        }

    @staticmethod
    def ingest_sensor_reading(
        db: Session,
        device_id: str,
        temperature_c: float,
        humidity_pct: float,
        source: str = "WOKWI_SIMULATOR",
        is_simulated: bool = False
    ) -> Dict[str, Any]:
        """Ingests live sensor telemetry from Wokwi ESP32 / DHT22."""
        now = dt.datetime.now()
        
        # 1. Log to sensor readings table
        reading = SensorReading(
            device_id=device_id,
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
            timestamp=now,
            is_simulated=is_simulated,
            source=source
        )
        db.add(reading)

        # 2. Update facility state
        facility = DigitalTwinManager.initialize_facility(db)
        facility.current_temperature = temperature_c
        facility.current_humidity = humidity_pct
        facility.last_sensor_timestamp = now
        facility.connection_status = "WOKWI SENSOR CONNECTED" if source != "OFFLINE_SIMULATION" else "OFFLINE SIMULATION MODE"
        facility.simulation_active = is_simulated
        
        # Determine refrigeration response
        if facility.power_status != "OUTAGE":
            if temperature_c > facility.target_temperature + 0.5:
                facility.refrigeration_status = "RUNNING"
            else:
                facility.refrigeration_status = "IDLE"

        db.commit()

        # 3. Evaluate alerts
        alerts = alert_manager.evaluate_facility_alerts(db, facility)

        return {
            "status": "success",
            "message": "Telemetry processed and Digital Twin synchronized.",
            "device_id": device_id,
            "temperature_c": temperature_c,
            "humidity_pct": humidity_pct,
            "connection_status": facility.connection_status,
            "active_alerts_count": len(alerts)
        }

digital_twin_manager = DigitalTwinManager()
