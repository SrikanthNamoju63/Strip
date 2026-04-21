const jwt = require('jsonwebtoken');

const protect = function (req, res, next) {
    // Debug logging
    // console.log('Auth Middleware - Headers:', req.headers);

    // Get token from header
    let token = req.header('x-auth-token');

    // Check for Authorization header if x-auth-token is missing
    if (!token && req.header('Authorization')) {
        const authHeader = req.header('Authorization');
        // console.log('Auth Middleware - Found Authorization Header:', authHeader);
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.slice(7, authHeader.length);
        } else {
            token = authHeader;
        }
    }

    // Check if not token
    if (!token) {
        console.log('Auth Middleware - No Token Found');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // console.log('Auth Middleware - Token Verified. User:', decoded.user);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.error('Auth Middleware - Verification Failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid', error: err.message });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                msg: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route`
            });
        }
        next();
    };
};

// Export as both default function (backward compatibility) and named properties
const middleware = protect;
middleware.protect = protect;
middleware.authorize = authorize;

module.exports = middleware;
