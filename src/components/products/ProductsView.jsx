import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';

import { 
  Package, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  TableIcon,
  LayoutGrid,
  Plus,
  Search,
  Pencil,
  MessageSquare,
  Scale,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Calendar,
  ArrowDown,
  ArrowUp,
  ArrowUpDown
} from 'lucide-react';
import debounce from 'lodash/debounce';
import apiService from '../../services/api';
import ProductModal from '../ProductModal';
import NewProductCard from './NewProductCard';
import ProductCard from './ProductCard';

// Cache implementation
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = async (key, fetchFn) => {
  const now = Date.now();
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  const data = await fetchFn();
  cache.set(key, { data, timestamp: now });
  return data;
};

// Table sort header component
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

// Custom hook for managing data fetching and caching
const useDataFetching = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    products: [],
    scales: [],
    customers: [],
    measurements: {},
    analytics: {}
  });

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [productsResponse, scales, customers] = await Promise.all([
        fetchWithCache('products', () => 
          apiService.request('products?limit=20', { method: 'GET' })
        ),
        fetchWithCache('scales', () => 
          apiService.getScales()
        ),
        fetchWithCache('customers', () => 
          apiService.getCustomers()
        )
      ]);

      const products = productsResponse.items;

      const measurementsPromises = scales.map(scale => 
        fetchWithCache(`measurement-${scale.scale_id}`, () =>
          apiService.getLatestMeasurement(scale.scale_id)
        )
      );

      const measurements = await Promise.all(measurementsPromises);
      const measurementsMap = scales.reduce((acc, scale, index) => {
        acc[scale.scale_id] = measurements[index];
        return acc;
      }, {});

      const analyticsItems = products.map(product => ({
        customer_id: product.customer_id.split('_').pop(),
        item_id: product.item_id.split('_').pop(),
        product_id: product.product_id
      }));

      const analyticsResponse = await fetchWithCache('analytics', () =>
        apiService.request('orders/customers/item-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: analyticsItems })
        })
      );

      setData({
        products,
        scales,
        customers,
        measurements: measurementsMap,
        analytics: analyticsResponse.results || {}
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    cache.clear();
    await fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { data, isLoading, refreshData };
};

// Optimized search handling
const useProductSearch = (products, onSearch) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debouncedSearch = useMemo(
    () => debounce((term) => {
      setIsSearching(true);
      onSearch(term);
      setIsSearching(false);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return { searchTerm, isSearching, handleSearchChange };
};

// Analytics calculations
const calculateAnalytics = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) return null;

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('-').map(num => parseInt(num, 10));
    return new Date(2000 + year, month - 1, day);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = parseDate(a.order_date);
    const dateB = parseDate(b.order_date);
    return dateA - dateB;
  });

  const firstDate = parseDate(sortedOrders[0].order_date);
  const lastDate = parseDate(sortedOrders[sortedOrders.length - 1].order_date);
  const now = new Date();

  const daysFromLastOrder = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
  const totalPeriod = Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  const quantities = sortedOrders.map(order => parseFloat(order.quantity || 0));
  const quantityLastOrder = quantities[quantities.length - 1];
  const totalQuantity = quantities.reduce((sum, qty) => sum + qty, 0);
  const dailyAverage = totalQuantity / totalPeriod;
  
  return {
    dailyAverage: dailyAverage.toFixed(2),
    quantityLastOrder,
    daysFromLastOrder: daysFromLastOrder.toString(),
    estimationQuantityLeft: (quantityLastOrder - (dailyAverage * daysFromLastOrder)).toFixed(2),
    averageDaysBetweenOrders: (totalPeriod / (sortedOrders.length - 1)).toFixed(2),
    lastOrderDate: sortedOrders[sortedOrders.length - 1].order_date,
    totalOrders: sortedOrders.length,
    totalQuantity: totalQuantity.toFixed(2)
  };
};

