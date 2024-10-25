// src/components/ScaleCard.jsx
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { filterDataByDateRange } from '../utils/dateFilterUtils';

const MiniGraph = ({ data }) => {
  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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

const ScaleCard = ({ scale, onCardClick, dateRange }) => {
  const filteredData = filterDataByDateRange(scale.history, dateRange.startDate, dateRange.endDate);
  const latestMeasurement = filteredData[filteredData.length - 1];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : scale.currentWeight;
  const statusColor = getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower);
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(scale)}
    >
      <h3 className="text-2xl font-bold mb-4">{scale.productName}</h3>
      <div className="space-y-4">
        <div>
          <span className="block text-sm text-gray-500 mb-1">Current Weight</span>
          <span className={`font-bold ${statusColor}`}>
            {currentWeight} kg
          </span>
        </div>
        <div>
          <span className="block text-sm text-gray-500 mb-1">Thresholds</span>
          <div className="text-sm">
            <div className="text-green-600">Upper: {scale.thresholds.upper} kg</div>
            <div className="text-red-600">Lower: {scale.thresholds.lower} kg</div>
          </div>
        </div>
        <div className="mt-4">
          <MiniGraph data={filteredData} />
        </div>
      </div>
    </div>
  );
};

export default ScaleCard;