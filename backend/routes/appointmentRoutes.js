const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { authorize } = auth;
const {
    bookAppointment,
    getUserAppointments,
    getDoctorAppointments,
    getAppointmentById,
    scanAppointment,
    cancelAppointment,
    rescheduleAppointment,
    addConsultationNotes,
    addPrescriptions,
    completeAppointment,
    getDoctorStats
} = require('../controllers/appointments');

// All appointment routes should be protected
router.post('/', auth, authorize('USER'), bookAppointment);
router.get('/my', auth, authorize('USER'), getUserAppointments);
router.get('/:id', auth, authorize('USER', 'DOCTOR', 'SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'), getAppointmentById);
router.post('/:id/cancel', auth, authorize('USER', 'DOCTOR', 'SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'), cancelAppointment);
router.post('/:id/reschedule', auth, authorize('USER'), rescheduleAppointment);
router.post('/scan', auth, require('../middleware/checkRole')(['DOCTOR']), scanAppointment); // Scan
router.get('/doctor/:doctorId', auth, authorize('DOCTOR', 'SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'), getDoctorAppointments);

// Doctor-specific appointment management
router.post('/:appointmentId/consultation-notes', auth, require('../middleware/checkRole')(['DOCTOR']), addConsultationNotes);
router.post('/:appointmentId/prescriptions', auth, require('../middleware/checkRole')(['DOCTOR']), addPrescriptions);
router.post('/:appointmentId/complete', auth, require('../middleware/checkRole')(['DOCTOR']), completeAppointment);
router.get('/doctor/:doctorId/stats', auth, authorize('DOCTOR', 'SUPER_ADMIN', 'VERIFICATION_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'), getDoctorStats);

module.exports = router;
