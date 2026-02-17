import { useState, useEffect } from 'react';
import { getCurrentLoad, getForecast, getOutageRisks, getAlerts, getMaintenancePrioritization, getHistoricalLoads } from '../utils/api';
import LoadChart from './LoadChart';
import RiskHeatMap from './RiskHeatMap';
import AlertsPanel from './AlertsPanel';
import MaintenanceList from './MaintenanceList';
import CurrentLoadCard from './CurrentLoadCard';
import Modal from './Modal';
import ErrorBanner from './ErrorBanner';

function Dashboard() {
  const [currentLoad, setCurrentLoad] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [risks, setRisks] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historicalData, setHistoricalData] = useState(null);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);
      
      const [loadData, forecastData, risksData, alertsData, maintenanceData] = await Promise.all([
        getCurrentLoad(),
        getForecast(),
        getOutageRisks(),
        getAlerts(),
        getMaintenancePrioritization(),
      ]);

      // Validate and set data with fallbacks
      setCurrentLoad(loadData || { total_load_mw: 0, segments: {} });
      setForecast(forecastData || { forecasts_by_segment: {} });
      setRisks(Array.isArray(risksData?.risks) ? risksData.risks : []);
      setAlerts(Array.isArray(alertsData?.alerts) ? alertsData.alerts : []);
      setMaintenance(Array.isArray(maintenanceData?.prioritized_segments) ? maintenanceData.prioritized_segments : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error?.message || 'Failed to load dashboard data. Please try again.';
      setError(errorMessage);
      // Set empty states to prevent crashes
      setCurrentLoad({ total_load_mw: 0, segments: {} });
      setForecast({ forecasts_by_segment: {} });
      setRisks([]);
      setAlerts([]);
      setMaintenance([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds (without showing loading spinner)
    const interval = setInterval(() => fetchDashboardData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !currentLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Grid Intelligence & Forecasting Platform</h1>
              <p className="text-sm text-gray-500 mt-1">AI-Powered Demand Forecasting & Outage Risk Prediction</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right mr-4">
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      setError(null);
                      const data = await getHistoricalLoads(null, 7);
                      if (!data || !data.data) {
                        throw new Error('Invalid data received');
                      }
                      setHistoricalData(data);
                      setModalTitle('Historical Load Data (Last 7 Days)');
                      setModalContent(
                        <div className="max-h-96 overflow-y-auto">
                          <p className="text-sm text-gray-600 mb-4">Total data points: {data.data.length || 0}</p>
                          {data.data && data.data.length > 0 ? (
                            <div className="space-y-2">
                              {data.data.slice(0, 50).map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <div>
                                    <span className="text-sm font-medium">{item.grid_segment || 'Unknown'}</span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold">{(item.load_mw || 0).toFixed(1)} MW</div>
                                </div>
                              ))}
                              {data.data.length > 50 && (
                                <p className="text-xs text-gray-500 text-center py-2">
                                  Showing first 50 of {data.data.length} records
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No historical data available</p>
                          )}
                        </div>
                      );
                      setIsModalOpen(true);
                    } catch (error) {
                      console.error('Error fetching historical data:', error);
                      setError(error.message || 'Failed to load historical data');
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="View historical load data"
                  type="button"
                >
                  View History
                </button>
                <button
                  onClick={() => {
                    setModalTitle('System Information');
                    setModalContent(
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Grid Segments</h4>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {currentLoad && Object.keys(currentLoad.segments || {}).length > 0 ? (
                              Object.keys(currentLoad.segments || {}).map(seg => (
                                <li key={seg}>{seg}</li>
                              ))
                            ) : (
                              <li className="text-gray-400">No segments available</li>
                            )}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Total Load</h4>
                          <p className="text-sm text-gray-600">
                            {currentLoad?.total_load_mw?.toFixed(1) || 'N/A'} MW
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Active Alerts</h4>
                          <p className="text-sm text-gray-600">{alerts.length} alert(s)</p>
                        </div>
                      </div>
                    );
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="View system information"
                  type="button"
                >
                  System Info
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Banner */}
        <ErrorBanner error={error} onDismiss={() => setError(null)} />
        
        {/* Refresh Indicator */}
        {isRefreshing && (
          <div className="mb-4 text-sm text-gray-500 flex items-center">
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing data...
          </div>
        )}
        
        {/* Current Load Card */}
        {currentLoad && (
          <div className="mb-6">
            <CurrentLoadCard 
              data={currentLoad} 
              onSegmentClick={(segment, loadData) => {
                setModalTitle(`Segment Details: ${segment}`);
                setModalContent(
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded">
                        <h4 className="font-semibold text-gray-900 mb-1">Current Load</h4>
                        <p className="text-2xl font-bold text-blue-600">{loadData.load_mw.toFixed(1)} MW</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded">
                        <h4 className="font-semibold text-gray-900 mb-1">Temperature</h4>
                        <p className="text-2xl font-bold text-green-600">{loadData.temperature?.toFixed(1)}°C</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Last Updated</h4>
                      <p className="text-sm text-gray-600">
                        {loadData.timestamp ? new Date(loadData.timestamp).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Segment Status</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm text-gray-600">
                          This segment is currently operating at {loadData.load_mw.toFixed(1)} MW with a temperature of {loadData.temperature?.toFixed(1)}°C.
                        </p>
                      </div>
                    </div>
                  </div>
                );
                setIsModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Alerts Panel */}
        {alerts.length > 0 && (
          <div className="mb-6">
            <AlertsPanel alerts={alerts} onAlertClick={(alert) => {
              setModalTitle(`Alert Details: ${alert.type.replace('_', ' ')}`);
              setModalContent(
                <div className="space-y-4">
                  <div className={`p-4 rounded ${alert.severity === 'CRITICAL' ? 'bg-red-50' : alert.severity === 'WARNING' ? 'bg-yellow-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Severity</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        alert.severity === 'CRITICAL' ? 'bg-red-600 text-white' : 
                        alert.severity === 'WARNING' ? 'bg-yellow-600 text-white' : 
                        'bg-blue-600 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Message</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{alert.message}</p>
                  </div>
                  {alert.grid_segment && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Affected Segment</h4>
                      <p className="text-sm text-gray-600">{alert.grid_segment}</p>
                    </div>
                  )}
                  {alert.risk_score !== undefined && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Risk Score</h4>
                      <p className="text-sm text-gray-600">{alert.risk_score}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Timestamp</h4>
                    <p className="text-sm text-gray-600">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              );
              setIsModalOpen(true);
            }} />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Forecast Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">24-Hour Demand Forecast</h2>
              <button
                onClick={() => {
                  setModalTitle('Forecast Details');
                  const forecastData = forecast?.forecasts_by_segment || {};
                  const segments = Object.keys(forecastData);
                  setModalContent(
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Forecast Summary</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Showing 24-hour demand forecast for {segments.length} grid segment(s)
                        </p>
                      </div>
                      {segments.length > 0 ? (
                        segments.map(seg => {
                          const segForecast = forecastData[seg] || [];
                          if (segForecast.length === 0) return null;
                          const maxLoad = Math.max(...segForecast.map(f => f.predicted_load_mw || 0));
                          const minLoad = Math.min(...segForecast.map(f => f.predicted_load_mw || 0));
                          const avgLoad = segForecast.reduce((sum, f) => sum + (f.predicted_load_mw || 0), 0) / segForecast.length;
                          return (
                            <div key={seg} className="bg-gray-50 p-4 rounded">
                              <h5 className="font-semibold text-gray-900 mb-2">{seg}</h5>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">Max:</span>
                                  <span className="ml-2 font-semibold">{maxLoad.toFixed(1)} MW</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Min:</span>
                                  <span className="ml-2 font-semibold">{minLoad.toFixed(1)} MW</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Avg:</span>
                                  <span className="ml-2 font-semibold">{avgLoad.toFixed(1)} MW</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500">No forecast data available</p>
                      )}
                    </div>
                  );
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="View forecast details"
                type="button"
              >
                View Details
              </button>
            </div>
            {forecast && (
              <LoadChart
                forecast={forecast}
                selectedSegment={selectedSegment}
                onSegmentSelect={setSelectedSegment}
              />
            )}
          </div>

          {/* Risk Heat Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Outage Risk Heat Map</h2>
            <p className="text-xs text-gray-500 mb-4">Click on any segment to view details</p>
            {risks.length > 0 && <RiskHeatMap risks={risks} onSegmentClick={(risk) => {
              setModalTitle(`Risk Analysis: ${risk.grid_segment}`);
              setModalContent(
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 rounded ${risk.risk_score >= 70 ? 'bg-red-50' : risk.risk_score >= 40 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                      <h4 className="font-semibold text-gray-900 mb-1">Risk Score</h4>
                      <p className={`text-3xl font-bold ${risk.risk_score >= 70 ? 'text-red-600' : risk.risk_score >= 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {risk.risk_score}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">out of 100</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-semibold text-gray-900 mb-1">Current Load</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {risk.factors?.current_load_mw?.toFixed(1) || 'N/A'} MW
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Risk Factors Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Load Variability</span>
                        <span className="text-sm font-semibold">
                          {(risk.factors?.load_variability * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Anomaly Detected</span>
                        <span className={`text-sm font-semibold ${risk.factors?.anomaly_detected ? 'text-red-600' : 'text-green-600'}`}>
                          {risk.factors?.anomaly_detected ? 'Yes ⚠️' : 'No ✓'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Load Level</span>
                        <span className="text-sm font-semibold">
                          {(risk.factors?.load_level * 100 || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Average Load</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {risk.factors?.avg_load_mw?.toFixed(1) || 'N/A'} MW
                    </p>
                  </div>
                </div>
              );
              setIsModalOpen(true);
            }} />}
          </div>
        </div>

        {/* Maintenance Prioritization */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Prioritization</h2>
          {maintenance.length > 0 && <MaintenanceList segments={maintenance} onSegmentClick={(segment) => {
            setModalTitle(`Details: ${segment.grid_segment}`);
            setModalContent(
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Risk Score</h4>
                    <p className="text-2xl font-bold text-red-600">{segment.risk_score}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Priority Rank</h4>
                    <p className="text-2xl font-bold text-gray-900">#{segment.priority_rank}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Load Information</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm"><span className="font-medium">Current Load:</span> {segment.factors?.current_load_mw?.toFixed(1) || 'N/A'} MW</p>
                    <p className="text-sm"><span className="font-medium">Average Load:</span> {segment.factors?.avg_load_mw?.toFixed(1) || 'N/A'} MW</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Risk Factors</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Load Variability:</span>
                      <span className="text-sm font-medium">{(segment.factors?.load_variability * 100 || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Anomaly Detected:</span>
                      <span className={`text-sm font-medium ${segment.factors?.anomaly_detected ? 'text-red-600' : 'text-green-600'}`}>
                        {segment.factors?.anomaly_detected ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Load Level:</span>
                      <span className="text-sm font-medium">{(segment.factors?.load_level * 100 || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recommended Action</h4>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">{segment.recommended_action}</p>
                </div>
              </div>
            );
            setIsModalOpen(true);
          }} />}
        </div>
      </main>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
}

export default Dashboard;

