const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const DoctorAppointment = require('../models/DoctorAppointment');

// Helper to calculate expiry (legacy logic)
function calculateExpiryDate() {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    return expiryDate;
}

// Helper to generate a numeric ID (quick fix for migration)
const generateAppointmentId = async () => {
    return Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
};

// Get user appointments
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const appointments = await Appointment.find({ user_id: userId })
            .populate('doctor_id', 'full_name specialization hospital_name') // Populate from Doctor model
            .sort({ appointment_date_time: -1 })
            .limit(50);

        // Map to match legacy response structure (snake_case)
        const formattedResults = appointments.map(app => {
            const doc = app.doctor_id || {}; // Populated doctor
            return {
                appointment_id: app.appointment_id,
                doctor_name: doc.full_name || 'Unknown Doctor',
                specialization: doc.specialization || 'General',
                hospital_name: doc.hospital_name || 'Unknown Hospital',
                appointment_date: app.appointment_date_time,
                status: app.status,
                symptoms: app.symptoms,
                notes: app.notes,
                contacted_at: app.contacted_at,
                expires_at: app.expires_at,
                token_created_at: app.created_at,
                appointment_type: app.appointment_type,
                duration_mins: app.duration_mins,
                amount: app.amount_paid || app.consultation_fee,
                payment_status: app.payment_status,
                transaction_id: app.transaction_id,
                payment_method: app.payment_method,
                payment_date: app.payment_date
            };
        });

        res.json({
            success: true,
            appointments: formattedResults,
            count: formattedResults.length
        });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Database error: ' + error.message
        });
    }
});

// Book new appointment
router.post('/book-compat', async (req, res) => {
    const {
        user_id,
        doctor_id,
        appointment_date,
        appointment_time,
        symptoms,
        appointment_type,
        notes
    } = req.body;

    try {
        if (!user_id || !doctor_id || !appointment_date) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const appointmentDateTime = appointment_time
            ? new Date(`${appointment_date}T${appointment_time}:00`)
            : new Date(`${appointment_date}T12:00:00`);

        const expiryDate = calculateExpiryDate();

        // Prepare notes block
        const combinedNotes = `Symptoms: ${symptoms || 'Not specified'}\nType: ${appointment_type || 'consultation'}\n${notes || ''}`;

        // Attempt to find doctor to check fee (optional)
        // Attempt to find doctor to check fee (optional)
        const doctor = await Doctor.findById(doctor_id);
        const fee = doctor ? doctor.consultation_fee : 0;

        // Generate ID
        const appointmentId = await generateAppointmentId();

        // Extract payment info from notes (Legacy logic support)
        let paymentData = {};
        if (notes) {
            const paymentMatch = notes.match(/Payment: ([^,]+), Transaction: ([^,]+)/);
            if (paymentMatch) {
                paymentData = {
                    payment_method: paymentMatch[1].trim(),
                    transaction_id: paymentMatch[2].trim(),
                    payment_status: 'Paid',
                    amount_paid: fee,
                    payment_date: new Date()
                };
            }
        }

        // Parse Patient Name from notes
        let patientName = 'Guest';
        if (notes) {
            const nameMatch = notes.match(/Patient:\s*([^,]+)/);
            if (nameMatch) {
                patientName = nameMatch[1].trim();
            }
        }

        // Generate centralized token number
        const tokenNumber = Math.floor(Math.random() * 20) + 1;

        // 1. Create Doctor Side Appointment (HealthPredict_DoctorDashboard)
        try {
            await DoctorAppointment.create({
                doctor_id: doctor_id, // Mongoose casts string to ObjectId
                patient_name: patientName,
                appointment_date: appointmentDateTime,
                appointment_time: appointment_time || '09:00',
                token_number: tokenNumber,
                status: 'Scheduled',
                appointment_type: appointment_type || 'consultation',
                payment_status: paymentData.payment_status === 'Paid' ? 'PAID' : 'UNPAID'
            });
            console.log('Doctor side appointment created');
        } catch (docErr) {
            console.error('Failed to create doctor side appointment:', docErr);
            // We continue to create user appointment even if doctor side fails? 
            // Better to fail or log? For now proceed.
        }

        // 2. Create User Side Appointment (HealthPredict_UserApp)
        const newAppointment = await Appointment.create({
            appointment_id: appointmentId,
            user_id,
            doctor_id,
            appointment_date_time: appointmentDateTime,
            symptoms,
            notes: combinedNotes,
            status: 'Scheduled',
            appointment_type: appointment_type || 'consultation',
            expires_at: expiryDate,
            consultation_fee: fee,
            token_number: tokenNumber, // Add token to user appointment
            ...paymentData
        });

        res.json({
            success: true,
            message: 'Appointment booked successfully',
            appointmentId: appointmentId,
            expiresAt: expiryDate.toISOString()
        });

    } catch (error) {
        console.error('Booking error:', error.message);
        res.status(500).json({ success: false, error: 'Booking failed: ' + error.message });
    }
});

