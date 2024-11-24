import apiService from './api';

export const mapsService = {
  async geocodeAddress(address) {
    try {
      const response = await apiService.request('maps/geocode', {
        method: 'POST',
        body: JSON.stringify({ address })
      });
      return response;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  },

  async getDirections(origin, destination, waypoints) {
    try {
      const response = await apiService.request('maps/directions', {
        method: 'POST',
        body: JSON.stringify({
          origin,
          destination,
          waypoints
        })
      });
      return response;
    } catch (error) {
      console.error('Directions error:', error);
      throw error;
    }
  }
};