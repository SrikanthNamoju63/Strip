const mongoose = require('mongoose');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const connectDB = require('./config/db');

const verify = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/HealthPredict_UserApp';
        console.log(`Connecting to URI: ${uri}`);
        await connectDB();

        const email = "srikanthnamoju07@gmail.com";
        console.log(`Searching for user with email: ${email}`);

        const user = await User.findOne({ email });

        if (user) {
            console.log("\nUser Found:");
            console.log(JSON.stringify(user.toJSON(), null, 2));

            const profile = await UserProfile.findOne({ user_id: user.user_id });
            if (profile) {
                console.log("\nUserProfile Found:");
                console.log(JSON.stringify(profile.toJSON(), null, 2));
            } else {
                console.log("\nUserProfile NOT FOUND for user_id: " + user.user_id);
            }
        } else {
            console.log("\nUser NOT FOUND");
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
