import { tokenService } from './tokenService';
import { AuthenticationException } from './exceptions';
import { apiTracker } from '../utils/ApiTracker';

class ApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100';
    this.retryCount = 1;
    this.retryDelay = 1000;

    window.addEventListener('auth:required', () => {
      this.handleAuthRequired();
    });
  }

  handleAuthRequired() {
    tokenService.clearTokens();
    localStorage.removeItem('userData');
    window.location.href = '/?authRequired=true';
  }

  async getHeaders() {
    try {
      const idToken = await tokenService.refreshTokenIfNeeded();
      
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : '',
      };
    } catch (error) {
      console.error('Error getting headers:', error);
      tokenService.clearTokens();
      return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
    }
  }
        
  normalizePath(path) {
    const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
    return cleanPath ? `/${cleanPath}` : '';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async request(endpoint, options = {}, retryCount = this.retryCount) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    
    // Track API call
    apiTracker.trackApiCall(endpoint, options.method || 'GET');
    
    try {
      // Always try to refresh token before making request
      const idToken = await tokenService.refreshTokenIfNeeded();
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : '',
        ...options.headers,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');
        
        try {
          const newIdToken = await tokenService.refreshTokenIfNeeded();
          
          if (!newIdToken) {
            throw new AuthenticationException('Failed to refresh token');
          }

          headers.Authorization = `Bearer ${newIdToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          
          if (!retryResponse.ok) {
            throw new AuthenticationException('Authentication required');
          }
          
          return this.parseResponse(retryResponse);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          window.dispatchEvent(new Event('auth:required'));
          throw new AuthenticationException('Authentication required');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return this.parseResponse(response);
    } catch (error) {
      if (error instanceof AuthenticationException) {
        window.dispatchEvent(new Event('auth:required'));
        throw error;
      }
      
      if (error.name === 'TypeError' && retryCount > 0) {
        await this.sleep(this.retryDelay);
        return this.request(endpoint, options, retryCount - 1);
      }
      
      throw error;
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
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

  async deleteCustomer(customerId) {
    return this.request(`customers/${customerId}`, {
      method: 'DELETE'
    });
  }

  // Product APIs
  async getProducts() {
    return this.request('products', {
      method: 'GET'
    });
  }

  async getProduct(productId) {
    return this.request(`products/${productId}`, {
      method: 'GET'
    });
  }

  async createProduct(productData) {
    return this.request('products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(productId, productData) {
    return this.request(`products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(productId) {
    return this.request(`products/${productId}`, {
      method: 'DELETE'
    });
  }

  async getProductsByCustomer(customerId) {
    return this.request(`products/customer/${customerId}`, {
      method: 'GET'
    });
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
    return this.request('scales/register', {
      method: 'POST',
      body: JSON.stringify(scaleData)
    });
  }

  async deleteScale(scaleId) {
    return this.request(`scales/${scaleId}`, {
      method: 'DELETE'
    });
  }

  // Vendor APIs
  async getVendors() {
    return this.request('vendors', {
      method: 'GET'
    });
  }
  
  async getVendor(vendorId) {
    return this.request(`vendors/${vendorId}`, {
      method: 'GET'
    });
  }
  
  async createVendor(vendorData) {
    return this.request('vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData)
    });
  }
  
  async updateVendor(vendorId, vendorData) {
    return this.request(`vendors/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData)
    });
  }
  
  async deleteVendor(vendorId) {
    return this.request(`vendors/${vendorId}`, {
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

  // Health check API
  async checkHealth() {
    try {
      await this.request('health', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;