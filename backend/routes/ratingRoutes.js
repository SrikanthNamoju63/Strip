const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const ratingController = require('../controllers/user/ratingController');

// Public routes
router.get('/doctor/:doctorId', ratingController.getDoctorRatings);
router.get('/appointment/:appointmentId', protect, ratingController.getAppointmentRating);

// Private routes (Patient/User)
router.get('/pending', protect, authorize('USER', 'PATIENT'), ratingController.getPendingFeedback);
router.post('/', protect, authorize('USER', 'PATIENT'), ratingController.submitRating);
router.put('/:ratingId', protect, authorize('USER', 'PATIENT'), ratingController.updateRating);
router.delete('/:ratingId', protect, authorize('USER', 'PATIENT'), ratingController.deleteRating);

// Doctor response
router.post('/:ratingId/respond', protect, authorize('DOCTOR'), ratingController.respondToRating);

// Admin routes
router.get('/admin/all', protect, authorize('SUPER_ADMIN', 'SUPPORT_ADMIN'), ratingController.getAllRatings);
router.get('/user/:userId', protect, authorize('SUPER_ADMIN', 'SUPPORT_ADMIN'), ratingController.getUserRatings);
router.put('/:ratingId/hide', protect, authorize('SUPER_ADMIN'), ratingController.toggleRatingVisibility);
router.delete('/:ratingId/admin', protect, authorize('SUPER_ADMIN'), ratingController.deleteRating); // Admin delete

module.exports = router;