const getStatusColor = (measurement, thresholds) => {
  if (!measurement?.weight || !thresholds) return 'text-gray-400';
  const weight = measurement.weight;
  if (weight >= thresholds.upper) return 'text-green-600';
  if (weight >= thresholds.lower) return 'text-orange-500';
  return 'text-red-600';
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

const ProductsView = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';
  const [viewType, setViewType] = useState('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'estimationQuantityLeft', direction: 'desc' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [error, setError] = useState(null); // Add this line
  
  const { 
    data: { products, scales, customers, measurements, analytics },
    isLoading,
    refreshData
  } = useDataFetching();

  const handleSearch = useCallback((term) => {
    if (!term.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const searchTerm = term.toLowerCase();
      const productName = product.name?.toLowerCase() || '';
      const customerName = customers.find(c => c.customer_id === product.customer_id)
        ?.name?.toLowerCase() || '';
      return productName.includes(searchTerm) || customerName.includes(searchTerm);
    });

    setFilteredProducts(filtered);
  }, [products, customers]);

  const { 
    searchTerm, 
    isSearching, 
    handleSearchChange 
  } = useProductSearch(products, handleSearch);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key && prevSort.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await apiService.createProduct(productData);
      refreshData();
      setIsModalOpen(false);
      setSuccessMessage(t.productAdded);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || t.failedToAddProduct);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Main render
  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {t.productsDashboard}
            </h2>
            <p className="text-gray-600 mt-1">{t.productStatus}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {t.lastUpdated}: {formatTime(new Date())}
            </span>
            <button
              onClick={() => setViewType(viewType === 'cards' ? 'table' : 'cards')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border rounded-lg"
            >
              {viewType === 'cards' ? (
                <>
                  <TableIcon className="h-5 w-5" />
                  {t.tableView}
                </>
              ) : (
                <>
                  <LayoutGrid className="h-5 w-5" />
                  {t.cardView}
                </>
              )}
            </button>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t.searchProducts}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isSearching}
        />
        <div className="absolute left-3 top-2.5">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Add Product Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          {t.addProduct}
        </button>
      </div>

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && !error && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t.noProductsFound}</p>
          <p className="text-gray-500 text-sm">{t.tryAdjustingSearch}</p>
        </div>
      )}

      {/* Products Display */}
      {!error && filteredProducts.length > 0 && (
        <>
          {viewType === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <NewProductCard 
                onClick={() => {
                  setSelectedProduct(null);
                  setIsModalOpen(true);
                }}
                t={t}
              />
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  scale={scales.find(s => s.scale_id === product.scale_id)}
                  measurement={measurements[product.scale_id]}
                  analytics={analytics[`${product.customer_id.split('_').pop()}_${product.item_id.split('_').pop()}`]}
                  customer={customers.find(c => c.customer_id === product.customer_id)}
                  onEdit={() => {
                    setSelectedProduct(product);
                    setIsModalOpen(true);
                  }}
                  onMessage={() => {
                    const customer = customers.find(c => c.customer_id === product.customer_id);
                    if (!customer?.phone) return;
                    const message = encodeURIComponent(
                      `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${measurements[product.scale_id]?.weight || 0}kg\n${t.pleaseResupply}`
                    );
                    window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                  }}
                  t={t}
                />
              ))}
            </div>
          ) : (
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
                  {filteredProducts.map((product) => {
                    const measurement = measurements[product.scale_id];
                    const scale = scales.find(s => s.scale_id === product.scale_id);
                    const statusColor = getStatusColor(measurement, product.thresholds);
                    const productAnalytics = analytics[`${product.customer_id.split('_').pop()}_${product.item_id.split('_').pop()}`];
                    const analyticsData = productAnalytics ? calculateAnalytics(productAnalytics) : null;
                    const quantityWarning = getAnalyticsWarningLevel('quantity', analyticsData);
                    const daysWarning = getAnalyticsWarningLevel('days', analyticsData);
                    console.log('analyticsData:', analyticsData);
                    console.log('productAnalytics:', productAnalytics);
                    return (
                      <React.Fragment key={product.product_id}>
                        <tr className="hover:bg-gray-50">
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
                              {customers.find(c => c.customer_id === product.customer_id)?.name || t.unknownCustomer}
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
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setIsModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  const customer = customers.find(c => c.customer_id === product.customer_id);
                                  if (!customer?.phone) return;
                                  const message = encodeURIComponent(
                                    `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${measurement?.weight || 0}kg\n${t.pleaseResupply}`
                                  );
                                  window.open(`https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <MessageSquare className="h-5 w-5" />
                              </button>
                              {analyticsData && (
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
                        {expandedRow === product.product_id && analyticsData && (
                          <tr>
                            <td colSpan="6" className="px-6 py-4 bg-gray-50">
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
                                        {analyticsData.dailyAverage}
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
                                        {analyticsData.averageDaysBetweenOrders}
                                      </span>
                                      <span className="text-sm text-gray-500 ml-1">
                                        {t.days}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <span className="text-sm text-gray-500 font-medium">
                                      {t.lastOrderQuantity}
                                    </span>
                                    <div className="mt-1 text-gray-900">
                                      <span className="text-lg font-semibold">
                                        {analyticsData.quantityLastOrder}
                                      </span>
                                      <span className="text-sm text-gray-500 ml-1">
                                        {t.units}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <span className="text-sm text-gray-500 font-medium">
                                      {t.dailyConsumptionRate}
                                    </span>
                                    <div className="mt-1 text-gray-900">
                                      <span className="text-lg font-semibold">
                                        {((parseFloat(analyticsData.dailyAverage) / analyticsData.quantityLastOrder) * 100).toFixed(1)}%
                                      </span>
                                      <span className="text-sm text-gray-500 ml-1">
                                        {t.perDay}
                                      </span>
                                    </div>
                                  </div>
                                </div>
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
          )}
        </>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleAddProduct}
        customers={customers}
        initialData={selectedProduct}
        t={t}
      />
    </div>
  );
};

export default ProductsView;