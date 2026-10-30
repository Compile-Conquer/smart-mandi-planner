import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  CloudRain, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Calendar,
  RefreshCw,
  Radio,
  MapPin,
  Clock
} from 'lucide-react';
import { useFarmerState, LOCATION_PRESETS } from '../context/FarmerStateContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function WeatherIntelligencePage() {
  const { selectedLocation, setSelectedLocation } = useFarmerState();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = () => {
    if (selectedLocation?.lat && selectedLocation?.lon) {
      setLoading(true);
      api.getWeather(selectedLocation.lat, selectedLocation.lon)
        .then(setWeatherData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [selectedLocation]);

  const dailyForecast = weatherData?.daily_forecast || [];
  const current = weatherData?.current;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Agro-Meteorological Intelligence
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Open-Meteo Precision Observations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Weather Intelligence & Harvest Risk Advisory
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time meteorological observations, rain hazard alerts, and postharvest field transit recommendations.
          </p>
        </div>

        {/* Location Picker & Refresh Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm text-xs">
            <MapPin className="w-4 h-4 text-[#164B35]" />
            <span className="text-gray-500 font-semibold">Origin:</span>
            <select
              value={selectedLocation.name}
              onChange={(e) => {
                const match = LOCATION_PRESETS.find(p => p.name === e.target.value);
                if (match) setSelectedLocation(match);
              }}
              className="font-bold text-gray-900 bg-transparent outline-none cursor-pointer max-w-[150px] truncate"
            >
              {LOCATION_PRESETS.map((p, idx) => (
                <option key={idx} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchWeather}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Current Real-Time Conditions Hero Card */}
      {current && (
        <div className="bg-gradient-to-r from-[#123E2B] to-[#1E5D41] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <span className="flex items-center space-x-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-emerald-200 font-bold border border-white/10">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                  <span>{weatherData?.is_live ? "LIVE STATION TELEMETRY" : "MODEL OBSERVATION"}</span>
                </span>
                <span className="text-emerald-200 text-xs flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Observation: {current.observation_time ? new Date(current.observation_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                </span>
              </div>

              <div className="flex items-baseline space-x-4">
                <span className="text-5xl sm:text-6xl font-black tracking-tight text-white">
                  {current.temperature_c?.toFixed(1) || '--'}°C
                </span>
                <div>
                  <p className="text-lg font-bold text-emerald-100">{current.condition || 'Clear Weather'}</p>
                  <p className="text-xs text-emerald-200">{selectedLocation.name} ({selectedLocation.district || 'Karnataka'})</p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-1.5 text-emerald-200 mb-1">
                  <Droplets className="w-4 h-4 text-teal-300" />
                  <span className="font-semibold">Humidity</span>
                </div>
                <p className="text-lg font-black text-white">{current.humidity_pct || '--'}%</p>
                <p className="text-[10px] text-emerald-200">Atmospheric vapor</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <div className="flex items-center space-x-1.5 text-emerald-200 mb-1">
                  <Wind className="w-4 h-4 text-blue-300" />
                  <span className="font-semibold">Wind Velocity</span>
                </div>
                <p className="text-lg font-black text-white">{current.wind_speed_kmh?.toFixed(1) || '--'} km/h</p>
                <p className="text-[10px] text-emerald-200">Surface wind drift</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
                <div className="flex items-center space-x-1.5 text-emerald-200 mb-1">
                  <CloudSun className="w-4 h-4 text-[#E9B44C]" />
                  <span className="font-semibold">Agro Status</span>
                </div>
                <p className="text-sm font-black text-[#E9B44C] truncate">{weatherData.risk_level || 'FAVORABLE'}</p>
                <p className="text-[10px] text-emerald-200">Overall risk tier</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weather Risk Banner */}
      {weatherData && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          weatherData.risk_level === 'HIGH'
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : weatherData.risk_level === 'MODERATE'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${
              weatherData.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-[#164B35]'
            }`}>
              {weatherData.risk_level === 'HIGH' ? <ShieldAlert className="w-6 h-6" /> : <CloudSun className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Overall Agro-Climate Risk:
                </span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  weatherData.risk_level === 'HIGH' ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {weatherData.risk_level}
                </span>
              </div>
              <p className="text-sm font-semibold mt-1 leading-relaxed">
                {weatherData.risk_summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7-Day Weather Grid Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Day-by-Day Agricultural Forecast
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {dailyForecast.map((day, idx) => {
            const isHazard = day.rainfall_mm >= 10 || day.rain_probability_pct >= 60;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between space-y-3 ${
                  isHazard ? 'bg-rose-50/60 border-rose-200' : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                    <span>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    <span>{day.date.slice(5)}</span>
                  </div>

                  <div className="my-2 flex items-center justify-center">
                    {day.rainfall_mm > 0 ? (
                      <CloudRain className="w-8 h-8 text-blue-500" />
                    ) : (
                      <CloudSun className="w-8 h-8 text-[#E9B44C]" />
                    )}
                  </div>

                  <p className="text-center font-bold text-xs text-gray-800">
                    {day.condition}
                  </p>
                </div>

                <div className="space-y-1.5 text-[11px] pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center space-x-1">
                      <Thermometer className="w-3 h-3 text-red-500" />
                      <span>Temp:</span>
                    </span>
                    <span className="font-bold">{day.temp_max_c}° / {day.temp_min_c}°</span>
                  </div>

                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center space-x-1">
                      <CloudRain className="w-3 h-3 text-blue-500" />
                      <span>Rain:</span>
                    </span>
                    <span className={`font-bold ${day.rainfall_mm > 5 ? 'text-red-600' : ''}`}>
                      {day.rainfall_mm} mm ({day.rain_probability_pct}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-gray-700">
                    <span className="flex items-center space-x-1">
                      <Droplets className="w-3 h-3 text-teal-500" />
                      <span>Humidity:</span>
                    </span>
                    <span className="font-bold">{day.humidity_avg_pct}%</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className={`block text-center text-[10px] font-black py-1 px-1.5 rounded-lg ${
                    day.harvest_suitability.includes('HIGH RISK')
                      ? 'bg-rose-100 text-rose-800'
                      : day.harvest_suitability.includes('MODERATE')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {day.harvest_suitability}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisory Explanations */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900">
          Field Harvesting & Transit Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Harvest Timing</h4>
            <p>
              Harvest between 6:00 AM and 9:30 AM before direct sunlight raises fruit pulp temperature above 28°C. Field heat drastically increases ethylene emissions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Rain Protection</h4>
            <p>
              Do not harvest wet tomatoes immediately following rain; skin turgidity causes micro-cracking and rapid bacterial colonization within 24 hours of packing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Transit Ventilation</h4>
            <p>
              When ambient humidity exceeds 75%, ensure wooden or plastic crates have top aeration gaps to prevent hot spots inside the transport vehicle bed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}