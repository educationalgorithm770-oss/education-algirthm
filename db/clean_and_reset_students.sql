-- ==============================================================================
-- Education Algorithm — Student Data Reset & Single Test Student Creation
-- ==============================================================================
-- INSTRUCTIONS:
-- 1. In Hostinger phpMyAdmin (database: u200723621_sQRge), click the SQL tab.
-- 2. Paste and run this script.
-- 3. It will clear all previous student records, mock entries, and progress,
--    and create 1 clean active Test Student ready for testing.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Clear student-related activity and records
DELETE FROM `student_progress`;
DELETE FROM `student_bookmarks`;
DELETE FROM `student_streaks`;
DELETE FROM `doubt_replies` WHERE `user_role` = 'student';
DELETE FROM `doubt_tickets`;
DELETE FROM `mock_interviews`;
DELETE FROM `issued_certificates`;
DELETE FROM `enrollment_intents`;
DELETE FROM `enrollments`;
DELETE FROM `webinar_attendees`;
DELETE FROM `students`;

-- 2. Reset Auto-Increment Counters
ALTER TABLE `students` AUTO_INCREMENT = 1;
ALTER TABLE `enrollments` AUTO_INCREMENT = 1;
ALTER TABLE `enrollment_intents` AUTO_INCREMENT = 1;
ALTER TABLE `student_progress` AUTO_INCREMENT = 1;
ALTER TABLE `student_bookmarks` AUTO_INCREMENT = 1;
ALTER TABLE `student_streaks` AUTO_INCREMENT = 1;
ALTER TABLE `doubt_tickets` AUTO_INCREMENT = 1;
ALTER TABLE `doubt_replies` AUTO_INCREMENT = 1;
ALTER TABLE `mock_interviews` AUTO_INCREMENT = 1;
ALTER TABLE `issued_certificates` AUTO_INCREMENT = 1;
ALTER TABLE `webinar_attendees` AUTO_INCREMENT = 1;

-- 3. Insert 1 Test Student Account
-- Email:    student@educationalgorithm.com
-- Password: Student@1234
INSERT INTO `students` (`id`, `name`, `email`, `password`, `password_hash`, `phone`, `status`, `created_at`)
VALUES (
  1,
  'Test Student',
  'student@educationalgorithm.com',
  '$2b$10$qUlja2xlSxR/dzxyR9OGI.LrboZgsRA3Rp3qzCH38oxhEbHbp3k7m',
  '$2b$10$qUlja2xlSxR/dzxyR9OGI.LrboZgsRA3Rp3qzCH38oxhEbHbp3k7m',
  '+91 9876543210',
  'active',
  NOW()
);

-- 4. Enroll Test Student into all available courses
INSERT INTO `enrollments` (`student_id`, `course_id`, `course`, `email`, `student_name`, `enrollment_code`, `payment_status`, `amount_paid`, `status`, `created_at`)
SELECT 
  1, 
  c.id, 
  c.title, 
  'student@educationalgorithm.com', 
  'Test Student', 
  CONCAT('EA-TEST-', c.id, '-2026'), 
  'active', 
  18000.00, 
  'active', 
  NOW()
FROM `courses` c;

-- 5. Initialize Daily Streak for Test Student
INSERT INTO `student_streaks` (`student_id`, `current_streak`, `max_streak`, `last_active_date`)
VALUES (1, 1, 1, CURDATE())
ON DUPLICATE KEY UPDATE `current_streak` = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- DONE! Single Test Student is now active.
-- ==============================================================================
