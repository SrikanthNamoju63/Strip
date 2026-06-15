const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { calculateAge } = require('../../helpers');

exports.registerDoctor = async (req, res) => {
    // console.log('Register Doctor Request Body:', JSON.stringify(req.body, null, 2));
    const {
        firstName, lastName, email, password, personalPhone, hospitalPhone, specialization, experience,
        education, educationDetails, consultationFee, clinicAddress, bio,
        registrationNumber, medicalCouncil, identityProof, practiceType, consultationModes, weeklyAvailability,
        gender
    } = req.body;

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

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

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

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, doctorId: doctor.doctorId });
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
    const { email, username, password } = req.body;
    const loginKey = username || email;

    try {
        console.log('[DEBUG LOGIN] Attempt:', { loginKey, passwordReceived: password });
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

        console.log('[DEBUG LOGIN] DB Lookup Result:', { 
            found: !!targetUser, 
            email: targetUser ? targetUser.email : null,
            role
        });

        const isMatch = await bcrypt.compare(password, targetUser.passwordHash);
        console.log('[DEBUG LOGIN] Password Match Result:', { isMatch });
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
            role,
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

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, userNumber: user.userNumber });
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

const https = require('https');

exports.getPincodeDetails = async (req, res) => {
    const { pincode } = req.params;
    
    if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ msg: 'Pincode must be exactly 6 digits' });
    }
    
    const options = {
        rejectUnauthorized: false
    };

    https.get(`https://api.postalpincode.in/pincode/${pincode}`, options, (apiRes) => {
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
