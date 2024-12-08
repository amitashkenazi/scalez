import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

import { cognitoAuth } from '../utils/cognitoAuth';
import { tokenService } from '../services/tokenService';

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const decodeToken = (token) => {
    try {
      return jwtDecode(token);
    } catch (err) {
      console.error('Token decoding failed:', err);
      return null;
    }
  };

  const extractUserRole = (idToken) => {
    const decodedToken = decodeToken(idToken);
    if (!decodedToken) return 'user';

    return decodedToken['custom:role'] || 
      (decodedToken['cognito:groups']?.includes('admin') ? 'admin' : 'user');
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

        const userData = await cognitoAuth.getCurrentUser();
        if (userData) {
          const userWithRole = { ...userData, role };
          setUser(userWithRole);
          setUserRole(role);
          localStorage.setItem('userData', JSON.stringify(userWithRole));
        } else {
          signOut(); // Clean up if user is missing
        }
      }
    } catch (err) {
      console.error('Auth state check failed:', err);
      setError(err.message);
      signOut(); // Cleanup on failure
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
      localStorage.setItem('userData', JSON.stringify(userWithRole));

      return userWithRole;
    } catch (err) {
      console.error('Sign-in failed:', err);
      throw err;
    }
  };

  const signUp = async (email, password, attributes = {}) => {
    try {
      const result = await cognitoAuth.signUp(email, password, attributes);
      return result;
    } catch (err) {
      console.error('Sign-up failed:', err);
      throw err;
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      await cognitoAuth.confirmSignUp(email, code);
    } catch (err) {
      console.error('Confirmation failed:', err);
      throw err;
    }
  };

  const resendConfirmationCode = async (email) => {
    try {
      await cognitoAuth.resendConfirmationCode(email);
    } catch (err) {
      console.error('Resend confirmation code failed:', err);
      throw err;
    }
  };

  const signInWithGoogle = async (authData) => {
    try {
      if (!authData) throw new Error('No authentication data provided');

      const decodedToken = decodeToken(authData.id_token);
      const role = extractUserRole(authData.id_token);

      const userData = {
        email: decodedToken.email,
        name: decodedToken.name,
        sub: decodedToken.sub,
        role,
      };

      tokenService.setTokens({
        accessToken: authData.access_token,
        idToken: authData.id_token,
        refreshToken: authData.refresh_token,
        expiresIn: authData.expires_in,
      });

      setUser(userData);
      setUserRole(role);
      localStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error('Google sign-in failed:', err);
      throw new Error('Failed to complete Google sign-in');
    }
  };

  const signOut = async () => {
    try {
      await cognitoAuth.signOut();
      setUser(null);
      setUserRole(null);
      localStorage.removeItem('userData');
      tokenService.clearTokens();
    } catch (err) {
      console.error('Sign-out failed:', err);
      throw err;
    }
  };

  const refreshSession = async () => {
    try {
      const newToken = await cognitoAuth.refreshSession();
      if (newToken) {
        const role = extractUserRole(newToken);
        const userData = await cognitoAuth.getCurrentUser();
        const userWithRole = { ...userData, role };
        setUser(userWithRole);
        setUserRole(role);
        localStorage.setItem('userData', JSON.stringify(userWithRole));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Session refresh failed:', err);
      return false;
    }
  };

  const value = {
    user,
    userRole,
    isLoading,
    error,
    signIn,
    signUp,                // Added signUp
    confirmSignUp,         // Added confirmation support
    resendConfirmationCode, // Added code resend support
    signInWithGoogle,
    signOut,
    refreshUser: checkAuthState,
    refreshSession,
    isAdmin: userRole === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
