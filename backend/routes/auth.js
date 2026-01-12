const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserSession = require('../models/UserSession');
const UserDevice = require('../models/UserDevice');
const { JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

// Helper to generate 6 digit random number
const generateDisplayId = async () => {
  let displayId;
  let exists = true;
  while (exists) {
    displayId = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await User.findOne({ display_id: displayId });
    if (!user) exists = false;
  }
  return displayId;
};

// Helper to generate numeric user_id (since we moved away from SQL auto-inc, we need a strategy)
// For simplicity, we'll use a random number or find max + 1. 
// REAL WORLD: Use a counter collection.
// QUICK FIX: Random large int.
const generateUserId = async () => {
  let userId;
  let exists = true;
  while (exists) {
    userId = Math.floor(Math.random() * 1000000);
    const user = await User.findOne({ user_id: userId });
    if (!user) exists = false;
  }
  return userId;
};

// -------------------- SIGNUP --------------------
router.post('/signup', async (req, res) => {
  const { name, email, password, dob, gender } = req.body;

  try {
    const finalGender = gender || 'Other';

    if (!name || !email || !password || !dob) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ // 409 Conflict
        success: false,
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await generateUserId();
    const displayId = await generateDisplayId();

    const newUser = await User.create({
      user_id: userId,
      display_id: displayId,
      full_name: name,
      email,
      password_hash: hashedPassword,
      date_of_birth: dob,
      gender: finalGender
    });

    // Create empty profile
    await UserProfile.create({ user_id: userId });

    const token = jwt.sign(
      { userId: userId, email: email },
      JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: userId,
      displayId: displayId,
      token: token,
      user: {
        id: userId,
        displayId: displayId,
        name: name,
        email: email
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error: ' + error.message
    });
  }
});

// -------------------- LOGIN --------------------
router.post('/login', async (req, res) => {
  const { email, password, device_type, device_id } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Specific error for user not found
      return res.status(404).json({ success: false, error: 'Account does not exist' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Specific error for wrong password
      return res.status(401).json({ success: false, error: 'Incorrect password' });
    }

    // Update login time
    user.last_login = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    // Record Session
    if (device_type) { // Only if device info provided
      await UserSession.create({
        user_id: user.user_id,
        session_token: token,
        device_id: device_id || 'unknown',
        device_type: device_type || 'Web',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      // Add root-level fields for Android compatibility
      userId: user.user_id,
      name: user.full_name,
      email: user.email,
      user: {
        user_id: user.user_id,
        display_id: user.display_id,
        name: user.full_name, // Mapped to 'name' for frontend compatibility
        email: user.email,
        role: 'Patient'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error: ' + error.message });
  }
});

// -------------------- VERIFY --------------------
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ valid: false, error: 'No token' });

  jwt.verify(token, JWT_SECRET || 'secret_key', (err, decoded) => {
    if (err) return res.status(401).json({ valid: false, error: 'Invalid token' });

    res.json({
      valid: true,
      user: {
        userId: decoded.userId,
        email: decoded.email
      }
    });
  });
});

// -------------------- FORGOT PASSWORD --------------------
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Security: Don't reveal if user exists, but for this app flow:
      return res.status(404).json({ success: false, message: 'Email not registered' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    user.reset_otp = otp;
    user.reset_otp_expiry = expiry;
    await user.save();

    console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    // REAL WORLD: Send email using nodemailer here

    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------- VERIFY OTP --------------------
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.reset_otp_expiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -------------------- RESET PASSWORD --------------------
router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });

    // Validate simple constraints again
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password too short' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    user.reset_otp = undefined;
    user.reset_otp_expiry = undefined; // Clear OTP
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