// Mark as contacted
router.post('/:appointmentId/contacted', async (req, res) => {
    const appointmentId = req.params.appointmentId;
    const currentTime = new Date();

    try {
        const result = await Appointment.findOneAndUpdate(
            {
                appointment_id: appointmentId,
                status: { $in: ['Scheduled', 'Confirmed'] }
            },
            {
                contacted_at: currentTime,
                status: 'Completed'
            },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ success: false, error: 'Appointment not found or invalid status' });
        }

        res.json({
            success: true,
            message: 'Appointment marked as contacted',
            contactedAt: currentTime
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error: ' + error.message });
    }
});

// Get Status
router.get('/:appointmentId/status', async (req, res) => {
    const appointmentId = req.params.appointmentId;

    try {
        const appointment = await Appointment.findOne({ appointment_id: appointmentId });

        if (!appointment) {
            return res.status(404).json({ success: false, error: 'Appointment not found' });
        }

        // Check expiry
        let expiryStatus = 'Valid';
        const now = new Date();
        if (appointment.status === 'Completed') expiryStatus = 'Completed';
        else if (appointment.status === 'Cancelled') expiryStatus = 'Cancelled';
        else if (appointment.status === 'Expired' || (appointment.expires_at && appointment.expires_at < now)) {
            expiryStatus = 'Expired';
            if (appointment.status !== 'Expired') {
                appointment.status = 'Expired';
                await appointment.save();
            }
        }

        res.json({
            success: true,
            appointment: {
                appointment_id: appointment.appointment_id,
                status: appointment.status,
                contacted_at: appointment.contacted_at,
                expires_at: appointment.expires_at,
                token_created_at: appointment.created_at,
                expiry_status: expiryStatus,
                // days_remaining approximate
                days_remaining: appointment.expires_at ? Math.ceil((appointment.expires_at - now) / (1000 * 60 * 60 * 24)) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error: ' + error.message });
    }
});

// Process Payment
router.post('/process-payment', async (req, res) => {
    const { amount, paymentMethod, appointmentId } = req.body;

    try {
        if (!appointmentId) return res.status(400).json({ success: false, error: 'appointmentId required' });

        const transactionId = 'TXN_' + Date.now();

        const result = await Appointment.findOneAndUpdate(
            { appointment_id: appointmentId },
            {
                amount_paid: amount,
                payment_method: paymentMethod,
                transaction_id: transactionId,
                payment_status: 'Paid',
                payment_date: new Date()
            },
            { new: true }
        );

        if (!result) return res.status(404).json({ success: false, error: 'Appointment not found' });

        res.json({
            success: true,
            transactionId: transactionId,
            message: 'Payment processed',
            paymentStatus: 'Paid',
            paymentMethod: paymentMethod
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Payment failed: ' + error.message });
    }
});

// Test Connection
router.get('/test/connection', (req, res) => {
    res.json({ success: true, message: 'Appointments endpoint working (MongoDB)' });
});

module.exports = router;
