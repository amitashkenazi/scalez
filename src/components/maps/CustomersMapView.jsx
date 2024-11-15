// src/components/maps/CustomersMapView.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { Loader2, AlertCircle, Map as MapIcon, List, RefreshCw } from 'lucide-react';
import apiService from '../../services/api';
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Constants for Google Maps
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];
const MAP_CENTER = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv

const MAP_OPTIONS = {
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Utility function for status colors
const getStatusColor = (value, upper, lower) => {
  if (!value || !upper || !lower) return '#6B7280';
  if (value >= upper) return '#22C55E';
  if (value >= lower) return '#F97316';
  return '#DC2626';
};

const CustomerCard = ({ customer, onLocationClick }) => {
  const { language } = useLanguage();
  const [hebrewName, englishName] = customer.name?.split(' - ') || ['', ''];
  const displayName = language === 'he' ? hebrewName : englishName;

  return (
    <div 
      className="p-4 rounded-lg cursor-pointer hover:bg-gray-50 border transition-colors"
      onClick={() => onLocationClick(customer)}
    >
      <div className="font-medium text-lg mb-2">{displayName}</div>
      <div className="text-sm text-gray-600 mb-2">{customer.address}</div>
      {customer.products && customer.products.length > 0 && (
        <div className="space-y-2">
          {customer.products.map(product => (
            <div 
              key={product.product_id} 
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <span>{product.name}</span>
              <span className={`font-medium ${
                !product.measurement?.weight ? 'text-gray-500' :
                product.measurement.weight >= product.thresholds?.upper ? 'text-green-600' :
                product.measurement.weight >= product.thresholds?.lower ? 'text-orange-500' :
                'text-red-600'
              }`}>
                {product.measurement?.weight ? 
                  `${Math.round(product.measurement.weight)} kg` : 
                  'No data'
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// Map Component
const Map = ({ customers, selectedMarker, setSelectedMarker, onMapLoad }) => {
  const mapRef = React.useRef();
  
  const markers = useMemo(() => customers.map(customer => (
    <MarkerF
      key={customer.customer_id}
      position={{ lat: customer.lat, lng: customer.lng }}
      onClick={() => setSelectedMarker(customer)}
      icon={{
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: getStatusColor(
          customer.products?.[0]?.measurement?.weight,
          customer.products?.[0]?.thresholds?.upper,
          customer.products?.[0]?.thresholds?.lower
        ),
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF'
      }}
      label={{
        text: customer.products?.[0]?.measurement?.weight 
          ? `${Math.round(customer.products[0].measurement.weight)}` 
          : '?',
        color: '#FFFFFF',
        fontSize: '10px',
        fontWeight: 'bold'
      }}
    />
  )), [customers, setSelectedMarker]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    if (onMapLoad) onMapLoad(map);
    
    // Fit bounds if we have customers
    if (customers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      customers.forEach(customer => {
        bounds.extend({ lat: customer.lat, lng: customer.lng });
      });
      map.fitBounds(bounds);
    }
  }, [customers, onMapLoad]);

  return (
    <GoogleMap
      mapContainerClassName="rounded-lg"
      mapContainerStyle={{ height: '600px', width: '100%' }}
      center={MAP_CENTER}
      zoom={13}
      options={MAP_OPTIONS}
      onLoad={onLoad}
    >
      {markers}
      {selectedMarker && (
        <InfoWindowF
          position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
          onCloseClick={() => setSelectedMarker(null)}
        >
          <div className="p-2 max-w-xs">
            <div className="font-bold mb-1">{selectedMarker.name}</div>
            <div className="text-sm text-gray-600 mb-2">{selectedMarker.address}</div>
            {selectedMarker.products?.map(product => (
              <div key={product.product_id} className="text-sm">
                <span>{product.name}: </span>
                <span className="font-medium">
                  {product.measurement?.weight ? 
                    `${Math.round(product.measurement.weight)} kg` : 
                    'No data'
                  }
                </span>
              </div>
            ))}
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
};

// Main Component
const CustomersMapView = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Load Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const geocodeAddress = async (address) => {
    // Default coordinates for major cities
    const DEFAULT_COORDS = {
      tel_aviv: { lat: 32.0853, lng: 34.7818 },
      jerusalem: { lat: 31.7683, lng: 35.2137 },
      haifa: { lat: 32.7940, lng: 34.9896 }
    };

    // City matching patterns
    const cityMatches = {
      'תל אביב': DEFAULT_COORDS.tel_aviv,
      'tel aviv': DEFAULT_COORDS.tel_aviv,
      'ירושלים': DEFAULT_COORDS.jerusalem,
      'jerusalem': DEFAULT_COORDS.jerusalem,
      'חיפה': DEFAULT_COORDS.haifa,
      'haifa': DEFAULT_COORDS.haifa
    };

    // Check for known cities first
    for (const [city, coords] of Object.entries(cityMatches)) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.01,
          lng: coords.lng + (Math.random() - 0.5) * 0.01
        };
      }
    }

    try {
      // Try Nominatim as fallback
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=il`
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      throw new Error('Location not found');
    } catch (err) {
      console.warn('Geocoding fallback for address:', address, err);
      // Fallback to Tel Aviv with random offset
      return {
        lat: DEFAULT_COORDS.tel_aviv.lat + (Math.random() - 0.5) * 0.02,
        lng: DEFAULT_COORDS.tel_aviv.lng + (Math.random() - 0.5) * 0.02
      };
    }
  };

  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoading(true);
    }
    setIsRefreshing(true);
    setError(null);

    try {
      const [customersResponse, productsResponse] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts()
      ]);

      const measurementPromises = productsResponse.map(product =>
        apiService.request(`measurements/scale/${product.scale_id}/latest`, {
          method: 'GET'
        }).catch(() => null)
      );
      
      const measurements = await Promise.allSettled(measurementPromises);

      const enrichedCustomers = await Promise.all(
        customersResponse.map(async (customer) => {
          const coords = await geocodeAddress(customer.address);
          const customerProducts = productsResponse
            .filter(p => p.customer_id === customer.customer_id)
            .map((product, index) => ({
              ...product,
              measurement: measurements[index].status === 'fulfilled' ? 
                measurements[index].value : null
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
      setLastUpdate(new Date());

      // Fit bounds if we have customers and map is ready
      if (mapInstance && enrichedCustomers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        enrichedCustomers.forEach(customer => {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        });
        mapInstance.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || t.errorFetchingData || 'Error fetching data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const handleCustomerClick = useCallback((customer) => {
    if (mapInstance) {
      mapInstance.panTo({ lat: customer.lat, lng: customer.lng });
      mapInstance.setZoom(15);
      setSelectedMarker(customer);
    }
  }, [mapInstance]);

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
      {/* Header section */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapIcon className="h-6 w-6" />
              Customers Map
            </h2>
            <p className="text-gray-600 mt-1">View customer locations and product weights</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdate && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchData(false)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer list */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <List className="h-5 w-5" />
              Customers ({customers.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {customers.map(customer => (
                <CustomerCard
                  key={customer.customer_id}
                  customer={customer}
                  onLocationClick={handleCustomerClick}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersMapView;