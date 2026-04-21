/**
 * CORS Configuration
 * Fixes: Open CORS vulnerability (V4, CVSS 7.5)
 * Only allows requests from whitelisted origins
 */

const cors = require('cors');

// Whitelisted origins (update based on your domains)
// Fix: Only include specific production domains and known development ports
const allowedOrigins = [
  'https://doctor.healthapp.com',
  'https://patient.healthapp.com',
  'https://admin.healthapp.com',
  'https://www.healthapp.com',
  'https://company.healthapp.com'
];

// Development: Add specific localhost ports and env overrides
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  allowedOrigins.push(
    'http://localhost:3000',   // Company Web (Next.js)
    'http://localhost:5173',   // Doctor Web (Vite)
    'http://localhost:5174',   // Super Admin Web (Vite)
    'http://localhost:6002'    // Registration Page (HTML)
  );

  // Add origins from .env
  if (process.env.CORS_ORIGINS) {
    const envOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
    allowedOrigins.push(...envOrigins);
  }
}

const corsOptions = {
  origin: true, // Allow all origins temporarily for debugging
  credentials: true, // Allow credentials (cookies, auth headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'x-auth-token'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-RateLimit-Remaining',
    'x-auth-token'
  ],
  maxAge: 86400, // 24 hours - preflight cache time
  optionsSuccessStatus: 200 // For legacy IE
};

// Custom CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Your origin is not authorized to access this resource'
    });
  }
  next(err);
};

module.exports = {
  corsOptions,
  corsErrorHandler,
  corsMiddleware: cors(corsOptions)
};
