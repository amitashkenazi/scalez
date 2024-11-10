// src/utils/authMonitor.js

import { tokenService } from '../services/tokenService';

class AuthMonitor {
    constructor() {
        this.listeners = new Set();
        this.initialize();
    }

    initialize() {
        // Listen for auth events
        window.addEventListener('auth:required', () => {
            this.notifyListeners('authRequired');
        });

        // Check token status periodically
        setInterval(() => {
            this.checkAuthStatus();
        }, 30000); // Every 30 seconds
    }

    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in auth listener:', error);
            }
        });
    }

    checkAuthStatus() {
        const isAuthenticated = tokenService.isAuthenticated();
        const remainingTime = tokenService.getTokenRemainingTime();

        if (!isAuthenticated) {
            this.notifyListeners('authExpired');
            return;
        }

        // Warn when token is close to expiring
        if (remainingTime < 5 * 60 * 1000) { // Less than 5 minutes
            this.notifyListeners('authWarning');
        }
    }

    isAuthenticated() {
        return tokenService.isAuthenticated();
    }

    getRemainingTime() {
        return tokenService.getTokenRemainingTime();
    }
}

export const authMonitor = new AuthMonitor();