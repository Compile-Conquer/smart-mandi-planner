import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Warehouse, 
  Thermometer, 
  Droplets, 
  Boxes, 
  AlertTriangle, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  DoorClosed, 
  Radio, 
  ArrowUpRight, 
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import StatCard from '../../components/StatCard';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

export default function ColdStorageDashboard() {
  const [facility, setFacility] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getStorageFacility(),
      api.getSensorHistory(30),
      api.getBatches({ include_exhausted: false }),
      api.getStorageAlerts()
    ])
      .then(([fac, hist, bList, altList]) => {
        setFacility(fac);
        setSensorHistory(hist);
        setBatches(bList);
        setAlerts(altList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  const totalRemainingKg = batches.reduce((acc, b) => acc + (b.remaining_quantity_kg || 0), 0);
  const urgentBatches = batches.filter(b => b.spoilage_risk === "High" || b.current_maturity_stage === "Overripe");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Cold Storage Intelligence
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Chamber A • Wokwi IoT Synchronized
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Cold Storage Facility Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time environmental monitoring, batch freshness tracking, and digital twin facility synchronization.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            to="/storage/digital-twin"
            className="flex items-center space-x-1.5 bg-[#164B35] text-white hover:bg-[#0e3626] px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Cpu className="w-3.5 h-3.5 text-[#E9B44C]" />
            <span>Digital Twin Schematic</span>
          </Link>
        </div>
      </div>

      {/* Facility Status Alert Banner (if active alerts exist) */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-300 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{alerts.length} Active Storage Alerts Detected</span>
            </div>
            <Link to="/storage/alerts" className="text-xs font-bold text-amber-900 hover:underline">
              View All Alerts &rarr;
            </Link>
          </div>
          <p className="text-xs text-amber-950 font-medium">
            {alerts[0].title}: {alerts[0].description}
          </p>
        </div>
      )}

      {/* Top Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Storage Chamber Temperature"
          value={facility && (facility.temperature_c ?? facility.current_temperature) !== undefined ? `${(facility.temperature_c ?? facility.current_temperature).toFixed(1)}°C` : "—"}
          subtitle={`Target: ${facility?.target_temperature || 12.5}°C`}
          icon={Thermometer}
          color="forest"
          badge={
            <span className="text-[#E9B44C] font-semibold">
              Refrigeration: {facility?.refrigeration_status || 'RUNNING'}
            </span>
          }
        />

        <StatCard
          title="Chamber Relative Humidity"
          value={facility && (facility.humidity_percent ?? facility.current_humidity ?? facility.humidity_pct) !== undefined ? `${(facility.humidity_percent ?? facility.current_humidity ?? facility.humidity_pct).toFixed(1)}%` : "—"}
          subtitle={`Target: ${facility?.target_humidity || 90.0}% RH`}
          icon={Droplets}
          color="blue"
          badge={
            <span className="text-blue-800 font-semibold">
              Optimal moisture retention
            </span>
          }
        />

        <StatCard
          title="Remaining Tomato Stock"
          value={`${totalRemainingKg.toLocaleString()} kg`}
          subtitle={`Occupancy: ${facility?.occupied_capacity_kg?.toLocaleString() || 0} / ${facility?.total_capacity_kg?.toLocaleString() || 15000} kg`}
          icon={Boxes}
          color="emerald"
          badge={
            <span className="text-emerald-800 font-semibold">
              {batches.length} Active Batches
            </span>
          }
        />

        <StatCard
          title="Priority Inspection Stock"
          value={`${urgentBatches.reduce((a, b) => a + b.remaining_quantity_kg, 0)} kg`}
          subtitle={`${urgentBatches.length} batch(es) at elevated risk`}
          icon={Sparkles}
          color={urgentBatches.length > 0 ? "amber" : "emerald"}
          badge={
            <span className="font-semibold">
              {urgentBatches.length > 0 ? "Requires physical review" : "All batches stable"}
            </span>
          }
        />
      </div>

      {/* Facility Hardware & Environment Status Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-xs">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-[#164B35]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 font-semibold block text-[10px] uppercase">Telemetry Connection</span>
            <span className="font-bold text-gray-900">{facility?.connection_status || "OFFLINE SIMULATION MODE"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 font-semibold block text-[10px] uppercase">Power Supply</span>
            <span className="font-bold text-gray-900">{facility?.power_status || "MAINS_ONLINE"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800">
            <Warehouse className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 font-semibold block text-[10px] uppercase">Cooling Compressor</span>
            <span className="font-bold text-gray-900">{facility?.refrigeration_status || "RUNNING"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-800">
            <DoorClosed className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 font-semibold block text-[10px] uppercase">Chamber Door</span>
            <span className="font-bold text-gray-900">{facility?.door_status || "CLOSED"}</span>
          </div>
        </div>
      </div>

      {/* Environmental History Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
              Real-Time Telemetry Stream
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              Chamber Temperature & Humidity History
            </h3>
            <p className="text-xs text-gray-500">
              Live telemetry streamed from Wokwi ESP32 + DHT22 node (or simulated offline timeline).
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            Target: 12.5°C • 88% RH
          </span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorHistory} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="timestamp" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[5, 30]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}°C`} />
              <YAxis yAxisId="right" orientation="right" domain={[50, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Line yAxisId="left" type="monotone" dataKey="temperature_c" stroke="#164B35" strokeWidth={2.5} dot={{ r: 2 }} name="Temperature (°C)" />
              <Line yAxisId="right" type="monotone" dataKey="humidity_pct" stroke="#3b82f6" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 2 }} name="Humidity (% RH)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Inventory Preview */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
              Stored Inventory
            </span>
            <h3 className="text-lg font-bold text-gray-900">
              Active Tomato Batches in Chamber
            </h3>
          </div>
          <Link
            to="/storage/inventory"
            className="text-xs font-bold text-[#164B35] hover:underline flex items-center space-x-1"
          >
            <span>Manage Inventory ({batches.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase">
                <th className="py-2.5 px-3">Batch ID</th>
                <th className="py-2.5 px-3">Farmer</th>
                <th className="py-2.5 px-3">Variety</th>
                <th className="py-2.5 px-3">Remaining (kg)</th>
                <th className="py-2.5 px-3">Maturity Stage</th>
                <th className="py-2.5 px-3">Spoilage Risk</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {batches.slice(0, 5).map((b, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-3 font-bold text-gray-900">
                    {b.batch_id}
                    {b.is_demo && (
                      <span className="ml-1.5 bg-gray-100 text-gray-600 text-[9px] font-bold px-1.5 py-0.2 rounded">
                        DEMO
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-gray-700">{b.farmer_name}</td>
                  <td className="py-3 px-3 text-gray-600">{b.variety}</td>
                  <td className="py-3 px-3 font-black text-gray-900">
                    {b.remaining_quantity_kg.toLocaleString()} kg
                  </td>
                  <td className="py-3 px-3 font-semibold text-amber-700">
                    {b.current_maturity_stage}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      b.spoilage_risk === "High" ? "bg-red-100 text-red-800" :
                      b.spoilage_risk === "Medium" ? "bg-amber-100 text-amber-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {b.spoilage_risk} Risk
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      to={`/storage/freshness?batch=${encodeURIComponent(b.batch_id)}`}
                      className="bg-gray-100 hover:bg-[#164B35] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all inline-block"
                    >
                      Analysis
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
