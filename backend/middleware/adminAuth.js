const Admin = require('../models/Admin');
const { getBearerToken, verifyAccessToken } = require('./authMiddleware');

const ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'VERIFICATION_ADMIN',
  'FINANCE_ADMIN',
  'SUPPORT_ADMIN'
]);

module.exports = async function adminAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ msg: 'Authentication is required' });

  try {
    const { user } = verifyAccessToken(token);
    if (!ADMIN_ROLES.has(user.role)) {
      return res.status(403).json({ msg: 'A valid administrator role is required' });
    }

    // Role changes and account deactivation take effect immediately instead of
    // waiting for a previously issued token to expire.
    const admin = await Admin.findById(user.id).select('role permissions isActive');
    if (!admin || !admin.isActive || !ADMIN_ROLES.has(admin.role)) {
      return res.status(403).json({ msg: 'Administrator account is inactive' });
    }

    req.admin = {
      id: admin.id,
      role: admin.role,
      permissions: admin.permissions || []
    };
    req.user = req.admin;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ msg: 'Invalid authentication token' });
    }
    console.error('Admin authentication error:', err.message);
    return res.status(500).json({ msg: 'Authentication is unavailable' });
  }
};
