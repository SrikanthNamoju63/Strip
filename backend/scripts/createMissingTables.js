const db = require('../config/db');

/**
 * Create missing tables: user_profiles and appointments
 */
async function createMissingTables() {
    try {
        console.log('Creating missing database tables...\n');

        // Create user_profiles table
        console.log('Creating user_profiles table...');
        await db.simpleQuery(`
            CREATE TABLE IF NOT EXISTS user_profiles (
                profile_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                bio TEXT,
                blood_group VARCHAR(5),
                height_cm DECIMAL(5,2),
                weight_kg DECIMAL(5,2),
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                country VARCHAR(50) DEFAULT 'India',
                emergency_contact_name VARCHAR(100),
                emergency_contact_phone VARCHAR(15),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                INDEX idx_city (city),
                INDEX idx_blood_group (blood_group)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ user_profiles table created');

        // Create appointments table
        console.log('Creating appointments table...');
        await db.simpleQuery(`
            CREATE TABLE IF NOT EXISTS appointments (
                appointment_id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT NOT NULL,
                doctor_id INT NOT NULL,
                
                appointment_datetime DATETIME NOT NULL,
                duration_mins INT DEFAULT 30,
                appointment_type ENUM('consultation','follow-up','emergency','online') DEFAULT 'consultation',
                
                status ENUM('Scheduled','Confirmed','InProgress','Completed','Cancelled','NoShow','Expired') DEFAULT 'Scheduled',
                cancellation_reason TEXT,
                cancelled_by ENUM('user','doctor','system'),
                
                symptoms TEXT,
                notes TEXT,
                prescription_given BOOLEAN DEFAULT FALSE,
                
                -- Timing
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP NULL,
                contacted_at TIMESTAMP NULL,
                completed_at TIMESTAMP NULL,
                expires_at TIMESTAMP NULL,
                
                -- Token/Queue System
                token_number INT,
                queue_position INT,
                
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
                INDEX idx_user_status (user_id, status),
                INDEX idx_doctor_date (doctor_id, appointment_datetime),
                INDEX idx_status_date (status, appointment_datetime),
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ appointments table created');

        // Verify tables exist
        console.log('\nVerifying tables...');
        const tables = await db.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME IN ('user_profiles', 'appointments')
        `);
        
        const existingTableNames = tables.map(t => t.TABLE_NAME);
        console.log('Existing tables:', existingTableNames.join(', '));
        
        if (existingTableNames.length === 2) {
            console.log('\n✓ All required tables are now present!');
            return true;
        } else {
            const missing = ['user_profiles', 'appointments'].filter(t => !existingTableNames.includes(t));
            console.log(`\n⚠ Still missing: ${missing.join(', ')}`);
            return false;
        }

    } catch (error) {
        console.error('\n✗ Error creating tables:', error.message);
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.error('Note: Make sure the "users" and "doctors" tables exist first.');
        }
        return false;
    } finally {
        // Close connection pool
        await db.pool.end();
        process.exit(0);
    }
}

// Run the script
createMissingTables();

