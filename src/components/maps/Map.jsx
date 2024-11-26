import React, { useEffect } from 'react';
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { createCustomMarkerIcon } from './markers';
import { useMap } from '../../contexts/MapContext';

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
  selectedCustomers = [],
  measurements = {}
}) => {
  const { setMapInstance, mapInstance } = useMap();

  // Fit bounds to include all customers
  useEffect(() => {
    if (mapInstance && customers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      customers.forEach(customer => {
        if (customer.lat && customer.lng) {
          bounds.extend({ lat: customer.lat, lng: customer.lng });
        }
      });

      // Add some padding around the bounds
      mapInstance.fitBounds(bounds, {
        padding: {
          top: 150,
          right: 150,
          bottom: 150,
          left: 150
        }
      });
    }
  }, [mapInstance, customers]);

  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const renderCustomerInfo = (customer) => {
    const firstProduct = customer.products?.[0];
    const measurement = firstProduct?.scale_id ? measurements[firstProduct.scale_id] : null;
  
    const handleNavigate = (e) => {
      e.stopPropagation();
      const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(customer.address)}`;
      window.open(wazeUrl, '_blank', 'noopener,noreferrer');
    };
  
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
        <button
          onClick={handleNavigate}
          className="mt-3 w-full px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
          Navigate
        </button>
      </div>
    );
  };

  return (
    <GoogleMap
      mapContainerClassName="rounded-lg"
      mapContainerStyle={{ height: '600px', width: '100%' }}
      center={{ lat: 32.0853, lng: 34.7818 }} // Default center, will be overridden by bounds
      zoom={13} // Default zoom, will be overridden by bounds
      options={MAP_OPTIONS}
      onLoad={handleMapLoad}
    >
      {/* Customer Markers */}
      {customers.map((customer) => {
        const isSelected = selectedCustomers.some(c => c.customer_id === customer.customer_id);
        const firstProduct = customer.products?.[0];
        const measurement = firstProduct?.scale_id ? measurements[firstProduct.scale_id] : null;

        return (
          <MarkerF
            key={customer.customer_id}
            position={{ lat: customer.lat, lng: customer.lng }}
            onClick={() => setSelectedMarker(customer)}
            icon={createCustomMarkerIcon(
              measurement?.weight,
              firstProduct?.thresholds,
              false,
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
    </GoogleMap>
  );
};

export default Map;