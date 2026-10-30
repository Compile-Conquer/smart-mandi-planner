"""Open-Meteo live weather observation, 7-day forecast, and agricultural risk intelligence service."""
import time
import requests
from typing import Dict, Any, List, Optional

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour cache

# WMO Weather interpretation codes
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    51: "Light drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
}

class WeatherIntelligenceService:
    @staticmethod
    def get_weather_forecast(lat: float, lon: float) -> Dict[str, Any]:
        cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()
        
        if cache_key in WEATHER_CACHE:
            cached = WEATHER_CACHE[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                return cached["data"]

        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code",
            "hourly": "relative_humidity_2m",
            "timezone": "Asia/Kolkata",
            "forecast_days": 7
        }

        try:
            res = requests.get(OPEN_METEO_URL, params=params, timeout=5)
            res.raise_for_status()
            data = res.json()
            
            daily = data.get("daily", {})
            times = daily.get("time", [])
            t_max = daily.get("temperature_2m_max", [])
            t_min = daily.get("temperature_2m_min", [])
            precip = daily.get("precipitation_sum", [])
            prob = daily.get("precipitation_probability_max", [])
            w_code = daily.get("weather_code", [])
            
            # Compute daily average humidity from hourly
            hourly = data.get("hourly", {})
            h_times = hourly.get("time", [])
            h_hum = hourly.get("relative_humidity_2m", [])
            
            humidity_map = {}
            for t_str, hum_val in zip(h_times, h_hum):
                d_str = t_str[:10]
                if d_str not in humidity_map:
                    humidity_map[d_str] = []
                if hum_val is not None:
                    humidity_map[d_str].append(hum_val)
                    
            days_forecast = []
            max_rain_week = 0.0
            avg_temp_week = 0.0
            
            for i, d_str in enumerate(times):
                max_t = t_max[i] if i < len(t_max) else 30.0
                min_t = t_min[i] if i < len(t_min) else 20.0
                rain = precip[i] if i < len(precip) else 0.0
                rain_prob = prob[i] if i < len(prob) else 0
                code = w_code[i] if i < len(w_code) else 0
                hum_avg = round(sum(humidity_map.get(d_str, [65.0])) / len(humidity_map.get(d_str, [1])), 1)
                
                max_rain_week = max(max_rain_week, rain)
                avg_temp_week += ((max_t + min_t) / 2.0)
                
                # Agricultural impact tags
                harvest_condition = "FAVORABLE"
                if rain >= 15.0 or rain_prob >= 75:
                    harvest_condition = "HIGH RISK - POSTPONE HARVEST"
                elif rain >= 5.0:
                    harvest_condition = "MODERATE RISK - MONITOR RAIN"
                    
                days_forecast.append({
                    "date": d_str,
                    "condition": WMO_DESCRIPTIONS.get(code, "Partly cloudy"),
                    "temp_max_c": max_t,
                    "temp_min_c": min_t,
                    "rainfall_mm": rain,
                    "rain_probability_pct": rain_prob,
                    "humidity_avg_pct": hum_avg,
                    "harvest_suitability": harvest_condition,
                    "weather_code": code
                })
                
            avg_temp_week = round(avg_temp_week / max(1, len(times)), 1)
            
            # Risk synthesis
            risk_level = "LOW"
            risk_summary = "Weather conditions are stable and favorable for harvest, transit, and open handling."
            if max_rain_week >= 25.0:
                risk_level = "HIGH"
                risk_summary = f"Heavy rainfall spike ({max_rain_week:.1f} mm) forecast this week. Saturated roadways may cause logistical transit delays; use waterproof tarping for produce."
            elif max_rain_week >= 10.0:
                risk_level = "MODERATE"
                risk_summary = "Scattered showers predicted. Ensure harvest is scheduled in dry morning intervals to prevent bacterial soft rot."
            elif avg_temp_week >= 33.0:
                risk_level = "MODERATE"
                risk_summary = "Elevated daytime temperatures will accelerate perishable moisture loss. Night-time transit recommended."

            result = {
                "source": "Open-Meteo Live API",
                "latitude": lat,
                "longitude": lon,
                "risk_level": risk_level,
                "risk_summary": risk_summary,
                "daily_forecast": days_forecast
            }
            
            WEATHER_CACHE[cache_key] = {"timestamp": now, "data": result}
            return result

        except Exception as e:
            # Deterministic agricultural weather fallback when offline
            fallback_days = []
            for d in range(7):
                date_val = f"2026-10-{30 + d:02d}"
                fallback_days.append({
                    "date": date_val,
                    "condition": "Partly cloudy",
                    "temp_max_c": 29.5 + (d % 3) * 0.5,
                    "temp_min_c": 20.0,
                    "rainfall_mm": 1.5 if d in (2, 5) else 0.0,
                    "rain_probability_pct": 25 if d in (2, 5) else 10,
                    "humidity_avg_pct": 68.0,
                    "harvest_suitability": "FAVORABLE",
                    "weather_code": 2
                })
                
            return {
                "source": "Offline Weather Baseline",
                "latitude": lat,
                "longitude": lon,
                "risk_level": "LOW",
                "risk_summary": "Offline agricultural weather baseline active. Typical post-monsoon conditions: warm days, mild nights, low rainfall risk.",
                "daily_forecast": fallback_days
            }

weather_service = WeatherIntelligenceService()
