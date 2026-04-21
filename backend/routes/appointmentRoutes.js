const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
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
router.post('/', auth, bookAppointment);
router.get('/my', auth, getUserAppointments);
router.get('/:id', auth, getAppointmentById); // Get By ID (Order matters, place after specific routes if needed, but numeric/oid usually safe)
router.post('/:id/cancel', auth, cancelAppointment);
router.post('/:id/reschedule', auth, rescheduleAppointment); // explicit import from line 11
router.post('/scan', auth, require('../middleware/checkRole')(['DOCTOR']), scanAppointment); // Scan
router.get('/doctor/:doctorId', auth, getDoctorAppointments);

// Doctor-specific appointment management
router.post('/:appointmentId/consultation-notes', auth, require('../middleware/checkRole')(['DOCTOR']), addConsultationNotes);
router.post('/:appointmentId/prescriptions', auth, require('../middleware/checkRole')(['DOCTOR']), addPrescriptions);
router.post('/:appointmentId/complete', auth, require('../middleware/checkRole')(['DOCTOR']), completeAppointment);
router.get('/doctor/:doctorId/stats', auth, getDoctorStats);

module.exports = router;
