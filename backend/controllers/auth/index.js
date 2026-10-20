const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { calculateAge } = require('../../helpers');

const BCRYPT_ROUNDS = 12;
const accessTokenExpiry = process.env.JWT_EXPIRY || '8h';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const issueAccessToken = (user) => jwt.sign(
    { user },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: accessTokenExpiry }
);

exports.registerDoctor = async (req, res) => {
    // console.log('Register Doctor Request Body:', JSON.stringify(req.body, null, 2));
    const {
        firstName, lastName, password, personalPhone, hospitalPhone, specialization, experience,
        education, educationDetails, consultationFee, clinicAddress, bio,
        registrationNumber, medicalCouncil, identityProof, practiceType, consultationModes, weeklyAvailability,
        gender
    } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        let doctor = await Doctor.findOne({ email });
        if (doctor) {
            return res.status(400).json({ msg: 'Doctor already exists' });
        }

        // Normalize / format phone numbers with +91 prefix
        let formattedPersonalPhone = personalPhone;
        if (formattedPersonalPhone) {
            const digits = formattedPersonalPhone.replace(/\D/g, '').slice(-10);
            formattedPersonalPhone = `+91${digits}`;
        } else {
            return res.status(400).json({ msg: 'Personal phone number is required' });
        }

        let formattedHospitalPhone = hospitalPhone;
        if (formattedHospitalPhone) {
            const digits = formattedHospitalPhone.replace(/\D/g, '').slice(-10);
            formattedHospitalPhone = `+91${digits}`;
        }

        // Check phone uniqueness
        doctor = await Doctor.findOne({ personalPhone: formattedPersonalPhone });
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

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Generate dynamic unique doctorId: DR + YY (2-digit registration year) + RRR (3-digit random number)
        let isUnique = false;
        let doctorId = '';
        const currentYear = new Date().getFullYear().toString().slice(-2); // e.g. "26"

        while (!isUnique) {
            const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            doctorId = `DR${currentYear}${rand}`;
            const existingDoc = await Doctor.findOne({ doctorId });
            if (!existingDoc) {
                isUnique = true;
            }
        }

        const combinedName = `Dr. ${(firstName || '').trim()} ${(lastName || '').trim()}`.trim();

        doctor = new Doctor({
            name: combinedName,
            firstName: firstName,
            lastName: lastName,
            doctorId: doctorId,
            email,
            personalPhone: formattedPersonalPhone,
            hospitalPhone: formattedHospitalPhone,
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
            gender,
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

        const token = issueAccessToken(payload.user);
        return res.status(201).json({ token, doctorId: doctor.doctorId });
    } catch (err) {
        console.error(err.message);
        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../error_logs.txt');
            const logData = `\n[${new Date().toISOString()}] Register Doctor Error: ${err.message}\n`;
            fs.appendFileSync(logPath, logData);
        } catch (fsErr) {
            console.error('Failed to write error log:', fsErr);
        }
        res.status(500).json({ msg: 'Unable to create doctor account' });
    }
};

exports.loginDoctor = async (req, res) => {
    const { email, username, password } = req.body;
    const loginKey = username || email;

    try {
        if (!loginKey) {
            return res.status(400).json({ msg: 'Email or Doctor ID is required' });
        }

        const safeKey = loginKey.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const keyRegex = new RegExp(`^${safeKey}$`, 'i');

        let doctor = await Doctor.findOne({
            $or: [
                { email: keyRegex },
                { doctorId: keyRegex }
            ]
        });
        
        let targetUser = doctor;
        let role = 'DOCTOR';
        let doctorIdContext = null;

        if (!doctor) {
            const Staff = require('../../models/Staff');
            const staff = await Staff.findOne({
                $or: [
                    { email: keyRegex },
                    { staffId: keyRegex }
                ]
            });
            if (staff) {
                if (!staff.isActive) {
                    return res.status(403).json({ msg: 'Staff account is deactivated' });
                }
                targetUser = staff;
                role = staff.role; // RECEPTIONIST or NURSE
                doctorIdContext = staff.doctorId;
            } else {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }
        }

        const isMatch = await bcrypt.compare(password, targetUser.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: targetUser.id,
                role,
                isDoctorModel: true,
                ...(doctorIdContext && { doctorId: doctorIdContext })
            }
        };

        return res.json({ token: issueAccessToken(payload.user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to sign in' });
    }
};

exports.registerUser = async (req, res) => {
    const { name, phone, password } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Generate dynamic unique userNumber: U + YY (2-digit registration year) + RRR (3-digit random number)
        let isUnique = false;
        let userNumber = '';
        const currentYear = new Date().getFullYear().toString().slice(-2); // e.g. "26"

        while (!isUnique) {
            const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            userNumber = `U${currentYear}${rand}`;
            const existingUser = await User.findOne({ userNumber });
            if (!existingUser) {
                isUnique = true;
            }
        }

        user = new User({
            name,
            userNumber,
            email,
            phone,
            passwordHash,
            // Public registration can only create a patient account. Staff and
            // administrators are provisioned through protected workflows.
            role: 'USER',
            dob: req.body.dob,
            age: req.body.dob ? calculateAge(req.body.dob) : undefined,
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

        return res.status(201).json({ token: issueAccessToken(payload.user), userNumber: user.userNumber });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to create account' });
    }
};

exports.loginUser = async (req, res) => {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    try {
        if (!email) {
            return res.status(400).json({ msg: 'Email or User ID is required' });
        }

        const safeKey = email.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const keyRegex = new RegExp(`^${safeKey}$`, 'i');

        let user = await User.findOne({
            $or: [
                { email: keyRegex },
                { userNumber: keyRegex }
            ]
        });

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

        return res.json({ token: issueAccessToken(payload.user) });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to sign in' });
    }
};

exports.forgotPassword = async (req, res) => {
    let { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        email = normalizeEmail(email);
        const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');

        let user = await User.findOne({ email: emailRegex });
        if (!user) {
            user = await Doctor.findOne({ email: emailRegex });
        }

        // Always return the same response to prevent account enumeration. A
        // real reset service can send the link only when an account was found.
        // const resetToken = crypto.randomBytes(20).toString('hex');
        // TODO: Send email

        res.json({ msg: 'If an account exists, password-reset instructions will be sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

const https = require('https');

exports.getPincodeDetails = async (req, res) => {
    const { pincode } = req.params;
    
    if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ msg: 'Pincode must be exactly 6 digits' });
    }
    
    https.get(`https://api.postalpincode.in/pincode/${pincode}`, (apiRes) => {
        let data = '';
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apiRes.on('end', () => {
            try {
                const parsedData = JSON.parse(data);
                res.json(parsedData);
            } catch (err) {
                console.error('Pincode response parse error', err);
                res.status(500).json({ msg: 'Failed to parse response' });
            }
        });
    }).on('error', (err) => {
        console.error('Pincode fetch error', err);
        res.status(500).json({ msg: 'Failed to fetch pincode details' });
    });
};
