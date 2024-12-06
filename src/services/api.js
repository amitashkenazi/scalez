
import { tokenService } from './tokenService';
import { AuthenticationException } from './exceptions';
import { apiTracker } from '../utils/ApiTracker';

/** 
 * ApiService class provides methods to interact with the backend API.
 * It handles authentication, retries on failure, and parsing responses.
 * It includes methods for CRUD operations on customers, products, scales, and vendors,
 * as well as methods to get scale measurements and check the health of the API.
 
 * ApiService class to handle API requests and responses.
 * This service includes methods for handling authentication, making requests, and parsing responses.
 * It also provides methods for CRUD operations on customers, products, scales, and vendors.
 */
class ApiService {
  /**
   * Constructor to initialize the ApiService.
   * Sets the base URL, retry count, and retry delay.
   * Adds an event listener for authentication required events.
   */
  constructor() {
    console.log('Environment variables:', {
      NODE_ENV: process.env.NODE_ENV,
      REACT_APP_API_URL: process.env.REACT_APP_API_URL,
      All_ENV: process.env
    });
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100';
    this.retryCount = 1;
    this.retryDelay = 1000;

    window.addEventListener('auth:required', () => {
      this.handleAuthRequired();
    });
  }

  /**
   * Generate products for an item
   * @param {string} itemId - The ID of the item to generate products for
   * @returns {Promise<Object>} A promise that resolves to the generation result
   */
  async generateProductsForItem(itemId) {
    return this.request(`items/${itemId}/generate-products`, {
      method: 'POST'
    });
  }
  

  /**
   * Handles the authentication required event.
   * Clears tokens, removes user data from local storage, and redirects to the login page.
   */
  handleAuthRequired() {
    tokenService.clearTokens();
    localStorage.removeItem('userData');
    window.location.href = '/?authRequired=true';
  }

  /**
   * Gets headers for the request, including the authorization token if available.
   * @returns {Promise<Object>} A promise that resolves to an object containing the headers.
   */
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

  /**
   * Normalizes the API path by removing leading and trailing slashes and replacing multiple slashes with a single slash.
   * @param {string} path - The API path to normalize.
   * @returns {string} The normalized path.
   */
  normalizePath(path) {
    const cleanPath = path.replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/');
    return cleanPath ? `/${cleanPath}` : '';
  }

  /**
   * Gets all items
   * @returns {Promise<Object[]>} A promise that resolves to an array of item objects
   */
  async getItems() {
    return this.request('items', {
      method: 'GET'
    });
  }
  /**
   * Gets a specific item by ID
   * @param {string} itemId - The ID of the item to retrieve
   * @returns {Promise<Object>} A promise that resolves to the item object
   */
  async getItem(itemId) {
    return this.request(`items/${itemId}`, {
      method: 'GET'
    });
  }

  /**
   * Generate products for an item
   * @param {string} itemId - The ID of the item to generate products for
   * @returns {Promise<Object>} A promise that resolves to the generation result
   */
  async generateProducts(itemId) {
    return this.request(`items/${itemId}/generate-products`, {
      method: 'POST'
    });
  }

