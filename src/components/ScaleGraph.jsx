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

const ScaleGraph = ({ data, thresholds, dateRange }) => {
  // Function to get dot color based on weight value
  const getDataPointColor = (value) => {
    if (value >= thresholds.upper) return "#22c55e";
    if (value >= thresholds.lower) return "#f97316";
    return "#dc2626";
  };

  // Custom dot component
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.weight) return null;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={getDataPointColor(payload.weight)}
      />
    );
  };

  // Generate time series data for the selected date range
  const generateTimeSeriesData = () => {
    // Convert date strings to timestamps
    const startTime = new Date(dateRange.startDate).getTime();
    const endTime = new Date(dateRange.endDate).getTime();

    // Create a map of existing measurements
    const measurementMap = new Map(
      data.map(d => [new Date(d.timestamp).getTime(), d.weight])
    );

    const result = [];
    const interval = 6 * 60 * 60 * 1000; // 6-hour intervals

    // Generate points for every interval within the selected date range
    for (let time = startTime; time <= endTime; time += interval) {
      result.push({
        timestamp: new Date(time).toISOString(),
        weight: measurementMap.get(time) || null
      });
    }

    return result;
  };

  const timeSeriesData = generateTimeSeriesData();

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={timeSeriesData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStart"
            tick={{ fontSize: 12 }}
            minTickGap={50}
          />
          <YAxis 
            domain={[
              (dataMin) => Math.floor(Math.min(dataMin, thresholds.lower) * 0.9),
              (dataMax) => Math.ceil(Math.max(dataMax, thresholds.upper) * 1.1)
            ]}
          />
          <Tooltip 
            labelFormatter={formatDate}
            formatter={(value) => value ? [`${value} kg`, 'Weight'] : ['No data', 'Weight']}
          />
          
          <ReferenceLine 
            y={thresholds.upper} 
            stroke="#22c55e" 
            strokeDasharray="3 3" 
            label={{ 
              value: `Upper Threshold (${thresholds.upper}kg)`,
              fill: '#22c55e',
              fontSize: 12,
              position: 'right'
            }} 
          />
          
          <ReferenceLine 
            y={thresholds.lower} 
            stroke="#dc2626" 
            strokeDasharray="3 3" 
            label={{ 
              value: `Lower Threshold (${thresholds.lower}kg)`,
              fill: '#dc2626',
              fontSize: 12,
              position: 'left'
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