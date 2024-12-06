import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { 
  Package, 
  Pencil, 
  MessageSquare, 
  Scale,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowDown,
  ArrowUp,
  ArrowUpDown
} from 'lucide-react';
import apiService from '../../services/api';

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

const calculateSeverityScore = (analyticsData, type) => {
  if (!analyticsData) return 0;

  if (type === 'quantity') {
    const estimatedLeft = parseFloat(analyticsData.estimationQuantityLeft);
    const lastOrder = parseFloat(analyticsData.quantityLastOrder);
    if (isNaN(estimatedLeft) || isNaN(lastOrder) || lastOrder === 0) return 0;
    
    const percentageLeft = (estimatedLeft / lastOrder) * 100;
    
    if (percentageLeft <= 25) return 100;
    if (percentageLeft <= 50) return 75;
    if (percentageLeft <= 75) return 50;
    return 25;
  }

  if (type === 'days') {
    const daysFromLast = parseFloat(analyticsData.daysFromLastOrder);
    const avgDays = parseFloat(analyticsData.averageDaysBetweenOrders);
    if (isNaN(daysFromLast) || isNaN(avgDays) || avgDays === 0) return 0;
    
    const percentageOfCycle = (daysFromLast / avgDays) * 100;
    
    if (percentageOfCycle >= 100) return 100;
    if (percentageOfCycle >= 90) return 75;
    if (percentageOfCycle >= 75) return 50;
    return 25;
  }

  return 0;
};

