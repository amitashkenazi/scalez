// src/services/exceptions.js
export class AuthenticationException extends Error {
    constructor(message = 'Authentication required') {
      super(message);
      this.name = 'AuthenticationException';
    }
  }
  
  export class NetworkException extends Error {
    constructor(message = 'Network error occurred', originalError = null) {
      super(message);
      this.name = 'NetworkException';
      this.originalError = originalError;
    }
  }
  
  export class ApiException extends Error {
    constructor(message = 'API error occurred', status = 500) {
      super(message);
      this.name = 'ApiException';
      this.status = status;
    }
  }