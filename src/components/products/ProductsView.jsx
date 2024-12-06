// src/components/products/ProductsView.jsx
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

const DEBOUNCE_DELAY = 300; // shorter delay since it's client-side filtering

const ProductsView = () => {
  const [viewType, setViewType] = useState('table'); // 'cards' or 'table'
  const [allProducts, setAllProducts] = useState([]); // store all products
  const [products, setProducts] = useState([]); // displayed products
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

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
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

  const fetchData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
      setProducts([]);
      setAllProducts([]);
    }

    setError(null);

    try {
      console.log('Fetching products...');
      const response = await apiService.getProducts();
      console.log('Fetch products response:', response);

      const fetchedProducts = Array.isArray(response) ? response : [];
      setAllProducts(fetchedProducts);
      // initially, products = allProducts (no filter)
      setProducts(fetchedProducts);

      await fetchMeasurements(fetchedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(t.failedToFetchProducts || 'Failed to fetch products data');
    } finally {
      setIsLoading(false);
      setIsFilterLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  // Client-side filtering function
  const filterProducts = useCallback((term) => {
    if (!term.trim()) {
      // no search => show all
      setProducts(allProducts);
      return;
    }

    const lowerTerm = term.trim().toLowerCase();
    const filtered = allProducts.filter(product => {
      const productName = product.name?.toLowerCase() || '';
      const customerName = product.customer_name?.toLowerCase() || '';
      return productName.includes(lowerTerm) || customerName.includes(lowerTerm);
    });

    setProducts(filtered);
  }, [allProducts]);

  const debouncedFilterChange = useCallback(
    debounce((term) => {
      console.log('Debounced search:', term);
      setIsFilterLoading(true);
      filterProducts(term);
      setIsFilterLoading(false);
    }, DEBOUNCE_DELAY),
    [filterProducts]
  );

  useEffect(() => {
    debouncedFilterChange(searchTerm);
    return () => {
      debouncedFilterChange.cancel();
    };
  }, [searchTerm, debouncedFilterChange]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const [scalesResponse, customersResponse] = await Promise.all([
          apiService.getScales(),
          apiService.getCustomers()
        ]);
        setScales(scalesResponse);
        setCustomers(customersResponse);

        await fetchData(false);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError(err.message || 'Failed to load initial data');
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await apiService.createProduct(productData);
      setAllProducts(prev => [newProduct, ...prev]);
      filterProducts(searchTerm); // re-filter after adding new product
      setIsModalOpen(false);
      showSuccessMessage(t.productAdded || 'Product added successfully');
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err.message || 'Failed to add product');
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
                  Table View
                </>
              ) : (
                <>
                  <LayoutGrid className="h-5 w-5" />
                  Card View
                </>
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isRefreshing || isFilterLoading}
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

      {/* Search bar */}
      <div className="mb-6 relative">
        <input
          type="text"
          placeholder={t.searchCustomers || 'Search products or customers...'}
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

      {/* If no products and not loading */}
      {!isLoading && products.length === 0 && !error && !isFilterLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products found.</p>
          <p className="text-gray-500 text-sm">Try adjusting your search or add a new product.</p>
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
              />
              {products.map(product => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  scale={scales.find(s => s.scale_id === product.scale_id)}
                  customers={customers}
                  latestMeasurement={measurements[product.scale_id]}
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
            />
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
      />
    </div>
  );
};

export default ProductsView;
