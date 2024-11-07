import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';

const ScaleGraph = ({ data, thresholds }) => {
  const { language } = useLanguage();
  const isRTL = language === 'he';

  // Function to get dot color based on weight value
  const getDataPointColor = (value) => {
    if (!value) return "#gray";
    if (value >= thresholds.upper) return "#22c55e";
    if (value >= thresholds.lower) return "#f97316";
    return "#dc2626";
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null;

    const weight = payload[0].value;
    const color = getDataPointColor(weight);

    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border">
        <p className="text-gray-500 text-sm">
          {new Date(label).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </p>
        <p className="font-bold" style={{ color }}>
          {weight} kg
        </p>
      </div>
    );
  };

  // Custom dot component
  const CustomDot = ({ cx, cy, payload }) => {
    if (!payload.weight) return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={getDataPointColor(payload.weight)}
        stroke="white"
        strokeWidth={2}
      />
    );
  };

  const formatXAxis = (timestamp) => {
    return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Calculate domain for Y axis
  const yDomain = [
    (dataMin) => Math.floor(Math.min(dataMin, thresholds.lower) * 0.9),
    (dataMax) => Math.ceil(Math.max(dataMax, thresholds.upper) * 1.1)
  ];

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            domain={yDomain}
            tickCount={10}
            orientation={isRTL ? 'right' : 'left'}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine 
            y={thresholds.upper} 
            stroke="#22c55e"
            strokeDasharray="3 3"
            label={{
              value: `Upper Threshold (${thresholds.upper}kg)`,
              fill: '#22c55e',
              position: 'right'
            }}
          />
          
          <ReferenceLine 
            y={thresholds.lower} 
            stroke="#dc2626"
            strokeDasharray="3 3"
            label={{
              value: `Lower Threshold (${thresholds.lower}kg)`,
              position: 'right',
              fill: '#dc2626'
            }}
          />
          
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={<CustomDot />}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScaleGraph;