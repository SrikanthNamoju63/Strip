const mongoose = require('mongoose');
const User = require('./models/User');
const BloodDonor = require('./models/BloodDonor');
require('dotenv').config();

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp');
        console.log('Connected to MongoDB');

        // 1. Create a dummy user
        const testUserId = 888888;
        await User.deleteOne({ user_id: testUserId });
        const user = new User({
            user_id: testUserId,
            display_id: 'TestUserVirtual',
            full_name: 'Virtual Donor Test',
            email: 'virtual@example.com',
            password_hash: 'hashed',
            date_of_birth: new Date(),
            gender: 'Male',
            phone: '9876543210'
        });
        await user.save();

        // 2. Create a dummy donor
        await BloodDonor.deleteOne({ user_id: testUserId });
        const donor = new BloodDonor({
            donor_id: 123456,
            user_id: testUserId,
            blood_group: 'AB-',
            city: 'VirtualCity',
            state: 'VirtualState',
            is_available: true,
            is_eligible: true
        });
        await donor.save();

        // 3. Attempt Populate with Virtual
        const donors = await BloodDonor.find({ user_id: testUserId }).populate('user_details', 'full_name phone');
        console.log('--- Populate Result (Virtual) ---');
        console.log(JSON.stringify(donors, null, 2));

        if (donors.length > 0 && donors[0].user_details && donors[0].user_details.full_name === 'Virtual Donor Test') {
            console.log('SUCCESS: Virtual populate worked!');
        } else {
            console.log('FAILURE: Virtual populate failed.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.connection.close();
    }
}

verify();
