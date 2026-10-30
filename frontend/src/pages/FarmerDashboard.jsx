import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  TrendingUp, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  ArrowUpRight, 
  Scale, 
  Warehouse, 
  CloudSun,
  ShieldCheck,
  RefreshCw,
  GitCompare,
  Network
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import CostBreakdownCard from '../components/CostBreakdownCard';
import PriceChart from '../components/PriceChart';

export default function FarmerDashboard() {
  const { t } = useLanguage();
  const { 
    crop, 
    quantity, 
    harvestDate, 
    selectedLocation, 
    recommendations, 
    topRecommendation, 
    loading, 
    refreshRecommendations 
  } = useFarmerState();

  const [weatherAlert, setWeatherAlert] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    // Fetch live weather for the farmer's coordinates
    if (selectedLocation?.lat && selectedLocation?.lon) {
      api.getWeather(selectedLocation.lat, selectedLocation.lon)
        .then(setWeatherAlert)
        .catch(console.error);
    }
  }, [selectedLocation]);

  useEffect(() => {
    // Fetch price forecast & history for top recommended mandi
    if (topRecommendation?.mandi_id) {
      api.getPriceForecast(topRecommendation.mandi_id, crop, 14)
        .then(res => setForecastData(res))
        .catch(console.error);

      api.getPriceHistory(topRecommendation.mandi_id, crop, 14)
        .then(res => setHistoryData(res.history || []))
        .catch(console.error);
    }
  }, [topRecommendation, crop]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Farmer Command Center
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Harvest: {harvestDate}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Harvest Intelligence Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time optimization for <strong className="text-gray-900">{quantity} Tonnes ({quantity * 10} Quintals)</strong> of <strong className="text-emerald-800">{crop}</strong> from <strong className="text-gray-900">{selectedLocation.name}</strong>.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshRecommendations}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>

          <Link
            to="/optimizer"
            className="flex items-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0e3626] px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Network className="w-3.5 h-3.5 text-[#E9B44C]" />
            <span>Split Across Mandis</span>
          </Link>
        </div>
      </div>

      {/* Weather Impact Alert Banner */}
      {weatherAlert && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
          weatherAlert.risk_level === 'HIGH' 
            ? 'bg-red-50 border-red-200 text-red-900' 
            : weatherAlert.risk_level === 'MODERATE'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${
              weatherAlert.risk_level === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-[#164B35]'
            }`}>
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block uppercase tracking-wider text-[10px]">
                Open-Meteo Weather Status ({weatherAlert.risk_level} Impact)
              </span>
              <p className="mt-0.5 leading-relaxed">{weatherAlert.risk_summary}</p>
            </div>
          </div>
          <Link 
            to="/weather" 
            className="font-bold underline text-[11px] whitespace-nowrap hover:opacity-80"
          >
            View 7-Day Forecast &rarr;
          </Link>
        </div>
      )}

      {/* Top 4 Key Decision Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Recommended Mandi"
          value={topRecommendation ? topRecommendation.mandi_name : "Evaluating..."}
          subtitle={topRecommendation ? `${topRecommendation.district}, ${topRecommendation.state}` : "Finding optimal market..."}
          icon={MapPin}
          color="forest"
          badge={
            topRecommendation && (
              <span className="text-[#E9B44C] font-bold">
                {topRecommendation.distance_km} km away • {topRecommendation.travel_time_hours} hrs
              </span>
            )
          }
        />

        <StatCard
          title="Expected Net Profit"
          value={topRecommendation ? `₹${(topRecommendation.net_realization || 0).toLocaleString()}` : "—"}
          subtitle={topRecommendation ? `₹${topRecommendation.net_realization_per_q}/quintal in pocket` : ""}
          icon={Scale}
          color="emerald"
          badge={
            <span className="text-emerald-800 font-semibold">
              Maximized after all expenses
            </span>
          }
        />

        <StatCard
          title="Optimal Selling Date"
          value={topRecommendation ? (topRecommendation.recommended_date || harvestDate) : "—"}
          subtitle={topRecommendation?.storage_days === 0 ? "Sell immediately on harvest" : `Hold in cold storage for ${topRecommendation?.storage_days} days`}
          icon={Calendar}
          color="amber"
          badge={
            <span className="text-amber-800 font-semibold">
              Forecast: ₹{topRecommendation?.forecasted_price_per_q || 0}/q
            </span>
          }
        />

        <StatCard
          title="Total Logistics Cost"
          value={topRecommendation ? `₹${(topRecommendation.total_expenses || 0).toLocaleString()}` : "—"}
          subtitle="Transport, handling & storage"
          icon={Truck}
          color="blue"
          badge={
            <span className="text-blue-800 font-semibold">
              Freight: ₹{topRecommendation?.transport_cost || 0}
            </span>
          }
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Waterfall & Recommendation Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <CostBreakdownCard item={topRecommendation} quantityTonnes={quantity} />
        </div>

        {/* Right Column: Interactive Price Forecast & Market Comparison Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Forecast Chart Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
                  ML Predictive Modeling
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  {crop} Price Forecast: {topRecommendation?.mandi_name || "Regional APMC"}
                </h3>
                <p className="text-xs text-gray-500">
                  Actual Agmarknet market prices vs 7–14 day forecast with 80% confidence interval
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded">
                  XGBoost MAE: ₹{forecastData?.model_mae || 85}/q
                </span>
                <Link
                  to="/forecast"
                  className="text-xs font-bold text-[#164B35] hover:underline flex items-center space-x-1"
                >
                  <span>Full Forecast</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Price Chart */}
            <PriceChart 
              history={historyData} 
              forecast={forecastData?.forecast || []} 
              mandiName={topRecommendation?.mandi_name}
            />
          </div>

          {/* Quick Mandi Comparison Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
                  Market Comparison
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  Top Regional Mandis Ranked by Net Realization
                </h3>
              </div>
              <Link
                to="/comparison"
                className="text-xs font-bold text-[#164B35] hover:underline flex items-center space-x-1"
              >
                <span>Compare All {recommendations.length} Mandis</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase">
                    <th className="py-2.5 px-3">Mandi</th>
                    <th className="py-2.5 px-2">Distance</th>
                    <th className="py-2.5 px-2">Price</th>
                    <th className="py-2.5 px-2">Freight</th>
                    <th className="py-2.5 px-2 font-bold text-[#164B35]">Net Realization</th>
                    <th className="py-2.5 px-2">Net / Quintal</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recommendations.slice(0, 5).map((m, idx) => (
                    <tr key={idx} className={`hover:bg-gray-50 transition-colors ${m.is_best_choice ? 'bg-emerald-50/40' : ''}`}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 flex items-center space-x-1.5">
                          <span>{m.mandi_name}</span>
                          {m.is_best_choice && (
                            <span className="bg-[#164B35] text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                              Best
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400">{m.district}, {m.state}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{m.distance_km} km</td>
                      <td className="py-3 px-2 font-semibold text-amber-700">₹{m.forecasted_price_per_q}/q</td>
                      <td className="py-3 px-2 text-red-600">-₹{m.transport_cost?.toLocaleString()}</td>
                      <td className="py-3 px-2 font-black text-[#164B35] text-sm">
                        ₹{(m.net_realization || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 font-bold text-emerald-700">
                        ₹{m.net_realization_per_q}/q
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          to={`/calculator?mandi=${encodeURIComponent(m.mandi_id)}`}
                          className="bg-gray-100 hover:bg-[#164B35] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-block"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
