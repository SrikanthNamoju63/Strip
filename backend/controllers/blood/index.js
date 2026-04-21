const BloodDonor = require('../../models/BloodDonor');
const BloodRequest = require('../../models/BloodRequest');

// @desc    Register as a donor
// @route   POST api/blood/donor
// @access  Private
exports.registerDonor = async (req, res) => {
    const { bloodGroup, age, weight, lastDonationDate, alcoholic, smoking } = req.body;

    try {
        // Simple eligibility check
        let isEligible = true;
        let eligibilityReason = '';

        if (age < 18) {
            isEligible = false;
            eligibilityReason = 'Underage';
        } else if (weight < 50) {
            isEligible = false;
            eligibilityReason = 'Underweight';
        }
        // Add more checks as needed

        const newDonor = new BloodDonor({
            userId: req.user.id,
            bloodGroup,
            age,
            weight,
            lastDonationDate,
            alcoholic,
            smoking,
            isEligible,
            eligibilityReason
        });

        await newDonor.save();
        res.json(newDonor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all available donors
// @route   GET api/blood/donors
// @access  Public
exports.getAllDonors = async (req, res) => {
    try {
        const { bloodGroup, radius, city } = req.query;
        // Basic query: Eligible, Available, and NOT the current user
        let query = {
            isEligible: true,
            available: true,
            userId: { $ne: req.user.id }
        };

        if (bloodGroup) {
            query.bloodGroup = bloodGroup;
        }

        // Future: If radius is provided, we need lat/long in request and database.
        // For now, if city is provided, filter by user's city via population or if schema had it.
        // We will just return all for simulation of "Radius" if actual geo-query isn't ready.

        const donors = await BloodDonor.find(query).populate('userId', ['name', 'phone', 'address']);

        // Mock filtering by "Radius" if we had user coordinates.
        // For now, return filtered by blood group.

        res.json(donors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Create a blood request
// @route   POST api/blood/requests
// @access  Private
exports.createBloodRequest = async (req, res) => {
    const { patientName, bloodGroup, unitsRequired, hospitalName, location, urgencyLevel } = req.body;

    try {
        const newRequest = new BloodRequest({
            requesterUserId: req.user.id,
            patientName,
            bloodGroup,
            unitsRequired,
            hospitalName,
            location,
            urgencyLevel
        });

        await newRequest.save();

        // Future: Trigger notifications here

        res.json(newRequest);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all blood requests
// @route   GET api/blood/requests
// @access  Public
exports.getBloodRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'all') {
            query.status = status;
        } else if (!req.admin) {
            // Public/User users only see OPEN requests by default if not specified? 
            // Actually, usually filtering is good. 
            // If NO status provided and NOT admin, maybe default to OPEN.
            if (!status) query.status = 'OPEN';
        }

        const requests = await BloodRequest.find(query)
            .populate('requesterUserId', 'name phone')
            .populate('matchedDonorId', 'name bloodGroup phone')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get user's donation history
// @route   GET api/blood/history
// @access  Private
exports.getDonationHistory = async (req, res) => {
    const BloodDonation = require('../../models/BloodDonation');
    try {
        let history = await BloodDonation.find({ userId: req.user.id }).sort({ donationDate: -1 });

        // If no explicit history, check if they are a registered donor with a last donation date
        if (history.length === 0) {
            const donor = await BloodDonor.findOne({ userId: req.user.id });
            if (donor && donor.lastDonationDate) {
                // Synthesize a history record from the donor profile for backward compatibility
                history.push({
                    _id: 'legacy',
                    donationDate: donor.lastDonationDate,
                    location: 'Recorded in Profile',
                    units: 1,
                    bloodGroup: donor.bloodGroup,
                    status: 'COMPLETED'
                });
            }
        }
        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Match a donor to a request (Admin Only)
exports.matchDonor = async (req, res) => {
    const { id } = req.params;
    const { donorId } = req.body;

    try {
        const request = await BloodRequest.findById(id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        request.matchedDonorId = donorId;
        request.status = 'IN_PROGRESS';
        request.adminNotes = 'Matched by Admin';

        await request.save();

        // Log
        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'BLOOD',
            action: 'MATCH_DONOR',
            performedBy: req.admin ? req.admin.id : null,
            targetId: request._id,
            targetModel: 'BloodRequest',
            metadata: `Matched Donor: ${donorId}`
        });

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
