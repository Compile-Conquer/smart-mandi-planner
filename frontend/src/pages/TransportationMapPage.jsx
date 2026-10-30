import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Fuel, 
  Clock, 
  IndianRupee, 
  Info,
  CheckCircle2 
} from 'lucide-react';
import { useFarmerState, LOCATION_PRESETS } from '../context/FarmerStateContext';
import { api } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import StatCard from '../components/StatCard';

export default function TransportationMapPage() {
  const { quantity, selectedLocation, setSelectedLocation, recommendations } = useFarmerState();
  const [selectedMandi, setSelectedMandi] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [fuelRate, setFuelRate] = useState(35.0); // ₹ per km
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recommendations.length > 0 && !selectedMandi) {
      setSelectedMandi(recommendations[0]);
    }
  }, [recommendations]);

  useEffect(() => {
    if (selectedMandi && selectedLocation) {
      setLoading(true);
      const payload = {
        origin_lat: selectedLocation.lat,
        origin_lon: selectedLocation.lon,
        dest_lat: selectedMandi.latitude || 12.97,
        dest_lon: selectedMandi.longitude || 77.56,
        vehicle_tonnage: quantity,
        fuel_rate_per_km: fuelRate
      };
      api.calculateTransport(payload)
        .then(setRouteInfo)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMandi, selectedLocation, quantity, fuelRate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Farm Origin Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
            Geospatial Logistics & Routing
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Mandi Transportation & Route Analysis
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            OpenStreetMap & OSRM routing calculates driving distance, transit time, and payload freight.
          </p>
        </div>

        {/* Change Farm Origin */}
        <div className="flex items-center space-x-2 text-xs bg-white px-3 py-1.5 rounded-xl border border-gray-300 shadow-sm">
          <MapPin className="w-4 h-4 text-[#164B35]" />
          <span className="text-gray-500 font-medium">Farm Origin:</span>
          <select
            value={selectedLocation.name}
            onChange={(e) => {
              const match = LOCATION_PRESETS.find(p => p.name === e.target.value);
              if (match) setSelectedLocation(match);
            }}
            aria-label="Select Farm Origin"
            className="font-bold text-gray-900 outline-none bg-transparent cursor-pointer"
          >
            {LOCATION_PRESETS.map((p, idx) => (
              <option key={idx} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Leaflet Map & Selected Route Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Interactive Leaflet Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 relative h-[520px]">
            <LeafletMap
              farmerLocation={selectedLocation}
              mandis={recommendations}
              selectedMandiId={selectedMandi?.mandi_id}
              onSelectMandi={(m) => setSelectedMandi(m)}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 px-2">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E9B44C] inline-block border border-white shadow-sm"></span>
              <span>Gold Marker = Your Farm Origin</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-[#164B35] inline-block border border-white shadow-sm"></span>
              <span>Green Marker = Optimal Net Profit Mandi</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white shadow-sm"></span>
              <span>Blue Marker = Alternative Mandis</span>
            </span>
          </div>
        </div>

        {/* Right 1 Col: Route Details & Freight Breakdown */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#164B35]">
                Active Transit Route
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-0.5">
                {selectedMandi?.mandi_name || 'Select a market on map'}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedMandi?.district}, {selectedMandi?.state}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block flex items-center space-x-1">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Road Distance</span>
                </span>
                <span className="text-lg font-black text-gray-900 block mt-1">
                  {routeInfo?.distance_km || selectedMandi?.distance_km || '—'} km
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                <span className="text-gray-500 block flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Driving Time</span>
                </span>
                <span className="text-lg font-black text-gray-900 block mt-1">
                  {routeInfo?.travel_time_hours || selectedMandi?.travel_time_hours || '—'} hrs
                </span>
              </div>
            </div>

            {/* Configurable Freight Rate */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700">Vehicle Freight Rate:</span>
                <span className="font-bold text-[#164B35]">₹{fuelRate} / km</span>
              </div>
              <input
                type="range"
                min="25"
                max="65"
                step="1"
                value={fuelRate}
                onChange={(e) => setFuelRate(Number(e.target.value))}
                aria-label="Adjust Vehicle Freight Rate per km"
                className="w-full accent-[#164B35] cursor-pointer"
              />
              <span className="text-[10px] text-gray-400 block">
                Typical rates: Tata Ace (1.5t) ~₹30/km • Eicher 14ft (5t) ~₹40/km
              </span>
            </div>

            {/* Cost Breakdown Waterfall */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2.5 text-xs">
              <span className="font-bold text-emerald-950 uppercase tracking-wider text-[10px] block">
                Total Freight Estimate
              </span>

              <div className="flex items-center justify-between text-gray-700">
                <span>Base Loading & Dispatch:</span>
                <span className="font-semibold">₹1,200</span>
              </div>

              <div className="flex items-center justify-between text-gray-700">
                <span>Distance Fuel & Driver ({routeInfo?.distance_km || 0} km × ₹{fuelRate}):</span>
                <span className="font-semibold">
                  ₹{Math.round((routeInfo?.distance_km || 0) * fuelRate).toLocaleString()}
                </span>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-sm font-black text-[#164B35]">
                <span>Total Freight Cost:</span>
                <span>₹{(routeInfo?.total_transport_cost || 0).toLocaleString()}</span>
              </div>

              <div className="text-right text-[11px] font-bold text-emerald-800">
                (₹{routeInfo?.cost_per_quintal || 0} per quintal for {quantity * 10} quintals)
              </div>
            </div>

            {/* Routing Engine Indicator */}
            <p className="text-[11px] text-gray-400 text-center">
              Route Engine: {routeInfo?.route_type || 'OSRM Public Engine'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
