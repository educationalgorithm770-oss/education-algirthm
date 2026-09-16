-- ==============================================================================
-- Education Algorithm — Complete Master Production Database Setup
-- ==============================================================================
-- Database: Hostinger MySQL (u200723621_sQRge)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. Admins Table
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Login: admin / Admin@1234
INSERT INTO `admins` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin', '$2b$10$fAnbQ82QMzptCdsyeNZ0FeN7/q55wkvbImF2yC1pR4aS9DFWdZxz6', NOW());

-- 2. Instructors Table
DROP TABLE IF EXISTS `instructors`;
CREATE TABLE `instructors` (
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

-- Faculty Logins: arjun@educationalgorithm.com & priya@educationalgorithm.com / Password: Faculty@1234
INSERT INTO `instructors` (`id`, `username`, `name`, `email`, `password`, `title`, `bio`, `status`, `created_at`) VALUES
(1, 'arjun', 'Dr. Arjun Mehta', 'arjun@educationalgorithm.com', '$2b$10$Lyk1vPkXonj9dEiuiudob.Akt40wslksljhv/w2RdEtcrvkKVOLzy', 'Senior Architect & Distributed Systems Lead', 'Former Staff Engineer at Tier-1 tech firms. Specializing in high-throughput backend architecture and enterprise microservices.', 'active', NOW()),
(2, 'priya', 'Priya Sharma', 'priya@educationalgorithm.com', '$2b$10$Lyk1vPkXonj9dEiuiudob.Akt40wslksljhv/w2RdEtcrvkKVOLzy', 'Lead AI & Machine Learning Faculty', 'Principal Data Scientist & ML Researcher with 10+ years specializing in deep learning, LLMs, and enterprise AI.', 'active', NOW());

-- 3. Students Table (Cleaned with 1 Test Student)
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
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

-- 1 Test Student: student@educationalgorithm.com / Password: Student@1234
INSERT INTO `students` (`id`, `name`, `email`, `password`, `password_hash`, `phone`, `status`, `created_at`) VALUES
(1, 'Test Student', 'student@educationalgorithm.com', '$2b$10$1XiUu2HRlb.OZCgQ1TBHK.KTuV8u8.nPKkXI3DLhWfDC5lvw0x4m6', '$2b$10$1XiUu2HRlb.OZCgQ1TBHK.KTuV8u8.nPKkXI3DLhWfDC5lvw0x4m6', '+91 9876543210', 'active', NOW());

-- 4. Courses Table
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
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

INSERT INTO `courses` (`id`, `title`, `slug`, `description`, `price`, `duration`, `level`, `thumbnail`, `status`, `created_at`) VALUES
(1, 'Java Full Stack & Cloud Engineering', 'java-full-stack', 'Master modern enterprise Java, Spring Boot microservices, Docker, Kubernetes, AWS cloud architectures, and high-performance system design.', 18000.00, '16 Weeks Live', 'Beginner to Advanced', '/images/courses/java.jpg', 'published', NOW()),
(2, 'Data Science, Machine Learning & GenAI', 'data-science-ml', 'Deep dive into Python, Pandas, Machine Learning pipelines, Deep Learning, Generative AI models, and production MLOps deployment.', 18000.00, '16 Weeks Live', 'Intermediate to Advanced', '/images/courses/data-science.jpg', 'published', NOW()),
(3, 'Full Stack Web & Modern Frontend Architecture', 'web-development', 'Build enterprise Next.js, React, TypeScript, GraphQL, Node.js applications with scalable backend microservices and modern UI/UX.', 18000.00, '16 Weeks Live', 'Beginner to Advanced', '/images/courses/web-dev.jpg', 'published', NOW());

-- 5. Course Instructors Mapping Table
DROP TABLE IF EXISTS `course_instructors`;
CREATE TABLE `course_instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `instructor_id` (`instructor_id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `course_instructors` (`instructor_id`, `course_id`) VALUES
(1, 1),
(2, 2),
(1, 3);

-- 6. Modules Table
DROP TABLE IF EXISTS `modules`;
CREATE TABLE `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `modules` (`id`, `course_id`, `title`, `order_index`) VALUES
(1, 1, 'Module 1: Java Core & Object Oriented Paradigms', 1),
(2, 1, 'Module 2: Spring Boot 3 & Microservice Architecture', 2),
(3, 1, 'Module 3: Cloud Infrastructure & Docker Deployment', 3),
(4, 2, 'Module 1: Python for Data Science & Numerical Computing', 1),
(5, 2, 'Module 2: Machine Learning Algorithms & Model Evaluation', 2),
(6, 2, 'Module 3: Deep Learning, LLMs & Retrieval Augmented Generation', 3),
(7, 3, 'Module 1: Modern TypeScript & React Architecture', 1),
(8, 3, 'Module 2: Fullstack Next.js App Router & Server Actions', 2),
(9, 3, 'Module 3: Production Microservices & Database Optimization', 3);

-- 7. Videos Table
DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `bunny_video_id` varchar(100) DEFAULT NULL,
  `duration` varchar(50) DEFAULT '45 mins',
  `order_index` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `videos` (`id`, `module_id`, `title`, `video_url`, `duration`, `order_index`) VALUES
(1, 1, '1.1 Deep Dive into JVM Architecture & Memory Model', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '42 mins', 1),
(2, 1, '1.2 Advanced Multithreading and Concurrency', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', '55 mins', 2),
(3, 2, '2.1 Spring Boot RESTful Microservice Design', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '48 mins', 1),
(4, 4, '1.1 Vectorized Math with NumPy & Matrix Transformations', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '50 mins', 1),
(5, 7, '1.1 Modern TypeScript Generics & Type Narrowing', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', '40 mins', 1);

-- 8. Enrollments Table (Test Student Enrolled in All 3 Courses)
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
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

INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `course`, `email`, `student_name`, `enrollment_code`, `payment_status`, `amount_paid`, `status`, `created_at`) VALUES
(1, 1, 1, 'Java Full Stack & Cloud Engineering', 'student@educationalgorithm.com', 'Test Student', 'EA-TEST-1-2026', 'active', 18000.00, 'active', NOW()),
(2, 1, 2, 'Data Science, Machine Learning & GenAI', 'student@educationalgorithm.com', 'Test Student', 'EA-TEST-2-2026', 'active', 18000.00, 'active', NOW()),
(3, 1, 3, 'Full Stack Web & Modern Frontend Architecture', 'student@educationalgorithm.com', 'Test Student', 'EA-TEST-3-2026', 'active', 18000.00, 'active', NOW());

-- 9. Checkout Intents Table
DROP TABLE IF EXISTS `enrollment_intents`;
CREATE TABLE `enrollment_intents` (
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

-- 10. Live Masterclasses / Webinars Table
DROP TABLE IF EXISTS `webinars`;
CREATE TABLE `webinars` (
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

INSERT INTO `webinars` (`id`, `title`, `course_id`, `instructor`, `meet_link`, `scheduled_at`, `duration_minutes`, `status`, `created_at`) VALUES
(1, 'System Design & High-Throughput Microservices Masterclass', 1, 'Dr. Arjun Mehta', 'https://meet.google.com/abc-defg-hij', DATE_ADD(NOW(), INTERVAL 3 DAY), 90, 'upcoming', NOW());

-- 11. Webinar Attendees Table
DROP TABLE IF EXISTS `webinar_attendees`;
CREATE TABLE `webinar_attendees` (
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

-- 12. Student Doubts Tickets & Replies
DROP TABLE IF EXISTS `doubt_tickets`;
CREATE TABLE `doubt_tickets` (
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

DROP TABLE IF EXISTS `doubt_replies`;
CREATE TABLE `doubt_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_role` varchar(30) NOT NULL DEFAULT 'instructor',
  `reply_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Progress, Bookmarks & Daily Streaks
DROP TABLE IF EXISTS `student_progress`;
CREATE TABLE `student_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_video` (`student_id`, `video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_bookmarks`;
CREATE TABLE `student_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_bookmark_video` (`student_id`, `video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `student_streaks`;
CREATE TABLE `student_streaks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `current_streak` int(11) NOT NULL DEFAULT 1,
  `max_streak` int(11) NOT NULL DEFAULT 1,
  `last_active_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `student_streaks` (`student_id`, `current_streak`, `max_streak`, `last_active_date`)
VALUES (1, 1, 1, CURDATE());

-- 14. Issued Certificates
DROP TABLE IF EXISTS `issued_certificates`;
CREATE TABLE `issued_certificates` (
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

-- 15. AI RAG Knowledge Store
DROP TABLE IF EXISTS `rag_knowledge_documents`;
CREATE TABLE `rag_knowledge_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Engineering',
  `content` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Mock Interviews
DROP TABLE IF EXISTS `mock_interviews`;
CREATE TABLE `mock_interviews` (
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

-- 17. Coupons / Scholarships
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
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

INSERT INTO `coupons` (`code`,`discount_type`,`discount_amount`,`max_uses`,`used_count`,`status`) VALUES
('WELCOME50', 'fixed', 5000.00, 500, 0, 'active'),
('CAREER2026', 'fixed', 8000.00, 500, 0, 'active'),
('EARLYBIRD', 'fixed', 3000.00, 500, 0, 'active');

-- 18. Admin Audit Logs
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL DEFAULT 1,
  `admin_name` varchar(150) NOT NULL DEFAULT 'Super Admin',
  `action_type` varchar(80) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(50) NOT NULL DEFAULT '127.0.0.1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
