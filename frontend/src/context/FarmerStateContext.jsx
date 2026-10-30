import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const LOCATION_PRESETS = [
  { name: "Mysuru Farm (Nanjangud Road)", lat: 12.2958, lon: 76.6394, state: "Karnataka" },
  { name: "Kolar Vegetable Belt (Malur)", lat: 13.0039, lon: 77.9399, state: "Karnataka" },
  { name: "Chamarajanagar Farm", lat: 11.9261, lon: 76.9437, state: "Karnataka" },
  { name: "Chikkaballapur Farm", lat: 13.4325, lon: 77.7275, state: "Karnataka" },
  { name: "Dharwad / Hubli Belt", lat: 15.4589, lon: 75.0078, state: "Karnataka" },
  { name: "Hosur Border Region", lat: 12.7409, lon: 77.8253, state: "Tamil Nadu" },
];

const FarmerStateContext = createContext();

export function FarmerStateProvider({ children }) {
  const [crop, setCrop] = useState("Tomato");
  const [quantity, setQuantity] = useState(5.0); // Tonnes
  const [harvestDate, setHarvestDate] = useState("2026-10-30");
  const [sellingDate, setSellingDate] = useState("2026-10-30");
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_PRESETS[0]);
  
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        crop,
        quantity_tonnes: Number(quantity),
        harvest_date: harvestDate,
        selling_date: sellingDate || harvestDate,
        farmer_lat: selectedLocation.lat,
        farmer_lon: selectedLocation.lon,
        farmer_location_name: selectedLocation.name,
        custom_transport_cost_per_km: 35.0,
        custom_handling_cost_per_q: 15.0,
        custom_storage_cost_per_day_per_q: 3.5,
        custom_spoilage_rate_pct_per_day: 1.5,
      };
      const res = await api.getRecommendations(payload);
      setRecommendations(res);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [crop, quantity, harvestDate, selectedLocation]);

  const topRecommendation = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <FarmerStateContext.Provider value={{
      crop, setCrop,
      quantity, setQuantity,
      harvestDate, setHarvestDate,
      sellingDate, setSellingDate,
      selectedLocation, setSelectedLocation,
      recommendations,
      topRecommendation,
      loading,
      error,
      refreshRecommendations: fetchRecommendations
    }}>
      {children}
    </FarmerStateContext.Provider>
  );
}

export function useFarmerState() {
  return useContext(FarmerStateContext);
}
