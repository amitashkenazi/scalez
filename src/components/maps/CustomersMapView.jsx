import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Package, AlertCircle, Loader2, RefreshCw, List } from 'lucide-react';
import apiService from '../../services/api';
import { useMap } from '../../contexts/MapContext';
import Map from './Map';
import RouteSteps from './RouteSteps';
import CustomerCard from './components/CustomerCard';
import { geocodeAddress } from './utils';
import { DirectionsOptimizer } from '../../utils/DirectionsOptimizer';
import ApiStats from '../ApiStats';
import PersistentMapContainer from './PersistentMapContainer';

const CustomersMapView = () => {
  // Map context
  const { 
    mapInstance, 
    setMapInstance,
    directionsResponse,
    setDirectionsResponse,
    selectedMarker,
    setSelectedMarker,
    isMapLoaded
  } = useMap();

  // Local state
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [measurements, setMeasurements] = useState({});
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [selectedAddresses, setSelectedAddresses] = useState([]);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Location state
  const [startLocation, setStartLocation] = useState({
    lat: 32.0853,
    lng: 34.7818  // Tel Aviv default coordinates
  });
  const [startAddress, setStartAddress] = useState('Tel Aviv, Israel');
  const [endLocation, setEndLocation] = useState(null);
  const [endAddress, setEndAddress] = useState('');

  // Initialize the directions optimizer
  const [directionsOptimizer] = useState(() => new DirectionsOptimizer({
    batchSize: 5,
    batchInterval: 1000,
    debounceDelay: 2500
  }));

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Fetch measurements for scales
  const fetchLatestMeasurements = async (scaleIds) => {
    try {
      const measurementPromises = scaleIds
        .filter(id => id)
        .map(scaleId => 
          apiService.request(`measurements/scale/${scaleId}/latest`, {
            method: 'GET'
          }).catch(() => null)
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

      // Get scale IDs
      const scaleIds = [...new Set(productsResponse
        .filter(p => p.scale_id)
        .map(p => p.scale_id))];

      // Enrich customers with coordinates and products
      const enrichedCustomers = await Promise.all(
        customersResponse.map(async (customer) => {
          const coords = await geocodeAddress(customer.address);
          const customerProducts = productsResponse
            .filter(p => p.customer_id === customer.customer_id)
            .map(product => ({
              ...product,
              measurement: null // Will be updated later
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
      await fetchLatestMeasurements(scaleIds);
      
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

  // Calculate route
  const calculateRoute = async () => {
    if (!selectedCustomers.length || !startLocation || !window.google || !mapInstance) return;
    
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
      
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      result.routes[0].legs.forEach(leg => {
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      });
      mapInstance.fitBounds(bounds);

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
      const coordsPromises = addresses.map(address => geocodeAddress(address));
      const coordinates = await Promise.all(coordsPromises);
  
      setStartLocation(coordinates[0]);
      setStartAddress(addresses[0]);
  
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
        calculateRoute();
      }
    } catch (error) {
      console.error('Error updating locations:', error);
      setError('Failed to process addresses');
    }
  };

  // Setup effects
  useEffect(() => {
    fetchData();
    return () => {
      directionsOptimizer.cancelAll();
    };
  }, []);

  useEffect(() => {
    if (selectedCustomers.length > 0 && startLocation && isMapLoaded) {
      calculateRoute();
    }
  }, [selectedCustomers, startLocation, endLocation, isMapLoaded]);

  // Auto-refresh measurements
  useEffect(() => {
    if (!customers.length) return;
    
    const refreshInterval = setInterval(() => {
      const scaleIds = [...new Set(
        customers.flatMap(c => 
          c.products
            .filter(p => p.scale_id)
            .map(p => p.scale_id)
        )
      )];
      fetchLatestMeasurements(scaleIds);
    }, 20000); // 20 seconds

    return () => clearInterval(refreshInterval);
  }, [customers]);

  // Event handlers
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

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
      }
      return [...prev, customer];
    });
  }, []);

  const handleBoundsChanged = useCallback(() => {
    // Handle bounds change if needed
  }, []);

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
            <span className="text-sm text-gray-500">
              Last updated: {getLastRefreshTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
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
            <PersistentMapContainer>
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
                measurements={measurements}
              />
            </PersistentMapContainer>
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