const mongoose = require('mongoose');
const User = require('./models/User');
const BloodDonor = require('./models/BloodDonor');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp');
        console.log('Connected to MongoDB');

        // 1. Create a dummy user
        const testUserId = 999999;
        await User.deleteOne({ user_id: testUserId });
        const user = new User({
            user_id: testUserId,
            display_id: 'TestUser',
            full_name: 'Test Donor',
            email: 'testdonor@example.com',
            password_hash: 'hashed',
            date_of_birth: new Date(),
            gender: 'Male',
            phone: '1234567890'
        });
        await user.save();
        console.log('Dummy User Saved');

        // 2. Create a dummy donor
        await BloodDonor.deleteOne({ user_id: testUserId });
        const donor = new BloodDonor({
            user_id: testUserId,
            blood_group: 'O+',
            city: 'TestCity',
            state: 'TestState'
        });
        await donor.save();
        console.log('Dummy BloodDonor Saved');

        // 3. Attempt Populate
        // OLD WAY (Current code)
        const donors = await BloodDonor.find({ user_id: testUserId }).populate('user_id', 'full_name');
        console.log('--- Populate Result (Standard) ---');
        console.log(JSON.stringify(donors, null, 2));

        if (donors.length > 0 && donors[0].user_id && donors[0].user_id.full_name) {
            console.log('SUCCESS: Standard populate worked!');
        } else {
            console.log('FAILURE: Standard populate failed (expected if types match)');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

verify();
