const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
require('dotenv').config();

const verifyDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const doctors = await Doctor.find().sort({ createdAt: -1 }).limit(1);
        console.log(`Found ${doctors.length} doctors`);

        for (const doc of doctors) {
            console.log(`Checking Doctor: ${doc.email} (ID: ${doc._id})`);
            console.log(JSON.stringify(doc, null, 2));
            console.log(`  Photo: ${doc.doctorPhoto ? (doc.doctorPhoto.length > 100 ? doc.doctorPhoto.substring(0, 100) + '...' : doc.doctorPhoto) : 'None'}`);
            const found = await Doctor.findById(doc._id);
            if (found) {
                console.log(`  [OK] Found by ID`);
            } else {
                console.error(`  [FAIL] Could not find by ID!`);
            }

            // Generate token payload simulation
            console.log(`  Token Payload ID would be: ${doc.id}`);
            if (doc.id === doc._id.toString()) {
                console.log(`  [OK] doc.id matches doc._id.toString()`);
            } else {
                console.error(`  [FAIL] doc.id mismatch!`);
            }
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyDoctors();
