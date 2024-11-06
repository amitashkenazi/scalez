// src/services/tokenService.js
class TokenService {
    constructor() {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      this.tokenExpirationTime = localStorage.getItem('tokenExpirationTime');
      this.refreshing = null;
    }
  
    setTokens({ accessToken, refreshToken, expiresIn }) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      
      // Calculate expiration time
      const expirationTime = Date.now() + expiresIn * 1000;
      this.tokenExpirationTime = expirationTime;
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpirationTime', expirationTime);
    }
  
    clearTokens() {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpirationTime = null;
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpirationTime');
    }
  
    isTokenExpired() {
      if (!this.tokenExpirationTime) return true;
      // Add 5-minute buffer to prevent edge cases
      return Date.now() > (this.tokenExpirationTime - 5 * 60 * 1000);
    }
  
    async refreshTokenIfNeeded() {
      if (!this.isTokenExpired()) {
        return this.accessToken;
      }
  
      // If a refresh is already in progress, wait for it
      if (this.refreshing) {
        return this.refreshing;
      }
  
      try {
        this.refreshing = this._refreshToken();
        const newToken = await this.refreshing;
        return newToken;
      } finally {
        this.refreshing = null;
      }
    }
  
    async _refreshToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }
  
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: this.refreshToken
          })
        });
  
        if (!response.ok) {
          throw new Error('Token refresh failed');
        }
  
        const data = await response.json();
        this.setTokens(data);
        return data.accessToken;
      } catch (error) {
        this.clearTokens();
        throw new Error('Token refresh failed');
      }
    }
  
    getAccessToken() {
      return this.accessToken;
    }
  
    getRefreshToken() {
      return this.refreshToken;
    }
  }
  
  export const tokenService = new TokenService();