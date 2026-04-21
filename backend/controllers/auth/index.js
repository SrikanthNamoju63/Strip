const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerDoctor = async (req, res) => {
    // console.log('Register Doctor Request Body:', JSON.stringify(req.body, null, 2));
    const {
        name, email, password, personalPhone, hospitalPhone, specialization, experience,
        education, educationDetails, consultationFee, clinicAddress, bio,
        registrationNumber, medicalCouncil, identityProof, practiceType, consultationModes, weeklyAvailability
    } = req.body;

    try {
        let doctor = await Doctor.findOne({ email });
        if (doctor) {
            return res.status(400).json({ msg: 'Doctor already exists' });
        }

        // Check phone uniqueness
        doctor = await Doctor.findOne({ personalPhone });
        if (doctor) {
            return res.status(400).json({ msg: 'Phone number already registered' });
        }

        // Check registration number uniqueness
        if (registrationNumber) {
            const existingReg = await Doctor.findOne({ registrationNumber });
            if (existingReg) {
                return res.status(400).json({ msg: 'Registration number already registered' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        doctor = new Doctor({
            name,
            email,
            personalPhone,
            hospitalPhone,
            passwordHash,
            role: 'DOCTOR',
            specialization,
            experience,
            education,
            educationDetails,
            consultationFee,
            clinicAddress,
            bio,
            doctorPhoto: req.body.doctorPhoto,
            // New Fields
            registrationNumber,
            medicalCouncil,
            identityProof,
            practiceType,
            consultationModes,
            weeklyAvailability
        });

        await doctor.save();

        const payload = {
            user: {
                id: doctor.id,
                role: 'DOCTOR',
                isDoctorModel: true
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../error_logs.txt');
            const logData = `\n\n[${new Date().toISOString()}] Register Doctor Error:
Error: ${err.message}
Stack: ${err.stack}
Body: ${JSON.stringify(req.body, null, 2)}
------------------------------------------------`;
            fs.appendFileSync(logPath, logData);
        } catch (fsErr) {
            console.error('Failed to write error log:', fsErr);
        }
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.loginDoctor = async (req, res) => {
    const { email, password } = req.body;

    try {
        let doctor = await Doctor.findOne({ email });
        if (!doctor) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, doctor.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: doctor.id,
                role: 'DOCTOR',
                isDoctorModel: true
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.registerUser = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            phone,
            passwordHash,
            role,
            dob: req.body.dob,
            age: req.body.dob ? new Date().getFullYear() - new Date(req.body.dob).getFullYear() : undefined,
            // Doctor Fields
            specialization: req.body.specialization,
            experience: req.body.experience,
            education: req.body.education,
            personalPhone: req.body.personalPhone,
            hospitalPhone: req.body.hospitalPhone,
            doctorPhoto: req.body.doctorPhoto,
            educationDetails: req.body.educationDetails, // Object
            clinicAddress: req.body.clinicAddress, // Object
            consultationFee: req.body.consultationFee,
            bio: req.body.bio
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

exports.forgotPassword = async (req, res) => {
    let { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        email = email.trim();
        const emailRegex = new RegExp(`^${email}$`, 'i');

        let user = await User.findOne({ email: emailRegex });
        if (!user) {
            user = await Doctor.findOne({ email: emailRegex });
        }

        if (!user) {
            // For security, usually we don't say if user exists, but for dev we can
            return res.status(404).json({ msg: 'User not found' });
        }
        // Mock email sending behavior
        // const resetToken = crypto.randomBytes(20).toString('hex');
        // TODO: Send email

        res.json({ msg: 'Password reset link sent to ' + email });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
