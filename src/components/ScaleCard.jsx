// src/components/ScaleCard.jsx
import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import customersData from '../data/customersData.json';

const MiniGraph = ({ data }) => {
  const sortedData = [...data].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData}>
          <Line 
            type="monotone" 
            dataKey="weight" 
            stroke="#4f46e5" 
            strokeWidth={2} 
            dot={false} 
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ScaleCard = ({ scale, onCardClick }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  
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

  // Get the latest measurement
  const sortedHistory = [...scale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, scale.thresholds.upper, scale.thresholds.lower)
    : 'text-gray-400';
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(scale)}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h3 className="text-2xl font-bold">{scale.productName}</h3>
          <p className="text-sm text-gray-500">{getCustomerName()}</p>
        </div>
        <div className={`px-3 py-1 rounded-full ${statusColor === 'text-green-600' ? 'bg-green-100' : statusColor === 'text-orange-500' ? 'bg-orange-100' : 'bg-red-100'}`}>
          <span className={`text-sm font-medium ${statusColor}`}>
            {currentWeight !== null ? `${currentWeight} ${scale.unit}` : t.noData}
          </span>
        </div>
      </div>

      <div className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div>
          <span className="block text-sm text-gray-500 mb-1">{t.thresholds}</span>
          <div className="text-sm">
            <div className="text-green-600">
              {t.upperThreshold}: {scale.thresholds.upper} {scale.unit}
            </div>
            <div className="text-red-600">
              {t.lowerThreshold}: {scale.thresholds.lower} {scale.unit}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <MiniGraph data={scale.history} />
        </div>
      </div>
    </div>
  );
};

export default ScaleCard;