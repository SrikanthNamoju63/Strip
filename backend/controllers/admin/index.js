const Admin = require('../../models/Admin');
const Doctor = require('../../models/Doctor');
const User = require('../../models/User'); // Patients
const Appointment = require('../../models/Appointment');
const Payment = require('../../models/Payment');
const BloodDonation = require('../../models/BloodDonation');
const Rating = require('../../models/Rating');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Admin Login
exports.login = async (req, res) => {
    const { username, password } = req.body;
    try {
        let admin = await Admin.findOne({ username });
        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: admin.id,
                role: admin.role
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });

        admin.lastLogin = Date.now();
        await admin.save();

        res.json({ token, admin: { id: admin.id, username: admin.username, role: admin.role } });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Dashboard Stats
exports.getStats = async (req, res) => {
    try {
        const doctorCount = await Doctor.countDocuments({});
        const verifiedDoctorCount = await Doctor.countDocuments({ isVerified: true });
        const pendingDoctorCount = await Doctor.countDocuments({ isVerified: false });
        const userCount = await User.countDocuments({});
        const appointmentCount = await Appointment.countDocuments({});

        // Calculate Financial Stats
        const financialStats = await Payment.aggregate([
            {
                $group: {
                    _id: null,
                    totalProfit: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "CAPTURED"] },
                                { $add: ["$platformCommission", { $ifNull: ["$convenienceFee", 0] }] },
                                0
                            ]
                        }
                    },
                    totalRefunds: {
                        $sum: { $ifNull: ["$refundAmount", 0] }
                    }
                }
            }
        ]);

        const financials = financialStats[0] || { totalProfit: 0, totalRefunds: 0 };

        res.json({
            doctors: {
                total: doctorCount,
                verified: verifiedDoctorCount,
                pending: pendingDoctorCount
            },
            users: {
                total: userCount
            },
            appointments: {
                total: appointmentCount
            },
            financials: {
                totalProfit: financials.totalProfit,
                totalRefunds: financials.totalRefunds
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get All Doctors (with filter)
exports.getDoctors = async (req, res) => {
    try {
        const { status } = req.query; // 'verified', 'pending', or 'all'
        let query = {};
        if (status === 'verified') query.isVerified = true;
        if (status === 'pending') query.isVerified = false;

        const doctors = await Doctor.find(query).select('-passwordHash').sort({ createdAt: -1 });
        res.json(doctors);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Toggle Verification
exports.verifyDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body; // true or false

        let doctor = await Doctor.findById(id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        doctor.isVerified = isVerified;
        // Also update verificationStatus string enum for consistency if needed
        if (isVerified) {
            doctor.verificationStatus = 'VERIFIED';
            doctor.verifiedAt = Date.now();
        } else {
            // If un-verifying, what should status be? PENDING or SUSPENDED?
            // Usually unverify means going back to PENDING or just unverified boolean
            // The user request only mentioned "Bank status should move to VERIFIED only after super admin verifies bank details."
        }

        await doctor.save();

        const AuditLog = require('../../models/AuditLog'); // Dynamic import or move to top
        await AuditLog.create({
            module: 'DOCTOR',
            action: isVerified ? 'VERIFY' : 'UNVERIFY',
            performedBy: req.admin.id,
            targetId: doctor._id,
            targetModel: 'Doctor'
        });

        res.json({ msg: `Doctor ${isVerified ? 'Verified' : 'Unverified'} Successfully`, doctor });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.verifyBankDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'VERIFIED' or 'FAILED'

        let doctor = await Doctor.findById(id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        if (!doctor.bankDetails) {
            return res.status(400).json({ msg: 'No bank details found to verify' });
        }

        doctor.bankDetails.verificationStatus = status;
        await doctor.save();

        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'DOCTOR',
            action: 'VERIFY_BANK',
            performedBy: req.admin.id,
            targetId: doctor._id,
            targetModel: 'Doctor',
            metadata: `Bank status updated to ${status}`
        });

        res.json({ msg: `Bank Details ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}`, bankDetails: doctor.bankDetails });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Delete Doctor
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        await Doctor.findByIdAndDelete(req.params.id);

        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'DOCTOR',
            action: 'DELETE',
            performedBy: req.admin.id,
            targetId: req.params.id,
            targetModel: 'Doctor',
            metadata: `Deleted doctor ${doctor ? doctor.email : 'unknown'}`
        });

        res.json({ msg: 'Doctor Removed' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get All Users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get All Appointments with Details
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({
            status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] }
        })
            .populate('userId', 'name email phone')
            .populate('doctorId', 'name specialization clinicAddress')
            .populate('paymentId')
            .sort({ appointmentDate: -1 });
        res.json(appointments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get All Blood Donations
exports.getBloodDonations = async (req, res) => {
    try {
        const donations = await BloodDonation.find()
            .populate('userId', 'name email bloodGroup phone')
            .sort({ donationDate: -1 });
        res.json(donations);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get All Payments
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email')
            .populate('doctorId', 'name')
            .sort({ paidAt: -1 });
        res.json(payments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Get Single Doctor Details with History
exports.getDoctorDetails = async (req, res) => {
    console.log(`[Admin] Fetching details for doctor: ${req.params.id}`);
    try {
        const doctor = await Doctor.findById(req.params.id).select('-passwordHash');
        if (!doctor) {
            console.log(`[Admin] Doctor not found: ${req.params.id}`);
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        const appointments = await Appointment.find({ doctorId: req.params.id })
            .populate('userId', 'name email phone')
            .sort({ appointmentDate: -1 });

        const payments = await Payment.find({ doctorId: req.params.id })
            .populate('userId', 'name')
            .sort({ paidAt: -1 });

        // Ratings for the doctor
        const ratings = await Rating.find({ doctorId: req.params.id })
            .select('overallRating reviewText userId createdAt')
            .sort({ createdAt: -1 });

        // Aggregated rating stats
        const ratingAgg = await Rating.aggregate([
            { $match: { doctorId: new (require('mongoose').Types.ObjectId)(req.params.id) } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$overallRating' },
                    totalReviews: { $sum: 1 }
                }
            }
        ]);

        // Financial aggregates for this doctor
        const paymentAgg = await Payment.aggregate([
            { $match: { doctorId: new (require('mongoose').Types.ObjectId)(req.params.id) } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    adminEarnings: { $sum: '$platformCommission' },
                    doctorPayouts: { $sum: '$doctorAmount' },
                    totalRefunds: { $sum: { $ifNull: ['$refundAmount', 0] } },
                    transactionCount: { $sum: 1 }
                }
            }
        ]);

        console.log(`[Admin] Found doctor, ${appointments.length} appointments, ${payments.length} payments, ${ratings.length} ratings`);

        res.json({
            doctor,
            appointments,
            payments,
            ratings,
            ratingSummary: ratingAgg[0] || { averageRating: 0, totalReviews: 0 },
            financialSummary: paymentAgg[0] || { totalRevenue: 0, adminEarnings: 0, doctorPayouts: 0, totalRefunds: 0, transactionCount: 0 }
        });
    } catch (err) {
        console.error('[Admin] Error fetching doctor details:', err);
        res.status(500).json({ msg: `Server Error: ${err.message}` });
    }
};

// Get Single User Details with History
exports.getUserDetails = async (req, res) => {
    console.log(`[Admin] Fetching details for user: ${req.params.id}`);
    try {
        const user = await User.findById(req.params.id).select('-passwordHash');
        if (!user) {
            console.log(`[Admin] User not found: ${req.params.id}`);
            return res.status(404).json({ msg: 'User not found' });
        }

        const appointments = await Appointment.find({ userId: req.params.id })
            .populate('doctorId', 'name specialization clinicAddress')
            .populate('paymentId')
            .sort({ appointmentDate: -1 });

        const payments = await Payment.find({ userId: req.params.id })
            .sort({ paidAt: -1 });

        console.log(`[Admin] Found user, ${appointments.length} apps, ${payments.length} payments`);
        res.json({ user, appointments, payments, donations: [] }); // donations was missing in fetch
    } catch (err) {
        console.error('[Admin] Error fetching user details:', err);
        res.status(500).json({ msg: `Server Error: ${err.message}` });
    }
};

// --- Appointment Actions ---

// Cancel Appointment
exports.cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason, refundPercent } = req.body; // refundPercent: 0, 50, 100

        let appointment = await Appointment.findById(id).populate('paymentId');
        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        if (appointment.status === 'CANCELLED' || appointment.status === 'CANCELLED_BY_ADMIN') {
            return res.status(400).json({ msg: 'Appointment is already cancelled' });
        }

        appointment.status = 'CANCELLED_BY_ADMIN';
        appointment.cancelledBy = 'ADMIN';
        appointment.cancellationReason = reason || 'Cancelled by Admin';

        // Calculate Refund stuff if payment was made
        if (appointment.paymentStatus === 'COMPLETED' || appointment.status === 'PAID' || appointment.status === 'CONFIRMED') {
            const totalPaid = appointment.fees?.totalPaid || appointment.consultationFee || 0;
            const percentage = refundPercent !== undefined ? refundPercent : 100; // Default 100% if not specified
            const refundAmount = (totalPaid * percentage) / 100;

            appointment.cancellation = {
                cancelledAt: Date.now(),
                reason: reason || 'Cancelled by Admin',
                refundAmount: refundAmount,
                refundPercent: percentage,
                refundStatus: 'PENDING' // Needs explicit trigger or auto-process
            };
        } else {
            appointment.cancellation = {
                cancelledAt: Date.now(),
                reason: reason || 'Cancelled by Admin',
                refundAmount: 0,
                refundPercent: 0,
                refundStatus: 'REFUNDED' // Nothing to refund
            };
        }

        await appointment.save();

        // Audit Log
        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'APPOINTMENT',
            action: 'CANCEL',
            performedBy: req.admin.id,
            targetId: appointment._id,
            targetModel: 'Appointment',
            metadata: `Cancelled appointment. Refund Pending: ${appointment.cancellation.refundAmount}`
        });

        res.json({ msg: 'Appointment Cancelled', appointment });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Reschedule Appointment
exports.rescheduleAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { date, time } = req.body;

        let appointment = await Appointment.findById(id);
        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        const previousDate = appointment.appointmentDate;
        const previousTime = appointment.appointmentTime;
        const previousToken = appointment.tokenNumber; // Assuming we might regenerate

        // Basic Reschedule Logic
        appointment.appointmentDate = date;
        appointment.appointmentTime = time;
        appointment.status = 'RESCHEDULED';

        // Push history
        appointment.rescheduleHistory.push({
            previousDate,
            previousTime,
            previousToken,
            rescheduledBy: 'ADMIN',
            rescheduledAt: Date.now(),
            reason: 'Admin Rescheduled'
        });

        appointment.rescheduledCount += 1;

        await appointment.save();

        // Audit Log
        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'APPOINTMENT',
            action: 'RESCHEDULE',
            performedBy: req.admin.id,
            targetId: appointment._id,
            targetModel: 'Appointment',
            metadata: `Rescheduled to ${date} ${time}`
        });

        res.json({ msg: 'Appointment Rescheduled', appointment });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Trigger Refund
exports.refundAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, refundId } = req.body;

        let appointment = await Appointment.findById(id).populate('paymentId');
        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        // Update Appointment Cancellation Info
        if (!appointment.cancellation) appointment.cancellation = {};

        appointment.cancellation.refundStatus = 'REFUNDED';
        if (amount) appointment.cancellation.refundAmount = amount;
        if (refundId) appointment.cancellation.refundId = refundId;

        appointment.paymentStatus = 'REFUNDED'; // Mark overall status
        await appointment.save();

        // Update Payment Record if exists
        if (appointment.paymentId) {
            let payment = await Payment.findById(appointment.paymentId._id || appointment.paymentId);
            if (payment) {
                payment.paymentStatus = 'REFUNDED';
                payment.refundAmount = amount;
                payment.refundedAt = Date.now();
                payment.refundReason = 'Admin Forced Refund';
                await payment.save();
            }
        }

        // Audit Log
        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'FINANCE',
            action: 'REFUND',
            performedBy: req.admin.id,
            targetId: appointment._id,
            targetModel: 'Appointment',
            metadata: `Refunded ${amount}`
        });

        res.json({ msg: 'Refund Processed', appointment });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// --- Admin Management ---

