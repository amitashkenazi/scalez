import React, { useState, useEffect, useCallback } from 'react';
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
  Search
} from 'lucide-react';
import apiService from '../../services/api';
import ProductModal from '../ProductModal';
import NewProductCard from './NewProductCard';
import ProductCard from './ProductCard';
import ProductsTableView from './ProductsTableView';
import debounce from 'lodash/debounce';

const DEBOUNCE_DELAY = 300;
const PAGE_SIZE = 20;

const ProductsView = () => {
  const [viewType, setViewType] = useState('table');
  const [products, setProducts] = useState([]);
  const [scales, setScales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterLoading, setIsFilterLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchProducts = async (cursor) => {
    const params = new URLSearchParams();
    params.append('limit', PAGE_SIZE);
    if (cursor) {
      params.append('cursor', cursor);
    }
    const response = await apiService.request(`products?${params.toString()}`, { method: 'GET' });
    return response;
  };
  

  const fetchInitialData = async () => {
    try {
      const [scalesResponse, customersResponse] = await Promise.all([
        apiService.getScales(),
        apiService.getCustomers()
      ]);
      setScales(scalesResponse);
      setCustomers(customersResponse);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load initial data');
    }
  };

  const fetchMeasurements = async (allProds) => {
    const scaleIds = [...new Set(allProds.filter(p => p.scale_id).map(p => p.scale_id))];
    if (scaleIds.length === 0) {
      setLastRefreshTime(new Date());
      return;
    }

    try {
      const measurementPromises = scaleIds.map(scaleId =>
        apiService.request(`measures/scale/${scaleId}/latest`, { method: 'GET' })
      );

      const measurementResults = await Promise.allSettled(measurementPromises);
      const newMeasurements = {};
      measurementResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          newMeasurements[scaleIds[index]] = result.value;
        }
      });
      setMeasurements(newMeasurements);
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error('Error fetching measurements:', err);
    }
  };

  const fetchData = async (showLoading = true, cursor = null) => {
    if (showLoading && isInitialLoad) {
      setIsLoading(true);
    }

    try {
      const [productsResponse, ...otherData] = await Promise.all([
        fetchProducts(cursor),
        isInitialLoad ? fetchInitialData() : Promise.resolve()
      ]);

      if (cursor) {
        setProducts(prev => [...prev, ...productsResponse.items]);
      } else {
        setProducts(productsResponse.items);
      }
      
      setNextCursor(productsResponse.next_cursor);
      setHasMore(!!productsResponse.next_cursor);
      
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      await fetchMeasurements(productsResponse.items);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t.failedToFetchProducts);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setIsInitialLoad(true);
    fetchData(false);
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    await fetchData(false, nextCursor);
  };

  const filterProducts = useCallback((term) => {
    if (!term.trim()) {
      fetchData();
      return;
    }

    const lowerTerm = term.trim().toLowerCase();
    setProducts(prev => 
      prev.filter(product => {
        const productName = product.name?.toLowerCase() || '';
        const customerName = product.customer_name?.toLowerCase() || '';
        return productName.includes(lowerTerm) || customerName.includes(lowerTerm);
      })
    );
  }, []);

  const debouncedFilterChange = useCallback(
    debounce((term) => {
      setIsFilterLoading(true);
      filterProducts(term);
      setIsFilterLoading(false);
    }, DEBOUNCE_DELAY),
    [filterProducts]
  );

  const handleScroll = useCallback(() => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100) {
      if (!isLoadingMore && hasMore && !searchTerm) {
        loadMore();
      }
    }
  }, [isLoadingMore, hasMore, searchTerm]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!searchTerm) {
      fetchData();
    } else {
      debouncedFilterChange(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await apiService.createProduct(productData);
      setProducts(prev => [newProduct, ...prev]);
      setIsModalOpen(false);
      showSuccessMessage(t.productAdded);
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

  if (isLoading && products.length === 0 && !error && !isFilterLoading) {
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
              {t.productsDashboard}
            </h2>
            <p className="text-gray-600 mt-1">{t.productStatus}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {t.lastUpdated}: {formatTime(lastRefreshTime)}
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
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t.searchProducts}
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

      <div className="mb-6">
        <button
          onClick={() => {
            setSelectedProduct(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          {t.addProduct}
        </button>
      </div>

      {!isLoading && products.length === 0 && !error && !isFilterLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t.noProductsFound}</p>
          <p className="text-gray-500 text-sm">{t.tryAdjustingSearch}</p>
        </div>
      )}

      {!error && products.length > 0 && (
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
              {products.map(product => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  scale={scales.find(s => s.scale_id === product.scale_id)}
                  customers={customers}
                  latestMeasurement={measurements[product.scale_id]}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <ProductsTableView
              products={products}
              scales={scales}
              customers={customers}
              measurements={measurements}
              onProductClick={(product) => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
              onMessageClick={(product) => {
                const customer = customers.find(c => c.customer_id === product.customer_id);
                if (!customer?.phone) return;
                const message = encodeURIComponent(
                  `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${measurements[product.scale_id]?.weight || 0}kg\n${t.pleaseResupply}`
                );
                const phone = customer.phone.replace(/\D/g, '');
                window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
              }}
              t={t}
            />
          )}

          {isLoadingMore && (
            <div className="flex justify-center mt-6">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {!isLoadingMore && hasMore && !searchTerm && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </>
      )}

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