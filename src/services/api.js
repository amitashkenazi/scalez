// src/services/api.js
import { tokenService } from './tokenService';

class ApiService {
    constructor() {
        // Remove any trailing slashes
        this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5100';
        this.retryCount = 1;
        this.retryDelay = 1000;
    }
    // Add these methods to your existing ApiService class

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
        console.log('Updating customer:', customerId, customerData);
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
        console.log('Creating product:', productData);
        return this.request('products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    async updateProduct(productId, productData) {
        console.log('Updating product:', productId, productData);
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
    

    async getHeaders() {
        try {
            const accessToken = await tokenService.refreshTokenIfNeeded();
            const idToken = await tokenService.getIdToken(); // You'll need to add this method to tokenService
            
            return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': idToken ? `Bearer ${idToken}` : '',
            };
        } catch (error) {
            console.error('Error getting headers:', error);
            // If token refresh fails, clear auth state and return basic headers
            tokenService.clearTokens();
            return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            };
        }
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

    async request(endpoint, options = {}, retryCount = this.retryCount) {
        const url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
        console.log('API request to:', url, options);
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
                // Try to refresh token one more time if request fails
                try {
                    const newIdToken = await tokenService.refreshTokenIfNeeded();
                    headers.Authorization = `Bearer ${newIdToken}`;
                    const retryResponse = await fetch(url, { ...options, headers });
                    
                    if (!retryResponse.ok) {
                        throw new Error(`HTTP error! status: ${retryResponse.status}`);
                    }
                    
                    return this.parseResponse(retryResponse);
                } catch (refreshError) {
                    // If refresh fails, clear tokens and redirect to login
                    tokenService.clearTokens();
                    window.location.href = '/';
                    throw new Error('Authentication required');
                }
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return this.parseResponse(response);
        } catch (error) {
            console.error('API request failed:', error);
            
            // Retry on network errors
            if (error.name === 'TypeError' && retryCount > 0) {
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

    async parseResponse(response) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            return response.json();
        }
        return response.text();
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

}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;