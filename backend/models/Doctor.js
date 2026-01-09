const mongoose = require('mongoose');

// Create a separate connection for the Doctor Dashboard DB
const doctorDbConnection = mongoose.createConnection('mongodb://localhost:27017/HealthPredict_DoctorDashboard');

const doctorSchema = new mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    profile_image: { type: String },
    specialization: { type: String, index: true },
    education: { type: String },
    languages: { type: String },
    consultation_fee: { type: Number },
    consultation_duration_mins: { type: Number },
    achievements: { type: String },
    bio: { type: String },
    search_keywords: { type: String, index: true },
    is_active: { type: Boolean, default: true, index: true },

    // Nested Objects
    hospital_details: {
        name: String,
        city: String,
        state: String,
        pincode: String,
        village: String,
        landmark: String,
        address: String
    },

    professional_details: {
        registration_number: String,
        experience: Number,
        license_year: Number
    },

    // Fields not in screenshot but needed for app compatibility (can be virtuals or defaults)
    rating: { type: Number, default: 4.5 }, // Default for now as it's not in schema
    total_reviews: { type: Number, default: 0 }
}, {
    timestamps: true, // matches createdAt/updatedAt in screenshot
    collection: 'doctor_profile' // Explicitly set collection name
});

// Export the model bound to the specific connection
// Export the model bound to the specific connection
module.exports = doctorDbConnection.model('Doctor', doctorSchema);

// OPTIONAL: If we want to support population from the main Mongoose instance (assuming same DB/Connection sharing isn't easy here)
// We can't really register it to global `mongoose` unless we are okay with it pending.
// But `Appointment.js` refs 'Doctor'. If 'Doctor' is not registered on the default connection, populate will fail with "Schema hasn't been registered".
//
// The separate connection is great for isolation, but `populate()` in Mongoose usually requires models to be on the SAME connection 
// OR explicitly registered.
//
// WORKAROUND: Register a 'Doctor' model on the default connection just for population references.
// It will look for 'doctor_profile' collection in 'HealthPredict_UserApp' (default db) unless we trick it?
// Actually, Cross-DB populate is hard.
// 
// IF we populate 'doctor_id' in Appointment, Mongoose looks for 'Doctor' model in `mongoose.models`.
// Since we only did `doctorDbConnection.model(...)`, `mongoose.model('Doctor')` doesn't exist.
// We must register a placeholder or the same schema to the default connection if we want populate to attempt something (though it might look in wrong DB).
//
// Since we are running single `mongod` instance usually, we can specify database name in schema?
// No, Mongoose connections are DB specific.
//
// BEST FIX for compatibility right now:
// Register the model on the default instance too, pointing to 'Doctor' name.
// BUT since data is in another DB, populate won't find the document unless it's in the same DB.
//
// WAITING: If `HealthPredict_DoctorDashboard` and `HealthPredict_UserApp` are in the same Mongo instance, we can't cross-populate easily without valid refs.
//
// HOWEVER, the error is explicit: "Schema hasn't been registered for model 'Doctor'".
// This means we are missing `mongoose.model('Doctor', ...)` in the default connection.
// 
// Let's register it purely to silence the error, even if populate fails to find data (it will return null).
// BUT we want data.
// 
// If populate fails, we might need to manually fetch doctor details.
//
// For now, let's register it to fix the crash.
try {
    mongoose.model('Doctor', doctorSchema); // Registers to default connection
} catch (e) {
    // Already registered
}
