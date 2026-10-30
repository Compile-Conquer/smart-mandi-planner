import React, { createContext, useContext, useState } from 'react';

const TRANSLATIONS = {
  en: {
    appName: "MandiMitra AI",
    tagline: "Don't just sell your harvest. Sell it smarter.",
    home: "Home",
    dashboard: "Dashboard",
    comparison: "Market Comparison",
    forecast: "Price Forecast",
    arrivals: "Arrivals",
    weather: "Weather Intelligence",
    transport: "Transport Map",
    calculator: "Profit Calculator",
    optimizer: "Harvest Optimizer",
    simulator: "Scenario Simulator",
    crop: "Crop",
    quantity: "Quantity",
    harvestDate: "Harvest Date",
    sellingDate: "Selling Date",
    location: "Farmer Location",
    netRealization: "Expected Net Realization",
    grossRevenue: "Gross Revenue",
    expenses: "Logistics & Storage Deductions",
    bestMandi: "Recommended Mandi",
    distance: "Distance",
    currentPrice: "Current Modal Price",
    forecastPrice: "Forecasted Price",
    storageCost: "Cold Storage Cost",
    spoilageLoss: "Spoilage Risk Loss",
    transportCost: "Transport Expense",
    handlingCost: "Mandi Handling Charge",
    optimizeBtn: "Run AI Allocation Optimizer",
    simulateBtn: "Simulate What-If Market Scenario",
    quintal: "quintal",
    tonne: "tonne",
    tonnes: "tonnes",
    rupeesPerQ: "₹/quintal",
    switchLang: "ಕನ್ನಡ",
  },
  kn: {
    appName: "ಮಂಡಿಮಿತ್ರ AI",
    tagline: "ಕೇವಲ ಬೆಳೆ ಮಾರಾಟ ಮಾಡಬೇಡಿ. ಹೆಚ್ಚು ಲಾಭಕ್ಕಾಗಿ ಜಾಣ್ಮೆಯಿಂದ ಮಾರಿ.",
    home: "ಮುಖಪುಟ",
    dashboard: "ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    comparison: "ಮಾರುಕಟ್ಟೆ ಹೋಲಿಕೆ",
    forecast: "ಬೆಲೆ ಮುನ್ಸೂಚನೆ",
    arrivals: "ಮಾರುಕಟ್ಟೆ ಆವಕ",
    weather: "ಹವಾಮಾನ ಮಾಹಿತಿ",
    transport: "ಸಾರಿಗೆ ನಕ್ಷೆ",
    calculator: "ನಿವ್ವಳ ಲಾಭ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
    optimizer: "ಬೆಳೆ ಹಂಚಿಕೆ ಆಪ್ಟಿಮೈಜರ್",
    simulator: "ಮಾರುಕಟ್ಟೆ ಸಿಮ್ಯುಲೇಟರ್",
    crop: "ಬೆಳೆ",
    quantity: "ಪ್ರಮಾಣ",
    harvestDate: "ಕಟಾವು ದಿನಾಂಕ",
    sellingDate: "ಮಾರಾಟದ ದಿನಾಂಕ",
    location: "ರೈತರ ಜಮೀನಿನ ಸ್ಥಳ",
    netRealization: "ನಿರೀಕ್ಷಿತ ನಿವ್ವಳ ಲಾಭ",
    grossRevenue: "ಒಟ್ಟು ಆದಾಯ",
    expenses: "ಸಾರಿಗೆ ಮತ್ತು ಶೇಖರಣಾ ವೆಚ್ಚ",
    bestMandi: "ಅತ್ಯುತ್ತಮ ಮಾರುಕಟ್ಟೆ",
    distance: "ದೂರ",
    currentPrice: "ಇಂದಿನ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
    forecastPrice: "ಮುನ್ಸೂಚಿತ ಬೆಲೆ",
    storageCost: "ಶೀತಲ ಗೋದಾಮು ವೆಚ್ಚ",
    spoilageLoss: "ಹಾಳಾಗುವ ನಷ್ಟ",
    transportCost: "ಸಾರಿಗೆ ವೆಚ್ಚ",
    handlingCost: "ಹಮಾಲಿ / ನಿರ್ವಹಣಾ ವೆಚ್ಚ",
    optimizeBtn: "AI ಆಪ್ಟಿಮೈಜರ್ ಚಲಾಯಿಸಿ",
    simulateBtn: "ಮಾರುಕಟ್ಟೆ ಸ್ಥಿತಿ ಸಿಮ್ಯುಲೇಟ್ ಮಾಡಿ",
    quintal: "ಕ್ವಿಂಟಾಲ್",
    tonne: "ಟನ್",
    tonnes: "ಟನ್‌ಗಳು",
    rupeesPerQ: "ರೂ/ಕ್ವಿಂಟಾಲ್",
    switchLang: "English",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');
  
  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'kn' : 'en'));
  };

  const t = (key) => {
    return TRANSLATIONS[lang][key] || TRANSLATIONS['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
