// src/config/auth.js
export const authConfig = {
    // Replace these values with your Cognito configuration
    REGION: process.env.REACT_APP_COGNITO_REGION || 'us-east-1',
    USER_POOL_ID: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    USER_POOL_WEB_CLIENT_ID: process.env.REACT_APP_COGNITO_CLIENT_ID,
    
    // OAuth settings
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
      expires: 7, // days
      secure: process.env.NODE_ENV === 'production'
    }
  };