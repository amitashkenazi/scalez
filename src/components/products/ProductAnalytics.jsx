// ProductAnalytics.jsx
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { TrendingUp, ShoppingBag, Calendar, Clock, AlertCircle } from 'lucide-react';

const ProductAnalytics = ({ analytics }) => {
  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  // Early return with message if not enough data
  if (!analytics || analytics.length <= 3) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">
            {t('ConsumptionAnalytics')}
          </span>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-700">
              At least 4 invoices are needed to display analytics. Current count: {analytics?.length || 0}
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              {analytics.dailyAverage}
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
              {analytics.averageDaysBetweenOrders}
            </span>
            <span className="text-sm text-gray-500 ml-1">{t('days')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('lastOrderQuantity')}
          </span>
          <div className="mt-1 text-gray-900">
            <span className="text-lg font-semibold">
              {analytics.quantityLastOrder}
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
              {analytics.dailyConsumptionPercentage}%
            </span>
            <span className="text-sm text-gray-500 ml-1">per day</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ProductCard.jsx - Analytics Section
const AnalyticsSection = ({ analytics }) => {
  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  if (!analytics || analytics.length <= 3) {
    return (
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          <h4 className="text-lg font-semibold text-gray-700">
            {t('ConsumptionAnalytics')}
          </h4>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <p className="text-blue-700 text-sm">
              Analytics will be available after 4 invoices. Current count: {analytics?.length || 0}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getDangerClassNames = (type, value) => {
    if (type === 'quantity') {
      return parseFloat(value) <= parseFloat(analytics.quantityLastOrder * 0.75)
        ? 'bg-red-50 text-red-700'
        : 'bg-white text-gray-900';
    }
    if (type === 'days') {
      const avgDays = parseFloat(analytics.averageDaysBetweenOrders || 0);
      return parseFloat(value) <= (avgDays * 0.3)
        ? 'bg-red-50 text-red-700'
        : 'bg-white text-gray-900';
    }
    return 'bg-white text-gray-900';
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-500" />
          <h4 className="text-lg font-semibold text-gray-700">
            {t('ConsumptionAnalytics')}
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex flex-col h-full justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {t('averageConsumption')}
            </span>
            <div className="mt-1">
              <span className="text-lg font-semibold">
                {analytics.dailyAverage}
              </span>
              <span className="text-sm text-gray-500 ml-1">{t('unitsPerDay')}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="flex flex-col h-full justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {t('averageDaysBetweenOrders')}
            </span>
            <div className="mt-1">
              <span className="text-lg font-semibold">
                {analytics.averageDaysBetweenOrders}
              </span>
              <span className="text-sm text-gray-500 ml-1">{t('days')}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-3 shadow-sm transition-colors duration-300 ${
          getDangerClassNames('days', analytics.daysFromLastOrder)
        }`}>
          <div className="flex flex-col h-full justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {t('daysFromLastOrder')}
            </span>
            <div className="mt-1">
              <span className="text-lg font-semibold">
                {analytics.daysFromLastOrder}
              </span>
              <span className="text-sm text-gray-500 ml-1">{t('days')}</span>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-3 shadow-sm transition-colors duration-300 ${
          getDangerClassNames('quantity', analytics.estimationQuantityLeft)
        }`}>
          <div className="flex flex-col h-full justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {t('estimationQuntityLeft')}
            </span>
            <div className="mt-1">
              <span className="text-lg font-semibold">
                {analytics.estimationQuantityLeft}
              </span>
              <span className="text-sm text-gray-500 ml-1">{t('units')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProductAnalytics, AnalyticsSection };