const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

const checkDoctorData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthpredict');

        console.log('Checking for doctors matching "skin" and "ghanpur"...');

        // 1. Check strict match
        const strictMatch = await Doctor.find({
            $and: [
                { verificationStatus: 'VERIFIED' },
                { isActive: true },
                {
                    $or: [
                        { specialization: /skin/i },
                        { keywords: /skin/i }
                    ]
                },
                {
                    'clinicAddress.city': /ghanpur/i
                }
            ]
        });
        console.log(`\nStrict Match Count: ${strictMatch.length}`);
        strictMatch.forEach(d => console.log(`- ${d.name} (${d.specialization}) - Status: ${d.verificationStatus}, Active: ${d.isActive}`));

        // 2. Check loose match (ignore status)
        console.log('\nChecking loose match (ignoring status)...');
        const looseMatch = await Doctor.find({
            $and: [
                {
                    $or: [
                        { specialization: /skin/i },
                        { keywords: /skin/i }
                    ]
                },
                {
                    'clinicAddress.city': /ghanpur/i // checking city specifically first
                }
            ]
        });
        console.log(`Loose Match Count: ${looseMatch.length}`);
        looseMatch.forEach(d => {
            console.log(`- ${d.name} (${d.specialization})`);
            console.log(`  Status: ${d.verificationStatus}`);
            console.log(`  Active: ${d.isActive}`);
            console.log(`  Address: ${JSON.stringify(d.clinicAddress)}`);
        });

        // 3. Check just location and list details
        console.log('\n--- DOCTORS IN GHANPUR ---');
        const locMatch = await Doctor.find({
            $or: [
                { 'clinicAddress.city': /ghanpur/i },
                { 'clinicAddress.street': /ghanpur/i }
            ]
        });

        if (locMatch.length === 0) {
            console.log('No doctors found in Ghanpur.');
        } else {
            locMatch.forEach(d => {
                console.log(`\nName: ${d.name}`);
                console.log(`Specialization: "${d.specialization}"`);
                console.log(`Keywords: ${d.keywords}`);
                console.log(`Status: ${d.verificationStatus}`);
                console.log(`Active: ${d.isActive}`);
                console.log(`IsVerified: ${d.isVerified}`);
            });
        }
        console.log('\n--------------------------');

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkDoctorData();
