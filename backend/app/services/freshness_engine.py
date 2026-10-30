"""Biological Freshness, Ripeness, and Spoilage Risk Estimation Engine.
Provides crop-specific postharvest degradation models and degree-hours kinetics."""
import datetime as dt
from typing import Dict, Any, List

# Crop-specific maturity & storage stages
CROP_STAGES = {
    "tomato": [
        "Green",
        "Breaker",
        "Turning",
        "Pink",
        "Light Red",
        "Red",
        "Overripe"
    ],
    "potato": [
        "Dormant",
        "Eye Peeping",
        "Early Sprouting",
        "Sprouted",
        "Tuber Softening"
    ],
    "onion": [
        "Cured & Dormant",
        "Neck Firm",
        "Neck Softening",
        "Internal Sprouting",
        "Root Emergence"
    ],
    "brinjal": [
        "Firm Glossy",
        "Peak Market Fresh",
        "Calyx Yellowing",
        "Dull & Pitted",
        "Senescent & Flaccid"
    ],
    "green chilli": [
        "Turgid Dark Green",
        "Pale Green",
        "Turning / Color Break",
        "Red Ripe",
        "Shrivelled & Dehydrated"
    ]
}

# Crop physiological baselines
CROP_PROFILES = {
    "tomato": {
        "base_temp_c": 10.0,
        "optimal_min_c": 11.5,
        "optimal_max_c": 14.5,
        "optimal_rh_min": 85.0,
        "optimal_rh_max": 92.0,
        "nominal_shelf_life_days": 18,
        "chilling_hazard_c": 10.0,
        "heat_acceleration_c": 16.0
    },
    "potato": {
        "base_temp_c": 4.0,
        "optimal_min_c": 7.0,
        "optimal_max_c": 10.0,
        "optimal_rh_min": 90.0,
        "optimal_rh_max": 95.0,
        "nominal_shelf_life_days": 60,
        "chilling_hazard_c": 4.0,
        "heat_acceleration_c": 15.0
    },
    "onion": {
        "base_temp_c": 0.0,
        "optimal_min_c": 0.5,
        "optimal_max_c": 3.0,
        "optimal_rh_min": 65.0,
        "optimal_rh_max": 75.0,
        "nominal_shelf_life_days": 90,
        "chilling_hazard_c": -1.0,
        "heat_acceleration_c": 18.0
    },
    "brinjal": {
        "base_temp_c": 9.0,
        "optimal_min_c": 10.0,
        "optimal_max_c": 12.0,
        "optimal_rh_min": 90.0,
        "optimal_rh_max": 95.0,
        "nominal_shelf_life_days": 12,
        "chilling_hazard_c": 8.0,
        "heat_acceleration_c": 15.0
    },
    "green chilli": {
        "base_temp_c": 7.0,
        "optimal_min_c": 8.0,
        "optimal_max_c": 10.0,
        "optimal_rh_min": 90.0,
        "optimal_rh_max": 95.0,
        "nominal_shelf_life_days": 15,
        "chilling_hazard_c": 7.0,
        "heat_acceleration_c": 14.0
    }
}

