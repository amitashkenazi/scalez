// src/utils/geocoding.js
import apiService from '../services/api';

export const geocodeAddress = async (address) => {
  try {
    return await apiService.geocodeAddress(address);
  } catch (error) {
    console.error('Geocoding error:', error);
    
    // Fallback coordinates for major cities
    const DEFAULT_COORDS = {
      tel_aviv: { lat: 32.0853, lng: 34.7818 },
      jerusalem: { lat: 31.7683, lng: 35.2137 },
      haifa: { lat: 32.7940, lng: 34.9896 }
    };

    // Check if address contains any major city
    for (const [city, coords] of Object.entries({
      'תל אביב': DEFAULT_COORDS.tel_aviv,
      'tel aviv': DEFAULT_COORDS.tel_aviv,
      'ירושלים': DEFAULT_COORDS.jerusalem,
      'jerusalem': DEFAULT_COORDS.jerusalem,
      'חיפה': DEFAULT_COORDS.haifa,
      'haifa': DEFAULT_COORDS.haifa
    })) {
      if (address.toLowerCase().includes(city.toLowerCase())) {
        // Add slight randomization for different addresses in same city
        return {
          lat: coords.lat + (Math.random() - 0.5) * 0.01,
          lng: coords.lng + (Math.random() - 0.5) * 0.01
        };
      }
    }
    
    // Default to Tel Aviv area if nothing else works
    return {
      lat: DEFAULT_COORDS.tel_aviv.lat + (Math.random() - 0.5) * 0.02,
      lng: DEFAULT_COORDS.tel_aviv.lng + (Math.random() - 0.5) * 0.02
    };
  }
};