import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { getStatusColor } from '../utils/thresholdUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { MessageSquare } from 'lucide-react';
import customersData from '../data/customersData.json';

const DEFAULT_THRESHOLDS = {
  upper: 40,
  lower: 8
};

const MiniGraph = ({ data }) => {
  // Ensure data is valid and sorted
  const sortedData = Array.isArray(data) 
    ? [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

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
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';
  
  // Early return if scale is invalid
  if (!scale || typeof scale !== 'object') {
    console.error('Invalid scale object provided to ScaleCard');
    return null;
  }

  // Ensure required properties exist with defaults
  const safeScale = {
    ...scale,
    history: Array.isArray(scale.history) ? scale.history : [],
    thresholds: { ...DEFAULT_THRESHOLDS, ...(scale.thresholds || {}) },
    unit: scale.unit || 'kg',
    productName: scale.productName || 'Unknown Product',
    notifications: scale.notifications || {
      lower: { phoneNumber: '', message: '' }
    }
  };
  
  // Find customer for this scale
  const customer = customersData.customers.find(
    cust => cust.scaleIds.includes(safeScale.id)
  );
  
  // Get customer name in correct format based on language
  const getCustomerName = () => {
    if (!customer) return t('unknownCustomer');
    const [hebrewName, englishName] = customer.name.split(" - ");
    return language === 'he' ? hebrewName : englishName;
  };

  // Get the latest measurement
  const sortedHistory = [...safeScale.history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const latestMeasurement = sortedHistory[0];
  const currentWeight = latestMeasurement ? latestMeasurement.weight : null;
  const statusColor = currentWeight !== null 
    ? getStatusColor(currentWeight, safeScale.thresholds.upper, safeScale.thresholds.lower)
    : 'text-gray-400';

  // Generate WhatsApp message
  const getWhatsAppLink = () => {
    const message = encodeURIComponent(
      `${t('runningLowMessage')} ${product.name}\n${t('productLeft')}: ${measurement?.weight || 0}kg\n${t('doYouWantToOrder')}`
    );
    const number = safeScale.notifications?.lower?.phoneNumber || ''; // Fallback number if not set
    return `https://wa.me/${number.replace('+', '')}?text=${message}`;
  };
  
  return (
    <div className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow">
      <div 
        className={`flex justify-between items-start mb-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
      >
        <div 
          className={`${isRTL ? 'text-right' : 'text-left'} cursor-pointer`}
          onClick={() => onCardClick(safeScale)}
        >
          <h3 className="text-2xl font-bold">{safeScale.productName}</h3>
          <p className="text-sm text-gray-500">{getCustomerName()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full ${
            statusColor === 'text-green-600' ? 'bg-green-100' : 
            statusColor === 'text-orange-500' ? 'bg-orange-100' : 'bg-red-100'
          }`}>
            <span className={`text-sm font-medium ${statusColor}`}>
              {currentWeight !== null ? `${currentWeight} ${safeScale.unit}` : t('noData')}
            </span>
          </div>
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full hover:bg-green-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSquare size={16} />
          </a>
        </div>
      </div>

      <div 
        className={`space-y-4 ${isRTL ? 'text-right' : 'text-left'} cursor-pointer`}
        onClick={() => onCardClick(safeScale)}
      >
        <div>
          <span className="block text-sm text-gray-500 mb-1">{t('thresholds')}</span>
          <div className="text-sm">
            <div className="text-green-600">
              {t('upperThreshold')}: {safeScale.thresholds.upper} {safeScale.unit}
            </div>
            <div className="text-red-600">
              {t('lowerThreshold')}: {safeScale.thresholds.lower} {safeScale.unit}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <MiniGraph data={safeScale.history} />
        </div>
      </div>
    </div>
  );
};

export default ScaleCard;