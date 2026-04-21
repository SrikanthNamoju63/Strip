const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    personalPhone: { type: String, required: true, unique: true },
    hospitalPhone: { type: String },
    passwordHash: { type: String, required: true },

    role: { type: String, default: 'DOCTOR' },
    // Verification & Status
    verificationStatus: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING',
        index: true
    },
    // New Mandatory Fields
    registrationNumber: { type: String, required: true, unique: true },
    medicalCouncil: { type: String, required: true },
    identityProof: { type: String }, // Base64 or URL
    practiceType: {
        type: String,
        enum: ['Own Clinic', 'Visiting Consultant', 'Hospital Employee']
    },
    consultationModes: [{
        type: String,
        enum: ['IN_PERSON', 'VIDEO']
    }],
    isVerified: { type: Boolean, default: false, index: true }, // Keep synced with verificationStatus
    isActive: { type: Boolean, default: true }, // Keep synced with verificationStatus !== SUSPENDED

    rejectionReason: { type: String },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    verifiedAt: { type: Date },

    reuploadRequested: { type: Boolean, default: false },
    reuploadMessage: { type: String },
    reuploadRequestedAt: { type: Date },

    // Profile Details Request
    profileDetailsRequested: { type: Boolean, default: false },
    profileDetailsMessage: { type: String },
    profileDetailsRequestedAt: { type: Date },

    statusChangedAt: { type: Date, default: Date.now, index: true },

    verificationHistory: [{
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        changedAt: { type: Date, default: Date.now },
        reason: String
    }],

    documents: {
        degreeCertificateUrl: String,
        medicalRegistrationUrl: String,
        idProofUrl: String,
        // Any other docs
    },

    doctorPhoto: { type: String },
    diseaseImages: [{ type: String }],
    clinicImages: [{ type: String }],
    genderPreference: { type: String, enum: ['Male', 'Female', 'Both'], default: 'Both' },

    specialization: { type: String, index: true },
    experience: { type: Number },
    keywords: [{ type: String }],
    languages: [{ type: String }],

    facilities: {
        labAvailable: { type: Boolean, default: false },
        scanAvailable: { type: Boolean, default: false },
        pharmacyAvailable: { type: Boolean, default: false },
        bloodTestAvailable: { type: Boolean, default: false },
        ecgAvailable: { type: Boolean, default: false },
        xRayAvailable: { type: Boolean, default: false },
        wheelchairAccess: { type: Boolean, default: false },
        parkingAvailable: { type: Boolean, default: false }
    },

    education: { type: String },
    educationDetails: {
        college: String,
        yearOfPassing: String,
        licenseImage: String,
        registrationNumber: String,
        registrationBody: String
    },

    bio: { type: String },
    consultationFee: { type: Number, required: true },
    availableHours: {
        start: String,
        end: String
    },
    weeklyAvailability: [{
        day: { type: String, required: true },
        startTime: { type: String, default: '09:00' },
        endTime: { type: String, default: '17:00' },
        lunchStart: { type: String, default: '13:00' },
        lunchEnd: { type: String, default: '14:00' },
        isOff: { type: Boolean, default: false },
        slotDuration: { type: Number, default: 30 }
    }],

    clinicAddress: {
        name: String,
        street: String,
        landmark: String,
        city: String,
        district: String,
        state: String,
        pincode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    // Bank details for settlements
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        branchName: String,
        accountType: { type: String, enum: ['SAVINGS', 'CURRENT'] },
        verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'FAILED'], default: 'PENDING' },
        panNumber: { type: String }, // Compliance
        razorpayAccountId: { type: String }, // Razorpay Route Linked Account ID
        kycStatus: { type: String, enum: ['PENDING', 'UNDER_REVIEW', 'ACTIVE', 'REJECTED'], default: 'PENDING' },
        accountActivationStatus: { type: String, default: 'INACTIVE' } // For Razorpay activation
    },

    // Rating & Review metrics
    ratings: {
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        totalRatings: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        serviceRating: { type: Number, default: 0 },
        lastRatingDate: { type: Date }
    },

    // Earnings summary
    earnings: {
        totalEarnings: { type: Number, default: 0 },
        totalSettled: { type: Number, default: 0 },
        pendingSettlement: { type: Number, default: 0 },
        lastSettlementDate: { type: Date },
        appointmentCount: { type: Number, default: 0 }
    },

    // Status tracking
    status: {
        isOnline: { type: Boolean, default: false },
        lastSeenAt: { type: Date },
        createdAt: { type: Date, default: Date.now, index: true },
        verifiedAt: { type: Date },
        suspendedAt: { type: Date }
    }
}, { timestamps: true });

// Indexes for performance
doctorSchema.index({ isVerified: 1, isActive: 1 });
doctorSchema.index({ specialization: 1, isVerified: 1 });
doctorSchema.index({ 'ratings.averageRating': -1 });
doctorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
