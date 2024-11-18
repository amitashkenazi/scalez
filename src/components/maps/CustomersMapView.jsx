// src/components/maps/CustomersMapView.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, List } from 'lucide-react';
import apiService from '../../services/api';
import { useLoadScript } from '@react-google-maps/api';
import Map from './Map';
import RouteSteps from './RouteSteps';
import CustomerCard from './components/CustomerCard';
import { geocodeAddress } from './utils';
import { DirectionsOptimizer } from '../../utils/DirectionsOptimizer';
import ApiStats from '../ApiStats';


const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];

const CustomersMapView = () => {
  // State for data
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Initialize the optimizer
  const [directionsOptimizer] = useState(() => new DirectionsOptimizer({
    batchSize: 5,
    batchInterval: 1000,
    debounceDelay: 2500
  }));

  // Location state with Tel Aviv as default
  const [startLocation, setStartLocation] = useState({
    lat: 32.0853,
    lng: 34.7818
  });
  const [startAddress, setStartAddress] = useState('Tel Aviv, Israel');
  const [endLocation, setEndLocation] = useState(null);
  const [endAddress, setEndAddress] = useState('');

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Initialize Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  // Fetch initial data
  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }
    
    try {
      const [customersResponse, productsResponse, ordersResponse] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts(),
        apiService.request('orders', { method: 'GET' })
      ]);

      // Get scale IDs from products
      const scaleIds = [...new Set(productsResponse
        .filter(p => p.scale_id)
        .map(p => p.scale_id))];
      
      // Fetch measurements for scales
      const measurementsMap = {};
      if (scaleIds.length > 0) {
        const measurementPromises = scaleIds.map(scaleId =>
          apiService.request(`measurements/scale/${scaleId}/latest`, {
            method: 'GET'
          }).catch(() => null)
        );

        const measurementResults = await Promise.all(measurementPromises);
        measurementResults.forEach((measurement, index) => {
          if (measurement) {
            measurementsMap[scaleIds[index]] = measurement;
          }
        });
      }

      // Enrich customers with geocoded coordinates and products
      const enrichedCustomers = await Promise.all(
        customersResponse.map(async (customer) => {
          const coords = await geocodeAddress(customer.address);
          const customerProducts = productsResponse
            .filter(p => p.customer_id === customer.customer_id)
            .map(product => ({
              ...product,
              measurement: product.scale_id ? measurementsMap[product.scale_id] || null : null
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
      setMeasurements(measurementsMap);
      setLastRefreshTime(new Date());

      // Update map bounds if needed
      if (mapInstance && enrichedCustomers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        enrichedCustomers.forEach(customer => {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        });
        if (startLocation) {
          bounds.extend(startLocation);
        }
        mapInstance.fitBounds(bounds);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  const calculateRoute = async () => {
    console.log(new Error().stack);
    if (!selectedCustomers.length || !startLocation || !window.google) return;
    
    setIsCalculatingRoute(true);
    setError(null);

    try {
      const origin = new window.google.maps.LatLng(startLocation.lat, startLocation.lng);
      const destination = endLocation ? 
        new window.google.maps.LatLng(endLocation.lat, endLocation.lng) : 
        origin;

      const waypoints = selectedCustomers.map(customer => ({
        location: new window.google.maps.LatLng(customer.lat, customer.lng),
        stopover: true
      }));

      // Use debounced directions to prevent rapid recalculation
      const result = await directionsOptimizer.getDebouncedDirections(
        origin,
        destination,
        waypoints,
        {
          avoidTolls: false,
          avoidHighways: false,
          optimizeWaypoints: true,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: window.google.maps.TrafficModel.BEST_GUESS
          }
        }
      );

      setDirectionsResponse(result);
      
      if (mapInstance) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(origin);
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

  // Handle address changes
  const handleAddressesChange = async (addresses) => {
    if (!addresses.length) return;
  
    try {
      // Get coordinates for all addresses
      const coordsPromises = addresses.map(address => geocodeAddress(address));
      const coordinates = await Promise.all(coordsPromises);
  
      // Set the first address as start location
      setStartLocation(coordinates[0]);
      setStartAddress(addresses[0]);
  
      // If there are more addresses, calculate route through them
      if (coordinates.length > 1) {
        const waypoints = coordinates.slice(1).map(coords => ({
          location: new window.google.maps.LatLng(coords.lat, coords.lng),
          stopover: true
        }));
  
        setSelectedCustomers(addresses.map((address, index) => ({
          customer_id: `address-${index}`,
          name: address,
          address: address,
          lat: coordinates[index].lat,
          lng: coordinates[index].lng,
          products: []
        })));
        console.log('calculateRoute1');
        calculateRoute();
      }
    } catch (error) {
      console.error('Error updating locations:', error);
      setError('Failed to process addresses');
    }
  };

  // Handlers
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData(false);
  }, []);

  const handleBoundsChanged = useCallback((bounds) => {
    // Handle bounds change if needed
  }, []);

  const handleCustomerClick = useCallback((customer) => {
    if (mapInstance) {
      mapInstance.panTo({ lat: customer.lat, lng: customer.lng });
      mapInstance.setZoom(15);
      setSelectedMarker(customer);
    }
  }, [mapInstance]);

  const handleCustomerSelect = useCallback((customer) => {
    setSelectedCustomers(prev => {
      const isSelected = prev.some(c => c.customer_id === customer.customer_id);
      if (isSelected) {
        return prev.filter(c => c.customer_id !== customer.customer_id);
      } else {
        return [...prev, customer];
      }
    });
  }, []);

  // Effects
  useEffect(() => {
    fetchData();
    return () => {
      directionsOptimizer.cancelAll();
    };
  }, []);

  useEffect(() => {
    console.log('Selected customers:', selectedCustomers);
    if (selectedCustomers.length > 0 && startLocation) {
    console.log('calculateRoute2');
      calculateRoute();
    }
  }, [selectedCustomers, startLocation, endLocation]);

  // Format time helper
  const getLastRefreshTimeString = () => {
    return lastRefreshTime.toLocaleTimeString(language === 'he' ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loadError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Customers Map
            </h2>
            <p className="text-gray-600 mt-1">
              View customer locations and plan routes
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastRefreshTime && (
              <span className="text-sm text-gray-500">
                Last updated: {getLastRefreshTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <List className="h-5 w-5" />
                Customers ({customers.length})
              </h3>
              {selectedCustomers.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedCustomers.length} selected
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
          </div>
        </div>

        {/* Map */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Map
              customers={customers}
              selectedMarker={selectedMarker}
              setSelectedMarker={setSelectedMarker}
              onMapLoad={setMapInstance}
              selectedCustomers={selectedCustomers}
              setSelectedCustomers={setSelectedCustomers}
              directionsResponse={directionsResponse}
              orders={orders}
              startLocation={startLocation}
              endLocation={endLocation}
              onBoundsChanged={handleBoundsChanged}
              calculateRoute={calculateRoute}
              isCalculatingRoute={isCalculatingRoute}
            />
          </div>
        </div>
      </div>

      {/* Route Details */}
      {directionsResponse && (
        <RouteSteps
          directionsResponse={directionsResponse}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          startLocation={startLocation}
          startAddress={startAddress}
          endLocation={endLocation}
          endAddress={endAddress}
          onAddressesChange={(addresses) => {
            setSelectedAddresses(addresses);
            handleAddressesChange(addresses);
          }}
          selectedAddresses={selectedAddresses}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      )}
      <ApiStats />
    </div>
  );
};

export default CustomersMapView;