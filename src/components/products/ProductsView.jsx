import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { AlertCircle, Loader2, RefreshCw, Scale, Package, MessageSquare } from 'lucide-react';
import apiService from '../../services/api';

const ProductCard = ({ product, scale, customers, latestMeasurement }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Get customer data
  const getCustomerData = () => {
    const customer = customers?.find(c => c.customer_id === product.customer_id);
    if (!customer) return { name: null, phone: null };
    
    const [hebrewName, englishName] = (customer.name || '').split(' - ');
    return {
      name: language === 'he' ? hebrewName : englishName,
      phone: customer.phone
    };
  };

  // Generate WhatsApp message
  const getWhatsAppLink = () => {
    const { phone } = getCustomerData();
    if (!phone) return null;

    const message = encodeURIComponent(
      `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${latestMeasurement?.weight}kg\n${t.pleaseResupply}`
    );
    
    // Remove any non-numeric characters from phone and ensure it starts with a country code
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone :
                          cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : 
                          `972${cleanPhone}`;
    
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get status color based on thresholds
  const getStatusColor = (weight) => {
    if (!weight || !product.thresholds) {
        console.log('No weight or thresholds provided');
        return 'text-gray-400';
    }
    
    const upper = parseFloat(product.thresholds.upper);
    const lower = parseFloat(product.thresholds.lower);
    const weightFloat = parseFloat(weight);
    
    if (weightFloat >= upper) {
        console.log(`Weight ${weightFloat} is above or equal to upper threshold ${upper}`);
        return 'text-green-600';
    }
    if (weightFloat >= lower && weightFloat < upper) {
        console.log(`Weight ${weightFloat} is between lower threshold ${lower} and upper threshold ${upper}`);
        return 'text-orange-500';
    }
    console.log(`Weight ${weightFloat} is below lower threshold ${lower}`);
    return 'text-red-600';
};

  const getBgColor = (statusColor) => {
    const colorMap = {
      'text-green-600': 'bg-green-50',
      'text-orange-500': 'bg-orange-50',
      'text-red-600': 'bg-red-50',
      'text-gray-400': 'bg-gray-50'
    };
    return colorMap[statusColor];
  };

  const statusColor = getStatusColor(latestMeasurement?.weight);
  const { name: customerName } = getCustomerData();
  const whatsappLink = getWhatsAppLink();

  // Get status text
  const getStatusText = (weight) => {
    if (!weight || !product.thresholds) return 'No data';
    return `${weight} kg`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${getBgColor(statusColor)}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{product.name}</h3>
          {customerName && (
            <p className="text-gray-600">{customerName}</p>
          )}
          <div className="flex items-center gap-1 text-gray-400">
            <Scale size={14} />
            <span className="text-xs">{scale?.scale_id || product.scale_id}</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className={`px-4 py-2 rounded-lg ${getBgColor(statusColor)}`}>
            <span className={`text-lg font-bold ${statusColor}`}>
              {latestMeasurement?.weight ? 
                getStatusText(latestMeasurement.weight) : 
                'No data'
              }
            </span>
          </div>
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              title="Send WhatsApp message"
            >
              <MessageSquare size={20} />
            </a>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{t.upperThreshold}:</span>
          <span className="font-medium text-green-600">{product.thresholds?.upper} kg</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{t.lowerThreshold}:</span>
          <span className="font-medium text-red-600">{product.thresholds?.lower} kg</span>
        </div>
      </div>

      {/* Status indicator bar */}
      <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${
            statusColor === 'text-green-600' ? 'bg-green-600' :
            statusColor === 'text-orange-500' ? 'bg-orange-500' :
            statusColor === 'text-red-600' ? 'bg-red-600' : 'bg-gray-400'
          }`}
          style={{
            width: latestMeasurement?.weight ? 
              `${Math.min(100, (latestMeasurement.weight / product.thresholds?.upper) * 100)}%` : 
              '0%'
          }}
        />
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="text-sm text-gray-600">
          {t.lastUpdated}: {formatDate(latestMeasurement?.timestamp)}
        </div>
      </div>
    </div>
  );
};


const ProductsView = () => {
  const [products, setProducts] = useState([]);
  const [scales, setScales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    } catch (err) {
      console.error('Error fetching measurements:', err);
    }
  };

  const fetchData = async () => {
    try {
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
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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