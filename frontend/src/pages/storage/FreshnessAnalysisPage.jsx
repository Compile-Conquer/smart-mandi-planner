import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  Info, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Leaf,
  Boxes
} from 'lucide-react';
import { api } from '../../services/api';

const USDA_STAGES = [
  { stage: 'Green', step: 1, color: 'bg-emerald-600', text: 'Stage 1: 100% green surface; firm tissue, ethylene insensitive.' },
  { stage: 'Breaker', step: 2, color: 'bg-lime-500', text: 'Stage 2: 0–10% yellow/pink break; optimum commercial storage harvest.' },
  { stage: 'Turning', step: 3, color: 'bg-amber-400', text: 'Stage 3: 10–30% pink/yellow; carotenoid synthesis underway.' },
  { stage: 'Pink', step: 4, color: 'bg-rose-400', text: 'Stage 4: 30–60% pink-red; firm table fruit; rapid ethylene emission.' },
  { stage: 'Light Red', step: 5, color: 'bg-red-500', text: 'Stage 5: 60–90% red; highest wholesale consumer demand.' },
  { stage: 'Red', step: 6, color: 'bg-red-700', text: 'Stage 6: >90% full red; peak lycopene; shelf life 2–4 days.' }
];

export default function FreshnessAnalysisPage() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [freshnessData, setFreshnessData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getBatches({ include_exhausted: false })
      .then(bList => {
        setBatches(bList);
        if (bList.length > 0) {
          setSelectedBatchId(bList[0].batch_id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadFreshness = (batchId) => {
    if (!batchId) return;
    setLoading(true);
    api.getBatchFreshness(batchId)
      .then(res => {
        const f = res.freshness || {};
        setFreshnessData({
          ...res,
          ...f,
          batch_id: res.batch_id || f.batch_id,
          variety: res.variety || f.variety,
          current_stage: res.current_stage || f.current_stage || 'Turning',
          initial_stage: res.initial_stage || f.initial_stage || 'Breaker',
          spoilage_risk: res.spoilage_risk || f.spoilage_risk || 'Low',
          spoilage_risk_score: res.spoilage_risk_score ?? f.spoilage_risk_score ?? 15,
          estimated_shelf_life_days: res.estimated_shelf_life_days ?? f.estimated_shelf_life_days ?? 12,
          degree_hours_accumulated: res.degree_hours_accumulated ?? f.degree_hours_accumulated ?? 0.0,
          quality_condition: res.quality_condition || f.quality_condition || 'Good',
          explanation: res.explanation || f.explanation || '',
          recommendation: res.recommendation || f.recommendation || 'Dispatch within recommended window.',
          current_facility_temp_c: res.current_facility_temp_c ?? 12.5
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedBatchId) {
      loadFreshness(selectedBatchId);
    }
  }, [selectedBatchId]);

  const currentStageIndex = USDA_STAGES.findIndex(
    s => s.stage.toLowerCase() === (freshnessData?.current_stage || '').toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Postharvest Biology Engine
            </span>
            <span className="text-xs text-gray-500 font-medium">
              USDA 6-Stage Ripeness & Thermal Degradation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Tomato Freshness & Ripeness Analysis
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Biological maturity tracking, degree-hours accumulation, and predictive shelf-life degradation kinetics.
          </p>
        </div>

        {/* Batch Picker */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Boxes className="w-4 h-4 text-[#164B35]" />
            <span className="text-xs font-semibold text-gray-500">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="bg-transparent font-black text-xs text-gray-900 outline-none cursor-pointer"
            >
              {batches.map(b => (
                <option key={b.batch_id} value={b.batch_id}>
                  {b.batch_id} ({b.variety} • {b.storage_bay})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadFreshness(selectedBatchId)}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate</span>
          </button>
        </div>
      </div>

      {freshnessData ? (
        <div className="space-y-6">
          {/* Key Physiological Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Current Maturity Stage */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#164B35] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Stage</p>
                <p className="text-xl font-black text-gray-900">
                  {freshnessData.current_stage}
                </p>
                <p className="text-[11px] text-gray-500">
                  Initial Entry: {freshnessData.initial_stage}
                </p>
              </div>
            </div>

            {/* Estimated Days Remaining */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Remaining Shelf Life</p>
                <p className="text-xl font-black text-gray-900">
                  ~{freshnessData.estimated_shelf_life_days} Days
                </p>
                <p className="text-[11px] text-teal-700 font-semibold">
                  At active ~{freshnessData.current_facility_temp_c?.toFixed(1) || 12.5}°C
                </p>
              </div>
            </div>

            {/* Degree-Hours Accumulation */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Thermal Degree-Hours</p>
                <p className="text-xl font-black text-gray-900">
                  {freshnessData.degree_hours_accumulated?.toFixed(1) || '0.0'} °C-h
                </p>
                <p className="text-[11px] text-amber-700">
                  Respiration Factor: Q10 ≈ 2.1
                </p>
              </div>
            </div>

            {/* Spoilage Risk Badge */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                freshnessData.spoilage_risk === 'High' ? 'bg-rose-50 text-rose-700' :
                freshnessData.spoilage_risk === 'Medium' ? 'bg-amber-50 text-amber-700' :
                'bg-emerald-50 text-emerald-800'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Spoilage Risk</p>
                <p className={`text-xl font-black ${
                  freshnessData.spoilage_risk === 'High' ? 'text-rose-700' :
                  freshnessData.spoilage_risk === 'Medium' ? 'text-amber-700' :
                  'text-emerald-800'
                }`}>
                  {freshnessData.spoilage_risk} Risk
                </p>
                <p className="text-[11px] text-gray-500">
                  Risk Score: {freshnessData.spoilage_risk_score}/100
                </p>
              </div>
            </div>
          </div>

          {/* USDA 6-Stage Ripeness Progression Visualizer */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  USDA Tomato Ripeness Spectrum
                </h2>
                <p className="text-xs text-gray-500">
                  Physiological development progression from Green to Red under current storage conditions.
                </p>
              </div>

              <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-xl">
                Batch {freshnessData.batch_id} • Variety: {freshnessData.variety}
              </div>
            </div>

            {/* Stage Progress Track */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
              {USDA_STAGES.map((s, idx) => {
                const isCurrent = idx === currentStageIndex;
                const isPassed = currentStageIndex > -1 && idx < currentStageIndex;

                return (
                  <div
                    key={s.stage}
                    className={`rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                      isCurrent
                        ? "bg-emerald-50/70 border-[#164B35] ring-2 ring-[#164B35]/20 shadow-md"
                        : isPassed
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 opacity-60"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                      </span>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full ${s.color}`} />
                        <span className="font-black text-sm text-gray-900">{s.stage}</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 block">Stage {s.step} of 6</span>
                    </div>

                    <p className="text-[11px] text-gray-600 leading-tight">
                      {s.text}
                    </p>

                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 font-medium">Status:</span>
                      <span className={`font-bold ${
                        isCurrent ? 'text-[#164B35]' : isPassed ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {isCurrent ? 'CURRENT' : isPassed ? 'COMPLETED' : 'UPCOMING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Biological Explanation & Recommendation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scientific Explanation */}
            <div className="bg-[#FAFDF9] rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-[#164B35]">
                <Leaf className="w-5 h-5 font-black" />
                <h3 className="font-black text-gray-900 text-base">
                  Postharvest Biological Assessment
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-700 leading-relaxed">
                <p>
                  <strong>Thermal Inertia & Q10:</strong> Tomatoes follow the Arrhenius biological degradation kinetics. Every 10°C increase above 12.5°C doubles respiration rate and accelerates chlorophyll degradation into lycopene.
                </p>
                <p>
                  <strong>Chilling Injury Threshold (Below 10°C):</strong> Storing tomatoes below 10°C causes cell membrane leakage, pitting, and irreversible inhibition of aroma-yielding volatile synthesis. Chamber A is regulated above 11.5°C to preserve table quality.
                </p>
                <p>
                  <strong>Moisture Loss Prevention:</strong> Chamber relative humidity is maintained at 90% to avoid transpirational weight loss, ensuring maximum net quintal yield upon mandi arrival.
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-[11px] text-emerald-900 font-mono">
                Formula: ShelfLife(T) = NominalLife / [Q10 ^ ((T - 12.5) / 10)]
              </div>
            </div>

            {/* Strategic Selling Action Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-[#164B35]">
                  <CheckCircle2 className="w-5 h-5 font-black" />
                  <h3 className="font-black text-gray-900 text-base">
                    Optimal Dispatch Recommendation
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                  <p className="font-bold text-gray-900">
                    {freshnessData.recommendation || "Recommended to dispatch within 4 days to capture peak wholesale prices."}
                  </p>
                  <p className="text-gray-600">
                    Target Mandis: <strong>Kolar (APMC)</strong> or <strong>Bengaluru (Yeshwanthpur)</strong> where modal tomato prices for {freshnessData.variety} currently trade at ₹2,400–2,800/quintal.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link
                  to="/calculator"
                  className="text-xs font-bold text-[#164B35] hover:underline flex items-center space-x-1"
                >
                  <span>Simulate Net Realization</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <Link
                  to="/storage/inventory"
                  className="bg-[#164B35] text-white hover:bg-[#0E3626] px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                >
                  <span>Record Mandi Dispatch</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200">
          <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-spin" />
          <p className="text-xs font-bold text-gray-600">Loading physiological freshness data...</p>
        </div>
      )}
    </div>
  );
}