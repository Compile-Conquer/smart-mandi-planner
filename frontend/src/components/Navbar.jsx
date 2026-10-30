import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  Sprout, 
  LayoutDashboard, 
  GitCompare, 
  TrendingUp, 
  Package, 
  CloudSun, 
  Truck, 
  Calculator, 
  Network, 
  SlidersHorizontal,
  Warehouse,
  Boxes,
  Cpu
} from 'lucide-react';
import { useFarmerState, LOCATION_PRESETS } from '../context/FarmerStateContext';

export default function Navbar() {
  const { crop, setCrop, quantity, setQuantity, selectedLocation, setSelectedLocation } = useFarmerState();

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/comparison", label: "Comparison", icon: GitCompare },
    { to: "/forecast", label: "Price Forecast", icon: TrendingUp },
    { to: "/arrivals", label: "Arrivals", icon: Package },
    { to: "/weather", label: "Weather", icon: CloudSun },
    { to: "/transport", label: "Transport Map", icon: Truck },
    { to: "/calculator", label: "Calculator", icon: Calculator },
    { to: "/optimizer", label: "Optimizer", icon: Network },
    { to: "/simulator", label: "Simulator", icon: SlidersHorizontal },
    { to: "/storage/dashboard", label: "Cold Storage", icon: Warehouse },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#164B35] text-white shadow-lg border-b border-[#236348]">
      {/* Top Banner & Quick Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#E9B44C] flex items-center justify-center text-[#164B35] shadow-md group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">MandiMitra</span>
                <span className="bg-[#E9B44C] text-[#164B35] text-xs font-black px-1.5 py-0.5 rounded uppercase">AI</span>
              </div>
              <p className="text-[11px] text-[#DDEBDD] font-medium hidden sm:block">
                Don't just sell your harvest. Sell it smarter.
              </p>
            </div>
          </Link>

          {/* Global Farmer Preset Controls */}
          <div className="hidden md:flex items-center space-x-3 bg-[#0e3626] px-3 py-1.5 rounded-xl border border-[#276a4e]">
            {/* Crop Selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-300 font-medium">Crop:</span>
              <select 
                value={crop} 
                onChange={(e) => setCrop(e.target.value)}
                aria-label="Select Crop"
                className="bg-[#164B35] text-white font-semibold rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#E9B44C] outline-none cursor-pointer"
              >
                <option value="Tomato">Tomato</option>
                <option value="Onion">Onion</option>
                <option value="Potato">Potato</option>
                <option value="Brinjal">Brinjal</option>
                <option value="Green Chilli">Green Chilli</option>
              </select>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-300 font-medium">Harvest:</span>
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                aria-label="Select Harvest Quantity"
                className="bg-[#164B35] text-white font-semibold rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#E9B44C] outline-none cursor-pointer"
              >
                <option value={2.0}>2.0 Tonnes (20 q)</option>
                <option value={5.0}>5.0 Tonnes (50 q)</option>
                <option value={10.0}>10.0 Tonnes (100 q)</option>
                <option value={15.0}>15.0 Tonnes (150 q)</option>
              </select>
            </div>

            {/* Farm Location Preset */}
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-300 font-medium">Farm:</span>
              <select 
                value={selectedLocation.name}
                aria-label="Select Farm Location"
                onChange={(e) => {
                  const match = LOCATION_PRESETS.find(p => p.name === e.target.value);
                  if (match) setSelectedLocation(match);
                }}
                className="bg-[#164B35] text-white font-semibold rounded px-2 py-1 text-xs focus:ring-1 focus:ring-[#E9B44C] outline-none cursor-pointer max-w-[140px] truncate"
              >
                {LOCATION_PRESETS.map((p, idx) => (
                  <option key={idx} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}