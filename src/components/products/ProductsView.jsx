import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Scale, MessageSquare, Clock, ChevronRight, ChartLine } from 'lucide-react';
import apiService from '../../services/api';
import ProductDetailModal from './ProductDetailModal';

// Helper Functions
const sortProducts = (products, measurements) => {
  return [...products].sort((a, b) => {
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
  const isRTL = language === 'he';

  const statusInfo = getStatusInfo(latestMeasurement?.weight, product.thresholds);

  // Format timestamp
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

  // Get customer data
  const getCustomerInfo = () => {
    const customer = customers?.find(c => c.customer_id === product.customer_id);
    if (!customer) return null;

    const [hebrewName, englishName] = (customer.name || '').split(' - ');
    return {
      displayName: language === 'he' ? hebrewName : englishName,
      phone: customer.phone,
      fullData: customer
    };
  };

  const customerInfo = getCustomerInfo();

  // Get WhatsApp link with message
  const getWhatsAppLink = () => {
    if (!customerInfo?.phone) return null;

    const message = encodeURIComponent(
      `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${latestMeasurement?.weight}kg\n${t.pleaseResupply}`
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
        {/* New hover overlay with history button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 
          flex items-center justify-center opacity-0 group-hover:opacity-100">
          
        </div>

        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{product.name}</h3>
            {customerInfo && (
              <p className="text-gray-600">{customerInfo.displayName}</p>
            )}
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1 text-gray-400">
                <Scale size={14} />
                <span className="text-gray-500">
                  {scale?.scale_name || `Scale ${scale?.scale_id}` || 'Unknown Scale'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={14} />
                <span className="text-gray-500">
                  {formatDate(latestMeasurement?.timestamp)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className={`px-4 py-2 rounded-lg ${statusInfo.bgColor} transform transition-transform 
              group-hover:scale-105`}>
              <span className={`text-xl font-bold ${statusInfo.color}`}>
                {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : t.noData}
              </span>
            </div>

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

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t.upperThreshold}:</span>
            <span className="text-green-600 font-medium">{product.thresholds?.upper} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t.lowerThreshold}:</span>
            <span className="text-red-600 font-medium">{product.thresholds?.lower} kg</span>
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
                `${Math.min(100, (latestMeasurement.weight / product.thresholds?.upper) * 100)}%` : 
                '0%'
            }}
          />
        </div>
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

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch latest measurements for each scale
  const fetchLatestMeasurements = async (scaleIds) => {
    try {
      const measurementPromises = scaleIds.map(scaleId => 
        apiService.request(`measurements/scale/${scaleId}/latest`, {
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
      
      // Get unique scale IDs from products
      const scaleIds = [...new Set(productsResponse.map(p => p.scale_id))];
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

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Set up auto-refresh timer
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Only fetch measurements if we have products
      if (products.length > 0) {
        const scaleIds = [...new Set(products.map(p => p.scale_id))];
        fetchLatestMeasurements(scaleIds);
      }
    }, 20000); // 20 seconds

    // Cleanup timer on component unmount
    return () => clearInterval(refreshInterval);
  }, [products]); // Dependency on products to get updated scale IDs if products change

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false); // Don't show loading state for manual refresh
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
    </div>
  );
};

export default ProductsView;