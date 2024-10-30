// src/services/api.js

class ApiService {
    constructor() {
      // Remove any trailing slashes
      this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100';
      this.retryCount = 1;
      this.retryDelay = 1000;
    }
  
    getHeaders() {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
  
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
  
      return headers;
    }
  
    normalizePath(path) {
        // Remove leading/trailing slashes and normalize multiple slashes
        const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
        return cleanPath ? `/${cleanPath}` : '';
      }
    
  
    // Token Management
    setToken(token) {
      this.token = token;
    }
  
    clearToken() {
      this.token = null;
    }
  
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
    debug(message, ...args) {
        console.log(`[API Debug] ${message}`, ...args);
        }
  
    // Generic request handler
    async request(endpoint, options = {}, retryCount = this.retryCount) {
        const url = `${this.baseUrl}/api/${endpoint.replace(/^\/+/, '')}`;
        this.debug('Making request:', {
          url,
          method: options.method || 'GET',
          headers: options.headers,
          body: options.body,
        });
    
        const defaultOptions = {
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        };
    
        const finalOptions = {
          ...defaultOptions,
          ...options,
          headers: {
            ...defaultOptions.headers,
            ...options.headers,
          },
        };
    
        this.debug('Final request options:', finalOptions);
    
        try {
          this.debug('Sending fetch request...');
          const response = await fetch(url, finalOptions);
          
          this.debug('Response received:', {
            status: response.status,
            statusText: response.statusText,
            headers: Array.from(response.headers.entries()),
            ok: response.ok,
            type: response.type,
          });
    
          if (response.ok) {
            const contentType = response.headers.get('content-type');
            let data;
            if (contentType?.includes('application/json')) {
              data = await response.json();
              this.debug('Parsed JSON response:', data);
            } else {
              data = await response.text();
              this.debug('Received text response:', data);
            }
            return data;
          } else {
            this.debug('Response not OK:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        } catch (error) {
          this.debug('Request failed:', {
            error,
            name: error.name,
            message: error.message,
            stack: error.stack
          });
    
          if (error.name === 'TypeError' && retryCount > 0) {
            this.debug(`Retrying request, ${retryCount} attempts remaining`);
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            return this.request(endpoint, options, retryCount - 1);
          }
          throw error;
        }
      }
  
    // Scale APIs
    async getScales() {
      return this.request('scales', {
        method: 'GET'
      });
    }
  
    async getScale(scaleId) {
      return this.request(`scales/${scaleId}`, {
        method: 'GET'
      });
    }
  
    async updateScale(scaleId, scaleData) {
      return this.request(`scales/${scaleId}`, {
        method: 'PUT',
        body: JSON.stringify(scaleData)
      });
    }
  
    async createScale(scaleData) {
      return this.request('scales', {
        method: 'POST',
        body: JSON.stringify(scaleData)
      });
    }
  
    async deleteScale(scaleId) {
      return this.request(`scales/${scaleId}`, {
        method: 'DELETE'
      });
    }
  
    // Measurement APIs
    async getScaleMeasurements(scaleId, startDate, endDate) {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      return this.request(`measurements/scale/${scaleId}?${queryParams}`, {
        method: 'GET'
      });
    }
  
    // Customer APIs
    async getCustomers() {
      return this.request('customers', {
        method: 'GET'
      });
    }
  
    async getCustomer(customerId) {
      return this.request(`customers/${customerId}`, {
        method: 'GET'
      });
    }
  
    async createCustomer(customerData) {
      return this.request('customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
    }
  
    async updateCustomer(customerId, customerData) {
      return this.request(`customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(customerData)
      });
    }
  }
  
  // Create a singleton instance
  const apiService = new ApiService();
  export default apiService;