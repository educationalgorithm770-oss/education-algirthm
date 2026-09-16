CREATE TABLE IF NOT EXISTS coding_challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
    time_limit_ms INT DEFAULT 2000,
    memory_limit_mb INT DEFAULT 256,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS challenge_test_cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    input TEXT,
    expected_output TEXT NOT NULL,
    is_hidden TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES coding_challenges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS code_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    challenge_id INT NOT NULL,
    language VARCHAR(32) NOT NULL,
    source_code MEDIUMTEXT NOT NULL,
    verdict VARCHAR(64) NOT NULL,
    execution_time_ms INT DEFAULT 0,
    memory_kb INT DEFAULT 0,
    passed_test_cases INT DEFAULT 0,
    total_test_cases INT DEFAULT 0,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_challenge (student_id, challenge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS execution_jobs (
    id VARCHAR(64) PRIMARY KEY,
    submission_id INT DEFAULT 0,
    student_id INT DEFAULT 0,
    status ENUM('QUEUED', 'ASSIGNED', 'RUNNING', 'COMPLETED', 'FAILED') DEFAULT 'QUEUED',
    worker_id VARCHAR(64) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
