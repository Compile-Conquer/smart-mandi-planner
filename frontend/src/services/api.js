/**
 * MandiMitra AI API Service Client
 * Full-stack agricultural market intelligence & cold-storage digital twin.
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
  // ==========================================
  // MARKET INTELLIGENCE
  // ==========================================
  getCrops: () => fetchJson('/api/crops'),
  
  getMarkets: (state) => fetchJson(`/api/markets${state ? `?state=${encodeURIComponent(state)}` : ''}`),
  
  getWeather: (lat, lon, locationName = "Farm Location") => 
    fetchJson(`/api/weather?lat=${lat}&lon=${lon}&location_name=${encodeURIComponent(locationName)}`),
  
  getPriceHistory: (mandiId, commodity, limit = 30) => 
    fetchJson(`/api/prices/history?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}&limit=${limit}`),
    
  getPriceForecast: (mandiId, commodity, daysAhead = 14) => 
    fetchJson(`/api/prices/forecast?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}&days_ahead=${daysAhead}`),
    
  getArrivalsForecast: (mandiId, commodity, daysAhead = 14) => 
    fetchJson(`/api/arrivals/forecast?mandi_id=${encodeURIComponent(mandiId)}&commodity=${encodeURIComponent(commodity)}&days_ahead=${daysAhead}`),
    
  calculateTransport: (payload) => 
    fetchJson('/api/transport/cost', { method: 'POST', body: JSON.stringify(payload) }),
    
  getRecommendations: (payload) => 
    fetchJson('/api/recommendations', { method: 'POST', body: JSON.stringify(payload) }),
    
  optimizeHarvest: (payload) => 
    fetchJson('/api/optimize', { method: 'POST', body: JSON.stringify(payload) }),
    
  simulateScenario: (payload) => 
    fetchJson('/api/scenarios', { method: 'POST', body: JSON.stringify(payload) }),

  // ==========================================
  // STORAGE & DIGITAL TWIN INTELLIGENCE
  // ==========================================
  getStorageFacility: () => fetchJson('/api/storage/facility'),

  getSensorHistory: (limit = 50) => fetchJson(`/api/storage/sensor/history?limit=${limit}`),

  toggleSimulationMode: (offlineMode) => 
    fetchJson(`/api/storage/sensor/toggle-mode?offline_mode=${offlineMode}`, { method: 'POST' }),

  sendSensorTelemetry: (payload) => 
    fetchJson('/api/storage/sensor/dht22', { method: 'POST', body: JSON.stringify(payload) }),

  getBatches: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.spoilage_risk) query.append('spoilage_risk', params.spoilage_risk);
    if (params.maturity_stage) query.append('maturity_stage', params.maturity_stage);
    if (params.include_exhausted !== undefined) query.append('include_exhausted', params.include_exhausted);
    return fetchJson(`/api/storage/batches?${query.toString()}`);
  },

  getBatch: (batchId) => fetchJson(`/api/storage/batches/${encodeURIComponent(batchId)}`),

  createBatch: (payload) => 
    fetchJson('/api/storage/batches', { method: 'POST', body: JSON.stringify(payload) }),

  updateBatch: (batchId, payload) => 
    fetchJson(`/api/storage/batches/${encodeURIComponent(batchId)}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  recordBatchSale: (batchId, payload) => 
    fetchJson(`/api/storage/batches/${encodeURIComponent(batchId)}/sales`, { method: 'POST', body: JSON.stringify(payload) }),

  getBatchFreshness: (batchId) => 
    fetchJson(`/api/storage/freshness/${encodeURIComponent(batchId)}`),

  getStorageAlerts: () => fetchJson('/api/storage/alerts'),

  getAlertHistory: (limit = 40) => fetchJson(`/api/storage/alerts/history?limit=${limit}`),

  updateAlertStatus: (alertId, status) => 
    fetchJson(`/api/storage/alerts/${encodeURIComponent(alertId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    }),

  simulateStorage: (payload) => 
    fetchJson('/api/storage/simulate', { method: 'POST', body: JSON.stringify(payload) }),
};
