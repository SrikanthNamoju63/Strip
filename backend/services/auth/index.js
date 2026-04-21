/**
 * Auth Service
 * Handles authentication-related business logic
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Admin = require('../../models/Admin');
const RefreshToken = require('../../models/RefreshToken');

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

/**
 * Generate access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};

/**
 * Hash password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password
 */
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Find user by email (checks User, Doctor, Admin collections)
 */
const findUserByEmail = async (email) => {
  // Check Users
  let user = await User.findOne({ email }).select('+password');
  if (user) return { ...user.toObject(), role: 'USER', model: 'User' };

  // Check Doctors
  user = await Doctor.findOne({ email }).select('+password');
  if (user) return { ...user.toObject(), role: 'DOCTOR', model: 'Doctor' };

  // Check Admins
  user = await Admin.findOne({ email }).select('+password');
  if (user) return { ...user.toObject(), role: user.role, model: 'Admin' };

  return null;
};

/**
 * Find user by ID
 */
const findUserById = async (id, model = 'User') => {
  switch (model) {
    case 'User':
      return await User.findById(id);
    case 'Doctor':
      return await Doctor.findById(id);
    case 'Admin':
      return await Admin.findById(id);
    default:
      return null;
  }
};

/**
 * Store refresh token
 */
const storeRefreshToken = async (userId, token, expiresAt) => {
  const refreshToken = new RefreshToken({
    userId,
    token,
    expiresAt,
    createdAt: new Date()
  });
  await refreshToken.save();
  return refreshToken;
};

/**
 * Revoke refresh token
 */
const revokeRefreshToken = async (token) => {
  return await RefreshToken.findOneAndUpdate(
    { token },
    { revokedAt: new Date() },
    { new: true }
  );
};

/**
 * Revoke all user tokens
 */
const revokeAllUserTokens = async (userId) => {
  return await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
};

/**
 * Validate refresh token
 */
const validateRefreshToken = async (token) => {
  const stored = await RefreshToken.findOne({ token, revokedAt: null });
  if (!stored) return null;

  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    return { valid: true, decoded, stored };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * Login user
 */
const loginUser = async (email, password, ipAddress, deviceInfo) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Generate tokens
  const accessTokenPayload = {
    id: user._id,
    email: user.email,
    role: user.role
  };

  const refreshTokenPayload = {
    userId: user._id,
    email: user.email
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = generateRefreshToken(refreshTokenPayload);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await storeRefreshToken(user._id, refreshToken, expiresAt);

  return {
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        fullName: user.profile?.fullName || user.fullName
      }
    }
  };
};

/**
 * Register user
 */
const registerUser = async (userData) => {
  const { email, password, fullName, phone, role = 'USER' } = userData;

  // Check if email exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  let newUser;
  if (role === 'USER') {
    newUser = new User({
      email,
      password: hashedPassword,
      phone,
      profile: { fullName }
    });
  } else if (role === 'DOCTOR') {
    newUser = new Doctor({
      email,
      password: hashedPassword,
      phone,
      fullName
    });
  }

  await newUser.save();

  return {
    success: true,
    data: {
      id: newUser._id,
      email: newUser.email,
      role,
      message: 'Registration successful'
    }
  };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    return { success: false, error: 'Current password is incorrect' };
  }

  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save();

  // Revoke all tokens for security
  await revokeAllUserTokens(userId);

  return { success: true, message: 'Password changed successfully' };
};

/**
 * Reset password request
 */
const requestPasswordReset = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return { success: false, error: 'Email not found' };
  }

  // Generate reset token (would typically send via email)
  const resetToken = jwt.sign(
    { userId: user._id, purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return {
    success: true,
    data: {
      resetToken,
      message: 'Password reset instructions sent'
    }
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  comparePassword,
  findUserByEmail,
  findUserById,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  validateRefreshToken,
  loginUser,
  registerUser,
  changePassword,
  requestPasswordReset
};
