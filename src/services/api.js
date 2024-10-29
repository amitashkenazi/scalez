// src/services/api.js

class ApiService {
    constructor() {
        // Remove any trailing slashes
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100';
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        console.log('API Service initialized with base URL:', this.baseUrl);
        }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return headers;
        }

        normalizePath(path) {
        // Remove multiple slashes and ensure single leading slash
        return '/' + path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
        }
  // Token Management
  setToken(token) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    try {
      const normalizedEndpoint = this.normalizePath(`api/${endpoint}`);
      const url = `${this.baseUrl}${normalizedEndpoint}`;
      
      console.log('Making request to:', url);

      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
        // Include credentials if needed
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }
  // Customer APIs
  async getCustomers() {
    return this.request('customers');
  }

  async getCustomer(customerId) {
    return this.request(`customers/${customerId}`);
  }

  async createCustomer(customerData) {
    return this.request('customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  async updateCustomer(customerId, customerData) {
    return this.request(`/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  // Vendor APIs
  async getVendors() {
    return this.request('/vendors');
  }

  async getVendor(vendorId) {
    return this.request(`/vendors/${vendorId}`);
  }

  async createVendor(vendorData) {
    return this.request('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData)
    });
  }

  async linkCustomerVendor(linkData) {
    return this.request('/vendors/link', {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  }

  // Scale APIs
  async getScales() {
    return this.request('/scales');
  }

  async getScale(scaleId) {
    return this.request(`/scales/${scaleId}`);
  }

  async createScale(scaleData) {
    return this.request('/scales', {
      method: 'POST',
      body: JSON.stringify(scaleData)
    });
  }

  async linkScaleProduct(linkData) {
    return this.request('/scales/link-product', {
      method: 'POST',
      body: JSON.stringify(linkData)
    });
  }

  // Measurement APIs
  async getMeasurements(customerId) {
    return this.request(`/measurements/customer/${customerId}`);
  }

  async getScaleMeasurements(scaleId) {
    return this.request(`/measurements/scale/${scaleId}`);
  }

  async createMeasurement(measurementData) {
    return this.request('/measurements', {
      method: 'POST',
      body: JSON.stringify(measurementData)
    });
  }

  // Authentication APIs (for future Cognito integration)
  async login(credentials) {
    try {
      // This is a placeholder for Cognito authentication
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });

      if (response?.token) {
        this.setToken(response.token);
      }

      return response;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST'
      });
    } finally {
      this.clearToken();
    }
  }

  // Cognito specific methods (to be implemented)
  async refreshToken(refreshToken) {
    // Implement Cognito token refresh logic
  }

  async validateToken() {
    // Implement Cognito token validation logic
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;