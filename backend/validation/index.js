/**
 * Validation Schemas
 * Input validation schemas for API requests
 */

const { body, param, query, validationResult } = require('express-validator');

// Helper to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User Validation
const userValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    body('fullName')
      .trim()
      .notEmpty()
      .isLength({ max: 100 })
      .withMessage('Full name is required and must be less than 100 characters'),
    body('phone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage('Invalid phone number format'),
    handleValidationErrors
  ],

  login: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  updateProfile: [
    body('fullName')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Full name must be less than 100 characters'),
    body('phone')
      .optional()
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage('Invalid phone number format'),
    body('dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('gender')
      .optional()
      .isIn(['M', 'F', 'Other'])
      .withMessage('Gender must be M, F, or Other'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number and special character'),
    handleValidationErrors
  ]
};

// Doctor Validation
const doctorValidation = {
  register: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full name is required'),
    body('licenseNumber')
      .trim()
      .notEmpty()
      .withMessage('License number is required'),
    body('specialization')
      .trim()
      .notEmpty()
      .withMessage('Specialization is required'),
    body('experience')
      .optional()
      .isInt({ min: 0, max: 70 })
      .withMessage('Experience must be a valid number'),
    handleValidationErrors
  ],

  updateProfile: [
    body('specialization')
      .optional()
      .trim()
      .notEmpty(),
    body('experience')
      .optional()
      .isInt({ min: 0, max: 70 }),
    body('consultationFee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Consultation fee must be a positive number'),
    body('availability')
      .optional()
      .isArray()
      .withMessage('Availability must be an array'),
    handleValidationErrors
  ],

  availability: [
    body('day')
      .isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .withMessage('Invalid day'),
    body('slots')
      .isArray({ min: 1 })
      .withMessage('At least one time slot is required'),
    body('slots.*')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (HH:MM)'),
    handleValidationErrors
  ]
};

// Appointment Validation
const appointmentValidation = {
  create: [
    body('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    body('appointmentDate')
      .isISO8601()
      .withMessage('Valid appointment date is required'),
    body('timeSlot')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time slot format (HH:MM)'),
    body('consultationType')
      .optional()
      .isIn(['online', 'offline'])
      .withMessage('Consultation type must be online or offline'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
  ],

  reschedule: [
    body('newDate')
      .isISO8601()
      .withMessage('Valid date is required'),
    body('newTimeSlot')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time slot format (HH:MM)'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    handleValidationErrors
  ],

  updateStatus: [
    body('status')
      .isIn(['scheduled', 'completed', 'cancelled', 'no-show'])
      .withMessage('Invalid status'),
    body('cancellationReason')
      .optional()
      .trim()
      .isLength({ max: 200 }),
    handleValidationErrors
  ]
};

// Payment Validation
const paymentValidation = {
  create: [
    body('appointmentId')
      .isMongoId()
      .withMessage('Valid appointment ID is required'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be greater than 0'),
    body('paymentMethod')
      .isIn(['card', 'upi', 'wallet'])
      .withMessage('Invalid payment method'),
    handleValidationErrors
  ],

  refund: [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0'),
    body('reason')
      .trim()
      .notEmpty()
      .isLength({ max: 500 })
      .withMessage('Refund reason is required'),
    handleValidationErrors
  ]
};

// Support Ticket Validation
const supportValidation = {
  create: [
    body('subject')
      .trim()
      .notEmpty()
      .isLength({ max: 200 })
      .withMessage('Subject is required and must be less than 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .isLength({ max: 2000 })
      .withMessage('Description is required and must be less than 2000 characters'),
    body('category')
      .isIn(['PAYMENT', 'APPOINTMENT', 'DOCTOR', 'REFUND', 'BUG', 'OTHER'])
      .withMessage('Invalid category'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Invalid priority'),
    handleValidationErrors
  ],

  update: [
    body('status')
      .optional()
      .isIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Invalid priority'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message must be less than 1000 characters'),
    handleValidationErrors
  ]
};

// Health Reading Validation
const healthValidation = {
  createReading: [
    body('readingType')
      .isIn(['bp', 'glucose', 'weight', 'temperature', 'heartRate'])
      .withMessage('Invalid reading type'),
    body('value')
      .isFloat()
      .withMessage('Value must be a number'),
    body('unit')
      .trim()
      .notEmpty()
      .withMessage('Unit is required'),
    body('timestamp')
      .optional()
      .isISO8601()
      .withMessage('Invalid timestamp'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }),
    handleValidationErrors
  ]
};

// Rating Validation
const ratingValidation = {
  create: [
    body('doctorId')
      .isMongoId()
      .withMessage('Valid doctor ID is required'),
    body('appointmentId')
      .isMongoId()
      .withMessage('Valid appointment ID is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Review must be less than 1000 characters'),
    handleValidationErrors
  ]
};

// Blood Bank Validation
const bloodValidation = {
  createDonor: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required'),
    body('bloodGroup')
      .isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
      .withMessage('Invalid blood group'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('phone')
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage('Invalid phone number'),
    body('location')
      .trim()
      .notEmpty()
      .withMessage('Location is required'),
    handleValidationErrors
  ],

  createRequest: [
    body('bloodGroup')
      .isIn(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'])
      .withMessage('Invalid blood group'),
    body('quantityML')
      .isInt({ min: 100, max: 1000 })
      .withMessage('Quantity must be between 100ml and 1000ml'),
    body('urgency')
      .isIn(['normal', 'urgent', 'critical'])
      .withMessage('Invalid urgency level'),
    body('reason')
      .trim()
      .notEmpty()
      .isLength({ max: 500 })
      .withMessage('Reason is required'),
    handleValidationErrors
  ]
};

// Admin Validation
const adminValidation = {
  create: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role')
      .isIn(['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'])
      .withMessage('Invalid role'),
    handleValidationErrors
  ],

  updateFee: [
    body('platformFeePercentage')
      .isFloat({ min: 0, max: 50 })
      .withMessage('Platform fee must be between 0 and 50%'),
    body('taxPercentage')
      .optional()
      .isFloat({ min: 0, max: 30 })
      .withMessage('Tax percentage must be between 0 and 30%'),
    handleValidationErrors
  ]
};

// Query Parameter Validation
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    handleValidationErrors
  ],

  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date'),
    handleValidationErrors
  ]
};

// MongoDB ID Param Validation
const validateMongoId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  userValidation,
  doctorValidation,
  appointmentValidation,
  paymentValidation,
  supportValidation,
  healthValidation,
  ratingValidation,
  bloodValidation,
  adminValidation,
  queryValidation,
  validateMongoId
};
