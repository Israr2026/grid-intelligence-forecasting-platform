function AlertsPanel({ alerts, onAlertClick }) {
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'WARNING':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'INFO':
        return 'bg-blue-100 border-blue-500 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'WARNING':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`border-l-4 rounded p-4 ${getSeverityColor(alert.severity)} cursor-pointer hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500`}
            onClick={() => onAlertClick && onAlertClick(alert)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAlertClick && onAlertClick(alert);
              }
            }}
            aria-label={`View details for ${alert.type} alert`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getSeverityIcon(alert.severity)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{alert.type.replace('_', ' ')}</h3>
                  <span className="text-xs font-medium opacity-75">{alert.severity}</span>
                </div>
                <p className="mt-1 text-sm">{alert.message}</p>
                {alert.grid_segment && (
                  <p className="mt-1 text-xs opacity-75">Segment: {alert.grid_segment}</p>
                )}
                {alert.risk_score !== undefined && (
                  <p className="mt-1 text-xs opacity-75">Risk Score: {alert.risk_score}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AlertsPanel;

