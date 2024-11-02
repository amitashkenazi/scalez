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
      setError(null);
      // First check localStorage for immediate user data
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        setUser(JSON.parse(storedUserData));
      }

      // Then verify with Cognito
      const session = await cognitoAuth.getCurrentSession();
      if (session) {
        const userData = await cognitoAuth.getCurrentUser();
        if (userData) {
          setUser(userData);
        } else {
          // If we can't get user data but have a session, clear everything
          cognitoAuth.signOut();
          setUser(null);
        }
      } else {
        // No valid session
        setUser(null);
        localStorage.removeItem('userData');
      }
    } catch (err) {
      console.error('Auth state check failed:', err);
      setError(err.message);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { userData } = await cognitoAuth.signIn(email, password);
      setUser(userData);
      return userData;
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

  const value = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    refreshUser: checkAuthState,
    isConfigured
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}