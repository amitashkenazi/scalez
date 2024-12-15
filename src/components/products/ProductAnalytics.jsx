// ProductAnalytics.jsx
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { TrendingUp, AlertCircle } from 'lucide-react';

const ProductAnalytics = ({ analytics }) => {
  const { language } = useLanguage();
  const t = (key) => translations[key]?.[language] || `Missing translation: ${key}`;
  console.log('aaaaAnalytics:', analytics, analytics.invoiceHistory.length);
  if (!analytics || analytics.invoiceHistory.length <= 3) {
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
          <div className="mt-1">
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
            {t('averageDaysBetweenInvoices')}
          </span>
          <div className="mt-1">
            <span className="text-lg font-semibold">
              {analytics.averageDaysBetweenInvoices}
            </span>
            <span className="text-sm text-gray-500 ml-1">{t('days')}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            {t('lastInvoiceQuantity')}
          </span>
          <div className="mt-1">
            <span className="text-lg font-semibold">
              {analytics.quantityLastInvoice}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              {t('units')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-500 font-medium">
            Daily Consumption Rate
          </span>
          <div className="mt-1">
            <span className="text-lg font-semibold">
              {analytics.dailyConsumptionRate || "0"}
            </span>
            <span className="text-sm text-gray-500 ml-1">% per day</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductAnalytics;

