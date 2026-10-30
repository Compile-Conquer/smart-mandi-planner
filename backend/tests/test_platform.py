"""Comprehensive automated integration and unit test suite for MandiMitra AI."""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"

def test_list_crops():
    res = client.get("/api/crops")
    assert res.status_code == 200
    crops = res.json()
    assert len(crops) >= 5
    crop_names = [c["name"] for c in crops]
    assert "Tomato" in crop_names

def test_list_markets():
    res = client.get("/api/markets")
    assert res.status_code == 200
    markets = res.json()
    assert len(markets) >= 15
    for m in markets:
        assert "mandi_id" in m
        assert "latitude" in m
        assert "longitude" in m

def test_price_forecast_uncertainty():
    res = client.get("/api/prices/forecast?mandi_id=karnataka_kolar_apmc&commodity=Tomato&days_ahead=14")
    assert res.status_code == 200
    data = res.json()
    assert "forecast" in data
    assert len(data["forecast"]) == 14
    for pt in data["forecast"]:
        # Verify 80% confidence interval logic: lower <= forecast <= upper
        assert pt["lower_bound_80"] <= pt["forecast_modal_price"] <= pt["upper_bound_80"]
        assert pt["forecast_arrivals_quintals"] > 0

def test_arrivals_forecast():
    res = client.get("/api/arrivals/forecast?mandi_id=karnataka_kolar_apmc&commodity=Tomato")
    assert res.status_code == 200
    data = res.json()
    assert "arrivals_forecast" in data
    assert len(data["arrivals_forecast"]) >= 7

def test_weather_intelligence():
    # Mysuru coordinates
    res = client.get("/api/weather?lat=12.2958&lon=76.6394")
    assert res.status_code == 200
    data = res.json()
    assert "daily_forecast" in data
    assert len(data["daily_forecast"]) == 7
    assert data["risk_level"] in ["LOW", "MODERATE", "HIGH"]

def test_transport_calculation():
    payload = {
        "origin_lat": 12.2958,
        "origin_lon": 76.6394,
        "dest_lat": 12.9716,
        "dest_lon": 77.5667,
        "vehicle_tonnage": 5.0,
        "fuel_rate_per_km": 35.0
    }
    res = client.post("/api/transport/cost", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["distance_km"] > 50.0
    assert data["total_transport_cost"] > 1500.0

def test_net_realization_recommendations():
    payload = {
        "crop": "Tomato",
        "quantity_tonnes": 5.0,
        "harvest_date": "2026-10-30",
        "farmer_lat": 12.2958,
        "farmer_lon": 76.6394,
        "farmer_location_name": "Mysuru Farm"
    }
    res = client.post("/api/recommendations", json=payload)
    assert res.status_code == 200
    mandis = res.json()
    assert len(mandis) >= 5
    top = mandis[0]
    assert top["is_best_choice"] is True
    # Verify math: Gross - Total Expenses == Net Realization
    total_deductions = top["transport_cost"] + top["handling_cost"] + top["storage_cost"] + top["spoilage_loss"]
    assert abs((top["gross_revenue"] - total_deductions) - top["net_realization"]) < 1.0

def test_harvest_allocation_optimizer():
    payload = {
        "crop": "Tomato",
        "total_harvest_tonnes": 10.0,
        "harvest_date": "2026-10-30",
        "farmer_lat": 12.2958,
        "farmer_lon": 76.6394,
        "max_mandis_to_split": 3,
        "max_share_per_mandi_pct": 60.0
    }
    res = client.post("/api/optimize", json=payload)
    assert res.status_code == 200
    data = res.json()
    allocations = data["allocations"]
    assert len(allocations) >= 1
    # Verify sum of allocated tonnes equals total available harvest
    sum_tonnes = sum(a["allocated_tonnes"] for a in allocations)
    assert abs(sum_tonnes - 10.0) < 0.2
    # Verify single mandi cap constraint (<= 60%)
    for a in allocations:
        assert a["allocation_percentage"] <= 60.5

def test_what_if_scenario_simulation():
    payload = {
        "base_request": {
            "crop": "Tomato",
            "quantity_tonnes": 5.0,
            "harvest_date": "2026-10-30",
            "farmer_lat": 12.2958,
            "farmer_lon": 76.6394
        },
        "expected_price_shock_pct": -20.0,
        "modified_transport_cost_multiplier": 1.30
    }
    res = client.post("/api/scenarios", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["net_profit_difference_rupees"] < 0  # Severe price crash + transport hike compresses profit

def test_input_validation_boundary():
    # Negative quantity should be rejected by Pydantic validation (422)
    bad_payload = {
        "crop": "Tomato",
        "quantity_tonnes": -5.0,
        "harvest_date": "2026-10-30",
        "farmer_lat": 12.2958,
        "farmer_lon": 76.6394
    }
    res = client.post("/api/recommendations", json=bad_payload)
    assert res.status_code == 422

if __name__ == "__main__":
    print("Running MandiMitra AI Test Suite...")
    test_health()
    print("[PASS] test_health")
    test_list_crops()
    print("[PASS] test_list_crops")
    test_list_markets()
    print("[PASS] test_list_markets")
    test_price_forecast_uncertainty()
    print("[PASS] test_price_forecast_uncertainty")
    test_arrivals_forecast()
    print("[PASS] test_arrivals_forecast")
    test_weather_intelligence()
    print("[PASS] test_weather_intelligence")
    test_transport_calculation()
    print("[PASS] test_transport_calculation")
    test_net_realization_recommendations()
    print("[PASS] test_net_realization_recommendations")
    test_harvest_allocation_optimizer()
    print("[PASS] test_harvest_allocation_optimizer")
    test_what_if_scenario_simulation()
    print("[PASS] test_what_if_scenario_simulation")
    test_input_validation_boundary()
    print("[PASS] test_input_validation_boundary")
    print("\nALL 11 UNIT AND INTEGRATION TESTS PASSED SUCCESSFULLY!")
