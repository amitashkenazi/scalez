import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const SubscriptionContext = createContext(null);

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  const fetchSubscription = async () => {
    try {
      const response = await apiService.request('subscription', {
        method: 'GET'
      });
      setSubscription(response);
    } catch (err) {
      setError(err.message);
      setSubscription({ tier: 'basic' }); // Default to basic tier on error
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeSubscription = async (tierId) => {
    try {
      const response = await apiService.request('subscription/upgrade', {
        method: 'POST',
        body: JSON.stringify({ tierId })
      });
      setSubscription(response);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const isFeatureEnabled = (featureName) => {
    const features = {
      basic: ['scales', 'basicAnalytics', 'notifications'],
      advanced: ['scales', 'basicAnalytics', 'notifications', 'maps', 'orders', 'advancedAnalytics']
    };

    return features[subscription?.tier || 'basic'].includes(featureName);
  };

  const value = {
    subscription,
    isLoading,
    error,
    upgradeSubscription,
    isFeatureEnabled,
    fetchSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
