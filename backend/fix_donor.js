const mongoose = require('mongoose');
const BloodDonor = require('./models/BloodDonor');
require('dotenv').config();

async function fixDonor() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp');

        const res = await BloodDonor.updateOne(
            { user_id: 999999 },
            { $set: { is_eligible: true, city: "testcity" } } // Also normalize city case to be safe
        );

        console.log(`Updated donor: ${res.modifiedCount} document(s) modified`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

fixDonor();
