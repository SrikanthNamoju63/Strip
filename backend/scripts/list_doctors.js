const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const listDoctors = async () => {
    await connectDB();
    try {
        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} doctors:`);
        doctors.forEach(doc => {
            console.log(`- Name: ${doc.name}, Email: ${doc.email}, ID: ${doc._id}, Verified: ${doc.isVerified}, PasswordHash: ${doc.passwordHash ? 'Present' : 'MISSING'}`);
        });
    } catch (err) {
        console.error('Error listing doctors:', err);
    } finally {
        mongoose.disconnect();
    }
};

listDoctors();
