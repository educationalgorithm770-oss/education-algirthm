-- ==============================================================================
-- Education Algorithm — Complete Production Seed Script
-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Seed Super Admin Account
INSERT INTO `admins` (`id`, `username`, `password`, `created_at`) VALUES
(1, 'admin@educationalgorithm.com', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', NOW()),
(2, 'admin', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', NOW())
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`);

-- 2. Seed Lead Instructor / Faculty Account
INSERT INTO `instructors` (`id`, `username`, `name`, `email`, `password`, `title`, `bio`, `status`, `created_at`) VALUES
(1, 'faculty', 'Dr. Sarah Jenkins', 'faculty@educationalgorithm.com', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', 'Lead Systems Architect & Faculty', 'Ex-Google SRE, Distributed Systems Specialist', 'active', NOW()),
(2, 'sarah', 'Dr. Sarah Jenkins', 'sarah@educationalgorithm.com', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', 'Lead Systems Architect & Faculty', 'Ex-Google SRE, Distributed Systems Specialist', 'active', NOW())
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `status` = 'active';

-- 3. Seed Student Account
INSERT INTO `students` (`id`, `name`, `email`, `password`, `password_hash`, `phone`, `status`, `created_at`) VALUES
(1, 'Alex Mercer', 'student@educationalgorithm.com', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', '$2a$10$wN1eK4wP9b0h0sQ5aR3F4.vKjD1yU8t3GZ0l0lM6/oH8vQW9tX7zG', '+919876543210', 'active', NOW())
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `status` = 'active';

-- 4. Seed Courses
INSERT INTO `courses` (`id`, `title`, `slug`, `description`, `price`, `duration`, `level`, `thumbnail`, `status`, `created_at`) VALUES
(1, 'Java Full Stack & Cloud Engineering', 'java-full-stack', 'Master modern enterprise Java, Spring Boot microservices, Docker, Kubernetes, AWS cloud architectures, and high-performance system design.', 20000.00, '16 Weeks Live', 'Intermediate to Advanced', '/images/courses/java.jpg', 'published', NOW()),
(2, 'Data Science, Machine Learning & GenAI', 'data-science-ml', 'Deep dive into Python, Pandas, Machine Learning pipelines, Deep Learning, Generative AI models, and production MLOps deployment.', 18000.00, '20 Weeks Live', 'Beginner to Advanced', '/images/courses/data-science.jpg', 'published', NOW()),
(3, 'DevOps & Multi-Cloud Architecture', 'devops-cloud', 'Master Terraform, Ansible, CI/CD pipelines, Kubernetes cluster orchestration, and SRE best practices.', 18000.00, '14 Weeks Live', 'Advanced Architecture', '/images/courses/web-dev.jpg', 'published', NOW())
ON DUPLICATE KEY UPDATE `status` = 'published', `price` = VALUES(`price`), `title` = VALUES(`title`);

-- 5. Course Instructors Mapping
INSERT INTO `course_instructors` (`id`, `instructor_id`, `course_id`, `assigned_at`) VALUES
(1, 1, 1, NOW()),
(2, 1, 2, NOW()),
(3, 1, 3, NOW())
ON DUPLICATE KEY UPDATE `course_id` = VALUES(`course_id`);

-- 6. Modules
INSERT INTO `modules` (`id`, `course_id`, `title`, `order_index`, `created_at`) VALUES
(1, 1, 'Module 1: Java Core, JVM Internals & Memory Model', 1, NOW()),
(2, 1, 'Module 2: Spring Boot 3 & High-Throughput Microservices', 2, NOW()),
(3, 1, 'Module 3: Cloud Infrastructure, Docker & Kubernetes', 3, NOW()),
(4, 2, 'Module 1: Python for Data Science & Vectorized Math', 1, NOW()),
(5, 2, 'Module 2: Machine Learning Algorithms & Deep Learning', 2, NOW()),
(6, 2, 'Module 3: Generative AI, LLMs & Retrieval Augmented Generation', 3, NOW()),
(7, 3, 'Module 1: Linux Fundamentals, Networking & Shell Scripting', 1, NOW()),
(8, 3, 'Module 2: Docker Containers & Kubernetes Orchestration', 2, NOW()),
(9, 3, 'Module 3: Terraform Infrastructure as Code & AWS Cloud', 3, NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 7. Videos
INSERT INTO `videos` (`id`, `module_id`, `title`, `video_url`, `bunny_video_id`, `duration`, `order_index`, `created_at`) VALUES
(1, 1, '1.1 Deep Dive into JVM Architecture & Memory Allocation', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, '42 mins', 1, NOW()),
(2, 1, '1.2 Java 21 Virtual Threads & Concurrency Benchmarks', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', NULL, '55 mins', 2, NOW()),
(3, 2, '2.1 Spring Boot RESTful Microservice Architecture', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', NULL, '48 mins', 1, NOW()),
(4, 4, '1.1 NumPy Matrix Operations & Vectorized Transformations', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, '50 mins', 1, NOW()),
(5, 7, '1.1 Linux Kernel Architecture, Namespaces & Cgroups', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', NULL, '40 mins', 1, NOW())
ON DUPLICATE KEY UPDATE `title` = VALUES(`title`);

-- 8. Enrollments (Enroll student into all 3 courses for full access)
INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `course`, `email`, `student_name`, `enrollment_code`, `payment_status`, `amount_paid`, `status`, `created_at`) VALUES
(1, 1, 1, 'Java Full Stack & Cloud Engineering', 'student@educationalgorithm.com', 'Alex Mercer', 'ENR-JAVA-2026-001', 'completed', 20000.00, 'active', NOW()),
(2, 1, 2, 'Data Science, Machine Learning & GenAI', 'student@educationalgorithm.com', 'Alex Mercer', 'ENR-DS-2026-002', 'completed', 18000.00, 'active', NOW()),
(3, 1, 3, 'DevOps & Multi-Cloud Architecture', 'student@educationalgorithm.com', 'Alex Mercer', 'ENR-OPS-2026-003', 'completed', 18000.00, 'active', NOW())
ON DUPLICATE KEY UPDATE `status` = 'active';

-- 9. Live Masterclasses
INSERT INTO `webinars` (`id`, `title`, `course_id`, `instructor`, `meet_link`, `scheduled_at`, `duration_minutes`, `status`) VALUES
(1, 'Mastering Java 21 Virtual Threads & Spring Boot 3 Microservices', 1, 'Dr. Aris V.', 'https://meet.google.com/abc-defg-hij', DATE_ADD(NOW(), INTERVAL 2 DAY), 90, 'upcoming'),
(2, 'Building Agentic RAG Systems with Gemini & Vector DBs', 2, 'Dr. Sarah Jenkins', 'https://meet.google.com/xyz-uvwx-rst', DATE_ADD(NOW(), INTERVAL 3 DAY), 90, 'upcoming')
ON DUPLICATE KEY UPDATE `status` = 'upcoming';

SET FOREIGN_KEY_CHECKS = 1;
