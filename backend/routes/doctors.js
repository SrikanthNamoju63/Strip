const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const DoctorAvailability = require('../models/DoctorAvailability');

// Helper to map DB doctor to App doctor
const mapDoctor = (doc) => {
    const d = doc.toObject();
    const hospital = d.hospital_details || {};
    const professional = d.professional_details || {};

    return {
        _id: d._id,
        doctor_id: d._id.toString(), // Use Mongo ID as doctor_id for now
        doctor_name: d.full_name,
        specialization: d.specialization,
        hospital_name: hospital.name,
        hospital_city: hospital.city,
        experience_years: professional.experience || 0,
        consultation_fee: d.consultation_fee,
        rating: d.rating || 4.5, // Default rating if missing
        total_reviews: d.total_reviews || 0,
        education: d.education,
        languages: d.languages,
        profile_image: d.profile_image,
        is_available: d.is_active
    };
};

// Search doctors
router.get('/search', async (req, res) => {
    const { location, keywords, specialization } = req.query;
    try {
        const query = { is_active: true }; // Filter by active doctors only

        if (location) {
            // Search in nested hospital city
            query['hospital_details.city'] = { $regex: location, $options: 'i' };
        }

        if (keywords) {
            // Search in name, specialization, hospital name, or search_keywords
            query.$or = [
                { full_name: { $regex: keywords, $options: 'i' } },
                { specialization: { $regex: keywords, $options: 'i' } },
                { 'hospital_details.name': { $regex: keywords, $options: 'i' } },
                { search_keywords: { $regex: keywords, $options: 'i' } }
            ];
        }

        if (specialization) {
            query.specialization = { $regex: specialization, $options: 'i' };
        }

        const doctors = await Doctor.find(query);
        const mappedDoctors = doctors.map(mapDoctor);
        res.json(mappedDoctors);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Search failed: ' + error.message });
    }
});

// Get all doctors
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find({ is_active: true });
        const mappedDoctors = doctors.map(mapDoctor);
        res.json(mappedDoctors);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error fetching doctors: ' + error.message });
    }
});

// Get doctor availability
router.get('/:id/availability', async (req, res) => {
    try {
        const doctorId = req.params.id;
        const availability = await DoctorAvailability.find({ doctor_id: doctorId });

        // Map to Android App expectation
        const formattedAvailability = availability.map(a => ({
            day_of_week: a.day_of_week,
            start_time: a.start_time,
            end_time: a.end_time,
            is_available: true // If record exists, they are available (active logic handled by existence or is_active)
        }));

        res.json(formattedAvailability);
    } catch (error) {
        console.error('Availability error:', error);
        res.status(500).json({ success: false, error: 'Error fetching availability' });
    }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
    try {
        // ID might be Mongo ID or old integer ID. Try both if needed, but for now strict match
        // Since we are moving to ObjectId mainly, check if it's a valid object ID string
        let query = {};
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            query = { _id: req.params.id };
        } else {
            // Fallback for maybe numeric IDs if we still support them (though new schema uses _id)
            // But the route expects 'id' param. 
            return res.status(404).json({ success: false, error: 'Invalid ID format' });
        }

        const doctor = await Doctor.findOne(query);
        if (!doctor) {
            return res.status(404).json({ success: false, error: 'Doctor not found' });
        }

        const mappedDoctor = mapDoctor(doctor);
        res.json({ success: true, doctor: mappedDoctor });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error: ' + error.message });
    }
});

// Sync doctors from external dashboard (Placeholder - simplified)
router.post('/sync', async (req, res) => {
    res.json({ success: true, message: 'Sync not needed - Backend connected directly to DoctorDashboard DB' });
});

module.exports = router;