  /**
   * Sleeps for a specified duration.
   * @param {number} ms - The duration to sleep in milliseconds.
   * @returns {Promise<void>} A promise that resolves after the specified duration.
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all integrations
  getIntegrations() {
    return this.request('integrations', {
      method: 'GET'
    });
  }
  
  connectIntegration(integrationId, credentials) {
    return this.request(`integrations/${integrationId}/connect`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Disconnect an integration
  disconnectIntegration(integrationId) {
    return this.request(`integrations/${integrationId}/disconnect`, {
      method: 'POST'
    });
  }

  /**
   * Makes an API request with optional retry logic.
   * @param {string} endpoint - The API endpoint to request.
   * @param {Object} [options={}] - The options for the request, including method, headers, and body.
   * @param {number} [retryCount=this.retryCount] - The number of times to retry the request in case of failure.
   * @returns {Promise<Object|string>} A promise that resolves to the parsed response from the API.
   * @throws {Error} Throws an error if the request fails after the specified number of retries.
   */
  async request(endpoint, options = {}, retryCount = this.retryCount) {
    const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    console.log('request: ', url, 'method', options.method); // Debug log
    apiTracker.trackApiCall(endpoint, options.method || 'GET');
    try {
      const idToken = await tokenService.refreshTokenIfNeeded();
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : '',
        ...options.headers,
      };
      const response = await fetch(url, { ...options, headers });
      console.log('response: ', response); // Debug log
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

  /**
   * Gets the latest measurement for a specific scale.
   * @param {string} scaleId - The ID of the scale to get measurements for
   * @returns {Promise<Object>} A promise that resolves to the latest measurement
   * @throws {Error} If scaleId is missing or invalid, or if the request fails
   */
  async getLatestMeasurement(scaleId) {
    if (!scaleId) {
      throw new Error('Scale ID is required to fetch latest measurement');
    }

    try {
      console.log('get latest measurement: scaleid: ', scaleId); // Debug log
      return await this.request(`measures/scale/${scaleId}/latest`, {
        method: 'GET'
      });
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`No measurements found for scale ${scaleId}`);
      }
      throw error;
    }
  }


  /**
   * Parses the response from the API.
   * @param {Response} response - The response object from the fetch request.
   * @returns {Promise<Object|string>} A promise that resolves to the parsed response, either as JSON or text.
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return response.text();
  }

  /**
   * Gets all customers.
   * @returns {Promise<Object[]>} A promise that resolves to an array of customer objects.
   */
  async getCustomers() {
    return this.request('customers', {
      method: 'GET'
    });
  }

  /**
   * Gets a specific customer by ID.
   * @param {string} customerId - The ID of the customer to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the customer object.
   */
  async getCustomer(customerId) {
    return this.request(`customers/${customerId}`, {
      method: 'GET'
    });
  }

  /**
   * Creates a new customer.
   * @param {Object} customerData - The data for the new customer.
   * @returns {Promise<Object>} A promise that resolves to the created customer object.
   */
  async createCustomer(customerData) {
    return this.request('customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * Updates an existing customer.
   * @param {string} customerId - The ID of the customer to update.
   * @param {Object} customerData - The updated data for the customer.
   * @returns {Promise<Object>} A promise that resolves to the updated customer object.
   */
  async updateCustomer(customerId, customerData) {
    return this.request(`customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData)
    });
  }

  /**
   * Deletes a customer.
   * @param {string} customerId - The ID of the customer to delete.
   * @returns {Promise<void>} A promise that resolves when the customer is deleted.
   */
  async deleteCustomer(customerId) {
    return this.request(`customers/${customerId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gets all products.
   * @returns {Promise<Object[]>} A promise that resolves to an array of product objects.
   */
  async getProducts() {
    return this.request('products', {
      method: 'GET'
    });
  }

  /**
   * Gets a specific product by ID.
   * @param {string} productId - The ID of the product to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the product object.
   */
  async getProduct(productId) {
    return this.request(`products/${productId}`, {
      method: 'GET'
    });
  }

  /**
   * Creates a new product.
   * @param {Object} productData - The data for the new product.
   * @returns {Promise<Object>} A promise that resolves to the created product object.
   */
  async createProduct(productData) {
    return this.request('products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Updates an existing product.
   * @param {string} productId - The ID of the product to update.
   * @param {Object} productData - The updated data for the product.
   * @returns {Promise<Object>} A promise that resolves to the updated product object.
   */
  async updateProduct(productId, productData) {
    return this.request(`products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  }

  /**
   * Deletes a product.
   * @param {string} productId - The ID of the product to delete.
   * @returns {Promise<void>} A promise that resolves when the product is deleted.
   */
  async deleteProduct(productId) {
    return this.request(`products/${productId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gets products by customer ID.
   * @param {string} customerId - The ID of the customer whose products to retrieve.
   * @returns {Promise<Object[]>} A promise that resolves to an array of product objects.
   */
  async getProductsByCustomer(customerId) {
    return this.request(`products/customer/${customerId}`, {
      method: 'GET'
    });
  }

  /**
   * Gets all scales.
   * @returns {Promise<Object[]>} A promise that resolves to an array of scale objects.
   */
  async getScales() {
    return this.request('scales', {
      method: 'GET'
    });
  }

  /**
   * Gets a specific scale by ID.
   * @param {string} scaleId - The ID of the scale to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the scale object.
   */
  async getScale(scaleId) {
    return this.request(`scales/${scaleId}`, {
      method: 'GET'
    });
  }

  /**
   * Updates an existing scale.
   * @param {string} scaleId - The ID of the scale to update.
   * @param {Object} scaleData - The updated data for the scale.
   * @returns {Promise<Object>} A promise that resolves to the updated scale object.
   */
  async updateScale(scaleId, scaleData) {
    return this.request(`scales/${scaleId}`, {
      method: 'PUT',
      body: JSON.stringify(scaleData)
    });
  }

  /**
   * Creates a new scale.
   * @param {Object} scaleData - The data for the new scale.
   * @returns {Promise<Object>} A promise that resolves to the created scale object.
   */
  async createScale(scaleData) {
    return this.request('scales/register', {
      method: 'POST',
      body: JSON.stringify(scaleData)
    });
  }

  /**
   * Deletes a scale.
   * @param {string} scaleId - The ID of the scale to delete.
   * @returns {Promise<void>} A promise that resolves when the scale is deleted.
   */
  async deleteScale(scaleId) {
    return this.request(`scales/${scaleId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gets all vendors.
   * @returns {Promise<Object[]>} A promise that resolves to an array of vendor objects.
   */
  async getVendors() {
    return this.request('vendors', {
      method: 'GET'
    });
  }

  /**
   * Gets a specific vendor by ID.
   * @param {string} vendorId - The ID of the vendor to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the vendor object.
   */
  async getVendor(vendorId) {
    return this.request(`vendors/${vendorId}`, {
      method: 'GET'
    });
  }

  /**
   * Creates a new vendor.
   * @param {Object} vendorData - The data for the new vendor.
   * @returns {Promise<Object>} A promise that resolves to the created vendor object.
   */
  async createVendor(vendorData) {
    return this.request('vendors', {
      method: 'POST',
      body: JSON.stringify(vendorData)
    });
  }

  /**
   * Updates an existing vendor.
   * @param {string} vendorId - The ID of the vendor to update.
   * @param {Object} vendorData - The updated data for the vendor.
   * @returns {Promise<Object>} A promise that resolves to the updated vendor object.
   */
  async updateVendor(vendorId, vendorData) {
    return this.request(`vendors/${vendorId}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData)
    });
  }

  /**
   * Deletes a vendor.
   * @param {string} vendorId - The ID of the vendor to delete.
   * @returns {Promise<void>} A promise that resolves when the vendor is deleted.
   */
  async deleteVendor(vendorId) {
    return this.request(`vendors/${vendorId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Gets scale measurements by scale ID and date range.
   * @param {string} scaleId - The ID of the scale whose measurements to retrieve.
   * @param {string} [startDate] - The start date for the measurements (optional).
   * @param {string} [endDate] - The end date for the measurements (optional).
   * @returns {Promise<Object[]>} A promise that resolves to an array of measurement objects.
   */
  async getScaleMeasurements(scaleId, startDate, endDate) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    console.log('get measurements: scaleid: ', scaleId); // Debug log  
    return this.request(`measures/scale/${scaleId}?${queryParams}`, {
      method: 'GET'
    });
  }

  /**
   * Checks the health of the API.
   * @returns {Promise<boolean>} A promise that resolves to true if the API is healthy, false otherwise.
   */
  async checkHealth() {
    try {
      await this.request('health', { method: 'GET' });
      return true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Geocode an address to coordinates using server-side API
   * @param {string} address - The address to geocode
   * @returns {Promise<{lat: number, lng: number}>} Coordinates
   */
  async geocodeAddress(address) {
    console.log('geocode address: ', address); // Debug log
    try {
      const response = await this.request('maps/geocode', {
        method: 'POST',
        body: JSON.stringify({ address })
      });

      if (!response || (!response.lat && !response.lng)) {
        throw new Error('Invalid geocoding response');
      }

      return {
        lat: parseFloat(response.lat),
        lng: parseFloat(response.lng)
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
  

 /**
 * Get optimized directions between points
 * @param {Object} params - Direction request parameters
 * @param {Object} params.origin - Origin coordinates {lat, lng}
 * @param {Object} params.destination - Destination coordinates {lat, lng}
 * @param {Array} params.waypoints - Array of waypoint objects
 * @param {Object} params.options - Additional options
 * @returns {Promise<Object>} Optimized directions response
 */
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

}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;