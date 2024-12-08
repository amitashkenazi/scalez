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

  const signInWithGoogle = async () => {
    try {
      const domain = authConfig.COGNITO_HOSTED_UI_DOMAIN;
      const clientId = authConfig.USER_POOL_WEB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      // Store code verifier in session storage for callback
      sessionStorage.setItem('codeVerifier', codeVerifier);
      
      const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        identity_provider: 'Google',
        scope: 'email openid profile',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      window.location.href = `${domain}/oauth2/authorize?${queryParams.toString()}`;
    } catch (err) {
      console.error('Google sign in error:', err);
      throw new Error('Failed to initiate Google sign in');
    }
  };

  const completeSignIn = async (code) => {
    try {
      const codeVerifier = sessionStorage.getItem('codeVerifier');
      if (!codeVerifier) {
        throw new Error('No code verifier found');
      }

      const result = await cognitoAuth.completeNewPasswordChallenge(code, codeVerifier);
      const idToken = result.getIdToken().getJwtToken();
      const role = extractUserRole(idToken);
      const userData = await cognitoAuth.getCurrentUser();
      
      const userWithRole = { ...userData, role };
      setUser(userWithRole);
      setUserRole(role);
      localStorage.setItem('userData', JSON.stringify(userWithRole));
      
      // Clean up
      sessionStorage.removeItem('codeVerifier');
      
      return userWithRole;
    } catch (err) {
      console.error('Error completing sign in:', err);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      await cognitoAuth.signOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('userData');
      sessionStorage.removeItem('codeVerifier');
    } catch (err) {
      console.error('Sign out failed:', err);
      throw err;
    }
  };

  // PKCE Helper Functions
  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
  };

  const generateCodeChallenge = async (verifier) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const value = {
    user,
    userRole,
    isLoading,
    error,
    signIn,
    signInWithGoogle,
    completeSignIn,
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