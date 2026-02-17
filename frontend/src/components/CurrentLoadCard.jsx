function CurrentLoadCard({ data, onSegmentClick }) {
  const totalLoad = data.total_load_mw || 0;
  const threshold = 2500;
  const isHighLoad = totalLoad > threshold;

  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${isHighLoad ? 'border-red-500' : 'border-blue-500'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Current Total Grid Load</h3>
          <div className="mt-2 flex items-baseline">
            <p className="text-4xl font-bold text-gray-900">{totalLoad.toFixed(1)}</p>
            <p className="ml-2 text-lg text-gray-500">MW</p>
          </div>
          {isHighLoad && (
            <div className="mt-2 flex items-center text-red-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">High Load Alert</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Active Segments</div>
          <div className="text-2xl font-bold text-gray-900">
            {Object.keys(data.segments || {}).length}
          </div>
        </div>
      </div>

      {/* Segment Breakdown */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(data.segments || {}).map(([segment, loadData]) => (
          <button
            key={segment}
            onClick={() => {
              if (onSegmentClick) {
                onSegmentClick(segment, loadData);
              }
            }}
            className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`View details for ${segment}`}
            type="button"
          >
            <div className="text-xs font-medium text-gray-500 truncate">{segment}</div>
            <div className="mt-1 text-lg font-semibold text-gray-900">
              {loadData.load_mw.toFixed(1)} MW
            </div>
            <div className="text-xs text-gray-400">
              {loadData.temperature?.toFixed(1)}°C
            </div>
            <div className="mt-2 text-xs text-blue-600 font-medium">Click for details →</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default CurrentLoadCard;

