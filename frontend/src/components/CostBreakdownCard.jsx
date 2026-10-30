import React from 'react';
import { IndianRupee, Truck, ShieldAlert, Warehouse, UserCheck, TrendingUp } from 'lucide-react';

export default function CostBreakdownCard({ item, quantityTonnes = 5 }) {
  if (!item) return null;

  const quintals = quantityTonnes * 10;
  const deductions = (item.transport_cost || 0) + (item.handling_cost || 0) + (item.storage_cost || 0) + (item.spoilage_loss || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
            Net Realization Breakdown
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-0.5">
            {item.mandi_name}
          </h3>
          <p className="text-xs text-gray-500">
            {quantityTonnes} Tonnes ({quintals} Quintals) • Selling: {item.recommended_date || 'Harvest Date'}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 font-medium">Net Realization</span>
          <div className="text-2xl font-black text-[#164B35]">
            ₹{(item.net_realization || 0).toLocaleString()}
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            ₹{(item.net_realization_per_q || 0).toFixed(0)}/quintal
          </span>
        </div>
      </div>

      {/* Waterfall List */}
      <div className="mt-4 space-y-3 text-sm">
        {/* Gross Revenue */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 text-emerald-950 font-medium">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <span>Gross Expected Revenue (at ₹{item.forecasted_price_per_q || 0}/q)</span>
          </div>
          <span className="font-bold">+ ₹{(item.gross_revenue || 0).toLocaleString()}</span>
        </div>

        {/* Transport Cost */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Transportation ({item.distance_km} km • {item.travel_time_hours} hrs)</span>
          </div>
          <span className="font-semibold text-red-600 text-xs">- ₹{(item.transport_cost || 0).toLocaleString()}</span>
        </div>

        {/* Handling Cost */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>Mandi Handling & APMC Cess (₹15/q)</span>
          </div>
          <span className="font-semibold text-red-600 text-xs">- ₹{(item.handling_cost || 0).toLocaleString()}</span>
        </div>

        {/* Storage Cost */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <Warehouse className="w-4 h-4 text-indigo-600" />
            <span>Cold Storage ({item.storage_days || 0} days holding)</span>
          </div>
          <span className="font-semibold text-red-600 text-xs">
            {item.storage_cost > 0 ? `- ₹${item.storage_cost.toLocaleString()}` : '₹0 (Same Day)'}
          </span>
        </div>

        {/* Spoilage Loss */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-gray-700">
          <div className="flex items-center space-x-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-orange-600" />
            <span>Spoilage & Degradation Risk</span>
          </div>
          <span className="font-semibold text-red-600 text-xs">
            {item.spoilage_loss > 0 ? `- ₹${item.spoilage_loss.toLocaleString()}` : '₹0 (Fresh)'}
          </span>
        </div>

        {/* Total Deductions Bar */}
        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 font-semibold">
          <span>Total Deductions & Logistics:</span>
          <span className="text-red-700 font-bold">- ₹{deductions.toLocaleString()}</span>
        </div>
      </div>

      {item.recommendation_reason && (
        <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold">Strategy Insight: </span>
          {item.recommendation_reason}
        </div>
      )}
    </div>
  );
}
