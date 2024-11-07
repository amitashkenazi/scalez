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
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConfigured] = useState(!!authConfig.USER_POOL_ID && !!authConfig.USER_POOL_WEB_CLIENT_ID);

  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error('Error decoding token:', err);
      return null;
    }
  };

  const extractUserRole = (idToken) => {
    try {
      const decodedToken = decodeToken(idToken);
      if (!decodedToken) return 'user';

      // Check for role in custom:role or cognito:groups or your specific attribute
      const role = decodedToken['custom:role'] || 
                  (decodedToken['cognito:groups'] && 
                   decodedToken['cognito:groups'].includes('admin') ? 'admin' : 'user');
      
      return role;
    } catch (err) {
      console.error('Error extracting user role:', err);
      return 'user'; // Default to regular user role
    }
  };

  const checkAuthState = async () => {
    try {
      setError(null);
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        setUser(parsedUserData);
        setUserRole(parsedUserData.role);
      }

      const session = await cognitoAuth.getCurrentSession();
      if (session) {
        const idToken = session.getIdToken().getJwtToken();
        const role = extractUserRole(idToken);
        setUserRole(role);
        
        const userData = await cognitoAuth.getCurrentUser();
        if (userData) {
          const userWithRole = { ...userData, role };
          setUser(userWithRole);
          localStorage.setItem('userData', JSON.stringify(userWithRole));
        } else {
          cognitoAuth.signOut();
          setUser(null);
          setUserRole(null);
        }
      } else {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('userData');
      }
    } catch (err) {
      console.error('Auth state check failed:', err);
      setError(err.message);
      setUser(null);
      setUserRole(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { result, userData } = await cognitoAuth.signIn(email, password);
      const idToken = result.getIdToken().getJwtToken();
      const role = extractUserRole(idToken);
      const userWithRole = { ...userData, role };
      setUser(userWithRole);
      setUserRole(role);
      return userWithRole;
    } catch (err) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await cognitoAuth.signOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('userData');
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  const value = {
    user,
    userRole,
    isLoading,
    error,
    signIn,
    signUp: cognitoAuth.signUp,
    signOut,
    confirmSignUp: cognitoAuth.confirmSignUp,
    resendConfirmationCode: cognitoAuth.resendConfirmationCode,
    refreshUser: checkAuthState,
    isConfigured,
    isAdmin: userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}