
import React, { useState } from 'react';
import { apiTracker } from '../utils/ApiTracker';
import { RefreshCw, Server, Map, X } from 'lucide-react';


/**
 * A React component that displays API call statistics and allows resetting the counters.
 *
 * @component
 * @example
 * return <ApiStats />
 */
const ApiStats = () => {
  const [stats, setStats] = useState(apiTracker.getStats());
  const [isVisible, setIsVisible] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
      >
        <RefreshCw size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white rounded-lg shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">API Call Statistics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Server size={20} />
            <h4 className="font-medium">Server API Calls: {stats.serverApi.total}</h4>
          </div>
          <div className="pl-6 space-y-1">
            {Object.entries(stats.serverApi.breakdown).map(([endpoint, count]) => (
              <div key={endpoint} className="text-sm flex justify-between">
                <span className="text-gray-600">{endpoint}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-green-600 mb-2">
            <Map size={20} />
            <h4 className="font-medium">Google Maps API Calls: {stats.googleMaps.total}</h4>
          </div>
          <div className="pl-6 space-y-1">
            {Object.entries(stats.googleMaps.breakdown).map(([service, count]) => (
              <div key={service} className="text-sm flex justify-between">
                <span className="text-gray-600">{service}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          apiTracker.reset();
          setStats(apiTracker.getStats());
        }}
        className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        Reset Counters
      </button>
    </div>
  );
};

export default ApiStats;