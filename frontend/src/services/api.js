/**
 * MandiMitra AI API Service Client
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Agricultural crops
  getCrops: () => fetchJson('/api/crops'),
  
  // Markets & APMCs
  getMarkets: (state) => fetchJson(`/api/markets${state ? `?state=${encodeURIComponent(state)}` : ''}`),
  
  // Weather intelligence
  getWeather: (lat, lon) => fetchJson(`/api/weather?lat=${lat}&lon=${lon}`),
  
  // Price history
  getPriceHistory: (mandiId, commodity, limit = 30) => 
    fetchJson(`/api/prices/history?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}&limit=${limit}`),
    
  // Price forecast (7-14 days)
  getPriceForecast: (mandiId, commodity, daysAhead = 14) => 
    fetchJson(`/api/prices/forecast?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}&days_ahead=${daysAhead}`),
    
  // Market arrivals forecast
  getArrivalsForecast: (mandiId, commodity) => 
    fetchJson(`/api/arrivals/forecast?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}`),
    
  // Transport costs
  calculateTransport: (payload) => 
    fetchJson('/api/transport/cost', { method: 'POST', body: JSON.stringify(payload) }),
    
  // Recommendations & comparison
  getRecommendations: (payload) => 
    fetchJson('/api/recommendations', { method: 'POST', body: JSON.stringify(payload) }),
    
  // Harvest LP optimization
  optimizeHarvest: (payload) => 
    fetchJson('/api/optimize', { method: 'POST', body: JSON.stringify(payload) }),
    
  // Scenario simulation
  simulateScenario: (payload) => 
    fetchJson('/api/scenarios', { method: 'POST', body: JSON.stringify(payload) }),
};
