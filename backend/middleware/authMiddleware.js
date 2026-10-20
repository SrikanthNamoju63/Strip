const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_ALGORITHM = 'HS256';

const getSigningSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters');
  }
  return secret;
};

const getBearerToken = (req) => {
  const authorization = req.get('Authorization');
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  return req.get('x-auth-token')?.trim();
};

const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, getSigningSecret(), {
    algorithms: [ACCESS_TOKEN_ALGORITHM]
  });

  const user = decoded?.user;
  if (!user?.id || !user?.role) {
    const error = new jwt.JsonWebTokenError('Invalid token payload');
    throw error;
  }

  return { decoded, user };
};

const protect = function (req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ msg: 'Authentication is required' });
  }

  try {
    const { decoded, user } = verifyAccessToken(token);
    req.user = { ...user };

    // Staff act within their owning doctor's scope, but retain their staff ID
    // for profile and audit operations.
    if (['RECEPTIONIST', 'NURSE'].includes(req.user.role)) {
      req.user.staffId = req.user.id;
      req.user.id = req.user.doctorId;
    }

    req.token = token;
    req.tokenExpiry = decoded.exp;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ msg: 'Session expired. Please sign in again.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid authentication token' });
    }
    console.error('Authentication configuration error:', err.message);
    return res.status(500).json({ msg: 'Authentication is unavailable' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ msg: 'You are not authorized to access this resource' });
  }
  return next();
};

// Preserve the established default/named import API for existing routes.
protect.protect = protect;
protect.authorize = authorize;
protect.getBearerToken = getBearerToken;
protect.verifyAccessToken = verifyAccessToken;

module.exports = protect;
