import React, { useState, useEffect } from 'react';
import { Menu, Activity, Warehouse, Cpu, RefreshCw, Radio } from 'lucide-react';
import { useFarmerState, LOCATION_PRESETS } from '../context/FarmerStateContext';
import { api } from '../services/api';

export default function TopHeader({ onOpenMobileSidebar }) {
  const { crop, setCrop, quantity, setQuantity, selectedLocation, setSelectedLocation } = useFarmerState();
  const [facility, setFacility] = useState(null);

  const fetchStatus = () => {
    api.getStorageFacility()
      .then(setFacility)
      .catch(console.error);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000); // Poll status every 8s
    return () => clearInterval(interval);
  }, []);

  const handleToggleMode = () => {
    const nextMode = !(facility?.simulation_active);
    api.toggleSimulationMode(nextMode)
      .then(() => fetchStatus())
      .catch(console.error);
  };

  const statusText = facility?.connection_status || "OFFLINE SIMULATION MODE";
  const isConnected = statusText === "WOKWI SENSOR CONNECTED";
  const isOffline = statusText === "OFFLINE SIMULATION MODE";

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {/* Mobile Hamburger & Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            aria-label="Open Navigation Sidebar"
            className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-800" />
          </button>

          <div className="hidden sm:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              MandiMitra AI v2.0
            </span>
          </div>
        </div>

        {/* Global Selectors: Crop, Quantity, Farm Origin */}
        <div className="hidden md:flex items-center space-x-2 text-xs">
          {/* Crop Selector */}
          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-gray-500 font-semibold">Crop:</span>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              aria-label="Active Crop Selection"
              className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Potato">Potato</option>
              <option value="Brinjal">Brinjal</option>
              <option value="Green Chilli">Green Chilli</option>
            </select>
          </div>

          {/* Harvest Quantity */}
          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-gray-500 font-semibold">Harvest:</span>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              aria-label="Harvest Quantity Selection"
              className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer"
            >
              <option value={2.0}>2.0 Tonnes (20 q)</option>
              <option value={5.0}>5.0 Tonnes (50 q)</option>
              <option value={10.0}>10.0 Tonnes (100 q)</option>
              <option value={15.0}>15.0 Tonnes (150 q)</option>
            </select>
          </div>

          {/* Farm Location */}
          <div className="flex items-center space-x-1 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
            <span className="text-gray-500 font-semibold">Farm:</span>
            <select
              value={selectedLocation.name}
              onChange={(e) => {
                const match = LOCATION_PRESETS.find(p => p.name === e.target.value);
                if (match) setSelectedLocation(match);
              }}
              aria-label="Farm Location Preset"
              className="bg-transparent font-bold text-gray-900 outline-none cursor-pointer max-w-[150px] truncate"
            >
              {LOCATION_PRESETS.map((p, idx) => (
                <option key={idx} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Status Badge & Telemetry Indicator */}
        <div className="flex items-center space-x-2">
          {/* Digital Twin Sensor Badge */}
          <button
            onClick={handleToggleMode}
            title="Click to toggle between live Wokwi sensor mode and offline simulation"
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              isConnected
                ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                : isOffline
                ? "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100"
                : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-emerald-500 animate-pulse" : isOffline ? "bg-indigo-500" : "bg-amber-500"
            }`} />
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{statusText}</span>
            <span className="sm:hidden">{isConnected ? "WOKWI" : "OFFLINE"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
