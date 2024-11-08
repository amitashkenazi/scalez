// src/services/tokenService.js
import { CognitoRefreshToken } from 'amazon-cognito-identity-js';
import { AuthenticationException } from './exceptions';

class TokenService {
    constructor() {
        // Initialize with stored tokens
        this.accessToken = localStorage.getItem('accessToken');
        this.idToken = localStorage.getItem('idToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.tokenExpirationTime = localStorage.getItem('tokenExpirationTime');
        
        // Track refresh attempts
        this.refreshing = null;
        this.refreshAttempts = 0;
        this.maxRefreshAttempts = 3;
        
        // Configure refresh buffer (refresh 5 minutes before expiration)
        this.refreshBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Start refresh timer
        this.startTokenRefreshTimer();
    }

    startTokenRefreshTimer() {
        // Clear any existing timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        // Check tokens every minute
        this.refreshTimer = setInterval(() => {
            if (this.shouldRefreshToken()) {
                this.refreshTokenIfNeeded()
                    .catch(error => {
                        console.error('Token refresh failed in timer:', error);
                        // If refresh fails, clear tokens and trigger auth flow
                        if (error instanceof AuthenticationException) {
                            this.clearTokens();
                            window.dispatchEvent(new CustomEvent('auth:required'));
                        }
                    });
            }
        }, 60000);
    }

    shouldRefreshToken() {
        if (!this.tokenExpirationTime || !this.refreshToken) {
            return false;
        }

        const now = Date.now();
        const expirationTime = parseInt(this.tokenExpirationTime);
        
        return now > (expirationTime - this.refreshBuffer);
    }

    setTokens({ accessToken, refreshToken, idToken, expiresIn }) {
        // Validate input
        if (!accessToken || !refreshToken || !idToken || !expiresIn) {
            throw new Error('Invalid token data provided');
        }

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.idToken = idToken;
        
        // Calculate expiration time
        const expirationTime = Date.now() + (expiresIn * 1000);
        this.tokenExpirationTime = expirationTime;

        // Store tokens securely
        try {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('idToken', idToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('tokenExpirationTime', expirationTime);
            
            // Reset refresh attempts on successful token set
            this.refreshAttempts = 0;
            
            // Restart refresh timer
            this.startTokenRefreshTimer();
        } catch (error) {
            console.error('Failed to store tokens:', error);
            throw new Error('Failed to store authentication tokens');
        }
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.idToken = null;
        this.tokenExpirationTime = null;
        this.refreshAttempts = 0;

        try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tokenExpirationTime');
        } catch (error) {
            console.error('Failed to clear tokens:', error);
        }

        // Clear refresh timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    async refreshTokenIfNeeded() {
        // If tokens are still valid, return current token
        if (!this.shouldRefreshToken()) {
            return this.idToken;
        }

        // If refresh is already in progress, wait for it
        if (this.refreshing) {
            return this.refreshing;
        }

        // Check refresh attempts
        if (this.refreshAttempts >= this.maxRefreshAttempts) {
            this.clearTokens();
            throw new AuthenticationException('Maximum refresh attempts exceeded');
        }

        try {
            this.refreshing = this._refreshToken();
            const result = await this.refreshing;
            return result.idToken;
        } catch (error) {
            this.refreshAttempts++;
            console.error(`Token refresh failed (attempt ${this.refreshAttempts}):`, error);
            
            if (this.refreshAttempts >= this.maxRefreshAttempts) {
                this.clearTokens();
                throw new AuthenticationException('Token refresh failed');
            }
            
            throw error;
        } finally {
            this.refreshing = null;
        }
    }

    async _refreshToken() {
        if (!this.refreshToken) {
            throw new AuthenticationException('No refresh token available');
        }

        try {
            return new Promise((resolve, reject) => {
                const refreshToken = new CognitoRefreshToken({
                    RefreshToken: this.refreshToken
                });

                this.getCognitoUser()?.refreshSession(refreshToken, (err, session) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    try {
                        const tokens = {
                            accessToken: session.getAccessToken().getJwtToken(),
                            idToken: session.getIdToken().getJwtToken(),
                            refreshToken: session.getRefreshToken().getToken(),
                            expiresIn: this.getExpirationFromToken(session.getAccessToken().getJwtToken())
                        };

                        this.setTokens(tokens);
                        resolve(tokens);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    }

    getExpirationFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp - (Date.now() / 1000);
        } catch (error) {
            console.error('Failed to parse token expiration:', error);
            return 3600; // Default to 1 hour if parsing fails
        }
    }

    // Getter methods remain unchanged
    getAccessToken() { return this.accessToken; }
    getIdToken() { return this.idToken; }
    getRefreshToken() { return this.refreshToken; }
}

export const tokenService = new TokenService();