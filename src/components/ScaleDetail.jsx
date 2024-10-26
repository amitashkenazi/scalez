import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { filterDataByDateRange } from '../utils/dateFilterUtils';
import DateRangeSelector from './DateRangeSelector';
import ThresholdSettings from './ThresholdSettings';

const ScaleDetail = ({ scale, onClose, dateRange, onStartDateChange, onEndDateChange, onSave }) => {
  // Get latest measurement using useMemo to avoid recalculation
  const { sortedHistory, currentWeight, statusColor } = useMemo(() => {
    // Sort data from newest to oldest for getting current weight
    const sorted = [...scale.history].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0]?.weight ?? null;
    const color = latest !== null 
      ? getStatusColor(latest, scale.thresholds.upper, scale.thresholds.lower)
      : 'text-gray-400';
    
    return {
      sortedHistory: sorted,
      currentWeight: latest,
      statusColor: color
    };
  }, [scale.history, scale.thresholds]);

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

  // Function to check if two dates are consecutive (within 24 hours)
  const areConsecutiveDates = (date1, date2) => {
    const diffInHours = Math.abs(new Date(date2) - new Date(date1)) / (1000 * 60 * 60);
    return diffInHours <= 24;
  };

  // Add null values between non-consecutive dates
  const prepareChartData = (data) => {
    // First, sort data from earliest to latest for the chart
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const result = [];
    for (let i = 0; i < sortedData.length; i++) {
      result.push(sortedData[i]);
      
      if (i < sortedData.length - 1 && !areConsecutiveDates(sortedData[i].timestamp, sortedData[i + 1].timestamp)) {
        result.push({
          timestamp: new Date(new Date(sortedData[i].timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString(),
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
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and prepare chart data
  const filteredData = filterDataByDateRange(scale.history, dateRange.startDate, dateRange.endDate);
  const chartData = prepareChartData(filteredData);

  const formatXAxis = (timestamp) => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Current Status</h3>
            <div className={`text-2xl font-bold ${statusColor}`}>
              {currentWeight !== null ? `${currentWeight} kg` : 'No data'}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">Thresholds</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-gray-500">Upper Threshold</span>
                <span className="text-green-600 font-bold">{thresholds.upper} kg</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">Lower Threshold</span>
                <span className="text-red-600 font-bold">{thresholds.lower} kg</span>
              </div>
            </div>
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
              <LineChart data={chartData}>
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
                <YAxis 
                  domain={[
                    (dataMin) => Math.floor(Math.min(dataMin, thresholds.lower) * 0.9),
                    (dataMax) => Math.ceil(Math.max(dataMax, thresholds.upper) * 1.1)
                  ]}
                  width={60}
                />
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
                    fontSize: 12,
                    position: 'left'
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