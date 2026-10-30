import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, 
  Warehouse, 
  Thermometer, 
  Droplets, 
  Wind, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Radio, 
  Boxes, 
  DoorClosed, 
  DoorOpen, 
  Zap, 
  Activity, 
  Sliders, 
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function DigitalTwinPage() {
  const [facility, setFacility] = useState(null);
  const [batches, setBatches] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [selectedBay, setSelectedBay] = useState('Bay 1');

  const loadTwinData = () => {
    setLoading(true);
    Promise.all([
      api.getStorageFacility(),
      api.getBatches({ include_exhausted: false }),
      api.getStorageAlerts()
    ])
      .then(([fac, bList, altList]) => {
        setFacility(fac);
        setBatches(bList);
        setAlerts(altList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTwinData();
    const interval = setInterval(loadTwinData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSimulation = () => {
    if (!facility) return;
    setToggling(true);
    const nextMode = !facility.simulation_active;
    api.toggleSimulationMode(nextMode)
      .then(res => {
        setFacility(res.facility);
      })
      .catch(console.error)
      .finally(() => setToggling(false));
  };

  // Group active batches by storage bay (with fallback to room string or Bay 1)
  const getBatchBay = (b) => {
    if (b.storage_bay) return b.storage_bay;
    if (b.storage_room?.includes('Bay 1')) return 'Bay 1';
    if (b.storage_room?.includes('Bay 2')) return 'Bay 2';
    if (b.storage_room?.includes('Bay 3')) return 'Bay 3';
    return 'Bay 1';
  };

  const batchesByBay = {
    'Bay 1': batches.filter(b => getBatchBay(b) === 'Bay 1'),
    'Bay 2': batches.filter(b => getBatchBay(b) === 'Bay 2'),
    'Bay 3': batches.filter(b => getBatchBay(b) === 'Bay 3')
  };

  const tempVal = facility?.temperature_c ?? facility?.current_temperature;
  const humVal = facility?.humidity_percent ?? facility?.current_humidity ?? facility?.humidity_pct;

  const isSensorLive = facility?.connection_status === 'WOKWI SENSOR CONNECTED';
  const isPowerGrid = facility?.power_status === 'Grid Active' || !facility?.power_status?.includes('Failure');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Simulation-Based Digital Twin
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Chamber A • Physics-Thermal State Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Cold Storage Architectural Digital Twin
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time thermal synchronization between Wokwi ESP32 + DHT22 physical telemetry and mathematical cold chamber models.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadTwinData}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Twin</span>
          </button>

          <button
            onClick={handleToggleSimulation}
            disabled={toggling}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all border ${
              isSensorLive
                ? "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
                : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{facility?.simulation_active ? "Switch to Live Wokwi" : "Switch to Simulation"}</span>
          </button>
        </div>
      </div>

      {/* Telemetry vs Twin Status Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Connection State */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isSensorLive ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
          }`}>
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Telemetry Feed</p>
              {facility?.is_stale && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                  STALE
                </span>
              )}
            </div>
            <p className="text-sm font-black text-gray-900 truncate">
              {facility?.connection_status || "OFFLINE SIMULATION MODE"}
            </p>
            <p className="text-[10px] text-gray-500 truncate">
              Source: {facility?.telemetry_source || (isSensorLive ? "Wokwi ESP32 + DHT22" : "Physics Model")}
            </p>
            <p className="text-[9px] text-gray-400 font-mono mt-0.5">
              Updated: {facility?.last_updated_time || 'Just now'}
            </p>
          </div>
        </div>

        {/* Temperature Differential */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Current Core Temp</p>
            <p className="text-xl font-black text-gray-900">
              {tempVal !== undefined && tempVal !== null ? `${Number(tempVal).toFixed(1)}°C` : '--'}
            </p>
            <p className="text-[10px] text-emerald-700 font-semibold">
              Setpoint: {facility?.target_temperature || 12.5}°C (±1.5°C target)
            </p>
          </div>
        </div>

        {/* Relative Humidity */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Relative Humidity</p>
            <p className="text-xl font-black text-gray-900">
              {humVal !== undefined && humVal !== null ? `${Number(humVal).toFixed(1)}%` : '--'}
            </p>
            <p className="text-[10px] text-blue-700 font-semibold">
              Target: {facility?.target_humidity || 90.0}% (Moisture retention)
            </p>
          </div>
        </div>

        {/* HVAC Power State */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPowerGrid ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
          }`}>
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">HVAC Compressor</p>
            <p className="text-sm font-black text-gray-900">
              {facility?.cooling_status || facility?.refrigeration_status || "Active Modulating"}
            </p>
            <p className="text-[10px] text-gray-500">
              Power: {facility?.power_status || "MAINS_ONLINE"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Digital Twin Architectural Schematic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2D Interactive Chamber Layout */}
        <div className="lg:col-span-2 bg-[#0C2419] text-white rounded-3xl p-6 sm:p-8 border border-[#1B583E] shadow-xl relative overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#E9B44C] text-[#164B35] flex items-center justify-center font-black">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Chamber A – Floor Plan & Spatial Layout</h2>
                <p className="text-xs text-emerald-200">
                  Total Capacity: 15.0 MT • Active Volume: {(batches.reduce((acc, b) => acc + (b.remaining_quantity_kg || 0), 0) / 1000).toFixed(2)} MT
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 ${
                facility?.door_open ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}>
                {facility?.door_open ? <DoorOpen className="w-3.5 h-3.5" /> : <DoorClosed className="w-3.5 h-3.5" />}
                <span>{facility?.door_open ? "DOOR OPEN" : "SEALED"}</span>
              </span>
            </div>
          </div>

          {/* Chamber Schematic Wireframe */}
          <div className="relative z-10 bg-[#071810] border-2 border-dashed border-emerald-600/40 rounded-2xl p-5 space-y-6">
            {/* Top Evaporator & Air Flow Manifold */}
            <div className="bg-[#123E2B] border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between shadow-inner">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Wind className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                    Dual-Scroll Evaporator Unit (EVAP-01)
                  </span>
                  <p className="text-[11px] text-gray-300">
                    Chilled airflow velocity: 1.8 m/s • Return air temp: {(facility?.temperature_c || 12.5).toFixed(1)}°C
                  </p>
                </div>
              </div>

              {/* Airflow Animation Vector */}
              <div className="flex items-center space-x-1.5 text-[11px] text-teal-400 font-mono">
                <span className="animate-pulse">↓↓↓ AIR CIRCULATION ACTIVE ↓↓↓</span>
              </div>
            </div>

            {/* The 3 Storage Bays Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Bay 1', 'Bay 2', 'Bay 3'].map((bayName, idx) => {
                const bayBatches = batchesByBay[bayName] || [];
                const bayWeightKg = bayBatches.reduce((acc, b) => acc + (b.remaining_quantity_kg || 0), 0);
                const isSelected = selectedBay === bayName;
                const hasHighRisk = bayBatches.some(b => b.spoilage_risk === 'High');

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedBay(bayName)}
                    className={`cursor-pointer rounded-xl p-4 transition-all border-2 text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-[#164B35] border-[#E9B44C] shadow-lg ring-1 ring-[#E9B44C]"
                        : "bg-[#0E2E20] border-emerald-800/60 hover:border-emerald-600"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Boxes className={`w-4 h-4 ${isSelected ? 'text-[#E9B44C]' : 'text-emerald-400'}`} />
                        <span className="font-black text-sm text-white">{bayName}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        hasHighRisk
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                          : bayBatches.length > 0
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-gray-800 text-gray-400"
                      }`}>
                        {hasHighRisk ? "ATTENTION" : bayBatches.length > 0 ? "OPTIMAL" : "EMPTY"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-300">
                        <span>Stored Batches:</span>
                        <span className="font-bold text-white">{bayBatches.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Net Mass:</span>
                        <span className="font-bold text-white">{bayWeightKg.toLocaleString()} kg</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Microclimate:</span>
                        <span className="font-mono text-emerald-300">
                          {idx === 0 ? "12.3°C / 89%" : idx === 1 ? "12.5°C / 91%" : "12.7°C / 90%"}
                        </span>
                      </div>
                    </div>

                    {/* Stored Batch Badges */}
                    <div className="mt-3 pt-3 border-t border-emerald-800/40 flex flex-wrap gap-1">
                      {bayBatches.length > 0 ? (
                        bayBatches.map(b => (
                          <span
                            key={b.batch_id}
                            className="bg-[#071810] text-[#E9B44C] text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#E9B44C]/30"
                          >
                            {b.batch_id}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-500 italic">Bay capacity available (5 MT)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Chamber Door Access & Thermal Barrier */}
            <div className="border-t border-emerald-700/40 pt-3 flex items-center justify-between text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span>Thermal Air Curtain Sensor: AR-702 Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-gray-400">Loading Bay Access South Gate</span>
              </div>
            </div>
          </div>

          {/* Quick Explanatory Footer */}
          <div className="mt-4 flex items-center space-x-2 text-xs text-emerald-300/80">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>
              Click on any Bay above to inspect real-time tomato variety physiology, cumulative thermal hours, and harvest allocation advice.
            </span>
          </div>
        </div>

        {/* Selected Bay Detail & Real-Time Physics Inspector */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-gray-100">
              <Boxes className="w-5 h-5 text-[#164B35]" />
              <h2 className="font-black text-gray-900 text-base">
                {selectedBay} Inspection Details
              </h2>
            </div>

            {/* Batches in Selected Bay */}
            <div className="mt-4 space-y-3">
              {(batchesByBay[selectedBay] || []).length > 0 ? (
                (batchesByBay[selectedBay] || []).map(b => (
                  <div
                    key={b.batch_id}
                    className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 hover:border-[#164B35] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                        {b.batch_id}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        b.spoilage_risk === 'High' ? 'bg-rose-100 text-rose-800' :
                        b.spoilage_risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {b.spoilage_risk} Spoilage Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-gray-500 block">Variety:</span>
                        <span className="font-bold text-gray-900">{b.variety}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Stage:</span>
                        <span className="font-bold text-gray-900">{b.current_maturity_stage}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Stock:</span>
                        <span className="font-bold text-gray-900">{b.remaining_quantity_kg} kg</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Shelf Life:</span>
                        <span className="font-bold text-emerald-700">~{b.shelf_life_days_remaining} Days</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link
                        to="/storage/freshness"
                        className="text-[11px] font-bold text-[#164B35] hover:underline flex items-center space-x-1"
                      >
                        <span>Analyze Freshness</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Warehouse className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-600">No active batches stored in {selectedBay}</p>
                  <p className="text-[11px] text-gray-400 mt-1">Allocate harvested produce here via Batch Inventory</p>
                  <Link
                    to="/storage/inventory"
                    className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-[#164B35] text-white text-xs font-bold"
                  >
                    Add Batch
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Simulation Link Card */}
          <div className="bg-[#FAFDF9] border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-[#164B35]">
              <Cpu className="w-4 h-4 font-black" />
              <span className="text-xs font-black uppercase">Run Storage What-If Test</span>
            </div>
            <p className="text-xs text-gray-600">
              Simulate chamber temperature rises during power cuts or door breaches to forecast spoilage impact.
            </p>
            <Link
              to="/storage/simulator"
              className="w-full flex items-center justify-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0E3626] py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <span>Launch What-If Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}