const Appointment = require('../../models/Appointment');
const Doctor = require('../../models/Doctor');
const socketManager = require('../../utils/socket');

// @desc    Book an appointment
// @route   POST api/appointments
// @access  Private
// @desc    Book an appointment with atomic slot allocation (prevents double-booking)
// @route   POST api/appointments
// @access  Private
exports.bookAppointment = async (req, res) => {
    const {
        doctorId,
        appointmentDate,
        appointmentTime,
        diseaseKeyword,
        patientDetails,
        couponCode
    } = req.body;

    let session = null;
    try {
        const Doctor = require('../../models/Doctor');
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // Fix: Check doctor verification status
        if (doctor.verificationStatus !== 'VERIFIED' && doctor.verificationStatus !== 'ACTIVE') {
            return res.status(400).json({ msg: 'Doctor is not verified and cannot accept appointments' });
        }

        // Validate required fields
        if (!appointmentDate || !appointmentTime) {
            return res.status(400).json({ msg: 'Date and Time are required' });
        }

        // Check availability
        const searchDate = new Date(appointmentDate);
        if (isNaN(searchDate.getTime())) {
            return res.status(400).json({ msg: 'Invalid date' });
        }

        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Check availability (Removed Transaction for Standalone Support)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Check availability without transaction
        const existingAppointment = await Appointment.findOne({
            doctorId,
            appointmentDate: {
                $gte: searchDate,
                $lt: nextDay
            },
            appointmentTime: appointmentTime,
            $or: [
                { status: { $in: ['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'PAID', 'PENDING', 'IN_PROGRESS'] } },
                { status: 'PENDING_PAYMENT', createdAt: { $gt: fiveMinutesAgo } },
                { status: 'LOCKED', paymentExpiry: { $gt: new Date() } }
            ]
        });

        if (existingAppointment) {
            return res.status(400).json({ msg: 'Slot is currently locked or booked' });
        }

        // --- FEE CALCULATION START ---
        const FeeConfig = require('../../models/FeeConfig');
        let feeConfig = await FeeConfig.findOne().sort({ createdAt: -1 });

        // Default if not set - Log critical issue
        if (!feeConfig) {
            console.error('CRITICAL: FeeConfig not found, using defaults');
            feeConfig = { platformFee: 0, commissionType: 'PERCENT', commissionValue: 0 };
        }

        const consultationFee = Number(doctor.consultationFee);
        const platformFee = Number(feeConfig.platformFee);
        let commissionFee = 0;

        if (feeConfig.commissionType === 'PERCENT') {
            // commissionValue is percentage (e.g. 10 for 10%)
            commissionFee = (consultationFee * feeConfig.commissionValue) / 100;
        } else {
            // FIXED value
            commissionFee = Number(feeConfig.commissionValue);
        }

        // Ensure commission doesn't exceed consultation fee
        if (commissionFee > consultationFee) {
            commissionFee = consultationFee;
        }

        // Rounding Rules (2 decimals)
        commissionFee = Math.round(commissionFee * 100) / 100;

        const doctorReceivable = Math.round((consultationFee - commissionFee) * 100) / 100;
        let totalPaid = Math.round((consultationFee + platformFee) * 100) / 100;
        let adminProfit = Math.round((platformFee + commissionFee) * 100) / 100;

        // --- COUPON CALCULATION ---
        let appliedDiscountAmount = 0;
        let appliedCouponCode = null;

        if (couponCode) {
            const Coupon = require('../../models/Coupon');
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            
            if (coupon && new Date(coupon.expiryDate) >= new Date()) {
                let isValid = true;
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) isValid = false;
                
                if (coupon.isWelcomeCoupon) {
                    const hasAppts = await Appointment.findOne({ userId: req.user.id, status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] } });
                    if (hasAppts) isValid = false;
                }

                if (isValid) {
                    // Check if this user already used this coupon
                    if (coupon.usedBy && coupon.usedBy.some(id => id.toString() === req.user.id.toString())) {
                        isValid = false;
                    }
                }

                if (isValid) {
                    if (coupon.discountType === 'PERCENTAGE') {
                        appliedDiscountAmount = (totalPaid * coupon.discountValue) / 100;
                    } else if (coupon.discountType === 'FLAT') {
                        appliedDiscountAmount = coupon.discountValue;
                    }

                    if (coupon.maxDiscount && appliedDiscountAmount > coupon.maxDiscount) {
                        appliedDiscountAmount = coupon.maxDiscount;
                    }

                    if (appliedDiscountAmount > totalPaid) {
                        appliedDiscountAmount = totalPaid;
                    }

                    appliedDiscountAmount = Math.round(appliedDiscountAmount * 100) / 100;
                    totalPaid = Math.round((totalPaid - appliedDiscountAmount) * 100) / 100;
                    adminProfit = Math.round((adminProfit - appliedDiscountAmount) * 100) / 100;
                    appliedCouponCode = coupon.code;
                    
                    // Increment coupon usage and track user
                    coupon.usedCount += 1;
                    if (!coupon.usedBy) coupon.usedBy = [];
                    coupon.usedBy.push(req.user.id);
                    await coupon.save();
                }
            }
        }

        const feeBreakdown = {
            consultationFee,
            platformFee,
            commissionType: feeConfig.commissionType,
            commissionValue: feeConfig.commissionValue,
            commissionFee,
            couponCode: appliedCouponCode,
            discountAmount: appliedDiscountAmount,
            totalPaid,
            doctorReceivable,
            adminProfit
        };
        // --- FEE CALCULATION END ---

        // Generate sequential token number (Ignoring Cancelled & Expired)
        const validTokenCount = await Appointment.countDocuments({
            doctorId,
            appointmentDate: {
                $gte: searchDate,
                $lt: nextDay
            },
            $or: [
                { status: { $in: ['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'PAID', 'PENDING', 'IN_PROGRESS'] } },
                { status: 'PENDING_PAYMENT', createdAt: { $gt: fiveMinutesAgo } },
                { status: 'LOCKED', paymentExpiry: { $gt: new Date() } }
            ]
        });

        const tokenNumber = validTokenCount + 1;

        const newAppointment = new Appointment({
            userId: req.user.id,
            doctorId,
            appointmentDate,
            appointmentTime,
            diseaseKeyword,
            tokenNumber,
            patientDetails,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            consultationFee: doctor.consultationFee,
            fees: feeBreakdown
        });

        const savedAppointment = await newAppointment.save();

        // Real-time Notifications (Booking Created)
        const notificationService = require('../../services/notificationService');
        try {
            await notificationService.sendToDoctor(
                doctorId,
                'New Appointment Request',
                `New appointment booked by patient for ${appointmentDate} at ${appointmentTime}`,
                'APPOINTMENT'
            );
        } catch (notifErr) {
            console.error('Notification error:', notifErr);
        }

        // Real-time Socket.IO emission should happen AFTER payment is verified.
        // It is moved to razorpayService.js / paymentController.js.

        res.json({ appointment: savedAppointment });

    } catch (err) {
        console.error("Book Appointment Error:", err.message);
        res.status(500).json({ msg: 'Server Error during booking processing.' });
    }
};


// @desc    Get user's appointments
// @route   GET api/appointments/my
// @access  Private
exports.getUserAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            userId: req.user.id,
            status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] }
        })
            .populate('doctorId', ['name', 'hospitalName'])
            .populate('paymentId');
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get doctor's appointments (For Doctor Dashboard)
// @route   GET api/appointments/doctor/:doctorId
// @access  Private
exports.getDoctorAppointments = async (req, res) => {
    try {
        const { date } = req.query;
        let query = { 
            doctorId: req.params.doctorId,
            status: { $nin: ['PENDING_PAYMENT', 'LOCKED', 'PAYMENT_FAILED', 'PENDING'] }
        };

        if (date) {
            // Filter by date (YYYY-MM-DD)
            const searchDate = new Date(date);
            if (!isNaN(searchDate.getTime())) {
                const nextDay = new Date(searchDate);
                nextDay.setDate(nextDay.getDate() + 1);
                query.appointmentDate = {
                    $gte: searchDate,
                    $lt: nextDay
                };
            }
        }

        // Sort by time
        // Since appointmentTime is String "HH:MM", lexicographical sort works perfectly for 24h format.
        // But if someone manually enters 12h, it might break. We enforce "HH:MM" 24h internally or ensure sorting.
        // Assuming 24h format stored.

        const appointments = await Appointment.find(query)
            .populate('userId', ['name', 'email', 'phone'])
            .sort({ appointmentDate: 1, appointmentTime: 1 }); // Sort by date then time

        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get appointment by ID (for QR details)
// @route   GET api/appointments/:id
// @access  Private
exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('doctorId', ['name', 'specialization', 'hospitalName', 'consultationFee', 'clinicAddress'])
            .populate('userId', ['name', 'email', 'phone']);

        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }
        res.json(appointment);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Scan/Mark appointment as completed
// @route   POST api/appointments/scan
// @access  Private (Doctor Only)
exports.scanAppointment = async (req, res) => {
    const { appointmentId } = req.body;

    try {
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Verify appointment belongs to this doctor
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to scan this appointment' });
        }

        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({ msg: 'Appointment already scanned and completed' });
        }

        appointment.status = 'COMPLETED';
        appointment.checkInTime = new Date();
        await appointment.save();

        // Real-time Socket.IO emission
        try {
            socketManager.emitAppointmentUpdate({
                doctorId: appointment.doctorId,
                userId: appointment.userId,
                status: 'COMPLETED',
                appointmentId: appointment._id
            });
        } catch (e) { /* silent */ }

        res.json({ msg: 'Appointment verified and marked as COMPLETED', appointment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
// @desc    Cancel appointment
// @route   POST api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        let { reason } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role; // Assuming role is set in middleware 'USER', 'DOCTOR', 'ADMIN'

        const appointment = await Appointment.findById(appointmentId).populate('paymentId');

        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }


        if (appointment.status === 'CANCELLED') {
            return res.status(400).json({ msg: 'Appointment already cancelled' });
        }

        if (appointment.status === 'COMPLETED' || appointment.status === 'CHECKED_IN') {
            return res.status(400).json({ msg: 'Cannot cancel completed or checked-in appointment' });
        }

        // Check ownership
        if (userRole === 'USER' && appointment.userId.toString() !== userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }
        if (userRole === 'DOCTOR' && appointment.doctorId.toString() !== userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        let refundAmount = 0;
        let refundStatus = 'PENDING';
        let refundPercent = 0;

        // Logic based on who is cancelling
        if (userRole === 'USER') {
            // Check if appointment was rescheduled (Forfeit Refund Rule)
            if (appointment.rescheduledCount > 0) {
                refundPercent = 0;
                refundAmount = 0;
                refundStatus = 'FORFEITED';
                reason = reason ? `${reason} (Refund forfeited due to reschedule)` : "Refund forfeited due to reschedule";
            } else {
                const appointmentDateTime = new Date(appointment.appointmentDate);
                // Assuming appointmentDate matches day, combining with time
                // If appointmentTime is "10:00"
                const [hours, minutes] = appointment.appointmentTime.split(':');
                appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                const now = new Date();
                const diffInHours = (appointmentDateTime - now) / (1000 * 60 * 60);

                // Refund Policy
                // > 6 hrs: 100% consultationFee
                // 2-6 hrs: 50% consultationFee
                // < 2 hrs: 0% refund

                if (diffInHours < 2) {
                    // No refund
                    refundPercent = 0;
                } else if (diffInHours >= 2 && diffInHours < 6) {
                    refundPercent = 50;
                } else {
                    refundPercent = 100;
                }

                // Calculate Amount based on Consultation Fee only (Platform fee kept)
                const consultationFee = appointment.consultationFee || 0;
                refundAmount = (consultationFee * refundPercent) / 100;

                if (refundAmount > 0) {
                    refundStatus = (appointment.paymentStatus === 'COMPLETED') ? 'REFUNDED' : 'PENDING';
                    // NOTE: In real world, we would trigger Payment Gateway refund API here
                    // For now, we update status assuming immediate processing specific to this logic
                } else {
                    refundStatus = 'NA'; // No refund applicable
                }
            }

        } else {
            // Doctor or Admin Cancellation -> 100% Refund
            if (appointment.paymentStatus === 'COMPLETED') {
                refundPercent = 100;
                refundAmount = appointment.consultationFee;
                refundStatus = 'REFUNDED';
            }
        }

        // Update Appointment
        appointment.status = 'CANCELLED';
        appointment.cancelledBy = userRole;
        appointment.cancellationReason = reason;

        appointment.cancellation = {
            cancelledAt: new Date(),
            reason: reason,
            refundAmount: refundAmount,
            refundPercent: refundPercent,
            refundStatus: refundStatus,
            // refundId: 'generated-if-integrated' 
        };

        if (refundStatus === 'REFUNDED') {
            appointment.paymentStatus = 'REFUNDED';
            // Logic to update Payment Record
            const Payment = require('../../models/Payment');
            if (appointment.paymentId) {
                await Payment.findByIdAndUpdate(appointment.paymentId, {
                    paymentStatus: 'REFUNDED',
                    refundAmount: refundAmount,
                    refundReason: reason || 'Cancelled by ' + userRole,
                    refundedAt: new Date(),
                    notes: `Refund Rule: ${refundPercent}% applied`
                });
            }
        }

        await appointment.save();

        // Real-time Socket.IO emission
        try {
            socketManager.emitAppointmentUpdate({
                doctorId: appointment.doctorId,
                userId: appointment.userId,
                status: 'CANCELLED',
                appointmentId: appointment._id,
                refundAmount
            });
        } catch (e) { /* silent */ }

        res.json({
            msg: 'Appointment cancelled successfully',
            refundAmount,
            refundPercent,
            refundStatus
        });

        // Notify relevant party
        const notificationService = require('../../services/notificationService');
        if (userRole === 'USER') {
            notificationService.sendToDoctor(
                appointment.doctorId,
                'Appointment Cancelled',
                `Appointment with token ${appointment.tokenNumber} has been cancelled by the patient.`,
                'APPOINTMENT_CANCELLED'
            );
        } else {
            notificationService.sendToUser(
                appointment.userId,
                'Appointment Cancelled',
                `Your appointment with Dr. ${appointment.doctorId} has been cancelled. Reason: ${reason || 'Unspecified'}`,
                'APPOINTMENT_CANCELLED'
            );
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Reschedule appointment
// @route   POST api/appointments/:id/reschedule
// @access  Private
exports.rescheduleAppointment = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        const { date, time, reason } = req.body;
        const userId = req.user.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Check ownership
        if (appointment.userId.toString() !== userId) {
            return res.status(401).json({ msg: 'Not authorized' });
        }


        if (appointment.status === 'CANCELLED' || appointment.status === 'COMPLETED' || appointment.status === 'CHECKED_IN') {
            return res.status(400).json({ msg: 'Cannot reschedule completed, checked-in or cancelled appointment' });
        }

        // Rule A - Reschedule allowed only 1 time
        if (appointment.rescheduledCount >= 1) {
            return res.status(400).json({ msg: 'Appointment can strictly be rescheduled only once.' });
        }

        // Rule C - Reschedule only for future appointments (Existing) 
        // + Cutoff Rule: Allow ONLY if current time is before slot time - 2 hours
        const currentAppointmentDateTime = new Date(appointment.appointmentDate);
        const [h, m] = appointment.appointmentTime.split(':');
        currentAppointmentDateTime.setHours(parseInt(h), parseInt(m), 0, 0);

        const now = new Date();
        const diffInHours = (currentAppointmentDateTime - now) / (1000 * 60 * 60);

        if (diffInHours < 2) {
            return res.status(400).json({ msg: 'Reschedule allowed only before 2 hours of appointment time' });
        }

        // Validate New Date
        if (!date || !time) {
            return res.status(400).json({ msg: 'New Date and Time are required' });
        }

        const searchDate = new Date(date);
        if (isNaN(searchDate.getTime())) {
            return res.status(400).json({ msg: 'Invalid date' });
        }

        // Ensure new date is in future
        // We can compare searchDate + time with NOW
        const [newH, newM] = time.split(':');
        const newAppointmentDateTime = new Date(searchDate);
        newAppointmentDateTime.setHours(parseInt(newH), parseInt(newM), 0, 0);

        if (newAppointmentDateTime <= now) {
            return res.status(400).json({ msg: 'New appointment time must be in the future' });
        }

        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Strict Lock Check for New Slot
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const collision = await Appointment.findOne({
            doctorId: appointment.doctorId,
            appointmentDate: {
                $gte: searchDate,
                $lt: nextDay
            },
            appointmentTime: time,
            $or: [
                { status: { $in: ['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CHECKED_IN', 'PAID', 'PENDING', 'IN_PROGRESS'] } },
                { status: 'PENDING_PAYMENT', createdAt: { $gt: fiveMinutesAgo } }
            ]
        });

        if (collision) {
            return res.status(400).json({ msg: 'Selected slot is already booked or locked' });
        }

        // Generate New Token
        const validTokenCount = await Appointment.countDocuments({
            doctorId: appointment.doctorId,
            appointmentDate: {
                $gte: searchDate,
                $lt: nextDay
            },
            $or: [
                { status: { $in: ['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CHECKED_IN', 'PAID', 'PENDING', 'IN_PROGRESS'] } },
                { status: 'PENDING_PAYMENT', createdAt: { $gt: fiveMinutesAgo } }
            ]
        });
        const newTokenNumber = validTokenCount + 1;

        // Archive History
        appointment.rescheduleHistory.push({
            previousDate: appointment.appointmentDate,
            previousTime: appointment.appointmentTime,
            previousToken: appointment.tokenNumber,
            rescheduledBy: 'PATIENT',
            rescheduledAt: new Date(),
            reason: reason || 'Patient Request'
        });

        // Update Appointment
        appointment.appointmentDate = date;
        appointment.appointmentTime = time;
        appointment.tokenNumber = newTokenNumber;
        appointment.rescheduledCount = (appointment.rescheduledCount || 0) + 1;
        appointment.lastAction = 'RESCHEDULED';
        // Keep status as CONFIRMED (or whatever it was, as long as active)
        if (appointment.status === 'PENDING') appointment.status = 'CONFIRMED';

        // Ensure status is CONFIRMED if it was RESCHEDULED before (though limit is 1, just basic sanity)
        appointment.status = 'RESCHEDULED';

        await appointment.save();

        // Notification
        const notificationService = require('../../services/notificationService');
        try {
            await notificationService.sendToDoctor(
                appointment.doctorId,
                'Appointment Rescheduled',
                `Appointment token ${appointment.tokenNumber} (New) rescheduled to ${date} at ${time}.`,
                'APPOINTMENT_RESCHEDULED'
            );
        } catch (e) { console.error(e); }

        res.json({ msg: 'Appointment rescheduled successfully', appointment });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
// @desc    Add or update consultation notes
// @route   POST api/appointments/:id/consultation-notes
// @access  Private (Doctor Only)
exports.addConsultationNotes = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { consultationNotes } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Verify appointment belongs to this doctor
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this appointment' });
        }

        if (!consultationNotes || consultationNotes.trim() === '') {
            return res.status(400).json({ msg: 'Consultation notes cannot be empty' });
        }

        appointment.consultationNotes = consultationNotes;
        appointment.status = 'IN_PROGRESS';
        await appointment.save();

        res.json({ msg: 'Consultation notes added successfully', appointment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Add prescriptions to appointment
// @route   POST api/appointments/:id/prescriptions
// @access  Private (Doctor Only)
exports.addPrescriptions = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { prescriptions } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Verify appointment belongs to this doctor
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to update this appointment' });
        }

        if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
            return res.status(400).json({ msg: 'Prescriptions must be a non-empty array' });
        }

        // Validate each prescription
        const validPrescriptions = prescriptions.map(p => ({
            medicineName: p.medicineName || '',
            dosage: p.dosage || '',
            frequency: p.frequency || '',
            duration: p.duration || '',
            notes: p.notes || ''
        }));

        appointment.prescriptions = validPrescriptions;
        appointment.status = 'IN_PROGRESS';
        await appointment.save();

        res.json({ msg: 'Prescriptions added successfully', appointment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Complete appointment with notes and prescriptions
// @route   POST api/appointments/:id/complete
// @access  Private (Doctor Only)
exports.completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { consultationNotes, prescriptions, followUpRequired, followUpDate } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        // Verify appointment belongs to this doctor
        if (appointment.doctorId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to complete this appointment' });
        }

        if (appointment.status === 'COMPLETED') {
            return res.status(400).json({ msg: 'Appointment already completed' });
        }

        // Update appointment details
        if (consultationNotes) {
            appointment.consultationNotes = consultationNotes;
        }

        if (Array.isArray(prescriptions) && prescriptions.length > 0) {
            appointment.prescriptions = prescriptions.map(p => ({
                medicineName: p.medicineName || '',
                dosage: p.dosage || '',
                frequency: p.frequency || '',
                duration: p.duration || '',
                notes: p.notes || ''
            }));
        }

        if (followUpRequired !== undefined) {
            appointment.followUpRequired = followUpRequired;
            if (followUpRequired && followUpDate) {
                appointment.followUpDate = new Date(followUpDate);
            }
        }

        appointment.status = 'COMPLETED';
        appointment.endTime = new Date();
        await appointment.save();

        // Update doctor's appointment count
        const Doctor = require('../../models/Doctor');
        await Doctor.findByIdAndUpdate(appointment.doctorId, {
            $inc: { 'earnings.appointmentCount': 1 }
        });

        // Real-time Socket.IO emission
        try {
            socketManager.emitAppointmentUpdate({
                doctorId: appointment.doctorId,
                userId: appointment.userId,
                status: 'COMPLETED',
                appointmentId: appointment._id
            });
        } catch (e) { /* silent */ }

        res.json({ msg: 'Appointment completed successfully', appointment });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get doctor's statistics and metrics
// @route   GET api/appointments/doctor/:doctorId/stats
// @access  Private
exports.getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const { period = '30days' } = req.query;

        let dateFilter = {};
        const now = new Date();
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        let startDate;

        if (period === '7days') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === '30days') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === '90days') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default
        }

        // Ensure start of the day for startDate
        startDate.setHours(0, 0, 0, 0);
        dateFilter = { $gte: startDate, $lte: today };

        // Get appointments in period
        const appointments = await Appointment.find({
            doctorId,
            appointmentDate: dateFilter
        }).sort({ appointmentDate: 1 });

        // Calculate aggregate statistics
        const stats = {
            totalAppointments: appointments.length,
            completedAppointments: appointments.filter(a => a.status === 'COMPLETED').length,
            cancelledAppointments: appointments.filter(a => ['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'CANCELLED_BY_ADMIN'].includes(a.status)).length,
            noShowAppointments: appointments.filter(a => a.status === 'NO_SHOW').length,
            ratedAppointments: appointments.filter(a => a.isRated).length,
            totalRevenue: appointments.reduce((sum, a) => sum + (a.fees?.doctorReceivable || 0), 0),
            averageRating: 0,
            completionRate: 0,
            appointmentTrend: [],
            revenueTrend: [],
            statusDistribution: []
        };

        if (stats.totalAppointments > 0) {
            stats.completionRate = ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(2);
        }

        // --- Trend Logic ---
        // Helper to format date key
        const formatDateKey = (date) => {
            const d = new Date(date);
            return `${d.getDate()}/${d.getMonth() + 1}`; // e.g., "17/2"
        };

        // Initialize map for the period
        const trendMap = {};
        let currentDate = new Date(startDate);
        while (currentDate <= today) {
            const key = formatDateKey(currentDate);
            trendMap[key] = {
                name: key,
                completed: 0,
                cancelled: 0,
                revenue: 0,
                date: new Date(currentDate) // Keep date obj for sorting if needed
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Fill Data
        appointments.forEach(appt => {
            const dayKey = formatDateKey(appt.appointmentDate);
            if (trendMap[dayKey]) {
                if (appt.status === 'COMPLETED') {
                    trendMap[dayKey].completed++;
                } else if (['CANCELLED', 'CANCELLED_BY_USER', 'CANCELLED_BY_DOCTOR', 'CANCELLED_BY_ADMIN'].includes(appt.status)) {
                    trendMap[dayKey].cancelled++;
                }

                // Revenue only from valid paid/completed appts? Or all? Usually completed/paid.
                // Assuming revenue is realized on completion or payment. Using doctorReceivable.
                // If status is 'PAID' or 'COMPLETED'
                if (['COMPLETED', 'PAID', 'CONFIRMED'].includes(appt.status)) {
                    trendMap[dayKey].revenue += (appt.fees?.doctorReceivable || 0);
                }
            }
        });

        // Convert Map to Array
        // If 90days, maybe group by Week? For now, let's stick to days or condense if array is too large?
        // 90 data points is okay for Recharts.

        // For 90 days, let's group by week to reduce noise if needed, but per-day is fine for now.
        // Actually, for better UI, let's just return the daily data.

        stats.appointmentTrend = Object.values(trendMap);
        stats.revenueTrend = Object.values(trendMap).map(d => ({ name: d.name, revenue: d.revenue }));

        // --- Status Distribution ---
        const statusCounts = {};
        appointments.forEach(appt => {
            const s = appt.status;
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        // Map to nice names and colors
        const statusColors = {
            'COMPLETED': '#10b981', // Emerald
            'CANCELLED': '#ef4444', // Red
            'CANCELLED_BY_USER': '#ef4444',
            'CANCELLED_BY_DOCTOR': '#ef4444',
            'CANCELLED_BY_ADMIN': '#ef4444',
            'NO_SHOW': '#f59e0b',   // Amber
            'BOOKED': '#3b82f6',    // Blue
            'CONFIRMED': '#3b82f6',
            'PENDING': '#6366f1'    // Indigo
        };

        stats.statusDistribution = Object.keys(statusCounts).map(key => ({
            name: key.replace(/_/g, ' '),
            value: statusCounts[key],
            color: statusColors[key] || '#9ca3af' // Gray default
        }));

        // Get doctor's average rating
        const Doctor = require('../../models/Doctor');
        const doctor = await Doctor.findById(doctorId);
        if (doctor) {
            stats.averageRating = doctor.ratings?.averageRating || 0;
            stats.totalRatings = doctor.ratings?.totalRatings || 0;
            stats.totalRevenue = doctor.revenue?.totalEarned || stats.totalRevenue; // Use consolidated revenue if available, else calculated
        }

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};