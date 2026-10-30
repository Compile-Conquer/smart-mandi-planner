import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  TrendingDown, 
  TrendingUp, 
  Truck, 
  ShieldAlert, 
  RefreshCw, 
  ArrowRight,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function ScenarioSimulatorPage() {
  const { crop, quantity: defaultQty, harvestDate, selectedLocation } = useFarmerState();

  const [quantity, setQuantity] = useState(defaultQty || 5.0);
  const [priceShockPct, setPriceShockPct] = useState(0.0); // e.g. -15%
  const [transportMultiplier, setTransportMultiplier] = useState(1.0); // e.g. 1.25x
  const [spoilageMultiplier, setSpoilageMultiplier] = useState(1.0); // e.g. 1.5x

  const [simulationData, setSimulationData] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = () => {
    setLoading(true);
    const baseRequest = {
      crop,
      quantity_tonnes: Number(quantity),
      harvest_date: harvestDate || '2026-10-30',
      farmer_lat: selectedLocation.lat,
      farmer_lon: selectedLocation.lon,
      custom_transport_cost_per_km: 35.0,
      custom_handling_cost_per_q: 15.0,
      custom_storage_cost_per_day_per_q: 3.5,
      custom_spoilage_rate_pct_per_day: 1.5,
    };

    const payload = {
      base_request: baseRequest,
      modified_quantity_tonnes: Number(quantity),
      modified_transport_cost_multiplier: Number(transportMultiplier),
      expected_price_shock_pct: Number(priceShockPct),
      spoilage_rate_modifier_pct: Number(spoilageMultiplier),
    };

    api.simulateScenario(payload)
      .then(setSimulationData)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSimulation();
  }, [crop, quantity, priceShockPct, transportMultiplier, spoilageMultiplier, selectedLocation]);

  const base = simulationData?.base_scenario;
  const sim = simulationData?.simulated_scenario;
  const netDiff = simulationData?.net_profit_difference_rupees || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            What-If Risk Stress Testing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Market Volatility Scenario Simulator
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Stress-test your selling plan against sudden market crashes, diesel price hikes, and heatwave spoilage.
          </p>
        </div>

        <button
          onClick={runSimulation}
          className="flex items-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0e3626] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reset Simulation</span>
        </button>
      </div>

      {/* Simulator Sliders Control Panel */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Simulated Market Variables
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Harvest Volume */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Harvest Volume:</span>
              <span className="text-[#164B35]">{quantity} Tonnes</span>
            </label>
            <input
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full accent-[#164B35] cursor-pointer"
            />
            <span className="text-[10px] text-gray-400 block">{quantity * 10} Quintals</span>
          </div>

          {/* Expected Price Shock */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Price Shock (%):</span>
              <span className={`font-bold ${priceShockPct < 0 ? 'text-red-600' : priceShockPct > 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                {priceShockPct > 0 ? `+${priceShockPct}%` : `${priceShockPct}%`}
              </span>
            </label>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              value={priceShockPct}
              onChange={(e) => setPriceShockPct(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>-30% (Severe Crash)</span>
              <span>+30% (Surge)</span>
            </div>
          </div>

          {/* Transport Cost Multiplier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Transport Cost Shift:</span>
              <span className="text-blue-800">{transportMultiplier}x</span>
            </label>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={transportMultiplier}
              onChange={(e) => setTransportMultiplier(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0.8x (Discounts)</span>
              <span>2.0x (Diesel Spike / Detour)</span>
            </div>
          </div>

          {/* Spoilage Rate Multiplier */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Spoilage Modifier:</span>
              <span className="text-orange-800">{spoilageMultiplier}x</span>
            </label>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.25"
              value={spoilageMultiplier}
              onChange={(e) => setSpoilageMultiplier(Number(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>1.0x (Normal)</span>
              <span>2.5x (Heatwave / Delay)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison: Base vs Simulated */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Base Scenario Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Baseline Strategy
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                {base?.mandi_name || 'Recommended Mandi'}
              </h3>
            </div>
            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">
              Standard Market
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Market Price:</span>
              <span className="font-bold text-gray-900">₹{base?.forecasted_price_per_q || 0} / q</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gross Sale Revenue:</span>
              <span className="font-semibold text-gray-900">₹{(base?.gross_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Logistics & Deductions:</span>
              <span className="font-semibold text-red-600">-₹{(base?.total_expenses || 0).toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-black text-gray-900">
              <span>Net Profit:</span>
              <span className="text-base text-gray-900">₹{(base?.net_realization || 0).toLocaleString()}</span>
            </div>
            <div className="text-right text-[11px] font-bold text-gray-500">
              ₹{(base?.net_realization_per_q || 0).toFixed(0)} / quintal
            </div>
          </div>
        </div>

        {/* Simulated Scenario Card */}
        <div className={`rounded-2xl border shadow-md p-6 space-y-4 ${
          netDiff < 0 ? 'bg-red-50/40 border-red-300' : 'bg-emerald-50/40 border-emerald-300'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#164B35]">
                Simulated Market Shock
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                {sim?.mandi_name || 'Recommended Mandi'}
              </h3>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              netDiff < 0 ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {netDiff < 0 ? 'Negative Stress' : 'Favorable Shift'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Adjusted Price:</span>
              <span className="font-bold text-amber-800">₹{sim?.forecasted_price_per_q || 0} / q</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Simulated Gross Revenue:</span>
              <span className="font-semibold text-gray-900">₹{(sim?.gross_revenue || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Simulated Deductions:</span>
              <span className="font-semibold text-red-600">-₹{(sim?.total_expenses || 0).toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-gray-300 flex justify-between items-center text-sm font-black">
              <span>Simulated Net Profit:</span>
              <span className="text-base text-[#164B35]">₹{(sim?.net_realization || 0).toLocaleString()}</span>
            </div>
            <div className="text-right text-[11px] font-bold text-emerald-800">
              ₹{(sim?.net_realization_per_q || 0).toFixed(0)} / quintal
            </div>
          </div>
        </div>
      </div>

      {/* Net Impact Statement & Advice */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        netDiff < 0 ? 'bg-red-50 border-red-200 text-red-950' : 'bg-emerald-50 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${netDiff < 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
            {netDiff < 0 ? <AlertTriangle className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block">
              Net Impact Analysis
            </span>
            <p className="text-sm font-bold mt-0.5 leading-relaxed">
              {simulationData?.impact_analysis}
            </p>
          </div>
        </div>

        <div className="text-right whitespace-nowrap pl-4 border-l border-gray-200">
          <span className="text-xs text-gray-500 block">Net Realization Shift</span>
          <span className={`text-2xl font-black ${netDiff < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            {netDiff >= 0 ? '+' : ''}₹{netDiff.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
