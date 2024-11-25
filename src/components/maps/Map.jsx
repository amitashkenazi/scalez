import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer
} from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { hasWaitingDelivery } from './utils';
import { createCustomMarkerIcon } from './markers';

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

const Map = ({
  customers,
  selectedMarker,
  setSelectedMarker,
  onMapLoad,
  selectedCustomers,
  setSelectedCustomers,
  directionsResponse,
  onDirectionsChanged,
  orders,
  startLocation,
  endLocation,
  onBoundsChanged,
  calculateRoute,
  measurements
}) => {
  const mapRef = useRef();
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [error, setError] = useState(null);

  // Memoize the calculateRoute function to prevent it from changing on every render
  const memoizedCalculateRoute = useCallback(() => {
    if (selectedCustomers.length > 0 && startLocation) {
      console.log('Calculating route...');
      calculateRoute();
    }
  }, [selectedCustomers, startLocation, calculateRoute]);

  // Use a ref to store the previous selectedCustomers for comparison
  const prevSelectedCustomersRef = useRef([]);

  useEffect(() => {
    const prevSelectedCustomers = prevSelectedCustomersRef.current;

    // Compare previous and current selectedCustomers arrays
    const hasSelectedCustomersChanged =
      selectedCustomers.length !== prevSelectedCustomers.length ||
      selectedCustomers.some(
        (customer, index) =>
          customer.customer_id !== prevSelectedCustomers[index]?.customer_id
      );

    if (hasSelectedCustomersChanged) {
      memoizedCalculateRoute();
      prevSelectedCustomersRef.current = selectedCustomers;
    }
  }, [selectedCustomers, memoizedCalculateRoute]);

  const getMarkerIcon = useCallback(
    (customer) => {
      const isPendingDelivery = hasWaitingDelivery(customer, orders);
      const firstProduct = customer.products?.[0];
      const weight = firstProduct?.scale_id
        ? measurements[firstProduct?.scale_id].weight
        : null;
      const thresholds = firstProduct?.thresholds;

      return createCustomMarkerIcon(weight, thresholds, isPendingDelivery);
    },
    [orders]
  );

  const handleBoundsChanged = () => {
    if (mapRef.current && onBoundsChanged) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        onBoundsChanged(bounds);
      }
    }
  };

  return (
    <div className="relative">
      <GoogleMap
        mapContainerClassName="rounded-lg"
        mapContainerStyle={{ height: '600px', width: '100%' }}
        center={startLocation}
        zoom={13}
        options={MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
          if (onMapLoad) onMapLoad(map);

          if (customers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            customers.forEach((customer) => {
              bounds.extend({ lat: customer.lat, lng: customer.lng });
            });
            if (startLocation) {
              bounds.extend(startLocation);
            }
            map.fitBounds(bounds);
          }
        }}
        onBoundsChanged={handleBoundsChanged}
      >
        {/* Render start location marker */}
        {startLocation && (
          <MarkerF
            position={startLocation}
            icon={createCustomMarkerIcon(null, null, false, true)}
            onClick={() => setSelectedMarker('start')}
          >
            {selectedMarker === 'start' && (
              <InfoWindowF
                position={startLocation}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-medium">Starting Point</p>
                  <p className="text-sm text-gray-600">
                    Starting location for route
                  </p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* Render end location marker if different from start */}
        {endLocation && endLocation !== startLocation && (
          <MarkerF
            position={endLocation}
            icon={createCustomMarkerIcon(null, null, false, true)}
            onClick={() => setSelectedMarker('end')}
          >
            {selectedMarker === 'end' && (
              <InfoWindowF
                position={endLocation}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2">
                  <p className="font-medium">End Point</p>
                  <p className="text-sm text-gray-600">Final destination</p>
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        )}

        {/* Render all customer markers */}
        {customers.map((customer) => (
          <MarkerF
            key={customer.customer_id}
            position={{ lat: customer.lat, lng: customer.lng }}
            onClick={() => setSelectedMarker(customer)}
            icon={getMarkerIcon(customer)}
          >
            {selectedMarker === customer && (
              <InfoWindowF
                position={{ lat: customer.lat, lng: customer.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-2 max-w-xs">
                  <div className="font-bold mb-1">{customer.name}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {customer.address}
                  </div>
                  {customer.products?.map((product) => (
                    <div
                      key={product.product_id}
                      className="text-sm flex justify-between items-center"
                    >
                      <span>{product.name}</span>
                      {product.scale_id ? (
                        <span
                          className={`font-medium ${
                            !product.measurement?.weight
                              ? 'text-gray-500'
                              : product.measurement.weight >=
                                product.thresholds?.upper
                              ? 'text-green-600'
                              : product.measurement.weight >=
                                product.thresholds?.lower
                              ? 'text-orange-500'
                              : 'text-red-600'
                          }`}
                        >
                          {product.measurement?.weight
                            ? `${Math.round(product.measurement.weight)} kg`
                            : 'No data'}
                        </span>
                      ) : (
                        <span className="text-gray-500">No scale</span>
                      )}
                    </div>
                  ))}
                  {hasWaitingDelivery(customer, orders) && (
                    <div className="mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
                      Pending Delivery
                    </div>
                  )}
                </div>
              </InfoWindowF>
            )}
          </MarkerF>
        ))}

        {/* Render directions if available */}
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

      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-400 rounded-lg p-4">
          <div className="flex items-center text-red-700">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;