const ProductsTableView = ({ 
  products = [], 
  scales = [], 
  customers = [], 
  measurements = {}, 
  onProductClick, 
  onMessageClick 
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  const [expandedRow, setExpandedRow] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: 'estimationQuantityLeft',
    direction: 'desc'
  });

  useEffect(() => {
    if (!Array.isArray(products) || products.length === 0) return;

    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true);
      const analyticsData = {};
      
      try {
        for (const product of products) {
          if (product?.customer_id && product?.item_id) {
            try {
              const lastOrder = await apiService.request(
                `orders/customer/${product.customer_id}/last-order/${product.item_id}`,
                { method: 'GET' }
              );

              if (!lastOrder) continue;

              const orders = await apiService.request(
                `orders/customer/${product.customer_id}/item-history/${lastOrder.item_external_id}`,
                { method: 'GET' }
              );

              if (orders && Array.isArray(orders) && orders.length > 1) {
                const sortedOrders = orders.sort((a, b) => {
                  const [dayA, monthA, yearA] = a.order_date.split("-");
                  const [dayB, monthB, yearB] = b.order_date.split("-");
                  const dateA = new Date(20 + yearA, monthA - 1, dayA);
                  const dateB = new Date(20 + yearB, monthB - 1, dayB);
                  return dateA - dateB;
                });

                const firstDateParts = sortedOrders[0].order_date.split("-");
                const firstDate = new Date(20 + firstDateParts[2], firstDateParts[1] - 1, firstDateParts[0]);
                const lastDateParts = sortedOrders[sortedOrders.length - 1].order_date.split("-");
                const lastDate = new Date(20 + lastDateParts[2], lastDateParts[1] - 1, lastDateParts[0]);
                const daysFromLastOrder = (new Date() - lastDate) / (1000 * 60 * 60 * 24);
                const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
                const quantityLastOrder = sortedOrders[sortedOrders.length - 1].quantity;
                const totalQuantity = sortedOrders.reduce((sum, order) => sum + parseFloat(order.quantity || 0), 0);
                const dailyAverage = (totalQuantity / daysDiff);
                const estimationQuantityLeft = quantityLastOrder - (dailyAverage * daysFromLastOrder);
                const averageDaysBetweenOrders = daysDiff / (sortedOrders.length - 1);

                analyticsData[product.product_id] = {
                  dailyAverage: dailyAverage.toFixed(2),
                  quantityLastOrder,
                  daysFromLastOrder: daysFromLastOrder.toFixed(0),
                  estimationQuantityLeft: estimationQuantityLeft.toFixed(2),
                  averageDaysBetweenOrders: averageDaysBetweenOrders.toFixed(2)
                };
              }
            } catch (error) {
              console.error('Error fetching analytics for product:', product.product_id, error);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchAnalytics:', error);
      } finally {
        setAnalytics(analyticsData);
        setIsLoadingAnalytics(false);
      }
    };

    fetchAnalytics();
  }, [products]);

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
          aValue = calculateSeverityScore(analytics[a.product_id], 'quantity');
          bValue = calculateSeverityScore(analytics[b.product_id], 'quantity');
          break;
        }
        case 'daysFromLastOrder': {
          aValue = calculateSeverityScore(analytics[a.product_id], 'days');
          bValue = calculateSeverityScore(analytics[b.product_id], 'days');
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

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return t.noData;
    return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (measurement, thresholds) => {
    if (!measurement?.weight || !thresholds) return 'text-gray-400';
    const weight = measurement.weight;
    if (weight >= thresholds.upper) return 'text-green-600';
    if (weight >= thresholds.lower) return 'text-orange-500';
    return 'text-red-600';
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (!customer) return t.unknownCustomer;
    return customer.name;
  };

  const getAnalyticsWarningLevel = (type, productAnalytics) => {
    if (!productAnalytics) return { className: '', warningLevel: 'normal' };

    if (type === 'quantity') {
      const value = parseFloat(productAnalytics.estimationQuantityLeft);
      const threshold = parseFloat(productAnalytics.quantityLastOrder * 0.75);
      
      if (value <= threshold * 0.5) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value <= threshold) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }

    if (type === 'days') {
      const value = parseFloat(productAnalytics.daysFromLastOrder);
      const avgDays = parseFloat(productAnalytics.averageDaysBetweenOrders);
      
      if (value >= avgDays) {
        return { className: 'bg-red-50 text-red-700 font-medium', warningLevel: 'critical' };
      }
      if (value >= avgDays * 0.9) {
        return { className: 'bg-orange-50 text-orange-700 font-medium', warningLevel: 'warning' };
      }
    }

    return { className: '', warningLevel: 'normal' };
  };

  if (!Array.isArray(products)) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        {t.noProducts}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <SortHeader 
              label={t.productName}
              sortKey="name"
              currentSort={sortConfig}
              onSort={handleSort}
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
              onSort={handleSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t.estimationQuntityLeft}
              sortKey="estimationQuantityLeft"
              currentSort={sortConfig}
              onSort={handleSort}
              isRTL={isRTL}
            />
            <SortHeader 
              label={t.daysFromLastOrder}
              sortKey="daysFromLastOrder"
              currentSort={sortConfig}
              onSort={handleSort}
              isRTL={isRTL}
            />
            <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
              ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.actions}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortProducts(products).map((product) => {
            const measurement = measurements[product.scale_id];
            const scale = scales.find(s => s.scale_id === product.scale_id);
            const statusColor = getStatusColor(measurement, product.thresholds);
            const productAnalytics = analytics[product.product_id];
            const quantityWarning = getAnalyticsWarningLevel('quantity', productAnalytics);
            const daysWarning = getAnalyticsWarningLevel('days', productAnalytics);

            return (
              <React.Fragment key={product.product_id}>
                <tr className={`group hover:bg-gray-50`}>
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
                      {getCustomerName(product.customer_id)}
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
                      {isLoadingAnalytics ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : productAnalytics ? (
                        <span>
                          {productAnalytics.estimationQuantityLeft} {t.units}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t.noData}</span>
                      )}
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${daysWarning.className}`}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {isLoadingAnalytics ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      ) : productAnalytics ? (
                        <span>
                          {productAnalytics.daysFromLastOrder} {t.days}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t.noData}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => onProductClick(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onMessageClick(product)}
                        className="text-green-600 hover:text-green-900"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </button>
                      {isLoadingAnalytics ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : productAnalytics && (
                        <button
                          onClick={() => setExpandedRow(expandedRow === product.product_id ? null : product.product_id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {expandedRow === product.product_id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedRow === product.product_id && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                      {isLoadingAnalytics ? (
                        <div className="flex justify-center items-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                      ) : productAnalytics ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">
                              {t.ConsumptionAnalytics}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <span className="text-sm text-gray-500 font-medium">
                                {t.averageConsumption}
                              </span>
                              <div className="mt-1 text-gray-900">
                                <span className="text-lg font-semibold">
                                  {productAnalytics.dailyAverage}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  {t.unitsPerDay}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <span className="text-sm text-gray-500 font-medium">
                                {t.averageDaysBetweenOrders}
                              </span>
                              <div className="mt-1 text-gray-900">
                                <span className="text-lg font-semibold">
                                  {productAnalytics.averageDaysBetweenOrders}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  {t.days}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <span className="text-sm text-gray-500 font-medium">
                                Last Order Quantity
                              </span>
                              <div className="mt-1 text-gray-900">
                                <span className="text-lg font-semibold">
                                  {productAnalytics.quantityLastOrder}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  {t.units}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-3 shadow-sm">
                              <span className="text-sm text-gray-500 font-medium">
                                Daily Consumption Rate
                              </span>
                              <div className="mt-1 text-gray-900">
                                <span className="text-lg font-semibold">
                                  {((parseFloat(productAnalytics.dailyAverage) / 
                                    parseFloat(productAnalytics.quantityLastOrder)) * 100).toFixed(1)}%
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                  per day
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Warning Indicators */}
                          {(quantityWarning.warningLevel !== 'normal' || 
                            daysWarning.warningLevel !== 'normal') && (
                            <div className="mt-4 flex gap-4">
                              {quantityWarning.warningLevel !== 'normal' && (
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                                  quantityWarning.warningLevel === 'critical' 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'bg-orange-50 text-orange-700'
                                }`}>
                                  <AlertCircle className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    {quantityWarning.warningLevel === 'critical'
                                      ? 'Critical inventory level'
                                      : 'Low inventory warning'}
                                  </span>
                                </div>
                              )}
                              {daysWarning.warningLevel !== 'normal' && (
                                <div className={`flex items-center gap-2 p-2 rounded-lg ${
                                  daysWarning.warningLevel === 'critical'
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-orange-50 text-orange-700'
                                }`}>
                                  <AlertCircle className="h-5 w-5" />
                                  <span className="text-sm font-medium">
                                    {daysWarning.warningLevel === 'critical'
                                      ? 'Order urgently needed'
                                      : 'Order soon'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {t.noData}
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

export default ProductsTableView;