/**
 * Middleware to check user role
 * Usage: router.get('/route', auth, checkRole(['ADMIN', 'DOCTOR']), handler)
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // Get user from auth middleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if user role is in allowed roles
    if (allowedRoles.includes(user.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
  };
};

module.exports = checkRole;
