// src/components/orders/OrdersView.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../../services/api';
import ProductModal from '../ProductModal';
import debounce from 'lodash/debounce';

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 500;

const OrderStatus = {
  OPEN: 'פתוחה',
  CLOSED: 'סגורה',
  IN_PROGRESS: 'בטיפול',
  CANCELLED: 'מבוטלת'
};

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case OrderStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CLOSED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

const OrderDetails = ({ items, customerName }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await apiService.getCustomers();
        setCustomers(response);
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleCreateProduct = (item) => {
    console.log('Creating product from item:', item);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddProduct = async (productData) => {
    try {
      await apiService.createProduct(productData);
      setSuccessMessage((t('productAdded')) || 'Product created successfully');
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  };

  const handleCustomerAdded = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer]);
  };

  if (!Array.isArray(items)) return null;
  
  return (
    <>
      <div className="p-4 bg-gray-50 rounded-lg">
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-400 rounded-lg p-3">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}
        <h4 className="font-medium mb-2">Order Items:</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
              <div className="flex-1">
                <span className="font-medium">{item.item_external_id} - {item.item_name || 'Unknown Item'}</span>
                <div className="text-sm text-gray-500 space-x-4">
                  <span>Price: ₪{item.price || 0}</span>
                  <span>Quantity: {item.quantity || 0}</span>
                  <span className="font-medium">Total: ₪{item.total || 0}</span>
                </div>
              </div>
              <button
                onClick={() => handleCreateProduct(item)}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 
                  rounded-lg flex items-center gap-1 transition-colors"
              >
                + Create Product
              </button>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedItem(null);
          }}
          customers={customers}
          initialData={{
            name: selectedItem.item_name,
            item_id: selectedItem.item_external_id,
          }}
          preSelectedCustomerName={customerName}
          onSubmit={handleAddProduct}
          onCustomerAdded={handleCustomerAdded}
        />
      )}
    </>
  );
};

const OrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const { language } = useLanguage();
  // Helper function to get translation
  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };
  const isRTL = language === 'he';

  const fetchOrders = async (showLoadingState = true, pageToken = null, filters = { status: statusFilter, search: searchTerm }) => {
    if (showLoadingState) {
      if (pageToken) {
        setIsLoading(true);
      } else {
        setIsFilterLoading(true);
        setOrders([]);
      }
    }
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', ITEMS_PER_PAGE.toString());
      
      if (pageToken) {
        queryParams.append('start_key', pageToken);
      }
      
      if (filters.status && filters.status !== 'all') {
        queryParams.append('status', filters.status);
      }

      if (filters.search !== undefined) {
        const trimmedSearch = filters.search.trim();
        if (trimmedSearch) {
          queryParams.append('search', trimmedSearch);
        }
      }

      const response = await apiService.request(`orders?${queryParams.toString()}`, { 
        method: 'GET' 
      });

      if (pageToken) {
        setOrders(prev => [...prev, ...response.orders]);
      } else {
        setOrders(response.orders || []);
      }
      
      setNextPageToken(response.next_page_token);
      setHasMore(!!response.next_page_token);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setOrders([]);
    return fetchOrders(true, null, newFilters);
  }, []);

  const debouncedFilterChange = useCallback(
    debounce((filters) => {
      handleFiltersChange(filters);
    }, DEBOUNCE_DELAY),
    [handleFiltersChange]
  );

  useEffect(() => {
    debouncedFilterChange({ status: statusFilter, search: searchTerm });
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [statusFilter, searchTerm, debouncedFilterChange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setNextPageToken(null);
    fetchOrders(false, null, { status: statusFilter, search: searchTerm });
  };

  const handleLoadMore = () => {
    if (nextPageToken && !isLoading) {
      fetchOrders(false, nextPageToken, { status: statusFilter, search: searchTerm });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch (err) {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '₪0';
    return new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Orders
            </h2>
            <p className="text-gray-600 mt-1">Track and manage your orders</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={isRefreshing || isFilterLoading}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={isFilterLoading}
          />
          <div className="absolute left-3 top-2.5">
            {isFilterLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isFilterLoading}
        >
          <option value="all">All Status</option>
          {Object.values(OrderStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!isFilterLoading && orders.length > 0 && (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <React.Fragment key={order.order_id || Math.random()}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer_name || 'Unknown Customer'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status || 'N/A'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(order.items && Array.isArray(order.items) ? order.items.length : 0) || '0'} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.order_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {order.notes || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.order_id ? null : order.order_id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedOrder === order.order_id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.order_id && (
                    <tr>
                      <td colSpan="8" className="px-6 py-4">
                        <OrderDetails 
                          items={order.items || []} 
                          customerName={order.customer_name}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {/* If no orders and not loading filters */}
        {!isFilterLoading && orders.length === 0 && !error && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No invoices are available. Please add an integration to start receiving orders.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  // Replace this with the navigation logic you use to switch to the integrations tab
                  // For example, if you have a context or prop function like onViewChange:
                  // onViewChange('integrations');
                  
                  // If you're using React Router:
                  // navigate('/integrations');
                  
                  // Adjust according to your app's routing or view change logic.
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Integration
              </button>
            </div>
          </div>
        )}

        {hasMore && !isFilterLoading && orders.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersView;
