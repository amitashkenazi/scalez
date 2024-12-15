
import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Receipt } from 'lucide-react';

const InvoicesHistory = ({ invoices }) => {
  console.log('invoices:', invoices);
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

  const sortedInvoices = [...invoices].sort((a, b) => {
    const dateA = new Date(...a.invoice_date.split("-").reverse());
    const dateB = new Date(...b.invoice_date.split("-").reverse());
    return dateB - dateA;
  });

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-semibold">{t('invoiceHistory')}</h3>
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
                {t('invoiceID')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedInvoices.map((invoice, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(invoice.invoice_date)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.quantity}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  ₪{invoice.price}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  ₪{invoice.total}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                  {invoice.item_external_id}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalInvoices')}: {invoices.length}
              </td>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalQuantity')}: {invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.quantity) || 0), 0)}
              </td>
              <td></td>
              <td className="px-4 py-2 text-sm font-medium text-gray-900">
                {t('totalAmount')}: ₪{invoices.reduce((sum, invoice) => sum + (parseFloat(invoice.total) || 0), 0).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default InvoicesHistory;