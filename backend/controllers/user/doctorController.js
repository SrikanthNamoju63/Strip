const bcrypt = require('bcrypt');
const Doctor = require('../../models/Doctor');
const Appointment = require('../../models/Appointment');
const auditService = require('../../services/misc/auditService');

// Never expose credentials, identity documents, bank/KYC fields, or internal
// moderation state in the public doctor directory.
const PUBLIC_DOCTOR_FIELDS = [
    'name', 'doctorId', 'doctorPhoto', 'specialization', 'experience',
    'education', 'bio', 'consultationFee', 'consultationModes', 'languages',
    'facilities', 'clinicAddress', 'weeklyAvailability', 'availableHours',
    'genderPreference', 'ratings', 'isVerified'
].join(' ');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Register a new doctor (or create doctor profile)
// @route   POST api/doctors
// @access  Public (or Private if linked to User auth)
exports.registerDoctor = async (req, res) => {
    const {
        firstName,
        lastName,
        name,
        password, // Changed from phone/etc to destructure properly
        phone,
        personalPhone,
        hospitalPhone,
        specialization,
        experience,
        hospitalName,
        consultationFee,
        registrationNumber,
        medicalCouncil,
        identityProof,
        practiceType,
        consultationModes,
        // Nested objects from frontend might come as separate fields or objects, 
        // looking at index.html submitForm(), it sends a structured JSON with:
        // clinicAddress: { ... }, educationDetails: { ... }
        clinicAddress,
        educationDetails,
        education, // degree
        doctorPhoto,
        department,
        bio,
        availableHours,
        gender
    } = req.body;
    const email = String(req.body.email || '').trim().toLowerCase();

    try {
        let doctor = await Doctor.findOne({ email });
        if (doctor) {
            return res.status(400).json({ msg: 'Doctor profile already exists with this email' });
        }

        // Check if registration number already exists
        let existingReg = await Doctor.findOne({ registrationNumber });
        if (existingReg) {
            return res.status(400).json({ msg: 'Doctor with this Medical Registration Number already exists' });
        }

        // Normalize / format phone numbers with +91 prefix
        const basePhone = personalPhone || phone;
        let formattedPersonalPhone = basePhone;
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
        const phoneExist = await Doctor.findOne({ personalPhone: formattedPersonalPhone });
        if (phoneExist) {
            return res.status(400).json({ msg: 'Phone number already registered' });
        }

        // Hash Password
        const passwordHash = await bcrypt.hash(password, 12);

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

        const combinedName = `Dr. ${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || name;

        doctor = new Doctor({
            name: combinedName,
            firstName: firstName,
            lastName: lastName,
            doctorId: doctorId,
            email,
            passwordHash,
            personalPhone: formattedPersonalPhone,
            hospitalPhone: formattedHospitalPhone,
            specialization,
            experience,
            hospitalName,
            consultationFee,

            // Critical New Fields
            registrationNumber,
            medicalCouncil,
            identityProof, // Base64 or URL
            practiceType,
            consultationModes,

            // Nested Data
            clinicAddress: clinicAddress || {},
            educationDetails: educationDetails || {},
            education, // e.g. MBBS

            doctorPhoto, // Base64

            // Defaults
            role: 'DOCTOR',
            verificationStatus: 'PENDING',
            isActive: false,
            isVerified: false,

            // Optional fields
            department,
            bio,
            availableHours,
            gender
        });

        await doctor.save();

        // Notify Admin
        const notificationService = require('../../services/notification');
        try {
            await notificationService.sendToAdmin(
                'New Doctor Registration',
                `Doctor ${combinedName} (${specialization}) has registered and is waiting for verification.\nReg No: ${registrationNumber}`,
                'DOCTOR_REGISTRATION'
            );
        } catch (notifyErr) {
            console.error('Notification failed:', notifyErr.message);
            // Don't fail registration if notification fails
        }

        const doctorObj = doctor.toObject();
        delete doctorObj.passwordHash;
        delete doctorObj.identityProof;
        delete doctorObj.documents;
        delete doctorObj.bankDetails;

        res.status(201).json(doctorObj);
    } catch (err) {
        console.error('Register Doctor Error:', err.message);
        res.status(500).send('Unable to create doctor profile');
    }
};

// @desc    Get all doctors (with filters)
// @route   GET api/doctors
// @access  Public / Admin
exports.getAllDoctors = async (req, res) => {
    try {
        const { sort } = req.query;
        // This endpoint is public. Admin filtering belongs to /api/admin, so a
        // caller cannot enumerate pending, rejected, or suspended doctors.
        const query = { verificationStatus: 'VERIFIED', isActive: true };

        // Sort logic
        let sortOption = { createdAt: -1 };
        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'status_changed') {
            sortOption = { statusChangedAt: -1 };
        } else if (sort === 'rating') {
            sortOption = { 'ratings.averageRating': -1 };
        }

        // If public access (no admin token), maybe restrict fields? 
        // For now transparency is fine, but typically filtering suspended ones for public.
        // Assuming this endpoint is used by Admin mostly or public search uses 'searchDoctors'

        const requestedLimit = Number.parseInt(req.query.limit, 10);
        const doctors = await Doctor.find(query)
            .select(PUBLIC_DOCTOR_FIELDS)
            .sort(sortOption)
            .limit(Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 100) : 50);

        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get doctor by ID
// @route   GET api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({
            _id: req.params.id,
            verificationStatus: 'VERIFIED',
            isActive: true
        }).select(PUBLIC_DOCTOR_FIELDS);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentPatientCount = await Appointment.countDocuments({
            doctorId: doctor._id,
            appointmentDate: { $gte: thirtyDaysAgo },
            status: { $in: ['COMPLETED', 'CONFIRMED', 'PAID', 'RESCHEDULED', 'CHECKED_IN'] }
        });

        const doctorObj = doctor.toObject();
        doctorObj.recentPatientCount = recentPatientCount;

        res.json(doctorObj);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Verify Doctor
// @route   POST api/doctors/:id/verify
// @access  Admin (Super/Verification)
exports.verifyDoctor = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;
        if (!adminId) return res.status(401).json({ msg: 'Unauthorized Action' });

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        const beforeSnapshot = { status: doctor.verificationStatus };

        // Update Status
        doctor.verificationStatus = 'VERIFIED';
        doctor.isVerified = true;
        doctor.isActive = true;
        doctor.verifiedBy = adminId;
        doctor.verifiedAt = Date.now();
        doctor.statusChangedAt = Date.now();
        doctor.rejectionReason = undefined; // Clear previous rejection
        doctor.reuploadRequested = false;

        // Add history
        doctor.verificationHistory.push({
            status: 'VERIFIED',
            changedBy: adminId,
            changedAt: Date.now(),
            reason: 'Documents approved'
        });

        await doctor.save();

        // Audit Log
        await auditService.logAction({
            module: 'DOCTOR',
            action: 'VERIFY',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            before: beforeSnapshot,
            after: { status: 'VERIFIED' },
            metadata: 'Doctor verified successfully'
        });

        // Notify Doctor (TODO)

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Reject Doctor
// @route   POST api/doctors/:id/reject
// @access  Admin (Super/Verification)
exports.rejectDoctor = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;

        const { reason } = req.body;
        if (!reason) return res.status(400).json({ msg: 'Rejection reason is required' });

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        const beforeSnapshot = { status: doctor.verificationStatus };

        doctor.verificationStatus = 'REJECTED';
        doctor.isVerified = false;
        doctor.rejectionReason = reason;
        doctor.statusChangedAt = Date.now();

        doctor.verificationHistory.push({
            status: 'REJECTED',
            changedBy: adminId,
            changedAt: Date.now(),
            reason: reason
        });

        await doctor.save();

        await auditService.logAction({
            module: 'DOCTOR',
            action: 'REJECT',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            before: beforeSnapshot,
            after: { status: 'REJECTED', reason },
            metadata: `Rejected: ${reason}`
        });

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Suspend Doctor
// @route   POST api/doctors/:id/suspend
// @access  Admin (Super/Verification)
exports.suspendDoctor = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        const beforeSnapshot = { status: doctor.verificationStatus, isActive: doctor.isActive };

        doctor.verificationStatus = 'SUSPENDED';
        doctor.isActive = false; // Block login
        doctor.statusChangedAt = Date.now();
        doctor.status.suspendedAt = Date.now();

        doctor.verificationHistory.push({
            status: 'SUSPENDED',
            changedBy: adminId,
            changedAt: Date.now(),
            reason: req.body.reason || 'Admin Action'
        });

        await doctor.save();

        await auditService.logAction({
            module: 'DOCTOR',
            action: 'SUSPEND',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            before: beforeSnapshot,
            after: { status: 'SUSPENDED', isActive: false },
            metadata: 'Doctor suspended'
        });

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Revoke Verification
// @route   POST api/doctors/:id/revoke
// @access  Admin (Super/Verification)
exports.revokeVerification = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        const beforeSnapshot = { status: doctor.verificationStatus };

        doctor.verificationStatus = 'PENDING';
        doctor.isVerified = false;
        doctor.statusChangedAt = Date.now();

        doctor.verificationHistory.push({
            status: 'PENDING',
            changedBy: adminId,
            changedAt: Date.now(),
            reason: 'Verification Revoked'
        });

        await doctor.save();

        await auditService.logAction({
            module: 'DOCTOR',
            action: 'REVOKE',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            before: beforeSnapshot,
            after: { status: 'PENDING' },
            metadata: 'Verification revoked'
        });

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Request Re-upload of documents
// @route   POST api/doctors/:id/reupload
// @access  Admin (Super/Verification)
exports.requestReupload = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;

        const { message } = req.body;
        if (!message) return res.status(400).json({ msg: 'Message is required' });

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        doctor.reuploadRequested = true;
        doctor.reuploadMessage = message;
        doctor.reuploadRequestedAt = Date.now();

        await doctor.save();

        await auditService.logAction({
            module: 'DOCTOR',
            action: 'REQUEST_REUPLOAD',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            metadata: `Re-upload requested: ${message}`
        });

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Request Profile Details update
// @route   POST api/doctors/:id/request-details
// @access  Admin (Super/Verification)
exports.requestProfileDetails = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.user?.id;

        const { message } = req.body;
        // Message is optional, but good to have

        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        doctor.profileDetailsRequested = true;
        doctor.profileDetailsMessage = message || 'Please update your profile with missing details.';
        doctor.profileDetailsRequestedAt = Date.now();

        await doctor.save();

        await auditService.logAction({
            module: 'DOCTOR',
            action: 'REQUEST_DETAILS',
            adminId: adminId,
            targetId: doctor._id,
            targetModel: 'Doctor',
            metadata: `Profile details requested: ${message}`
        });

        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add available slots
// @route   POST api/doctors/:id/slots
// @access  Private (should be restricted to the doctor owner)
exports.addSlots = async (req, res) => {
    const { date, time } = req.body; // Expect single slot or array of slots. Keeping it simple.

    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        if (doctor.id !== req.user.id) {
            return res.status(403).json({ msg: 'You can only manage your own availability' });
        }

        if (!date || !time || Number.isNaN(new Date(date).getTime()) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
            return res.status(400).json({ msg: 'Provide a valid date and time in HH:MM format' });
        }

        // Add slot
        doctor.availableSlots.push({ date, time });
        await doctor.save();

        res.json(doctor.availableSlots);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get current logged in doctor
// @route   GET api/doctors/me
// @access  Private
exports.getCurrentDoctor = async (req, res) => {
    try {
        console.log('GET /doctors/me request. User ID:', req.user.id);
        const doctor = await Doctor.findById(req.user.id).select('-passwordHash');
        if (!doctor) {
            console.log('Doctor not found for ID:', req.user.id, '. Trying email:', req.user.email);
            if (req.user.email) {
                doctor = await Doctor.findOne({ email: req.user.email }).select('-passwordHash');
            }
        }

        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        console.log('Current Doctor Photo:', doctor.doctorPhoto);
        const doctorObj = doctor.toObject();
        delete doctorObj.passwordHash;
        if (doctorObj.bankDetails?.accountNumber) {
            doctorObj.bankDetails.accountNumber = `••••${String(doctorObj.bankDetails.accountNumber).slice(-4)}`;
        }
        if (doctorObj.bankDetails?.panNumber) delete doctorObj.bankDetails.panNumber;
        res.json(doctorObj);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update current doctor profile
// @route   PUT api/doctors/me
// @access  Private
exports.updateCurrentDoctor = async (req, res) => {
    try {
        const {
            name,
            hospitalPhone,
            specialization,
            experience,
            consultationFee,
            bio,
            clinicAddress,
            bankDetails,
            availableHours,
            keywords,
            documents, // Handling document URL updates
            facilities,
            languages,
            gender
        } = req.body;

        let doctor = await Doctor.findById(req.user.id);

        if (!doctor) {
            console.log('Update Doctor: Not found by ID:', req.user.id, '. Trying email:', req.user.email);
            if (req.user.email) {
                doctor = await Doctor.findOne({ email: req.user.email });
            }
        }

        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // Update fields if they exist in request
        if (name) doctor.name = name;
        if (hospitalPhone) doctor.hospitalPhone = hospitalPhone;
        if (specialization) doctor.specialization = specialization;
        if (experience) doctor.experience = experience;
        if (consultationFee) doctor.consultationFee = consultationFee;
        if (bio) doctor.bio = bio;
        if (availableHours) doctor.availableHours = availableHours;
        if (req.body.weeklyAvailability) doctor.weeklyAvailability = req.body.weeklyAvailability;
        if (keywords) doctor.keywords = keywords;
        if (languages) doctor.languages = languages;
        if (gender) doctor.gender = gender;

        if (req.body.diseaseImages) doctor.diseaseImages = req.body.diseaseImages;
        if (req.body.clinicImages) doctor.clinicImages = req.body.clinicImages;
        if (req.body.genderPreference) doctor.genderPreference = req.body.genderPreference;

        // Missing Details Fields
        if (req.body.registrationNumber) doctor.registrationNumber = req.body.registrationNumber;
        if (req.body.medicalCouncil) doctor.medicalCouncil = req.body.medicalCouncil;
        if (req.body.practiceType) doctor.practiceType = req.body.practiceType;
        if (req.body.consultationModes) doctor.consultationModes = req.body.consultationModes;

        // Update nested objects safely (merge)
        if (clinicAddress) {
            doctor.clinicAddress = {
                ...doctor.clinicAddress.toObject(),
                ...clinicAddress
            };
        }

        if (facilities) {
            doctor.facilities = {
                ...(doctor.facilities || {}),
                ...facilities
            };
        }

        if (bankDetails) {
            doctor.bankDetails = {
                ...doctor.bankDetails?.toObject(),
                ...bankDetails
            };
        }

        if (documents) {
            doctor.documents = {
                ...doctor.documents?.toObject(),
                ...documents
            };
            // If re-upload was active and documents are updated, admin checks manually
            // OR auto-reset reuploadRequested? Let's leave it manual for now.
        }

        // If details were requested, clear the flag upon ANY update for now, or we could be more specific
        if (doctor.profileDetailsRequested) {
            doctor.profileDetailsRequested = false;
            doctor.profileDetailsMessage = null;
        }

        await doctor.save();

        // Broadcast profile update to User App/Admin real-time listener if socket exists
        try {
            const socketManager = require('../../utils/socket');
            socketManager.broadcast('doctor_profile_update', {
                doctorId: doctor._id,
                facilities: doctor.facilities,
                languages: doctor.languages
            });
        } catch (e) {
            console.error('Socket broadcast failed for doctor_profile_update', e);
        }

        res.json(doctor);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Search doctors by query, location, and date availability
// @route   POST api/doctors/search
// @access  Public
exports.searchDoctors = async (req, res) => {
    try {
        let { query, location, date } = req.body;

        // Sanitize inputs
        if (query) query = query.trim().slice(0, 100);
        if (location) location = location.trim().slice(0, 100);

        let dbQuery = {
            verificationStatus: 'VERIFIED',

            isActive: true
        };

        // If 'query' is provided (specialization, symptoms, name), search in relevant fields
        if (query) {
            const regex = new RegExp(escapeRegex(query), 'i');
            dbQuery.$or = [
                { name: regex },
                { specialization: regex },
                { keywords: { $in: [regex] } }, // Search in keywords array
                { education: regex },
                { 'clinicAddress.name': regex }
            ];
        }

        // Location filtering
        if (location) {
            const locRegex = new RegExp(escapeRegex(location), 'i');
            const locationQuery = {
                $or: [
                    { 'clinicAddress.city': locRegex },
                    { 'clinicAddress.district': locRegex },
                    { 'clinicAddress.state': locRegex },
                    { 'clinicAddress.pincode': locRegex },
                    { 'clinicAddress.street': locRegex }
                ]
            };

            if (dbQuery.$or) {
                dbQuery = {
                    $and: [
                        dbQuery, // verified & active
                        {
                            $and: [
                                { $or: dbQuery.$or },
                                { $or: locationQuery.$or }
                            ]
                        }
                    ]
                };
            } else {
                dbQuery = { ...dbQuery, ...locationQuery };
            }
        }

        // 1. Initial Fetch
        let doctors = await Doctor.find(dbQuery).select(PUBLIC_DOCTOR_FIELDS).limit(100);

        // 2. Filter by Date Availability (Application Level filtering easier for complex array structure)
        if (date) {
            // Parse date
            const [y, m, d] = date.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayString = days[dt.getDay()];

            doctors = doctors.filter(doc => {
                if (!doc.weeklyAvailability || doc.weeklyAvailability.length === 0) return true; // Assume available if no config? Or check availableHours

                const dayConfig = doc.weeklyAvailability.find(d => d.day === dayString);
                // If config exists and isOff is true, remove doctor
                if (dayConfig && dayConfig.isOff) return false;
                return true;
            });
        }

        // Map doctorPhoto -> profileImage for frontend compatibility
        const responseDoctors = doctors.map(doc => {
            const docObj = doc.toObject ? doc.toObject() : doc;
            if (docObj.doctorPhoto) {
                // Send Base64 string directly
                docObj.profileImage = docObj.doctorPhoto;
            }
            return docObj;
        });

        res.json(responseDoctors);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get available slots for a doctor on a specific date
// @route   GET api/doctors/:id/slots
// @access  Public
exports.getAvailableSlots = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ msg: 'Date query parameter is required' });
        }

        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }

        // Verification check for slots?
        if (!doctor.isVerified || !doctor.isActive) {
            // return res.json({ slots: [], message: 'Doctor unavailable' });
        }

        // If no available hours defined AND no weekly availability, return empty list
        const hasWeekly = doctor.weeklyAvailability && doctor.weeklyAvailability.length > 0;
        const hasLegacy = doctor.availableHours && doctor.availableHours.start && doctor.availableHours.end;

        if (!hasLegacy && !hasWeekly) {
            return res.json({ slots: [] });
        }

        const { start, end } = doctor.availableHours || {};
        let dayConfig = null;

        // Check for weekly availability first
        if (doctor.weeklyAvailability && doctor.weeklyAvailability.length > 0) {
            // Parse local date from string YYYY-MM-DD
            const [y, m, d] = date.split('-').map(Number);
            const dt = new Date(y, m - 1, d); // Local time midnight
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayString = days[dt.getDay()];

            dayConfig = doctor.weeklyAvailability.find(d => d.day === dayString);
        }

        let startStr = start;
        let endStr = end;
        let duration = 30; // default
        let lunchStart = null;
        let lunchEnd = null;

        if (dayConfig) {
            if (dayConfig.isOff) {
                return res.json({ slots: [], message: 'Doctor is off on this day' });
            }
            startStr = dayConfig.startTime;
            endStr = dayConfig.endTime;
            lunchStart = dayConfig.lunchStart;
            lunchEnd = dayConfig.lunchEnd;
            duration = dayConfig.slotDuration || 30;
        }

        if (!startStr || !endStr) {
            return res.json({ slots: [] });
        }

        // Fetch booked appointments
        const searchDate = new Date(date);
        if (isNaN(searchDate.getTime())) {
            return res.status(400).json({ msg: 'Invalid date format' });
        }

        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);

        // Fetch booked and locked appointments
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const appointments = await Appointment.find({
            doctorId: id,
            appointmentDate: {
                $gte: searchDate,
                $lt: nextDay
            },
            status: { $ne: 'CANCELLED' }
        }).select('appointmentTime status createdAt paymentExpiry');

        // Map times to status
        const slotStatusMap = {};
        const now = new Date();
        appointments.forEach(app => {
            if (['CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'PAID', 'IN_PROGRESS', 'PENDING'].includes(app.status)) {
                slotStatusMap[app.appointmentTime] = 'booked';
            } else if (app.status === 'PENDING_PAYMENT') {
                if (new Date(app.createdAt) > fiveMinutesAgo) {
                    if (slotStatusMap[app.appointmentTime] !== 'booked') {
                        slotStatusMap[app.appointmentTime] = 'locked';
                    }
                }
            } else if (app.status === 'LOCKED') {
                if (app.paymentExpiry && new Date(app.paymentExpiry) > now) {
                    if (slotStatusMap[app.appointmentTime] !== 'booked') {
                        slotStatusMap[app.appointmentTime] = 'locked';
                    }
                }
            }
        });

        // Generate slots
        const slots = [];
        let current = new Date(`2000-01-01T${startStr}:00`);
        const endTime = new Date(`2000-01-01T${endStr}:00`);

        // Lunch Date Objects for comparison
        let lunchStartObj = null;
        let lunchEndObj = null;
        if (lunchStart && lunchEnd) {
            lunchStartObj = new Date(`2000-01-01T${lunchStart}:00`);
            lunchEndObj = new Date(`2000-01-01T${lunchEnd}:00`);
        }

        // Safety check
        if (endTime <= current) {
            return res.json({ slots: [] });
        }

        while (current < endTime) {
            // Format HH:MM
            const hours = current.getHours().toString().padStart(2, '0');
            const minutes = current.getMinutes().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            // Check Lunch
            let isLunch = false;
            // A slot is inside lunch if its start time is >= lunchStart AND < lunchEnd
            // Or simplified: Just check if start time is in range. 
            if (lunchStartObj && lunchEndObj) {
                if (current >= lunchStartObj && current < lunchEndObj) {
                    isLunch = true;
                }
            }

            if (!isLunch) {
                // Check Status
                // const isBooked = bookedTimes.includes(timeString); // Replaced by map logic above

                // Filter past slots
                // Construct date string safely for comparison
                const slotDateTime = new Date(`${date}T${timeString}:00`);
                const now = new Date();

                if (slotDateTime > now) {
                    const status = slotStatusMap[timeString] || 'available';
                    slots.push({
                        time: timeString,
                        status: status
                    });
                }
            }

            current.setMinutes(current.getMinutes() + duration);
        }

        res.json({ slots });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Change Password (Doctor)
// @route   POST api/doctors/change-password
// @access  Private (Doctor)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide both current and new passwords' });
        }

        const doctor = await Doctor.findById(req.user.id);
        if (!doctor) return res.status(404).json({ msg: 'Doctor not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, doctor.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        doctor.passwordHash = await bcrypt.hash(newPassword, salt);

        await doctor.save();

        res.json({ msg: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
// @desc    Get health analysis requests for doctor
// @route   GET api/doctors/health-analysis
// @access  Private (Doctor)
exports.getDoctorHealthAnalysis = async (req, res) => {
    try {
        const HealthAnalysis = require('../../models/HealthAnalysis');
        const { status = 'pending', page = 1, limit = 10 } = req.query;

        const query = {
            assignedDoctor: req.user.id
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const analyses = await HealthAnalysis.find(query)
            .populate('userId', ['name', 'email', 'phone'])
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await HealthAnalysis.countDocuments(query);

        res.json({
            success: true,
            data: {
                analyses,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Update health analysis
// @route   PUT api/doctors/health-analysis/:id
// @access  Private (Doctor)
exports.updateHealthAnalysis = async (req, res) => {
    try {
        const HealthAnalysis = require('../../models/HealthAnalysis');
        const { findings, recommendations, status } = req.body;

        const analysis = await HealthAnalysis.findById(req.params.id);
        if (!analysis) {
            return res.status(404).json({ success: false, msg: 'Health analysis not found' });
        }

        // Verify doctor has access
        if (analysis.assignedDoctor.toString() !== req.user.id) {
            return res.status(403).json({ success: false, msg: 'Not authorized' });
        }

        if (findings) analysis.findings = findings;
        if (recommendations) analysis.recommendations = recommendations;
        if (status) analysis.status = status;
        analysis.updatedAt = new Date();

        await analysis.save();

        res.json({
            success: true,
            msg: 'Health analysis updated',
            data: analysis
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Get patient history/records for a specific patient
// @route   GET api/doctors/patients/:userId/records
// @access  Private (Doctor)
exports.getPatientRecords = async (req, res) => {
    try {
        const { userId } = req.params;
        const User = require('../../models/User');
        const HealthReading = require('../../models/HealthReading');

        // Get patient basic info
        const patient = await User.findById(userId).select('name email phone age gender medicalHistory');
        if (!patient) {
            return res.status(404).json({ success: false, msg: 'Patient not found' });
        }

        // Get all appointments with this doctor for this patient
        const appointments = await Appointment.find({
            userId,
            doctorId: req.user.id
        })
            .select('appointmentDate appointmentTime status consultationNotes prescriptions diseaseKeyword')
            .sort({ appointmentDate: -1 })
            .limit(20);

        // A doctor may access clinical records only for a patient with whom
        // they have an appointment. This prevents patient-ID enumeration.
        if (appointments.length === 0) {
            return res.status(403).json({ success: false, msg: 'No care relationship exists for this patient' });
        }

        // Get health readings for this patient
        const healthReadings = await HealthReading.find({
            userId
        })
            .select('readingType value readingDate unit')
            .sort({ readingDate: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                patient,
                appointments,
                healthReadings,
                totalAppointments: appointments.length
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Get doctor's notifications
// @route   GET api/doctors/notifications
// @access  Private (Doctor)
exports.getDoctorNotifications = async (req, res) => {
    try {
        const Notification = require('../../models/Notification');
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = {
            recipientId: req.user.id,
            recipientType: 'DOCTOR'
        };

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const skip = (page - 1) * limit;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(query);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    pageSize: parseInt(limit),
                    total,
                    unread: await Notification.countDocuments({ ...query, isRead: false })
                }
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Mark notification as read
// @route   PUT api/doctors/notifications/:id/read
// @access  Private (Doctor)
exports.markNotificationAsRead = async (req, res) => {
    try {
        const Notification = require('../../models/Notification');

        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipientId: req.user.id, recipientType: 'DOCTOR' },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, msg: 'Notification not found' });
        }

        res.json({ success: true, msg: 'Notification marked as read', data: notification });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
};

// @desc    Get all staff for current doctor
// @route   GET api/doctors/me/staff
// @access  Private (Doctor only)
exports.getDoctorStaff = async (req, res) => {
    try {
        const Staff = require('../../models/Staff');
        const staffList = await Staff.find({ doctorId: req.user.id }).select('-passwordHash');
        res.json(staffList);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Add a staff member for current doctor
// @route   POST api/doctors/me/staff
// @access  Private (Doctor only)
exports.addDoctorStaff = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        const Staff = require('../../models/Staff');
        let staff = await Staff.findOne({ email });
        if (staff) {
            return res.status(400).json({ msg: 'Staff email already registered' });
        }

        // Check if email already registered as doctor
        const Doctor = require('../../models/Doctor');
        const doctor = await Doctor.findOne({ email });
        if (doctor) {
            return res.status(400).json({ msg: 'Email already registered as a doctor' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Generate unique staffId: ST + YY (2-digit registration year) + RRR (3-digit random number)
        let isUnique = false;
        let staffId = '';
        const currentYear = new Date().getFullYear().toString().slice(-2);

        while (!isUnique) {
            const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            staffId = `ST${currentYear}${rand}`;
            const existingStaff = await Staff.findOne({ staffId });
            if (!existingStaff) {
                isUnique = true;
            }
        }

        staff = new Staff({
            name,
            staffId,
            email,
            phone,
            passwordHash,
            role: role || 'RECEPTIONIST',
            doctorId: req.user.id
        });

        await staff.save();
        
        const staffObj = staff.toObject();
        delete staffObj.passwordHash;
        
        res.json(staffObj);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Delete/Deactivate a staff member
// @route   DELETE api/doctors/me/staff/:staffId
// @access  Private (Doctor only)
exports.deleteDoctorStaff = async (req, res) => {
    try {
        const Staff = require('../../models/Staff');
        const staff = await Staff.findOne({ _id: req.params.staffId, doctorId: req.user.id });
        if (!staff) {
            return res.status(404).json({ msg: 'Staff member not found' });
        }

        await Staff.findByIdAndDelete(req.params.staffId);
        res.json({ msg: 'Staff member deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update a staff member's details
// @route   PUT api/doctors/me/staff/:staffId
// @access  Private (Doctor only)
exports.updateDoctorStaff = async (req, res) => {
    const { name, email, phone, password, role } = req.body;

    try {
        const Staff = require('../../models/Staff');
        const staff = await Staff.findOne({ _id: req.params.staffId, doctorId: req.user.id });
        if (!staff) {
            return res.status(404).json({ msg: 'Staff member not found' });
        }

        if (email && email !== staff.email) {
            // Check if email already registered as staff
            const existingStaff = await Staff.findOne({ email });
            if (existingStaff) {
                return res.status(400).json({ msg: 'Staff email already registered' });
            }

            // Check if email already registered as doctor
            const Doctor = require('../../models/Doctor');
            const doctor = await Doctor.findOne({ email });
            if (doctor) {
                return res.status(400).json({ msg: 'Email already registered as a doctor' });
            }
            staff.email = email;
        }

        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (role) staff.role = role;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            staff.passwordHash = await bcrypt.hash(password, salt);
        }

        await staff.save();

        const staffObj = staff.toObject();
        delete staffObj.passwordHash;

        res.json(staffObj);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
