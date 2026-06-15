const express = require('express');
const router = express.Router();
const { registerUser, loginUser, registerDoctor, loginDoctor, forgotPassword, getPincodeDetails } = require('../controllers/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerUser);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginUser);

// @route   POST api/auth/register-doctor
// @desc    Register doctor (Separate collection)
// @access  Public
router.post('/register-doctor', registerDoctor);

// @route   POST api/auth/login-doctor
// @desc    Doctor login
// @access  Public
router.post('/login-doctor', loginDoctor);

// @route   POST api/auth/forgot-password
// @desc    Forgot Password
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   GET api/auth/pincode/:pincode
// @desc    Get city, district, state details from pincode
// @access  Public
router.get('/pincode/:pincode', getPincodeDetails);

module.exports = router;
