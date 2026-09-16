-- EDUCATION ALGORITHM: STRICT SCHOLARSHIP HOLD / PRE-BOOK DATA MODEL
-- Migration: 001_create_scholarship_reservations.sql

CREATE TABLE IF NOT EXISTS scholarship_reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NULL,
    course_id INT NOT NULL,
    original_fee DECIMAL(10,2) NOT NULL,
    scholarship_amount DECIMAL(10,2) NOT NULL,
    scholarship_price DECIMAL(10,2) NOT NULL,
    prebook_amount DECIMAL(10,2) NOT NULL,
    prebook_paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    remaining_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    scholarship_status VARCHAR(30) NOT NULL DEFAULT 'OFFERED',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
    enrollment_status VARCHAR(30) NOT NULL DEFAULT 'NOT_ENROLLED',
    payment_order_id VARCHAR(100) NULL,
    payment_reference VARCHAR(100) NULL,
    reservation_date DATETIME NULL,
    expiry_date DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_scholarship_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
    CONSTRAINT fk_scholarship_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_scholarship_student_id (student_id),
    INDEX idx_scholarship_course_id (course_id),
    INDEX idx_scholarship_status (scholarship_status),
    INDEX idx_scholarship_payment_status (payment_status),
    INDEX idx_scholarship_enrollment_status (enrollment_status),
    INDEX idx_scholarship_payment_reference (payment_reference),
    INDEX idx_scholarship_payment_order_id (payment_order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
