const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    registerDoctor,
    getAllDoctors,
    getDoctorById,
    addSlots,
    getCurrentDoctor,
    updateCurrentDoctor,
    searchDoctors,
    getAvailableSlots,
    changePassword,
    requestProfileDetails,
    getDoctorHealthAnalysis,
    updateHealthAnalysis,
    getPatientRecords,
    getDoctorNotifications,
    markNotificationAsRead
} = require('../controllers/user/doctorController');

// ======================================
// Static Routes (must be before /:id)
// ======================================

router.post('/search', searchDoctors);
router.get('/', getAllDoctors);
router.post('/', registerDoctor);

router.get('/me', auth, getCurrentDoctor);
router.put('/me', auth, updateCurrentDoctor);
router.post('/change-password', auth, changePassword);

// Image Uploads
router.post('/upload-gallery-image', auth, require('../config/multer').single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    res.json({ url: `uploads/${req.file.filename}` });
});

// Finance
router.get('/settlements', auth, require('../controllers/finance').getDoctorSettlements);

// Doctor-specific features
router.get('/health-analysis/list', auth, getDoctorHealthAnalysis);
router.get('/notifications/list', auth, getDoctorNotifications);
router.get('/patients/:userId/records', auth, getPatientRecords);

// ======================================
// Dynamic Routes (containing /:id)
// ======================================

router.put('/health-analysis/:id', auth, updateHealthAnalysis);
router.put('/notifications/:id/read', auth, markNotificationAsRead);

router.get('/:id', getDoctorById);
router.get('/:id/slots', getAvailableSlots);
router.post('/:id/slots', auth, addSlots);
router.post('/:id/request-details', auth, requestProfileDetails);

module.exports = router;
