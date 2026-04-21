/**
 * Security Headers Middleware
 * Implements Helmet + additional security headers
 * Fixes: Missing Helmet vulnerability (V7, CVSS 6.5)
 */

const helmet = require('helmet');
const hpp = require('hpp');

const securityHeadersMiddleware = [
  // Helmet configuration
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: [
          "'self'",
          'https://api.stripe.com',
          'https://api.razorpay.com',
          'https://api.twilio.com'
        ],
        fontSrc: ["'self'", 'data:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      },
      reportUri: '/api/v1/security/csp-reports'
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'DENY'
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: []
    }
  }),

  // Parameter Pollution attack prevention
  hpp({
    whitelist: [
      'sort',
      'limit',
      'skip',
      'page',
      'search',
      'filter',
      'status'
    ]
  }),

  // Custom security headers
  (req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Clickjacking protection
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS protection (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Prevent caching of sensitive pages
    if (req.path.includes('/api/v1/auth') || req.path.includes('/api/v1/admin')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }

    // Remove powered-by header (don't reveal tech stack)
    res.removeHeader('X-Powered-By');

    next();
  }
];

module.exports = securityHeadersMiddleware;
