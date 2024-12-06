import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { 
  Package, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  TableIcon,
  LayoutGrid,
  Plus 
} from 'lucide-react';
import apiService from '../../services/api';
import ProductDetailModal from './ProductDetailModal';
import NewProductCard from './NewProductCard';
import ProductModal from '../ProductModal';
import ProductCard from './ProductCard';
import ProductsTableView from './ProductsTableView';
import { sortProducts } from '../../utils/statusUtils';

const ProductsView = () => {
  const [viewType, setViewType] = useState('table'); // 'cards' or 'table'
  const [products, setProducts] = useState([]);
  const [scales, setScales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch latest measurements for each scale
  const fetchLatestMeasurements = async (scaleIds) => {
    try {
      const measurementPromises = scaleIds
        .filter(scaleId => scaleId !== null)
        .map(scaleId => 
          apiService.request(`measures/scale/${scaleId}/latest`, {
            method: 'GET'
          })
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

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchData = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setIsLoading(true);
      }
      
      const [productsResponse, scalesResponse, customersResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getScales(),
        apiService.getCustomers()
      ]);

      setProducts(productsResponse);
      setScales(scalesResponse);
      setCustomers(customersResponse);
      
      // Get unique scale IDs from products that have scales
      const scaleIds = [...new Set(productsResponse
        .filter(p => p.scale_id)
        .map(p => p.scale_id))];
      await fetchLatestMeasurements(scaleIds);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(t.failedToFetchProducts);
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const newProduct = await apiService.createProduct(productData);
      setProducts(prev => [...prev, newProduct]);
      setIsModalOpen(false);
      showSuccessMessage(t.productAdded || 'Product added successfully');
    } catch (err) {
      setError(err.message || 'Failed to add product');
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Set up auto-refresh timer
  // useEffect(() => {
  //   const refreshInterval = setInterval(() => {
  //     if (products.some(p => p.scale_id)) {
  //       const scaleIds = [...new Set(products
  //         .filter(p => p.scale_id)
  //         .map(p => p.scale_id))];
  //       fetchLatestMeasurements(scaleIds);
  //     }
  //   }, 20000); // 20 seconds

  //   return () => clearInterval(refreshInterval);
  // }, [products]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleMessageClick = (product) => {
    const customer = customers.find(c => c.customer_id === product.customer_id);
    if (!customer?.phone) return;
    
    const message = encodeURIComponent(
      `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${measurements[product.scale_id]?.weight || 0}kg\n${t.pleaseResupply}`
    );
    const phone = customer.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const getLastRefreshTimeString = () => {
    return lastRefreshTime.toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isLoading) {
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
              {t.lastUpdated}: {getLastRefreshTimeString()}
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

      {!error && (
        viewType === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NewProductCard 
              onClick={() => {
                setSelectedProduct(null);
                setIsModalOpen(true);
              }} 
            />
            {sortProducts(products, measurements).map(product => (
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
          <>
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
            <ProductsTableView
              products={sortProducts(products, measurements)}
              scales={scales}
              customers={customers}
              measurements={measurements}
              onProductClick={(product) => {
                setSelectedProduct(product);
                setIsModalOpen(true);
              }}
              onMessageClick={handleMessageClick}
            />
          </>
        )
      )}

      {products.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{t.noProducts}</p>
        </div>
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