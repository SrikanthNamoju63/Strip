const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    registerDonor,
    getAllDonors,
    createBloodRequest,
    getBloodRequests,
    getDonationHistory
} = require('../controllers/blood');

router.post('/donor', auth, registerDonor);
router.get('/donors', auth, getAllDonors);
router.post('/requests', auth, createBloodRequest);
router.get('/requests', getBloodRequests);
router.get('/history', auth, getDonationHistory);

module.exports = router;
