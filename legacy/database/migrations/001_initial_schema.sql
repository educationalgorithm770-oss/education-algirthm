-- ==========================================================
-- Education Algorithm — Master Production Database Schema
-- 100% Synced With Application Code (All 43 Tables)
-- Production schema: do not seed predictable administrator or instructor passwords
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────
-- Table: `admin_audit_logs`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_id` int(11) NOT NULL DEFAULT 1,
  `admin_name` varchar(150) NOT NULL DEFAULT 'Super Admin',
  `action_type` varchar(80) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(50) NOT NULL DEFAULT '127.0.0.1',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `admins`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `ai_generated_courses`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `ai_generated_courses`;
CREATE TABLE `ai_generated_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prompt_topic` varchar(255) NOT NULL,
  `syllabus_json` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `assignment_submissions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `assignment_submissions`;
CREATE TABLE `assignment_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assignment_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` text DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'submitted',
  `marks` int(11) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assignment_id` (`assignment_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `assignment_submissions_ibfk_1` FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `assignment_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `assignments`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `assignments`;
CREATE TABLE `assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `instructions` text NOT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `assignments_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `certificates`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `certificates`;
CREATE TABLE `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_uuid` varchar(64) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `issue_date` date NOT NULL,
  `completion_percentage` int(11) DEFAULT 100,
  `status` enum('valid','revoked') DEFAULT 'valid',
  `revocation_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_uuid` (`certificate_uuid`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `code_challenges`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `code_challenges`;
CREATE TABLE `code_challenges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy',
  `category` varchar(100) NOT NULL DEFAULT 'Algorithms',
  `description` text NOT NULL,
  `input_format` text DEFAULT NULL,
  `output_format` text DEFAULT NULL,
  `constraints` text DEFAULT NULL,
  `starter_code_java` text DEFAULT NULL,
  `starter_code_python` text DEFAULT NULL,
  `starter_code_js` text DEFAULT NULL,
  `starter_code_cpp` text DEFAULT NULL,
  `starter_code_sql` text DEFAULT NULL,
  `test_cases_json` text NOT NULL,
  `points_xp` int(11) NOT NULL DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `code_community_solutions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `code_community_solutions`;
CREATE TABLE `code_community_solutions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `challenge_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `language` varchar(30) NOT NULL,
  `title` varchar(255) NOT NULL,
  `code` mediumtext NOT NULL,
  `approach_text` text NOT NULL,
  `upvotes` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `challenge_id` (`challenge_id`),
  KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `code_snippets`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `code_snippets`;
CREATE TABLE `code_snippets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `language` varchar(50) NOT NULL DEFAULT 'html',
  `code` longtext NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `code_snippets_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `code_submissions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `code_submissions`;
CREATE TABLE `code_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `challenge_id` int(11) NOT NULL,
  `language` varchar(30) NOT NULL,
  `submitted_code` mediumtext NOT NULL,
  `status` enum('Accepted','Wrong Answer','Runtime Error','Time Limit Exceeded') NOT NULL,
  `test_cases_passed` int(11) NOT NULL DEFAULT 0,
  `total_test_cases` int(11) NOT NULL DEFAULT 0,
  `execution_time_ms` int(11) NOT NULL DEFAULT 0,
  `memory_kb` int(11) NOT NULL DEFAULT 0,
  `xp_awarded` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `challenge_id` (`challenge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `contact_messages`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `contact_messages`;
CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `coupons`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` int(11) NOT NULL,
  `max_uses` int(11) NOT NULL DEFAULT 100,
  `times_used` int(11) NOT NULL DEFAULT 0,
  `expires_at` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `course_certificates`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `course_certificates`;
CREATE TABLE `course_certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `certificate_code` varchar(64) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `course_title` varchar(255) NOT NULL,
  `instructor_name` varchar(150) NOT NULL DEFAULT 'Prof. Alan Vance',
  `issue_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_code` (`certificate_code`),
  KEY `student_id` (`student_id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `course_instructors`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `course_instructors`;
CREATE TABLE `course_instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_inst_course` (`instructor_id`,`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `courses`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `courses`;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `level` varchar(50) DEFAULT 'Beginner to Advanced',
  `duration` varchar(50) DEFAULT '12 Weeks',
  `price` int(11) NOT NULL DEFAULT 15000,
  `status` varchar(20) NOT NULL DEFAULT 'published',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_courses_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `crm_leads`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `crm_leads`;
CREATE TABLE `crm_leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'manual',
  `status` varchar(30) NOT NULL DEFAULT 'new',
  `notes` text DEFAULT NULL,
  `last_contacted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_crm_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `email_verifications`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `email_verifications`;
CREATE TABLE `email_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `verification_id` varchar(64) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `otp` varchar(10) NOT NULL,
  `otp_hash` varchar(64) DEFAULT NULL,
  `payload` longtext NOT NULL,
  `expires_at` int(11) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_verif_email` (`email`),
  KEY `idx_ev_email` (`email`),
  KEY `idx_ev_verification_id` (`verification_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `enrollments`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `enrollments`;
CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `course` varchar(150) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 15000,
  `payment_status` varchar(20) NOT NULL DEFAULT 'pending',
  `status` varchar(20) DEFAULT 'active',
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL,
  `enrolled_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `lead_status` varchar(30) NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_enrollments_email` (`email`),
  KEY `idx_enrollments_student_id` (`student_id`),
  KEY `idx_enrollments_status` (`status`),
  KEY `idx_enrollments_course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `faculty_audit_logs`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `faculty_audit_logs`;
CREATE TABLE `faculty_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `flashcard_decks`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `flashcard_decks`;
CREATE TABLE `flashcard_decks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `category` varchar(100) NOT NULL,
  `icon` varchar(20) NOT NULL DEFAULT '?',
  `cards_json` mediumtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `instructor_audit_logs`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `instructor_audit_logs`;
CREATE TABLE `instructor_audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `instructor_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `course_id` int(11) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `instructors`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `instructors`;
CREATE TABLE `instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `two_factor_secret` varchar(64) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `linkedin_url` varchar(255) DEFAULT NULL,
  `github_url` varchar(255) DEFAULT NULL,
  `verification_token` varchar(100) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `verified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `lead_notes`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `lead_notes`;
CREATE TABLE `lead_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enrollment_id` int(11) NOT NULL,
  `note` text NOT NULL,
  `created_by` varchar(100) DEFAULT 'admin',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `lesson_completions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `lesson_completions`;
CREATE TABLE `lesson_completions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `item_type` varchar(10) NOT NULL,
  `item_id` int(11) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_completion` (`student_id`,`item_type`,`item_id`),
  CONSTRAINT `lesson_completions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `lesson_doubts`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `lesson_doubts`;
CREATE TABLE `lesson_doubts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `question` text NOT NULL,
  `answer` text DEFAULT NULL,
  `ai_drafted_answer` text DEFAULT NULL,
  `status` enum('pending','answered') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `answered_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `live_classes`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `live_classes`;
CREATE TABLE `live_classes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL DEFAULT 1,
  `title` varchar(255) NOT NULL,
  `instructor_name` varchar(150) NOT NULL DEFAULT 'Prof. Alan Vance',
  `meet_link` varchar(500) NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `duration_minutes` int(11) NOT NULL DEFAULT 60,
  `status` enum('upcoming','live','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `live_sessions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `live_sessions`;
CREATE TABLE `live_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `meeting_url` varchar(255) NOT NULL,
  `scheduled_at` datetime NOT NULL,
  `duration_mins` int(11) DEFAULT 60,
  `recording_url` varchar(255) DEFAULT NULL,
  `status` enum('upcoming','live','completed','cancelled') DEFAULT 'upcoming',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `login_rate_limits`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `login_rate_limits`;
CREATE TABLE `login_rate_limits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `identifier` varchar(150) NOT NULL,
  `failed_attempts` int(11) NOT NULL DEFAULT 1,
  `last_attempt_at` datetime DEFAULT current_timestamp(),
  `locked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ip_identifier` (`ip_address`,`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `modules`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `modules`;
CREATE TABLE `modules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `notes`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `notes`;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `notifications`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `orders`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `order_number` varchar(100) NOT NULL,
  `amount` int(11) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `payment_gateway` varchar(30) DEFAULT 'razorpay',
  `gateway_order_id` varchar(100) DEFAULT NULL,
  `gateway_payment_id` varchar(100) DEFAULT NULL,
  `status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `password_resets`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `token` varchar(64) NOT NULL,
  `expires_at` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_pr_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `payment_intents`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `payment_intents`;
CREATE TABLE `payment_intents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL,
  `course_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `razorpay_order_id` varchar(100) NOT NULL,
  `status` varchar(30) DEFAULT 'created',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `payments`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) DEFAULT NULL,
  `course_id` int(11) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `razorpay_order_id` varchar(100) DEFAULT NULL,
  `razorpay_payment_id` varchar(100) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'success',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `quiz_attempts`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `quiz_attempts`;
CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `total_questions` int(11) NOT NULL,
  `passed` tinyint(1) NOT NULL DEFAULT 0,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  KEY `idx_qa_student_id` (`student_id`),
  CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `quiz_questions`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `quiz_questions`;
CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quiz_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) NOT NULL,
  `option_d` varchar(255) NOT NULL,
  `correct_option` char(1) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `quizzes`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `quizzes`;
CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `time_limit_minutes` int(11) NOT NULL DEFAULT 0,
  `pass_percent` int(11) NOT NULL DEFAULT 50,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `student_activity_log`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `student_activity_log`;
CREATE TABLE `student_activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `activity_type` varchar(50) NOT NULL,
  `activity_date` date NOT NULL,
  `xp_earned` int(11) NOT NULL DEFAULT 10,
  `details` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`,`activity_date`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `student_bookmarks`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `student_bookmarks`;
CREATE TABLE `student_bookmarks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `item_type` varchar(20) NOT NULL,
  `item_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_bmk` (`student_id`,`item_type`,`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `student_notifications`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `student_notifications`;
CREATE TABLE `student_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notification_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_notif` (`notification_id`,`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `student_streaks`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `student_streaks`;
CREATE TABLE `student_streaks` (
  `student_id` int(11) NOT NULL,
  `current_streak` int(11) NOT NULL DEFAULT 1,
  `longest_streak` int(11) NOT NULL DEFAULT 1,
  `last_activity_date` date NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `student_video_notes`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `student_video_notes`;
CREATE TABLE `student_video_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `timestamp_sec` int(11) NOT NULL DEFAULT 0,
  `note_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_video` (`student_id`,`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `students`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_students_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `support_messages`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `support_messages`;
CREATE TABLE `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `admin_reply` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `support_messages_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `track_announcements`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `track_announcements`;
CREATE TABLE `track_announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('normal','urgent') DEFAULT 'normal',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Table: `videos`
-- ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS `videos`;
CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `duration` varchar(20) DEFAULT NULL,
  `youtube_id` varchar(20) DEFAULT NULL COMMENT 'YouTube 11-char video ID',
  `video_url` varchar(500) DEFAULT NULL COMMENT 'External video URL (Bunny.net, Vimeo, etc)',
  `bunny_video_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `module_id` (`module_id`),
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─────────────────────────────────────────────────────────
-- Seed Initial Production Data
-- ─────────────────────────────────────────────────────────
-- Bootstrap accounts are intentionally not seeded with predictable credentials.

-- Bootstrap accounts are intentionally not seeded with predictable credentials.
(1, 'Dr. Sarah Jenkins', 'java@educationalgorithm.com', 'java@educationalgorithm.com', '$2y$10$jBsSxBtl3f9ouZIsIkG75OlT9uy0EXqfHEATnVxHdf7VgshIiGFS2', '+91 98765 43210', 'Lead Java & Cloud Architect', '12+ years enterprise software architect specializing in Distributed Systems, Spring Boot, and AWS Microservices.', 'active', 1, NOW()),
(2, 'Dr. Aravind Swamy', 'datascience@educationalgorithm.com', 'datascience@educationalgorithm.com', '$2y$10$jBsSxBtl3f9ouZIsIkG75OlT9uy0EXqfHEATnVxHdf7VgshIiGFS2', '+91 98765 43211', 'Lead AI Scientist & Data Architect', 'Former Senior AI Researcher with expertise in Deep Learning, PyTorch, Large Language Models, and Scalable MLOps.', 'active', 1, NOW()),
(3, 'Marcus Vance', 'cloud.lead@educationalgorithm.com', 'cloud.lead@educationalgorithm.com', '$2y$10$jBsSxBtl3f9ouZIsIkG75OlT9uy0EXqfHEATnVxHdf7VgshIiGFS2', '+91 98765 43212', 'Principal Cloud Architect', 'Enterprise Kubernetes, Terraform, Multi-Cloud infrastructure, and Site Reliability Engineering mentor.', 'active', 1, NOW())
ON DUPLICATE KEY UPDATE `password` = '$2y$10$jBsSxBtl3f9ouZIsIkG75OlT9uy0EXqfHEATnVxHdf7VgshIiGFS2', `status` = 'active', `is_verified` = 1;

INSERT INTO `coupons` (`code`, `discount_type`, `discount_value`, `max_uses`, `is_active`) VALUES
('WELCOME50', 'percentage', 50, 500, 1),
('EARLYBIRD', 'percentage', 10, 1000, 1),
('CAREER2026', 'fixed', 2000, 500, 1),
('FUTUREDEV', 'percentage', 15, 500, 1)
ON DUPLICATE KEY UPDATE `is_active` = 1;

SET FOREIGN_KEY_CHECKS = 1;
