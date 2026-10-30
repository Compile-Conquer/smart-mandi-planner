"""Open-Meteo live weather observation, 7-day forecast, and agricultural risk intelligence service."""
import time
import datetime as dt
import requests
from typing import Dict, Any, List, Optional

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 1800  # 30 minutes cache

# WMO Weather interpretation codes
WMO_DESCRIPTIONS = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}

class WeatherIntelligenceService:
    @staticmethod
    def get_weather_forecast(lat: float, lon: float, location_name: str = "Farm Location") -> Dict[str, Any]:
        cache_key = f"{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()
        
        if cache_key in WEATHER_CACHE:
            cached = WEATHER_CACHE[cache_key]
            if now - cached["timestamp"] < CACHE_TTL_SECONDS:
                result = dict(cached["data"])
                result["is_cached"] = True
                result["location_name"] = location_name
                return result

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code",
            "hourly": "relative_humidity_2m",
            "timezone": "Asia/Kolkata",
            "forecast_days": 7
        }

        try:
            res = requests.get(OPEN_METEO_URL, params=params, timeout=7)
            res.raise_for_status()
            data = res.json()
            
            # Current conditions
            current_raw = data.get("current", {})
            curr_code = current_raw.get("weather_code", 0)
            current_conditions = {
                "temperature_c": current_raw.get("temperature_2m", 28.0),
                "apparent_temp_c": current_raw.get("apparent_temperature", 29.0),
                "humidity_pct": current_raw.get("relative_humidity_2m", 65.0),
                "precipitation_mm": current_raw.get("precipitation", 0.0),
                "wind_speed_kmh": current_raw.get("wind_speed_10m", 12.0),
                "condition": WMO_DESCRIPTIONS.get(curr_code, "Mainly clear"),
                "weather_code": curr_code,
                "observation_time": current_raw.get("time", dt.datetime.now().isoformat())
            }

            daily = data.get("daily", {})
            times = daily.get("time", [])
            t_max = daily.get("temperature_2m_max", [])
            t_min = daily.get("temperature_2m_min", [])
            precip = daily.get("precipitation_sum", [])
            prob = daily.get("precipitation_probability_max", [])
            w_code = daily.get("weather_code", [])
            wind_max = daily.get("wind_speed_10m_max", [])
            
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
                wind = wind_max[i] if i < len(wind_max) else 14.0
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
                    "temp_max_c": round(max_t, 1),
                    "temp_min_c": round(min_t, 1),
                    "rainfall_mm": round(rain, 1),
                    "rain_probability_pct": rain_prob,
                    "humidity_avg_pct": hum_avg,
                    "wind_speed_kmh": round(wind, 1),
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
                "status": "ONLINE",
                "is_stale": False,
                "last_updated": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "latitude": lat,
                "longitude": lon,
                "location_name": location_name,
                "current_conditions": current_conditions,
                "current": current_conditions,
                "risk_level": risk_level,
                "risk_summary": risk_summary,
                "daily_forecast": days_forecast
            }
            
            WEATHER_CACHE[cache_key] = {"timestamp": now, "data": result}
            return result

        except Exception as e:
            # Deterministic, valid agricultural weather fallback when offline or API timeout
            today = dt.date.today()
            fallback_days = []
            for d in range(7):
                curr = today + dt.timedelta(days=d)
                date_val = curr.strftime("%Y-%m-%d")
                fallback_days.append({
                    "date": date_val,
                    "condition": "Partly cloudy",
                    "temp_max_c": round(29.5 + (d % 3) * 0.5, 1),
                    "temp_min_c": 20.0,
                    "rainfall_mm": 1.5 if d in (2, 5) else 0.0,
                    "rain_probability_pct": 25 if d in (2, 5) else 10,
                    "humidity_avg_pct": 68.0,
                    "wind_speed_kmh": 12.0,
                    "harvest_suitability": "FAVORABLE",
                    "weather_code": 2
                })
                
            current_cond = {
                "temperature_c": 28.5,
                "apparent_temp_c": 29.2,
                "humidity_pct": 66.0,
                "precipitation_mm": 0.0,
                "wind_speed_kmh": 11.5,
                "condition": "Partly cloudy",
                "weather_code": 2,
                "observation_time": dt.datetime.now().isoformat()
            }
            return {
                "source": "Offline Weather Baseline",
                "status": "OFFLINE_FALLBACK",
                "is_stale": True,
                "last_updated": dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "latitude": lat,
                "longitude": lon,
                "location_name": location_name,
                "current_conditions": current_cond,
                "current": current_cond,
                "risk_level": "LOW",
                "risk_summary": "Offline agricultural weather baseline active. Typical post-monsoon conditions: warm days, mild nights, low rainfall risk.",
                "daily_forecast": fallback_days
            }

weather_service = WeatherIntelligenceService()
