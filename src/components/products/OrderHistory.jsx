
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Receipt } from 'lucide-react';

const OrderHistory = ({ orders }) => {
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const formatDate = (dateString) => {
    const [day, month, year] = dateString.split("-");
    return new Date(20 + year, month - 1, day).toLocaleDateString(
      language === 'he' ? 'he-IL' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(...a.order_date.split("-").reverse());
    const dateB = new Date(...b.order_date.split("-").reverse());
    return dateB - dateA;
  });

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">{t('orderHistory')}</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('date')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('quantity')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('price')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('total')}
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('orderID')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.order_date)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.quantity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  ₪{order.price}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  ₪{order.total}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {order.item_external_id}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalOrders')}: {orders.length}
              </td>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalQuantity')}: {orders.reduce((sum, order) => sum + (parseFloat(order.quantity) || 0), 0)}
              </td>
              <td></td>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalAmount')}: ₪{orders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderHistory;