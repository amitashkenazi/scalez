import React, { useCallback, useEffect } from 'react';
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { PackageCheck } from 'lucide-react';
import { createCustomMarkerIcon } from './markers';
import { hasWaitingDelivery } from './utils';

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
  customers = [],
  selectedMarker,
  setSelectedMarker,
  onMapLoad,
  selectedCustomers = [],
  directionsResponse,
  orders = [],
  startLocation,
  endLocation,
  onBoundsChanged,
  calculateRoute,
  measurements = {}
}) => {
  // Debug logging
  useEffect(() => {
    console.log('Map Component Props:', {
      customersCount: customers.length,
      selectedCustomersCount: selectedCustomers.length,
      hasDirections: !!directionsResponse,
      startLocation,
      endLocation,
      measurements
    });

    if (directionsResponse) {
      console.log('Directions Response:', {
        routes: directionsResponse.routes?.length,
        legs: directionsResponse.routes?.[0]?.legs?.length,
        waypoint_order: directionsResponse.routes?.[0]?.waypoint_order,
      });
    }
  }, [customers, selectedCustomers, directionsResponse, startLocation, endLocation, measurements]);

  // Handle bounds changes
  const handleBoundsChanged = useCallback(() => {
    if (onBoundsChanged) {
      onBoundsChanged();
    }
  }, [onBoundsChanged]);

  // Render each customer's info window content
  const renderCustomerInfo = useCallback((customer) => {
    const isPendingDelivery = hasWaitingDelivery(customer, orders);
    const firstProduct = customer.products?.[0];
    const measurement = firstProduct?.scale_id ? measurements[firstProduct.scale_id] : null;

    return (
      <div className="p-2 max-w-xs">
        <div className="font-bold mb-1">{customer.name}</div>
        <div className="text-sm text-gray-600 mb-2">{customer.address}</div>
        {customer.products?.map((product) => (
          <div
            key={product.product_id}
            className="text-sm flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <PackageCheck className="h-4 w-4 text-gray-500" />
              <span>{product.name}</span>
            </div>
            {product.scale_id ? (
              <span className={`font-medium ${
                !measurement?.weight ? 'text-gray-500' :
                measurement.weight >= product.thresholds?.upper ? 'text-green-600' :
                measurement.weight >= product.thresholds?.lower ? 'text-orange-500' :
                'text-red-600'
              }`}>
                {measurement?.weight
                  ? `${Math.round(measurement.weight)} kg`
                  : 'No data'
                }
              </span>
            ) : (
              <span className="text-gray-500">No scale</span>
            )}
          </div>
        ))}
        {isPendingDelivery && (
          <div className="mt-2 px-2 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
            Pending Delivery
          </div>
        )}
      </div>
    );
  }, [orders, measurements]);

  return (
    <GoogleMap
      mapContainerClassName="rounded-lg"
      mapContainerStyle={{ height: '600px', width: '100%' }}
      center={startLocation}
      zoom={13}
      options={MAP_OPTIONS}
      onLoad={onMapLoad}
      onBoundsChanged={handleBoundsChanged}
    >
      {/* Start Location Marker */}
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
                <p className="text-sm text-gray-600">Base Location</p>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      )}

      {/* End Location Marker (if different from start) */}
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
                <p className="text-sm text-gray-600">Final Destination</p>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      )}

      {/* Customer Markers */}
      {customers.map((customer) => {
        const isSelected = selectedCustomers.some(c => c.customer_id === customer.customer_id);
        const firstProduct = customer.products?.[0];
        const measurement = firstProduct?.scale_id ? measurements[firstProduct.scale_id] : null;
        const isPendingDelivery = hasWaitingDelivery(customer, orders);

        return (
          <MarkerF
            key={customer.customer_id}
            position={{ lat: customer.lat, lng: customer.lng }}
            onClick={() => setSelectedMarker(customer)}
            icon={createCustomMarkerIcon(
              measurement?.weight,
              firstProduct?.thresholds,
              isPendingDelivery,
              false,
              isSelected
            )}
          >
            {selectedMarker === customer && (
              <InfoWindowF
                position={{ lat: customer.lat, lng: customer.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                {renderCustomerInfo(customer)}
              </InfoWindowF>
            )}
          </MarkerF>
        );
      })}

      {/* Directions Renderer */}
      {directionsResponse?.routes?.[0] && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#4F46E5',
              strokeWeight: 5,
              strokeOpacity: 0.8
            },
            preserveViewport: true
          }}
        />
      )}
    </GoogleMap>
  );
};

export default Map;