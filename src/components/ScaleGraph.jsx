// src/components/ScaleGraph.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';

const ScaleGraph = ({ history, thresholds }) => {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const CustomizedDot = (props) => {
    const { cx, cy, payload } = props;
    const color = getStatusColor(payload.weight, thresholds.upper, thresholds.lower);
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={4} 
        fill={color.replace('text-', '').replace('600', '').replace('500', '').replace('green', '#22c55e').replace('orange', '#f97316').replace('red', '#dc2626')} 
      />
    );
  };

  return (
    <LineChart
      width={800}
      height={400}
      data={history}
      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="timestamp" 
        tickFormatter={formatDate}
      />
      <YAxis />
      <Tooltip 
        labelFormatter={formatDate}
        formatter={(value) => [`${value} kg`, 'Weight']}
      />
      
      <ReferenceLine 
        y={thresholds.upper} 
        stroke="#22c55e" 
        strokeDasharray="3 3" 
        label="Upper Threshold" 
      />
      <ReferenceLine 
        y={thresholds.lower} 
        stroke="#dc2626" 
        strokeDasharray="3 3" 
        label="Lower Threshold" 
      />
      
      <Line
        type="monotone"
        dataKey="weight"
        stroke="#8884d8"
        dot={<CustomizedDot />}
      />
    </LineChart>
  );
};

export default ScaleGraph;
