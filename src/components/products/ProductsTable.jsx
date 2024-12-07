import React, { useState, useRef, useCallback } from 'react';
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
  Loader2
} from 'lucide-react';
import ProductAnalytics from './ProductAnalytics';
import OrderHistory from './OrderHistory';
import { getStatusColor, getAnalyticsWarningLevel, calculateAnalytics } from './utils/productUtils';
import useSortableData from './hooks/useSortableData';

// Intersection Observer Hook
const useInfiniteScroll = (loadMore, hasMore, isLoading) => {
  const observer = useRef();
  
  const lastElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadMore, hasMore, isLoading]);

  return lastElementRef;
};

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
  isLoading,
  hasMore,
  loadMore,
  onEdit,
  onMessage
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  const [expandedRow, setExpandedRow] = useState(null);

  const { 
    sortedItems: sortedProducts, 
    sortConfig, 
    requestSort 
  } = useSortableData(products, { key: 'name', direction: 'asc' });

  const lastElementRef = useInfiniteScroll(loadMore, hasMore, isLoading);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader 
              label={t.productName}
              sortKey="name"
              currentSort={sortConfig}
              onSort={requestSort}
              isRTL={isRTL}
            />
            <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
              ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.customer}
            </th>
            <SortHeader 
              label={t.weight}
              sortKey="weight"
              currentSort={sortConfig}
              onSort={requestSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t.estimationQuantityLeft}
              sortKey="estimationQuantityLeft"
              currentSort={sortConfig}
              onSort={requestSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t.daysFromLastOrder}
              sortKey="daysFromLastOrder"
              currentSort={sortConfig}
              onSort={requestSort}
              isRTL={isRTL}
            />
            <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
              ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.actions}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedProducts.map((product, index) => {
            const isLastElement = index === sortedProducts.length - 1;
            const measurement = measurements[product.scale_id];
            const scale = scales.find(s => s.scale_id === product.scale_id);
            const customer = customers.find(c => c.customer_id === product.customer_id);
            const statusColor = getStatusColor(measurement, product.thresholds);
            const isExpanded = expandedRow === product.product_id;
            const productAnalytics = analytics[`${product.customer_id.split('_').pop()}_${product.item_id.split('_').pop()}`];
            const analyticsData = productAnalytics ? calculateAnalytics(productAnalytics) : null;
            const quantityWarning = getAnalyticsWarningLevel('quantity', analyticsData);
            const daysWarning = getAnalyticsWarningLevel('days', analyticsData);

            return (
              <React.Fragment key={product.product_id}>
                <tr 
                  ref={isLastElement ? lastElementRef : null}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
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
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {customer?.name || t.unknownCustomer}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${statusColor}`}>
                      {measurement ? `${measurement.weight} kg` : t.noData}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${quantityWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" />
                      {analyticsData ? (
                        <span>
                          {analyticsData.estimationQuantityLeft} {t.units}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t.noData}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${daysWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {analyticsData ? (
                        <span>
                          {analyticsData.daysFromLastOrder} {t.days}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t.noData}</span>
                      )}
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
                        onClick={() => {
                          const message = encodeURIComponent(
                            `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${measurement?.weight || 0}kg\n${t.pleaseResupply}`
                          );
                          onMessage(customer, message);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      {productAnalytics && (
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : product.product_id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {isExpanded && productAnalytics && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <ProductAnalytics analytics={productAnalytics} />
                        <OrderHistory orders={productAnalytics} language={language} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}
      
      {/* End of content indicator */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          {t.noMoreProducts}
        </div>
      )}
    </div>
  );
};

export default ProductsTable;