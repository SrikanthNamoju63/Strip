const FeeConfig = require('../../models/FeeConfig');

// @desc    Get current fee configuration
// @route   GET api/fees/config
// @access  Public (or Protected)
exports.getFeeConfig = async (req, res) => {
    try {
        let config = await FeeConfig.findOne().sort({ createdAt: -1 });

        // If no config exists, return defaults
        if (!config) {
            config = {
                platformFee: 0,
                commissionType: 'PERCENT',
                commissionValue: 0
            };
        }

        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update fee configuration
// @route   POST api/fees/config
// @access  Private (Admin only)
exports.updateFeeConfig = async (req, res) => {
    const { platformFee, commissionType, commissionValue } = req.body;

    try {
        let config = await FeeConfig.findOne().sort({ createdAt: -1 });

        if (config) {
            // Update existing
            config.platformFee = platformFee;
            config.commissionType = commissionType;
            config.commissionValue = commissionValue;
            config.updatedBy = req.user.id;
            await config.save();
        } else {
            // Create new
            config = new FeeConfig({
                platformFee,
                commissionType,
                commissionValue,
                updatedBy: req.user.id
            });
            await config.save();
        }

        res.json(config);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
