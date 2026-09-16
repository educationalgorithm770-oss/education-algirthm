<?php
/**
 * Security & Input Validation Library
 * Education Algorithm Platform
 * 
 * Provides centralized, robust sanitization and validation functions
 * against XSS, SQLi, payload bloat/DoS, and malicious script vectors.
 */

if (!defined('APP_VALIDATION_LOADED')) {
    define('APP_VALIDATION_LOADED', true);

    /**
     * Strip HTML tags, remove null bytes, trim whitespace and clamp length.
     */
    function clean_text(?string $input, int $maxLength = 255): string {
        if ($input === null) return '';
        // Remove null bytes
        $cleaned = str_replace(chr(0), '', $input);
        // Strip HTML tags
        $cleaned = strip_tags($cleaned);
        // Trim whitespace
        $cleaned = trim($cleaned);
        // Clamp UTF-8 length
        if (mb_strlen($cleaned, 'UTF-8') > $maxLength) {
            $cleaned = mb_substr($cleaned, 0, $maxLength, 'UTF-8');
        }
        return $cleaned;
    }

    /**
     * Validate email format and length.
     * Returns sanitized email or false if invalid.
     */
    function validate_email_input(?string $email, int $maxLength = 191): string|false {
        if ($email === null) return false;
        $email = trim(str_replace(chr(0), '', $email));
        if (empty($email) || mb_strlen($email, 'UTF-8') > $maxLength) {
            return false;
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return false;
        }
        // Additional protection against header injection / newlines
        if (preg_match('/[\r\n]/', $email)) {
            return false;
        }
        return $email;
    }

    /**
     * Validate and normalize phone numbers.
     * Returns normalized phone string or false if invalid.
     */
    function validate_phone_input(?string $phone, int $minDigits = 7, int $maxDigits = 15): string|false {
        if ($phone === null) return false;
        $phone = trim(str_replace(chr(0), '', $phone));
        if (empty($phone)) return false;
        
        // Match standard phone format (digits, +, spaces, dashes, parentheses)
        if (!preg_match('/^[+]?[0-9\s\-().]{7,25}$/', $phone)) {
            return false;
        }
        // Check actual numeric digit count
        $digitsOnly = preg_replace('/[^0-9]/', '', $phone);
        $len = strlen($digitsOnly);
        if ($len < $minDigits || $len > $maxDigits) {
            return false;
        }
        // Return normalized format (preserving + if international)
        $hasPlus = str_starts_with($phone, '+');
        return ($hasPlus ? '+' : '') . $digitsOnly;
    }

    /**
     * Validate username for admin/instructors.
     */
    function validate_username_input(?string $username, int $minLength = 3, int $maxLength = 60): string|false {
        if ($username === null) return false;
        $username = trim(str_replace(chr(0), '', $username));
        $len = mb_strlen($username, 'UTF-8');
        if ($len < $minLength || $len > $maxLength) {
            return false;
        }
        // Whitelist alphanumeric, underscore, dot, dash, and @
        if (!preg_match('/^[a-zA-Z0-9_\-\.@]+$/', $username)) {
            return false;
        }
        return $username;
    }

    /**
     * Validate and constrain integer inputs within a specific range.
     */
    function validate_integer_range(mixed $val, int $min = 0, int $max = PHP_INT_MAX, ?int $default = 0): ?int {
        if ($val === null || $val === '') return $default;
        $filtered = filter_var($val, FILTER_VALIDATE_INT);
        if ($filtered === false) return $default;
        if ($filtered < $min) return $min;
        if ($filtered > $max) return $max;
        return $filtered;
    }

    /**
     * Validate and constrain float inputs within a specific range.
     */
    function validate_float_range(mixed $val, float $min = 0.0, float $max = 10000000.0, ?float $default = 0.0): ?float {
        if ($val === null || $val === '') return $default;
        $filtered = filter_var($val, FILTER_VALIDATE_FLOAT);
        if ($filtered === false) return $default;
        if ($filtered < $min) return $min;
        if ($filtered > $max) return $max;
        return round($filtered, 2);
    }

    /**
     * Whitelist-based HTML sanitizer for rich text / module notes / lessons.
     * Neutralizes XSS, event handlers (onclick, onerror, etc.), javascript: URIs,
     * iframe/embed/script injection.
     */
    function sanitize_rich_html(?string $html, int $maxLength = 50000): string {
        if ($html === null) return '';
        $html = str_replace(chr(0), '', $html);
        if (mb_strlen($html, 'UTF-8') > $maxLength) {
            $html = mb_substr($html, 0, $maxLength, 'UTF-8');
        }

        // Allowed tags
        $allowedTags = '<p><br><strong><b><em><i><u><h1><h2><h3><h4><h5><h6><ul><ol><li><code><pre><blockquote><a><table><thead><tbody><tr><th><td><span><div><img><hr>';
        $cleaned = strip_tags($html, $allowedTags);

        // Remove dangerous attributes like onerror, onload, onclick, onmouseover, etc.
        $cleaned = preg_replace('/\s*on[a-zA-Z]+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)/i', '', $cleaned);

        // Neutralize javascript: and vbscript: and data: URIs in href and src
        $cleaned = preg_replace('/(href|src)\s*=\s*("|\')\s*(?:javascript|vbscript|data):[^\'"]*("|\')/i', '$1="#"', $cleaned);

        return $cleaned;
    }

    /**
     * Anti-spam / rate-limiting throttle for public POST requests (e.g. contact form, comments).
     * Returns true if allowed, or remaining cooldown seconds if throttled.
     */
    function check_action_rate_limit(string $action, int $maxAttempts = 5, int $decaySeconds = 60): true|int {
        global $pdo;
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $key = 'rate_' . $action . '_' . hash('sha256', $ip);
        $now = date('Y-m-d H:i:s');
        try {
            if (!$pdo->inTransaction()) $pdo->beginTransaction();
            $stmt = $pdo->prepare("SELECT id, request_count, window_start FROM rate_limits WHERE rate_key = ? AND action = ? FOR UPDATE");
            $stmt->execute([$key, $action]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                $pdo->prepare("INSERT INTO rate_limits (rate_key, action, request_count, window_start) VALUES (?, ?, 1, ?)")->execute([$key, $action, $now]);
                $allowed = true;
            } else {
                $age = time() - strtotime($row['window_start']);
                if ($age >= $decaySeconds) {
                    $pdo->prepare("UPDATE rate_limits SET request_count=1, window_start=? WHERE id=?")->execute([$now, $row['id']]);
                    $allowed = true;
                } elseif ((int)$row['request_count'] >= $maxAttempts) {
                    $allowed = max(1, $decaySeconds - $age);
                } else {
                    $pdo->prepare("UPDATE rate_limits SET request_count=request_count+1 WHERE id=?")->execute([$row['id']]);
                    $allowed = true;
                }
            }
            if ($pdo->inTransaction()) $pdo->commit();
            return $allowed;
        } catch (Throwable $e) {
            if (isset($pdo) && $pdo && $pdo->inTransaction()) $pdo->rollBack();
            error_log('Action rate limiter error: ' . $e->getMessage());
            return true;
        }
    }
}
