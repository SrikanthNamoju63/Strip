const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const doctors = await Doctor.find({});
        console.log(`Found ${doctors.length} doctors.`);

        doctors.forEach(doc => {
            console.log(`- Name: ${doc.name}`);
            console.log(`  Email: ${doc.email}`);
            console.log(`  Role: ${doc.role}`);
            console.log(`  VerificationStatus: ${doc.verificationStatus}`);
            console.log(`  IsActive: ${doc.isActive}`);
            console.log(`  IsVerified: ${doc.isVerified}`);
            console.log(`-----------------------`);
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
