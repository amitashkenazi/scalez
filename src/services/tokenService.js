import { CognitoRefreshToken } from 'amazon-cognito-identity-js';
class TokenService {
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.idToken = localStorage.getItem('idToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.tokenExpirationTime = localStorage.getItem('tokenExpirationTime');
        this.refreshing = null;
        
        // Check token validity periodically
        this.startTokenRefreshTimer();
    }

    startTokenRefreshTimer() {
        // Check token every minute
        setInterval(() => {
            if (this.isTokenExpired() && this.refreshToken) {
                this.refreshTokenIfNeeded();
            }
        }, 60000);
    }

    setTokens({ accessToken, refreshToken, idToken, expiresIn }) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.idToken = idToken;

        // Calculate expiration time
        const expirationTime = Date.now() + (expiresIn * 1000);
        this.tokenExpirationTime = expirationTime;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpirationTime', expirationTime);

        // Reset refresh timer when new tokens are set
        this.startTokenRefreshTimer();
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.idToken = null;
        this.tokenExpirationTime = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('idToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpirationTime');
    }

    isTokenExpired() {
        if (!this.tokenExpirationTime) return true;
        // Add 5-minute buffer to prevent edge cases
        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        return Date.now() > (this.tokenExpirationTime - bufferTime);
    }

    async refreshTokenIfNeeded() {
        // If token is still valid, return current token
        if (!this.isTokenExpired()) {
            return this.idToken;
        }

        // If refresh is already in progress, wait for it
        if (this.refreshing) {
            return this.refreshing;
        }

        try {
            this.refreshing = this._refreshToken();
            const result = await this.refreshing;
            return result.idToken;
        } catch (error) {
            this.clearTokens();
            // Re-throw the error to be handled by the calling function
            throw new Error('Token refresh failed');
        } finally {
            this.refreshing = null;
        }
    }

    async _refreshToken() {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const cognitoUser = this.getCognitoUser();
            if (!cognitoUser) {
                throw new Error('No user found');
            }

            return new Promise((resolve, reject) => {
                const refreshToken = new CognitoRefreshToken({
                    RefreshToken: this.refreshToken
                });

                cognitoUser.refreshSession(refreshToken, (err, session) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const tokens = {
                        accessToken: session.getAccessToken().getJwtToken(),
                        idToken: session.getIdToken().getJwtToken(),
                        refreshToken: session.getRefreshToken().getToken(),
                        expiresIn: this.getExpirationFromToken(session.getAccessToken().getJwtToken())
                    };

                    this.setTokens(tokens);
                    resolve(tokens);
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
            return 3600; // Default to 1 hour if unable to parse
        }
    }

    getAccessToken() {
        return this.accessToken;
    }

    getIdToken() {
        return this.idToken;
    }

    getRefreshToken() {
        return this.refreshToken;
    }
}

export const tokenService = new TokenService();