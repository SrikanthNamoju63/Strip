const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Fix: Validate MONGO_URI is set
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not set. Check .env file.');
        }

        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority'
        };

        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('MongoDB Connected successfully!');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });

    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
