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
  Languages,
  Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useFarmerState, LOCATION_PRESETS } from '../context/FarmerStateContext';

export default function Navbar() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { crop, setCrop, quantity, setQuantity, selectedLocation, setSelectedLocation } = useFarmerState();

  const navItems = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/comparison", label: t("comparison"), icon: GitCompare },
    { to: "/forecast", label: t("forecast"), icon: TrendingUp },
    { to: "/arrivals", label: t("arrivals"), icon: Package },
    { to: "/weather", label: t("weather"), icon: CloudSun },
    { to: "/transport", label: t("transport"), icon: Truck },
    { to: "/calculator", label: t("calculator"), icon: Calculator },
    { to: "/optimizer", label: t("optimizer"), icon: Network },
    { to: "/simulator", label: t("simulator"), icon: SlidersHorizontal },
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
                {t("tagline")}
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
                <option value="Tomato">Tomato (ಟೊಮೇಟೊ)</option>
                <option value="Onion">Onion (ಈರುಳ್ಳಿ)</option>
                <option value="Potato">Potato (ಆಲೂಗಡ್ಡೆ)</option>
                <option value="Brinjal">Brinjal (ಬದನೆಕಾಯಿ)</option>
                <option value="Green Chilli">Green Chilli (ಹಸಿಮೆಣಸಿನಕಾಯಿ)</option>
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

          {/* Right Tools: Language Toggle & Live Status */}
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 bg-[#DDEBDD] text-[#164B35] hover:bg-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
              title="Toggle English / ಕನ್ನಡ"
            >
              <Languages className="w-4 h-4 text-[#164B35]" />
              <span>{t("switchLang")}</span>
            </button>

            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-emerald-300 bg-[#0e3626] px-2.5 py-1.5 rounded-lg border border-emerald-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Agmarknet Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subnav Page Tabs */}
      <nav className="bg-[#123e2b] px-4 overflow-x-auto scrollbar-none border-t border-[#1b583e]">
        <div className="max-w-7xl mx-auto flex space-x-1 py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#E9B44C] text-[#164B35] shadow-sm"
                      : "text-[#DDEBDD] hover:bg-[#1b583e] hover:text-white"
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
