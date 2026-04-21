const Coupon = require('../../models/Coupon');

exports.createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, maxDiscount, expiryDate, usageLimit, isWelcomeCoupon } = req.body;
        
        let existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({ msg: 'Coupon code already exists' });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            maxDiscount,
            expiryDate,
            usageLimit,
            isWelcomeCoupon
        });

        await coupon.save();
        res.json(coupon);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.code) {
            updates.code = updates.code.toUpperCase();
        }

        const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true });
        if (!coupon) {
            return res.status(404).json({ msg: 'Coupon not found' });
        }

        res.json(coupon);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            return res.status(404).json({ msg: 'Coupon not found' });
        }

        res.json({ msg: 'Coupon removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
