/**
 * Database Ecosystem Integration Service
 * Manages all cross-table relationships and real-time connections
 * Implements security, validation, and event-driven updates
 * 
 * This is the central hub connecting all 31 database tables
 */

const mongoose = require('mongoose');
const EventEmitter = require('events');

class DatabaseEcosystemManager extends EventEmitter {
    constructor() {
        super();
        this.models = {};
        this.hooks = {};
        this.validators = {};
        this.relationships = {};
    }

    // ==================== INITIALIZE ALL MODELS ====================
    async initializeModels() {
        try {
            this.models = {
                User: require('./User'),
                Doctor: require('./Doctor'),
                Admin: require('./Admin'),
                Appointment: require('./Appointment'),
                Payment: require('./Payment'),
                Refund: require('./Refund'),
                Settlement: require('./Settlement'),
                RevenueLedger: require('./RevenueLedger'),
                Rating: require('./Rating'),
                Notification: require('./Notification'),
                AppFeedback: require('./AppFeedback'),
                AuditLog: require('./AuditLog'),
                SupportTicket: require('./SupportTicket'),
                MedicalReport: require('./MedicalReport'),
                HealthReading: require('./HealthReading'),
                HealthAnalysis: require('./HealthAnalysis'),
                HealthPrediction: require('./HealthPrediction'),
                BloodDonation: require('./BloodDonation'),
                BloodDonor: require('./BloodDonor'),
                BloodRequest: require('./BloodRequest'),
                Campaign: require('./Campaign'),
                Content: require('./Content'),
                MedicineReminder: require('./MedicineReminder'),
                Coupon: require('./Coupon'),
                FeeConfig: require('./FeeConfig'),
                SystemSetting: require('./SystemSetting'),
                DoctorAvailability: require('./DoctorAvailability'),
                DoctorBankDetails: require('./DoctorBankDetails'),
                UserActivity: require('./UserActivity'),
                AppointmentReminder: require('./AppointmentReminder'),
                UserWallet: require('./UserWallet'),
                RefreshToken: require('./RefreshToken'),
                BackupSchedule: require('./Backup')
            };
            console.log('All models initialized');
            return this.models;
        } catch (error) {
            console.error('Error initializing models:', error);
            throw error;
        }
    }

    // ==================== SETUP HOOKS & MIDDLEWARE ====================
    setupEcosystemHooks() {
        this.setupUserHooks();
        this.setupDoctorHooks();
        this.setupAppointmentHooks();
        this.setupPaymentHooks();
        this.setupRefundHooks();
        this.setupHealthHooks();
        this.setupBloodBankHooks();
        console.log('All ecosystem hooks registered');
    }

    // ==================== USER HOOKS ====================
    setupUserHooks() {
        const User = this.models.User;
        const UserActivity = this.models.UserActivity;
        const Notification = this.models.Notification;
        const UserWallet = this.models.UserWallet;

        // Create UserActivity on login
        User.collection.updateOne(
            { _id: userId },
            { $set: { lastLogin: new Date() } }
        );

        // Auto-create wallet on user creation
        User.post('save', async (user) => {
            if (!user.role || user.role === 'USER') {
                const walletExists = await UserWallet.findOne({ userId: user._id });
                if (!walletExists) {
                    await UserWallet.create({ userId: user._id });
                }
            }
        });

        // Log user activities
        User.post('findByIdAndUpdate', async (user) => {
            if (user) {
                await UserActivity.create({
                    userId: user._id,
                    activityType: 'PROFILE_UPDATE',
                    resourceType: 'USER',
                    resourceId: user._id,
                    status: 'SUCCESS'
                });
            }
        });

        this.hooks.User = { setupUserHooks: true };
    }

