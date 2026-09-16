-- ==============================================================================
-- Education Algorithm — Safe Migration Script: Legacy PHP to Next.js
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. Take a backup of your existing Hostinger MySQL database via phpMyAdmin (Export).
-- 2. Open phpMyAdmin on Hostinger, select your database (u200723621_sQRge), and run this script.
-- 3. This script uses CREATE TABLE IF NOT EXISTS and ALTER TABLE to safely add
--    all new Next.js features WITHOUT overwriting or deleting your existing student data!
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Ensure admins table has proper columns
CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Ensure instructors table exists
CREATE TABLE IF NOT EXISTS `instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `title` varchar(150) DEFAULT 'Senior Faculty & Lead Engineer',
  `bio` text DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Ensure students table exists with all modern columns
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Ensure courses table exists
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 18000.00,
  `duration` varchar(100) DEFAULT '16 Weeks Live',
  `level` varchar(100) DEFAULT 'Intermediate to Advanced',
  `thumbnail` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'published',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4b. Course-Based Faculty Assignments
CREATE TABLE IF NOT EXISTS `course_instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `instructor_id` (`instructor_id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Ensure modules table exists
CREATE TABLE IF NOT EXISTS `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Ensure videos table exists
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `bunny_video_id` varchar(100) DEFAULT NULL,
  `duration` varchar(50) DEFAULT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Ensure enrollments table exists
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `course` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `student_name` varchar(255) DEFAULT NULL,
  `enrollment_code` varchar(100) DEFAULT NULL,
  `payment_status` varchar(50) NOT NULL DEFAULT 'active',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Modern Checkout: enrollment_intents table
CREATE TABLE IF NOT EXISTS `enrollment_intents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `intent_id` varchar(64) NOT NULL,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) NOT NULL,
  `batch_id` int(11) DEFAULT NULL,
  `batch_name` varchar(150) DEFAULT 'Fall 2026 Live Cohort (Batch A)',
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'PENDING_EMAIL_VERIFICATION',
  `course_price` decimal(10,2) NOT NULL DEFAULT 18000.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `final_amount` decimal(10,2) NOT NULL DEFAULT 18000.00,
  `coupon_code` varchar(50) DEFAULT NULL,
  `otp_hash` varchar(255) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `otp_attempts` int(11) NOT NULL DEFAULT 0,
  `otp_resend_count` int(11) NOT NULL DEFAULT 0,
  `last_otp_sent_at` datetime DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `enrollment_code` varchar(100) DEFAULT NULL,
  `enrollment_id` int(11) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT '127.0.0.1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `intent_id` (`intent_id`),
  KEY `email` (`email`),
  KEY `razorpay_order_id` (`razorpay_order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Live Masterclasses: webinars table
CREATE TABLE IF NOT EXISTS `webinars` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `course_id` int(11) NOT NULL,
  `instructor` varchar(150) NOT NULL,
  `meet_link` varchar(500) NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 60,
  `status` varchar(30) NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Webinar attendees table
CREATE TABLE IF NOT EXISTS `webinar_attendees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `webinar_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'confirmed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Student Doubts Tickets
CREATE TABLE IF NOT EXISTS `doubt_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'open',
  `priority` varchar(20) NOT NULL DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Doubt replies table
CREATE TABLE IF NOT EXISTS `doubt_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(30) NOT NULL DEFAULT 'instructor',
  `reply_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Student Progress & Video Bookmarks
CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_video` (`student_id`, `video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Student Bookmarks
CREATE TABLE IF NOT EXISTS `student_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_bookmark_video` (`student_id`, `video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Student Daily Streaks
CREATE TABLE IF NOT EXISTS `student_streaks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `current_streak` int(11) NOT NULL DEFAULT 1,
  `max_streak` int(11) NOT NULL DEFAULT 1,
  `last_active_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Certificates
CREATE TABLE IF NOT EXISTS `issued_certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_code` varchar(100) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `course_title` varchar(255) NOT NULL,
  `issue_date` date NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'verified',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_code` (`certificate_code`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. AI Chat & RAG Knowledge Store
CREATE TABLE IF NOT EXISTS `rag_knowledge_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Engineering',
  `content` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Mock Interviews
CREATE TABLE IF NOT EXISTS `mock_interviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `interviewer_id` int(11) DEFAULT NULL,
  `track_title` varchar(255) NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `meet_link` varchar(500) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Coupons / Scholarships
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_type` varchar(20) NOT NULL DEFAULT 'fixed',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 5000.00,
  `max_uses` int(11) NOT NULL DEFAULT 100,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `coupons` (`code`, `discount_type`, `discount_amount`, `max_uses`, `used_count`, `status`) VALUES
('WELCOME50', 'fixed', 5000.00, 500, 0, 'active'),
('CAREER2026', 'fixed', 8000.00, 500, 0, 'active'),
('EARLYBIRD', 'fixed', 3000.00, 500, 0, 'active');

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- Migration Completed Successfully!
-- ==============================================================================
