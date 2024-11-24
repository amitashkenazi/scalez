import React, { useState, useEffect } from 'react';
import useScaleData from '../hooks/useScaleData';
import useScaleMeasurement from '../hooks/useScaleMeasurement';
import FunOutOfStockMessage from './outOfStock';

const ScaleMonitor = ({ scaleId }) => {
  const [showOutOfStock, setShowOutOfStock] = useState(false);
  const { measurement, isLoading, error, refreshMeasurement } = useScaleMeasurement(scaleId);
  const { scales } = useScaleData();

  useEffect(() => {
    if (measurement) {
      // Check if scale is out of stock based on measurement
      // Adjust these conditions based on your business logic
      const isOutOfStock = measurement.weight <= 0 || 
                          measurement.status === 'offline' ||
                          measurement.error;
      
      setShowOutOfStock(isOutOfStock);
    }
  }, [measurement]);

  // Find the current scale in the scales list
  const currentScale = scales.find(scale => scale.id === scaleId);

  if (isLoading) {
    return <div>Loading scale data...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Error loading scale data: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Scale Information */}
      {currentScale && (
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">{currentScale.name}</h2>
          <div className="space-y-2">
            <p>Location: {currentScale.location}</p>
            <p>Status: {measurement?.status || 'Unknown'}</p>
            {measurement && (
              <>
                <p>Current Weight: {measurement.weight}kg</p>
                <p>Last Updated: {new Date(measurement.timestamp).toLocaleString()}</p>
              </>
            )}
          </div>
          
          <button
            onClick={refreshMeasurement}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg
              hover:bg-blue-600 transition-colors duration-200"
          >
            Refresh Data
          </button>
        </div>
      )}

      {/* Out of Stock Message */}
      {showOutOfStock && (
        <FunOutOfStockMessage
          scaleId={scaleId}
          onClose={() => setShowOutOfStock(false)}
        />
      )}
    </div>
  );
};

export default ScaleMonitor;