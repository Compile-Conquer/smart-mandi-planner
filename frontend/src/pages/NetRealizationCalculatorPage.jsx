import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  IndianRupee, 
  TrendingUp, 
  Truck, 
  Warehouse, 
  ShieldAlert, 
  UserCheck, 
  Calendar,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import CostBreakdownCard from '../components/CostBreakdownCard';
import StatCard from '../components/StatCard';

export default function NetRealizationCalculatorPage() {
  const { crop, quantity: defaultQty, selectedLocation, recommendations } = useFarmerState();

  const [quantity, setQuantity] = useState(defaultQty || 5.0);
  const [selectedMandiId, setSelectedMandiId] = useState('');
  const [holdingDays, setHoldingDays] = useState(0);
  const [transportRate, setTransportRate] = useState(35.0);
  const [handlingRate, setHandlingRate] = useState(15.0);
  const [storageRate, setStorageRate] = useState(3.5);
  const [spoilageRate, setSpoilageRate] = useState(1.5);

  const [calculatedResult, setCalculatedResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recommendations.length > 0 && !selectedMandiId) {
      setSelectedMandiId(recommendations[0].mandi_id);
    }
  }, [recommendations]);

  const recalculate = () => {
    if (!selectedMandiId) return;
    setLoading(true);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + holdingDays);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);

    const payload = {
      crop,
      quantity_tonnes: Number(quantity),
      harvest_date: todayStr,
      selling_date: dateStr,
      farmer_lat: selectedLocation.lat,
      farmer_lon: selectedLocation.lon,
      selected_mandi_id: selectedMandiId,
      custom_transport_cost_per_km: Number(transportRate),
      custom_handling_cost_per_q: Number(handlingRate),
      custom_storage_cost_per_day_per_q: Number(storageRate),
      custom_spoilage_rate_pct_per_day: Number(spoilageRate),
    };

    api.getRecommendations(payload)
      .then(res => {
        const match = res.find(m => m.mandi_id === selectedMandiId) || res[0];
        setCalculatedResult(match);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    recalculate();
  }, [crop, quantity, selectedMandiId, holdingDays, transportRate, handlingRate, storageRate, spoilageRate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Financial Optimization Engine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Net Realization & Cost Breakdown Calculator
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Customize cost variables and storage holding duration to see exact rupee realization for your harvest.
          </p>
        </div>

        <button
          onClick={recalculate}
          className="flex items-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0e3626] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Update Calculations</span>
        </button>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Configurable Sliders & Inputs (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-gray-900">
            Cost & Market Assumptions
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Harvest Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex justify-between">
                <span>Harvest Quantity (Tonnes):</span>
                <span className="text-[#164B35]">{quantity} Tonnes ({quantity * 10} q)</span>
              </label>
              <input
                type="range"
                min="1"
                max="25"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full accent-[#164B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1 Tonne (10 q)</span>
                <span>25 Tonnes (250 q)</span>
              </div>
            </div>

            {/* Target Mandi */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Target Mandi:
              </label>
              <select
                value={selectedMandiId}
                onChange={(e) => setSelectedMandiId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 outline-none focus:ring-1 focus:ring-[#164B35]"
              >
                {recommendations.map((m) => (
                  <option key={m.mandi_id} value={m.mandi_id}>
                    {m.mandi_name} ({m.distance_km} km)
                  </option>
                ))}
              </select>
            </div>

            {/* Holding Days in Storage */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex justify-between">
                <span>Holding Days in Storage:</span>
                <span className="text-amber-800 font-bold">{holdingDays} Days</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={holdingDays}
                onChange={(e) => setHoldingDays(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0 Days (Immediate)</span>
                <span>10 Days Max</span>
              </div>
            </div>

            {/* Transport Freight Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex justify-between">
                <span>Transport Rate:</span>
                <span className="text-[#164B35]">₹{transportRate} / km</span>
              </label>
              <input
                type="range"
                min="20"
                max="60"
                step="1"
                value={transportRate}
                onChange={(e) => setTransportRate(Number(e.target.value))}
                className="w-full accent-[#164B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>₹20/km</span>
                <span>₹60/km</span>
              </div>
            </div>

            {/* Cold Storage Fee */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex justify-between">
                <span>Cold Storage Rate:</span>
                <span className="text-indigo-800">₹{storageRate} / q / day</span>
              </label>
              <input
                type="range"
                min="2.0"
                max="8.0"
                step="0.5"
                value={storageRate}
                onChange={(e) => setStorageRate(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>₹2.0/q/day</span>
                <span>₹8.0/q/day</span>
              </div>
            </div>

            {/* Spoilage Loss Rate */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 flex justify-between">
                <span>Perishable Spoilage Rate:</span>
                <span className="text-orange-800">{spoilageRate}% per day</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.5"
                value={spoilageRate}
                onChange={(e) => setSpoilageRate(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>0.5% (Best Cold Storage)</span>
                <span>5.0% (Ambient Room)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Formula: Net Realization = Gross Revenue − (Freight + Mandi Cess + Cold Storage + Spoilage)</span>
          </div>
        </div>

        {/* Right Column: Output Waterfall Card (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <CostBreakdownCard item={calculatedResult} quantityTonnes={quantity} />
        </div>
      </div>
    </div>
  );
}
