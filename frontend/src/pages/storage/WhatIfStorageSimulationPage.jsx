import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gauge, 
  Zap, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  Boxes, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Sliders
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  ReferenceLine 
} from 'recharts';
import { api } from '../../services/api';

const SCENARIOS = [
  {
    id: 'power_outage_2h',
    name: '2-Hour Grid Power Outage',
    duration: 2.0,
    ambientTemp: 28.0,
    ambientRh: 60.0,
    desc: 'Simulates short-duration grid loss with insulated chamber thermal inertia holding temperature under 15.5°C.'
  },
  {
    id: 'power_outage_4h',
    name: '4-Hour Severe Power Outage',
    duration: 4.0,
    ambientTemp: 32.0,
    ambientRh: 55.0,
    desc: 'Critical failure scenario: internal core temperature exceeds 18°C, triggering accelerated tomato senescence.'
  },
  {
    id: 'compressor_failure',
    name: 'Compressor Failure / 22°C Temp Spike',
    duration: 6.0,
    ambientTemp: 30.0,
    ambientRh: 50.0,
    desc: 'Full cooling circuit shutdown; convective warm heat infiltration raises bay temperatures rapidly.'
  },
  {
    id: 'humidity_drop',
    name: 'Dehumidification / Humidity Drop to 65%',
    duration: 5.0,
    ambientTemp: 14.0,
    ambientRh: 45.0,
    desc: 'Atomizer spray failure; low vapor pressure deficit accelerates fruit shriveling and water loss.'
  },
  {
    id: 'door_breach',
    name: 'Loading Door Left Open (45 min)',
    duration: 0.75,
    ambientTemp: 30.0,
    ambientRh: 60.0,
    desc: 'Warm ambient air intrusion through open Bay access door causing rapid localized thermal gradient.'
  }
];

export default function WhatIfStorageSimulationPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [duration, setDuration] = useState(SCENARIOS[0].duration);
  const [ambientTemp, setAmbientTemp] = useState(SCENARIOS[0].ambientTemp);
  const [ambientRh, setAmbientRh] = useState(SCENARIOS[0].ambientRh);
  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSelectScenario = (scId) => {
    const sc = SCENARIOS.find(s => s.id === scId);
    if (!sc) return;
    setSelectedScenarioId(scId);
    setDuration(sc.duration);
    setAmbientTemp(sc.ambientTemp);
    setAmbientRh(sc.ambientRh);
    setErrorMsg(null);
  };

  const runSimulation = () => {
    setLoading(true);
    setErrorMsg(null);
    const activeScenario = SCENARIOS.find(s => s.id === selectedScenarioId);
    const payload = {
      scenario_type: selectedScenarioId.toUpperCase(),
      scenario_name: activeScenario?.name || 'Custom What-If Test',
      duration_hours: Number(duration),
      ambient_temperature_c: Number(ambientTemp),
      ambient_temp_c: Number(ambientTemp),
      ambient_humidity_pct: Number(ambientRh),
      ambient_rh: Number(ambientRh)
    };

    api.simulateStorage(payload)
      .then(res => {
        setSimResult(res);
      })
      .catch(err => {
        console.error("Simulation error:", err);
        setErrorMsg(err.message || 'Simulation execution failed. Please verify parameters.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              What-If Storage Stress Simulator
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Chamber A Thermal-Decay Differential Model
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Cold Storage What-If Scenario Simulator
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Simulate equipment outages, power cutoffs, and thermal breaches to evaluate tomato batch shelf-life degradation.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center space-x-2 bg-[#164B35] hover:bg-[#0E3626] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Play className={`w-4 h-4 ${loading ? 'animate-spin' : 'fill-white'}`} />
          <span>{loading ? 'Running Physics Model...' : 'Execute What-If Simulation'}</span>
        </button>
      </div>

      {/* Error Alert if simulation failed */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* Interactive Controls & Scenario Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preset Selector */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Gauge className="w-5 h-5 text-[#164B35]" />
            <h2 className="font-black text-gray-900 text-sm">Select Stress Scenario</h2>
          </div>

          <div className="space-y-2">
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs space-y-1 ${
                  selectedScenarioId === sc.id
                    ? 'bg-emerald-50/70 border-[#164B35] ring-1 ring-[#164B35]'
                    : 'bg-gray-50/70 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900">{sc.name}</span>
                  <span className="text-[10px] font-bold text-gray-500">{sc.duration}h</span>
                </div>
                <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                  {sc.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Parameter Sliders */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Sliders className="w-5 h-5 text-[#164B35]" />
            <h2 className="font-black text-gray-900 text-sm">Adjust Environmental Stress Parameters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Failure Duration Slider */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>Outage Duration:</span>
                </span>
                <span className="font-black text-[#164B35] font-mono text-sm">{duration} hrs</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="12.0"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[#164B35] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>30 min</span>
                <span>6 hrs</span>
                <span>12 hrs</span>
              </div>
            </div>

            {/* Ambient Outside Temperature Slider */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Outdoor Temp:</span>
                </span>
                <span className="font-black text-teal-800 font-mono text-sm">{ambientTemp}°C</span>
              </div>
              <input
                type="range"
                min="20"
                max="40"
                step="1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>20°C (Mild)</span>
                <span>30°C</span>
                <span>40°C (Heatwave)</span>
              </div>
            </div>

            {/* Ambient Humidity Slider */}
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 font-bold flex items-center space-x-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Outdoor RH:</span>
                </span>
                <span className="font-black text-blue-800 font-mono text-sm">{ambientRh}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="90"
                step="5"
                value={ambientRh}
                onChange={(e) => setAmbientRh(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>30% (Dry)</span>
                <span>60%</span>
                <span>90% (Monsoon)</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={runSimulation}
              disabled={loading}
              className="flex items-center space-x-2 bg-[#164B35] hover:bg-[#0E3626] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Simulate Scenario Impact</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Results Display */}
      {simResult && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Simulation Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Thermometer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Peak Chamber Temp</p>
                <p className="text-xl font-black text-gray-900">
                  {simResult.peak_temperature_c?.toFixed(1) || '--'}°C
                </p>
                <p className="text-[10px] text-rose-600 font-semibold">
                  Safe Threshold: 14.0°C
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Final Chamber RH</p>
                <p className="text-xl font-black text-gray-900">
                  {simResult.final_humidity_percent?.toFixed(1) || '--'}%
                </p>
                <p className="text-[10px] text-gray-500">
                  Initial Setpoint: 90.0%
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Quality Loss Index</p>
                <p className="text-xl font-black text-amber-700">
                  {simResult.quality_loss_percentage?.toFixed(1) || '0.0'}%
                </p>
                <p className="text-[10px] text-gray-500">
                  Respiration Rate Acceleration
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">At-Risk Batches</p>
                <p className="text-xl font-black text-rose-800">
                  {simResult.affected_batches?.length || 0} Batches
                </p>
                <p className="text-[10px] text-rose-600 font-semibold">
                  Urgent dispatch recommended
                </p>
              </div>
            </div>
          </div>

          {/* Temperature Progression Curve (Recharts) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-base">
                  Simulated Chamber Thermal Rise Over Time
                </h3>
                <p className="text-xs text-gray-500">
                  Hourly thermal drift under {duration}h outage with {ambientTemp}°C outdoor temperature.
                </p>
              </div>
            </div>

            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simResult.hourly_timeline || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour_label" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} domain={[10, 'auto']} unit="°C" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} 
                  />
                  <Legend />
                  <ReferenceLine y={14.0} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical Limit (14°C)', fill: '#ef4444', fontSize: 11 }} />
                  <Line 
                    type="monotone" 
                    dataKey="temperature_c" 
                    name="Chamber Core Temp (°C)" 
                    stroke="#164B35" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#164B35' }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Affected Batches Impact Assessment Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-[#164B35]" />
                <h3 className="font-black text-gray-900 text-base">
                  Inventory Spoilage Impact Assessment
                </h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Post-simulation biological shifts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider text-[11px] border-b border-gray-200">
                    <th className="py-3 px-4">Batch ID</th>
                    <th className="py-3 px-4">Variety & Bay</th>
                    <th className="py-3 px-4">Pre-Test Stage</th>
                    <th className="py-3 px-4">Projected Stage</th>
                    <th className="py-3 px-4">Shelf-Life Lost</th>
                    <th className="py-3 px-4">New Spoilage Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {simResult.affected_batches && simResult.affected_batches.length > 0 ? (
                    simResult.affected_batches.map((b) => (
                      <tr key={b.batch_id} className="hover:bg-gray-50/60">
                        <td className="py-3 px-4 font-mono font-black text-gray-900">
                          {b.batch_id}
                        </td>
                        <td className="py-3 px-4 font-bold text-gray-800">
                          {b.variety} ({b.storage_bay})
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {b.original_stage}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#164B35]">
                          {b.projected_stage}
                        </td>
                        <td className="py-3 px-4 text-rose-700 font-bold">
                          -{b.shelf_life_days_lost?.toFixed(1) || 1.0} Days
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            b.projected_spoilage_risk === 'High' ? 'bg-rose-100 text-rose-800' :
                            b.projected_spoilage_risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {b.projected_spoilage_risk}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-6 text-gray-400">
                        No batch degradation registered under this duration.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Strategy Advisory Box */}
          <div className="bg-[#FAFDF9] rounded-3xl p-6 border border-emerald-300 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-[#164B35]">
              <CheckCircle2 className="w-5 h-5 font-black" />
              <h3 className="font-black text-gray-900 text-base">
                Operational Mitigation Strategy
              </h3>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {simResult.recommendation || "Maintain door seals tightly closed during grid power failure. If power outage exceeds 2 hours, deploy auxiliary diesel generator to keep evaporator circulation active."}
            </p>
            <div className="pt-2 flex items-center justify-between">
              <Link
                to="/storage/inventory"
                className="text-xs font-bold text-[#164B35] hover:underline flex items-center space-x-1"
              >
                <span>Go to Batch Inventory to Record Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}