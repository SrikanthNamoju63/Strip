const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

const checkDoctors = async () => {
    try {
        console.log('Starting checkDoctors script...');
        console.log('Loading .env...');
        require('dotenv').config();
        console.log('MONGO_URI:', process.env.MONGO_URI);

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthpredict');
        console.log('MongoDB Connected');

        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} doctors.`);

        doctors.forEach(doc => {
            console.log(`\nDoctor: ${doc.name} (${doc.email})`);
            console.log('Available Hours:', doc.availableHours);
            // console.log('Weekly Availability:', JSON.stringify(doc.weeklyAvailability, null, 1));
            if (doc.weeklyAvailability && doc.weeklyAvailability.length > 0) {
                console.log('Weekly Availability: [Has Config]');
            } else {
                console.log('Weekly Availability: []');
            }
        });

        console.log('Closing connection...');
        await mongoose.connection.close();
        console.log('Done.');
    } catch (err) {
        console.error('An error occurred:', err);
        process.exit(1);
    }
};

checkDoctors();
