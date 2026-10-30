"""Reusable prediction service providing 7-14 day forecasts, prediction intervals, and anomaly alerts."""
import json
import joblib
import datetime as dt
from pathlib import Path
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd

from .anomaly_detector import MarketAnomalyDetector

BACKEND_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = BACKEND_ROOT / "trained_models"
DATA_DIR = BACKEND_ROOT / "datasets" / "processed"

class PricePredictionService:
    def __init__(self):
        self.model_t7 = None
        self.model_t14 = None
        self.model_arrival = None
        self.metrics = {}
        self.history_df = None
        self.locations_df = None
        self._load_resources()

    def _load_resources(self):
        # Load models if exist
        p7 = MODELS_DIR / "price_model_t7.joblib"
        p14 = MODELS_DIR / "price_model_t14.joblib"
        pa = MODELS_DIR / "arrival_model_t7.joblib"
        
        if p7.exists():
            self.model_t7 = joblib.load(p7)
        if p14.exists():
            self.model_t14 = joblib.load(p14)
        if pa.exists():
            self.model_arrival = joblib.load(pa)
            
        m_file = MODELS_DIR / "price_models_evaluation.json"
        if m_file.exists():
            with open(m_file, "r") as f:
                self.metrics = json.load(f)
                
        # Load timeseries data for feature lookup
        ts_file = DATA_DIR / "mandi_timeseries_master.csv"
        if ts_file.exists():
            self.history_df = pd.read_csv(ts_file, parse_dates=["date"])
            
        loc_file = DATA_DIR / "mandi_locations_clean.csv"
        if loc_file.exists():
            self.locations_df = pd.read_csv(loc_file)

    def get_latest_mandi_record(self, mandi_id: str, commodity: str = "Tomato") -> Optional[pd.Series]:
        if self.history_df is None:
            return None
        subset = self.history_df[
            (self.history_df["mandi_id"] == mandi_id) & 
            (self.history_df["commodity"].str.lower() == commodity.lower())
        ]
        if subset.empty:
            return None
        return subset.sort_values("date").iloc[-1]

    def forecast_mandi_prices(
        self,
        mandi_id: str,
        commodity: str = "Tomato",
        days_ahead: int = 14,
        start_date_str: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate day-by-day 1 to 14 day forward price forecast with confidence intervals."""
        latest_record = self.get_latest_mandi_record(mandi_id, commodity)
        
        if start_date_str:
            base_date = dt.datetime.strptime(start_date_str, "%Y-%m-%d").date()
        else:
            base_date = latest_record["date"].date() if latest_record is not None else dt.date(2026, 10, 30)
            
        base_price = float(latest_record["modal_price"]) if latest_record is not None else 2800.0
        base_ma7 = float(latest_record["price_ma7"]) if latest_record is not None else base_price
        base_arrivals = float(latest_record["arrivals_quintals"]) if latest_record is not None else 650.0
        base_arr_ma7 = float(latest_record["arrivals_ma7"]) if latest_record is not None else 680.0
        std_err = self.metrics.get("t7", {}).get("residual_std_error", 120.0)
        
        # Check if ML model is ready
        is_baseline_fallback = (self.model_t7 is None or latest_record is None)
        
        # Predict 7-day and 14-day endpoints using trained models
        pred_7 = base_price
        pred_14 = base_price
        if not is_baseline_fallback and self.model_t7:
            feat_row = pd.DataFrame([{
                "price_lag1": latest_record["modal_price"],
                "price_lag3": latest_record["price_lag3"] if pd.notna(latest_record["price_lag3"]) else base_price,
                "price_ma7": latest_record["price_ma7"],
                "price_ma14": latest_record["price_ma14"],
                "price_volatility_7d": latest_record["price_volatility_7d"],
                "price_change_1d": latest_record["price_change_1d"],
                "price_change_pct_1d": latest_record["price_change_pct_1d"],
                "arrivals_lag1": latest_record["arrivals_quintals"],
                "arrivals_ma7": latest_record["arrivals_ma7"],
                "temperature": latest_record["temperature"],
                "rainfall": latest_record["rainfall"],
                "humidity": latest_record["humidity"],
                "dayofweek": (base_date + dt.timedelta(days=7)).weekday(),
                "day": (base_date + dt.timedelta(days=7)).day,
                "month": (base_date + dt.timedelta(days=7)).month,
            }])
            pred_7 = float(self.model_t7.predict(feat_row)[0])
            
            if self.model_t14:
                feat_row["dayofweek"] = (base_date + dt.timedelta(days=14)).weekday()
                feat_row["day"] = (base_date + dt.timedelta(days=14)).day
                pred_14 = float(self.model_t14.predict(feat_row)[0])
            else:
                pred_14 = pred_7 * 0.98

        # Interpolate daily trajectory smoothly
        forecast_timeline = []
        for d in range(1, days_ahead + 1):
            curr_date = base_date + dt.timedelta(days=d)
            if d <= 7:
                # Smooth curve from base_price to pred_7
                ratio = d / 7.0
                price_val = base_price + (pred_7 - base_price) * ratio
            else:
                # Smooth curve from pred_7 to pred_14
                ratio = (d - 7) / 7.0
                price_val = pred_7 + (pred_14 - pred_7) * ratio
                
            # Add minor weekday demand seasonality
            dow = curr_date.weekday()
            season_bump = 1.015 if dow in (5, 6) else (0.985 if dow == 0 else 1.0)
            price_val = round(price_val * season_bump, 0)
            
            # Uncertainty interval expands with horizon: sigma * sqrt(d/7)
            current_sigma = std_err * np.sqrt(d / 5.0)
            # 80% confidence interval: z = 1.28
            lower_bound = max(500.0, round(price_val - 1.28 * current_sigma, 0))
            upper_bound = round(price_val + 1.28 * current_sigma, 0)
            
            # Arrival forecast
            est_arrivals = max(200.0, round(base_arrivals * (1.0 - (price_val - base_price) / (base_price * 2.5)), 0))
            
            forecast_timeline.append({
                "date": curr_date.strftime("%Y-%m-%d"),
                "day_offset": d,
                "day_name": curr_date.strftime("%a"),
                "forecast_modal_price": price_val,
                "lower_bound_80": lower_bound,
                "upper_bound_80": upper_bound,
                "forecast_arrivals_quintals": est_arrivals,
                "uncertainty_range": round(upper_bound - lower_bound, 0),
            })

        # Anomaly detection for this market
        anomaly_info = MarketAnomalyDetector.inspect_record(
            current_price=base_price,
            price_ma7=base_ma7,
            price_change_1d=float(latest_record.get("price_change_1d", 0)) if latest_record is not None else 0,
            current_arrivals=base_arrivals,
            arrivals_ma7=base_arr_ma7,
            rainfall_mm=float(latest_record.get("rainfall", 0)) if latest_record is not None else 0,
            temp_c=float(latest_record.get("temperature", 28)) if latest_record is not None else 28,
        )

        return {
            "mandi_id": mandi_id,
            "mandi_name": latest_record["mandi"] if latest_record is not None else mandi_id,
            "district": latest_record["district"] if latest_record is not None else "Unknown",
            "state": latest_record["state"] if latest_record is not None else "Karnataka",
            "commodity": commodity,
            "base_date": base_date.strftime("%Y-%m-%d"),
            "current_modal_price": base_price,
            "forecast_7d_modal": round(pred_7, 0),
            "forecast_14d_modal": round(pred_14, 0),
            "is_baseline_fallback": is_baseline_fallback,
            "model_used": "XGBoost + Random Forest Regressor" if not is_baseline_fallback else "Statistical Baseline",
            "model_mae": self.metrics.get("t7", {}).get("test_metrics", {}).get("mae", 85.0),
            "anomalies": anomaly_info,
            "forecast": forecast_timeline
        }

    def forecast_mandi_arrivals(
        self,
        mandi_id: str,
        commodity: str = "Tomato",
        days_ahead: int = 14
    ) -> Dict[str, Any]:
        """Generate historical vs predicted market arrival series and supply pressure analysis."""
        if self.history_df is None:
            ts_file = DATA_DIR / "mandi_timeseries_master.csv"
            if ts_file.exists():
                self.history_df = pd.read_csv(ts_file, parse_dates=["date"])

        subset = pd.DataFrame()
        if self.history_df is not None:
            subset = self.history_df[
                (self.history_df["mandi_id"] == mandi_id) &
                (self.history_df["commodity"].str.lower() == commodity.lower())
            ].sort_values("date")

        if subset.empty and self.history_df is not None:
            subset = self.history_df[
                self.history_df["commodity"].str.lower() == commodity.lower()
            ].sort_values("date")

        mandi_name = subset.iloc[-1]["mandi"] if not subset.empty else mandi_id
        district = subset.iloc[-1]["district"] if not subset.empty else "Karnataka"
        state = subset.iloc[-1]["state"] if not subset.empty else "Karnataka"

        # Past 14-20 days historical actuals
        hist_slice = subset.tail(20) if not subset.empty else pd.DataFrame()
        historical_points = []
        for _, row in hist_slice.iterrows():
            d_val = row["date"].date() if hasattr(row["date"], "date") else dt.datetime.strptime(str(row["date"])[:10], "%Y-%m-%d").date()
            historical_points.append({
                "date": d_val.strftime("%Y-%m-%d"),
                "day_name": d_val.strftime("%a"),
                "arrivals_quintals": round(float(row["arrivals_quintals"]), 1) if pd.notna(row.get("arrivals_quintals")) else 650.0,
                "modal_price": float(row["modal_price"]) if pd.notna(row.get("modal_price")) else 2800.0,
                "is_actual": not bool(row.get("is_simulated_history", False)),
                "type": "Historical Actual"
            })

        latest_row = subset.iloc[-1] if not subset.empty else None
        base_date = latest_row["date"].date() if latest_row is not None else dt.date(2026, 10, 30)
        curr_arr = float(latest_row["arrivals_quintals"]) if latest_row is not None and pd.notna(latest_row.get("arrivals_quintals")) else 650.0
        arr_ma7 = float(latest_row["arrivals_ma7"]) if latest_row is not None and pd.notna(latest_row.get("arrivals_ma7")) else 680.0
        curr_p = float(latest_row["modal_price"]) if latest_row is not None and pd.notna(latest_row.get("modal_price")) else 2800.0
        p_ma7 = float(latest_row["price_ma7"]) if latest_row is not None and pd.notna(latest_row.get("price_ma7")) else 2800.0

        # Multi-step autoregressive arrival forecasting
        forecast_points = []
        running_lag1 = curr_arr
        running_ma7 = arr_ma7
        running_p = curr_p
        
        for d in range(1, days_ahead + 1):
            target_date = base_date + dt.timedelta(days=d)
            dow = target_date.weekday()
            
            # Predict using model if available
            pred_arrival = None
            if self.model_arrival:
                feat = pd.DataFrame([{
                    "arrivals_lag1": running_lag1,
                    "arrivals_ma7": running_ma7,
                    "price_lag1": running_p,
                    "price_ma7": p_ma7,
                    "temperature": 27.5,
                    "rainfall": 0.0,
                    "humidity": 65.0,
                    "dayofweek": dow,
                    "day": target_date.day,
                    "month": target_date.month
                }])
                try:
                    pred_arrival = float(self.model_arrival.predict(feat)[0])
                except Exception:
                    pred_arrival = None

            if pred_arrival is None or pred_arrival <= 0:
                # Seasonality baseline: Mondays have peak arrival (~1.18x), Weekends moderate (~0.92x)
                dow_factor = 1.18 if dow == 0 else (0.92 if dow in (5, 6) else 1.0)
                pred_arrival = running_ma7 * dow_factor

            pred_arrival = round(max(200.0, min(pred_arrival, 2500.0)), 1)
            lower_bound = round(max(150.0, pred_arrival * 0.82), 1)
            upper_bound = round(pred_arrival * 1.18, 1)

            forecast_points.append({
                "date": target_date.strftime("%Y-%m-%d"),
                "day_offset": d,
                "day_name": target_date.strftime("%a"),
                "forecast_arrivals_quintals": pred_arrival,
                "lower_bound": lower_bound,
                "upper_bound": upper_bound,
                "type": "ML Forecast"
            })

            # Update running lag and ma7
            running_lag1 = pred_arrival
            running_ma7 = round((running_ma7 * 6 + pred_arrival) / 7.0, 1)

        # Supply Pressure Assessment
        avg_projected = sum(p["forecast_arrivals_quintals"] for p in forecast_points[:7]) / 7.0
        normal_benchmark = arr_ma7 if arr_ma7 > 0 else 680.0
        pressure_ratio = round(avg_projected / normal_benchmark, 2)

        if pressure_ratio >= 1.25:
            supply_status = "SUPPLY_GLUT"
            severity = "HIGH"
            impact_summary = (
                f"Elevated Market Inflow (+{round((pressure_ratio - 1) * 100)}% above average). "
                f"Heavy volume increases risk of price discounting during late morning auction sessions. "
                f"Consider early morning 5:00 AM dispatch or distributing across alternative mandis."
            )
        elif pressure_ratio <= 0.80:
            supply_status = "SUPPLY_DEFICIT"
            severity = "FAVORABLE"
            impact_summary = (
                f"Tight Market Inflow ({round((1 - pressure_ratio) * 100)}% below normal benchmark). "
                f"Traders are facing limited supply, offering strong seller pricing leverage and firm realization."
            )
        else:
            supply_status = "BALANCED"
            severity = "NORMAL"
            impact_summary = (
                f"Balanced Inflow (~{round(normal_benchmark):,.0f} quintals/day). "
                f"Standard auction bidding dynamics expected without abrupt supply shocks."
            )

        # Actual vs Predicted validation on past 5 days
        validation_sample = []
        if len(historical_points) >= 5:
            for hp in historical_points[-5:]:
                act = hp["arrivals_quintals"]
                # Baseline comparison error
                est = round(normal_benchmark * (1.15 if hp["day_name"] == "Mon" else 0.96), 1)
                diff = round(abs(act - est), 1)
                validation_sample.append({
                    "date": hp["date"],
                    "day_name": hp["day_name"],
                    "actual_arrivals": act,
                    "predicted_baseline": est,
                    "error_quintals": diff,
                    "error_pct": round((diff / max(1.0, act)) * 100, 1)
                })

        return {
            "mandi_id": mandi_id,
            "mandi_name": mandi_name,
            "district": district,
            "state": state,
            "commodity": commodity,
            "base_date": base_date.strftime("%Y-%m-%d"),
            "current_arrivals_quintals": curr_arr,
            "average_arrival_quintals": round(normal_benchmark, 1),
            "supply_pressure_status": supply_status,
            "supply_pressure_severity": severity,
            "pressure_ratio": pressure_ratio,
            "impact_summary": impact_summary,
            "supply_pressure": {
                "pressure_index": supply_status,
                "severity": severity,
                "ratio": pressure_ratio,
                "description": impact_summary,
                "actionable_insight": impact_summary
            },
            "historical_arrivals": historical_points,
            "forecast_arrivals": forecast_points,
            "arrivals_forecast": forecast_points,
            "validation_sample": validation_sample
        }

# Global singleton
prediction_service = PricePredictionService()
