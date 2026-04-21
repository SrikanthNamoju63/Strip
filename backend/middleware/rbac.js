const Admin = require('../models/Admin');

/**
 * Middleware to check if admin has specific role or permission
 * Usage: router.get('/path', adminAuth, checkPermission(['SUPER_ADMIN']), controller)
 * Usage: router.get('/path', adminAuth, checkPermission([], ['VIEW_FINANCE']), controller)
 */
const checkPermission = (allowedRoles = [], allowedPermissions = []) => {
    return async (req, res, next) => {
        try {
            if (!req.admin) {
                return res.status(401).json({ msg: 'Unauthorized: No admin found' });
            }

            const admin = req.admin;

            // Super Admin has all access
            if (admin.role === 'SUPER_ADMIN') {
                return next();
            }

            // Check Role
            if (allowedRoles.length > 0 && allowedRoles.includes(admin.role)) {
                return next();
            }

            // Check Permissions
            // Assuming admin.permissions is an array of strings e.g. ['VIEW_FINANCE', 'APPROVE_REFUNDS']
            if (allowedPermissions.length > 0 && admin.permissions) {
                const hasPermission = allowedPermissions.some(perm => admin.permissions.includes(perm));
                if (hasPermission) return next();
            }

            return res.status(403).json({ msg: 'Forbidden: Insufficient permissions' });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    };
};

module.exports = checkPermission;
