const FeeConfig = require('../../models/FeeConfig');

// @desc    Get Current Fee Configuration
// @route   GET /api/admin/fees
// @access  Private (Admin Only)
exports.getFeeConfig = async (req, res) => {
    try {
        let config = await FeeConfig.findOne();
        if (!config) {
            // Return default if not found
            return res.json({
                success: true,
                data: {
                    platformFee: 0,
                    commissionType: 'PERCENT',
                    commissionValue: 10
                }
            });
        }
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Error fetching fee config:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update Fee Configuration
// @route   PUT /api/admin/fees
// @access  Private (Admin Only)
exports.updateFeeConfig = async (req, res) => {
    try {
        const { platformFee, commissionType, commissionValue } = req.body;

        let config = await FeeConfig.findOne();
        if (config) {
            config.platformFee = platformFee;
            config.commissionType = commissionType;
            config.commissionValue = commissionValue;
            config.updatedBy = req.user.id;
            await config.save();
        } else {
            config = await FeeConfig.create({
                platformFee,
                commissionType,
                commissionValue,
                updatedBy: req.user.id
            });
        }

        res.json({
            success: true,
            message: 'Fee configuration updated',
            data: config
        });
    } catch (error) {
        console.error('Error updating fee config:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
