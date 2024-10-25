import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';

const MiniGraph = ({ data }) => {
  // Sort data by timestamp to ensure correct display
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData}>
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#4f46e5" 
            strokeWidth={2} 
            dot={false} 
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ScaleCard = ({ scale, onCardClick }) => {
  // Get the latest measurement
  const sortedHistory = [...scale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower)
    : 'text-gray-400';
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(scale)}
    >
      <h3 className="text-2xl font-bold mb-4">{scale.productName}</h3>
      <div className="space-y-4">
        <div>
          <span className="block text-sm text-gray-500 mb-1">Latest Weight</span>
          {currentWeight !== null ? (
            <span className={`font-bold ${statusColor}`}>
              {currentWeight} kg
            </span>
          ) : (
            <span className="text-gray-400">No data available</span>
          )}
        </div>
        <div>
          <span className="block text-sm text-gray-500 mb-1">Thresholds</span>
          <div className="text-sm">
            <div className="text-green-600">Upper: {scale.thresholds.upper} kg</div>
            <div className="text-red-600">Lower: {scale.thresholds.lower} kg</div>
          </div>
        </div>
        <div className="mt-4">
          <MiniGraph data={scale.history} />
        </div>
      </div>
    </div>
  );
};

export default ScaleCard;