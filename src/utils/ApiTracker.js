// src/utils/ApiTracker.js

export class ApiTracker {
    constructor() {
      this.apiCalls = new Map();
      this.googleMapsCalls = new Map();
      this.totalApiCalls = 0;
      this.totalGoogleMapsCalls = 0;
    }
  
    trackApiCall(endpoint, method) {
      const key = `${method} ${endpoint}`;
      const currentCount = this.apiCalls.get(key) || 0;
      this.apiCalls.set(key, currentCount + 1);
      this.totalApiCalls++;
      this.logApiStats();
    }
  
    trackGoogleMapsCall(service, method) {
      const key = `${service}.${method}`;
      const currentCount = this.googleMapsCalls.get(key) || 0;
      this.googleMapsCalls.set(key, currentCount + 1);
      this.totalGoogleMapsCalls++;
      this.logApiStats();
    }
  
    reset() {
      this.apiCalls.clear();
      this.googleMapsCalls.clear();
      this.totalApiCalls = 0;
      this.totalGoogleMapsCalls = 0;
    }
  
    logApiStats() {
      console.group('API Call Statistics');
      
      console.log('\nServer API Calls:', this.totalApiCalls);
      this.apiCalls.forEach((count, endpoint) => {
        console.log(`  ${endpoint}: ${count}`);
      });
  
      console.log('\nGoogle Maps API Calls:', this.totalGoogleMapsCalls);
      this.googleMapsCalls.forEach((count, service) => {
        console.log(`  ${service}: ${count}`);
      });
  
      console.groupEnd();
    }
  
    getStats() {
      return {
        serverApi: {
          total: this.totalApiCalls,
          breakdown: Object.fromEntries(this.apiCalls)
        },
        googleMaps: {
          total: this.totalGoogleMapsCalls,
          breakdown: Object.fromEntries(this.googleMapsCalls)
        }
      };
    }
  }
  
  export const apiTracker = new ApiTracker();