// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { cognitoAuth } from '../utils/cognitoAuth';
import { authConfig } from '../config/auth';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfigured] = useState(!!authConfig.USER_POOL_ID && !!authConfig.USER_POOL_WEB_CLIENT_ID);

  const checkAuthState = async () => {
    try {
      const session = await cognitoAuth.getCurrentSession();
      if (session) {
        const userData = await cognitoAuth.getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth state check failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const signIn = async (email, password) => {
    try {
      await cognitoAuth.signIn(email, password);
      await checkAuthState();
    } catch (err) {
      throw err;
    }
  };

  const signUp = async (email, password, attributes) => {
    try {
      const result = await cognitoAuth.signUp(email, password, attributes);
      return result;
    } catch (err) {
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await cognitoAuth.signOut();
      setUser(null);
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  // Add these confirmation-related functions
  const confirmSignUp = async (email, code) => {
    try {
      const result = await cognitoAuth.confirmSignUp(email, code);
      return result;
    } catch (err) {
      throw err;
    }
  };

  const resendConfirmationCode = async (email) => {
    try {
      const result = await cognitoAuth.resendConfirmationCode(email);
      return result;
    } catch (err) {
      throw err;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    confirmSignUp, // Add this
    resendConfirmationCode, // Add this
    refreshUser: checkAuthState,
    isConfigured
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}