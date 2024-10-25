import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { filterDataByDateRange } from '../utils/dateFilterUtils';
import DateRangeSelector from './DateRangeSelector';

const ScaleDetail = ({ scale, onClose, dateRange, onStartDateChange, onEndDateChange }) => {
  // Sort and prepare data with gaps
  const sortedData = [...scale.history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Function to check if two dates are consecutive (within 24 hours)
  const areConsecutiveDates = (date1, date2) => {
    const diffInHours = Math.abs(new Date(date2) - new Date(date1)) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  // Add null values between non-consecutive dates
  const addGapsToData = (data) => {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      result.push(data[i]);
      
      if (i < data.length - 1 && !areConsecutiveDates(data[i].timestamp, data[i + 1].timestamp)) {
        result.push({
          timestamp: new Date(new Date(data[i].timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString(),
          weight: null
        });
      }
    }
    return result;
  };

  // Filter data based on date range and add gaps
  const filteredData = filterDataByDateRange(sortedData, dateRange.startDate, dateRange.endDate);
  const dataWithGaps = addGapsToData(filteredData);
  
  const latestMeasurement = filteredData[filteredData.length - 1];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : scale.currentWeight;

  const formatXAxis = (timestamp) => {
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

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload.weight) return null; // Don't render dots for null values
    
    const color = payload.weight >= scale.thresholds.upper ? "#22c55e" : 
                 payload.weight >= scale.thresholds.lower ? "#f97316" : "#dc2626";
    
    return (
      <circle cx={cx} cy={cy} r={4} fill={color} />
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{scale.productName} Details</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 p-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Current Status</h3>
            <div className={`text-2xl font-bold ${getStatusColor(
              currentWeight,
              scale.thresholds.upper,
              scale.thresholds.lower
            )}`}>
              {currentWeight} kg
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Thresholds</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-gray-500">Upper Threshold</span>
                <span className="text-green-600 font-bold">{scale.thresholds.upper} kg</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Lower Threshold</span>
                <span className="text-red-600 font-bold">{scale.thresholds.lower} kg</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold mb-4">Weight History</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataWithGaps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatXAxis}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval="preserveStart"
                  tick={{ fontSize: 12 }}
                />
                <YAxis domain={[
                  (dataMin) => Math.floor(Math.min(dataMin, scale.thresholds.lower) * 0.9),
                  (dataMax) => Math.ceil(Math.max(dataMax, scale.thresholds.upper) * 1.1)
                ]} />
                <Tooltip 
                  labelFormatter={(timestamp) => formatXAxis(timestamp)}
                  formatter={(value) => value ? [`${value} kg`, 'Weight'] : ['No data', 'Weight']}
                />
                <ReferenceLine 
                  y={scale.thresholds.upper} 
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Upper Threshold (${scale.thresholds.upper}kg)`,
                    fill: '#22c55e',
                    fontSize: 12
                  }} 
                />
                <ReferenceLine 
                  y={scale.thresholds.lower} 
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Lower Threshold (${scale.thresholds.lower}kg)`,
                    fill: '#dc2626',
                    fontSize: 12
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
        </div>
      </div>
    </div>
  );
};

export default ScaleDetail;