import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Scale, MessageSquare, Clock, Receipt } from 'lucide-react';
import apiService from '../../services/api';
import ProductDetailModal from './ProductDetailModal';
import NewProductCard from './NewProductCard';
import ProductModal from '../ProductModal';

// Helper Functions
const sortProducts = (products, measurements) => {
  return [...products].sort((a, b) => {
    // If a product doesn't have a scale, it should appear at the end
    if (!a.scale_id && !b.scale_id) return 0;
    if (!a.scale_id) return 1;
    if (!b.scale_id) return -1;

    const aWeight = measurements[a.scale_id]?.weight;
    const bWeight = measurements[b.scale_id]?.weight;
    
    const aStatus = getStatusInfo(aWeight, a.thresholds);
    const bStatus = getStatusInfo(bWeight, b.thresholds);

    // Sort by status priority: red (critical) -> orange (warning) -> green (good)
    const statusPriority = { critical: 0, warning: 1, good: 2, unknown: 3 };
    
    if (statusPriority[aStatus.status] !== statusPriority[bStatus.status]) {
      return statusPriority[aStatus.status] - statusPriority[bStatus.status];
    }

    // Within the same status, sort by distance from threshold
    return bStatus.distance - aStatus.distance;
  });
};

const getStatusInfo = (weight, thresholds) => {
  if (!weight || !thresholds) return { 
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    status: 'unknown',
    distance: 0 
  };

  const value = parseFloat(weight);
  const upper = parseFloat(thresholds.upper);
  const lower = parseFloat(thresholds.lower);

  if (value >= upper) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      status: 'good',
      distance: value - upper
    };
  } else if (value >= lower) {
    return {
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      status: 'warning',
      distance: value - lower
    };
  }
  return {
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    status: 'critical',
    distance: lower - value
  };
};

