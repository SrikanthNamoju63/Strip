/**
 * Central CORS policy.
 *
 * Credentials must never be combined with a reflected (or wildcard) origin.
 * Keep production origins in CORS_ORIGINS; localhost entries are deliberately
 * available only outside production.
 */
const cors = require('cors');

const productionOrigins = [
  'https://doctor.healthapp.com',
  'https://patient.healthapp.com',
  'https://admin.healthapp.com',
  'https://www.healthapp.com',
  'https://company.healthapp.com'
];

const developmentOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:6002'
];

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  ...productionOrigins,
  ...configuredOrigins,
  ...(process.env.NODE_ENV === 'production' ? [] : developmentOrigins)
]);

const isAllowedOrigin = (origin) => !origin || allowedOrigins.has(origin);

const corsOptions = {
  origin(origin, callback) {
    // Requests without Origin are non-browser clients (mobile apps, health
    // checks, server-to-server calls) and are not subject to browser CORS.
    if (isAllowedOrigin(origin)) return callback(null, true);

    const error = new Error('CORS policy violation');
    error.code = 'CORS_NOT_ALLOWED';
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'x-auth-token'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'RateLimit-Remaining'],
  maxAge: 86400,
  optionsSuccessStatus: 204
};

const corsErrorHandler = (err, req, res, next) => {
  if (err?.code === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'This origin is not authorized to access the API.'
    });
  }
  return next(err);
};

module.exports = {
  allowedOrigins,
  corsOptions,
  corsErrorHandler,
  corsMiddleware: cors(corsOptions),
  isAllowedOrigin
};
