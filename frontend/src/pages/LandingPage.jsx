import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sprout, 
  TrendingUp, 
  Truck, 
  Network, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Coins, 
  CloudRain, 
  BarChart3,
  Scale
} from 'lucide-react';
import { useFarmerState } from '../context/FarmerStateContext';

export default function LandingPage() {
  const { crop, quantity, selectedLocation } = useFarmerState();

  const features = [
    {
      title: "Predictive Price Forecasting",
      desc: "XGBoost and Random Forest models evaluate 7–14 day modal price trajectories with chronological train-test validation and prediction intervals.",
      icon: TrendingUp,
      badge: "ML Powered"
    },
    {
      title: "True Net Realization Engine",
      desc: "Never sell blindly based on today's gross price. We deduct road freight, APMC handling fees, cold storage expenses, and perishable spoilage.",
      icon: Scale,
      badge: "Fintech Core"
    },
    {
      title: "SciPy Harvest Allocation Optimizer",
      desc: "Linear Programming automatically decides how many tonnes to send to each mandi and on which date to maximize total harvest payout.",
      icon: Network,
      badge: "Linear Programming"
    },
    {
      title: "Geospatial Road Logistics",
      desc: "Integrates OpenStreetMap and OSRM highway routing to calculate exact freight transit costs, road distance, and driving hours.",
      icon: Truck,
      badge: "OSRM Highway"
    },
    {
      title: "Agro-Weather Intelligence",
      desc: "Open-Meteo 7-day meteorological forecasts assess rainfall risks, harvesting delay alerts, and humidity-driven fungal spoilage hazards.",
      icon: CloudRain,
      badge: "Open-Meteo"
    },
    {
      title: "What-If Scenario Simulator",
      desc: "Experiment with price drops, fuel surcharges, and storage hold times to stress-test your selling strategy before sending your truck.",
      icon: Coins,
      badge: "Simulation"
    }
  ];

  const steps = [
    {
      step: "01",
      title: "Enter Crop & Harvest Details",
      desc: "Specify your crop (Tomato, Onion, Potato, etc.), available quantity in tonnes, and harvest date."
    },
    {
      step: "02",
      title: "AI Scans Multi-Mandi Network",
      desc: "The platform evaluates dozens of regional APMC mandis, road distances, and forward price forecasts."
    },
    {
      step: "03",
      title: "Deduct Real-World Logistics Costs",
      desc: "Transportation freight, mandi handling charges, and storage decay are factored into every candidate mandi."
    },
    {
      step: "04",
      title: "Receive Maximized Profit Strategy",
      desc: "Get an exact allocation plan: where to send your trucks, when to sell, and your expected net realization in Rupees."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAF5] text-[#202820]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#164B35] to-[#123e2b] text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#E9B44C_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#0e3626] border border-[#276a4e] px-4 py-1.5 rounded-full text-xs font-semibold text-[#E9B44C] shadow-inner">
            <Sprout className="w-4 h-4" />
            <span>Next-Generation Agricultural Market Intelligence for Indian Farmers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            "Don't just sell your harvest.<br />
            <span className="text-[#E9B44C] underline decoration-[#E9B44C]/30 decoration-wavy">Sell it smarter."</span>
          </h1>

          <p className="text-base sm:text-lg text-[#DDEBDD] max-w-2xl mx-auto leading-relaxed">
            MandiMitra AI eliminates guesswork for farmers. By combining machine learning price forecasts, 
            OSRM road logistics, and SciPy linear optimization, we maximize your <strong className="text-white">NET PROFIT</strong> — not just gross price.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#E9B44C] text-[#164B35] hover:bg-amber-400 font-extrabold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <span>Open Farmer Dashboard</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/optimizer"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#0e3626] hover:bg-[#164B35] text-white border border-[#276a4e] font-bold px-6 py-3.5 rounded-xl transition-all"
            >
              <Network className="w-4 h-4 text-[#E9B44C]" />
              <span>Run Allocation Optimizer</span>
            </Link>
          </div>

          {/* Live Quick Banner */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            <div className="bg-[#0e3626]/80 backdrop-blur p-3.5 rounded-xl border border-[#276a4e]">
              <span className="text-[11px] text-gray-400 block">Default Scenario</span>
              <span className="text-sm font-bold text-white">{crop} • {quantity}t</span>
            </div>
            <div className="bg-[#0e3626]/80 backdrop-blur p-3.5 rounded-xl border border-[#276a4e]">
              <span className="text-[11px] text-gray-400 block">Farm Origin</span>
              <span className="text-sm font-bold text-white truncate block">{selectedLocation.name.split(' ')[0]}</span>
            </div>
            <div className="bg-[#0e3626]/80 backdrop-blur p-3.5 rounded-xl border border-[#276a4e]">
              <span className="text-[11px] text-gray-400 block">ML Horizons</span>
              <span className="text-sm font-bold text-[#E9B44C]">7 & 14 Day Forecast</span>
            </div>
            <div className="bg-[#0e3626]/80 backdrop-blur p-3.5 rounded-xl border border-[#276a4e]">
              <span className="text-[11px] text-gray-400 block">Optimizer Engine</span>
              <span className="text-sm font-bold text-emerald-400">SciPy Highs LP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">The Agricultural Reality</span>
          <h2 className="text-3xl font-black text-gray-900 mt-1">Why High Market Price Often Misleads Farmers</h2>
          <p className="text-sm text-gray-600 mt-2">
            A mandi 90 km away offering ₹3,200/q might actually yield LESS money in your pocket than a mandi 25 km away offering ₹2,900/q once diesel, toll, handling, and transit spoilage are accounted for.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Traditional Way */}
          <div className="bg-red-50/50 rounded-2xl border border-red-200 p-7 space-y-4">
            <div className="flex items-center space-x-2 text-red-700 font-bold text-lg">
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm">✕</span>
              <span>Traditional Farmer Decision</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Selects mandi with highest reported price today without knowing tomorrow's arrival glut.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Ignores freight transit costs (₹35–₹50/km) which can consume up to 25% of gross revenue.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Dumps 100% of harvest into a single market yard, crashing local spot prices.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Unaware of monsoon rain delays causing fungal decay in transit.</span>
              </li>
            </ul>
          </div>

          {/* MandiMitra AI Way */}
          <div className="bg-emerald-50/60 rounded-2xl border border-emerald-300 p-7 space-y-4 shadow-sm">
            <div className="flex items-center space-x-2 text-[#164B35] font-bold text-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <span>The MandiMitra AI Advantage</span>
            </div>
            <ul className="space-y-3 text-sm text-gray-800">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Forecasts prices 7–14 days ahead using trained XGBoost Regressors with uncertainty intervals.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Calculates complete Net Realization after exact fuel, driver, APMC cess, and storage expenses.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Linear Programming optimizer splits harvest strategically across multiple trading hubs.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>Live Open-Meteo weather intelligence flags high-risk harvesting and rain-damaged transit windows.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="bg-white py-16 px-4 sm:px-6 lg:px-8 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">Core Capabilities</span>
            <h2 className="text-3xl font-black text-gray-900 mt-1">Full-Stack Intelligence Architecture</h2>
            <p className="text-sm text-gray-600 mt-2">
              Engineered with production-grade algorithms and verified real-world Indian agricultural datasets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-[#F8FAF5] border border-gray-200 hover:border-[#164B35] transition-all hover:shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#164B35]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-bold text-[#164B35] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{feat.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works workflow */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">Workflow</span>
          <h2 className="text-3xl font-black text-gray-900 mt-1">How MandiMitra AI Operates</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((st, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative space-y-3">
              <span className="text-3xl font-black text-[#E9B44C]">{st.step}</span>
              <h3 className="text-base font-bold text-gray-900">{st.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{st.desc}</p>
            </div>
          ))}
        </div>

        {/* Big CTA */}
        <div className="mt-16 bg-[#164B35] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-black">
            Ready to Optimize Your Harvest Payout?
          </h2>
          <p className="text-sm sm:text-base text-[#DDEBDD] max-w-xl mx-auto">
            Try the live dashboard right now with Karnataka tomato and vegetable mandi datasets.
          </p>
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 bg-[#E9B44C] text-[#164B35] hover:bg-amber-400 font-extrabold px-8 py-3.5 rounded-xl shadow-lg transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