class CommodityFreshnessEngine:
    @staticmethod
    def estimate_freshness(
        initial_stage: str,
        storage_entry_date: dt.date,
        current_date: dt.date,
        avg_temp_exposure_c: float = 12.5,
        avg_humidity_exposure_pct: float = 88.0,
        crop: str = "Tomato",
        variety: str = "Hybrid-Local",
        hours_unfavorable_temp: float = 0.0
    ) -> Dict[str, Any]:
        """Calculates biological maturity progression, thermal degree-hours, and spoilage risk."""
        crop_key = (crop or "tomato").lower()
        if crop_key not in CROP_STAGES:
            crop_key = "tomato"

        stages = CROP_STAGES[crop_key]
        profile = CROP_PROFILES.get(crop_key, CROP_PROFILES["tomato"])

        # Map initial stage or default to early stage
        stage_map = {s.lower(): i for i, s in enumerate(stages)}
        # normalize initial stage names (e.g. "Mature Green" -> "Green")
        normalized_init = initial_stage.replace("Mature ", "").strip() if initial_stage else stages[0]
        start_idx = stage_map.get(normalized_init.lower(), 1 if len(stages) > 1 else 0)

        days_in_storage = max(0, (current_date - storage_entry_date).days)

        # 1. Degree-Days ripening / senescence progression
        effective_temp = max(0.0, avg_temp_exposure_c - profile["base_temp_c"])
        degree_days = days_in_storage * effective_temp
        degree_hours = round(degree_days * 24.0, 1)

        # Thermal rate multiplier
        temp_mult = 1.0
        if avg_temp_exposure_c > profile["heat_acceleration_c"] + 5.0:
            temp_mult = 2.2
        elif avg_temp_exposure_c > profile["heat_acceleration_c"]:
            temp_mult = 1.5
        elif avg_temp_exposure_c < profile["chilling_hazard_c"]:
            temp_mult = 0.6  # Physiological stoppage / chilling injury

        # Stage jump calculation
        nominal_days_per_stage = max(2.5, profile["nominal_shelf_life_days"] / len(stages))
        stage_jump = int((days_in_storage * temp_mult) / nominal_days_per_stage)
        current_idx = min(len(stages) - 1, start_idx + stage_jump)
        current_stage = stages[current_idx]

        # 2. Spoilage Risk Calculation (Score 0 to 100)
        spoilage_score = 0.0
        reasons = []

        # Duration factor
        nominal_life = profile["nominal_shelf_life_days"]
        duration_ratio = days_in_storage / max(1.0, nominal_life)
        if duration_ratio >= 1.0:
            spoilage_score += 50.0
            reasons.append(f"Storage duration ({days_in_storage} days) exceeds nominal freshness threshold ({nominal_life} days).")
        elif duration_ratio >= 0.6:
            spoilage_score += 25.0
            reasons.append(f"{days_in_storage} days in storage; produce is in mid-to-late marketing window.")
        else:
            reasons.append(f"Fresh stock ({days_in_storage} days held in controlled chamber).")

        # Temperature thermal exposure factor
        if hours_unfavorable_temp >= 4.0 or avg_temp_exposure_c >= profile["heat_acceleration_c"] + 4.0:
            spoilage_score += 35.0
            reasons.append(f"Elevated temperature excursion ({avg_temp_exposure_c:.1f}°C) accelerating respiration & ethylene decay.")
        elif hours_unfavorable_temp >= 1.5 or avg_temp_exposure_c >= profile["heat_acceleration_c"]:
            spoilage_score += 18.0
            reasons.append(f"Temperature is slightly above optimal baseline ({avg_temp_exposure_c:.1f}°C).")

        # Chilling injury risk
        if avg_temp_exposure_c < profile["chilling_hazard_c"]:
            spoilage_score += 30.0
            reasons.append(f"Chilling hazard: Temp ({avg_temp_exposure_c:.1f}°C) is below physiological floor ({profile['chilling_hazard_c']}°C).")

        # Relative humidity risk
        if avg_humidity_exposure_pct < profile["optimal_rh_min"] - 10.0:
            spoilage_score += 20.0
            reasons.append(f"Low relative humidity ({avg_humidity_exposure_pct:.1f}%) causes rapid transpiration and shriveling.")
        elif avg_humidity_exposure_pct > profile["optimal_rh_max"] + 5.0:
            spoilage_score += 20.0
            reasons.append(f"High relative humidity ({avg_humidity_exposure_pct:.1f}%) risks surface condensation and fungal pathogen sporulation.")

        # Cap score between 0 and 100
        final_risk_score = int(min(100, max(5, round(spoilage_score))))

        # Classification
        if final_risk_score >= 60 or current_idx >= len(stages) - 1:
            spoilage_risk = "High"
            quality_condition = "At Risk"
            shelf_life_left = max(1, round(nominal_life * 0.15))
            recommendation = f"Urgent dispatch recommended: Produce in {current_stage} stage with elevated spoilage score ({final_risk_score}/100). Dispatch to nearest wholesale APMC within 24-48 hours."
        elif final_risk_score >= 30 or current_idx >= len(stages) - 2:
            spoilage_risk = "Medium"
            quality_condition = "Fair"
            shelf_life_left = max(3, round(nominal_life * (1.0 - duration_ratio)))
            recommendation = f"Marketable window open: Current {current_stage} maturity offers optimal wholesale appeal. Plan mandi dispatch within {shelf_life_left} days."
        else:
            spoilage_risk = "Low"
            quality_condition = "Excellent"
            shelf_life_left = max(7, round(nominal_life - days_in_storage))
            recommendation = f"Optimal holding condition: Stored at {avg_temp_exposure_c:.1f}°C and {avg_humidity_exposure_pct:.1f}% RH. Produce remains firm with ~{shelf_life_left} days commercial shelf life."

        explanation = (
            f"Estimated {current_stage} maturity for {crop} ({variety}) after {days_in_storage} days at ~{avg_temp_exposure_c:.1f}°C, {avg_humidity_exposure_pct:.1f}% RH. "
            f"Degree-hours accumulated: {degree_hours} °C-h. " + " ".join(reasons)
        )

        return {
            "crop": crop,
            "variety": variety,
            "initial_stage": stages[start_idx] if start_idx < len(stages) else initial_stage,
            "current_stage": current_stage,
            "stage_index": current_idx,
            "days_in_storage": days_in_storage,
            "spoilage_risk": spoilage_risk,
            "spoilage_risk_score": final_risk_score,
            "quality_condition": quality_condition,
            "estimated_shelf_life_days": shelf_life_left,
            "degree_hours_accumulated": degree_hours,
            "current_facility_temp_c": round(avg_temp_exposure_c, 1),
            "current_facility_hum_pct": round(avg_humidity_exposure_pct, 1),
            "recommendation": recommendation,
            "reasons": reasons,
            "explanation": explanation
        }

freshness_engine = CommodityFreshnessEngine()
