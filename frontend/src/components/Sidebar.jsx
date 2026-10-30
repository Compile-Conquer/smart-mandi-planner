import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  Cpu, 
  Boxes, 
  Sparkles, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  X,
  Gauge
} from 'lucide-react';

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const navSections = [
    {
      group: "Overview",
      items: [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      group: "Market Intelligence",
      items: [
        { to: "/comparison", label: "Mandi Price Intelligence", icon: GitCompare },
        { to: "/forecast", label: "Price Forecasting", icon: TrendingUp },
        { to: "/arrivals", label: "Supply & Demand", icon: Package },
        { to: "/weather", label: "Weather Intelligence", icon: CloudSun },
        { to: "/transport", label: "Route & Distance Analysis", icon: Truck },
        { to: "/calculator", label: "Net Realization", icon: Calculator },
        { to: "/optimizer", label: "Harvest Optimization", icon: Network },
        { to: "/simulator", label: "Scenario Simulator", icon: SlidersHorizontal },
      ]
    },
    {
      group: "Storage Intelligence",
      items: [
        { to: "/storage/dashboard", label: "Cold Storage Dashboard", icon: Warehouse },
        { to: "/storage/digital-twin", label: "Digital Twin", icon: Cpu },
        { to: "/storage/inventory", label: "Batch Inventory", icon: Boxes },
        { to: "/storage/freshness", label: "Freshness Analysis", icon: Sparkles },
        { to: "/storage/alerts", label: "Storage Alerts", icon: AlertTriangle },
        { to: "/storage/simulator", label: "What-If Simulation", icon: Gauge },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#123E2B] text-white border-r border-[#1B583E] select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[#1B583E]">
        <Link to="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-[#E9B44C] flex items-center justify-center text-[#164B35] shadow-md flex-shrink-0">
            <Sprout className="w-5 h-5 stroke-[2.5]" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="overflow-hidden transition-all duration-200">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black tracking-tight text-white">MandiMitra</span>
                <span className="bg-[#E9B44C] text-[#164B35] text-[10px] font-black px-1 py-0.2 rounded uppercase">
                  AI
                </span>
              </div>
              <span className="text-[10px] text-[#DDEBDD] font-medium tracking-wide block truncate">
                Sell Smarter • Store Better
              </span>
            </div>
          )}
        </Link>

        {isMobileOpen && (
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close Mobile Sidebar"
            className="p-1 rounded-lg text-gray-300 hover:text-white hover:bg-[#1B583E]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-800">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {(!isCollapsed || isMobileOpen) && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2">
                {section.group}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => isMobileOpen && setIsMobileOpen(false)}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#E9B44C] text-[#164B35] font-bold shadow-sm"
                      : "text-emerald-100 hover:bg-[#1B583E] hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#164B35]" : "text-emerald-300"}`} />
                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Desktop Collapse Toggle at Bottom */}
      <div className="hidden lg:flex items-center justify-between p-3 border-t border-[#1B583E] bg-[#0E3626]">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold text-emerald-200 hover:bg-[#1B583E] hover:text-white transition-colors"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-[#E9B44C]" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 text-[#E9B44C]" />
              <span className="text-[11px]">Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 transition-all duration-300 ease-in-out z-40 ${
          isCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide-out) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative w-[280px] max-w-[80vw] h-full shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
