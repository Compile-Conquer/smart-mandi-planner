import React, { useState, useEffect } from 'react';
import { Package, TrendingDown, TrendingUp, Info, Activity } from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import ArrivalChart from '../components/ArrivalChart';
import StatCard from '../components/StatCard';

export default function ArrivalForecastPage() {
  const { crop, recommendations } = useFarmerState();
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [arrivalsData, setArrivalsData] = useState([]);
  const [mandiName, setMandiName] = useState('');

  useEffect(() => {
    if (recommendations.length > 0 && !selectedMandiId) {
      setSelectedMandiId(recommendations[0].mandi_id);
    }
  }, [recommendations]);

  useEffect(() => {
    if (selectedMandiId) {
      api.getArrivalsForecast(selectedMandiId, crop)
        .then(res => {
          setArrivalsData(res.arrivals_forecast || []);
          setMandiName(res.mandi_name || 'Market');
        })
        .catch(console.error);
    }
  }, [selectedMandiId, crop]);

  const maxArrival = arrivalsData.length > 0 ? Math.max(...arrivalsData.map(a => a.forecast_arrivals_quintals)) : 800;
  const minArrival = arrivalsData.length > 0 ? Math.min(...arrivalsData.map(a => a.forecast_arrivals_quintals)) : 400;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Supply & Demand Dynamics
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Market Arrival Forecasting & Supply Pressure
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Monitor projected daily arrival volumes (quintals) to anticipate buyer bidding power and price drops.
          </p>
        </div>

        {/* Mandi Selector */}
        <div className="flex items-center space-x-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-sm">
          <span className="text-gray-500 font-medium">Market:</span>
          <select
            value={selectedMandiId}
            onChange={(e) => setSelectedMandiId(e.target.value)}
            aria-label="Select Market"
            className="font-bold text-gray-900 outline-none bg-transparent cursor-pointer"
          >
            {recommendations.map((m) => (
              <option key={m.mandi_id} value={m.mandi_id}>
                {m.mandi_name} ({m.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Projected Peak Supply Day"
          value={`${maxArrival.toLocaleString()} q`}
          subtitle="Highest expected market glut"
          icon={TrendingDown}
          color="amber"
          badge={<span className="text-amber-800 font-semibold">Buyer price softening risk</span>}
        />

        <StatCard
          title="Projected Low Supply Day"
          value={`${minArrival.toLocaleString()} q`}
          subtitle="Tight supply window"
          icon={TrendingUp}
          color="emerald"
          badge={<span className="text-emerald-800 font-semibold">Firm price realization opportunity</span>}
        />

        <StatCard
          title="7-Day Average Inflow"
          value={`${Math.round((maxArrival + minArrival) / 2).toLocaleString()} q`}
          subtitle={`Typical ${crop} daily volume`}
          icon={Package}
          color="blue"
        />
      </div>

      {/* Arrival Chart Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">
            {mandiName} — Forecasted Daily Inflow (Quintals)
          </h3>
          <p className="text-xs text-gray-500">
            Estimated daily market arrivals based on regional harvest patterns and weekday trading schedules.
          </p>
        </div>

        <ArrivalChart arrivals={arrivalsData} averageArrival={650} />
      </div>

      {/* Analytical Guidance Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 text-[#164B35] font-bold text-base">
          <Info className="w-5 h-5" />
          <span>How Market Arrivals Impact Farmer Realization</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 leading-relaxed">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
            <h4 className="font-bold text-amber-900 text-sm">Arrival Glut Warning (&gt; 800 Quintals)</h4>
            <p>
              When arrival volumes surge above historical thresholds, commission agents and wholesale buyers gain bidding leverage. 
              Perishable produce like tomato that cannot be stored is often auctioned at discounts of 15%–30% towards the afternoon session.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <h4 className="font-bold text-emerald-900 text-sm">Supply Deficit Opportunity (&lt; 500 Quintals)</h4>
            <p>
              On days with lower arrivals (often midweek or after heavy rains that halt farm harvesting), inter-state traders compete vigorously 
              for quality lots. Timing your transport dispatch to arrive at 5:00 AM on low-supply mornings yields maximum realization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
