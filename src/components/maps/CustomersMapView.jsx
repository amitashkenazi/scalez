import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { useLoadScript } from '@react-google-maps/api';
import { Package, AlertCircle, Loader2, RefreshCw, List } from 'lucide-react';
import apiService from '../../services/api';
import MapDisplay from './Map';
import RouteSteps from './RouteSteps';
import CustomerCard from './components/CustomerCard';
import { geocodeAddress } from './utils';
import { DirectionsOptimizer } from '../../utils/DirectionsOptimizer';
import ApiStats from '../ApiStats';
import { useSubscription } from '../../contexts/SubscriptionContext';
import UpgradePrompt from '../UpgradePrompt';
import { mapsService } from '../../services/mapsService';

const CustomersMapView = () => {
  // States
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [showList, setShowList] = useState(false);
  const [startLocation, setStartLocation] = useState({
    lat: 32.0853,
    lng: 34.7818
  });
  const [startAddress, setStartAddress] = useState('Tel Aviv, Israel');
  const [endLocation, setEndLocation] = useState(null);
  const [endAddress, setEndAddress] = useState('');

  // Hooks
  const { language } = useLanguage();
  const { isFeatureEnabled } = useSubscription();
  const t = translations[language];
  const isRTL = language === 'he';

  // Load Google Maps
  const { isLoaded: isMapsLoaded, loadError: mapsLoadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  // Initialize DirectionsOptimizer
  const [directionsOptimizer] = useState(() => new DirectionsOptimizer({
    batchSize: 5,
    batchInterval: 1000,
    debounceDelay: 2500
  }));

  // Single fetch data function
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Batch initial requests
      const [customersResponse, productsResponse, ordersResponse] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts(),
        apiService.request('orders', { method: 'GET' })
      ]);

      // Get scale IDs for measurements
      const scaleIds = [...new Set(productsResponse
        .filter(p => p.scale_id)
        .map(p => p.scale_id))];
      
      // Fetch measurements for each scale
      const measurementsMap = {};
      if (scaleIds.length > 0) {
        const measurementPromises = scaleIds.map(scaleId =>
          apiService.request(`measurements/scale/${scaleId}/latest`, {
            method: 'GET'
          }).catch(() => null)
        );

        const measurementResults = await Promise.allSettled(measurementPromises);
        measurementResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            measurementsMap[scaleIds[index]] = result.value;
          }
        });
      }

      // Cache geocoding results
      const geocodeCache = new Map();
      const enrichedCustomers = await Promise.all(
        customersResponse.map(async (customer) => {
          try {
            let coords = geocodeCache.get(customer.address);
            if (!coords) {
              coords = await geocodeAddress(customer.address);
              geocodeCache.set(customer.address, coords);
            }

            return {
              ...customer,
              lat: coords.lat,
              lng: coords.lng,
              products: productsResponse
                .filter(p => p.customer_id === customer.customer_id)
                .map(product => ({
                  ...product,
                  measurement: product.scale_id ? measurementsMap[product.scale_id] : null
                }))
            };
          } catch (err) {
            console.error(`Error processing customer ${customer.customer_id}:`, err);
            return null;
          }
        })
      );

      // Update state with valid customers only
      const validCustomers = enrichedCustomers.filter(c => c !== null);
      setCustomers(validCustomers);
      setOrders(ordersResponse);
      setMeasurements(measurementsMap);

      // Update map bounds if needed
      if (mapInstance && validCustomers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        validCustomers.forEach(customer => {
          if (customer.lat && customer.lng) {
            bounds.extend({ lat: customer.lat, lng: customer.lng });
          }
        });
        if (startLocation) {
          bounds.extend(startLocation);
        }
        mapInstance.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [mapInstance, startLocation]);

  // Initial load only
  useEffect(() => {
    fetchData();
    // Cleanup on unmount
    return () => {
      directionsOptimizer.cancelAll();
    };
  }, []);

  // Route calculation
  const calculateRoute = async () => {
    if (!selectedCustomers.length || !startLocation) return;
    
    setIsCalculatingRoute(true);
    setError(null);
  
    try {
      const result = await mapsService.getDirections(
        startLocation,
        endLocation || startLocation,
        selectedCustomers.map(customer => ({
          lat: customer.lat,
          lng: customer.lng
        }))
      );
      
      setDirectionsResponse(result);
      
      if (mapInstance) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(startLocation);
        result.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        mapInstance.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setError('Failed to calculate route. Please try again.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  const handleCustomerClick = useCallback((customer) => {
    if (!customer?.lat || !customer?.lng || !mapInstance) return;
    
    const lat = parseFloat(customer.lat);
    const lng = parseFloat(customer.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates for customer:', customer);
      return;
    }
    
    mapInstance.panTo({ lat, lng });
    mapInstance.setZoom(15);
    setSelectedMarker(customer);
  }, [mapInstance]);

  const handleCustomerSelect = useCallback((customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.customer_id === customer.customer_id);
      return isSelected
        ? prev.filter(c => c.customer_id !== customer.customer_id)
        : [...prev, customer];
    });
  }, []);

  const handleAddressesChange = useCallback(async (addresses) => {
    if (!addresses.length) return;
  
    try {
      const coordsPromises = addresses.map(address => geocodeAddress(address));
      const coordinates = await Promise.all(coordsPromises);
  
      setStartLocation(coordinates[0]);
      setStartAddress(addresses[0]);
  
      if (coordinates.length > 1) {
        const selectedCustomersFromAddresses = addresses.map((address, index) => ({
          customer_id: `address-${index}`,
          name: address,
          address: address,
          lat: coordinates[index].lat,
          lng: coordinates[index].lng,
          products: []
        }));
  
        setSelectedCustomers(selectedCustomersFromAddresses);
      }
    } catch (error) {
      console.error('Error updating locations:', error);
      setError('Failed to process addresses');
    }
  }, []);

  // Loading states
  if (!isMapsLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error states
  if (mapsLoadError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <p className="text-red-700 font-medium">Error loading Google Maps</p>
            <p className="text-red-600">{mapsLoadError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // if (!isFeatureEnabled('maps')) {
  if (false) {
    return <UpgradePrompt />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Customer Locations
            </h2>
            <p className="text-gray-600 mt-1">
              View customers and optimize delivery routes
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowList(!showList)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <List className="h-5 w-5" />
              {showList ? 'Hide List' : 'Show List'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {showList && (
          <div className="lg:col-span-1 space-y-4">
            {customers.map(customer => (
              <CustomerCard
                key={customer.customer_id}
                customer={customer}
                onLocationClick={handleCustomerClick}
                isSelected={selectedCustomers.some(
                  c => c.customer_id === customer.customer_id
                )}
                onSelect={handleCustomerSelect}
                orders={orders}
              />
            ))}
          </div>
        )}

        <div className={showList ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <div className="relative w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
              <MapDisplay
                customers={customers}
                selectedMarker={selectedMarker}
                setSelectedMarker={setSelectedMarker}
                onMapLoad={map => setMapInstance(map)}
                selectedCustomers={selectedCustomers}
                setSelectedCustomers={setSelectedCustomers}
                directionsResponse={directionsResponse}
                orders={orders}
                startLocation={startLocation}
                endLocation={endLocation}
                calculateRoute={calculateRoute}
              />
            </div>
          </div>

          {directionsResponse && (
            <RouteSteps
              directionsResponse={directionsResponse}
              selectedCustomers={selectedCustomers}
              setSelectedCustomers={setSelectedCustomers}
              startLocation={startLocation}
              startAddress={startAddress}
              endLocation={endLocation}
              endAddress={endAddress}
              onAddressesChange={handleAddressesChange}
              selectedAddresses={selectedAddresses}
            />
          )}
        </div>
      </div>

      <ApiStats />
    </div>
  );
};

export default CustomersMapView;