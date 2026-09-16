CREATE TABLE IF NOT EXISTS code_solution_votes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  solution_id INT NOT NULL,
  student_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_solution_student_vote (solution_id, student_id),
  KEY idx_vote_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
