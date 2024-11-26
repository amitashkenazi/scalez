// src/contexts/AccountContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import apiService from '../services/api';

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const { user } = useAuth();
  const [accountInfo, setAccountInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccountInfo = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.request('vendors/me', {
        method: 'GET'
      });
      setAccountInfo(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching account info:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccountInfo();
    }
  }, [user]);

  const updateAccountInfo = async (newInfo) => {
    try {
      const response = await apiService.request('vendors/me', {
        method: 'PUT',
        body: JSON.stringify(newInfo)
      });
      setAccountInfo(response);
      return response;
    } catch (err) {
      console.error('Error updating account info:', err);
      throw err;
    }
  };

  const value = {
    accountInfo,
    isLoading,
    error,
    updateAccountInfo,
    refreshAccountInfo: fetchAccountInfo // Now referencing the function in scope
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}