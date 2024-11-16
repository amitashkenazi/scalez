import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';

const LocationSelector = ({ 
  label, 
  defaultLocation,
  defaultAddress,
  onLocationSelect,
  isRequired = true,
  className = ''
}) => {
  const [address, setAddress] = useState(defaultAddress || '');
  const [location, setLocation] = useState(defaultLocation);
  const [autocomplete, setAutocomplete] = useState(null);
  const inputRef = useRef(null);

  const handlePlaceSelect = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (place.geometry && place.geometry.location) {
        const newLocation = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setLocation(newLocation);
        setAddress(place.formatted_address);
        onLocationSelect(newLocation, place.formatted_address);
      }
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setAddress('');
    onLocationSelect(null, '');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {isRequired && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <Autocomplete
          onLoad={setAutocomplete}
          onPlaceChanged={handlePlaceSelect}
          restrictions={{ country: 'il' }}
        >
          <input
            ref={inputRef}
            type="text"
            defaultValue={address}
            className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter address..."
          />
        </Autocomplete>
        
        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        
        {address && (
          <button
            onClick={clearLocation}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {location && (
        <div className="mt-1 text-sm text-gray-500">
          {`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}
        </div>
      )}
    </div>
  );
};

export default LocationSelector;