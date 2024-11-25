import apiService from '../services/api';
import { apiTracker } from './ApiTracker';

export class DirectionsOptimizer {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchInterval = options.batchInterval || 1000;
    this.debounceDelay = options.debounceDelay || 1000;
    this.pendingRequests = new Map();
    this.debounceTimers = new Map();
  }

  getCoordinates(point) {
    if (!point) return null;

    // Handle waypoint format
    if (point.location) {
      const loc = point.location;
      return {
        lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
        lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
      };
    }

    // Handle direct coordinate format
    return {
      lat: typeof point.lat === 'function' ? point.lat() : point.lat,
      lng: typeof point.lng === 'function' ? point.lng() : point.lng
    };
  }

  generateRouteKey(origin, destination, waypoints = []) {
    const originCoords = this.getCoordinates(origin);
    const destCoords = this.getCoordinates(destination);
    
    if (!originCoords || !destCoords) {
      throw new Error('Invalid origin or destination');
    }

    const waypointString = waypoints
      .map(wp => {
        const coords = this.getCoordinates(wp);
        if (!coords) return '';
        return `${coords.lat},${coords.lng}`;
      })
      .filter(Boolean)
      .sort()
      .join('|');

    return `${originCoords.lat},${originCoords.lng}|${destCoords.lat},${destCoords.lng}|${waypointString}`;
  }

  async getDirections(origin, destination, waypoints = [], options = {}) {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }

    try {
      const routeKey = this.generateRouteKey(origin, destination, waypoints);
      
      if (this.pendingRequests.has(routeKey)) {
        return this.pendingRequests.get(routeKey);
      }

      apiTracker.trackApiCall('directions', 'GET');

      const defaultOptions = {
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      };

      const routePromise = apiService.getDirections({
        origin: this.getCoordinates(origin),
        destination: this.getCoordinates(destination),
        waypoints: waypoints.map(wp => ({
          location: this.getCoordinates(wp),
          stopover: wp.stopover ?? true
        })),
        options: { ...defaultOptions, ...options }
      });

      this.pendingRequests.set(routeKey, routePromise);

      const result = await routePromise;
      this.pendingRequests.delete(routeKey);

      return this.transformDirectionsResponse(result);

    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  transformDirectionsResponse(serverResponse) {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }

    if (!serverResponse || !serverResponse.routes || !serverResponse.routes.length) {
      return {
        routes: [],
        status: 'ZERO_RESULTS'
      };
    }

    return {
      routes: serverResponse.routes.map(route => ({
        ...route,
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(
            route.bounds.south,
            route.bounds.west
          ),
          new window.google.maps.LatLng(
            route.bounds.north,
            route.bounds.east
          )
        ),
        legs: route.legs?.map(leg => ({
          ...leg,
          start_location: new window.google.maps.LatLng(
            leg.start_location.lat, 
            leg.start_location.lng
          ),
          end_location: new window.google.maps.LatLng(
            leg.end_location.lat, 
            leg.end_location.lng
          ),
          steps: leg.steps?.map(step => ({
            ...step,
            start_location: new window.google.maps.LatLng(
              step.start_location.lat, 
              step.start_location.lng
            ),
            end_location: new window.google.maps.LatLng(
              step.end_location.lat, 
              step.end_location.lng
            ),
            path: step.path?.map(point => 
              new window.google.maps.LatLng(point.lat, point.lng)
            )
          }))
        })),
        overview_path: route.overview_path?.map(point =>
          new window.google.maps.LatLng(point.lat, point.lng)
        )
      })),
      status: serverResponse.status
    };
  }

  getDebouncedDirections(origin, destination, waypoints = [], options = {}) {
    const routeKey = this.generateRouteKey(origin, destination, waypoints);

    if (this.debounceTimers.has(routeKey)) {
      clearTimeout(this.debounceTimers.get(routeKey));
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          const result = await this.getDirections(origin, destination, waypoints, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
        this.debounceTimers.delete(routeKey);
      }, this.debounceDelay);

      this.debounceTimers.set(routeKey, timer);
    });
  }

  cancelAll() {
    this.pendingRequests.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

export const directionsOptimizer = new DirectionsOptimizer();