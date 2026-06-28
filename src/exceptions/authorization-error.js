import ClientError from './client-error.js';

class AuthorizationError extends ClientError {
  constructor(message) {
    super(message, 403);  // status 403 Forbidden
    this.name = 'AuthorizationError';
  }
}

export default AuthorizationError;