// Get all admins
exports.getAdmins = async (req, res) => {
    try {
        const admins = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(admins);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Create new admin
exports.createAdmin = async (req, res) => {
    try {
        const { username, email, password, role, permissions } = req.body;

        let admin = await Admin.findOne({ username });
        if (admin) return res.status(400).json({ msg: 'Admin already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        admin = new Admin({
            username,
            email,
            passwordHash,
            role,
            permissions,
            createdBy: req.admin.id
        });

        await admin.save();

        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'ADMIN',
            action: 'CREATE',
            performedBy: req.admin.id,
            targetId: admin._id,
            targetModel: 'Admin',
            metadata: `Created admin ${username} with role ${role}`
        });

        res.json({ msg: 'Admin created successfully', admin });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// Update admin (role/permissions)
exports.updateAdmin = async (req, res) => {
    try {
        const { role, permissions, isActive } = req.body;
        let admin = await Admin.findById(req.params.id);

        if (!admin) return res.status(404).json({ msg: 'Admin not found' });

        // Prevent modifying own role to lock yourself out (optional check)

        if (role) admin.role = role;
        if (permissions) admin.permissions = permissions;
        if (typeof isActive !== 'undefined') admin.isActive = isActive;

        await admin.save();

        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'ADMIN',
            action: 'UPDATE',
            performedBy: req.admin.id,
            targetId: admin._id,
            targetModel: 'Admin',
            metadata: `Updated admin ${admin.username}`
        });

        res.json({ msg: 'Admin updated', admin });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

// @desc    Change Admin Password
// @route   POST api/admin/change-password
// @access  Private (Admin)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide both current and new passwords' });
        }

        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(404).json({ msg: 'Admin not found' });

        const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password' });
        }

        const salt = await bcrypt.genSalt(10);
        admin.passwordHash = await bcrypt.hash(newPassword, salt);

        await admin.save();

        const AuditLog = require('../../models/AuditLog');
        await AuditLog.create({
            module: 'ADMIN',
            action: 'CHANGE_PASSWORD',
            performedBy: req.admin.id,
            targetId: admin._id,
            targetModel: 'Admin',
            metadata: 'Password changed'
        });

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
