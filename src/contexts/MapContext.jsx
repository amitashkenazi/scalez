import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  const [mapInstance, setMapInstance] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [currentBounds, setCurrentBounds] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const value = {
    mapInstance,
    setMapInstance,
    directionsResponse,
    setDirectionsResponse,
    selectedMarker,
    setSelectedMarker,
    currentBounds,
    setCurrentBounds,
    isMapLoaded,
    setIsMapLoaded
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}