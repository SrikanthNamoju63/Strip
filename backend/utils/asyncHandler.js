/**
 * Async Handler Utility
 * Wraps async route handlers to catch errors and pass them to Express error middleware
 * Eliminates the need for try-catch blocks in every controller
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * }));
 */

/**
 * Wraps an async function to catch errors and forward them to Express error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Wraps an async function for use with Socket.IO
 * @param {Function} fn - Async function to wrap
 * @param {Function} errorHandler - Custom error handler callback
 * @returns {Function} Socket.IO event handler
 */
const asyncSocketHandler = (fn, errorHandler) => {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, ...args);
      } else {
        console.error('Socket handler error:', error);
      }
    }
  };
};

/**
 * Higher-order function to wrap all methods of a controller object
 * @param {Object} controller - Controller object with async methods
 * @returns {Object} Controller with wrapped methods
 */
const wrapController = (controller) => {
  const wrapped = {};
  for (const [key, value] of Object.entries(controller)) {
    if (typeof value === 'function') {
      wrapped[key] = asyncHandler(value);
    } else {
      wrapped[key] = value;
    }
  }
  return wrapped;
};

module.exports = {
  asyncHandler,
  asyncSocketHandler,
  wrapController
};
