import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { TrendingUp, ShoppingBag, Calendar, Clock } from 'lucide-react';
import { calculateAnalytics } from './utils/productUtils';

const ProductAnalytics = ({ analytics }) => {
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const analyticsData = calculateAnalytics(analytics);

  if (!analyticsData) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-gray-500" />
        <span className="font-medium text-gray-700">
          {t('ConsumptionAnalytics')}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('averageConsumption')}
          </span>
          <div className="mt-1 text-gray-900">
            <span className="text-lg font-semibold">
              {analyticsData.dailyAverage}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t('unitsPerDay')}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('averageDaysBetweenOrders')}
          </span>
          <div className="mt-1 text-gray-900">
            <span className="text-lg font-semibold">
              {analyticsData.averageDaysBetweenOrders}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t('days')}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('lastOrderQuantity')}
          </span>
          <div className="mt-1 text-gray-900">
            <span className="text-lg font-semibold">
              {analyticsData.quantityLastOrder}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t('units')}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('dailyConsumptionRate')}
          </span>
          <div className="mt-1 text-gray-900">
            <span className="text-lg font-semibold">
              {((parseFloat(analyticsData.dailyAverage) / analyticsData.quantityLastOrder) * 100).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t('perDay')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;