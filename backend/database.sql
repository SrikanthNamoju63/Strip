-- ============================================
-- COMPLETE IMPROVED DATABASE SCHEMA
-- Health Prediction Platform
-- Production-Ready MySQL Database
-- ============================================

-- 1. USERS TABLE (Consolidated)
-- Remove redundancy, keep core user info only
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    display_id VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    age INT GENERATED ALWAYS AS (TIMESTAMPDIFF(YEAR, dob, CURDATE())) STORED,
    gender ENUM('Male','Female','Other') NOT NULL,
    phone VARCHAR(15),
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_display_id (display_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USER PROFILES (Extended Information)
DROP TABLE IF EXISTS user_profiles;
CREATE TABLE user_profiles (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. HEALTH METRICS (Consolidated and Optimized)
DROP TABLE IF EXISTS health_metrics;
CREATE TABLE health_metrics (
    metric_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Vital Signs
    heart_rate INT,
    systolic_bp INT,
    diastolic_bp INT,
    body_temperature DECIMAL(4,2),
    blood_oxygen INT,
    respiratory_rate INT,
    
    -- Activity Data
    steps_count INT DEFAULT 0,
    calories_burned INT DEFAULT 0,
    distance_km DECIMAL(6,2),
    active_minutes INT,
    
    -- Sleep Data
    sleep_hours DECIMAL(4,2),
    deep_sleep_hours DECIMAL(4,2),
    light_sleep_hours DECIMAL(4,2),
    rem_sleep_hours DECIMAL(4,2),
    
    -- Weight & BMI
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(4,2),
    
    -- AI Analysis
    ai_analysis TEXT,
    risk_score DECIMAL(5,2),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source ENUM('manual','device','api') DEFAULT 'manual',
    device_id VARCHAR(100),
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, recorded_at),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_anomaly (anomaly_detected)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(recorded_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p2026 VALUES LESS THAN (2027),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- 4. HEALTH RISK PREDICTIONS
DROP TABLE IF EXISTS health_risk_predictions;
CREATE TABLE health_risk_predictions (
    prediction_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    -- Risk Categories
    diabetes_risk ENUM('Low','Medium','High'),
    heart_disease_risk ENUM('Low','Medium','High'),
    hypertension_risk ENUM('Low','Medium','High'),
    obesity_risk ENUM('Low','Medium','High'),
    
    overall_risk_level ENUM('Low','Medium','High') NOT NULL,
    confidence_score DECIMAL(5,2),
    
    -- Details
    risk_factors JSON,
    predicted_conditions TEXT,
    prevention_plan TEXT,
    recommendations TEXT,
    lifestyle_suggestions TEXT,
    
    -- ML Model Info
    model_version VARCHAR(50),
    model_accuracy DECIMAL(5,2),
    
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_current (user_id, is_current),
    INDEX idx_risk_level (overall_risk_level),
    INDEX idx_valid (valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. MEDICAL HISTORY
DROP TABLE IF EXISTS medical_history;
CREATE TABLE medical_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    condition_type ENUM('chronic','acute','surgery','allergy','injury','other') NOT NULL,
    condition_name VARCHAR(200) NOT NULL,
    icd_code VARCHAR(20),
    severity ENUM('Mild','Moderate','Severe'),
    diagnosis_date DATE,
    recovery_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_condition_type (condition_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. MEDICATIONS
DROP TABLE IF EXISTS user_medications;
CREATE TABLE user_medications (
    medication_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    medication_name VARCHAR(100) NOT NULL,
    generic_name VARCHAR(100),
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    route ENUM('oral','injection','topical','inhaled','other'),
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by VARCHAR(100),
    prescription_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    side_effects TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_active (user_id, is_active),
    INDEX idx_dates (start_date, end_date),
    CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. SPECIALIZATIONS
DROP TABLE IF EXISTS specializations;
CREATE TABLE specializations (
    specialization_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    common_symptoms TEXT,
    icon VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. DOCTORS (Enhanced)
DROP TABLE IF EXISTS doctors;
CREATE TABLE doctors (
    doctor_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    
    -- Professional Info
    registration_number VARCHAR(50) UNIQUE,
    specialization_id INT,
    experience_years INT DEFAULT 0,
    education VARCHAR(255),
    languages VARCHAR(255),
    
    -- Hospital/Clinic Info
    hospital_name VARCHAR(150),
    hospital_address TEXT,
    hospital_city VARCHAR(100),
    hospital_state VARCHAR(100),
    hospital_pincode VARCHAR(10),
    hospital_landmark VARCHAR(255),
    
    -- Consultation
    consultation_fee DECIMAL(10,2),
    consultation_duration_mins INT DEFAULT 30,
    
    -- Ratings
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    total_consultations INT DEFAULT 0,
    
    -- Profile
    profile_image VARCHAR(255),
    bio TEXT,
    achievements TEXT,
    search_keywords TEXT,
    
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (specialization_id) REFERENCES specializations(specialization_id) ON DELETE SET NULL,
    INDEX idx_specialization (specialization_id),
    INDEX idx_city (hospital_city),
    INDEX idx_rating (rating),
    INDEX idx_verified_active (is_verified, is_active),
    FULLTEXT idx_search (name, search_keywords, hospital_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. DOCTOR AVAILABILITY
DROP TABLE IF EXISTS doctor_availability;
CREATE TABLE doctor_availability (
    availability_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    day_of_week ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_mins INT DEFAULT 30,
    max_patients_per_slot INT DEFAULT 1,
    is_available BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    UNIQUE KEY unique_doctor_day (doctor_id, day_of_week, start_time),
    INDEX idx_doctor_available (doctor_id, is_available),
    CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. APPOINTMENTS
DROP TABLE IF EXISTS appointments;
CREATE TABLE appointments (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. PAYMENTS
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    user_id INT NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    payment_method ENUM('Credit Card','Debit Card','UPI','PayPal','Google Pay','PhonePe','Cash') NOT NULL,
    payment_status ENUM('Pending','Processing','Completed','Failed','Refunded','Cancelled') DEFAULT 'Pending',
    
    transaction_id VARCHAR(255) UNIQUE,
    gateway_response JSON,
    
    payment_date TIMESTAMP NULL,
    refund_date TIMESTAMP NULL,
    refund_amount DECIMAL(10,2),
    refund_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_status (payment_status),
    INDEX idx_user (user_id),
    INDEX idx_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. REVIEWS
DROP TABLE IF EXISTS reviews;
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    doctor_id INT NOT NULL,
    user_id INT NOT NULL,
    
    rating INT NOT NULL,
    comment TEXT,
    
    is_verified BOOLEAN DEFAULT FALSE,
    is_visible BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (appointment_id, user_id),
    INDEX idx_doctor_visible (doctor_id, is_visible),
    CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. DOCUMENTS
DROP TABLE IF EXISTS health_documents;
CREATE TABLE health_documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    appointment_id INT,
    
    document_type ENUM('lab_report','prescription','scan_report','medical_certificate','vaccination','insurance','other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url VARCHAR(255) NOT NULL,
    file_size_kb INT,
    mime_type VARCHAR(100),
    
    description TEXT,
    tags VARCHAR(255),
    
    uploaded_date DATE NOT NULL,
    expiry_date DATE,
    
    is_verified BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    INDEX idx_user_type (user_id, document_type),
    INDEX idx_uploaded (uploaded_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. BLOOD DONATION (Consolidated)
DROP TABLE IF EXISTS blood_donors;
CREATE TABLE blood_donors (
    donor_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    
    blood_group VARCHAR(5) NOT NULL,
    role ENUM('Donor','Receiver','Both') DEFAULT 'Donor',
    
    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    is_eligible BOOLEAN DEFAULT FALSE,
    last_eligibility_check TIMESTAMP,
    last_donation_date DATE,
    next_eligible_date DATE,
    
    -- Contact
    phone VARCHAR(15),
    city VARCHAR(100),
    state VARCHAR(100),
    willing_to_travel_km INT DEFAULT 10,
    
    -- Health Info
    smoker ENUM('Yes','No') DEFAULT 'No',
    alcohol_consumer ENUM('Yes','No') DEFAULT 'No',
    
    -- Stats
    total_donations INT DEFAULT 0,
    last_donation_location VARCHAR(150),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_blood_city (blood_group, city),
    INDEX idx_available (is_available, is_eligible),
    INDEX idx_next_eligible (next_eligible_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. BLOOD DONOR ELIGIBILITY (Detailed Tracking)
DROP TABLE IF EXISTS blood_donor_eligibility;
CREATE TABLE blood_donor_eligibility (
    eligibility_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    
    -- Basic Criteria
    age INT,
    weight_kg DECIMAL(5,2),
    hemoglobin_level DECIMAL(4,2),
    age_eligible BOOLEAN DEFAULT FALSE,
    weight_eligible BOOLEAN DEFAULT FALSE,
    hemoglobin_eligible BOOLEAN DEFAULT FALSE,
    
    -- Lifestyle
    smoking_status ENUM('Non-smoker','Occasional','Regular') DEFAULT 'Non-smoker',
    hours_since_smoking INT DEFAULT 0,
    alcohol_consumption ENUM('None','Occasional','Regular') DEFAULT 'None',
    hours_since_alcohol INT DEFAULT 0,
    
    -- Recent Procedures
    has_tattoo_recent BOOLEAN DEFAULT FALSE,
    tattoo_months_ago INT DEFAULT 0,
    has_piercing_recent BOOLEAN DEFAULT FALSE,
    piercing_months_ago INT DEFAULT 0,
    recent_surgery BOOLEAN DEFAULT FALSE,
    surgery_months_ago INT DEFAULT 0,
    
    -- Health Conditions
    pregnant_or_breastfeeding BOOLEAN DEFAULT FALSE,
    has_chronic_disease BOOLEAN DEFAULT FALSE,
    chronic_disease_details TEXT,
    on_medications BOOLEAN DEFAULT FALSE,
    medication_details TEXT,
    
    -- Travel & Diseases
    recent_travel BOOLEAN DEFAULT FALSE,
    travel_details TEXT,
    has_hiv_hepatitis BOOLEAN DEFAULT FALSE,
    has_std BOOLEAN DEFAULT FALSE,
    had_malaria BOOLEAN DEFAULT FALSE,
    malaria_months_ago INT DEFAULT 0,
    
    -- Donation History
    last_donation_date DATE,
    days_since_last_donation INT DEFAULT 0,
    
    -- Final Eligibility
    is_eligible BOOLEAN DEFAULT FALSE,
    eligibility_reason TEXT,
    eligibility_score INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. DONATION HISTORY
DROP TABLE IF EXISTS blood_donation_history;
CREATE TABLE blood_donation_history (
    donation_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    donation_date DATE NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    donation_type ENUM('whole_blood','plasma','platelets','double_red') DEFAULT 'whole_blood',
    quantity_ml INT DEFAULT 450,
    location VARCHAR(150),
    blood_bank_name VARCHAR(150),
    recipient_info VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, donation_date),
    INDEX idx_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. NOTIFICATIONS
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    
    type ENUM('appointment','medication','health_alert','system','promotion') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    
    action_url VARCHAR(255),
    action_type VARCHAR(50),
    
    scheduled_for TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_read (user_id, is_read),
    INDEX idx_scheduled (scheduled_for)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. AUDIT LOG
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    doctor_id INT,
    
    action_type VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    
    old_value JSON,
    new_value JSON,
    
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_action (action_type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
PARTITION BY RANGE (YEAR(created_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- ============================================
-- TRIGGERS FOR AUTOMATION
-- ============================================

-- Update doctor ratings after review
DELIMITER //
CREATE TRIGGER update_doctor_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE doctors 
    SET 
        rating = (SELECT AVG(rating) FROM reviews WHERE doctor_id = NEW.doctor_id AND is_visible = TRUE),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE doctor_id = NEW.doctor_id AND is_visible = TRUE)
    WHERE doctor_id = NEW.doctor_id;
END;//

-- Set appointment expiry automatically
CREATE TRIGGER set_appointment_expiry
BEFORE INSERT ON appointments
FOR EACH ROW
BEGIN
    IF NEW.expires_at IS NULL THEN
        SET NEW.expires_at = DATE_ADD(NEW.appointment_datetime, INTERVAL 2 HOUR);
    END IF;
END;//

-- Calculate next eligible donation date
CREATE TRIGGER calculate_next_donation_date
BEFORE UPDATE ON blood_donors
FOR EACH ROW
BEGIN
    IF NEW.last_donation_date IS NOT NULL THEN
        SET NEW.next_eligible_date = DATE_ADD(NEW.last_donation_date, INTERVAL 90 DAY);
    END IF;
END;//

DELIMITER ;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Active appointments view
CREATE OR REPLACE VIEW v_active_appointments AS
SELECT 
    a.appointment_id,
    a.appointment_datetime,
    a.status,
    u.name as patient_name,
    u.phone as patient_phone,
    d.name as doctor_name,
    d.hospital_name,
    s.name as specialization
FROM appointments a
JOIN users u ON a.user_id = u.user_id
JOIN doctors d ON a.doctor_id = d.doctor_id
LEFT JOIN specializations s ON d.specialization_id = s.specialization_id
WHERE a.status IN ('Scheduled','Confirmed')
AND a.appointment_datetime >= CURDATE();

-- High risk users view
CREATE OR REPLACE VIEW v_high_risk_users AS
SELECT 
    u.user_id,
    u.name,
    u.email,
    u.phone,
    p.overall_risk_level,
    p.predicted_conditions,
    p.predicted_at
FROM users u
JOIN health_risk_predictions p ON u.user_id = p.user_id
WHERE p.is_current = TRUE
AND p.overall_risk_level = 'High';

-- Available blood donors view
CREATE OR REPLACE VIEW v_available_blood_donors AS
SELECT 
    bd.blood_group,
    u.name,
    u.phone,
    bd.city,
    bd.state,
    bd.last_donation_date,
    bd.total_donations
FROM blood_donors bd
JOIN users u ON bd.user_id = u.user_id
WHERE bd.is_available = TRUE
AND bd.is_eligible = TRUE
AND (bd.next_eligible_date IS NULL OR bd.next_eligible_date <= CURDATE());

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Get user health summary
DELIMITER //
CREATE PROCEDURE sp_get_user_health_summary(IN p_user_id INT)
BEGIN
    SELECT 
        u.name,
        u.age,
        u.gender,
        up.blood_group,
        up.height_cm,
        up.weight_kg,
        (SELECT overall_risk_level FROM health_risk_predictions 
         WHERE user_id = p_user_id AND is_current = TRUE LIMIT 1) as current_risk,
        (SELECT COUNT(*) FROM medical_history 
         WHERE user_id = p_user_id AND is_active = TRUE) as active_conditions,
        (SELECT COUNT(*) FROM user_medications 
         WHERE user_id = p_user_id AND is_active = TRUE) as active_medications
    FROM users u
    LEFT JOIN user_profiles up ON u.user_id = up.user_id
    WHERE u.user_id = p_user_id;
END;//

DELIMITER ;

