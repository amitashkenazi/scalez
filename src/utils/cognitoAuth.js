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
    console.log(authConfig);
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
    async confirmSignUp(email, code) {
        return true;
    },
    async resendConfirmationCode(email) {
        return true;
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
    // Add this to your cognitoAuth.js
    signUp: async (email, password, attributes = {}) => {
        if (!userPool) return mockAuth.signUp(email, password, attributes);

        console.log('Attempting signup with:', {
            email,
            passwordLength: password.length,
            passwordChars: Array.from(password).map(c => c.charCodeAt(0)),
            attributes
        });

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
                        console.error('Signup error:', {
                            code: err.code,
                            message: err.message,
                            passwordUsed: {
                                length: password.length,
                                chars: Array.from(password).map(c => c.charCodeAt(0))
                            }
                        });
                        reject(err);
                        return;
                    }

                    console.log('Signup successful:', {
                        username: result.user.getUsername(),
                        userConfirmed: result.userConfirmed,
                        userAgent: result.user.getUserAgent()
                    });

                    // Store the successful signup details
                    try {
                        localStorage.setItem('cognitoSignupDetails', JSON.stringify({
                            email,
                            timestamp: new Date().toISOString(),
                            passwordDetails: {
                                length: password.length,
                                chars: Array.from(password).map(c => c.charCodeAt(0))
                            }
                        }));
                    } catch (err) {
                        console.error('Error saving signup details:', err);
                    }

                    resolve(result);
                }
            );
        });
    }
    ,

    // Confirm sign up with verification code
    confirmSignUp: async (email, code) => {
        if (!userPool) return mockAuth.confirmSignUp(email, code);

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
        if (!userPool) return mockAuth.resendConfirmationCode(email);

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

    // Sign in user
    // Replace your existing signIn function in cognitoAuth.js with this debug version
    signIn: async (email, password) => {
        if (!userPool) return mockAuth.signIn(email, password);

        console.log('Attempting Cognito signIn:', {
            email,
            passwordLength: password.length,
            passwordChars: Array.from(password).map(c => c.charCodeAt(0))
        });

        return new Promise((resolve, reject) => {
            const authenticationDetails = new AuthenticationDetails({
                Username: email,
                Password: password,
            });

            console.log('Auth Details created:', {
                hasUsername: !!authenticationDetails.getUsername(),
                hasPassword: !!authenticationDetails.getPassword(),
                rawPasswordLength: password.length,
                detailsPasswordLength: authenticationDetails.getPassword().length
            });

            const cognitoUser = new CognitoUser({
                Username: email,
                Pool: userPool
            });

            console.log('CognitoUser created:', {
                username: cognitoUser.getUsername(),
                pool: {
                    userPoolId: userPool.getUserPoolId(),
                    clientId: userPool.getClientId()
                }
            });

            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (result) => {
                    console.log('Sign in successful:', {
                        accessToken: result.getAccessToken().getJwtToken() ? 'Present' : 'Missing',
                        idToken: result.getIdToken().getJwtToken() ? 'Present' : 'Missing'
                    });
                    resolve(result);
                },
                onFailure: (err) => {
                    console.error('Sign in failed:', {
                        code: err.code,
                        name: err.name,
                        message: err.message,
                        passwordUsed: {
                            length: password.length,
                            chars: Array.from(password).map(c => c.charCodeAt(0))
                        }
                    });

                    if (err.code === 'NotAuthorizedException') {
                        reject(new Error('Please check your credentials and try again'));
                    } else if (err.code === 'UserNotConfirmedException') {
                        reject(new Error('Please verify your email before signing in'));
                    } else {
                        reject(err);
                    }
                }
            });
        });
    }
    ,
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
    // Add this to your existing forgotPassword function in cognitoAuth.js
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