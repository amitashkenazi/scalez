import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, Scale, MessageSquare } from 'lucide-react';
import apiService from '../../services/api';
import ProductDetailModal from './ProductDetailModal';


const ProductCard = ({ product, scale, customers, latestMeasurement }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Get customer data
  const getCustomerData = () => {

    const customer = customers?.find(c => c.customer_id === product.customer_id);
    console.log('customers:', customers);
    console.log('customer:', customer);
    console.log('product:', product);
    if (!customer) return { name: null, phone: null };
    
    const [hebrewName, englishName] = (customer.name || '').split(' - ');
    return {
      name: language === 'he' ? hebrewName : englishName,
      phone: customer.phone,
      fullData: customer
    };
  };

  // Get WhatsApp link with message
  const getWhatsAppLink = () => {
    console.log('getWhatsAppLink');
    const { phone } = getCustomerData();
    if (!phone) return null;

    const message = encodeURIComponent(
      `${t.runningLowMessage} ${product.name}\n${t.productLeft}: ${latestMeasurement?.weight}kg\n${t.pleaseResupply}`
    );
    
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('972') ? cleanPhone :
                          cleanPhone.startsWith('0') ? `972${cleanPhone.slice(1)}` : 
                          `972${cleanPhone}`;
    console.log('formattedPhone:', formattedPhone, 'message:', message);  
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  const statusColor = getStatusColor(latestMeasurement?.weight);
  const whatsappLink = getWhatsAppLink();
  console.log('whatsappLink:', whatsappLink);

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold">{product.name}</h3>
            <div className="flex items-center gap-1 text-gray-400">
              <Scale size={14} />
              <span className="text-sm text-gray-500">
                {scale?.scale_id || product.id}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className={`px-4 py-2 rounded-lg ${getWeightBgColor(latestMeasurement?.weight)}`}>
              <span className={`text-xl font-bold ${getWeightTextColor(latestMeasurement?.weight)}`}>
                {latestMeasurement?.weight ? `${latestMeasurement.weight} kg` : 'No data'}
              </span>
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors gap-2 text-base font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <MessageSquare size={20} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Upper Threshold:</span>
            <span className="text-green-600 font-medium">{product.thresholds?.upper} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Lower Threshold:</span>
            <span className="text-red-600 font-medium">{product.thresholds?.lower} kg</span>
          </div>
        </div>

        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor(latestMeasurement?.weight, product.thresholds)}`}
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
        customer={getCustomerData().fullData}
      />
    </>
  );
};

// Helper functions
const getWeightTextColor = (weight) => {
  if (!weight) return 'text-gray-400';
  return 'text-green-600';
};

const getWeightBgColor = (weight) => {
  if (!weight) return 'bg-gray-50';
  return 'bg-green-50';
};

const getProgressBarColor = (weight, thresholds) => {
  if (!weight || !thresholds) return 'bg-gray-400';
  
  const value = parseFloat(weight);
  const upper = parseFloat(thresholds.upper);
  const lower = parseFloat(thresholds.lower);

  if (value >= upper) return 'bg-green-600';
  if (value >= lower) return 'bg-orange-500';
  return 'bg-red-600';
};

const getStatusColor = (weight) => {
  if (!weight) return 'text-gray-400';
  return 'text-green-600';
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