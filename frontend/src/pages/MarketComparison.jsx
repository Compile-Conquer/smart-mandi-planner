import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowUpDown, 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Warehouse, 
  Info, 
  TrendingUp,
  Download
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';

export default function MarketComparison() {
  const { crop, quantity, selectedLocation, recommendations, loading } = useFarmerState();
  const [sortBy, setSortBy] = useState('net_realization'); // 'net_realization', 'distance_km', 'forecasted_price_per_q'
  const [filterState, setFilterState] = useState('ALL');

  let filtered = [...recommendations];
  if (filterState !== 'ALL') {
    filtered = filtered.filter(m => m.state === filterState);
  }

  filtered.sort((a, b) => {
    if (sortBy === 'distance_km') return a.distance_km - b.distance_km;
    if (sortBy === 'forecasted_price_per_q') return b.forecasted_price_per_q - a.forecasted_price_per_q;
    return b.net_realization - a.net_realization;
  });

  const states = ['ALL', ...new Set(recommendations.map(m => m.state))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Multi-Market Analysis
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Regional Mandi Net Realization Comparison
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Comparing <strong className="text-gray-900">{recommendations.length} APMC markets</strong> for {quantity} Tonnes of {crop} originating from {selectedLocation.name}.
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3">
          {/* State Filter */}
          <div className="flex items-center space-x-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-300">
            <span className="text-gray-500 font-medium">State:</span>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              aria-label="Filter by State"
              className="font-bold text-gray-800 outline-none bg-transparent cursor-pointer"
            >
              {states.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-1.5 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort Markets"
              className="font-bold text-[#164B35] outline-none bg-transparent cursor-pointer"
            >
              <option value="net_realization">Net Realization (Highest Profit)</option>
              <option value="forecasted_price_per_q">Gross Market Price</option>
              <option value="distance_km">Shortest Distance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Educational Notice Banner */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-900 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">
            Key Insight: The highest market price does NOT always produce the highest net profit!
          </p>
          <p className="text-gray-700 leading-relaxed">
            Check the table below: markets with higher spot prices may have longer transit distances, resulting in steep freight charges 
            and moisture spoilage that erode your actual earnings. Always optimize for <strong>Net Realization</strong>.
          </p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#164B35] text-white uppercase text-[11px] font-bold">
              <tr>
                <th className="py-3 px-4">Market / Mandi</th>
                <th className="py-3 px-3">Distance & Time</th>
                <th className="py-3 px-3">Gross Price</th>
                <th className="py-3 px-3">Gross Revenue</th>
                <th className="py-3 px-3">Freight & Deductions</th>
                <th className="py-3 px-4 bg-[#0e3626] text-[#E9B44C]">Expected Net Profit</th>
                <th className="py-3 px-3 bg-[#0e3626] text-[#E9B44C]">Net / Quintal</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((m, idx) => {
                const totalDeductions = (m.transport_cost || 0) + (m.handling_cost || 0) + (m.storage_cost || 0) + (m.spoilage_loss || 0);
                return (
                  <tr 
                    key={idx} 
                    className={`hover:bg-gray-50 transition-colors ${m.is_best_choice ? 'bg-emerald-50/50 font-medium' : ''}`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                        <span>{m.mandi_name}</span>
                        {m.is_best_choice && (
                          <span className="bg-[#164B35] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            Optimal Choice
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{m.district}, {m.state}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-bold text-gray-900">{m.distance_km} km</span>
                      <span className="block text-[11px] text-gray-500">~{m.travel_time_hours} hrs drive</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-extrabold text-amber-800 text-sm">₹{m.forecasted_price_per_q}</span>
                      <span className="block text-[10px] text-gray-500">per quintal</span>
                    </td>

                    <td className="py-3.5 px-3 font-semibold text-gray-800">
                      ₹{(m.gross_revenue || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-red-600 block">- ₹{totalDeductions.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400">
                        Freight: ₹{m.transport_cost?.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 bg-emerald-50/70">
                      <span className="text-base font-black text-[#164B35]">
                        ₹{(m.net_realization || 0).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 bg-emerald-50/70">
                      <span className="font-extrabold text-emerald-800">
                        ₹{(m.net_realization_per_q || 0).toFixed(0)}/q
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      {m.is_best_choice ? (
                        <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Highest Net</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Alternative</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
