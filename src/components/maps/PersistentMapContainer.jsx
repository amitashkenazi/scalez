import React, { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Loader2, AlertCircle } from 'lucide-react';
import { useMap } from '../../contexts/MapContext';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];

const PersistentMapContainer = ({ children, className = "" }) => {
  const { isMapLoaded, setIsMapLoaded } = useMap();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES
  });

  const mapContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isLoaded && !isMapLoaded) {
      setIsMapLoaded(true);
    }
  }, [isLoaded, isMapLoaded, setIsMapLoaded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      if (mapContainerRef.current) {
        observer.unobserve(mapContainerRef.current);
      }
    };
  }, []);

  if (loadError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-400 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-700">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div 
      ref={mapContainerRef}
      className={className}
      style={{ 
        display: isVisible ? 'block' : 'none',
        minHeight: '400px'
      }}
    >
      {children}
    </div>
  );
};

export default PersistentMapContainer;