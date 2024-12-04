import React, { useMemo } from 'react';
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

  // Memoize processed data
  const processedData = useMemo(() => {
    return data.map(point => ({
      ...point,
      weight: parseFloat(point.weight)
    }));
  }, [data]);

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
        <p className="text-gray-600">
          {new Date(label).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </p>
        <p className="font-bold text-lg" style={{ color: '#dc2626' }}>
          {weight.toFixed(2)} kg
        </p>
      </div>
    );
  };

  // Custom dot component
  const CustomDot = React.memo(({ cx, cy, payload }) => {
    if (!payload.weight) return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill="#1e40af"
        stroke="white"
        strokeWidth={2}
      />
    );
  });

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
  const yDomain = useMemo(() => {
    const weights = processedData.map(d => d.weight).filter(Boolean);
    const minWeight = Math.min(...weights, thresholds.lower);
    const maxWeight = Math.max(...weights, thresholds.upper);
    return [
      0, // Start from 0 as shown in the screenshot
      Math.ceil(Math.max(44, maxWeight * 1.1)) // Ensure we show at least up to 44 as in screenshot
    ];
  }, [processedData, thresholds]);

  return (
    <div className="h-[400px] w-full bg-white p-4">
      <h1 className="text-2xl font-bold mb-4">Weight History</h1>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={processedData}
          margin={{ top: 10, right: 30, left: 30, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12, fill: '#666666' }}
            stroke="#d1d5db"
          />
          <YAxis
            domain={yDomain}
            tickCount={10}
            orientation={isRTL ? 'right' : 'left'}
            stroke="#d1d5db"
            tick={{ fontSize: 12, fill: '#666666' }}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine 
            y={thresholds.upper} 
            stroke="#22c55e"
            strokeDasharray="3 3"
            label={{
              value: 'Upper',
              fill: '#22c55e',
              position: 'right'
            }}
          />
          
          <ReferenceLine 
            y={thresholds.lower} 
            stroke="#dc2626"
            strokeDasharray="3 3"
            label={{
              value: 'Lower',
              position: 'right',
              fill: '#dc2626'
            }}
          />
          
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#1e40af"
            strokeWidth={2}
            dot={<CustomDot />}
            connectNulls={true}
            isAnimationActive={false}
            activeDot={{ r: 6, strokeWidth: 2, fill: '#1e40af' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default React.memo(ScaleGraph);