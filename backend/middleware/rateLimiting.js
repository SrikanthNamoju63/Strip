/**
 * Rate Limiting Middleware
 * Fixes: No rate limiting vulnerability (V5, CVSS 8.3)
 * Prevents brute force attacks and DoS
 */

const { rateLimit } = require('express-rate-limit');
const getClientIp = (req) => req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
// Robust import for RedisStore to handle different package versions/builds
let RedisStoreLib = require('rate-limit-redis');
const RedisStore = RedisStoreLib.RedisStore || RedisStoreLib.default || RedisStoreLib;
const redis = require('redis');

// Check if Redis should be used (default to false for development/simplicity)
const startRedis = process.env.USE_REDIS === 'true';

let redisClient = null;

if (startRedis) {
  // Create Redis client for rate limiting
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retry_strategy: (options) => {
      if (options.error && options.error.code === 'ECONNREFUSED') {
        console.error('Rate limiting Redis connection refused - falling back');
        return new Error('Rate limiting unavailable');
      }
      if (options.total_retry_time > 1000 * 60 * 60) {
        return new Error('Rate limiting retry time exhausted');
      }
      if (options.attempt > 10) {
        return undefined;
      }
      return Math.min(options.attempt * 100, 3000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis rate limiting error:', err);
  });

  // Connect to Redis (required for Redis v4)
  (async () => {
    try {
      await redisClient.connect();
      console.log('Redis client for rate limiting connected');
    } catch (err) {
      console.error('Redis connection failed:', err);
    }
  })();
} else {
  console.log('Redis rate limiting disabled (USE_REDIS!=true). Using in-memory store.');
}

// Helper to get store configuration
const getStore = (prefix) => {
  if (startRedis && redisClient) {
    try {
      return new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: prefix
      });
    } catch (err) {
      console.error('RedisStore init failed, falling back to MemoryStore:', err.message);
      return undefined;
    }
  }
  return undefined; // Defaults to MemoryStore
};

/**
 * Auth endpoints rate limiter
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  store: getStore('auth-limit:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests max
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for admin users (SUPER_ADMIN only)
    return req.user?.role === 'SUPER_ADMIN';
  },
  keyGenerator: (req) => {
    // Use IP + user agent for better attack detection
    return `${getClientIp(req)}-${req.get('user-agent') || 'unknown'}`;
  },
  handler: (req, res) => {
    // Log suspicious activity
    console.warn(`Auth rate limit reached for IP: ${req.ip}`);

    return res.status(429).json({
      error: 'Too many login attempts',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
const apiLimiter = rateLimit({
  store: getStore('api-limit:'),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for admin users and health checks
    return req.user?.role === 'SUPER_ADMIN' || req.path === '/health';
  },
  keyGenerator: (req) => {
    // Authenticated users: rate limit by user ID
    if (req.user?.id) {
      return `${req.user.id}-api`;
    }
    // Unauthenticated: rate limit by IP
    return `${getClientIp(req)}-api`;
  }
});

/**
 * Payment endpoints rate limiter
 * 1 payment attempt per 30 seconds
 * (Prevents duplicate payment submissions)
 */
const paymentLimiter = rateLimit({
  store: getStore('payment-limit:'),
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // 1 payment per 30 seconds
  message: 'Please wait before attempting another payment.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role === 'SUPER_ADMIN',
  keyGenerator: (req) => {
    // Rate limit by user ID (logged-in required)
    return req.user?.id
      ? `${req.user.id}-payment`
      : `${getClientIp(req)}-payment`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too many payment attempts',
      message: 'Please wait 30 seconds before trying again',
      retryAfter: 30
    });
  }
});

/**
 * Password reset rate limiter
 * 3 requests per hour per email
 */
const passwordResetLimiter = rateLimit({
  store: getStore('password-reset:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset requests. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email address
    return req.body?.email || req.ip;
  }
});

/**
 * Signup/registration rate limiter
 * 5 new accounts per IP per hour
 * (Prevents account enumeration and bot signups)
 */
const signupLimiter = rateLimit({
  store: getStore('signup-limit:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 new accounts per hour
  message: 'Too many accounts created. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return getClientIp(req);
  }
});

/**
 * Doctor verification endpoints rate limiter
 * Limit admin verification actions (prevents approval spam)
 */
const adminActionLimiter = rateLimit({
  store: getStore('admin-action:'),
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 admin actions per minute (reasonable limit)
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.user?.role !== 'SUPER_ADMIN', // Only for admins
  keyGenerator: (req) => {
    return `${req.user.id}-admin-action`;
  }
});

/**
 * File upload rate limiter
 * 10 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  store: getStore('upload-limit:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded. Try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

/**
 * Global request size limit middleware
 * Prevents large payload DoS attacks
 */
const requestSizeLimit = (req, res, next) => {
  const contentLength = req.get('content-length');
  const maxBytes = 10 * 1024 * 1024; // Matches the upload limit

  if (contentLength && parseInt(contentLength) > maxBytes) {
    return res.status(413).json({
      error: 'Payload too large',
      message: `Request size must not exceed 10MB (received: ${Math.round(parseInt(contentLength) / 1024 / 1024)}MB)`
    });
  }
  next();
};

module.exports = {
  authLimiter,
  apiLimiter,
  paymentLimiter,
  passwordResetLimiter,
  signupLimiter,
  adminActionLimiter,
  uploadLimiter,
  requestSizeLimit,
  redisClient
};
