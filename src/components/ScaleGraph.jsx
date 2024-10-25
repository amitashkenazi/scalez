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

const ScaleGraph = ({ data, thresholds }) => {
  const getDataPointColor = (value) => {
    if (value >= thresholds.upper) return "#22c55e"; // green
    if (value >= thresholds.lower) return "#f97316"; // orange
    return "#dc2626"; // red
  };

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

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Function to check if two dates are consecutive (within 24 hours)
  const areConsecutiveDates = (date1, date2) => {
    const diffInHours = Math.abs(new Date(date2) - new Date(date1)) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  // Add null values between non-consecutive dates
  const dataWithGaps = [];
  for (let i = 0; i < sortedData.length; i++) {
    dataWithGaps.push(sortedData[i]);
    
    if (i < sortedData.length - 1 && !areConsecutiveDates(sortedData[i].timestamp, sortedData[i + 1].timestamp)) {
      dataWithGaps.push({
        timestamp: new Date(new Date(sortedData[i].timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        weight: null
      });
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dataWithGaps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatDate}
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStart"
            tick={{ fontSize: 12 }}
          />
          <YAxis domain={[
            (dataMin) => Math.floor(Math.min(dataMin, thresholds.lower) * 0.9),
            (dataMax) => Math.ceil(Math.max(dataMax, thresholds.upper) * 1.1)
          ]} />
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