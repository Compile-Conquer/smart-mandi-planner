import React from 'react';
import { Sprout, ShieldCheck, Cpu, Database, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#123e2b] text-[#DDEBDD] border-t border-[#1b583e] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-[#E9B44C] flex items-center justify-center text-[#164B35]">
                <Sprout className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold text-white">MandiMitra AI</span>
            </div>
            <p className="text-sm text-gray-300 max-w-md leading-relaxed">
              Empowering Indian farmers with machine-learning price forecasts, real-time transportation intelligence, 
              and linear programming optimization to maximize actual net profit realization instead of naive market price selection.
            </p>
            <div className="text-xs text-[#E9B44C] font-medium pt-1">
              "Don't just sell your harvest. Sell it smarter."
            </div>
          </div>

          {/* Technology & Verified Sources */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Integrations</h4>
            <ul className="space-y-2 text-xs text-gray-300">
              <li className="flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-[#E9B44C]" />
                <span>AGMARKNET Market Arrivals</span>
              </li>
              <li className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-[#E9B44C]" />
                <span>XGBoost & Random Forest ML</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-[#E9B44C]" />
                <span>Open-Meteo & OSRM Routing</span>
              </li>
              <li className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E9B44C]" />
                <span>SciPy Highs Linear Optimizer</span>
              </li>
            </ul>
          </div>

          {/* Quick Disclaimer */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Notice & Transparency</h4>
            <p className="text-xs text-gray-300 leading-normal">
              Market predictions are generated based on historical Agmarknet arrival trends and local climatic conditions. 
              Actual prices at APMC physical auctions are determined by real-time bidding, lot grading, and buyer volume.
            </p>
            <p className="text-xs text-emerald-400 mt-2 font-mono">
              v1.0.0 • Deployment Ready
            </p>
          </div>
        </div>

        <div className="border-t border-[#1b583e] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© 2026 MandiMitra AI Platform. Designed for Indian Agricultural Market Resilience.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span>Karnataka APMC Network</span>
            <span>•</span>
            <span>Bilingual (English / ಕನ್ನಡ)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
