const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { authorize } = auth;
const { uploadLimiter } = require('../middleware/rateLimiting');
const { 
    getUserProfile, 
    updateUserProfile,
    getMyAppointments,
    getAppointmentDetails,
    getMyPrescriptions,
    getMedicineReminders,
    addMedicineReminder,
    updateMedicineReminder,
    deleteMedicineReminder,
    getHealthAnalyses,
    getMyRefunds,
    getPaymentHistory,
    getEmergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    uploadMedicalReport,
    getMedicalReports,
    getHealthTrends,
    getUserHealthSummary,
    getAppointmentReminders,
    markReminderSeen
} = require('../controllers/user/userController');

// Patient health records must not be reachable by another authenticated role.
router.use(auth, authorize('USER'));

// Profile Management
router.get('/me', auth, getUserProfile);
router.put('/me', auth, updateUserProfile);
router.post('/me/avatar', auth, uploadLimiter, require('../config/multer').single('image'), require('../controllers/user/userController').uploadProfileImage);

// Appointments
router.get('/appointments', auth, getMyAppointments);
router.get('/appointments/:appointmentId', auth, getAppointmentDetails);

// Prescriptions
router.get('/prescriptions', auth, getMyPrescriptions);

// Medicine Reminders
router.get('/medicine-reminders', auth, getMedicineReminders);
router.post('/medicine-reminders', auth, addMedicineReminder);
router.put('/medicine-reminders/:reminderId', auth, updateMedicineReminder);
router.delete('/medicine-reminders/:reminderId', auth, deleteMedicineReminder);

// Health Analysis
router.get('/health-analysis', auth, getHealthAnalyses);

// Financial History
router.get('/refunds', auth, getMyRefunds);
router.get('/payments', auth, getPaymentHistory);

// Emergency Contacts
router.get('/emergency-contacts', auth, getEmergencyContacts);
router.post('/emergency-contacts', auth, addEmergencyContact);
router.put('/emergency-contacts/:contactId', auth, updateEmergencyContact);
router.delete('/emergency-contacts/:contactId', auth, deleteEmergencyContact);

// Medical Reports
router.post('/medical-reports', auth, uploadLimiter, require('../config/multer').single('report'), uploadMedicalReport);
router.get('/medical-reports', auth, getMedicalReports);

// Health Data & Analytics
router.get('/health-trends', auth, getHealthTrends);
router.get('/health-summary', auth, getUserHealthSummary);

// Reminders
router.get('/appointment-reminders', auth, getAppointmentReminders);
router.put('/appointment-reminders/:reminderId/seen', auth, markReminderSeen);

module.exports = router;
