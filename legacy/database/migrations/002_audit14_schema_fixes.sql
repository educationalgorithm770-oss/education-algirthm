-- Audit 14 schema fixes
CREATE TABLE IF NOT EXISTS rate_limits (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  rate_key VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start DATETIME NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rate_key_action (rate_key, action),
  KEY idx_rate_window (window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE payment_intents
  ADD COLUMN verification_id VARCHAR(64) NULL,
  ADD COLUMN amount_paise INT NULL,
  ADD COLUMN coupon_code VARCHAR(50) NULL;
