const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/healthapp';
const PORT = 5002;
const API_URL = `http://localhost:${PORT}/api`;
const JWT_SECRET = process.env.JWT_SECRET;

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);
const DoctorSchema = new mongoose.Schema({}, { strict: false });
const Doctor = mongoose.model('Doctor', DoctorSchema);
const FeeConfigSchema = new mongoose.Schema({}, { strict: false });
const FeeConfig = mongoose.model('FeeConfig', FeeConfigSchema);

async function runDebug() {
    try {
        console.log('--- Connecting to MongoDB ---');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        // 1. Check FeeConfig
        const feeConfig = await FeeConfig.findOne();
        console.log('FeeConfig found:', feeConfig ? 'YES' : 'NO');

        // 2. Get a User
        let user = await User.findOne();
        if (!user) {
            console.log('No user found, creating dummy user...');
            user = await User.create({
                name: 'Debug User',
                email: `debug_${Date.now()}@test.com`,
                passwordHash: 'hash',
                role: 'USER'
            });
        }
        console.log(`Using User: ${user._id}`);

        // 3. Get a Doctor
        const doctor = await Doctor.findOne({ verificationStatus: 'VERIFIED' });
        if (!doctor) {
            console.error('No verified doctor found! Cannot test booking.');
            return;
        }
        console.log(`Using Doctor: ${doctor._id}`);

        // 4. Generate Token
        const token = jwt.sign({ id: user._id, role: user.role ?? 'USER' }, JWT_SECRET, { expiresIn: '1h' });

        // 5. Attempt Booking via API
        console.log('\n--- Attempting Booking via API ---');
        const payload = {
            doctorId: doctor._id,
            appointmentDate: new Date().toISOString().split('T')[0], // Today
            appointmentTime: '10:00',
            diseaseKeyword: 'Debug',
            patientDetails: {
                name: 'Debug Patient',
                age: 30,
                gender: 'Male',
                contact: '1234567890'
            }
        };

        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log('Response:', text);

        if (res.status === 500) {
            console.log('\n--- Diagnosing 500 Error ---');
            console.log('Checking Transaction Capability...');
            try {
                const session = await mongoose.startSession();
                session.startTransaction();
                console.log('Transaction started successfully.');
                await session.abortTransaction();
                await session.endSession();
                console.log('Transaction aborted and session ended.');
            } catch (txErr) {
                console.error('Transaction Failed directly on DB:', txErr.message);
                if (txErr.message.includes('standalone')) {
                    console.error('ROOT CAUSE FOUND: MongoDB is running as a standalone instance, but changes require a Replica Set for transactions.');
                }
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

runDebug();
