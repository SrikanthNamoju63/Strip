const Coupon = require('../../models/Coupon');
const Appointment = require('../../models/Appointment');

exports.getWelcomeCoupon = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check if user already booked an appointment
        const existingAppointment = await Appointment.findOne({ userId, status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] } });
        
        if (existingAppointment) {
            return res.json({ coupon: null, msg: 'User already has an appointment' });
        }

        const welcomeCoupon = await Coupon.findOne({ 
            isWelcomeCoupon: true, 
            isActive: true,
            expiryDate: { $gte: new Date() }
        }).sort({ createdAt: -1 });

        if (!welcomeCoupon) {
            return res.json({ coupon: null, msg: 'No welcome coupon available' });
        }

        // Check if this user already used this coupon
        if (welcomeCoupon.usedBy && welcomeCoupon.usedBy.some(id => id.toString() === userId.toString())) {
            return res.json({ coupon: null, msg: 'User already used this coupon' });
        }

        // Check global usage limit
        if (welcomeCoupon.usageLimit && welcomeCoupon.usedCount >= welcomeCoupon.usageLimit) {
            return res.json({ coupon: null, msg: 'Coupon usage limit reached' });
        }

        res.json({ coupon: welcomeCoupon });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
        
        if (!coupon) {
            return res.status(400).json({ msg: 'Invalid or expired coupon' });
        }

        // Check expiry
        if (new Date(coupon.expiryDate) < new Date()) {
            return res.status(400).json({ msg: 'Coupon has expired' });
        }

        // Check global usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ msg: 'Coupon usage limit reached' });
        }

        // Check if this user already used this coupon
        if (coupon.usedBy && coupon.usedBy.some(id => id.toString() === userId.toString())) {
            return res.status(400).json({ msg: 'You have already used this coupon' });
        }

        // Check user specific (e.g. welcome coupon)
        if (coupon.isWelcomeCoupon) {
            const existingApp = await Appointment.findOne({ userId, status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] } });
            if (existingApp) {
                return res.status(400).json({ msg: 'Welcome coupon is only for the first booking' });
            }
        }

        res.json({ coupon, msg: 'Coupon applied successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
