import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { FarmerStateProvider } from './context/FarmerStateContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import LandingPage from './pages/LandingPage';
import FarmerDashboard from './pages/FarmerDashboard';
import MarketComparison from './pages/MarketComparison';
import PriceForecastPage from './pages/PriceForecastPage';
import ArrivalForecastPage from './pages/ArrivalForecastPage';
import WeatherIntelligencePage from './pages/WeatherIntelligencePage';
import TransportationMapPage from './pages/TransportationMapPage';
import NetRealizationCalculatorPage from './pages/NetRealizationCalculatorPage';
import HarvestOptimizerPage from './pages/HarvestOptimizerPage';
import ScenarioSimulatorPage from './pages/ScenarioSimulatorPage';

export default function App() {
  return (
    <LanguageProvider>
      <FarmerStateProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#F8FAF5] text-[#202820]">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<FarmerDashboard />} />
                <Route path="/comparison" element={<MarketComparison />} />
                <Route path="/forecast" element={<PriceForecastPage />} />
                <Route path="/arrivals" element={<ArrivalForecastPage />} />
                <Route path="/weather" element={<WeatherIntelligencePage />} />
                <Route path="/transport" element={<TransportationMapPage />} />
                <Route path="/calculator" element={<NetRealizationCalculatorPage />} />
                <Route path="/optimizer" element={<HarvestOptimizerPage />} />
                <Route path="/simulator" element={<ScenarioSimulatorPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </FarmerStateProvider>
    </LanguageProvider>
  );
}
