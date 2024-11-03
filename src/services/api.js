// src/services/api.js

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

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Get token from localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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
        
        const defaultOptions = {
            mode: 'cors',
            credentials: 'include',
            headers: this.getHeaders()
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, finalOptions);

            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                window.location.href = '/'; // Redirect to home/login
                throw new Error('Authentication required');
            }

            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    return await response.json();
                }
                return await response.text();
            }

            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
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