/**
 * Global Error Handler Middleware
 * Centralizes error handling and prevents sensitive data leakage
 */

const AppError = require('../utils/AppError');

const errorHandler = (err, req, res, next) => {
  // Default error status and message
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;
  let isOperational = err.isOperational || false;

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', {
      status,
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      isOperational,
      timestamp: new Date().toISOString()
    });
  } else {
    // Log in production (without stack trace)
    console.error('[ERROR]', {
      status,
      message,
      path: req.path,
      method: req.method,
      isOperational,
      timestamp: new Date().toISOString()
    });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    isOperational = true;
  }

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
    isOperational = true;
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    status = 409;
    message = 'Duplicate field value';
    const field = Object.keys(err.keyPattern)[0];
    details = { field: field, message: `${field} already exists` };
    isOperational = true;
  }

  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
    isOperational = true;
  }

  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
    isOperational = true;
  }

  if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized access';
    isOperational = true;
  }

  // Handle SyntaxError (malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    message = 'Invalid JSON format';
    isOperational = true;
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
    isOperational = err.isOperational;
  }

  // Prevent leaking sensitive information for non-operational errors
  if (status === 500 && !isOperational) {
    message = process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : message;
  }

  // Don't send stack trace in production
  const response = {
    success: false,
    error: message,
    status: status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    ...(details && { details: details }),
    timestamp: new Date().toISOString()
  };

  res.status(status).json(response);
};

module.exports = errorHandler;
