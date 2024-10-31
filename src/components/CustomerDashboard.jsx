import React, { useState, useEffect } from 'react';
import { getStatusColor } from '../utils/thresholdUtils';
import useScaleData from '../hooks/useScaleData';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

const ScaleCircle = ({ scale }) => {
  const sortedHistory = [...scale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower)
    : 'text-gray-400';

  const bgColorMap = {
    'text-green-600': 'bg-green-100',
    'text-orange-500': 'bg-orange-100',
    'text-red-600': 'bg-red-100',
    'text-gray-400': 'bg-gray-100'
  };

  return (
    <div className="text-center">
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center ${bgColorMap[statusColor]} ${statusColor} mx-auto`}
      >
        {currentWeight !== null ? (
          <span className="font-bold">{Math.round(currentWeight)}</span>
        ) : (
          <span className="text-sm">No data</span>
        )}
      </div>
      <span className="text-sm text-gray-500 mt-2 block">{scale.productName}</span>
    </div>
  );
};

const CustomerCard = ({ customer, scales, onSelect, isRTL }) => {
  // Find scales that belong to this customer
  const customerScales = scales.filter(scale => {
    const scaleIds = customer.scale_ids || customer.scaleIds || [];
    return scaleIds.includes(scale.id);
  });

  // Split customer name into Hebrew and English parts
  const [hebrewName, englishName] = (customer.name || '').split(" - ");
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect(customer.scale_ids || customer.scaleIds || [])}
    >
      <div className={`flex justify-between items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span className="text-xl">{isRTL ? hebrewName : englishName}</span>
        <span className="text-xl font-bold">{isRTL ? englishName : hebrewName}</span>
      </div>
      <div className="flex flex-col">
        <div className="text-sm text-gray-600 mb-2">
          {customer.email && <div>{customer.email}</div>}
          {customer.phone && <div>{customer.phone}</div>}
          {customer.address && <div>{customer.address}</div>}
        </div>
        {customerScales.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {customerScales.map(scale => (
              <ScaleCircle key={scale.id} scale={scale} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No scales assigned</p>
        )}
      </div>
    </div>
  );
};

const CustomerDashboard = ({ onCustomerSelect }) => {
  const { scales, isLoading: isLoadingScales, error: scalesError, refreshScales } = useScaleData();
  const [customers, setCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [customersError, setCustomersError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch customers from the server
  const fetchCustomers = async () => {
    try {
      setCustomersError(null);
      const response = await apiService.getCustomers();
      console.log('Fetched customers:', response);
      setCustomers(response);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomersError(err.message || 'Failed to fetch customers');
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchCustomers(),
        refreshScales()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state if either customers or scales are loading
  if (isLoadingCustomers || isLoadingScales) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">{t.loading}</span>
      </div>
    );
  }

  // Show error state if either customers or scales failed to load
  const error = customersError || scalesError;
  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          {t.tryAgain}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.customerOverview}</h1>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t.refresh}
        </button>
      </div>

      {customers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">{t.noCustomers}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {customers.map(customer => (
            <CustomerCard 
              key={customer.customer_id || customer.id}
              customer={customer}
              scales={scales}
              onSelect={onCustomerSelect}
              isRTL={isRTL}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;