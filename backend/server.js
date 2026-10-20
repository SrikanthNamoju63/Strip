/**
 * Updated Server.js with All Phase 1 Security Middleware
 * Integrates critical vulnerability fixes:
 * - JWT secret hardening
 * - CORS whitelist (no wildcard)
 * - Input validation & sanitization
 * - Rate limiting
 * - Token blacklist on logout
 * - Helmet security headers
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');

// Custom security middleware
const securityHeaders = require('./middleware/securityHeaders');
const { corsMiddleware, corsErrorHandler } = require('./middleware/corsConfig');
const { sanitizeInputs } = require('./middleware/inputValidation');
const {
  apiLimiter,
  paymentLimiter,
  requestSizeLimit
} = require('./middleware/rateLimiting');
const {
  authMiddleware,
  requireAdmin,
  requireDoctor
} = require('./middleware/enhancedAuthMiddleware');

// ... (imports remain)

const app = express();
app.disable('x-powered-by');

console.log('Starting server...');

// ============================================
// PHASE 1: SECURITY MIDDLEWARE STACK
// ============================================

// 0. CORS - Critical: must be evaluated before any API route.
app.use(corsMiddleware);

// Payment providers sign the exact request bytes. This must run before the
// JSON parser so a webhook cannot be verified against a re-serialized body.
app.use('/api/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }));

// 1. Request size limiting (DoS protection)
app.use(requestSizeLimit);

// 2. Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// 3. Compression
app.use(compression());

// 4. Security headers (Helmet + HSTS + CSP + X-Frame-Options)
app.use(securityHeaders);

// 5. Input sanitization (before validation)
app.use(sanitizeInputs);

// Uploaded medical reports must never be reachable through the public static
// mount. Profile and gallery images continue to be served with safe headers.
app.use('/uploads/reports', (req, res) => res.status(403).json({ error: 'Forbidden' }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads'), {
  dotfiles: 'deny',
  index: false,
  fallthrough: false,
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
  }
}));

// ============================================
// RATE LIMITING BY ENDPOINT TYPE
// ============================================

// Auth routes attach dedicated login, signup, and password-reset limiters so
// registration is not accidentally counted as a failed login attempt.

// General API: 100 requests per minute
app.use('/api/', apiLimiter);

// Payment endpoints: 1 per 30 seconds
app.use('/api/payments/process', paymentLimiter);

// ============================================
// REQUEST LOGGING (no sensitive data)
// ============================================

app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (res.statusCode >= 400) {
      console.warn(`[${res.statusCode}] ${req.method} ${req.path} ${duration}ms`);
    }
  });
  next();
});

// ============================================
// HEALTH CHECK (no auth required)
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// This path is used by the Docker health check and must remain cheap and
// unauthenticated. It exposes no configuration or patient data.
app.get('/api/health', (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/check', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    securityLevel: 'Phase 1 - Secure',
    features: [
      'Helmet Security Headers',
      'CORS Whitelist',
      'Input Validation',
      'Rate Limiting',
      'JWT with Refresh Tokens',
      'Token Blacklist on Logout'
    ]
  });
});

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

console.log('Defining routes...');
try {
  app.use('/api/session', require('./routes/sessionRoutes'));
  app.use('/api/auth', require('./routes/authRoutes'));
  // Real-time stats endpoint (public for initial load)
  app.use('/api/realtime', require('./routes/realtimeRoutes'));
  // Admin routes contains its own login (public) and protected routes
  app.use('/api/admin', require('./routes/adminRoutes'));

  // Publicly accessible routes (internal auth middleware handles protection where needed)
  app.use('/api/doctors', require('./routes/doctorRoutes'));
  app.use('/api/blood', require('./routes/bloodRoutes'));
  app.use('/api/fees', require('./routes/feeConfigRoutes'));
} catch (e) {
  console.error('Public route error:', e);
}

// ============================================
// PROTECTED ROUTES (auth required)
// ============================================

// Apply authentication to all remaining routes
app.use('/api/', authMiddleware);

try {
  app.use('/api/users', require('./routes/userRoutes'));
  app.use('/api/appointments', require('./routes/appointmentRoutes'));
  app.use('/api/payments', require('./routes/paymentRoutes'));
  app.use('/api/ratings', require('./routes/ratingRoutes'));
  app.use('/api/admin/settlements', require('./routes/settlementRoutes'));
  app.use('/api/health', require('./routes/healthRoutes'));
  app.use('/api/app-feedback', require('./routes/appFeedbackRoutes'));
  app.use('/api/support', require('./routes/supportRoutes'));
  app.use('/api/audit', require('./routes/auditRoutes'));
  app.use('/api/content', require('./routes/contentRoutes'));
  app.use('/api/insurance', require('./routes/insuranceRoutes'));
  app.use('/api/campaigns', require('./routes/campaignRoutes'));
  app.use('/api/backups', require('./routes/backupRoutes'));
  app.use('/api/coupons', require('./routes/couponRoutes'));

  // Admin-only routes
  // Moved to public section to allow login
} catch (e) {
  console.error('Protected route error:', e);
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Global error handler (must be last)
app.use(corsErrorHandler);
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('Unhandled error:', err);
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large' });
  }
  return res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : (err.message || 'Request failed'),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// DATABASE CONNECTION
// ============================================

const connectDB = require('./config/db');

console.log('Connecting to DB...');
try {
  if (process.env.NODE_ENV !== 'test') {
    connectDB();
  }
} catch (err) {
  console.error('DB Connection Error:', err);
}

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`
  ╔════════════════════════════════════════════════════════════════╗
  ║                 HEALTHCARE PLATFORM API                        ║
  ║           Phase 1 - Security Hardening Complete                ║
  ╠════════════════════════════════════════════════════════════════╣
  ║ Server:     http://localhost:${PORT}                              ║
  ║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(44)}║
  ║ Timestamp:  ${new Date().toISOString().padEnd(44)}║
  ║                                                                ║
  ║ Security Features ENABLED:                                     ║
  ║  ✓ Helmet Security Headers                                    ║
  ║  ✓ CORS Whitelist                                             ║
  ║  ✓ Input Validation & Sanitization                            ║
  ║  ✓ Rate Limiting (Auth, API, Payment)                         ║
  ║  ✓ JWT Refresh Token Flow                                     ║
  ║  ✓ Token Blacklist on Logout                                  ║
  ║  ✓ Request Size Limits                                        ║
  ║  ✓ XSS & SQLi Protection                                      ║
  ║                                                                ║
  ║ Audit Fixes: Phase 1 vulnerabilities addressed                 ║
  ║  - V1: Weak JWT Secret (CVSS 9.1)                              ║
  ║  - V3: No Token Blacklist (CVSS 8.5)                           ║
  ║  - V4: Open CORS (CVSS 7.5)                                    ║
  ║  - V5: No Rate Limiting (CVSS 8.3)                             ║
  ║  - V6: No Input Validation (CVSS 8.0)                          ║
  ║  - V7: Missing Helmet (CVSS 6.5)                               ║
  ╚════════════════════════════════════════════════════════════════╝
    `);

    // Initialize Socket.io
    try {
      const socketManager = require('./utils/socket');
      socketManager.init(server);
      console.log('✓ Socket.io initialized');
    } catch (e) {
      console.warn('⚠ Socket.io initialization skipped:', e.message);
    }

    // Initialize Cron Jobs
    try {
      require('./utils/cron')();
      console.log('✓ Cron jobs initialized');
    } catch (e) {
      console.warn('⚠ Cron initialization skipped:', e.message);
    }
  });

  server.on('error', (e) => {
    console.error('Server error:', e);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n📋 Shutting down gracefully...');
    server.close(async () => {
      console.log('✓ Server closed');
      try {
        await mongoose.connection.close();
        console.log('✓ Database connection closed');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database connection:', err);
        process.exit(1);
      }
    });
  });
}

module.exports = app;
