import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom DivIcons with inline SVG
const createFarmerIcon = () =>
  L.divIcon({
    className: 'custom-farmer-icon',
    html: `
      <div style="background-color: #E9B44C; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#164B35" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 22 1-1h3l9-9"/>
          <path d="M3 21v-3l9-9"/>
          <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9"/>
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

const createMandiIcon = (isBest = false) =>
  L.divIcon({
    className: 'custom-mandi-icon',
    html: `
      <div style="background-color: ${isBest ? '#164B35' : '#2563eb'}; width: ${isBest ? '32px' : '26px'}; height: ${isBest ? '32px' : '26px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.25);">
        <svg width="${isBest ? '16' : '13'}" height="${isBest ? '16' : '13'}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      </div>
    `,
    iconSize: [isBest ? 32 : 26, isBest ? 32 : 26],
    iconAnchor: [isBest ? 16 : 13, isBest ? 16 : 13],
    popupAnchor: [0, isBest ? -16 : -13],
  });

function AutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function LeafletMap({ farmerLocation, mandis = [], selectedMandiId, onSelectMandi }) {
  const centerLat = farmerLocation?.lat || 12.2958;
  const centerLon = farmerLocation?.lon || 76.6394;
  const mapCenter = [centerLat, centerLon];

  return (
    <div className="w-full h-full min-h-[380px] rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative">
      <MapContainer
        center={mapCenter}
        zoom={8}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ minHeight: '380px' }}
      >
        <AutoCenter center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Farmer Marker */}
        <Marker position={[centerLat, centerLon]} icon={createFarmerIcon()}>
          <Popup>
            <div className="text-xs p-1">
              <span className="font-bold text-[#164B35] block">Farm Origin (ನಿಮ್ಮ ಜಮೀನು)</span>
              <p className="text-gray-600 mt-0.5">{farmerLocation?.name || 'Selected Farm'}</p>
              <p className="text-gray-400 font-mono text-[10px]">{centerLat.toFixed(4)}, {centerLon.toFixed(4)}</p>
            </div>
          </Popup>
        </Marker>

        {/* Mandi Markers & Polyline Routes */}
        {mandis.map((m) => {
          if (!m.latitude || !m.longitude) return null;
          const isBest = m.is_best_choice;
          const isSelected = selectedMandiId === m.mandi_id;

          return (
            <React.Fragment key={m.mandi_id}>
              {/* Route line to best or selected mandi */}
              {(isBest || isSelected) && (
                <Polyline
                  positions={[
                    [centerLat, centerLon],
                    [m.latitude, m.longitude],
                  ]}
                  color={isBest ? '#164B35' : '#2563eb'}
                  dashArray="6, 6"
                  weight={isBest ? 3 : 2}
                  opacity={0.8}
                />
              )}

              <Marker
                position={[m.latitude, m.longitude]}
                icon={createMandiIcon(isBest)}
                eventHandlers={{
                  click: () => onSelectMandi && onSelectMandi(m),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 max-w-[200px]">
                    {isBest && (
                      <span className="bg-[#164B35] text-white px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mb-1 inline-block">
                        Top Net Profit Choice
                      </span>
                    )}
                    <h4 className="font-bold text-gray-900">{m.mandi_name}</h4>
                    <p className="text-gray-500 text-[11px]">{m.district}, {m.state}</p>
                    
                    <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                      <p className="text-gray-600">
                        Road Distance: <span className="font-semibold text-gray-900">{m.distance_km || '—'} km</span>
                      </p>
                      <p className="text-gray-600">
                        Forecast Price: <span className="font-semibold text-amber-700">₹{m.forecasted_price_per_q || '—'}/q</span>
                      </p>
                      {m.net_realization && (
                        <p className="text-emerald-800 font-bold">
                          Net Profit: ₹{Number(m.net_realization).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
