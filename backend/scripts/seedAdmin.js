const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('./models/Admin');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        // Fix: Validate environment variables
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        const existingAdmin = await Admin.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists. Skipping seed.');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Fix: Use environment variable for admin password instead of hardcoded
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            throw new Error(
                'ADMIN_PASSWORD environment variable not set. ' +
                'Please set a strong password: export ADMIN_PASSWORD="your_secure_password"'
            );
        }

        if (adminPassword.length < 8) {
            throw new Error('Admin password must be at least 8 characters long');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(adminPassword, salt);

        const newAdmin = new Admin({
            username: adminUsername,
            passwordHash: passwordHash,
            role: 'SUPER_ADMIN',
            isActive: true
        });

        await newAdmin.save();
        console.log(`✓ Super Admin Created: username=${adminUsername}`);
        console.log('⚠ Change password immediately after first login!');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding admin:', err.message);
        process.exit(1);
    }
};

seedAdmin();
