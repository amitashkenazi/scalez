import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { X, Loader2, Scale } from 'lucide-react';
import ScaleGraph from '../ScaleGraph';
import DateRangeSelector from '../DateRangeSelector';
import apiService from '../../services/api';

const ProductDetailModal = ({ 
  isOpen, 
  onClose, 
  product, 
  scale_id,
  latestMeasurement,
  customer 
}) => {
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  console.log('ProductDetailModal rendered:', { isOpen, scale_id }); // Initial render log

  // State for measurements data
  const [measurements, setMeasurements] = useState([]);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);
  const [error, setError] = useState(null);
  
  // State for date range - memoize initial value
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      startDate: start.toISOString().slice(0, 16),
      endDate: end.toISOString().slice(0, 16)
    };
  });

  // Define formatDate function
  const formatDate = React.useCallback((timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }, [language]);



  // Add separate useEffect for monitoring prop changes
  useEffect(() => {
    console.log('Props changed:', { isOpen, scale_id });
  }, [isOpen, scale_id]);

  // Fetch measurements
  useEffect(() => {
    let isMounted = true;
    
    const fetchMeasurements = async () => {
      console.log('Fetch measurements triggered:', { isOpen, scale_id });

      if (!isOpen) {
        console.log('Modal is closed, skipping fetch');
        return;
      }

      if (!scale_id) {
        console.log('No scale_id provided, skipping fetch ', scale_id);
        return;
      }

      setIsLoadingMeasurements(true);
      setError(null);

      try {
        const start = new Date(dateRange.startDate).toISOString();
        const end = new Date(dateRange.endDate).toISOString();

        console.log('Making API request for scale:', scale_id);

        const response = await apiService.request(
          `measures/scale/${scale_id}`, 
          { 
            method: 'GET',
            params: {
              start_date: start,
              end_date: end
            }
          }
        );

        console.log('API response received:', response);

        if (isMounted) {
          const transformedData = Array.isArray(response) ? response
            .map(measurement => ({
              timestamp: new Date(measurement.timestamp).toISOString(),
              weight: parseFloat(measurement.weight)
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            : [];

          console.log('Setting measurements:', transformedData);
          setMeasurements(transformedData);
        }
      } catch (err) {
        console.error('Error in fetch:', err);
        if (isMounted) {
          setError(t('failedToFetchMeasurements') || 'Failed to fetch measurements');
        }
      } finally {
        if (isMounted) {
          setIsLoadingMeasurements(false);
        }
      }
    };

    console.log('useEffect running');
    fetchMeasurements();

    return () => {
      console.log('Cleanup running');
      isMounted = false;
    };
  }, [isOpen, scale_id, dateRange.startDate, dateRange.endDate, t]);

  // Early return if modal is not open
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }

  console.log('Rendering modal content');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{product?.name}</h2>
            {customer && (
              <p className="text-gray-600">
                {language === 'he' ? 
                  customer.name?.split(' - ')[0] : 
                  customer.name?.split(' - ')[1]}
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
            <span>Scale ID: {scale_id}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm text-gray-500 mb-1">{t('upperThreshold')}</span>
              <span className="text-green-600 font-medium">{product?.thresholds?.upper} kg</span>
            </div>
            <div>
              <span className="block text-sm text-gray-500 mb-1">{t('lowerThreshold')}</span>
              <span className="text-red-600 font-medium">{product?.thresholds?.lower} kg</span>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onStartDateChange={(date) => {
            console.log('Start date changed:', date);
            setDateRange(prev => ({ ...prev, startDate: date }));
          }}
          onEndDateChange={(date) => {
            console.log('End date changed:', date);
            setDateRange(prev => ({ ...prev, endDate: date }));
          }}
        />

        {/* Weight History Graph */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
          <h3 className="text-lg font-bold mb-4">{t('weightHistory')}</h3>
          
          {isLoadingMeasurements ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">{t('loading')}</span>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-600">
              {error}
            </div>
          ) : measurements.length > 0 ? (
            <ScaleGraph
              data={measurements}
              thresholds={product?.thresholds}
              dateRange={dateRange}
            />
          ) : (
            <div className="flex justify-center items-center h-64 text-gray-500">
              {t('noData') || 'No measurement data available for the selected period'}
            </div>
          )}
        </div>

        {/* Last Updated */}
        <div className="mt-4 text-sm text-gray-500 text-right">
          {t('lastUpdated')}: {formatDate(latestMeasurement?.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;