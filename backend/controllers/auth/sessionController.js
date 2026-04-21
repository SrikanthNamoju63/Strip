const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const Admin = require('../../models/Admin');
const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and return user profile
 * Used for session validation on app startup
 */
exports.verifySession = async (req, res) => {
    try {
        // req.user is set by authMiddleware
        const { id, role, isDoctorModel } = req.user;

        let user;
        if (role === 'DOCTOR') {
            user = await Doctor.findById(id).select('-passwordHash');
            if (!user) {
                return res.status(401).json({ msg: 'Doctor profile not found' });
            }
        } else if (role.includes('ADMIN')) {
            user = await Admin.findById(id).select('-passwordHash');
            if (!user) {
                return res.status(401).json({ msg: 'Admin profile not found' });
            }
        } else {
            user = await User.findById(id).select('-passwordHash');
            if (!user) {
                return res.status(401).json({ msg: 'User profile not found' });
            }
        }

        // Token is valid, return user data
        return res.json({
            isValid: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone || user.personalPhone,
                role: role,
                avatar: user.avatar || user.doctorPhoto,
                verified: user.verified || user.isVerified || false,
                ...(role === 'DOCTOR' && {
                    specialization: user.specialization,
                    consultationFee: user.consultationFee,
                    ratings: user.ratings,
                    earnings: user.earnings
                }),
                ...((role.includes('ADMIN')) && {
                    isSuperAdmin: role === 'SUPER_ADMIN',
                    permissions: user.permissions || []
                })
            }
        });
    } catch (err) {
        console.error('Session verification error:', err.message);
        return res.status(401).json({ msg: 'Invalid or expired token' });
    }
};

/**
 * Check if token is still valid without fetching full profile
 * Lightweight endpoint for periodic session checks
 */
exports.checkTokenValidity = async (req, res) => {
    try {
        // If we reach here, authMiddleware validated the token
        const { id, role } = req.user;

        return res.json({
            isValid: true,
            role: role,
            expiresIn: req.tokenExpiry || 'unknown'
        });
    } catch (err) {
        return res.status(401).json({ isValid: false, msg: 'Token invalid' });
    }
};

/**
 * Refresh JWT token
 * Used when token is about to expire
 */
exports.refreshToken = async (req, res) => {
    try {
        const { id, role, isDoctorModel } = req.user;

        // Generate new token with extended expiry
        const payload = {
            user: {
                id: id,
                role: role,
                isDoctorModel: isDoctorModel || false
            }
        };

        const newToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '10d' } // 10 days
        );

        return res.json({
            token: newToken,
            expiresIn: 864000 // 10 days in seconds
        });
    } catch (err) {
        console.error('Token refresh error:', err.message);
        return res.status(401).json({ msg: 'Could not refresh token' });
    }
};

/**
 * Logout - no backend action needed as JWT is stateless
 * Client should remove token from localStorage
 */
exports.logout = async (req, res) => {
    try {
        // Optional: Log logout event for audit trail
        console.log(`User ${req.user.id} logged out`);

        return res.json({ msg: 'Logged out successfully' });
    } catch (err) {
        return res.status(500).json({ msg: 'Logout error', error: err.message });
    }
};
