-- School Data Upload & Reporting System Database Schema
-- Compatible with PostgreSQL and MySQL

-- Schools Master Table
CREATE TABLE IF NOT EXISTS schools (
    school_id VARCHAR(50) PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    principal_email VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Uploads Tracking Table
CREATE TABLE IF NOT EXISTS uploads (
    upload_id INT AUTO_INCREMENT PRIMARY KEY,
    school_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING',
    uploaded_by VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by VARCHAR(100),
    reviewed_at TIMESTAMP NULL,
    total_students INT DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_school_id (school_id),
    INDEX idx_uploaded_at (uploaded_at)
);

-- Students Data Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    upload_id INT NOT NULL,
    school_id VARCHAR(50) NOT NULL,
    student_name VARCHAR(255),
    class VARCHAR(50),
    roll_number VARCHAR(50),
    response_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES uploads(upload_id) ON DELETE CASCADE,
    FOREIGN KEY (school_id) REFERENCES schools(school_id) ON DELETE CASCADE,
    INDEX idx_upload_id (upload_id),
    INDEX idx_school_id (school_id)
);

-- Sample Schools Data (for testing)
INSERT INTO schools (school_id, school_name, principal_email, district, address, phone) VALUES
('SCH001', 'Green Valley High School', 'principal@greenvalley.edu', 'North District', '123 Education Lane', '+91-9876543210'),
('SCH002', 'Sunrise Academy', 'principal@sunriseacademy.edu', 'South District', '456 Learning Street', '+91-9876543211'),
('SCH003', 'Bright Future School', 'principal@brightfuture.edu', 'East District', '789 Knowledge Road', '+91-9876543212')
ON DUPLICATE KEY UPDATE school_name = VALUES(school_name);
