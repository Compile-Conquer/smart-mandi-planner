import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FarmerStateProvider } from './context/FarmerStateContext';

import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Footer from './components/Footer';

// Market Intelligence Pages
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

// Storage & Digital Twin Intelligence Pages
import ColdStorageDashboard from './pages/storage/ColdStorageDashboard';
import DigitalTwinPage from './pages/storage/DigitalTwinPage';
import BatchInventoryPage from './pages/storage/BatchInventoryPage';
import FreshnessAnalysisPage from './pages/storage/FreshnessAnalysisPage';
import StorageAlertsPage from './pages/storage/StorageAlertsPage';
import WhatIfStorageSimulationPage from './pages/storage/WhatIfStorageSimulationPage';

function AppLayout({ children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAF5] text-[#202820]">
      {/* Modern Collapsible Sidebar (Desktop & Mobile Slide-Out Drawer) */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* SaaS Top Header with Wokwi Connection Status & Global Selectors */}
        <TopHeader onOpenMobileSidebar={() => setIsMobileOpen(true)} />

        {/* Dynamic Route Content */}
        <main className="flex-1">
          {children}
        </main>

        {/* Enterprise Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FarmerStateProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            {/* Overview */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<FarmerDashboard />} />

            {/* Market Intelligence */}
            <Route path="/comparison" element={<MarketComparison />} />
            <Route path="/forecast" element={<PriceForecastPage />} />
            <Route path="/arrivals" element={<ArrivalForecastPage />} />
            <Route path="/weather" element={<WeatherIntelligencePage />} />
            <Route path="/transport" element={<TransportationMapPage />} />
            <Route path="/calculator" element={<NetRealizationCalculatorPage />} />
            <Route path="/optimizer" element={<HarvestOptimizerPage />} />
            <Route path="/simulator" element={<ScenarioSimulatorPage />} />

            {/* Storage & Digital Twin Intelligence */}
            <Route path="/storage/dashboard" element={<ColdStorageDashboard />} />
            <Route path="/storage/digital-twin" element={<DigitalTwinPage />} />
            <Route path="/storage/inventory" element={<BatchInventoryPage />} />
            <Route path="/storage/freshness" element={<FreshnessAnalysisPage />} />
            <Route path="/storage/alerts" element={<StorageAlertsPage />} />
            <Route path="/storage/simulator" element={<WhatIfStorageSimulationPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </FarmerStateProvider>
  );
}