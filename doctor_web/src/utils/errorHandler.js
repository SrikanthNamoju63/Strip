/**
 * Frontend Error Handler Utility
 * Provides consistent error handling across the application
 */

import { toast } from 'react-hot-toast';

/**
 * Parse API error response and return user-friendly message
 * @param {Error} error - Axios error object
 * @returns {string} User-friendly error message
 */
export const parseApiError = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Network errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (error.code === 'ERR_NETWORK') {
      return 'Network error. Please check your connection.';
    }
    return 'Unable to connect to server. Please try again later.';
  }

  const { status, data } = error.response;

  // Handle specific status codes
  switch (status) {
    case 400:
      return data?.error || data?.msg || 'Invalid request. Please check your input.';
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return data?.error || 'You do not have permission to perform this action.';
    case 404:
      return data?.error || 'The requested resource was not found.';
    case 409:
      return data?.error || 'This action conflicts with existing data.';
    case 422:
      return data?.error || 'Validation failed. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return data?.error || data?.msg || `An error occurred (${status})`;
  }
};

/**
 * Handle API errors with optional toast notification
 * @param {Error} error - Axios error object
 * @param {Object} options - Handler options
 * @param {boolean} options.showToast - Whether to show toast notification
 * @param {string} options.fallbackMessage - Fallback message if error parsing fails
 * @param {Function} options.onError - Callback function to execute on error
 * @returns {string} Parsed error message
 */
export const handleApiError = (error, options = {}) => {
  const {
    showToast = true,
    fallbackMessage = 'An error occurred',
    onError = null
  } = options;

  const message = parseApiError(error) || fallbackMessage;

  // Execute callback if provided
  if (onError && typeof onError === 'function') {
    onError(error, message);
  }

  // Show toast notification
  if (showToast) {
    toast.error(message);
  }

  return message;
};

/**
 * Wrap async function with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {Object} options - Error handling options
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (asyncFn, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      handleApiError(error, options);
      throw error; // Re-throw for further handling if needed
    }
  };
};

/**
 * Create a safe async function that returns [data, error] tuple
 * Similar to Go error handling pattern
 * @param {Function} asyncFn - Async function to wrap
 * @returns {Function} Safe async function
 */
export const createSafeAsync = (asyncFn) => {
  return async (...args) => {
    try {
      const data = await asyncFn(...args);
      return [data, null];
    } catch (error) {
      const message = parseApiError(error);
      return [null, { error, message, original: error }];
    }
  };
};

/**
 * Error boundary fallback component props generator
 * @param {Error} error - Error object
 * @param {Function} resetErrorBoundary - Function to reset error boundary
 * @returns {Object} Props for error fallback UI
 */
export const getErrorFallbackProps = (error, resetErrorBoundary) => {
  return {
    title: 'Something went wrong',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'We apologize for the inconvenience. Please try refreshing the page.',
    onRetry: resetErrorBoundary,
    showDetails: process.env.NODE_ENV === 'development'
  };
};

/**
 * Log error to console in development, send to analytics in production
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export const logError = (error, context = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error, context);
  } else {
    // In production, you might want to send to error tracking service
    // e.g., Sentry, LogRocket, etc.
    console.error('[Error]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate form data and return errors object
 * @param {Object} data - Form data
 * @param {Object} rules - Validation rules
 * @returns {Object} Errors object
 */
export const validateForm = (data, rules) => {
  const errors = {};

  for (const [field, value] of Object.entries(data)) {
    const rule = rules[field];
    if (!rule) continue;

    // Required check
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = rule.requiredMessage || `${field} is required`;
      continue;
    }

    // Skip further checks if value is empty and not required
    if (!value) continue;

    // Min length check
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters`;
    }

    // Max length check
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.maxLengthMessage || `${field} must be at most ${rule.maxLength} characters`;
    }

    // Pattern check
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${field} format is invalid`;
    }

    // Custom validation
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  }

  return errors;
};

export default {
  parseApiError,
  handleApiError,
  withErrorHandling,
  createSafeAsync,
  getErrorFallbackProps,
  logError,
  validateForm
};
