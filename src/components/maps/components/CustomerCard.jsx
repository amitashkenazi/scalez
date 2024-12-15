import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { translations } from '../../../translations/translations';
import { hasWaitingDelivery } from '../utils';
import { Navigation } from 'lucide-react';

const CustomerCard = ({ customer, onLocationClick, invoices }) => {
  const { language } = useLanguage();
  const [hebrewName, englishName] = customer?.name?.split(' - ') || ['', ''];
  const displayName = language === 'he' ? hebrewName : englishName;
  const isPendingDelivery = customer ? hasWaitingDelivery(customer, invoices) : false;
  const isRTL = language === 'he';

  if (!customer) {
    return null;
  }

  const handleNavigate = (e) => {
    e.stopPropagation();
    // Try to open in Waze
    const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(customer.address)}`;
    window.open(wazeUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-colors
        ${isPendingDelivery ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-lg">
          {displayName || 'Unnamed Customer'}
          {isPendingDelivery && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Pending Delivery
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleNavigate}
            className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 flex items-center gap-1 text-blue-700"
            title="Navigate with Waze"
          >
            <Navigation size={12} />
            Navigate
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLocationClick(customer);
            }}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            View
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-2">{customer.address || 'No address'}</div>
      {customer.products && customer.products.length > 0 && (
        <div className="space-y-2">
          {customer.products.map(product => {
            if (!product) return null;

            const measurement = product.measurement || {};
            const weight = measurement.weight;
            const thresholds = product.thresholds || { upper: 0, lower: 0 };

            return (
              <div
                key={product.product_id || Math.random()}
                className="flex justify-between items-center bg-gray-50 p-2 rounded"
              >
                <span>{product.name || 'Unnamed Product'}</span>
                <span className={`font-medium ${!weight ? 'text-gray-500' :
                  weight >= thresholds.upper ? 'text-green-600' :
                    weight >= thresholds.lower ? 'text-orange-500' :
                      'text-red-600'
                  }`}>
                  {weight ?
                    `${Math.round(weight)} kg` :
                    'No data'
                  }
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomerCard;