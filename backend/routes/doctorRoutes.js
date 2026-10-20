const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/authMiddleware');
const { apiLimiter, signupLimiter, uploadLimiter } = require('../middleware/rateLimiting');
const { validationErrorHandler, validators } = require('../middleware/inputValidation');
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
    markNotificationAsRead,
    getDoctorStaff,
    addDoctorStaff,
    deleteDoctorStaff,
    updateDoctorStaff
} = require('../controllers/user/doctorController');

const { authorize } = auth;

// ======================================
// Static Routes (must be before /:id)
// ======================================

router.post('/search', apiLimiter, searchDoctors);
router.get('/', apiLimiter, getAllDoctors);
router.post('/', signupLimiter, [
    body('email').trim().isEmail().normalizeEmail(),
    validators.password,
    body().custom((_, { req }) => {
        const phone = String(req.body.personalPhone || req.body.phone || '').replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(phone)) throw new Error('Enter a valid personal mobile number');
        return true;
    }),
    body('registrationNumber').trim().isLength({ min: 4, max: 40 }),
    body('medicalCouncil').trim().isLength({ min: 2, max: 100 }),
    body('consultationFee').isFloat({ min: 0, max: 100000 }),
    validationErrorHandler
], registerDoctor);

router.get('/me', auth, authorize('DOCTOR', 'RECEPTIONIST', 'NURSE'), getCurrentDoctor);
router.put('/me', auth, authorize('DOCTOR'), updateCurrentDoctor);
router.post('/change-password', auth, authorize('DOCTOR'), changePassword);

// Image Uploads
router.post('/upload-gallery-image', auth, authorize('DOCTOR'), uploadLimiter, require('../config/multer').single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    res.json({ url: `uploads/${req.file.filename}` });
});

// Finance
router.get('/settlements', auth, authorize('DOCTOR'), require('../controllers/finance').getDoctorSettlements);

// Staff Management
router.get('/me/staff', auth, authorize('DOCTOR'), getDoctorStaff);
router.post('/me/staff', auth, authorize('DOCTOR'), addDoctorStaff);
router.put('/me/staff/:staffId', auth, authorize('DOCTOR'), updateDoctorStaff);
router.delete('/me/staff/:staffId', auth, authorize('DOCTOR'), deleteDoctorStaff);

// Doctor-specific features
router.get('/health-analysis/list', auth, authorize('DOCTOR'), getDoctorHealthAnalysis);
router.get('/notifications/list', auth, authorize('DOCTOR'), getDoctorNotifications);
router.get('/patients/:userId/records', auth, authorize('DOCTOR'), getPatientRecords);

// ======================================
// Dynamic Routes (containing /:id)
// ======================================

router.put('/health-analysis/:id', auth, authorize('DOCTOR'), updateHealthAnalysis);
router.put('/notifications/:id/read', auth, authorize('DOCTOR'), markNotificationAsRead);

router.get('/:id', apiLimiter, getDoctorById);
router.get('/:id/slots', apiLimiter, getAvailableSlots);
router.post('/:id/slots', auth, authorize('DOCTOR'), addSlots);
router.post('/:id/request-details', auth, authorize('SUPER_ADMIN', 'VERIFICATION_ADMIN'), requestProfileDetails);

module.exports = router;
