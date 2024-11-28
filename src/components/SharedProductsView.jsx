import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { translations } from '../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Scale, MessageSquare, Clock } from 'lucide-react';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ProductDetailModal from './products/ProductDetailModal';

// Separate ProductCard component to handle individual modal state
const ProductCard = ({ product, measurement, customers, language, t }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isRTL = language === 'he';
  const statusInfo = getStatusInfo(measurement?.weight, product.thresholds);

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.customer_id === customerId);
    if (!customer) return '';

    const [hebrewName, englishName] = customer.name.split(' - ');
    return language === 'he' ? hebrewName : englishName;
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

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow 
          cursor-pointer ${statusInfo.bgColor}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold">{product.name}</h3>
            <p className="text-gray-600">{getCustomerName(product.customer_id)}</p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-1 text-gray-400">
                <Clock size={14} />
                <span className="text-gray-500">
                  {formatDate(measurement?.timestamp)}
                </span>
              </div>
            </div>
          </div>

          <div className={`px-4 py-2 rounded-lg ${statusInfo.bgColor}`}>
            <span className={`text-xl font-bold ${statusInfo.color}`}>
              {measurement?.weight ? `${measurement.weight} kg` : t.noData}
            </span>
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
            }`}
            style={{
              width: measurement?.weight ? 
                `${Math.min(100, (measurement.weight / product.thresholds?.upper) * 100)}%` : 
                '0%'
            }}
          />
        </div>
      </div>

      {isModalOpen && (
        <ProductDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={product}
          scale_id={product.scale_id} // Pass scale_id directly from product
          latestMeasurement={measurement}
          customer={customers.find(c => c.customer_id === product.customer_id)}
        />
      )}
    </>
  );
};

// Helper function to get status info
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

// Main SharedProductsView component
const SharedProductsView = () => {
  const [sharedProducts, setSharedProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());

  const { language } = useLanguage();
  const { user } = useAuth();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch shared products for the current user
  const fetchSharedProducts = async () => {
    try {
      setError(null);
      
      // First, get customers where the user is listed
      const sharedCustomers = await apiService.request('customers/users/me', {
        method: 'GET'
      });
      
      // Get products for those customers
      const productsPromises = sharedCustomers.map(customer =>
        apiService.getProductsByCustomer(customer.customer_id)
      );
      
      const productsResults = await Promise.all(productsPromises);
      const allSharedProducts = productsResults.flat();

      setSharedProducts(allSharedProducts);
      setCustomers(sharedCustomers);

      // Fetch latest measurements for each scale
      const scaleIds = [...new Set(allSharedProducts.map(p => p.scale_id).filter(id => id !== null))];
      await fetchLatestMeasurements(scaleIds);

    } catch (err) {
      console.error('Error fetching shared products:', err);
      setError(t.failedToFetchProducts);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch latest measurements for scales
  const fetchLatestMeasurements = async (scaleIds) => {
    console.log('Fetching latest measurements for scales:', scaleIds);
    try {
      const measurementPromises = scaleIds.map(scaleId => 
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

  useEffect(() => {
    fetchSharedProducts();
  }, [user]);

  // Auto-refresh measurements
  useEffect(() => {
    if (sharedProducts.length === 0) return;
    
    const refreshInterval = setInterval(() => {
      const scaleIds = [...new Set(sharedProducts
        .filter(p => p.scale_id)
        .map(p => p.scale_id))];
      // const scaleIds = [...new Set(sharedProducts.map(p => p.scale_id).filter(id => id !== null))];
      fetchLatestMeasurements(scaleIds);
    }, 20000); // 20 seconds

    return () => clearInterval(refreshInterval);
  }, [sharedProducts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSharedProducts();
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
              Shared Products
            </h2>
            <p className="text-gray-600 mt-1">Products shared with you</p>
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
        {sharedProducts.map(product => (
          <ProductCard
            key={product.product_id}
            product={product}
            measurement={measurements[product.scale_id]}
            customers={customers}
            language={language}
            t={t}
          />
        ))}
      </div>

      {sharedProducts.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No products have been shared with you yet</p>
        </div>
      )}
    </div>
  );
};

export default SharedProductsView;