import React, { createContext, useState, useContext, useEffect } from 'react';
import { cognitoAuth } from '../utils/cognitoAuth';
import { authConfig } from '../config/auth';
import { tokenService } from '../services/tokenService';


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

      const role = decodedToken['custom:role'] || 
                  (decodedToken['cognito:groups'] && 
                   decodedToken['cognito:groups'].includes('admin') ? 'admin' : 'user');
      
      return role;
    } catch (err) {
      console.error('Error extracting user role:', err);
      return 'user';
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
    const checkAuth = async () => {
      try {
        const session = await cognitoAuth.getCurrentSession();
        if (session) {
          const userData = await cognitoAuth.getCurrentUser();
          if (userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

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

  const signInWithGoogle = async (authData) => {
    try {
      if (!authData) {
        throw new Error('No authentication data provided');
      }

      // Store tokens
      tokenService.setTokens({
        accessToken: authData.access_token,
        idToken: authData.id_token,
        refreshToken: authData.refresh_token,
        expiresIn: authData.expires_in
      });

      // Extract user info from ID token
      const decodedToken = decodeToken(authData.id_token);
      const role = extractUserRole(authData.id_token);
      
      const userData = {
        email: decodedToken.email,
        name: decodedToken.name,
        sub: decodedToken.sub,
        role: role
      };

      // Update state and storage
      setUser(userData);
      setUserRole(role);
      localStorage.setItem('userData', JSON.stringify(userData));

      return userData;
    } catch (err) {
      console.error('Google sign in error:', err);
      throw new Error('Failed to complete Google sign in');
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
      tokenService.clearTokens();
    } catch (err) {
      console.error('Sign out failed:', err);
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
    setUser,
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
    refreshSession,
    isConfigured,
    isAdmin: userRole === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}