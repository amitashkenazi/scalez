import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from '../../services/api';
import ProductModal from '../products/ProductModal';
import debounce from 'lodash/debounce';

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 500;

const InvoicesStatus = {
  OPEN: 'פתוחה',
  CLOSED: 'סגורה',
  IN_PROGRESS: 'בטיפול',
  CANCELLED: 'מבוטלת'
};

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status) {
      case InvoicesStatus.OPEN:
        return 'bg-blue-100 text-blue-800';
      case InvoicesStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800';
      case InvoicesStatus.CLOSED:
        return 'bg-green-100 text-green-800';
      case InvoicesStatus.CANCELLED:
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

const InvoiceDetails = ({ items, customerName }) => {
  console.log('[InvoiceDetails] Rendering with items:', items, 'customerName:', customerName);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const { language } = useLanguage();

  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      console.log('[InvoiceDetails] Fetching customers');
      try {
        const response = await apiService.getCustomers();
        console.log('[InvoiceDetails] Customers fetched:', response);
        setCustomers(response);
      } catch (error) {
        console.error('[InvoiceDetails] Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  const handleCreateProduct = (item) => {
    console.log('[InvoiceDetails] Creating product for item:', item);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleAddProduct = async (productData) => {
    console.log('[InvoiceDetails] Adding product:', productData);
    try {
      await apiService.createProduct(productData);
      setSuccessMessage(t('productAdded') || 'Product created successfully');
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('[InvoiceDetails] Error creating product:', error);
      throw error;
    }
  };

  const handleCustomerAdded = (newCustomer) => {
    console.log('[InvoiceDetails] Customer added:', newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
  };

  if (!Array.isArray(items)) {
    console.log('[InvoiceDetails] Invalid items array:', items);
    return null;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-400 rounded-lg p-3">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
      <h4 className="font-medium mb-2">Invoice Items:</h4>
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
              className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg flex items-center gap-1 transition-colors"
            >
              + Create Product
            </button>
          </div>
        ))}
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
    </div>
  );
};

const InvoicesView = () => {
  console.log('[InvoicesView] Component rendering');
  
  const [invoices, setInvoices] = useState([]);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageToken, setPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const debouncedFilterChangeRef = useRef(null);
  
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const t = (key) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return `Missing translation: ${key}`;
  };

  const fetchInvoices = useCallback(async (isLoadingMore = false, currentPageToken = null, filters = { status: statusFilter, search: searchTerm }) => {
    console.log('[InvoicesView] fetchInvoices called with:', {
      isLoadingMore,
      currentPageToken,
      filters,
      currentLoadingState: loadingRef.current
    });

    if (loadingRef.current) {
      console.log('[InvoicesView] Skipping fetch - already loading');
      return;
    }
    
    loadingRef.current = true;

    if (!isLoadingMore) {
      console.log('[InvoicesView] Starting new search');
      setIsFilterLoading(true);
    } else {
      console.log('[InvoicesView] Loading more results');
      setIsLoading(true);
    }

    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', ITEMS_PER_PAGE.toString());
      
      // Use the correct parameter name for DynamoDB pagination
      if (currentPageToken) {
        queryParams.append('start_key', currentPageToken);
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

      console.log('[InvoicesView] Fetching with params:', queryParams.toString());
      
      const response = await apiService.request(`invoices?${queryParams.toString()}`, { 
        method: 'GET' 
      });

      console.log('[InvoicesView] API response:', response);

      const newInvoices = response?.invoices || [];
      const pageSize = response?.page_size || 0;
      const newPageToken = response?.next_page_token;

      if (isLoadingMore && currentPageToken) {
        console.log('[InvoicesView] Appending new invoices');
        setInvoices(prev => [...prev, ...newInvoices]);
      } else {
        console.log('[InvoicesView] Setting new invoices');
        setInvoices(newInvoices);
      }
      
      setPageToken(newPageToken);
      // DynamoDB pagination: hasMore is determined by the presence of next_page_token
      setHasMore(!!newPageToken);
      
      console.log('[InvoicesView] Updated state:', {
        invoicesCount: newInvoices.length,
        pageSize,
        newPageToken,
        hasMore: !!newPageToken
      });

    } catch (err) {
      console.error('[InvoicesView] Error fetching invoices:', err);
      setError(err.message || 'Failed to fetch invoices');
      if (!currentPageToken) {
        setInvoices([]);
      }
      setHasMore(false);
    } finally {
      console.log('[InvoicesView] Fetch completed');
      setIsLoading(false);
      setIsFilterLoading(false);
      setIsRefreshing(false);
      loadingRef.current = false;
    }
}, [statusFilter, searchTerm]);

const lastInvoiceElementRef = useCallback(node => {
    console.log('[InvoicesView] Setting up intersection observer', {
      node,
      isLoading,
      isFilterLoading,
      hasMore,
      loadingRef: loadingRef.current,
      pageToken
    });

    if (isLoading || isFilterLoading) {
      console.log('[InvoicesView] Skipping observer setup - loading in progress');
      return;
    }

    if (observerRef.current) {
      console.log('[InvoicesView] Disconnecting previous observer');
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(entries => {
      const first = entries[0];
      console.log('[InvoicesView] Intersection observed:', {
        isIntersecting: first.isIntersecting,
        hasMore,
        loadingRef: loadingRef.current,
        pageToken
      });
      
      // Only load more if we have a pageToken (DynamoDB LastEvaluatedKey)
      if (first.isIntersecting && hasMore && !loadingRef.current && pageToken) {
        console.log('[InvoicesView] Loading more content');
        fetchInvoices(true, pageToken);
      }
    }, {
      rootMargin: '200px',
      threshold: 0.1
    });

    if (node) {
      console.log('[InvoicesView] Observing new node');
      observerRef.current.observe(node);
    }
}, [isLoading, isFilterLoading, hasMore, pageToken, fetchInvoices]);

  useEffect(() => {
    debouncedFilterChangeRef.current = debounce((filters) => {
      console.log('[InvoicesView] Debounced filter change:', filters);
      setInvoices([]);
      setPageToken(null);
      fetchInvoices(false, null, filters);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debouncedFilterChangeRef.current) {
        debouncedFilterChangeRef.current.cancel();
      }
    };
  }, [fetchInvoices]);

  useEffect(() => {
    console.log('[InvoicesView] Filter/search changed:', { statusFilter, searchTerm });
    if (debouncedFilterChangeRef.current) {
      debouncedFilterChangeRef.current({ status: statusFilter, search: searchTerm });
    }
  }, [statusFilter, searchTerm]);

  
  const handleRefresh = () => {
    console.log('[InvoicesView] Manual refresh triggered');
    setIsRefreshing(true);
    setPageToken(null);
    fetchInvoices(false, null, { status: statusFilter, search: searchTerm });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      console.log('[InvoicesView] Formatting date:', dateString);
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year}`;
    } catch (err) {
      console.error('[InvoicesView] Date formatting error:', err);
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

  if (isLoading && invoices.length === 0) {
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
              {t("invoicesTitle")}
            </h2>
            <p className="text-gray-600 mt-1">Track and manage your invoices</p>
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
            placeholder="Search invoices..."
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
          {Object.values(InvoicesStatus).map(status => (
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
        {!isFilterLoading && invoices.length > 0 && (
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
                  Invoice Date
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
              {invoices.map((invoice, index) => {
                console.log(`[InvoicesView] Rendering invoice ${index}:`, {
                  invoiceId: invoice.invoice_id,
                  isLastItem: index === invoices.length - 1,
                  shouldAttachRef: index === invoices.length - 1 && !isFilterLoading
                });
                
                return (
                  <React.Fragment key={invoice.invoice_id || Math.random()}>
                    <tr 
                      ref={index === invoices.length - 1 ? lastInvoiceElementRef : null}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.customer_name || 'Unknown Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={invoice.status || 'N/A'} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(invoice.items && Array.isArray(invoice.items) ? invoice.items.length : 0) || '0'} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.invoice_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {invoice.notes || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => {
                            console.log('[InvoicesView] Toggling invoice expansion:', {
                              invoiceId: invoice.invoice_id,
                              currentExpanded: expandedInvoice,
                              willExpand: expandedInvoice !== invoice.invoice_id
                            });
                            setExpandedInvoice(expandedInvoice === invoice.invoice_id ? null : invoice.invoice_id);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {expandedInvoice === invoice.invoice_id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedInvoice === invoice.invoice_id && (
                      <tr>
                        <td colSpan="7" className="px-6 py-4">
                          <InvoiceDetails 
                            items={invoice.items || []} 
                            customerName={invoice.customer_name}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}

        {!isFilterLoading && invoices.length === 0 && !error && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t("Noinvoicesfound")}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No invoices are available. Please add an integration to start receiving invoices.'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  console.log('[InvoicesView] Add integration clicked');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Integration
              </button>
            </div>
          </div>
        )}

        {hasMore && !isFilterLoading && invoices.length > 0 && isLoading && (
          <div className="px-6 py-8 border-t border-gray-200 flex justify-center">
            <div className="h-8 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesView;