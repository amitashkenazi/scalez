// src/components/Dashboard.jsx

import React, { useState } from 'react';
import useScaleData from '../hooks/useScaleData';
import ScaleDetail from './ScaleDetail';
import ScaleCard from './ScaleCard';
import { getDefaultDateRange } from '../utils/dateFilterUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <p className="mt-4 text-gray-600">Loading scales...</p>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
      <p className="text-red-700">{error}</p>
    </div>
    <button
      onClick={onRetry}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Try Again
    </button>
  </div>
);

const Dashboard = ({ selectedScaleIds }) => {
  const { 
    scales, 
    isLoading, 
    isRefreshing,
    error, 
    updateScale, 
    refreshScales 
  } = useScaleData();
  
  const [selectedScale, setSelectedScale] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const firstScale = scales[0];
    return firstScale ? getDefaultDateRange(firstScale.history) : getDefaultDateRange([]);
  });

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Filter scales based on selectedScaleIds if provided
  const displayedScales = selectedScaleIds 
    ? scales.filter(scale => selectedScaleIds.includes(scale.id))
    : scales;

  const handleCardClick = (scale) => {
    setSelectedScale(scale);
  };

  const handleStartDateChange = (newStartDate) => {
    setDateRange(prev => ({ ...prev, startDate: newStartDate }));
  };

  const handleEndDateChange = (newEndDate) => {
    setDateRange(prev => ({ ...prev, endDate: newEndDate }));
  };

  const handleSaveScale = async (updatedScale) => {
    try {
      await updateScale(updatedScale);
      setSelectedScale(updatedScale);
      return true;
    } catch (error) {
      console.error('Error saving scale:', error);
      throw error;
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refreshScales} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.scaleMonitorDashboard}</h1>
        <button
          onClick={refreshScales}
          disabled={isRefreshing}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t.refresh}
        </button>
      </div>
      
      {displayedScales.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-600">{t.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedScales.map((scale) => (
            <ScaleCard
              key={scale.id}
              scale={scale}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}

      {selectedScale && (
        <ScaleDetail 
          scale={selectedScale} 
          onClose={() => setSelectedScale(null)}
          onSave={handleSaveScale}
          dateRange={dateRange}
          onStartDateChange={handleStartDateChange}
          onEndDateChange={handleEndDateChange}
        />
      )}
    </div>
  );
};

export default Dashboard;