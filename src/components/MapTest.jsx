import React, { useEffect, useRef } from 'react';
import { GoogleMap, useLoadScript } from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';

const center = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv coordinates

const MAP_OPTIONS = {
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

// Define container style outside component
const containerStyle = {
  width: '100%',
  height: '600px'
};

const MapTest = () => {
  const mapRef = useRef(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  // Debug logging
  useEffect(() => {
    console.log('Map loading status:', { isLoaded, loadError });
    console.log('API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.slice(0, 8) + '...');
    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing!');
    }
  }, [isLoaded, loadError]);

  const onLoad = React.useCallback((map) => {
    mapRef.current = map;
    console.log('Map loaded successfully');
  }, []);

  const onUnmount = React.useCallback(() => {
    mapRef.current = null;
  }, []);

  if (loadError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <p className="text-red-700 font-medium">Error loading Google Maps</p>
            <p className="text-red-600">{loadError.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading Google Maps...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Google Maps Test</h2>
        
        <div className="rounded-lg overflow-hidden" style={containerStyle}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            zoom={13}
            center={center}
            options={MAP_OPTIONS}
            onLoad={onLoad}
            onUnmount={onUnmount}
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Debug Information:</h3>
          <pre className="text-sm text-gray-600 overflow-auto">
            {JSON.stringify({
              isLoaded,
              apiKeyPresent: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
              apiKeyPrefix: process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.slice(0, 8) + '...',
              center,
              mapRef: !!mapRef.current
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MapTest;