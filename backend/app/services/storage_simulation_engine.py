"""Storage Digital Twin What-If Environmental Simulation Engine."""
import math
import datetime as dt
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from ..models.db_models import TomatoBatch, StorageFacilityState
from .freshness_engine import freshness_engine

class StorageSimulationEngine:
    @staticmethod
    def simulate_storage_scenario(
        db: Session,
        scenario_type: str = "POWER_FAILURE_2H",
        ambient_temp_c: float = 30.0,
        duration_hours: float = 2.0,
        initial_temp_c: Optional[float] = 12.5,
        initial_hum_pct: Optional[float] = 88.0
    ) -> Dict[str, Any]:
        """Runs physics-based differential simulation of cold storage chamber and batch impact."""
        t0 = initial_temp_c if initial_temp_c is not None else 12.5
        h0 = initial_hum_pct if initial_hum_pct is not None else 88.0
        total_minutes = int(duration_hours * 60)
        step_interval = max(2, total_minutes // 40)  # Generate 30–50 smooth timeline points
        
        timeline = []
        curr_t = t0
        curr_h = h0
        refrig_status = "RUNNING"
        power_status = "MAINS_ONLINE"
        door_status = "CLOSED"
        scenario_name = scenario_type

        # Thermal loss coefficients
        k_loss = 0.012     # Chamber thermal leakage per minute during outage
        k_cool = 0.045     # Active refrigeration cooling recovery per minute
        k_door = 0.08      # Air exchange when bay door is open

        for m in range(0, total_minutes + 1, step_interval):
            if scenario_type == "POWER_FAILURE_2H":
                scenario_name = "2-Hour Power Failure & Cooling Recovery"
                outage_duration = 120
                if m <= outage_duration:
                    power_status = "OUTAGE"
                    refrig_status = "OFF"
                    # Asymptotic temperature rise towards ambient
                    curr_t += (ambient_temp_c - curr_t) * (1 - math.exp(-k_loss * step_interval))
                    curr_h = max(70.0, curr_h - 0.12 * step_interval)
                else:
                    power_status = "MAINS_ONLINE"
                    refrig_status = "RUNNING"
                    # Active cooling recovery down to setpoint (12.5°C)
                    curr_t -= (curr_t - 12.5) * (1 - math.exp(-k_cool * step_interval))
                    curr_h = min(88.0, curr_h + 0.25 * step_interval)

            elif scenario_type == "POWER_FAILURE_4H":
                scenario_name = "Extended 4-Hour Power Failure"
                outage_duration = 240
                if m <= outage_duration:
                    power_status = "OUTAGE"
                    refrig_status = "OFF"
                    curr_t += (ambient_temp_c - curr_t) * (1 - math.exp(-k_loss * step_interval))
                    curr_h = max(65.0, curr_h - 0.15 * step_interval)
                else:
                    power_status = "MAINS_ONLINE"
                    refrig_status = "RUNNING"
                    curr_t -= (curr_t - 12.5) * (1 - math.exp(-k_cool * step_interval))
                    curr_h = min(88.0, curr_h + 0.25 * step_interval)

            elif scenario_type == "TEMP_SPIKE":
                scenario_name = "Compressor Thermostat Drift (+6°C Spike)"
                power_status = "MAINS_ONLINE"
                refrig_status = "DEGRADED"
                # Rises to 18.5°C over first 30 mins, then stays high
                target_spike = 18.5
                curr_t += (target_spike - curr_t) * 0.08 * step_interval
                curr_h = max(74.0, curr_h - 0.1 * step_interval)

            elif scenario_type == "HUMIDITY_DROP":
                scenario_name = "Dry Air Infiltration (Humidity Drop)"
                power_status = "MAINS_ONLINE"
                refrig_status = "RUNNING"
                curr_t = t0 + 0.5 * math.sin(m / 20.0)
                # Rapid humidity plunge to 60%
                curr_h = max(60.0, curr_h - (curr_h - 60.0) * 0.05 * step_interval)

            elif scenario_type == "DOOR_OPEN_PROLONGED":
                scenario_name = "Bay Door Open Disturbance (45 mins)"
                if m <= 45:
                    door_status = "OPEN"
                    curr_t += (ambient_temp_c - curr_t) * (1 - math.exp(-k_door * step_interval))
                    curr_h = max(68.0, curr_h - 0.3 * step_interval)
                else:
                    door_status = "CLOSED"
                    curr_t -= (curr_t - 12.5) * (1 - math.exp(-k_cool * step_interval))
                    curr_h = min(88.0, curr_h + 0.2 * step_interval)

            else:  # NORMAL
                scenario_name = "Normal Cold Storage Operation"
                power_status = "MAINS_ONLINE"
                refrig_status = "RUNNING"
                door_status = "CLOSED"
                curr_t = 12.5 + 0.3 * math.sin(m / 30.0)
                curr_h = 88.0 + 0.8 * math.cos(m / 25.0)

            timeline.append({
                "minute": m,
                "hour_label": f"T+{round(m / 60.0, 1)}h",
                "temperature_c": round(curr_t, 2),
                "humidity_pct": round(curr_h, 1),
                "refrigeration_status": refrig_status,
                "power_status": power_status,
                "door_status": door_status
            })

        # Calculate average simulated exposure
        avg_sim_temp = sum(pt["temperature_c"] for pt in timeline) / max(1, len(timeline))
        avg_sim_hum = sum(pt["humidity_pct"] for pt in timeline) / max(1, len(timeline))
        peak_temp = max(pt["temperature_c"] for pt in timeline)
        final_temp = timeline[-1]["temperature_c"]
        final_hum = timeline[-1]["humidity_pct"]

        # Hours of thermal excursion (> 16.0°C)
        hours_excursion = sum(step_interval for pt in timeline if pt["temperature_c"] >= 16.0) / 60.0
        quality_loss = min(100.0, max(0.0, round((peak_temp - 12.5) * 4.2 + (hours_excursion * 8.5), 1)))

        # Subsample for hourly_timeline (10-15 points for chart)
        sample_step = max(1, len(timeline) // 12)
        hourly_timeline = [timeline[i] for i in range(0, len(timeline), sample_step)]
        if timeline[-1] not in hourly_timeline:
            hourly_timeline.append(timeline[-1])

        # Assess Impact on Stored Inventory Batches
        batches = db.query(TomatoBatch).filter(TomatoBatch.remaining_quantity_kg > 0).all()
        affected_summaries = []
        urgent_kg = 0.0
        total_kg = 0.0

        for b in batches:
            total_kg += b.remaining_quantity_kg
            # Calculate baseline freshness vs simulated freshness
            today = dt.date.today()
            sim_fresh = freshness_engine.estimate_freshness(
                initial_stage=b.initial_maturity_stage,
                storage_entry_date=b.storage_entry_date,
                current_date=today,
                avg_temp_exposure_c=avg_sim_temp,
                avg_humidity_exposure_pct=avg_sim_hum,
                variety=b.variety,
                hours_unfavorable_temp=hours_excursion
            )

            risk_elevated = (b.spoilage_risk == "Low" and sim_fresh["spoilage_risk"] in ["Medium", "High"]) or (
                b.spoilage_risk == "Medium" and sim_fresh["spoilage_risk"] == "High"
            )

            if sim_fresh["spoilage_risk"] == "High" or risk_elevated:
                urgency = "URGENT INSPECTION REQUIRED: Schedule immediate market dispatch within 24–48 hours to avert loss."
                urgent_kg += b.remaining_quantity_kg
            elif sim_fresh["spoilage_risk"] == "Medium":
                urgency = "MONITOR CLOSELY: Review firmness grading and prepare for prompt commercial sale."
            else:
                urgency = "STABLE: Batch condition remains satisfactory within commercial tolerance."

            days_lost = round(1.5 if hours_excursion > 1.0 else 0.5, 1)

            affected_summaries.append({
                "batch_id": b.batch_id,
                "variety": b.variety,
                "storage_bay": b.storage_bay or "Bay 1",
                "quantity_kg": b.remaining_quantity_kg,
                "initial_stage": b.current_maturity_stage,
                "original_stage": b.current_maturity_stage,
                "estimated_stage_after_scenario": sim_fresh["current_stage"],
                "projected_stage": sim_fresh["current_stage"],
                "baseline_spoilage_risk": b.spoilage_risk,
                "simulated_spoilage_risk": sim_fresh["spoilage_risk"],
                "projected_spoilage_risk": sim_fresh["spoilage_risk"],
                "shelf_life_days_lost": days_lost,
                "risk_elevated": risk_elevated,
                "urgency_recommendation": urgency
            })

        # Strategic Actionable Advice
        if hours_excursion >= 2.0 or peak_temp >= 20.0:
            advice = (
                f"Severe scenario impact: Chamber experienced {hours_excursion:.1f} hours of thermal excursion with peak temperature reaching {peak_temp:.1f}°C. "
                f"A total of {urgent_kg:,.0f} kg ({round((urgent_kg/max(1.0, total_kg))*100)}% of stock) should be physically inspected and dispatched to wholesale mandis promptly."
            )
        else:
            advice = (
                f"Manageable impact: Chamber temperature peaked at {peak_temp:.1f}°C. "
                "Cooling recovery was sufficient to maintain batch viability without catastrophic spoilage escalation."
            )

        return {
            "scenario_type": scenario_type,
            "scenario_name": scenario_name,
            "duration_hours": duration_hours,
            "initial_temperature_c": t0,
            "final_temperature_c": final_temp,
            "initial_humidity_pct": h0,
            "final_humidity_pct": final_hum,
            "ambient_temperature_c": ambient_temp_c,
            "peak_temperature_c": round(peak_temp, 1),
            "final_humidity_percent": round(final_hum, 1),
            "quality_loss_percentage": quality_loss,
            "timeline": timeline,
            "hourly_timeline": hourly_timeline,
            "affected_batches": affected_summaries,
            "total_stored_kg": total_kg,
            "quantity_urgent_inspection_kg": urgent_kg,
            "quantity_normal_kg": total_kg - urgent_kg,
            "strategic_advice": advice,
            "recommendation": advice,
            "comparison_with_normal": {
                "normal_avg_temp": 12.5,
                "simulated_avg_temp": round(avg_sim_temp, 1),
                "peak_temperature_c": round(peak_temp, 1),
                "temp_delta_c": round(avg_sim_temp - 12.5, 1),
                "hours_above_16c": round(hours_excursion, 1)
            }
        }

storage_simulation_engine = StorageSimulationEngine()
