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
  Calendar
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function WeatherIntelligencePage() {
  const { selectedLocation } = useFarmerState();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lon) {
      setLoading(true);
      api.getWeather(selectedLocation.lat, selectedLocation.lon)
        .then(setWeatherData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedLocation]);

  const dailyForecast = weatherData?.daily_forecast || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Agro-Meteorological Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Weather & Harvesting Risk Analysis
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Powered by Open-Meteo API for coordinates <strong className="text-gray-900">{selectedLocation.lat.toFixed(4)}°N, {selectedLocation.lon.toFixed(4)}°E</strong> ({selectedLocation.name}).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 px-3 py-1.5 rounded-xl shadow-sm">
          <CloudSun className="w-4 h-4 text-[#E9B44C]" />
          <span>7-Day Meteorological Horizon</span>
        </div>
      </div>

      {/* Weather Risk Banner */}
      {weatherData && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          weatherData.risk_level === 'HIGH'
            ? 'bg-red-50 border-red-200 text-red-950'
            : weatherData.risk_level === 'MODERATE'
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-2xl ${
              weatherData.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#164B35]'
            }`}>
              {weatherData.risk_level === 'HIGH' ? <ShieldAlert className="w-6 h-6" /> : <CloudSun className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Overall Agro-Climate Risk:
                </span>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                  weatherData.risk_level === 'HIGH' ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
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
                  isHazard ? 'bg-red-50/60 border-red-200' : 'bg-white border-gray-200'
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
                      ? 'bg-red-100 text-red-800'
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
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">
          Field Harvesting & Transit Guidelines
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-700 leading-relaxed">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Harvest Timing</h4>
            <p>
              Harvest between 6:00 AM and 9:30 AM before direct sunlight raises fruit pulp temperature above 28°C. Field heat drastically increases ethylene emissions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <h4 className="font-bold text-gray-900 text-sm">Rain Protection</h4>
            <p>
              Do not harvest wet tomatoes immediately following rain; skin turgidity causes micro-cracking and rapid bacterial colonization within 24 hours of packing.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
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
