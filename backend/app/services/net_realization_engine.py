"""Net Realization Engine: Maximizes farmer net profit taking into account all real-world expenses."""
import datetime as dt
from typing import Dict, Any, List
from .transport_service import transport_service
from ..ml.prediction_service import prediction_service

class NetRealizationEngine:
    @staticmethod
    def calculate_single_mandi_realization(
        crop: str,
        quantity_tonnes: float,
        harvest_date_str: str,
        selling_date_str: str,
        farmer_lat: float,
        farmer_lon: float,
        mandi_info: Dict[str, Any],
        custom_transport_per_km: float = 35.0,
        custom_handling_per_q: float = 15.0,
        custom_storage_per_day_per_q: float = 3.5,
        custom_spoilage_rate_pct_day: float = 1.5,
    ) -> Dict[str, Any]:
        # 1. Quantity conversions (1 Tonne = 10 Quintals)
        total_quintals = round(quantity_tonnes * 10.0, 2)
        
        # 2. Date and storage timeline
        d_harvest = dt.datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
        d_sell = dt.datetime.strptime(selling_date_str, "%Y-%m-%d").date()
        storage_days = max(0, (d_sell - d_harvest).days)
        
        # 3. Transport calculations
        mandi_lat = mandi_info.get("latitude", 12.9716)
        mandi_lon = mandi_info.get("longitude", 77.5667)
        route = transport_service.calculate_route(
            origin_lat=farmer_lat,
            origin_lon=farmer_lon,
            dest_lat=mandi_lat,
            dest_lon=mandi_lon,
            vehicle_tonnage=quantity_tonnes,
            fuel_rate_per_km=custom_transport_per_km
        )
        transport_cost = route["total_transport_cost"]
        
        # 4. Forecast Price for the targeted selling date
        mandi_id = mandi_info.get("mandi_id", "")
        forecast_res = prediction_service.forecast_mandi_prices(
            mandi_id=mandi_id,
            commodity=crop,
            days_ahead=max(7, storage_days + 1),
            start_date_str=harvest_date_str
        )
        
        # Match day offset
        expected_price_per_q = forecast_res["current_modal_price"]
        for pt in forecast_res["forecast"]:
            if pt["day_offset"] == storage_days or pt["date"] == selling_date_str:
                expected_price_per_q = pt["forecast_modal_price"]
                break
                
        # 5. Financial Breakdown
        gross_revenue = round(total_quintals * expected_price_per_q, 2)
        handling_cost = round(total_quintals * custom_handling_per_q, 2)
        
        # Storage cost (0 if sold on harvest day)
        storage_rate = mandi_info.get("cold_storage_per_day_per_q", custom_storage_per_day_per_q)
        storage_cost = round(total_quintals * storage_days * storage_rate, 2)
        
        # Spoilage / Quality degradation loss
        # Even with cold storage, perishable produce faces ~1.5% loss per day
        spoilage_fraction = min(0.35, (storage_days * (custom_spoilage_rate_pct_day / 100.0)))
        spoilage_loss = round(gross_revenue * spoilage_fraction, 2)
        
        # NET REALIZATION = GROSS - (TRANSPORT + HANDLING + STORAGE + SPOILAGE)
        total_deductions = round(transport_cost + handling_cost + storage_cost + spoilage_loss, 2)
        net_realization = round(gross_revenue - total_deductions, 2)
        net_per_quintal = round(net_realization / total_quintals, 2)
        
        # Profit Margin / ROI Score
        roi_score = round((net_realization / max(1.0, total_deductions)), 2)
        
        return {
            "mandi_id": mandi_id,
            "mandi_name": mandi_info.get("mandi_name", mandi_id),
            "district": mandi_info.get("district", "Unknown"),
            "state": mandi_info.get("state", "Karnataka"),
            "latitude": mandi_lat,
            "longitude": mandi_lon,
            "distance_km": route["distance_km"],
            "travel_time_hours": route["travel_time_hours"],
            "storage_days": storage_days,
            "recommended_date": selling_date_str,
            "forecasted_price_per_q": round(expected_price_per_q, 2),
            "gross_revenue": gross_revenue,
            "transport_cost": transport_cost,
            "handling_cost": handling_cost,
            "storage_cost": storage_cost,
            "spoilage_loss": spoilage_loss,
            "total_expenses": total_deductions,
            "net_realization": net_realization,
            "net_realization_per_q": net_per_quintal,
            "roi_score": roi_score,
            "is_best_choice": False,
            "recommendation_reason": ""
        }

    @staticmethod
    def compare_mandis_and_find_optimal_date(
        crop: str,
        quantity_tonnes: float,
        harvest_date_str: str,
        farmer_lat: float,
        farmer_lon: float,
        mandis_list: List[Dict[str, Any]],
        max_holding_days: int = 5,
        custom_transport_per_km: float = 35.0,
        custom_handling_per_q: float = 15.0,
        custom_storage_per_day_per_q: float = 3.5,
        custom_spoilage_rate_pct_day: float = 1.5,
    ) -> List[Dict[str, Any]]:
        d_harvest = dt.datetime.strptime(harvest_date_str, "%Y-%m-%d").date()
        evaluated_candidates = []

        for mandi in mandis_list:
            best_mandi_option = None
            best_net = -float("inf")
            
            # Evaluate selling immediately on harvest day vs holding up to max_holding_days
            for offset in range(max_holding_days + 1):
                target_date = d_harvest + dt.timedelta(days=offset)
                res = NetRealizationEngine.calculate_single_mandi_realization(
                    crop=crop,
                    quantity_tonnes=quantity_tonnes,
                    harvest_date_str=harvest_date_str,
                    selling_date_str=target_date.strftime("%Y-%m-%d"),
                    farmer_lat=farmer_lat,
                    farmer_lon=farmer_lon,
                    mandi_info=mandi,
                    custom_transport_per_km=custom_transport_per_km,
                    custom_handling_per_q=custom_handling_per_q,
                    custom_storage_per_day_per_q=custom_storage_per_day_per_q,
                    custom_spoilage_rate_pct_day=custom_spoilage_rate_pct_day
                )
                
                if res["net_realization"] > best_net:
                    best_net = res["net_realization"]
                    best_mandi_option = res
                    
            if best_mandi_option:
                evaluated_candidates.append(best_mandi_option)

        # Sort descending by Net Realization (Highest Expected Profit)
        evaluated_candidates.sort(key=lambda x: x["net_realization"], reverse=True)
        
        if evaluated_candidates:
            top = evaluated_candidates[0]
            top["is_best_choice"] = True
            
            days = top["storage_days"]
            if days == 0:
                top["recommendation_reason"] = (
                    f"Immediate dispatch on harvest date ({top['recommended_date']}) yields the maximum net profit (Rs.{top['net_realization']:,.0f}) "
                    f"by avoiding Rs.{top['storage_cost'] + top['spoilage_loss']:,.0f} in storage and spoilage costs."
                )
            else:
                top["recommendation_reason"] = (
                    f"Holding for {days} days until {top['recommended_date']} is projected to increase market price by "
                    f"Rs.{top['forecasted_price_per_q'] - top['forecasted_price_per_q'] / 1.05:,.0f}/q, more than compensating for storage expenses."
                )

        return evaluated_candidates

net_realization_engine = NetRealizationEngine()
