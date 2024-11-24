import React from 'react';
import { GoogleMap, MarkerF, InfoWindowF, DirectionsRenderer } from '@react-google-maps/api';
import { createCustomMarkerIcon } from './markers';
import { hasWaitingDelivery } from './utils';

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const MapDisplay = ({
  customers = [],
  selectedMarker,
  setSelectedMarker,
  onMapLoad,
  selectedCustomers = [],
  setSelectedCustomers,
  directionsResponse,
  orders = [],
  startLocation,
  endLocation,
  onBoundsChanged,
  calculateRoute
}) => {
  // Handle marker click event
  const handleMarkerClick = (customer) => {
    setSelectedMarker(customer);
    
    // If customer is valid and has lat/lng, add to selected customers
    if (customer?.lat && customer?.lng) {
      const isAlreadySelected = selectedCustomers.some(
        (c) => c.customer_id === customer.customer_id
      );

      if (!isAlreadySelected) {
        setSelectedCustomers([...selectedCustomers, customer]);
      }
    }
  };

  // Formats info window content for a customer
  const renderCustomerInfo = (customer) => {
    const getStatusColor = (weight, thresholds) => {
      if (!weight || !thresholds) return 'text-gray-500';
      if (weight >= thresholds.upper) return 'text-green-600';
      if (weight >= thresholds.lower) return 'text-orange-500';
      return 'text-red-600';
    };

    return (
      <div className="p-2 max-w-xs">
        <div className="font-bold mb-1">{customer.name}</div>
        <div className="text-sm text-gray-600 mb-2">{customer.address}</div>
        {customer.products?.map((product) => (
          <div
            key={product.product_id}
            className="text-sm flex justify-between items-center mb-1"
          >
            <span className="font-medium">{product.name}</span>
            <span className={`${getStatusColor(
              product.measurement?.weight,
              product.thresholds
            )}`}>
              {product.measurement?.weight
                ? `${Math.round(product.measurement.weight)} kg`
                : 'No data'}
            </span>
          </div>
        ))}
        {hasWaitingDelivery(customer, orders) && (
          <div className="mt-2 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
            Pending Delivery
          </div>
        )}
      </div>
    );
  };

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: '100%',
      }}
      zoom={13}
      center={startLocation}
      options={MAP_OPTIONS}
      onLoad={onMapLoad}
      onBoundsChanged={onBoundsChanged}
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
                <p className="text-sm text-gray-600">Route starting location</p>
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
                <p className="text-sm text-gray-600">Route destination</p>
              </div>
            </InfoWindowF>
          )}
        </MarkerF>
      )}

      {/* Render customer markers */}
      {customers.map((customer) => {
        if (!customer?.lat || !customer?.lng) return null;

        const isSelected = selectedCustomers.some(
          (c) => c.customer_id === customer.customer_id
        );

        return (
          <MarkerF
            key={customer.customer_id}
            position={{ lat: customer.lat, lng: customer.lng }}
            onClick={() => handleMarkerClick(customer)}
            icon={createCustomMarkerIcon(
              customer.products?.[0]?.measurement?.weight,
              customer.products?.[0]?.thresholds,
              hasWaitingDelivery(customer, orders),
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

      {/* Render route if available */}
      {directionsResponse && (
        <DirectionsRenderer
          directions={directionsResponse}
          options={{
            suppressMarkers: true, // We'll handle markers ourselves
            polylineOptions: {
              strokeColor: '#4F46E5', // Indigo color for route
              strokeWeight: 5,
              strokeOpacity: 0.8
            }
          }}
        />
      )}
    </GoogleMap>
  );
};

export default MapDisplay;