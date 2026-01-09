const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
require('dotenv').config();

async function verifyExternalDb() {
    try {
        // We don't need to connect to default DB because Doctor model has its own connection.
        // But we wait for the model's connection to be ready.
        console.log('Connecting to HealthPredict_DoctorDashboard...');

        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 1. Count doctors in the doctor_profile collection
        const totalDoctors = await Doctor.countDocuments({});
        console.log(`Total doctors in 'HealthPredict_DoctorDashboard.doctor_profile': ${totalDoctors}`);

        if (totalDoctors === 0) {
            console.log('No doctors found? Check if MongoDB has the data shown in screenshot.');
            // Create a mock doctor matching the screenshot schema to test mapping if DB is empty locally
            const mockDoc = new Doctor({
                full_name: "Dr. Srikanth Mock",
                hospital_details: {
                    name: "Mamatha Hospital Mock",
                    city: "Warangal"
                },
                professional_details: {
                    experience: 6
                },
                is_active: true,
                specialization: "Cardiology",
                search_keywords: "Fever, Skin",
                consultation_fee: 249
            });
            await mockDoc.save();
            console.log('Created mock doctor for testing.');
        }

        // 2. Perform a search query matching the router logic
        const location = 'Warangal';
        const keywords = 'Cardiology';

        const query = { is_active: true };
        if (location) query['hospital_details.city'] = { $regex: location, $options: 'i' };

        const results = await Doctor.find(query);
        console.log(`Search for location='${location}' found ${results.length} result(s).`);

        results.forEach(d => {
            console.log(`- Name: ${d.full_name}`);
            console.log(`  Hospital: ${d.hospital_details?.name}, City: ${d.hospital_details?.city}`);
            console.log(`  Fee: ${d.consultation_fee}`);
            console.log(`  Keywords: ${d.search_keywords}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect(); // Close default if any
        // Close the specific model connection
        await Doctor.db.close();
    }
}

verifyExternalDb();
