import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import { authConfig } from '../config/auth';

const isCognitoConfigured = () => {
    return authConfig.USER_POOL_ID && authConfig.USER_POOL_WEB_CLIENT_ID;
};

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
                    // Store the tokens
                    const accessToken = result.getAccessToken().getJwtToken();
                    const idToken = result.getIdToken().getJwtToken();
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('idToken', idToken);
                    
                    // Get user attributes
                    cognitoUser.getUserAttributes((err, attributes) => {
                        if (err) {
                            console.error('Error getting user attributes:', err);
                            resolve(result);
                            return;
                        }

                        // Create a properly formatted user object
                        const userData = {
                            username: cognitoUser.getUsername(),
                            email: email,
                            // Map Cognito attributes to user object
                            ...attributes.reduce((acc, attr) => {
                                switch(attr.Name) {
                                    case 'name':
                                        acc.name = attr.Value;
                                        break;
                                    case 'given_name':
                                        acc.firstName = attr.Value;
                                        break;
                                    case 'family_name':
                                        acc.lastName = attr.Value;
                                        break;
                                    case 'custom:displayName':
                                        acc.displayName = attr.Value;
                                        break;
                                    case 'email':
                                        acc.email = attr.Value;
                                        break;
                                    default:
                                        acc[attr.Name] = attr.Value;
                                }
                                return acc;
                            }, {})
                        };

                        // Ensure we have a display name
                        if (!userData.displayName) {
                            userData.displayName = userData.name || 
                                                 (userData.firstName && userData.lastName ? 
                                                  `${userData.firstName} ${userData.lastName}` : 
                                                  userData.email);
                        }

                        console.log('Processed user data:', userData); // Debug log

                        localStorage.setItem('userData', JSON.stringify(userData));
                        resolve({ result, userData });
                    });
                },
                onFailure: (err) => {
                    reject(err);
                }
            });
        });
    },


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
                if (session && session.isValid()) {
                    resolve(session);
                } else {
                    resolve(null);
                }
            });
        });
    }
    ,
    getCurrentUser: async () => {
        if (!userPool) return mockAuth.getCurrentUser();

        // First try to get from localStorage for immediate response
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
            return JSON.parse(storedUserData);
        }

        const cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) return null;

        return new Promise((resolve, reject) => {
            cognitoUser.getSession((err, session) => {
                if (err || !session) {
                    resolve(null);
                    return;
                }

                cognitoUser.getUserAttributes((err, attributes) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Create a properly formatted user object
                    const userData = {
                        username: cognitoUser.getUsername(),
                        // Map Cognito attributes to user object
                        ...attributes.reduce((acc, attr) => {
                            switch(attr.Name) {
                                case 'name':
                                    acc.name = attr.Value;
                                    break;
                                case 'given_name':
                                    acc.firstName = attr.Value;
                                    break;
                                case 'family_name':
                                    acc.lastName = attr.Value;
                                    break;
                                case 'custom:displayName':
                                    acc.displayName = attr.Value;
                                    break;
                                case 'email':
                                    acc.email = attr.Value;
                                    break;
                                default:
                                    acc[attr.Name] = attr.Value;
                            }
                            return acc;
                        }, {})
                    };

                    // Ensure we have a display name
                    if (!userData.displayName) {
                        userData.displayName = userData.name || 
                                             (userData.firstName && userData.lastName ? 
                                              `${userData.firstName} ${userData.lastName}` : 
                                              userData.email);
                    }

                    console.log('Retrieved user data:', userData); // Debug log

                    localStorage.setItem('userData', JSON.stringify(userData));
                    resolve(userData);
                });
            });
        });
    },

    signOut: () => {
        if (!userPool) return mockAuth.signOut();

        const cognitoUser = userPool.getCurrentUser();
        if (cognitoUser) {
            cognitoUser.signOut();
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');
            localStorage.removeItem('userData');
        }
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