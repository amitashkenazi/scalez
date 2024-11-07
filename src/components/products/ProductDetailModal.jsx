import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { X, Loader2, Scale, MessageSquare } from 'lucide-react';
import ScaleGraph from '../ScaleGraph';
import DateRangeSelector from '../DateRangeSelector';
import { getDefaultDateRange } from '../../utils/dateFilterUtils';
import apiService from '../../services/api';

const ProductDetailModal = ({ 
  isOpen, 
  onClose, 
  product, 
  scale,
  latestMeasurement,
  customer 
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // State for measurements data
  const [measurements, setMeasurements] = useState([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [error, setError] = useState(null);
  
  // State for date range - initialize with last 7 days
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16)
    };
  });

  // Fetch measurements when modal opens or date range changes
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!isOpen || !scale?.scale_id) return;

      setIsLoadingMeasurements(true);
      setError(null);

      try {
        // Format dates for API request
        const start = new Date(dateRange.startDate).toISOString();
        const end = new Date(dateRange.endDate).toISOString();

        // Fetch measurements from API
        const response = await apiService.request(
          `measurements/scale/${scale.scale_id}`, 
          { 
            method: 'GET',
            params: {
              start_date: start,
              end_date: end
            }
          }
        );

        console.log('Raw measurements:', response); // Debug log

        // Transform the data to match the expected format
        const transformedData = Array.isArray(response) ? response.map(measurement => ({
          timestamp: measurement.timestamp,
          weight: parseFloat(measurement.weight)
        })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)) : [];

        console.log('Transformed measurements:', transformedData); // Debug log

        setMeasurements(transformedData);
      } catch (err) {
        console.error('Error fetching measurements:', err);
        setError(t.failedToFetchMeasurements || 'Failed to fetch measurements');
      } finally {
        setIsLoadingMeasurements(false);
      }
    };

    fetchMeasurements();
  }, [isOpen, scale?.scale_id, dateRange, t]);

  // Format timestamp
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            {customer && (
              <p className="text-gray-600">
                {language === 'he' ? 
                  customer.name.split(' - ')[0] : 
                  customer.name.split(' - ')[1]}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Scale Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Scale size={16} />
            <span>Scale ID: {scale?.scale_id}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm text-gray-500 mb-1">{t.upperThreshold}</span>
              <span className="text-green-600 font-medium">{product.thresholds.upper} kg</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-1">{t.lowerThreshold}</span>
              <span className="text-red-600 font-medium">{product.thresholds.lower} kg</span>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
          onEndDateChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
        />

        {/* Weight History Graph */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-4">{t.weightHistory}</h3>
          
          {isLoadingMeasurements ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">{t.loading}</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-600">
              {error}
            </div>
          ) : measurements.length > 0 ? (
            <ScaleGraph
              data={measurements}
              thresholds={product.thresholds}
              dateRange={dateRange}
            />
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              {t.noData || 'No measurement data available for the selected period'}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="mt-4 text-sm text-gray-500 text-right">
          {t.lastUpdated}: {formatDate(latestMeasurement?.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;