const User = require('../../models/User');
const Appointment = require('../../models/Appointment');
const MedicineReminder = require('../../models/MedicineReminder');
const HealthAnalysis = require('../../models/HealthAnalysis');
const Refund = require('../../models/Refund');
const Payment = require('../../models/Payment');
const HealthReading = require('../../models/HealthReading');
const MedicalReport = require('../../models/MedicalReport');

// @desc    Get current user profile
// @route   GET api/users/me
// @access  Private
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT api/users/me
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        console.log('[UserController] updateUserProfile body:', req.body);
        const { name, phone, age, dob, height, weight, gender, bloodGroup, address, alcoholic, smoking } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (phone && phone !== user.phone) {
            const existingUser = await User.findOne({ phone, _id: { $ne: req.user.id } });
            if (existingUser) {
                console.log('[UserController] Phone already in use:', phone);
                return res.status(400).json({ msg: 'Phone number already in use by another user' });
            }
            user.phone = phone;
        }
        if (age !== undefined) user.age = age;
        if (dob) {
            user.dob = new Date(dob);
            const { calculateAge } = require('../../helpers');
            user.age = calculateAge(dob);
        }
        if (height !== undefined) user.height = height;
        if (weight !== undefined) user.weight = weight;
        if (gender !== undefined) user.gender = gender;
        if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
        if (alcoholic !== undefined) user.alcoholic = alcoholic;
        if (smoking !== undefined) user.smoking = smoking;
        if (address) user.address = { ...user.address, ...address };

        await user.save();
        console.log('[UserController] Updated user profile successfully:', user._id);
        res.json(user);
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Upload profile image
// @route   POST api/users/me/avatar
// @access  Private
exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        let user;
        let isDoctor = false;

        // Check if the requester is a Doctor
        if (req.user.role === 'DOCTOR' || req.user.isDoctorModel) {
            const Doctor = require('../../models/Doctor'); // Lazy load or require at top
            user = await Doctor.findById(req.user.id);
            isDoctor = true;
        } else {
            user = await User.findById(req.user.id);
        }

        if (!user) return res.status(404).json({ msg: 'User/Doctor not found' });

        // Normalize path (remove leading slash)
        const normalizedPath = `uploads/${req.file.filename}`;

        if (isDoctor) {
            user.doctorPhoto = normalizedPath;
            // Also update query-opt field if needed, but doctorPhoto is the main one
            // user.profileImage = normalizedPath; // If Doctor model has profileImage? No.
        } else {
            user.profileImage = normalizedPath;
        }

        await user.save();

        res.json(user);
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get user's appointments
// @route   GET api/users/appointments
// @access  Private
exports.getMyAppointments = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        let query = { userId: req.user.id };
        if (status) query.status = status;

        const appointments = await Appointment.find(query)
            .populate('doctorId', ['name', 'specialization', 'profileImage', 'consultationFee', 'clinicAddress'])
            .sort({ appointmentDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Appointment.countDocuments(query);

        res.json({
            appointments,
            pagination: { currentPage: page, totalPages: Math.ceil(total / limit), total }
        });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get appointment details with consultation notes and prescriptions
// @route   GET api/users/appointments/:appointmentId
// @access  Private
exports.getAppointmentDetails = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.appointmentId)
            .populate('doctorId', ['name', 'specialization', 'profileImage', 'bio', 'consultationFee'])
            .populate('paymentId');

        if (!appointment) return res.status(404).json({ msg: 'Appointment not found' });

        // Verify ownership
        if (appointment.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        res.json(appointment);
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get user's prescriptions
// @route   GET api/users/prescriptions
// @access  Private
exports.getMyPrescriptions = async (req, res) => {
    try {
        // Get completed appointments with prescriptions
        const appointments = await Appointment.find({
            userId: req.user.id,
            status: 'COMPLETED',
            prescriptions: { $exists: true, $ne: [] }
        })
            .populate('doctorId', ['name', 'specialization', 'profileImage'])
            .sort({ appointmentDate: -1 });

        const prescriptions = appointments.map(appt => ({
            appointmentId: appt._id,
            doctorName: appt.doctorId.name,
            doctorSpecialization: appt.doctorId.specialization,
            doctorImage: appt.doctorId.profileImage,
            appointmentDate: appt.appointmentDate,
            diseaseKeyword: appt.diseaseKeyword,
            prescriptions: appt.prescriptions
        }));

        res.json({ prescriptions });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get medicine reminders
// @route   GET api/users/medicine-reminders
// @access  Private
exports.getMedicineReminders = async (req, res) => {
    try {
        const reminders = await MedicineReminder.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({ reminders });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Add medicine reminder
// @route   POST api/users/medicine-reminders
// @access  Private
exports.addMedicineReminder = async (req, res) => {
    try {
        const { medicineName, dosage, frequency, time, duration, notes, appointmentId } = req.body;

        const reminder = new MedicineReminder({
            userId: req.user.id,
            medicineName,
            dosage,
            frequency,
            time,
            duration,
            notes,
            appointmentId,
            isActive: true
        });

        await reminder.save();
        res.json({ msg: 'Medicine reminder added', reminder });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update medicine reminder
// @route   PUT api/users/medicine-reminders/:reminderId
// @access  Private
exports.updateMedicineReminder = async (req, res) => {
    try {
        let reminder = await MedicineReminder.findById(req.params.reminderId);

        if (!reminder) return res.status(404).json({ msg: 'Reminder not found' });
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { medicineName, dosage, frequency, time, duration, notes, isActive } = req.body;

        if (medicineName) reminder.medicineName = medicineName;
        if (dosage) reminder.dosage = dosage;
        if (frequency) reminder.frequency = frequency;
        if (time) reminder.time = time;
        if (duration) reminder.duration = duration;
        if (notes) reminder.notes = notes;
        if (isActive !== undefined) reminder.isActive = isActive;

        await reminder.save();
        res.json({ msg: 'Reminder updated', reminder });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete medicine reminder
// @route   DELETE api/users/medicine-reminders/:reminderId
// @access  Private
exports.deleteMedicineReminder = async (req, res) => {
    try {
        const reminder = await MedicineReminder.findById(req.params.reminderId);

        if (!reminder) return res.status(404).json({ msg: 'Reminder not found' });
        if (reminder.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        await reminder.deleteOne();
        res.json({ msg: 'Reminder deleted' });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get health analyses assigned to user
// @route   GET api/users/health-analysis
// @access  Private
exports.getHealthAnalyses = async (req, res) => {
    try {
        const analyses = await HealthAnalysis.find({ userId: req.user.id })
            .populate('doctorId', ['name', 'specialization', 'profileImage'])
            .sort({ createdAt: -1 });

        res.json({ analyses });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get refound history
// @route   GET api/users/refunds
// @access  Private
exports.getMyRefunds = async (req, res) => {
    try {
        const refunds = await Refund.find({ userId: req.user.id })
            .populate('appointmentId', ['diseaseKeyword', 'appointmentDate', 'fees'])
            .sort({ createdAt: -1 });

        res.json({ refunds });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get payment history
// @route   GET api/users/payments
// @access  Private
exports.getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id })
            .populate('appointmentId', ['diseaseKeyword', 'appointmentDate', 'fees'])
            .sort({ createdAt: -1 });

        res.json({ payments });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get emergency contacts
// @route   GET api/users/emergency-contacts
// @access  Private
exports.getEmergencyContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('emergencyContacts');
        res.json({ emergencyContacts: user?.emergencyContacts || [] });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Add emergency contact
// @route   POST api/users/emergency-contacts
// @access  Private
exports.addEmergencyContact = async (req, res) => {
    try {
        const { name, relationship, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ msg: 'Name and phone are required' });
        }

        const user = await User.findById(req.user.id);

        if (!user.emergencyContacts) user.emergencyContacts = [];

        user.emergencyContacts.push({ name, relationship, phone });
        await user.save();

        res.json({ msg: 'Emergency contact added', emergencyContacts: user.emergencyContacts });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Update emergency contact
// @route   PUT api/users/emergency-contacts/:contactId
// @access  Private
exports.updateEmergencyContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { name, relationship, phone } = req.body;

        const user = await User.findById(req.user.id);
        const contact = user.emergencyContacts?.id(contactId);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        if (name) contact.name = name;
        if (relationship) contact.relationship = relationship;
        if (phone) contact.phone = phone;

        await user.save();
        res.json({ msg: 'Contact updated', emergencyContacts: user.emergencyContacts });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Delete emergency contact
// @route   DELETE api/users/emergency-contacts/:contactId
// @access  Private
exports.deleteEmergencyContact = async (req, res) => {
    try {
        const { contactId } = req.params;

        const user = await User.findById(req.user.id);
        const contact = user.emergencyContacts?.id(contactId);

        if (!contact) return res.status(404).json({ msg: 'Contact not found' });

        contact.deleteOne();
        await user.save();

        res.json({ msg: 'Contact deleted', emergencyContacts: user.emergencyContacts });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Upload medical report
// @route   POST api/users/medical-reports
// @access  Private
exports.uploadMedicalReport = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const { reportType, testName, date, notes } = req.body;

        const report = new MedicalReport({
            userId: req.user.id,
            reportType,
            testName,
            date: date ? new Date(date) : new Date(),
            filePath: `/uploads/reports/${req.file.filename}`,
            notes
        });

        await report.save();
        res.json({ msg: 'Report uploaded', report });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get medical reports
// @route   GET api/users/medical-reports
// @access  Private
exports.getMedicalReports = async (req, res) => {
    try {
        const reports = await MedicalReport.find({ userId: req.user.id })
            .sort({ date: -1 });

        res.json({ reports });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get health trends (last 30 days)
// @route   GET api/users/health-trends
// @access  Private
exports.getHealthTrends = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const trends = await HealthReading.find({
            userId: req.user.id,
            readingDate: { $gte: thirtyDaysAgo }
        })
            .sort({ readingDate: 1 })
            .group({
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$readingDate' } },
                avgHeartRate: { $avg: '$heartRate' },
                avgSteps: { $avg: '$steps' },
                avgBloodOxygen: { $avg: '$bloodOxygen' },
                avgBloodPressure: { $avg: '$bloodPressure' }
            })
            .sort({ _id: 1 });

        res.json({ trends });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get user health summary
// @route   GET api/users/health-summary
// @access  Private
exports.getUserHealthSummary = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const lastReadings = await HealthReading.findOne({ userId: req.user.id }).sort({ readingDate: -1 });
        const completedAppointments = await Appointment.countDocuments({
            userId: req.user.id,
            status: 'COMPLETED'
        });

        const summary = {
            name: user.name,
            age: user.age,
            gender: user.gender,
            bloodGroup: user.bloodGroup,
            height: user.height,
            weight: user.weight,
            bmi: user.height && user.weight ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) : null,
            lastHeartRate: lastReadings?.heartRate,
            lastSteps: lastReadings?.steps,
            lastBloodOxygen: lastReadings?.bloodOxygen,
            lastBloodPressure: lastReadings?.bloodPressure,
            completedAppointments,
            healthStatus: 'Good' // Calculate based on readings and appointments
        };

        res.json(summary);
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Get appointment reminders
// @route   GET api/users/appointment-reminders
// @access  Private
exports.getAppointmentReminders = async (req, res) => {
    try {
        const reminders = await Appointment.find({
            userId: req.user.id,
            appointmentDate: { $gte: new Date() },
            reminderSent: false
        })
            .populate('doctorId', ['name', 'specialization', 'profileImage'])
            .sort({ appointmentDate: 1 })
            .limit(5);

        res.json({ reminders });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

// @desc    Mark reminder as seen
// @route   PUT api/users/appointment-reminders/:reminderId/seen
// @access  Private
exports.markReminderSeen = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.reminderId);

        if (!appointment) return res.status(404).json({ msg: 'Reminder not found' });
        if (appointment.userId.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        appointment.reminderSent = true;
        await appointment.save();

        res.json({ msg: 'Reminder marked as seen' });
    } catch (err) {
        console.error('[UserController] Error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
