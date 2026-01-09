const mongoose = require('mongoose');
const BloodDonor = require('./models/BloodDonor');
require('dotenv').config();

async function fixIndex() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp');
        console.log('Connected to MongoDB');

        // Drop the problematic index
        try {
            await mongoose.connection.collection('blooddonors').dropIndex('donor_id_1');
            console.log('Dropped unique index on donor_id');
        } catch (e) {
            console.log('Index drop failed or index does not exist:', e.message);
        }

        // The index will be recreated automatically by Mongoose application start if autoIndex is on,
        // or we can manually ensure it here if needed, but dropping it should solve the immediate "duplicate null" issue
        // as the new schema has sparse: true.

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

fixIndex();
