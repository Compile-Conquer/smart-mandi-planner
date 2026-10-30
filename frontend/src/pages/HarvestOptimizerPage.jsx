import React, { useState, useEffect } from 'react';
import { 
  Network, 
  TrendingUp, 
  Truck, 
  Warehouse, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';
import { api } from '../services/api';
import StatCard from '../components/StatCard';

export default function HarvestOptimizerPage() {
  const { crop, quantity: defaultQty, harvestDate: defaultDate, selectedLocation } = useFarmerState();

  const [totalTonnes, setTotalTonnes] = useState(defaultQty || 5.0);
  const [maxMandis, setMaxMandis] = useState(3);
  const [maxSharePct, setMaxSharePct] = useState(70.0);
  const [allowStorage, setAllowStorage] = useState(true);
  const [maxStorageDays, setMaxStorageDays] = useState(5);

  const [optimizationResult, setOptimizationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runOptimizer = () => {
    setLoading(true);
    const payload = {
      crop,
      total_harvest_tonnes: Number(totalTonnes),
      harvest_date: defaultDate || '2026-10-30',
      farmer_lat: selectedLocation.lat,
      farmer_lon: selectedLocation.lon,
      farmer_location_name: selectedLocation.name,
      max_mandis_to_split: Number(maxMandis),
      max_share_per_mandi_pct: Number(maxSharePct),
      allow_storage: allowStorage,
      max_storage_days: Number(maxStorageDays),
      custom_spoilage_pct_per_day: 1.5,
      custom_cold_storage_rate_per_day_per_q: 3.5
    };

    api.optimizeHarvest(payload)
      .then(setOptimizationResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runOptimizer();
  }, [crop, totalTonnes, maxMandis, maxSharePct, allowStorage, maxStorageDays, selectedLocation]);

  const benchmark = optimizationResult?.comparison_to_local_single_mandi;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Linear Programming Optimization
            </span>
            <span className="text-xs text-gray-500 font-medium">
              SciPy Highs Solver
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Harvest Allocation & Channel Optimizer
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Mathematically solves the multi-mandi, multi-date distribution problem to maximize total farmer net payout.
          </p>
        </div>

        <button
          onClick={runOptimizer}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0e3626] px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 text-[#E9B44C] ${loading ? 'animate-spin' : ''}`} />
          <span>Solve Optimal Allocation</span>
        </button>
      </div>

      {/* Optimizer Configuration Controls Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Optimization Constraints & Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Harvest Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Harvest Volume:</span>
              <span className="text-[#164B35]">{totalTonnes} Tonnes</span>
            </label>
            <input
              type="range"
              min="2"
              max="25"
              step="0.5"
              value={totalTonnes}
              onChange={(e) => setTotalTonnes(Number(e.target.value))}
              className="w-full accent-[#164B35] cursor-pointer"
            />
            <span className="text-[10px] text-gray-400 block">{totalTonnes * 10} Quintals available</span>
          </div>

          {/* Maximum Mandis to Split */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Max Mandis to Split:</span>
              <span className="text-[#164B35]">{maxMandis} Markets</span>
            </label>
            <select
              value={maxMandis}
              onChange={(e) => setMaxMandis(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none"
            >
              <option value={1}>1 Mandi (Single Destination)</option>
              <option value={2}>2 Mandis</option>
              <option value={3}>3 Mandis (Recommended)</option>
              <option value={4}>4 Mandis</option>
            </select>
            <span className="text-[10px] text-gray-400 block">Controls transport logistics complexity</span>
          </div>

          {/* Single Mandi Share Cap */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Mandi Share Cap:</span>
              <span className="text-amber-800">{maxSharePct}%</span>
            </label>
            <input
              type="range"
              min="30"
              max="100"
              step="5"
              value={maxSharePct}
              onChange={(e) => setMaxSharePct(Number(e.target.value))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <span className="text-[10px] text-gray-400 block">Prevents flooding a single local market</span>
          </div>

          {/* Cold Storage Switch & Max Hold Days */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex justify-between">
              <span>Cold Storage Holding:</span>
              <span className="text-indigo-800 font-bold">{allowStorage ? `Up to ${maxStorageDays} Days` : 'Disabled'}</span>
            </label>
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="storageToggle"
                checked={allowStorage}
                onChange={(e) => setAllowStorage(e.target.checked)}
                className="w-4 h-4 text-[#164B35] rounded focus:ring-0 cursor-pointer"
              />
              <label htmlFor="storageToggle" className="text-xs font-medium text-gray-700 cursor-pointer">
                Evaluate storage vs instant dispatch
              </label>
            </div>
            {allowStorage && (
              <input
                type="range"
                min="1"
                max="7"
                step="1"
                value={maxStorageDays}
                onChange={(e) => setMaxStorageDays(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer mt-1"
              />
            )}
          </div>
        </div>
      </div>

      {/* Benchmark Gain Highlight Banner */}
      {benchmark && (
        <div className="bg-gradient-to-r from-emerald-900 to-[#164B35] text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 bg-[#E9B44C] text-[#164B35] text-xs font-black px-2.5 py-0.5 rounded-full uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optimization Advantage</span>
            </div>
            <h3 className="text-xl font-black">
              +{benchmark.profit_increase_percentage}% Higher Net Profit Realization
            </h3>
            <p className="text-xs text-[#DDEBDD] leading-relaxed">
              Compared to dumping 100% of harvest at your nearest local mandi ({benchmark.local_mandi_name}), 
              this multi-channel allocation yields an extra <strong>₹{benchmark.profit_increase_rupees.toLocaleString()}</strong> in net farmer profit.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20 text-right whitespace-nowrap">
            <span className="text-xs text-emerald-200 block">Total Optimized Net Profit</span>
            <span className="text-2xl font-black text-[#E9B44C]">
              ₹{(optimizationResult?.total_net_realization || 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-gray-300 block">
              ₹{(optimizationResult?.average_net_per_quintal || 0).toFixed(0)} / quintal
            </span>
          </div>
        </div>
      )}

      {/* Allocation Breakdown Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Recommended Distribution Plan ({optimizationResult?.allocations?.length || 0} Market Destinations)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {optimizationResult?.allocations?.map((alloc, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4 hover:border-[#164B35] transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2 py-0.5 rounded">
                    Channel #{idx + 1}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 mt-1">
                    {alloc.mandi_name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {alloc.district}, {alloc.state} • {alloc.distance_km} km
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#164B35]">
                    {alloc.allocation_percentage}%
                  </span>
                  <span className="block text-xs font-semibold text-gray-500">
                    {alloc.allocated_tonnes}t ({alloc.allocated_quintals}q)
                  </span>
                </div>
              </div>

              {/* Timing & Selling Info */}
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Selling Date:</span>
                  <span className="font-bold text-gray-900">{alloc.selling_date}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Storage Holding:</span>
                  <span className="font-bold text-amber-800">
                    {alloc.storage_days === 0 ? 'Same Day Dispatch' : `${alloc.storage_days} Days in Storage`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Expected Price:</span>
                  <span className="font-bold text-emerald-800">₹{alloc.expected_price_per_q} / q</span>
                </div>
              </div>

              {/* Financial Deductions & Net */}
              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>Gross Revenue:</span>
                  <span className="font-semibold text-gray-900">₹{alloc.gross_revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Transport Freight:</span>
                  <span className="font-semibold text-red-600">-₹{alloc.transport_expense.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Handling & Storage:</span>
                  <span className="font-semibold text-red-600">
                    -₹{(alloc.handling_expense + alloc.storage_expense + alloc.spoilage_expense).toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-100 flex justify-between font-black text-sm text-[#164B35]">
                  <span>Net Realization:</span>
                  <span>₹{alloc.net_realization.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Explanation & Actionable Takeaways */}
      {optimizationResult && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
            <Info className="w-5 h-5 text-[#164B35]" />
            <span>Why the Optimizer Recommends This Allocation</span>
          </h3>

          <p className="text-xs text-gray-700 leading-relaxed bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 font-medium">
            {optimizationResult.explanation_summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {optimizationResult.actionable_takeaways?.map((takeaway, idx) => (
              <div key={idx} className="flex items-start space-x-2 text-xs text-gray-800 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