const ProductCard = ({ product, scale, customers, latestMeasurement }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const [lastOrder, setLastOrder] = useState(null);

  const isRTL = language === 'he';
  console.log('product', product);

  useEffect(() => {
    const fetchLastOrder = async () => {
      console.log('Fetching last order for product:', product);
      if (product.customer_id && product.item_id) {
        try {
          const response = await apiService.request(
            `orders/customer/${product.customer_id}/last-order/${product.item_id}`,
            { method: 'GET' }
          );
          console.log('Last order:', response);
          setLastOrder(response);
        } catch (error) {
          console.error('Error fetching last order:', error);
        }
      }
    };
    
    fetchLastOrder();
  }, [product.customer_id, product.item_id]);
  
  console.log('lastOrder', lastOrder);

  // Add safety checks for product
  if (!product) {
    return null;
  }
  

  const statusInfo = product.scale_id ? 
    getStatusInfo(latestMeasurement?.weight, product.thresholds) :
    { color: 'text-gray-400', bgColor: 'bg-gray-50', status: 'unknown', distance: 0 };

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

  const getCustomerInfo = () => {
    if (!customers || !product.customer_id) return null;
    
    const customer = customers.find(c => c.customer_id === product.customer_id);
    if (!customer) return null;

    const [hebrewName, englishName] = (customer.name || '').split(' - ');
    return {
      displayName: language === 'he' ? hebrewName : englishName,
      phone: customer.phone,
      fullData: customer
    };
  };

  const customerInfo = getCustomerInfo();

  const getWhatsAppLink = () => {
    if (!customerInfo?.phone) return null;

    const message = encodeURIComponent(
      `${t.runningLowMessage} ${product.name || ''}\n${t.productLeft}: ${latestMeasurement?.weight || 0}kg\n${t.pleaseResupply}`
    );
    
    const cleanPhone = customerInfo.phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone :
                          cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : 
                          `972${cleanPhone}`;
    
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 
          cursor-pointer group ${statusInfo.bgColor} relative overflow-hidden`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{product.name || 'Unnamed Product'}</h3>
            {customerInfo && (
              <p className="text-gray-600">{customerInfo.displayName}</p>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1 text-gray-400">
                <Scale size={14} />
                <span className="text-gray-500">
                  {scale ? (scale.scale_name || `Scale ${scale.scale_id}`) : t.noScaleAssigned}
                </span>
              </div>
              {product.scale_id && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock size={14} />
                  <span className="text-gray-500">
                    {formatDate(latestMeasurement?.timestamp)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {product.scale_id && (
              <div className={`px-4 py-2 rounded-lg ${statusInfo.bgColor} transform transition-transform 
                group-hover:scale-105`}>
                <span className={`text-xl font-bold ${statusInfo.color}`}>
                  {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : t.noData}
                </span>
              </div>
            )}

            {getWhatsAppLink() && (
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white 
                  rounded-lg hover:bg-green-600 transition-colors gap-2 text-base font-medium 
                  transform hover:scale-105"
                onClick={(e) => e.stopPropagation()}
              >
                <MessageSquare size={20} />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>

        {product.scale_id && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t.upperThreshold}:</span>
                <span className="text-green-600 font-medium">{product.thresholds?.upper || 0} kg</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t.lowerThreshold}:</span>
                <span className="text-red-600 font-medium">{product.thresholds?.lower || 0} kg</span>
              </div>
            </div>

            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  statusInfo.status === 'good' ? 'bg-green-600' :
                  statusInfo.status === 'warning' ? 'bg-orange-500' :
                  statusInfo.status === 'critical' ? 'bg-red-600' : 'bg-gray-400'
                } transition-all duration-300`}
                style={{
                  width: latestMeasurement?.weight ? 
                    `${Math.min(100, (latestMeasurement.weight / (product.thresholds?.upper || 100)) * 100)}%` : 
                    '0%'
                }}
              />
            </div>
          </>
        )}
        {lastOrder && (
        <div className="mt-2 border-t border-gray-100">
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {t.lastOrder}
                </span>
              </div>
              <span className="text text-gray-500">
                {new Date(lastOrder.order_date).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-md p-3 shadow-sm">
                <span className="text-xs text-gray-500 block mb-1">{t.quantity}</span>
                <span className="text-lg font-semibold">
                  {lastOrder.quantity || 0}
                  <span className="text-xs text-gray-500 ml-1">{t.units}</span>
                </span>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm">
                <span className="text-xs text-gray-500 block mb-1">{t.price}</span>
                <span className="text-lg font-semibold">
                  ₪{lastOrder.price || 0}
                  <span className="text-xs text-gray-500 ml-1">/ {t.unit}</span>
                </span>
              </div>
              <div className="bg-white rounded-md p-3 shadow-sm">
                <span className="text-xs text-gray-500 block mb-1">{t.total}</span>
                <span className="text-lg font-semibold">
                  ₪{lastOrder.total || 0}
                  <span className="text-xs text-gray-500 ml-1">{t.ils}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        scale={scale}
        latestMeasurement={latestMeasurement}
        customer={customerInfo?.fullData}
      />
    </>
  );
};


// Main ProductsView Component
const ProductsView = () => {
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
      console.log('Fetching latest measurements for scales:', scaleIds);
      const measurementPromises = scaleIds
        .filter(scaleId => scaleId !== null)
        .map(scaleId => 
          apiService.request(`measures/scale/${scaleId}/latest`, {
            method: 'GET'
          })
        );
      console.log('Measurement promises:', measurementPromises);
      
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
    // Clear the message after 3 seconds
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const fetchData = async (showLoadingState = true) => {
    try {
      console.log('Fetching products, scales, and customers...');
      if (showLoadingState) {
        setIsLoading(true);
      }
      console.log('Fetching products...');
      
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
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Only fetch measurements if we have products with scales
      if (products.some(p => p.scale_id)) {
        const scaleIds = [...new Set(products
          .filter(p => p.scale_id)
          .map(p => p.scale_id))];
        fetchLatestMeasurements(scaleIds);
      }
    }, 20000); // 20 seconds

    return () => clearInterval(refreshInterval);
  }, [products]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      

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
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-400 rounded-lg p-4">
          <p className="text-green-700">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ProductsView;