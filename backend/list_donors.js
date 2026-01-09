const mongoose = require('mongoose');
const BloodDonor = require('./models/BloodDonor');
require('dotenv').config();

async function listDonors() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp');

        const donors = await BloodDonor.find({});
        console.log(`Found ${donors.length} donors:`);
        donors.forEach(d => {
            console.log(`- ID: ${d.user_id}, Group: ${d.blood_group}, City: ${d.city}, Eligible: ${d.is_eligible}, Available: ${d.is_available}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

listDonors();
