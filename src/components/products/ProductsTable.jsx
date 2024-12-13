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
  AlertTriangle,
  Loader2
} from 'lucide-react';
import ProductAnalytics from './ProductAnalytics';
import OrderHistory from './OrderHistory';
import { useItemHistory } from './hooks/useItemHistory';
import {
  getStatusColor,
  getAnalyticsWarningLevel,
  calculateAnalytics,
  calculateSeverityScore,
  getSeverityLevel
} from './utils/productUtils';

const calculateDaysFromLastOrder = (lastOrderDate) => {
  if (!lastOrderDate) return 0;
  console.log('lastOrderDate:', lastOrderDate);
  const [day, month, year] = lastOrderDate.split('-').map(num => parseInt(num));
  const orderDate = new Date(2000 + year, month - 1, day);
  console.log('orderDate:', orderDate);
  const today = new Date();
  const diffTime = Math.abs(today - orderDate);
  console.log('diffTime:', diffTime);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const SortHeader = ({ label, sortKey, currentSort, onSort, isRTL }) => {
  const isActive = currentSort?.key === sortKey;

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
  products = [],
  customers = [],
  scales = [],
  measurements = {},
  onEdit,
  onMessage,
  selectedProducts = [],
  onSelect,
  onSelectAll,
  sortConfig = { key: null, direction: 'asc' },
  onSort,
  isDeleting = false
}) => {
  const { language } = useLanguage();
  const t = (key) => translations[key]?.[language] || `Missing translation: ${key}`;
  const isRTL = language === 'he';
  const [expandedRow, setExpandedRow] = useState(null);
  const { loadHistory, histories, loadingStates, errors } = useItemHistory();

  const handleExpand = async (product) => {
    if (!product?.product_id) return;

    if (expandedRow === product.product_id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(product.product_id);
      if (!histories[product.product_id]) {
        await loadHistory(product);
      }
    }
  };

  const sortProducts = (productsToSort) => {
    if (!sortConfig?.key || !Array.isArray(productsToSort)) return productsToSort;

    return [...productsToSort].sort((a, b) => {
      let aValue = 0;
      let bValue = 0;

      switch (sortConfig.key) {
        case 'weight': {
          aValue = measurements?.[a?.scale_id]?.weight || 0;
          bValue = measurements?.[b?.scale_id]?.weight || 0;
          break;
        }
        case 'estimationQuantityLeft': {
          aValue = parseFloat(a?.estimation_quantity_left || 0);
          bValue = parseFloat(b?.estimation_quantity_left || 0);
          break;
        }
        case 'daysFromLastOrder': {
          aValue = calculateDaysFromLastOrder(a.last_order_date);
          bValue = calculateDaysFromLastOrder(b.last_order_date);
          break;
        }
        case 'severity': {
          aValue = parseInt(a.severity_score || 0);
          bValue = parseInt(b.severity_score || 0);
          break;
        }
        case 'name':
          return sortConfig.direction === 'asc'
            ? (a?.name || '').localeCompare(b?.name || '')
            : (b?.name || '').localeCompare(a?.name || '');
        default:
          return 0;
      }

      const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden relative">
      {isDeleting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white px-6 py-4 rounded-lg shadow-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">{t('deletingProducts')}</span>
          </div>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 w-12">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                disabled={isDeleting}
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
            if (!product?.product_id) return null;

            const metrics = {
              ...product,
              daysFromLastOrder: calculateDaysFromLastOrder(product.last_order_date)
            };
            console.log('metrics:', metrics);
            const measurement = measurements[product.scale_id];
            const scale = scales.find(s => s.scale_id === product.scale_id);
            const customer = customers.find(c => c.customer_id === product.customer_id);
            const statusColor = getStatusColor(measurement, product.thresholds);
            const severityInfo = getSeverityLevel(parseInt(product.severity_score || 0));
            console.log('product:', product);
            console.log('customer:', customer.name);
            console.log('product sevirty:', product.severity_score);
            const quantityWarning = getAnalyticsWarningLevel(
              'quantity',
              metrics.estimation_quantity_left,
              metrics.quantity_last_order,
              metrics.daysFromLastOrder,
              metrics.average_days_between_orders
            );

            const daysWarning = getAnalyticsWarningLevel(
              'days',
              metrics.estimation_quantity_left,
              metrics.quantity_last_order,
              metrics.daysFromLastOrder,
              metrics.average_days_between_orders
            );

            return (
              <React.Fragment key={product.product_id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.product_id)}
                      onChange={(e) => onSelect?.(product.product_id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      disabled={isDeleting}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.name || t('unnamed')}
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
                      <AlertTriangle className={`h-4 w-4 ${parseInt(product.severity_score || 0) >= 60 ? 'animate-pulse' : ''}`} />
                      <span className="font-medium">{product.severity_score || '0'}</span>
                      <span className="text-sm">({severityInfo.level})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer?.name || t('unknownCustomer')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {measurement?.weight ? `${measurement.weight} kg` : t('noData')}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${quantityWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      <span>
                        {metrics.recent_orders_count > 3
                          ? metrics.estimation_quantity_left
                          : t('notEnoughData')}
                      </span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${daysWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {metrics.daysFromLastOrder
                          ? `${metrics.daysFromLastOrder} ${t('days')}`
                          : t('noData')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onEdit?.(product)}
                        className="text-blue-600 hover:text-blue-900"
                        disabled={isDeleting}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onMessage?.(customer, product)}
                        className="text-green-600 hover:text-green-900"
                        disabled={isDeleting}
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleExpand(product)}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={isDeleting}
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
                      {loadingStates[product.product_id] ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      ) : errors[product.product_id] ? (
                        <div className="text-red-600 text-center py-4">
                          {errors[product.product_id]}
                        </div>
                      ) : histories[product.product_id] ? (
                        <div className="space-y-4">
                          {console.log('product:', product)}
                          <ProductAnalytics analytics={calculateAnalytics(product, histories[product.product_id])} />
                          <OrderHistory orders={histories[product.product_id]} />
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          {t('noData')}
                        </div>
                      )}
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