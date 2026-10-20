const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminAuth = require('../middleware/adminAuth');
const { authLimiter, adminActionLimiter } = require('../middleware/rateLimiting');
const { validationErrorHandler } = require('../middleware/inputValidation');
const {
    login,
    getStats,
    getDoctors,
    verifyDoctor,
    rejectDoctor,
    suspendDoctor,
    revokeVerification,
    requestReupload,
} = require('../controllers/user/doctorController');

const adminController = require('../controllers/admin');

// Public
const financeController = require('../controllers/finance');
const supportController = require('../controllers/support');
const settingController = require('../controllers/misc/settingController');
const auditController = require('../controllers/misc/auditController');
const checkPermission = require('../middleware/rbac');

// Public
router.post('/login', authLimiter, [
  body('username').trim().isLength({ min: 3, max: 80 }).withMessage('Username is required'),
  body('password').isString().isLength({ min: 1, max: 256 }).withMessage('Password is required'),
  validationErrorHandler
], adminController.login);

// Protected
router.get('/stats', adminAuth, adminController.getStats);
router.post('/change-password', adminAuth, adminActionLimiter, [
  body('currentPassword').isString().isLength({ min: 1, max: 256 }),
  body('newPassword')
    .isString().isLength({ min: 12, max: 256 })
    .matches(/[A-Z]/).matches(/[a-z]/).matches(/[0-9]/).matches(/[!@#$%^&*]/)
    .withMessage('New password does not meet the password policy'),
  validationErrorHandler
], adminController.changePassword);

// Doctor Management
router.get('/doctors', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), adminController.getDoctors);
router.post('/doctors/:id/verify', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), verifyDoctor);
router.post('/doctors/:id/reject', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), rejectDoctor);
router.post('/doctors/:id/suspend', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), suspendDoctor);
router.post('/doctors/:id/revoke', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), revokeVerification);
router.post('/doctors/:id/reupload', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), requestReupload);
router.post('/doctors/:id/verify-bank', adminAuth, checkPermission(['SUPER_ADMIN', 'VERIFICATION_ADMIN']), adminController.verifyBankDetails);

router.delete('/doctors/:id', adminAuth, checkPermission(['SUPER_ADMIN']), adminController.deleteDoctor);
router.get('/users', adminAuth, adminController.getUsers);
router.get('/appointments', adminAuth, require('../controllers/admin').getAllAppointments);
router.post('/appointments/:id/cancel', adminAuth, checkPermission(['SUPER_ADMIN']), adminController.cancelAppointment);
router.post('/appointments/:id/reschedule', adminAuth, checkPermission(['SUPER_ADMIN']), adminController.rescheduleAppointment);
router.post('/appointments/:id/refund', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), adminController.refundAppointment);

// Blood
router.post('/blood/requests/:id/match', adminAuth, checkPermission(['SUPER_ADMIN']), require('../controllers/blood').matchDonor);
router.get('/blood/requests', adminAuth, require('../controllers/blood').getBloodRequests);
router.get('/blood-donations', adminAuth, require('../controllers/admin').getBloodDonations);
router.get('/payments', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), require('../controllers/admin').getAllPayments);
router.get('/doctors/:id', adminAuth, require('../controllers/admin').getDoctorDetails);
router.get('/users/:id', adminAuth, require('../controllers/admin').getUserDetails);

// Finance - Settlements
router.get('/settlements', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.getSettlements);
router.post('/settlements/generate', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.generateSettlement);
router.put('/settlements/:id/status', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.updateSettlementStatus);

// Finance - Refunds
router.get('/refunds', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.getRefunds);
router.post('/refunds/:id/approve', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.approveRefund);
router.post('/refunds/:id/reject', adminAuth, checkPermission(['SUPER_ADMIN', 'FINANCE_ADMIN']), financeController.rejectRefund);

// Support
router.get('/support/tickets', adminAuth, checkPermission(['SUPER_ADMIN', 'SUPPORT_ADMIN']), supportController.getTickets);
router.get('/support/tickets/:id', adminAuth, checkPermission(['SUPER_ADMIN', 'SUPPORT_ADMIN']), supportController.getTicketById);
router.put('/support/tickets/:id', adminAuth, checkPermission(['SUPER_ADMIN', 'SUPPORT_ADMIN']), supportController.updateTicket);
router.post('/support/tickets/:id/reply', adminAuth, checkPermission(['SUPER_ADMIN', 'SUPPORT_ADMIN']), supportController.replyToTicket);

// Admin Management
router.get('/admins', adminAuth, checkPermission(['SUPER_ADMIN']), require('../controllers/admin').getAdmins);
router.post('/admins', adminAuth, checkPermission(['SUPER_ADMIN']), require('../controllers/admin').createAdmin);
router.put('/admins/:id', adminAuth, checkPermission(['SUPER_ADMIN']), require('../controllers/admin').updateAdmin);

// Settings
router.get('/settings', adminAuth, settingController.getSettings);
router.put('/settings', adminAuth, checkPermission(['SUPER_ADMIN']), settingController.updateSetting);

// Audit Logs
router.get('/audit-logs', adminAuth, checkPermission(['SUPER_ADMIN']), auditController.getLogs);

// --- Missing Routes Stubs ---
const stubController = require('../controllers/admin/stubController');

// System
router.get('/system/health', adminAuth, stubController.systemHealth);
router.get('/system/api-health', adminAuth, stubController.apiHealth);
router.get('/system/logs', adminAuth, stubController.systemLogs);

// Analytics
router.get('/analytics/advanced', adminAuth, stubController.advancedAnalytics);
router.get('/analytics/export', adminAuth, stubController.exportData);
router.get('/activity', adminAuth, stubController.activity);

// Email
router.get('/email/templates', adminAuth, stubController.emailTemplates);
router.get('/email/history', adminAuth, stubController.emailHistory);

// Monitoring
router.get('/monitoring/api-metrics', adminAuth, stubController.apiMetrics);
router.get('/monitoring/endpoints', adminAuth, stubController.endpoints);

module.exports = router;

