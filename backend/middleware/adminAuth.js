const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { user } = decoded;

        if (!user || !['SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(user.role)) {
            return res.status(403).json({ msg: 'Access denied: Valid Admin role required' });
        }

        req.admin = user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
