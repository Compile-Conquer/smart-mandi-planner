"""Comprehensive Storage & API Endpoint Integration Test."""
import sys
from pathlib import Path
import datetime as dt

# Ensure backend root is on path
BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.database.connection import SessionLocal, auto_migrate
from app.services.digital_twin_manager import digital_twin_manager
from app.services.storage_simulation_engine import storage_simulation_engine
from app.models.db_models import TomatoBatch, StorageFacilityState, SensorReading

def test_api_integration():
    auto_migrate()
    db = SessionLocal()
    try:
        print("\n--- 1. Testing Facility State & Bay Allocation ---")
        facility_state = digital_twin_manager.get_facility_state(db)
        print(f"Facility: {facility_state['room_name']}")
        print(f"Core Temp: {facility_state['temperature_c']} C (current_temperature: {facility_state['current_temperature']})")
        print(f"Humidity: {facility_state['humidity_percent']}% (current_humidity: {facility_state['current_humidity']})")
        print(f"Connection Status: {facility_state['connection_status']}")
        print(f"Total Capacity: {facility_state['total_capacity_kg']} kg, Occupied: {facility_state['occupied_capacity_kg']} kg")
        
        bays = facility_state["bays"]
        assert "Bay 1" in bays and "Bay 2" in bays and "Bay 3" in bays
        for bay_name, b_info in bays.items():
            print(f"  {bay_name}: {b_info['occupied_kg']} kg / {b_info['capacity_kg']} kg [{b_info['status']}] - {len(b_info['batches'])} batches")
        assert bays["Bay 1"]["occupied_kg"] > 0 or bays["Bay 2"]["occupied_kg"] > 0
        print("[PASS] Facility State & Bays successfully verified.")

        print("\n--- 2. Testing Wokwi DHT22 Sensor Telemetry Ingestion ---")
        sensor_res = digital_twin_manager.ingest_sensor_reading(
            db=db,
            device_id="WOKWI_ESP32_DHT22_01",
            temperature_c=13.2,
            humidity_pct=89.5,
            source="Wokwi ESP32 + DHT22"
        )
        assert sensor_res["status"] == "success"
        
        # Verify twin synchronized
        synced_state = digital_twin_manager.get_facility_state(db)
        print(f"Synced Temp: {synced_state['temperature_c']} C")
        print(f"Synced Humidity: {synced_state['humidity_percent']}%")
        print(f"Synced Status: {synced_state['connection_status']}")
        assert synced_state["temperature_c"] == 13.2
        assert synced_state["humidity_percent"] == 89.5
        assert synced_state["connection_status"] == "WOKWI SENSOR CONNECTED"
        print("[PASS] Wokwi Sensor Telemetry ingested & Twin synchronized.")

        print("\n--- 3. Testing What-If Storage Simulation Engine ---")
        sim_res = storage_simulation_engine.simulate_storage_scenario(
            db=db,
            scenario_type="POWER_FAILURE_2H",
            ambient_temp_c=32.0,
            duration_hours=2.0
        )
        print(f"Scenario: {sim_res['scenario_name']}")
        print(f"Peak Temp: {sim_res['peak_temperature_c']} C")
        print(f"Final Humidity: {sim_res['final_humidity_percent']}%")
        print(f"Quality Loss Index: {sim_res['quality_loss_percentage']}%")
        print(f"Timeline points: {len(sim_res['timeline'])}, Hourly sample points: {len(sim_res['hourly_timeline'])}")
        print(f"Affected batches: {len(sim_res['affected_batches'])}")
        assert sim_res["peak_temperature_c"] > 13.2
        assert len(sim_res["hourly_timeline"]) > 0
        assert "hour_label" in sim_res["hourly_timeline"][0]
        assert len(sim_res["affected_batches"]) > 0
        print("[PASS] What-If Storage Simulation validated.")

        print("\n--- 4. Testing Freshness Analysis & Spoilage Scoring ---")
        from app.services.freshness_engine import freshness_engine
        fresh = freshness_engine.estimate_freshness(
            initial_stage="Breaker",
            storage_entry_date=dt.date.today() - dt.timedelta(days=3),
            current_date=dt.date.today(),
            avg_temp_exposure_c=13.2,
            avg_humidity_exposure_pct=89.5,
            variety="Arka Rakshak"
        )
        print(f"Ripeness Stage: {fresh['current_stage']}")
        print(f"Shelf Life Days: {fresh['estimated_shelf_life_days']}")
        print(f"Degree Hours: {fresh['degree_hours_accumulated']} C-h")
        print(f"Spoilage Risk Score: {fresh['spoilage_risk_score']}/100 ({fresh['spoilage_risk']})")
        assert fresh["estimated_shelf_life_days"] > 0
        assert fresh["spoilage_risk_score"] >= 0
        assert fresh["current_stage"] in ["Green", "Breaker", "Turning", "Pink", "Light Red", "Red"]
        print("[PASS] Biological freshness analysis verified.")

        print("\n=======================================================")
        print(">>> ALL INTEGRATION AND BUG FIX VERIFICATIONS PASSED <<<")
        print("=======================================================")
    finally:
        db.close()

if __name__ == "__main__":
    test_api_integration()
