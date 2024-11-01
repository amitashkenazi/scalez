// src/utils/cognitoAuth.js
import { 
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserAttribute
  } from 'amazon-cognito-identity-js';
  import { authConfig } from '../config/auth';
  
  // Check if required configuration is available
  const isCognitoConfigured = () => {
    return authConfig.USER_POOL_ID && authConfig.USER_POOL_WEB_CLIENT_ID;
  };
  
  // Create user pool only if configuration is available
  const getUserPool = () => {
    if (!isCognitoConfigured()) {
      console.warn('Cognito is not configured. Using mock authentication.');
      return null;
    }
  
    return new CognitoUserPool({
      UserPoolId: authConfig.USER_POOL_ID,
      ClientId: authConfig.USER_POOL_WEB_CLIENT_ID
    });
  };
  
  const userPool = getUserPool();
  
  // Mock authentication for development
  const mockAuth = {
    currentUser: null,
    async signIn(email, password) {
      this.currentUser = {
        username: email,
        attributes: {
          email,
          name: 'Test User'
        }
      };
      return this.currentUser;
    },
    async signUp(email, password, attributes) {
      return { user: { username: email } };
    },
    signOut() {
      this.currentUser = null;
    },
    async getCurrentSession() {
      return this.currentUser ? { isValid: true } : null;
    },
    async getCurrentUser() {
      return this.currentUser;
    },
    async confirmSignUp() {
      return true;
    },
    async resendConfirmationCode() {
      return true;
    },
    async forgotPassword() {
      return true;
    },
    async confirmPassword() {
      return true;
    },
    async changePassword() {
      return true;
    }
  };
  
  // Export either real Cognito auth or mock auth
  export const cognitoAuth = {
    // Sign up new user
    signUp: async (email, password, attributes = {}) => {
      if (!userPool) return mockAuth.signUp(email, password, attributes);
  
      return new Promise((resolve, reject) => {
        const attributeList = Object.entries(attributes).map(([key, value]) => 
          new CognitoUserAttribute({
            Name: key,
            Value: value
          })
        );
  
        userPool.signUp(
          email,
          password,
          attributeList,
          null,
          (err, result) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(result.user);
          }
        );
      });
    },
  
    // Sign in user
    signIn: async (email, password) => {
      if (!userPool) return mockAuth.signIn(email, password);
  
      return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        });
  
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
  
        cognitoUser.authenticateUser(authenticationDetails, {
          onSuccess: (result) => {
            resolve(result);
          },
          onFailure: (err) => {
            reject(err);
          },
        });
      });
    },
  
    // Verify email with confirmation code
    confirmSignUp: async (email, code) => {
      if (!userPool) return mockAuth.confirmSignUp();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
  
        cognitoUser.confirmRegistration(code, true, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      });
    },
  
    // Resend verification code
    resendConfirmationCode: async (email) => {
      if (!userPool) return mockAuth.resendConfirmationCode();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
  
        cognitoUser.resendConfirmationCode((err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      });
    },
  
    // Sign out user
    signOut: () => {
      if (!userPool) return mockAuth.signOut();
      
      const cognitoUser = userPool.getCurrentUser();
      if (cognitoUser) {
        cognitoUser.signOut();
      }
    },
  
    // Get current session
    getCurrentSession: async () => {
      if (!userPool) return mockAuth.getCurrentSession();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
  
        if (!cognitoUser) {
          resolve(null);
          return;
        }
  
        cognitoUser.getSession((err, session) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(session);
        });
      });
    },
  
    // Get current user
    getCurrentUser: async () => {
      if (!userPool) return mockAuth.getCurrentUser();
  
      const session = await cognitoAuth.getCurrentSession();
      if (!session) return null;
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
        cognitoUser.getUserAttributes((err, attributes) => {
          if (err) {
            reject(err);
            return;
          }
  
          const userData = {
            ...attributes.reduce((acc, attr) => ({
              ...acc,
              [attr.Name]: attr.Value
            }), {}),
            username: cognitoUser.username
          };
  
          resolve(userData);
        });
      });
    },
  
    // Change password
    changePassword: async (oldPassword, newPassword) => {
      if (!userPool) return mockAuth.changePassword();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
        
        if (!cognitoUser) {
          reject(new Error('No user found'));
          return;
        }
  
        cognitoUser.changePassword(oldPassword, newPassword, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      });
    },
  
    // Forgot password
    forgotPassword: async (email) => {
      if (!userPool) return mockAuth.forgotPassword();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
  
        cognitoUser.forgotPassword({
          onSuccess: (data) => {
            resolve(data);
          },
          onFailure: (err) => {
            reject(err);
          },
          inputVerificationCode: (data) => {
            resolve(data);
          }
        });
      });
    },
  
    // Confirm new password after reset
    confirmPassword: async (email, code, newPassword) => {
      if (!userPool) return mockAuth.confirmPassword();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: userPool
        });
  
        cognitoUser.confirmPassword(code, newPassword, {
          onSuccess() {
            resolve();
          },
          onFailure(err) {
            reject(err);
          }
        });
      });
    },
  
    // Update user attributes
    updateUserAttributes: async (attributes) => {
      if (!userPool) return mockAuth.getCurrentUser();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
  
        if (!cognitoUser) {
          reject(new Error('No user found'));
          return;
        }
  
        const attributeList = Object.entries(attributes).map(([key, value]) => 
          new CognitoUserAttribute({
            Name: key,
            Value: value
          })
        );
  
        cognitoUser.updateAttributes(attributeList, (err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(result);
        });
      });
    },
  
    // Verify attribute (like email or phone)
    verifyAttribute: async (attributeName, code) => {
      if (!userPool) return true;
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
  
        if (!cognitoUser) {
          reject(new Error('No user found'));
          return;
        }
  
        cognitoUser.verifyAttribute(attributeName, code, {
          onSuccess: (result) => {
            resolve(result);
          },
          onFailure: (err) => {
            reject(err);
          }
        });
      });
    },
  
    // Get user data
    getUserData: async () => {
      if (!userPool) return mockAuth.getCurrentUser();
  
      return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
  
        if (!cognitoUser) {
          reject(new Error('No user found'));
          return;
        }
  
        cognitoUser.getUserData((err, userData) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(userData);
        });
      });
    },
  
    // Check if Cognito is configured
    isConfigured: () => isCognitoConfigured()
  };