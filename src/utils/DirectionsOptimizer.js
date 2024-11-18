// src/utils/DirectionsOptimizer.js

import { apiTracker } from './ApiTracker';

export class DirectionsOptimizer {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.batchInterval = options.batchInterval || 1000;
    this.debounceDelay = options.debounceDelay || 1000;
    
    this.queue = [];
    this.processing = false;
    this.pendingRequests = new Map();
    this.debounceTimers = new Map();
    this.lastRequestTimes = new Map();
    this.minRequestInterval = options.minRequestInterval || 5000; // 5 seconds minimum between same route requests
  }

  generateRouteKey(origin, destination, waypoints = []) {
    const waypointString = waypoints
      .map(wp => `${wp.location.lat()},${wp.location.lng()}`)
      .sort()
      .join('|');
      
    return `${origin.lat()},${origin.lng()}|${destination.lat()},${destination.lng()}|${waypointString}`;
  }

  async getDirections(origin, destination, waypoints = [], options = {}) {
    if (!window.google) {
      throw new Error('Google Maps not loaded');
    }

    const routeKey = this.generateRouteKey(origin, destination, waypoints);
    const now = Date.now();

    // Check if we've made this request recently
    const lastRequestTime = this.lastRequestTimes.get(routeKey);
    if (lastRequestTime && (now - lastRequestTime) < this.minRequestInterval) {
      console.log('Skipping route calculation - too frequent');
      return this.pendingRequests.get(routeKey) || Promise.reject(new Error('Too many requests'));
    }

    // Update last request time
    this.lastRequestTimes.set(routeKey, now);

    // Check for pending request
    if (this.pendingRequests.has(routeKey)) {
      return this.pendingRequests.get(routeKey);
    }

    // Clean up old request times
    const tenMinutesAgo = now - (10 * 60 * 1000);
    this.lastRequestTimes.forEach((time, key) => {
      if (time < tenMinutesAgo) {
        this.lastRequestTimes.delete(key);
      }
    });

    const request = {
      origin,
      destination,
      waypoints,
      optimizeWaypoints: true,
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS
      },
      ...options
    };

    const routePromise = new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject,
        routeKey
      });

      if (!this.processing) {
        this.processQueue();
      }
    });

    this.pendingRequests.set(routeKey, routePromise);

    routePromise.finally(() => {
      this.pendingRequests.delete(routeKey);
    });

    return routePromise;
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0 || !window.google) return;
    
    this.processing = true;
    const directionsService = new window.google.maps.DirectionsService();

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        
        const results = await Promise.all(
          batch.map(async ({ request, resolve, reject }) => {
            try {
              apiTracker.trackGoogleMapsCall('DirectionsService', 'route');
              const result = await directionsService.route(request);
              resolve(result);
              return result;
            } catch (error) {
              reject(error);
              throw error;
            }
          })
        );

        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.batchInterval));
        }
      }
    } catch (error) {
      console.error('Error processing directions batch:', error);
    } finally {
      this.processing = false;
    }
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
    this.queue = [];
    this.pendingRequests.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.lastRequestTimes.clear();
    this.processing = false;
  }

  isGoogleMapsAvailable() {
    return window.google && window.google.maps;
  }

  getQueueLength() {
    return this.queue.length;
  }

  getPendingRequestsCount() {
    return this.pendingRequests.size;
  }
}

export const directionsOptimizer = new DirectionsOptimizer();