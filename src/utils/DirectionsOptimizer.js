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
        lat: typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat),
        lng: typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng)
      };
    }

    // Handle direct coordinate format
    return {
      lat: typeof point.lat === 'function' ? point.lat() : Number(point.lat),
      lng: typeof point.lng === 'function' ? point.lng() : Number(point.lng)
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

  async getDirections({ origin, destination, waypoints = [], options = {} }) {
  try {
    console.log('Requesting optimized route:', {
      origin,
      destination,
      waypoints,
      options
    });

    // Include all stops as waypoints except origin
    const allWaypoints = waypoints.map(wp => ({
      location: wp.location || wp,
      stopover: true
    }));

    const response = await this.request('maps/optimize-route', {
      method: 'POST',
      body: JSON.stringify({
        origin,
        destination: origin, // For round trip
        waypoints: allWaypoints,
        return_to_origin: true
      })
    });

    console.log('Optimized route response:', response);
    return response;
  } catch (error) {
    console.error('Error getting optimized route:', error);
    throw error;
  }
}

  transformDirectionsResponse(serverResponse, request) {
    if (!window.google || !serverResponse || !serverResponse.routes || !serverResponse.routes.length) {
      return {
        routes: [],
        status: 'ZERO_RESULTS'
      };
    }

    try {
      const transformedResponse = {
        geocoded_waypoints: serverResponse.geocoded_waypoints || [],
        routes: serverResponse.routes.map(route => {
          // Create proper bounds
          const bounds = new window.google.maps.LatLngBounds();
          if (route.bounds) {
            bounds.extend(new window.google.maps.LatLng(
              Number(route.bounds.southwest.lat),
              Number(route.bounds.southwest.lng)
            ));
            bounds.extend(new window.google.maps.LatLng(
              Number(route.bounds.northeast.lat),
              Number(route.bounds.northeast.lng)
            ));
          }

          return {
            bounds,
            copyrights: route.copyrights,
            legs: route.legs?.map(leg => ({
              distance: leg.distance,
              duration: leg.duration,
              end_address: leg.end_address,
              start_address: leg.start_address,
              end_location: new window.google.maps.LatLng(
                Number(leg.end_location.lat),
                Number(leg.end_location.lng)
              ),
              start_location: new window.google.maps.LatLng(
                Number(leg.start_location.lat),
                Number(leg.start_location.lng)
              ),
              steps: leg.steps?.map(step => ({
                distance: step.distance,
                duration: step.duration,
                instructions: step.html_instructions,
                travel_mode: window.google.maps.TravelMode.DRIVING,
                maneuver: step.maneuver,
                path: this.decodePolyline(step.polyline?.points || ""),
                start_location: new window.google.maps.LatLng(
                  Number(step.start_location.lat),
                  Number(step.start_location.lng)
                ),
                end_location: new window.google.maps.LatLng(
                  Number(step.end_location.lat),
                  Number(step.end_location.lng)
                )
              }))
            })),
            overview_path: this.decodePolyline(route.overview_polyline?.points || ""),
            warnings: route.warnings || [],
            waypoint_order: route.waypoint_order || [],
            overview_polyline: route.overview_polyline || { points: "" }
          };
        }),
        status: serverResponse.status,
        request: {
          origin: request.origin,
          destination: request.destination,
          travelMode: request.travelMode,
          optimizeWaypoints: true
        }
      };

      return transformedResponse;
    } catch (error) {
      console.error('Error transforming directions response:', error);
      throw error;
    }
  }

  // Helper function to decode polyline points
  decodePolyline(encoded) {
    if (!encoded) return [];
    
    const poly = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      const point = new window.google.maps.LatLng(lat * 1e-5, lng * 1e-5);
      poly.push(point);
    }

    return poly;
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