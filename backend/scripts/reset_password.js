const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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

const resetPassword = async () => {
    await connectDB();
    try {
        const email = 'srikanthnamoju06@gmail.com';
        const newPassword = 'Password@123';

        const doctor = await Doctor.findOne({ email });
        if (!doctor) {
            console.log('Doctor not found!');
            return;
        }

        const salt = await bcrypt.genSalt(10);
        doctor.passwordHash = await bcrypt.hash(newPassword, salt);
        await doctor.save();

        console.log(`Password for ${email} has been reset to: ${newPassword}`);
    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        mongoose.disconnect();
    }
};

resetPassword();
