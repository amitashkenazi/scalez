import React, { useEffect } from 'react';
import { Scale } from 'lucide-react';
import PropTypes from 'prop-types';
import useScaleMeasurement from '../hooks/useScaleMeasurement';

const FunOutOfStockMessage = ({ onClose, scaleId }) => {
  const { measurement, isLoading, error, refreshMeasurement } = useScaleMeasurement(scaleId);

  useEffect(() => {
    if (scaleId) {
      console.log('Initializing scale measurement tracking for scale:', scaleId);
    }
  }, [scaleId]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-center mt-4">Checking scale status...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    console.error('Scale measurement error:', error);
  }

  // Optional: Log measurement data for debugging
  if (measurement) {
    console.log('Current scale measurement:', measurement);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-bounce-in">
        {/* Fun Icon */}
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 bg-blue-100 rounded-full flex items-center justify-center">
            <Scale className="w-10 h-10 text-blue-500" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full 
            flex items-center justify-center animate-bounce">
            <span className="text-xl">🏃‍♂️</span>
          </div>
        </div>
        
        {/* Message with measurement data if available */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">
            Our Scales Took a Break! 🌴
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg 
            text-blue-700 font-medium">
            {measurement ? (
              <div>
                <p>Last reading: {measurement.weight}kg</p>
                <p className="text-sm text-gray-600">
                  {new Date(measurement.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <p>Be back in stock soon!</p>
            )}
          </div>
        </div>
        
        {/* Measurement Status */}
        {measurement && (
          <div className="text-center mb-4 text-sm text-gray-600">
            <p>Status: {measurement.status || 'Unavailable'}</p>
            {measurement.battery && (
              <p>Battery: {measurement.battery}%</p>
            )}
          </div>
        )}
        
        {/* Fun Animation */}
        <div className="flex justify-center gap-2 text-2xl mb-6 animate-pulse">
          🔍 📦 🎯
        </div>
        
        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={refreshMeasurement}
            className="w-full px-4 py-2 bg-blue-100 text-blue-600 rounded-full
              hover:bg-blue-200 transition-colors duration-200"
          >
            Refresh Status
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 
              text-white rounded-full hover:from-blue-600 hover:to-purple-600 
              transition-all transform hover:scale-105 duration-200 font-medium 
              shadow-lg flex items-center justify-center gap-2"
          >
            Got it! 👋
          </button>
        </div>
      </div>
    </div>
  );
};

FunOutOfStockMessage.propTypes = {
  onClose: PropTypes.func.isRequired,
  scaleId: PropTypes.string.isRequired
};

export default FunOutOfStockMessage;