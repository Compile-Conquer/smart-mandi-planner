import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Info, 
  Layers, 
  Sliders, 
  Check, 
  XCircle,
  Thermometer,
  Droplets,
  Zap,
  DoorOpen
} from 'lucide-react';
import { api } from '../../services/api';

export default function StorageAlertsPage() {
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadAlerts = () => {
    setLoading(true);
    Promise.all([
      api.getStorageAlerts(),
      api.getAlertHistory(30)
    ])
      .then(([active, hist]) => {
        setActiveAlerts(active);
        setAlertHistory(hist);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (alertId, newStatus) => {
    api.updateAlertStatus(alertId, newStatus)
      .then(() => {
        setActionMessage(`Alert status updated to ${newStatus}.`);
        loadAlerts();
        setTimeout(() => setActionMessage(''), 4000);
      })
      .catch(console.error);
  };

  const getSeverityStyle = (severity) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#164B35] bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Facility Safety Intelligence
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Chamber A Sensor Monitoring & Deduplication
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
            Storage Alert Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Real-time event-driven alert deduplication, environmental threshold breaches, and facility resolution audit log.
          </p>
        </div>

        <button
          onClick={loadAlerts}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-white border border-gray-300 hover:border-[#164B35] text-gray-700 hover:text-[#164B35] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Success Notification */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Active Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-black text-gray-900">
              Active Storage Alerts ({activeAlerts.length})
            </h2>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            Deduplicated event streams
          </span>
        </div>

        {activeAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-400 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getSeverityStyle(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      Occurrences: {alert.occurrence_count || 1}x
                    </span>
                  </div>

                  <h3 className="font-black text-gray-900 text-base">
                    {alert.title}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="text-[11px] text-gray-500 pt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>First: {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700">
                      Status: {alert.status}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                  {alert.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(alert.alert_id, 'ACKNOWLEDGED')}
                      className="px-3.5 py-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}

                  <button
                    onClick={() => handleUpdateStatus(alert.alert_id, 'RESOLVED')}
                    className="flex items-center space-x-1 px-4 py-1.5 rounded-xl bg-[#164B35] hover:bg-[#0E3626] text-white font-bold text-xs shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Resolve Alert</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-black text-gray-900">All Storage Parameters Nominal</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Chamber A telemetry (temperature, relative humidity, door seal, and compressor power) is within optimal agricultural thresholds.
            </p>
          </div>
        )}
      </div>

      {/* Threshold Reference Table & Historical Resolution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standard Environmental Thresholds */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-gray-100">
            <Info className="w-4 h-4 text-[#164B35]" />
            <h3 className="font-black text-gray-900 text-sm">
              Cold Storage Safety Thresholds
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span className="flex items-center space-x-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-teal-600" />
                  <span>Optimal Core Temp</span>
                </span>
                <span className="text-[#164B35]">11.5°C – 14.0°C</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Maintains Breaker and Turning stages without chilling injury.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span className="flex items-center space-x-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Target Humidity (RH)</span>
                </span>
                <span className="text-blue-700">85% – 95%</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Prevents shriveling and rapid water weight transpirational loss.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Power Failure Margin</span>
                </span>
                <span className="text-amber-700">&lt; 2 Hours</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Backup generator kicks in automatically after 15 min grid outage.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
              <div className="flex items-center justify-between font-bold text-gray-900">
                <span className="flex items-center space-x-1.5">
                  <DoorOpen className="w-3.5 h-3.5 text-rose-600" />
                  <span>Door Open Max Limit</span>
                </span>
                <span className="text-rose-700">&lt; 5 Minutes</span>
              </div>
              <p className="text-[11px] text-gray-500">
                Triggers acoustic alarm to prevent warm air thermal infiltration.
              </p>
            </div>
          </div>
        </div>

        {/* Resolved Alert History Audit */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#164B35]" />
              <h3 className="font-black text-gray-900 text-sm">
                Facility Resolution Log (Recent 10)
              </h3>
            </div>
            <span className="text-xs text-gray-400">Archived Audit Trail</span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2.5">
            {alertHistory.length > 0 ? (
              alertHistory.map((item) => (
                <div
                  key={item.alert_id}
                  className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${getSeverityStyle(item.severity)}`}>
                        {item.severity}
                      </span>
                      <span className="font-bold text-gray-900">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-gray-500">{item.message}</p>
                  </div>

                  <div className="text-[11px] text-gray-400 font-mono sm:text-right flex-shrink-0">
                    <p className="font-bold text-emerald-800">
                      {item.status === 'RESOLVED' ? 'RESOLVED' : item.status}
                    </p>
                    <p>{new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-10 text-gray-400 text-xs">
                No past incident logs recorded.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}