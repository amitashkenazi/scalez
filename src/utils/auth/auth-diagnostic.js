import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

// Diagnostic function to validate Cognito configuration
export const diagnoseCognitoConfig = () => {
  const config = {
    UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    ClientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
    Region: process.env.REACT_APP_COGNITO_REGION || 'us-east-1'
  };

  console.log('Cognito Configuration:', {
    userPoolId: config.UserPoolId ? `Set (${config.UserPoolId})` : 'Missing',
    clientId: config.ClientId ? `Set (${config.ClientId})` : 'Missing',
    region: config.Region
  });

  // Validate required fields
  if (!config.UserPoolId || !config.ClientId) {
    throw new Error('Missing required Cognito configuration');
  }

  // Test UserPool creation
  try {
    const userPool = new CognitoUserPool({
      UserPoolId: config.UserPoolId,
      ClientId: config.ClientId
    });
    console.log('UserPool created successfully');
    return userPool;
  } catch (error) {
    console.error('Error creating UserPool:', error);
    throw error;
  }
};

// Function to test authentication flow
export const testAuthFlow = async (email, password) => {
  console.log('Starting auth flow test...', { email });
  
  // 1. Test user pool configuration
  const userPool = diagnoseCognitoConfig();
  
  // 2. Create CognitoUser
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool
  });
  
  // 3. Create AuthenticationDetails
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password
  });
  
  // 4. Test authentication
  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        console.log('Auth Success:', {
          accessToken: result.getAccessToken().getJwtToken() ? 'Present' : 'Missing',
          idToken: result.getIdToken().getJwtToken() ? 'Present' : 'Missing'
        });
        resolve(result);
      },
      onFailure: (err) => {
        console.error('Auth Failure:', {
          name: err.name,
          message: err.message,
          code: err.code
        });
        reject(err);
      },
      newPasswordRequired: (userAttributes, requiredAttributes) => {
        console.log('New password required', { userAttributes, requiredAttributes });
        reject(new Error('New password required'));
      }
    });
  });
};

// Function to check if user exists and is confirmed
export const checkUserStatus = async (email) => {
  const userPool = diagnoseCognitoConfig();
  
  const cognitoUser = new CognitoUser({
    Username: email,
    Pool: userPool
  });

  return new Promise((resolve, reject) => {
    // Instead of getUser, we'll use authenticateUser with a dummy password
    // This will tell us if the user exists without actually logging in
    cognitoUser.authenticateUser(
      new AuthenticationDetails({
        Username: email,
        Password: 'dummy-password-for-check'
      }),
      {
        onSuccess: () => {
          // This shouldn't happen with dummy password
          resolve({
            exists: true,
            confirmed: true,
            status: 'CONFIRMED'
          });
        },
        onFailure: (err) => {
          if (err.code === 'NotAuthorizedException') {
            // If we get "incorrect password", the user exists
            resolve({
              exists: true,
              errorCode: err.code,
              message: 'User exists but password check required'
            });
          } else if (err.code === 'UserNotFoundException') {
            resolve({
              exists: false,
              errorCode: err.code,
              message: 'User does not exist'
            });
          } else if (err.code === 'UserNotConfirmedException') {
            resolve({
              exists: true,
              confirmed: false,
              status: 'UNCONFIRMED',
              errorCode: err.code,
              message: 'User exists but is not confirmed'
            });
          } else {
            console.error('Error checking user status:', err);
            reject(err);
          }
        }
      }
    );
  });
};