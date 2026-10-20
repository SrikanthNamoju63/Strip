const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { registerUser, loginUser, registerDoctor, loginDoctor, forgotPassword, getPincodeDetails } = require('../controllers/auth');
const { validationErrorHandler, validators } = require('../middleware/inputValidation');
const { authLimiter, signupLimiter, passwordResetLimiter } = require('../middleware/rateLimiting');

const userRegistrationValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  validators.email,
  validators.password,
  body('phone').trim().matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Enter a valid Indian mobile number'),
  validationErrorHandler
];

const doctorRegistrationValidation = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('Invalid first name'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Invalid last name'),
  validators.email,
  validators.password,
  body('personalPhone').trim().matches(/^(?:\+91)?[6-9]\d{9}$/).withMessage('Enter a valid personal mobile number'),
  body('registrationNumber').trim().isLength({ min: 4, max: 40 }).withMessage('Invalid registration number'),
  body('medicalCouncil').trim().isLength({ min: 2, max: 100 }).withMessage('Invalid medical council'),
  body('consultationFee').isFloat({ min: 0, max: 100000 }).withMessage('Invalid consultation fee'),
  validationErrorHandler
];

const loginValidation = [
  body('email').optional().trim().isLength({ min: 3, max: 254 }),
  body('username').optional().trim().isLength({ min: 3, max: 80 }),
  body('password').isString().isLength({ min: 1, max: 256 }).withMessage('Password is required'),
  validationErrorHandler
];

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', signupLimiter, userRegistrationValidation, registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authLimiter, loginValidation, loginUser);

// @route   POST api/auth/register-doctor
// @desc    Register doctor (Separate collection)
// @access  Public
router.post('/register-doctor', signupLimiter, doctorRegistrationValidation, registerDoctor);

// @route   POST api/auth/login-doctor
// @desc    Doctor login
// @access  Public
router.post('/login-doctor', authLimiter, loginValidation, loginDoctor);

// @route   POST api/auth/forgot-password
// @desc    Forgot Password
// @access  Public
router.post('/forgot-password', passwordResetLimiter, [
  validators.email,
  validationErrorHandler
], forgotPassword);

// @route   GET api/auth/pincode/:pincode
// @desc    Get city, district, state details from pincode
// @access  Public
router.get('/pincode/:pincode', [
  param('pincode').matches(/^\d{6}$/).withMessage('Pincode must be exactly 6 digits'),
  validationErrorHandler
], getPincodeDetails);

module.exports = router;