    // ==================== DOCTOR HOOKS ====================
    setupDoctorHooks() {
        const Doctor = this.models.Doctor;
        const DoctorAvailability = this.models.DoctorAvailability;
        const DoctorBankDetails = this.models.DoctorBankDetails;
        const AuditLog = this.models.AuditLog;

        // Auto-create DoctorAvailability and BankDetails on doctor creation
        Doctor.post('save', async (doctor) => {
            const availabilityExists = await DoctorAvailability.findOne({ doctorId: doctor._id });
            if (!availabilityExists) {
                await DoctorAvailability.create({
                    doctorId: doctor._id,
                    weeklyAvailability: [
                        { day: 'MONDAY', startTime: '09:00', endTime: '17:00' },
                        { day: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
                        { day: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
                        { day: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
                        { day: 'FRIDAY', startTime: '09:00', endTime: '17:00' },
                        { day: 'SATURDAY', startTime: '09:00', endTime: '13:00' },
                        { day: 'SUNDAY', isOff: true }
                    ]
                });
            }

            const bankDetailsExists = await DoctorBankDetails.findOne({ doctorId: doctor._id });
            if (!bankDetailsExists) {
                await DoctorBankDetails.create({ doctorId: doctor._id });
            }
        });

        // Audit verification status changes
        Doctor.pre('findByIdAndUpdate', async function (next) {
            const update = this.getUpdate();
            if (update.verificationStatus) {
                const doctor = await Doctor.findById(this.getFilter()._id);
                this._previousStatus = doctor?.verificationStatus;
            }
            next();
        });

        Doctor.post('findByIdAndUpdate', async (doctor) => {
            if (doctor && doctor.verificationStatus !== this._previousStatus) {
                await AuditLog.create({
                    module: 'DOCTOR',
                    action: 'VERIFICATION_STATUS_CHANGE',
                    performedBy: this.adminId,
                    targetId: doctor._id,
                    targetModel: 'Doctor',
                    beforeValue: { verificationStatus: this._previousStatus },
                    afterValue: { verificationStatus: doctor.verificationStatus }
                });
            }
        });

        this.hooks.Doctor = { setupDoctorHooks: true };
    }

    // ==================== APPOINTMENT HOOKS ====================
    setupAppointmentHooks() {
        const Appointment = this.models.Appointment;
        const Notification = this.models.Notification;
        const AppointmentReminder = this.models.AppointmentReminder;
        const UserActivity = this.models.UserActivity;
        const DoctorAvailability = this.models.DoctorAvailability;

        // Create reminders on appointment creation
        Appointment.post('save', async (appointment) => {
            // Create pre-appointment reminder (24 hours before)
            await AppointmentReminder.create({
                appointmentId: appointment._id,
                userId: appointment.userId,
                doctorId: appointment.doctorId,
                reminderType: 'PRE_APPOINTMENT',
                reminderTime: new Date(appointment.appointmentDate.getTime() - 24 * 60 * 60 * 1000),
                channels: [
                    { type: 'SMS', isEnabled: true },
                    { type: 'PUSH_NOTIFICATION', isEnabled: true }
                ],
                reminderContent: {
                    message: `Reminder: You have an appointment with Dr. tomorrow at ${appointment.appointmentTime}`
                }
            });

            // Log activity
            await UserActivity.create({
                userId: appointment.userId,
                activityType: 'APPOINTMENT_BOOK',
                resourceType: 'APPOINTMENT',
                resourceId: appointment._id,
                appointmentId: appointment._id,
                doctorId: appointment.doctorId,
                status: 'SUCCESS'
            });

            // Send notification
            await Notification.create({
                recipientId: appointment.doctorId,
                recipientType: 'doctor',
                title: 'New Appointment Booked',
                message: `You have a new appointment on ${appointment.appointmentDate.toDateString()}`,
                type: 'APPOINTMENT'
            });
        });

        // Update slot availability when appointment status changes
        Appointment.post('findByIdAndUpdate', async (appointment) => {
            if (appointment && appointment.status === 'CONFIRMED') {
                // Update doctor's total appointments count
                const Doctor = this.models.Doctor;
                await Doctor.findByIdAndUpdate(
                    appointment.doctorId,
                    { $inc: { 'earnings.appointmentCount': 1 } }
                );
            }
        });

        // Cancel appointment cleanup
        Appointment.pre('findByIdAndUpdate', async function (next) {
            const update = this.getUpdate();
            if (update.status && update.status.includes('CANCELLED')) {
                const appointment = await Appointment.findById(this.getFilter()._id);
                // Trigger refund if payment exists
                if (appointment.paymentId) {
                    this._triggerRefund = true;
                }
            }
            next();
        });

        this.hooks.Appointment = { setupAppointmentHooks: true };
    }

    // ==================== PAYMENT HOOKS ====================
    setupPaymentHooks() {
        const Payment = this.models.Payment;
        const RevenueLedger = this.models.RevenueLedger;
        const UserWallet = this.models.UserWallet;
        const Notification = this.models.Notification;
        const AuditLog = this.models.AuditLog;

        // Create revenue ledger entry on successful payment
        Payment.post('save', async (payment) => {
            if (payment.paymentStatus === 'CAPTURED') {
                const appointment = await this.models.Appointment.findById(payment.appointmentId);
                
                await RevenueLedger.create({
                    appointmentId: payment.appointmentId,
                    paymentId: payment._id,
                    grossAmount: payment.totalAmount,
                    gatewayFee: payment.actualGatewayFee || 0,
                    taxOnGatewayFee: payment.actualGatewayTax || 0,
                    platformRevenue: payment.platformFee + payment.commission,
                    doctorPayout: payment.doctorAmount,
                    netProfit: (payment.platformFee + payment.commission) - (payment.actualGatewayFee || 0)
                });

                // Update doctor earnings
                await this.models.Doctor.findByIdAndUpdate(
                    payment.doctorId,
                    {
                        $inc: {
                            'earnings.totalEarnings': payment.doctorAmount,
                            'earnings.pendingSettlement': payment.doctorAmount
                        }
                    }
                );

                // Send payment confirmation notifications
                await Notification.create({
                    recipientId: payment.userId,
                    recipientType: 'user',
                    title: 'Payment Successful',
                    message: `Your payment of ₹${payment.totalAmount} has been received`,
                    type: 'PAYMENT'
                });

                await Notification.create({
                    recipientId: payment.doctorId,
                    recipientType: 'doctor',
                    title: 'Payment Received',
                    message: `You earned ₹${payment.doctorAmount} from a consultation`,
                    type: 'PAYMENT'
                });
            }
        });

        // Webhook idempotency check
        Payment.pre('save', async function (next) {
            if (this.webhookEventId) {
                const existingPayment = await Payment.findOne({ webhookEventId: this.webhookEventId });
                if (existingPayment) {
                    return next(new Error('Duplicate webhook event'));
                }
            }
            next();
        });

        this.hooks.Payment = { setupPaymentHooks: true };
    }

    // ==================== REFUND HOOKS ====================
    setupRefundHooks() {
        const Refund = this.models.Refund;
        const Payment = this.models.Payment;
        const UserWallet = this.models.UserWallet;
        const Notification = this.models.Notification;

        // Auto-process refunds to wallet
        Refund.post('findByIdAndUpdate', async (refund) => {
            if (refund && refund.status === 'COMPLETED') {
                // Credit user wallet
                await UserWallet.findOneAndUpdate(
                    { userId: refund.userId },
                    {
                        $inc: { availableBalance: refund.amount },
                        $push: {
                            transactions: {
                                type: 'REFUND',
                                amount: refund.amount,
                                description: `Refund for appointment cancellation`,
                                referenceId: refund._id,
                                status: 'SUCCESS'
                            }
                        }
                    }
                );

                // Send notification
                await Notification.create({
                    recipientId: refund.userId,
                    recipientType: 'user',
                    title: 'Refund Processed',
                    message: `Refund of ₹${refund.amount} has been credited to your wallet`,
                    type: 'PAYMENT'
                });
            }
        });

        this.hooks.Refund = { setupRefundHooks: true };
    }

    // ==================== HEALTH HOOKS ====================
    setupHealthHooks() {
        const HealthReading = this.models.HealthReading;
        const HealthAnalysis = this.models.HealthAnalysis;
        const HealthPrediction = this.models.HealthPrediction;
        const Notification = this.models.Notification;

        // Trigger analysis on new health reading
        HealthReading.post('save', async (reading) => {
            // Check if reading is abnormal
            if (this.isAbnormalReading(reading)) {
                // Create alert
                await Notification.create({
                    recipientId: reading.userId,
                    recipientType: 'user',
                    title: 'Health Alert',
                    message: `Your ${reading.readingType} reading is abnormal. Please consult a doctor.`,
                    type: 'HEALTH',
                    metadata: { reading: reading._id }
                });
            }

            // Trigger health analysis if we have enough data
            const recentReadings = await HealthReading.find({
                userId: reading.userId,
                readingType: reading.readingType,
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }).limit(10);

            if (recentReadings.length >= 5) {
                await this.performHealthAnalysis(reading.userId);
            }
        });

        this.hooks.Health = { setupHealthHooks: true };
    }

    // ==================== BLOOD BANK HOOKS ====================
    setupBloodBankHooks() {
        const BloodRequest = this.models.BloodRequest;
        const BloodDonor = this.models.BloodDonor;
        const Notification = this.models.Notification;

        // Auto-match blood requests with donors
        BloodRequest.post('save', async (request) => {
            const eligibleDonors = await BloodDonor.find({
                bloodGroup: request.bloodGroup,
                isEligible: true,
                available: true
            }).limit(5);

            if (eligibleDonors.length > 0) {
                // Notify eligible donors
                for (const donor of eligibleDonors) {
                    await Notification.create({
                        recipientId: donor.userId,
                        recipientType: 'user',
                        title: 'Blood Donation Request',
                        message: `${request.unitsRequired} units of ${request.bloodGroup} blood needed at ${request.hospitalName}`,
                        type: 'BLOOD',
                        metadata: { requestId: request._id }
                    });
                }
            }
        });

        this.hooks.BloodBank = { setupBloodBankHooks: true };
    }

    // ==================== CROSS-TABLE QUERIES ====================

    /**
     * Get complete appointment details with all related data
     */
    async getAppointmentWithRelations(appointmentId) {
        return await this.models.Appointment.findById(appointmentId)
            .populate('userId', 'name email phone')
            .populate('doctorId', 'name specialization consultationFee')
            .populate('paymentId')
            .populate('ratingId');
    }

    /**
     * Get doctor profile with all related data
     */
    async getDoctorWithRelations(doctorId) {
        const doctor = await this.models.Doctor.findById(doctorId);
        const availability = await this.models.DoctorAvailability.findOne({ doctorId });
        const bankDetails = await this.models.DoctorBankDetails.findOne({ doctorId });
        const earnings = await this.models.Settlement.find({ doctorId }).sort({ createdAt: -1 }).limit(1);

        return {
            doctor,
            availability,
            bankDetails,
            lastSettlement: earnings[0] || null
        };
    }

    /**
     * Get user complete profile
     */
    async getUserWithRelations(userId) {
        const user = await this.models.User.findById(userId);
        const wallet = await this.models.UserWallet.findOne({ userId });
        const appointments = await this.models.Appointment.find({ userId }).sort({ createdAt: -1 }).limit(10);
        const health = await this.models.HealthReading.find({ userId }).sort({ createdAt: -1 }).limit(5);
        const bloodDonor = await this.models.BloodDonor.findOne({ userId });

        return {
            user,
            wallet,
            recentAppointments: appointments,
            healthReadings: health,
            bloodDonorStatus: bloodDonor
        };
    }

    /**
     * Calculate doctor's revenue for a period
     */
    async getDoctorRevenue(doctorId, startDate, endDate) {
        const payments = await this.models.Payment.find({
            doctorId,
            paymentStatus: 'CAPTURED',
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const revenue = {
            totalGross: 0,
            totalCommission: 0,
            totalPayout: 0,
            appointmentCount: payments.length
        };

        payments.forEach(p => {
            revenue.totalGross += p.totalAmount || 0;
            revenue.totalCommission += p.commission || 0;
            revenue.totalPayout += p.doctorAmount || 0;
        });

        return revenue;
    }

    /**
     * Get appointment slot availability for a doctor
     */
    async getAvailableSlots(doctorId, date, duration = 30) {
        const availability = await this.models.DoctorAvailability.findOne({ doctorId });
        if (!availability) throw new Error('Doctor availability not configured');

        const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];
        const daySchedule = availability.weeklyAvailability.find(s => s.day === dayOfWeek);

        if (!daySchedule || daySchedule.isOff) return [];

        // Check special dates
        const specialDate = availability.specialDates.find(
            s => s.date.toDateString() === date.toDateString()
        );

        if (specialDate?.isOff) return [];

        // Get booked appointments for the day
        const bookedAppointments = await this.models.Appointment.find({
            doctorId,
            appointmentDate: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lte: new Date(date.setHours(23, 59, 59, 999))
            },
            status: { $in: ['CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'] }
        });

        // Generate available slots
        return this.generateSlots(daySchedule, bookedAppointments, duration);
    }

    /**
     * Process settlement for a doctor
     */
    async processSettlement(doctorId, startDate, endDate, adminId) {
        const payments = await this.models.Payment.find({
            doctorId,
            paymentStatus: 'CAPTURED',
            settlementStatus: 'PENDING',
            createdAt: { $gte: startDate, $lte: endDate }
        });

        if (payments.length === 0) {
            throw new Error('No pending payments for settlement');
        }

        const bankDetails = await this.models.DoctorBankDetails.findOne({ doctorId });
        if (!bankDetails?.isVerified) {
            throw new Error('Bank details not verified');
        }

        let totalAmount = 0;
        payments.forEach(p => {
            totalAmount += p.doctorAmount || 0;
        });

        const settlement = await this.models.Settlement.create({
            doctorId,
            settlementPeriod: { startDate, endDate },
            totalAmount,
            grossEarnings: totalAmount,
            netAmount: totalAmount,
            bankDetails: {
                accountHolderName: bankDetails.accountHolderName,
                accountNumber: bankDetails.accountNumber,
                ifscCode: bankDetails.ifscCode,
                bankName: bankDetails.bankName
            },
            paymentIds: payments.map(p => p._id),
            appointmentCount: payments.length,
            approvedBy: adminId,
            approvedAt: new Date(),
            status: 'PENDING'
        });

        // Mark payments as settled
        await this.models.Payment.updateMany(
            { _id: { $in: payments.map(p => p._id) } },
            { settlementStatus: 'SETTLED', settlementId: settlement._id }
        );

        // Log audit
        await this.models.AuditLog.create({
            module: 'FINANCE',
            action: 'SETTLEMENT_CREATED',
            performedBy: adminId,
            targetId: settlement._id,
            targetModel: 'Settlement',
            afterValue: { settlementId: settlement._id }
        });

        return settlement;
    }

    // ==================== SECURITY & VALIDATION ====================

    /**
     * Validate doctor verification before allowing appointments
     */
    async validateDoctorVerification(doctorId) {
        const doctor = await this.models.Doctor.findById(doctorId);
        if (!doctor) throw new Error('Doctor not found');
        if (doctor.verificationStatus !== 'VERIFIED') {
            throw new Error(`Doctor not verified. Status: ${doctor.verificationStatus}`);
        }
        if (!doctor.isActive) throw new Error('Doctor account is inactive');
        return true;
    }

    /**
     * Validate user wallet and apply coupon
     */
    async validatePaymentAndApplyCoupon(userId, couponCode, appointmentFee) {
        const user = await this.models.User.findById(userId);
        if (!user) throw new Error('User not found');

        let discount = 0;
        if (couponCode) {
            const coupon = await this.models.Coupon.findOne({ code: couponCode });
            if (!coupon) throw new Error('Invalid coupon code');
            if (coupon.expiryDate < new Date()) throw new Error('Coupon expired');
            if (coupon.usageCount >= coupon.maxUsage) throw new Error('Coupon usage limit exceeded');

            discount = coupon.discountType === 'PERCENT' 
                ? (appointmentFee * coupon.discountValue) / 100 
                : coupon.discountValue;
        }

        return {
            valid: true,
            finalAmount: appointmentFee - discount,
            discount
        };
    }

    /**
     * Log security audit
     */
    async logSecurityAudit(adminId, action, targetId, ipAddress, details) {
        return await this.models.AuditLog.create({
            module: 'SECURITY',
            action,
            performedBy: adminId,
            targetId,
            ipAddress,
            metadata: JSON.stringify(details)
        });
    }

    /**
     * Check for duplicate refund (idempotency)
     */
    async checkRefundIdempotency(idempotencyKey) {
        return await this.models.Refund.findOne({ idempotencyKey });
    }

    // ==================== HELPER METHODS ====================

    isAbnormalReading(reading) {
        // Implement abnormal reading detection logic
        const thresholds = {
            'blood_pressure': { systolic: 140, diastolic: 90 },
            'heart_rate': { max: 100, min: 60 },
            'glucose': { max: 200, min: 70 }
        };
        return false; // Placeholder
    }

    async performHealthAnalysis(userId) {
        // Implement health analysis logic
    }

    generateSlots(daySchedule, bookedAppointments, duration) {
        // Implement slot generation logic
        return [];
    }
}

module.exports = DatabaseEcosystemManager;
