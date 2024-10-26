import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';
import { getStatusColor, getGraphColor } from '../utils/thresholdUtils';
import { filterDataByDateRange } from '../utils/dateFilterUtils';
import DateRangeSelector from './DateRangeSelector';
import ThresholdSettings from './ThresholdSettings';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import customersData from '../data/customersData.json';

const ScaleDetail = ({ scale, onClose, dateRange, onStartDateChange, onEndDateChange, onSave }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Helper function to format dates
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const formatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', formatOptions).format(date);
  };

  // Helper function to format axis dates (shorter format)
  const formatAxisDate = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // Find customer for this scale
  const customer = customersData.customers.find(
    cust => cust.scaleIds.includes(scale.id)
  );

  // Get customer name in correct format based on language
  const getCustomerName = () => {
    if (!customer) return t.unknownCustomer;
    const [hebrewName, englishName] = customer.name.split(" - ");
    return language === 'he' ? hebrewName : englishName;
  };

  // Get latest measurement using useMemo
  const { sortedHistory, currentWeight, statusColor } = useMemo(() => {
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
  const filteredData = useMemo(() => {
    return filterDataByDateRange(scale.history, dateRange.startDate, dateRange.endDate);
  }, [scale.history, dateRange]);

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload[0]) return null;

    const weight = payload[0].value;
    const color = getGraphColor(weight, thresholds.upper, thresholds.lower);

    return (
      <div className={`bg-white p-3 shadow-lg rounded-lg border ${isRTL ? 'text-right' : 'text-left'}`}>
        <p className="text-gray-500 text-sm">{formatDate(label)}</p>
        <p className="font-bold" style={{ color }}>
          {weight} {scale.unit}
        </p>
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex justify-between items-start mb-6 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <div>
            <h2 className="text-2xl font-bold">{scale.productName}</h2>
            <p className="text-gray-500">{getCustomerName()}</p>
          </div>
          <div className={`space-x-2 flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? t.saving : t.saveChanges}
            </button>
            <button 
              className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
              onClick={onClose}
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Status Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6`}>
          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">{t.currentStatus}</h3>
            <div className={`text-2xl font-bold ${statusColor}`}>
              {currentWeight !== null ? `${currentWeight} ${scale.unit}` : t.noData}
            </div>
            {currentWeight !== null && (
              <p className="text-sm text-gray-500 mt-2">
                {t.lastUpdated}: {formatDate(sortedHistory[0].timestamp)}
              </p>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="text-lg font-bold mb-4">{t.thresholds}</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-gray-500">{t.upperThreshold}</span>
                <span className="text-green-600 font-bold">{thresholds.upper} {scale.unit}</span>
              </div>
              <div>
                <span className="block text-sm text-gray-500">{t.lowerThreshold}</span>
                <span className="text-red-600 font-bold">{thresholds.lower} {scale.unit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

        {/* Weight History Graph */}
        <div className="mt-4 bg-white rounded-lg p-6 shadow">
          <h3 className="text-lg font-bold mb-4">{t.weightHistory}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatAxisDate}
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
                  orientation={isRTL ? 'right' : 'left'}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={thresholds.upper} 
                  stroke="#22c55e"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `${t.upperThreshold} (${thresholds.upper}${scale.unit})`,
                    fill: '#22c55e',
                    fontSize: 12,
                    position: isRTL ? 'right' : 'left'
                  }} 
                />
                <ReferenceLine 
                  y={thresholds.lower} 
                  stroke="#dc2626"
                  strokeDasharray="3 3"
                  label={{ 
                    value: `${t.lowerThreshold} (${thresholds.lower}${scale.unit})`,
                    fill: '#dc2626',
                    fontSize: 12,
                    position: isRTL ? 'right' : 'left'
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

        {/* Threshold Settings */}
        <ThresholdSettings 
          thresholds={thresholds}
          onThresholdsChange={setThresholds}
          notifications={notifications}
          onNotificationsChange={setNotifications}
          isRTL={isRTL}
          translations={t}
          unit={scale.unit}
        />
      </div>
    </div>
  );
};

export default ScaleDetail;