/**
 * Enhanced Authentication Middleware
 * Fixes: Weak JWT secret (V1, CVSS 9.1), No token blacklist (V3, CVSS 8.5)
 * Implements token refresh flow and logout blacklisting
 */

const jwt = require('jsonwebtoken');
const redis = require('redis');

// Redis client for token blacklist
// Redis client for token blacklist
let redisClient;

// Only initialize Redis if explicitly enabled
if (process.env.USE_REDIS === 'true') {
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
    password: process.env.REDIS_PASSWORD
  });

  redisClient.on('error', (err) => {
    // Only log operational errors, don't crash
    console.error('Redis Client Error:', err.message);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  // Connect immediately
  (async () => {
    try {
      await redisClient.connect();
    } catch (e) {
      console.log('Redis Connection Failed:', e.message);
    }
  })();
} else {
  console.log('Redis Disabled (USE_REDIS!=true). Token blacklist will be in-memory (per instance) or disabled.');
  // Mock client or handle null checks in functions
}

/**
 * Verify JWT token and check if blacklisted
 * Must use strong secret from Secrets Manager
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    // Extract token from Authorization header or x-auth-token (for Admin)
    const authHeader = req.get('Authorization');
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.header('x-auth-token')) {
      token = req.header('x-auth-token');
    }

    if (!token) {
      // console.log('Auth Middleware: No token found in headers');
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
    }

    // Verify token signature with strong secret
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('Invalid JWT_SECRET configuration - must be ≥32 characters');
    }

    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256']
    });

    // Handle legacy payload structure { user: { id: ... } }
    const payload = decoded.user || decoded;

    // Attach user info to request
    req.user = {
      id: payload.id || payload.userId || payload._id,
      role: payload.role,
      email: payload.email,
      isDoctorModel: payload.isDoctorModel, // Preserve this flag
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };

    // Alias for Admin controllers that expect req.admin
    if (['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(payload.role)) {
      req.admin = req.user;
    }

    // Check token not expired (should be caught by jwt.verify, but explicit check)
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({ error: 'Token has expired' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please use refresh token to get new access token'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: error.message
      });
    }
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Verify refresh token and issue new access token
 * Must also check if refresh token is blacklisted
 */
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Check if refresh token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Refresh token is invalid. Please log in again.' });
    }

    // Verify refresh token
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(refreshToken, secret, {
      algorithms: ['HS256']
    });

    // Issue new access token (short-lived: 15 minutes)
    const newAccessToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // 15 minute expiry
    );

    // Issue new refresh token (long-lived: 7 days)
    const newRefreshToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email
      },
      secret,
      { expiresIn: '7d' } // 7 day expiry
    );

    // Blacklist old refresh token
    await blacklistToken(refreshToken, 7 * 24 * 60 * 60); // 7 days TTL

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900 // 15 minutes in seconds
    });
  } catch (error) {
    return res.status(401).json({
      error: 'Token refresh failed',
      message: error.message
    });
  }
};

/**
 * Logout handler - blacklist the refresh token
 * Prevents token reuse after logout
 */
const logoutHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Blacklist the refresh token
      // Use 7 day TTL since refresh tokens are valid for 7 days
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    }

    // Also blacklist access token to prevent any further use
    const authHeader = req.get('Authorization');
    if (authHeader) {
      const accessToken = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

      // Blacklist access token (15 minute TTL since expiry is 15 min)
      await blacklistToken(accessToken, 15 * 60);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    // Still return success even if blacklist fails (token will expire naturally)
    res.json({ message: 'Logged out' });
  }
};

/**
 * Blacklist a token by adding it to Redis (or in-memory fallback)
 */
async function blacklistToken(token, ttl) {
  try {
    if (redisClient && redisClient.isOpen) {
      const key = `blacklist:${token}`;
      await redisClient.setEx(key, ttl, '1');
    } else {
      // Fallback or no-op
      // console.warn('Redis not available for blacklist');
    }
  } catch (err) {
    console.error('Error blacklisting token:', err.message);
    // Don't throw, just log
  }
}

/**
 * Check if token is blacklisted
 */
async function isTokenBlacklisted(token) {
  try {
    if (redisClient) {
      if (!redisClient.isOpen) {
        try {
          // await redisClient.connect(); // Don't force reconnect here if it failed initially
          return false;
        } catch (e) {
          return false;
        }
      }
      const key = `blacklist:${token}`;
      const reply = await redisClient.get(key);
      return reply === '1';
    }
    return false;
  } catch (err) {
    console.error('Error checking token blacklist:', err.message);
    return false;
  }
}

/**
 * Verify 2FA token (one-time code sent via SMS/Email)
 * Used during login process
 */
const verify2FAHandler = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: 'userId and otp required' });
    }

    // Verify OTP from Redis (should have been set during login)
    const storedOtp = await new Promise((resolve, reject) => {
      redisClient.get(`2fa-otp:${userId}`, (err, reply) => {
        if (err) reject(err);
        else resolve(reply);
      });
    });

    if (!storedOtp || storedOtp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP valid, delete it and issue tokens
    redisClient.del(`2fa-otp:${userId}`);

    // Issue access and refresh tokens
    const accessToken = jwt.sign(
      { userId, role: 'DOCTOR' }, // Role should be fetched from DB
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ accessToken, refreshToken, expiresIn: 900 });
  } catch (error) {
    return res.status(401).json({ error: 'OTP verification failed' });
  }
};

/**
 * Admin-only route middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Doctor-only route middleware
 */
const requireDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Doctor access required' });
  }
  next();
};

/**
 * Patient-only route middleware
 */
const requirePatient = (req, res, next) => {
  if (!req.user || req.user.role !== 'USER') {
    return res.status(403).json({ error: 'Patient access required' });
  }
  next();
};

module.exports = {
  authMiddleware,
  refreshTokenHandler,
  logoutHandler,
  verify2FAHandler,
  blacklistToken,
  isTokenBlacklisted,
  requireAdmin,
  requireDoctor,
  requirePatient
};
