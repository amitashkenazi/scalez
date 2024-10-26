import React, { useState } from 'react';
import ScaleGraph from './ScaleGraph';
import ThresholdSettings from './ThresholdSettings';
import { Card } from '@/components/ui/card';
import { getStatusColor } from '../utils/thresholdUtils';

const ScaleModal = ({ scale, isOpen, onClose, dateRange, onStartDateChange, onEndDateChange }) => {
  // Get latest measurement
  const sortedHistory = [...scale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  
  // Get status color
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower)
    : 'text-gray-400';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{scale.productName} Details</h2>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-gray-600 mb-2">From</label>
            <input
              type="datetime-local"
              value={dateRange.startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="w-full p-2 border rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-2">To</label>
            <input
              type="datetime-local"
              value={dateRange.endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full p-2 border rounded hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Current Status Card */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Current Status</h3>
            <div className={`text-4xl font-bold ${statusColor}`}>
              {currentWeight} kg
            </div>
          </div>

          {/* Thresholds Card */}
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Thresholds</h3>
            <div className="space-y-2">
              <div>
                <div className="text-gray-600">Upper Threshold</div>
                <div className="text-2xl font-bold text-green-600">
                  {scale.thresholds.upper} kg
                </div>
              </div>
              <div>
                <div className="text-gray-600">Lower Threshold</div>
                <div className="text-2xl font-bold text-red-600">
                  {scale.thresholds.lower} kg
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weight History */}
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Weight History</h3>
          <ScaleGraph 
            data={scale.history}
            thresholds={scale.thresholds}
            dateRange={dateRange}
          />
        </div>

        {/* Threshold Settings */}
        <div>
          <h3 className="text-lg font-bold mb-4">Threshold Settings</h3>
          <ThresholdSettings
            thresholds={scale.thresholds}
          />
        </div>
      </div>
    </div>
  );
};

export default ScaleModal;