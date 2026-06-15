const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected');
        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} doctors:`);
        doctors.forEach(doc => {
            console.log(JSON.stringify({
                name: doc.name,
                email: doc.email,
                specialization: doc.specialization,
                profileImage: doc.profileImage ? doc.profileImage.substring(0, 100) + '...' : null,
                doctorPhoto: doc.doctorPhoto ? doc.doctorPhoto.substring(0, 100) + '...' : null,
                ratings: doc.ratings,
                isActive: doc.isActive,
                verificationStatus: doc.verificationStatus,
                isVerified: doc.isVerified
            }, null, 2));
        });
    } catch (err) {
        console.error('Error:', err);
    } finally {
        mongoose.disconnect();
    }
};

inspect();
