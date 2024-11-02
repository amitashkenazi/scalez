// src/config/auth.js
export const authConfig = {
  // Make sure these values are correctly set from your environment variables
  REGION: process.env.REACT_APP_COGNITO_REGION || 'us-east-1',
  USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  USER_POOL_WEB_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID,

  // OAuth settings if you're using them
  OAUTH: {
    domain: process.env.REACT_APP_COGNITO_DOMAIN,
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: process.env.REACT_APP_COGNITO_REDIRECT_SIGNIN,
    redirectSignOut: process.env.REACT_APP_COGNITO_REDIRECT_SIGNOUT,
    responseType: 'code'
  },

  // Auth cookie settings
  COOKIE: {
    domain: process.env.REACT_APP_COOKIE_DOMAIN || 'localhost',
    path: '/',
    expires: 7,
    secure: process.env.NODE_ENV === 'production'
  }
};

// Add this helper function to debug configuration
export const validateAuthConfig = () => {
  const required = {
    USER_POOL_ID: authConfig.USER_POOL_ID,
    USER_POOL_WEB_CLIENT_ID: authConfig.USER_POOL_WEB_CLIENT_ID,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing required Cognito configuration:', missing);
    return false;
  }

  console.log('Auth configuration:', {
    region: authConfig.REGION,
    userPoolId: authConfig.USER_POOL_ID,
    clientId: authConfig.USER_POOL_WEB_CLIENT_ID
  });

  return true;
};