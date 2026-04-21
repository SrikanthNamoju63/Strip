/**
 * Custom Application Error Class
 * Provides structured error handling with status codes and operational error flag
 */

class AppError extends Error {
  /**
   * Create an AppError
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - Whether this is an expected operational error
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500, isOperational = true, details = null) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a 400 Bad Request error
   */
  static badRequest(message, details = null) {
    return new AppError(message, 400, true, details);
  }

  /**
   * Create a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized access', details = null) {
    return new AppError(message, 401, true, details);
  }

  /**
   * Create a 403 Forbidden error
   */
  static forbidden(message = 'Access forbidden', details = null) {
    return new AppError(message, 403, true, details);
  }

  /**
   * Create a 404 Not Found error
   */
  static notFound(message = 'Resource not found', details = null) {
    return new AppError(message, 404, true, details);
  }

  /**
   * Create a 409 Conflict error
   */
  static conflict(message = 'Resource conflict', details = null) {
    return new AppError(message, 409, true, details);
  }

  /**
   * Create a 422 Validation Error
   */
  static validation(message = 'Validation failed', details = null) {
    return new AppError(message, 422, true, details);
  }

  /**
   * Create a 429 Too Many Requests error
   */
  static tooManyRequests(message = 'Too many requests', details = null) {
    return new AppError(message, 429, true, details);
  }

  /**
   * Create a 500 Internal Server Error
   */
  static internal(message = 'Internal server error', details = null) {
    return new AppError(message, 500, false, details);
  }

  /**
   * Create a 503 Service Unavailable error
   */
  static serviceUnavailable(message = 'Service temporarily unavailable', details = null) {
    return new AppError(message, 503, true, details);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
      timestamp: this.timestamp
    };
  }
}

module.exports = AppError;
