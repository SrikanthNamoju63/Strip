const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected...');

        // Delete existing admin
        await Admin.deleteMany({ username: 'admin' });
        console.log('Old admin deleted');

        // Re-create
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const newAdmin = new Admin({
            username: 'admin',
            passwordHash: passwordHash,
            role: 'SUPER_ADMIN'
        });

        await newAdmin.save();
        console.log('Super Admin Re-Created: admin / admin123');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
