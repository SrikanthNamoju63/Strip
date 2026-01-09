const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Appointment = require('../models/Appointment');
const MedicalHistory = require('../models/MedicalHistory');
const UserMedication = require('../models/UserMedication');
const UserDevice = require('../models/UserDevice');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/profiles/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const userId = req.params.userId;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `user-${userId}-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File too large. Maximum size is 5MB.' });
    } else if (err) {
        return res.status(400).json({ success: false, error: err.message });
    }
    next();
};

// Get complete user profile
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    console.log(`Fetching profile for user ID: ${userId}`);

    try {
        const user = await User.findOne({ user_id: userId });
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        const userProfile = await UserProfile.findOne({ user_id: userId }) || {};

        // Fetch related data in parallel
        const [appointments, healthHistory, allergies, medications] = await Promise.all([
            Appointment.find({ user_id: userId }).populate('doctor_id', 'full_name specialization hospital_name').sort({ appointment_date_time: -1 }).limit(10),
            MedicalHistory.find({ user_id: userId }).sort({ recorded_at: -1 }).limit(10),
            MedicalHistory.find({ user_id: userId, condition_type: 'allergy', is_active: true }).limit(10),
            UserMedication.find({ user_id: userId, is_active: true }).sort({ start_date: -1 }).limit(10)
        ]);

        // Format appointments to match legacy structure
        const formattedAppointments = appointments.map(app => {
            const doc = app.doctor_id || {};
            return {
                appointment_id: app.appointment_id,
                doctor_name: doc.full_name || 'Unknown',
                specialization: doc.specialization || 'General',
                hospital_name: doc.hospital_name,
                appointment_date: app.appointment_date_time,
                status: app.status,
                amount: app.amount_paid || app.consultation_fee
            };
        });

        const completeProfile = {
            user_id: user.user_id,
            display_id: user.display_id,
            name: user.full_name,
            age: calculateAge(user.date_of_birth),
            dob: user.date_of_birth,
            gender: user.gender,
            email: user.email,
            phone: user.phone || userProfile.phone,
            profile_image: user.profile_image,
            is_active: user.is_active,
            // Profile fields
            bio: userProfile.bio,
            blood_group: userProfile.blood_group,
            height_cm: userProfile.height_cm,
            weight_kg: userProfile.weight_kg,
            address_line1: userProfile.address_line1,
            city: userProfile.city,
            state: userProfile.state,
            pincode: userProfile.pincode,
            emergency_contact_name: userProfile.emergency_contact_name,
            emergency_contact_phone: userProfile.emergency_contact_phone,
            // Lists
            appointments: formattedAppointments,
            health_history: healthHistory,
            allergies: allergies,
            medications: medications
        };

        res.json({
            success: true,
            data: completeProfile,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Profile fetch error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Helper to calculate age
function calculateAge(dob) {
    if (!dob) return null;
    const diff_ms = Date.now() - new Date(dob).getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
}

// Simple Profile
router.get('/simple/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ user_id: req.params.userId });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        res.json({
            success: true,
            user: {
                user_id: user.user_id,
                display_id: user.display_id,
                name: user.full_name,
                email: user.email,
                profile_image: user.profile_image
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update Profile
router.put('/:userId', upload.single('profile_image'), handleMulterError, async (req, res) => {
    const userId = req.params.userId;
    const { name, dob, gender, phone, bio, blood_group, city, state } = req.body;

    try {
        let updateData = {
            full_name: name,
            date_of_birth: dob,
            gender: gender,
            phone: phone
        };

        if (req.file) {
            updateData.profile_image = req.file.filename;
            // Optionally delete old image here
        }

        await User.findOneAndUpdate({ user_id: userId }, updateData, { new: true });

        await UserProfile.findOneAndUpdate(
            { user_id: userId },
            {
                phone, bio, blood_group, city, state
            },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            profile_image: updateData.profile_image
        });

    } catch (error) {
        console.error('Profile update error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload Image
router.post('/:userId/upload-image', upload.single('profile_image'), handleMulterError, async (req, res) => {
    const userId = req.params.userId;
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    try {
        await User.findOneAndUpdate(
            { user_id: userId },
            { profile_image: req.file.filename }
        );

        res.json({
            success: true,
            message: 'Profile image updated',
            profile_image: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get User Appointments (Separate)
router.get('/:userId/appointments', async (req, res) => {
    const userId = req.params.userId;
    try {
        const appointments = await Appointment.find({ user_id: userId })
            .sort({ appointment_date_time: -1 })
            .limit(20);

        // Fetch Doctor details manually because population across databases (User vs DoctorDashboard) is erratic
        // We need to fetch specific doctor IDs from the 'Doctor' model (which is bound to DoctorDashboard DB)

        // 1. Get unique doctor IDs
        const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];

        // 2. Fetch doctors from the Doctor model (DoctorDashboard connection)
        // Note: The 'Doctor' model imported at top is from models/Doctor.js which exports the Multi-DB model
        const DoctorModel = require('../models/Doctor');
        const doctors = await DoctorModel.find({ _id: { $in: doctorIds } });

        // 3. Create a map for easy lookup
        const doctorMap = {};
        doctors.forEach(d => {
            doctorMap[d._id.toString()] = d;
        });

        // 4. Map appointments
        const formattedAppointments = appointments.map(app => {
            const doc = doctorMap[app.doctor_id] || {}; // Lookup from map
            const hospital = doc.hospital_details || {};

            return {
                appointment_id: app.appointment_id,
                doctor_name: doc.full_name || 'Unknown Doctor',
                specialization: doc.specialization || 'General',
                hospital_name: hospital.name || 'Unknown Hospital', // Use nested hospital name
                appointment_date: app.appointment_date_time,
                status: app.status,
                symptoms: app.symptoms,
                token_number: app.token_number,
                amount: app.amount_paid || app.consultation_fee
            };
        });

        res.json({
            success: true,
            appointments: formattedAppointments,
            count: formattedAppointments.length
        });

    } catch (error) {
        console.error('Fetch appointments error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
