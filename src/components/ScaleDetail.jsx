import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { filterDataByDateRange } from '../utils/dateFilterUtils';
import DateRangeSelector from './DateRangeSelector';
import ThresholdSettings from './ThresholdSettings';

const ScaleDetail = ({ scale, onClose, dateRange, onStartDateChange, onEndDateChange, onSave }) => {
  // Local state for thresholds and notifications
  const [thresholds, setThresholds] = useState(scale.thresholds);
  const [notifications, setNotifications] = useState({
    upper: {
      phoneNumber: scale.notifications?.upper?.phoneNumber || '',
      message: scale.notifications?.upper?.message || ''
    },
    lower: {
      phoneNumber: scale.notifications?.lower?.phoneNumber || '',
      message: scale.notifications?.lower?.message || ''
    }
  });

  const [isSaving, setIsSaving] = useState(false);

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

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave({
        ...scale,
        thresholds,
        notifications
      });
      onClose();
    } catch (error) {
      console.error('Error saving scale settings:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsSaving(false);
    }
  };

  // Filter data and prepare for display
  const filteredData = filterDataByDateRange(sortedData, dateRange.startDate, dateRange.endDate);
  const dataWithGaps = addGapsToData(filteredData);

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{scale.productName}</h2>
          <div className="space-x-2">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

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
                  (dataMin) => Math.floor(Math.min(dataMin, thresholds.lower) * 0.9),
                  (dataMax) => Math.ceil(Math.max(dataMax, thresholds.upper) * 1.1)
                ]} />
                <Tooltip 
                  labelFormatter={formatXAxis}
                  formatter={(value) => value ? [`${value} kg`, 'Weight'] : ['No data', 'Weight']}
                />
                <ReferenceLine 
                  y={thresholds.upper} 
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Upper Threshold (${thresholds.upper}kg)`,
                    fill: '#22c55e',
                    fontSize: 12
                  }} 
                />
                <ReferenceLine 
                  y={thresholds.lower} 
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `Lower Threshold (${thresholds.lower}kg)`,
                    fill: '#dc2626',
                    fontSize: 12
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  dot={true}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <ThresholdSettings 
          thresholds={thresholds}
          onThresholdsChange={setThresholds}
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />
      </div>
    </div>
  );
};

export default ScaleDetail;