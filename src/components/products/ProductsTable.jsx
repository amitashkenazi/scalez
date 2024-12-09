import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { 
  Package, 
  Pencil, 
  MessageSquare, 
  Scale,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { ProductAnalytics } from './ProductAnalytics';
import OrderHistory from './OrderHistory';
import { 
  getStatusColor, 
  getAnalyticsWarningLevel, 
  calculateSeverityScore,
  getSeverityLevel
} from './utils/productUtils';

const SortHeader = ({ label, sortKey, currentSort, onSort, isRTL }) => {
  const isActive = currentSort.key === sortKey;
  
  return (
    <th 
      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100
        ${isRTL ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <span>{label}</span>
        {isActive ? (
          currentSort.direction === 'asc' ? 
            <ArrowUp className="h-4 w-4" /> : 
            <ArrowDown className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </th>
  );
};

const ProductsTable = ({
  products,
  customers,
  scales,
  measurements,
  analytics,
  onEdit,
  onMessage,
  selectedProducts,
  onSelect,
  onSelectAll,
  sortConfig,
  onSort
}) => {
  const { language } = useLanguage();
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';
  const [expandedRow, setExpandedRow] = useState(null);

  const sortProducts = (productsToSort) => {
    if (!sortConfig.key) return productsToSort;

    return [...productsToSort].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortConfig.key) {
        case 'weight': {
          const aWeight = measurements[a.scale_id]?.weight || 0;
          const bWeight = measurements[b.scale_id]?.weight || 0;
          aValue = aWeight;
          bValue = bWeight;
          break;
        }
        case 'estimationQuantityLeft': {
          const aAnalytics = analytics[a.product_id];
          const bAnalytics = analytics[b.product_id];
          aValue = parseFloat(aAnalytics?.estimationQuantityLeft || 0);
          bValue = parseFloat(bAnalytics?.estimationQuantityLeft || 0);
          break;
        }
        case 'daysFromLastOrder': {
          const aAnalytics = analytics[a.product_id];
          const bAnalytics = analytics[b.product_id];
          aValue = parseFloat(aAnalytics?.daysFromLastOrder || 0);
          bValue = parseFloat(bAnalytics?.daysFromLastOrder || 0);
          break;
        }
        case 'severity': {
          const aAnalytics = analytics[a.product_id];
          const bAnalytics = analytics[b.product_id];
          aValue = calculateSeverityScore(aAnalytics);
          bValue = calculateSeverityScore(bAnalytics);
          break;
        }
        case 'name': {
          return sortConfig.direction === 'asc' 
            ? (a.name || '').localeCompare(b.name || '')
            : (b.name || '').localeCompare(a.name || '');
        }
        default:
          return 0;
      }

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer?.name || t('unknownCustomer');
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 w-12">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </th>
            <SortHeader 
              label={t('productName')}
              sortKey="name"
              currentSort={sortConfig}
              onSort={onSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t('severity')}
              sortKey="severity"
              currentSort={sortConfig}
              onSort={onSort}
              isRTL={isRTL}
            />
            <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
              ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('customer')}
            </th>
            <SortHeader 
              label={t('weight')}
              sortKey="weight"
              currentSort={sortConfig}
              onSort={onSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t('estimationQuantityLeft')}
              sortKey="estimationQuantityLeft"
              currentSort={sortConfig}
              onSort={onSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t('daysFromLastOrder')}
              sortKey="daysFromLastOrder"
              currentSort={sortConfig}
              onSort={onSort}
              isRTL={isRTL}
            />
            <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
              ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('actions')}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortProducts(products).map((product) => {
            const measurement = measurements[product.scale_id];
            const scale = scales.find(s => s.scale_id === product.scale_id);
            const customer = customers.find(c => c.customer_id === product.customer_id);
            const statusColor = getStatusColor(measurement, product.thresholds);
            const productAnalytics = analytics[product.product_id] || {};
            const quantityWarning = getAnalyticsWarningLevel('quantity', productAnalytics);
            const daysWarning = getAnalyticsWarningLevel('days', productAnalytics);
            const severityScore = calculateSeverityScore(productAnalytics);
            const severityInfo = getSeverityLevel(severityScore);

            return (
              <React.Fragment key={product.product_id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.product_id)}
                      onChange={(e) => onSelect(product.product_id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {scale && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Scale className="h-4 w-4" />
                            {scale.name || `Scale ${scale.scale_id}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${severityInfo.className}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${severityScore >= 60 ? 'animate-pulse' : ''}`} />
                      <span className="font-medium">{severityScore}</span>
                      <span className="text-sm">({severityInfo.level})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {getCustomerName(product.customer_id)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {measurement ? `${measurement.weight} kg` : t('noData')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${quantityWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span>{productAnalytics?.estimationQuantityLeft || t('noData')}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${daysWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {productAnalytics?.daysFromLastOrder 
                          ? `${productAnalytics.daysFromLastOrder} ${t('days')}`
                          : t('noData')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onMessage(customer, product)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setExpandedRow(
                          expandedRow === product.product_id ? null : product.product_id
                        )}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {expandedRow === product.product_id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === product.product_id && (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <ProductAnalytics analytics={productAnalytics} />
                        <OrderHistory orders={productAnalytics?.orderHistory || []} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;