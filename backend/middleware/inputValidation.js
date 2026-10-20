/**
 * Input Validation & Sanitization Middleware
 * Fixes: No input validation vulnerability (V6, CVSS 8.0)
 * Prevents XSS, SQLi, NoSQL injection attacks
 */

const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss');
const mongoSanitize = require('mongo-sanitize');

/**
 * Validation error handler
 * Used after validators to check for errors
 */
const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: '[REDACTED]' // Don't expose user input
      }))
    });
  }
  next();
};

/**
 * Sanitization middleware
 * Must run BEFORE validation to clean inputs
 */
const sanitizeInputs = (req, res, next) => {
  // Webhook routes intentionally receive a Buffer so their provider signature
  // can be checked against the exact bytes. Never coerce that Buffer into an
  // object while sanitizing ordinary JSON requests.
  if (Buffer.isBuffer(req.body)) {
    return next();
  }

  // Sanitize MongoDB queries
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }

  // XSS protection: sanitize string fields
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      return xss(obj, {
        whiteList: {}, // No HTML allowed
        stripIgnoredTag: true,
        stripLeakedAttrs: true
      });
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (typeof obj === 'object' && obj !== null) {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);

  next();
};

/**
 * Common validators
 */
const validators = {
  // Email validation
  email: body('email')
    .trim()
    .toLowerCase()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  // Password validation (12+ chars, complexity requirements)
  password: body('password')
    .isLength({ min: 12 })
    .withMessage('Password must be at least 12 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain special character (!@#$%^&*)'),

  // MongoDB ObjectId validation
  mongoId: (fieldName = 'id') =>
    param(fieldName)
      .isMongoId()
      .withMessage(`Invalid ${fieldName} format`),

  // Date validation (future date)
  futureDateISO: (fieldName = 'date') =>
    body(fieldName)
      .isISO8601()
      .withMessage('Invalid date format')
      .custom(value => {
        if (new Date(value) <= new Date()) {
          throw new Error('Date must be in the future');
        }
        return true;
      }),

  // Phone number (Indian format)
  phoneNumber: body('phone')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Invalid Indian phone number')
    .trim(),

  // Duration (15-120 minutes)
  duration: body('duration')
    .isInt({ min: 15, max: 120 })
    .withMessage('Duration must be between 15 and 120 minutes'),

  // Consultation fee (0-10000)
  fee: body('consultationFee')
    .isInt({ min: 0, max: 10000 })
    .withMessage('Consultation fee must be between 0 and 10000'),

  // Text field (no XSS)
  textField: (fieldName) =>
    body(fieldName)
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage(`${fieldName} must be between 1-500 characters`)
      .matches(/^[a-zA-Z0-9\s,.!?-]*$/)
      .withMessage(`${fieldName} contains invalid characters`),

  // URL validation
  url: body('url')
    .isURL()
    .withMessage('Invalid URL format'),

  // File upload size limit check
  fileSize: (maxSizeInMB = 10) => (req, res, next) => {
    const contentLength = req.get('content-length');
    const maxBytes = maxSizeInMB * 1024 * 1024;

    if (contentLength && parseInt(contentLength) > maxBytes) {
      return res.status(413).json({
        error: `File too large. Maximum size: ${maxSizeInMB}MB`
      });
    }
    next();
  }
};

/**
 * Preset validation chains for common endpoints
 */
const validationChains = {
  // User registration
  registerUser: [
    validators.email,
    validators.password,
    body('firstName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    validators.phoneNumber,
    validationErrorHandler
  ],

  // Login
  login: [
    validators.email,
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required'),
    validationErrorHandler
  ],

  // Doctor registration
  registerDoctor: [
    validators.email,
    validators.password,
    body('firstName').trim().isLength({ min: 2 }).withMessage('Invalid first name'),
    body('lastName').trim().isLength({ min: 2 }).withMessage('Invalid last name'),
    validators.phoneNumber,
    body('licenseNumber')
      .matches(/^[A-Z0-9]{10,20}$/)
      .withMessage('Invalid license number format'),
    body('specialization')
      .isIn(['Cardiology', 'Dermatology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General'])
      .withMessage('Invalid specialization'),
    validationErrorHandler
  ],

  // Create appointment
  createAppointment: [
    validators.mongoId('doctorId'),
    validators.futureDateISO('appointmentDate'),
    body('appointmentDate')
      .isISO8601()
      .custom(date => {
        // Cannot book more than 30 days in advance
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        if (new Date(date) > thirtyDaysFromNow) {
          throw new Error('Cannot book more than 30 days in advance');
        }
        return true;
      }),
    body('appointmentTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (HH:MM)'),
    validators.duration,
    validators.fee,
    body('reason')
      .trim()
      .isLength({ min: 10, max: 500 })
      .optional()
      .withMessage('Reason must be 10-500 characters'),
    validationErrorHandler
  ],

  // Payment processing
  processPayment: [
    validators.mongoId('appointmentId'),
    body('amount')
      .isInt({ min: 1 })
      .withMessage('Invalid payment amount'),
    body('paymentMethod')
      .isIn(['stripe', 'razorpay'])
      .withMessage('Invalid payment method'),
    validationErrorHandler
  ]
};

module.exports = {
  sanitizeInputs,
  validationErrorHandler,
  validators,
  validationChains
};
