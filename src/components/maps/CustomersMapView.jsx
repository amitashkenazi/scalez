import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { translations } from '../../translations/translations';
import { 
  Package, 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Scale, 
  MessageSquare, 
  Clock, 
  List, 
  Route,
  Building2,
  MapPin,
  Home,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Map as MapIcon
} from 'lucide-react';
import apiService from '../../services/api';

import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
  DirectionsService
} from '@react-google-maps/api';

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

// Helper function to check if customer has pending delivery
const hasWaitingDelivery = (customer, orders) => {
  return orders.some(order => {
    const [hebrewName, englishName] = customer.name.split(' - ');
    return (order.customer_name === hebrewName || order.customer_name === englishName) && 
           order.status === 'waiting_for_delivery';
  });
};
// Add this function near the top of the file with other helper functions
const createCustomMarkerIcon = (weight, thresholds, hasPendingDelivery, isVendor = false) => {
  // Get base color based on thresholds or use blue for vendor
  const baseColor = isVendor ? '#3B82F6' : getStatusColor(weight, thresholds?.upper, thresholds?.lower);
  const strokeColor = hasPendingDelivery ? '#9333EA' : '#FFFFFF'; // Purple for pending delivery
  const strokeWidth = hasPendingDelivery ? 3 : 2;
  
  const displayText = isVendor ? 'HQ' : (weight ? Math.round(weight) : '?');

  // Create SVG content
  const svgContent = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="${baseColor}" 
        stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      <text x="20" y="20" font-size="12" fill="white" 
        text-anchor="middle" dominant-baseline="middle" font-family="Arial">
        ${displayText}
      </text>
    </svg>
  `;

  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgContent),
    scaledSize: new window.google.maps.Size(40, 40),
    anchor: new window.google.maps.Point(20, 20),
  };
};



// Utility function for status colors
const getStatusColor = (value, upper, lower) => {
  if (!value || !upper || !lower) return '#6B7280';
  if (value >= upper) return '#22C55E';
  if (value >= lower) return '#F97316';
  return '#DC2626';
};

const CustomerCard = ({ customer, onLocationClick, isSelected, onSelect, orders }) => {
  const { language } = useLanguage();
  const [hebrewName, englishName] = customer.name?.split(' - ') || ['', ''];
  const displayName = language === 'he' ? hebrewName : englishName;
  const isPendingDelivery = hasWaitingDelivery(customer, orders);
  const isRTL = language === 'he';

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer hover:bg-gray-50 border-2 transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
        ${isPendingDelivery ? 'border-purple-500 bg-purple-50' : ''}
        ${isPendingDelivery && isSelected ? 'border-purple-700' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium text-lg">
          {displayName}
          {isPendingDelivery && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Pending Delivery
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(customer);
            }}
            className={`px-3 py-1 rounded ${
              isSelected
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLocationClick(customer);
            }}
            className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            View
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-600 mb-2">{customer.address}</div>
      {customer.products && customer.products.length > 0 && (
        <div className="space-y-2">
          {customer.products.map(product => (
            <div
              key={product.product_id}
              className="flex justify-between items-center bg-gray-50 p-2 rounded"
            >
              <span>{product.name}</span>
              <span className={`font-medium ${!product.measurement?.weight ? 'text-gray-500' :
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



const RouteSteps = ({ directionsResponse, selectedCustomers, vendorAddress, vendorLocation }) => {
  const [expandedLeg, setExpandedLeg] = useState(null);
  const { language } = useLanguage();

  if (!directionsResponse || !selectedCustomers?.length) return null;

  const route = directionsResponse.routes[0];
  const legs = route.legs;

  const getCustomerDisplayName = (customer) => {
    if (!customer?.name) return 'Unknown Location';
    const [hebrewName, englishName] = customer.name.split(' - ');
    return language === 'he' ? hebrewName : englishName || hebrewName;
  };

  // Calculate total distance and duration
  const totalStats = legs.reduce((acc, leg) => ({
    distance: acc.distance + leg.distance.value,
    duration: acc.duration + (leg.duration_in_traffic?.value || leg.duration.value)
  }), { distance: 0, duration: 0 });

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      {/* Route Summary Header */}
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <Route className="h-5 w-5 text-blue-600" />
          Optimized Route Details
        </h3>
        <div className="text-sm text-gray-600">
          <div>Total Distance: {(totalStats.distance / 1000).toFixed(1)} km</div>
          <div>Estimated Time: {Math.round(totalStats.duration / 60)} minutes</div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Starting Point */}
        <div className="border rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-lg">Starting Point: Your Location</div>
              <div className="text-sm text-gray-600">{vendorAddress}</div>
            </div>
          </div>
        </div>

        {/* Customer Stops */}
        {selectedCustomers.map((customer, index) => (
          <React.Fragment key={customer.customer_id}>
            {/* Direction Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>

            {/* Customer Stop */}
            <div className="border rounded-lg bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <MapPin className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">
                    Stop {index + 1}: {getCustomerDisplayName(customer)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">{customer.address}</div>
                  
                  {/* Products at this stop */}
                  {customer.products && (
                    <div className="space-y-2 mt-3">
                      <div className="text-sm font-medium text-gray-700">Products to check:</div>
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
              </div>
            </div>

            {/* Driving Instructions */}
            {legs[index] && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between text-gray-600 mb-2">
                  <div className="flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    <span className="font-medium">Drive to next stop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{legs[index].distance.text}</span>
                    <span>•</span>
                    <span>{legs[index].duration_in_traffic?.text || legs[index].duration.text}</span>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedLeg(expandedLeg === index ? null : index)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  {expandedLeg === index ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {expandedLeg === index ? 'Hide' : 'Show'} detailed directions
                </button>

                {expandedLeg === index && (
                  <ol className="mt-3 space-y-2">
                    {legs[index].steps.map((step, stepIndex) => (
                      <li key={stepIndex} className="flex items-start gap-3">
                        <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm">
                          {stepIndex + 1}
                        </div>
                        <div>
                          <div
                            className="text-sm"
                            dangerouslySetInnerHTML={{ __html: step.instructions }}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {step.distance.text} • {step.duration.text}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Return to Starting Point */}
        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-gray-400" />
        </div>

        <div className="border rounded-lg bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-lg">Return to Base</div>
              <div className="text-sm text-gray-600">{vendorAddress}</div>
              {legs[legs.length - 1] && (
                <div className="text-sm text-gray-600 mt-2">
                  Return trip: {legs[legs.length - 1].distance.text} • 
                  {legs[legs.length - 1].duration_in_traffic?.text || legs[legs.length - 1].duration.text}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


const Map = ({
  customers,
  selectedMarker,
  setSelectedMarker,
  onMapLoad,
  selectedCustomers,
  setSelectedCustomers,
  directionsResponse,
  onDirectionsChanged,
  orders
}) => {
  const mapRef = useRef();
  const [vendorLocation, setVendorLocation] = useState(null);
  const [vendorAddress, setVendorAddress] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const calculationTimeoutRef = useRef(null);

  // Fetch vendor's address and geocode it
  useEffect(() => {
    const fetchVendorAddress = async () => {
      try {
        const vendorDetails = await apiService.request('vendors/me', {
          method: 'GET'
        });

        if (!vendorDetails?.address) {
          throw new Error('No address found in vendor details');
        }

        setVendorAddress(vendorDetails.address);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(vendorDetails.address)}&countrycodes=il`
          );

          if (!response.ok) throw new Error('Geocoding failed');

          const data = await response.json();
          if (data && data.length > 0) {
            const location = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            setVendorLocation(location);
            setLocationError(null);
          } else {
            throw new Error('Location not found');
          }
        } catch (geocodeError) {
          console.warn('Geocoding error:', geocodeError);
          setVendorLocation({ lat: 32.0853, lng: 34.7818 });
          setLocationError('Could not geocode vendor address. Using default location.');
        }
      } catch (error) {
        console.error('Error fetching vendor details:', error);
        setLocationError('Could not fetch vendor address');
        setVendorLocation({ lat: 32.0853, lng: 34.7818 });
      }
    };

    fetchVendorAddress();
  }, []);

  const calculateRoute = useCallback(() => {
    if (!vendorLocation || selectedCustomers.length === 0 || isCalculatingRoute) {
      return;
    }

    setIsCalculatingRoute(true);

    const directionsService = new window.google.maps.DirectionsService();

    const waypoints = selectedCustomers.map(customer => ({
      location: new window.google.maps.LatLng(customer.lat, customer.lng),
      stopover: true
    }));

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(vendorLocation.lat, vendorLocation.lng),
        destination: new window.google.maps.LatLng(vendorLocation.lat, vendorLocation.lng),
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
        }
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          onDirectionsChanged(result);

          if (mapRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(vendorLocation);
            result.routes[0].legs.forEach(leg => {
              bounds.extend(leg.start_location);
              bounds.extend(leg.end_location);
            });
            mapRef.current.fitBounds(bounds, {
              padding: { top: 50, right: 50, bottom: 50, left: 50 }
            });
          }
        } else {
          console.error('Directions request failed:', status);
        }
        setIsCalculatingRoute(false);
      }
    );
  }, [selectedCustomers, vendorLocation, onDirectionsChanged]);

  const debouncedCalculateRoute = useCallback(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    if (vendorLocation && selectedCustomers.length > 0) {
      calculationTimeoutRef.current = setTimeout(() => {
        calculateRoute();
      }, 1000);
    }
  }, [calculateRoute, vendorLocation, selectedCustomers]);

  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    debouncedCalculateRoute();
  }, [selectedCustomers, vendorLocation, debouncedCalculateRoute]);

  const getMarkerIcon = (customer) => {
    const isPendingDelivery = hasWaitingDelivery(customer, orders);
    const weight = customer.products?.[0]?.measurement?.weight;
    const thresholds = customer.products?.[0]?.thresholds;
    
    return createCustomMarkerIcon(weight, thresholds, isPendingDelivery);
  };

  return (
    <div className="relative">
      {locationError && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 shrink-0" />
          <p className="text-red-700 text-sm">{locationError}</p>
        </div>
      )}

      <GoogleMap
        mapContainerClassName="rounded-lg"
        mapContainerStyle={{ height: '600px', width: '100%' }}
        center={vendorLocation || MAP_CENTER}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
          if (onMapLoad) onMapLoad(map);

          if (customers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            customers.forEach(customer => {
              bounds.extend({ lat: customer.lat, lng: customer.lng });
            });
            if (vendorLocation) {
              bounds.extend(vendorLocation);
            }
            map.fitBounds(bounds);
          }
        }}
      >
        {vendorLocation && (
          <MarkerF
            position={vendorLocation}
            icon={createCustomMarkerIcon(null, null, false, true)}
            onClick={() => setSelectedMarker('vendor')}
          >
            {selectedMarker === 'vendor' && (
              <InfoWindowF position={vendorLocation} onCloseClick={() => setSelectedMarker(null)}>
                <div className="p-2">
                  <p className="font-medium">Your Company Location</p>
                  <p className="text-sm text-gray-600">{vendorAddress}</p>
                  <p className="text-sm text-gray-600">Starting and ending point</p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {customers
          .filter(customer => !selectedCustomers.includes(customer))
          .map((customer) => (
            <MarkerF
              key={customer.customer_id}
              position={{ lat: customer.lat, lng: customer.lng }}
              onClick={() => setSelectedMarker(customer)}
              icon={getMarkerIcon(customer)}
            />
          ))}

        {selectedMarker && selectedMarker !== 'vendor' && (
          // In the InfoWindow content, add or modify the weight display:
          <InfoWindowF
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2 max-w-xs">
              <div className="font-bold mb-1">{selectedMarker.name}</div>
              <div className="text-sm text-gray-600 mb-2">{selectedMarker.address}</div>
              {selectedMarker.products?.map(product => (
                <div key={product.product_id} className="text-sm flex justify-between items-center">
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
              {hasWaitingDelivery(selectedMarker, orders) && (
                <div className="mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                  Pending Delivery
                </div>
              )}
            </div>
          </InfoWindowF>
        )}

        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4F46E5',
                strokeWeight: 5,
                strokeOpacity: 0.8
              }
            }}
          />
        )}
      </GoogleMap>

      {isCalculatingRoute && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Calculating optimal route...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main CustomersMapView Component
const CustomersMapView = () => {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [routeSummary, setRouteSummary] = useState(null);

  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'he';

  // Load Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const geocodeAddress = async (address) => {
    const DEFAULT_COORDS = {
      tel_aviv: { lat: 32.0853, lng: 34.7818 },
      jerusalem: { lat: 31.7683, lng: 35.2137 },
      haifa: { lat: 32.7940, lng: 34.9896 }
    };

    const cityMatches = {
      'תל אביב': DEFAULT_COORDS.tel_aviv,
      'tel aviv': DEFAULT_COORDS.tel_aviv,
      'ירושלים': DEFAULT_COORDS.jerusalem,
      'jerusalem': DEFAULT_COORDS.jerusalem,
      'חיפה': DEFAULT_COORDS.haifa,
      'haifa': DEFAULT_COORDS.haifa
    };

    for (const [city, coords] of Object.entries(cityMatches)) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.01,
          lng: coords.lng + (Math.random() - 0.5) * 0.01
        };
      }
    }

    try {
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
      const [customersResponse, productsResponse, ordersResponse] = await Promise.all([
        apiService.getCustomers(),
        apiService.getProducts(),
        apiService.request('orders', { method: 'GET' })
      ]);

      setOrders(ordersResponse);

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

      if (mapInstance && enrichedCustomers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        enrichedCustomers.forEach(customer => {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        });
        mapInstance.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
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

  const handleDirectionsChanged = useCallback((response) => {
    setDirectionsResponse(response);
    if (response) {
      const route = response.routes[0];
      const legs = route.legs;

      const totalDistance = legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1000;
      const totalTime = legs.reduce((acc, leg) =>
        acc + (leg.duration_in_traffic?.value || leg.duration.value), 0) / 60;

      setRouteSummary({
        totalDistance,
        totalTime,
        waypoints: route.waypoint_order,
        legs: legs.map(leg => ({
          distance: leg.distance,
          duration: leg.duration_in_traffic || leg.duration,
          startAddress: leg.start_address,
          endAddress: leg.end_address,
          steps: leg.steps
        }))
      });
    } else {
      setRouteSummary(null);
    }
  }, []);

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
            <p className="text-gray-600 mt-1">
              View customer locations and plan routes
            </p>
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
              onDirectionsChanged={handleDirectionsChanged}
              orders={orders}
            />
          </div>
        </div>
      </div>
      {/* Route summary */}
      {routeSummary && (
        <>
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-4">
              <Route className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-medium">Route Summary</h3>
                <p className="text-sm text-gray-600">
                  Total Distance: {routeSummary.totalDistance.toFixed(1)} km |
                  Estimated Time: {Math.round(routeSummary.totalTime)} minutes
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Selected stops: {selectedCustomers.length}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCustomers([]);
                  setDirectionsResponse(null);
                  setRouteSummary(null);
                }}
                className="ml-auto px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                Clear Route
              </button>
        </div>
      </div>

          <RouteSteps
            directionsResponse={directionsResponse}
            selectedCustomers={selectedCustomers}
          />
        </>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-400 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersMapView;