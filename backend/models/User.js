const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    age: { type: Number },
    dob: { type: Date },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    gender: { type: String },
    address: {
        state: String,
        city: String,
        pincode: String
    },
    bloodGroup: { type: String },
    profileImage: { type: String },
    lastDonationDate: { type: Date },
    alcoholic: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
    role: { type: String, enum: ['USER', 'DOCTOR', 'ADMIN'], default: 'USER' },

    // Emergency Contacts
    emergencyContacts: [{
        name: String,
        relationship: String,
        phone: String
    }],

    // Doctor Specific Fields
    personalPhone: { type: String },
    hospitalPhone: { type: String },

    doctorPhoto: { type: String }, // Path or Base64

    specialization: { type: String },
    experience: { type: Number },

    education: { type: String }, // General degree
    educationDetails: {
        college: String,
        yearOfPassing: String,
        licenseImage: String
    },

    bio: { type: String },
    consultationFee: { type: Number },
    availableHours: {
        start: String,
        end: String
    },

    // Detailed Address for Doctors (overriding or extending basic address)
    clinicAddress: {
        name: String, // Clinic/Hospital Name
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
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
