import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, List, MapPin } from 'lucide-react';
import apiService from '../../services/api';
import { useMap } from '../../contexts/MapContext';
import Map from './Map';
import CustomerCard from './components/CustomerCard';
import { geocodeAddress } from './utils';
import ApiStats from '../ApiStats';
import PersistentMapContainer from './PersistentMapContainer';
import { useAccount } from '../../contexts/AccountContext';

const CustomersMapView = () => {
  // State
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [selectedMarker, setSelectedMarker] = useState(null);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch measurements for each scale
  const fetchLatestMeasurements = async (scaleIds) => {
    try {
      const measurementPromises = scaleIds
        .filter(id => id)
        .map(scaleId => 
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
      
      const [productsResponse, customersResponse, ordersResponse] = await Promise.all([
        apiService.getProducts(),
        apiService.getCustomers(),
        apiService.request('orders', { method: 'GET' })
      ]);

      // Enrich customers with coordinates and products
      const enrichedCustomers = await Promise.all(
        customersResponse.map(async (customer) => {
          const coords = await geocodeAddress(customer.address);
          const customerProducts = productsResponse
            .filter(p => p.customer_id === customer.customer_id)
            .map(product => ({
              ...product,
              measurement: null
            }));

          return {
            ...customer,
            lat: coords.lat,
            lng: coords.lng,
            products: customerProducts
          };
        })
      );

      setCustomers(enrichedCustomers);
      setOrders(ordersResponse);

      // Get scale IDs and fetch measurements
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

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh measurements
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (customers.length > 0) {
        const scaleIds = [...new Set(customers.flatMap(c => 
          c.products.filter(p => p.scale_id).map(p => p.scale_id)
        ))];
        fetchLatestMeasurements(scaleIds);
      }
    }, 20000); // 20 seconds

    return () => clearInterval(refreshInterval);
  }, [customers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleCustomerClick = useCallback((customer) => {
    setSelectedMarker(customer);
  }, []);

  const handleNavigate = (customer) => {
    const { lat, lng } = customer;
    // Open in default maps app
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
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
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Customers Map
            </h1>
            <p className="text-sm text-gray-600">View customer locations</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Last updated: {getLastRefreshTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>
  
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-97px)]">
        {/* Customer List */}
        <div className="w-full lg:w-96 bg-white border-r border-gray-200">
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-4 w-4 mr-2" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium flex items-center gap-2">
              <List className="h-4 w-4" />
              Customers ({customers.length})
            </h2>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-185px)]">
            <div className="space-y-px">
              {customers.map(customer => (
                <CustomerCard
                  key={customer.customer_id}
                  customer={customer}
                  onLocationClick={handleCustomerClick}
                  orders={orders}
                />
              ))}
            </div>
          </div>
        </div>
  
        {/* Map */}
        <div className="flex-1 bg-white">
          <PersistentMapContainer className="h-full">
            <Map
              customers={customers}
              selectedMarker={selectedMarker}
              setSelectedMarker={setSelectedMarker}
              measurements={measurements}
            />
          </PersistentMapContainer>
        </div>
      </div>
  
      <ApiStats />
    </div>
  );

};

export default CustomersMapView;