const express = require('express');
const router = express.Router();
const BloodDonor = require('../models/BloodDonor');

// Register or update donor
router.post('/register-donor', async (req, res) => {
    const {
        user_id,
        blood_group,
        location,
        phone,
        smoker,
        alcohol_consumer,
        last_donation_date,
        dob,
        age
    } = req.body;

    if (!user_id || !blood_group) return res.status(400).json({ success: false, error: "user_id/blood_group required" });

    try {
        let isEligible = true;
        let reason = '';
        let nextEligibleDate = new Date(); // Default to today if never donated

        // Lifestyle Check
        if (smoker === 'Yes' || alcohol_consumer === 'Yes') {
            isEligible = false;
            reason = 'Ineligible due to lifestyle factors';
            // Even if ineligible, we store the data
        }

        // Date Check (6 Months / 180 Days)
        if (last_donation_date) {
            const lastDate = new Date(last_donation_date);
            const today = new Date();
            const daysDiff = (today - lastDate) / (1000 * 60 * 60 * 24);

            // Calculate next date = lastDate + 180 days
            nextEligibleDate = new Date(lastDate);
            nextEligibleDate.setDate(nextEligibleDate.getDate() + 180);

            if (daysDiff < 180) {
                isEligible = false;
                reason = `Recent donation. Next eligible: ${nextEligibleDate.toDateString()}`;
            }
        }

        let city = '', state = '';
        if (location) {
            const parts = location.split(',');
            city = parts[0]?.trim();
            state = parts[1]?.trim();
        }

        await BloodDonor.findOneAndUpdate(
            { user_id: user_id },
            {
                blood_group, city, state, phone,
                is_eligible: isEligible,
                last_donation_date: last_donation_date,
                next_eligible_date: nextEligibleDate,
                dob: dob,
                age: age,
                smoker: smoker,
                alcohol_consumer: alcohol_consumer,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: isEligible ? "Donor registered" : "Donor registered (Ineligible: " + reason + ")",
            is_eligible: isEligible,
            reason
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search donors
router.get('/donors', async (req, res) => {
    const { blood_group, location } = req.query;

    try {
        const query = { is_available: true, is_eligible: true };
        if (blood_group) query.blood_group = blood_group;
        if (location) query.city = { $regex: location, $options: 'i' };

        const donors = await BloodDonor.find(query).limit(100).populate('user_details', 'full_name phone');

        // Map to flat structure if needed, or return as is (Android might expect specific fields)
        // Android expects: name, user_phone, blood_group, city, state, phone
        const results = donors.map(d => ({
            name: d.user_details ? d.user_details.full_name : 'Unknown',
            user_phone: d.user_details ? d.user_details.phone : '',
            blood_group: d.blood_group,
            city: d.city,
            state: d.state,
            phone: d.phone
        }));

        res.json({ success: true, donors: results, count: results.length });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/update-availability', async (req, res) => {
    const { user_id, is_available } = req.body;
    try {
        await BloodDonor.findOneAndUpdate({ user_id }, { is_available });
        res.json({ success: true, message: "Updated" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

router.post('/delete-donor', async (req, res) => {
    const { user_id } = req.body;
    try {
        await BloodDonor.deleteOne({ user_id });
        res.json({ success: true, message: "Deleted" });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

const BloodDonationHistory = require('../models/BloodDonationHistory');

// Add Donation History
router.post('/history', async (req, res) => {
    const { user_id, blood_group, donated_date, place } = req.body;

    if (!user_id || !blood_group || !donated_date) {
        return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    try {
        // Validation: Check if last donation was within 6 months
        const lastDonation = await BloodDonationHistory.findOne({ user_id })
            .sort({ donated_date: -1 });

        if (lastDonation) {
            const lastDate = new Date(lastDonation.donated_date);
            const newDate = new Date(donated_date);
            const diffTime = Math.abs(newDate - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 180) {
                return res.status(400).json({
                    success: false,
                    error: `You are not eligible. Last donation was ${diffDays} days ago. Wait for 6 months gap.`
                });
            }
        }

        const newHistory = new BloodDonationHistory({
            user_id,
            blood_group,
            donated_date,
            place
        });

        await newHistory.save();

        // Optionally update the main BloodDonor record's last_donation_date if this is newer
        await BloodDonor.findOneAndUpdate(
            { user_id },
            { last_donation_date: donated_date },
            { new: true }
        );

        res.json({ success: true, message: "Donation history saved successfully" });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get Donation History
router.get('/history/:userId', async (req, res) => {
    try {
        const history = await BloodDonationHistory.find({ user_id: req.params.userId })
            .sort({ donated_date: -1 });

        res.json({ success: true, history: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
