<?php
// Secure Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    $configuredUrlForCookie = getenv('APP_URL') ?: ($_ENV['APP_URL'] ?? '');
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) || stripos((string)$configuredUrlForCookie, 'https://') === 0;
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'domain' => '',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
    // Zero-Trust Session Fingerprint Guard (Normalized for IPv6 / Localhost)
    if (!empty($_SESSION['student_id']) || !empty($_SESSION['admin_id']) || !empty($_SESSION['instructor_id'])) {
        $rawIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        if ($rawIp === '::1' || $rawIp === '127.0.0.1') {
            $rawIp = '127.0.0.1';
        }
        $currentUa = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown_ua';
        $currentFp = hash('sha256', $currentUa);

        if (empty($_SESSION['_sec_fingerprint'])) {
            $_SESSION['_sec_fingerprint'] = $currentFp;
        } elseif (!hash_equals((string)$_SESSION['_sec_fingerprint'], $currentFp)) {
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
        }
    }
}

// Set Application Default Timezone (India Standard Time / Asia/Kolkata)
date_default_timezone_set('Asia/Kolkata');

// Load Security Validation & Mail Helpers
require_once __DIR__ . '/includes/validation.php';
require_once __DIR__ . '/includes/mail.php';

// HTTP Security Headers
if (!headers_sent()) {
    header("X-Frame-Options: SAMEORIGIN");
    header("X-Content-Type-Options: nosniff");
    header("X-XSS-Protection: 1; mode=block");
    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        header("Strict-Transport-Security: max-age=31536000; includeSubDomains");
    }
    header("Referrer-Policy: strict-origin-when-cross-origin");
    header("Content-Security-Policy: default-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.razorpay.com https://checkout.razorpay.com https://www.googletagmanager.com https://*.clarity.ms https://www.clarity.ms https://cdn.jsdelivr.net https://accounts.google.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; frame-src 'self' https://*.razorpay.com https://api.razorpay.com https://checkout.razorpay.com https://www.youtube.com https://www.youtube-nocookie.com https://iframe.mediadelivery.net https://*.b-cdn.net https://accounts.google.com; connect-src 'self' https://*.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://generativelanguage.googleapis.com https://checkout.razorpay.com https://www.google-analytics.com https://analytics.google.com https://*.google-analytics.com https://stats.g.doubleclick.net https://video.bunnycdn.com https://*.clarity.ms https://www.clarity.ms https://c.bing.com https://cdn.jsdelivr.net https://accounts.google.com;");
}

// Load .env variables if file exists
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if (empty($line) || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (!isset($_SERVER[$key]) && !isset($_ENV[$key])) {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }
}

loadEnv(__DIR__ . '/.env');

// Helper to get env variable with fallback
function env($key, $default = null) {
    $val = getenv($key);
    if ($val !== false) return $val;
    if (isset($_ENV[$key])) return $_ENV[$key];
    if (isset($_SERVER[$key])) return $_SERVER[$key];
    return $default;
}

// Environment Detection
$isLocalEnv = php_sapi_name() === 'cli' || in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1', '192.168.1.8'], true) || str_starts_with($_SERVER['HTTP_HOST'] ?? '', 'localhost:');

// Database Credentials
if ($isLocalEnv) {
    $db_host = env('DB_HOST', 'localhost');
    $db_name = env('DB_NAME', 'education_local');
    $db_user = env('DB_USER', 'root');
    $db_pass = env('DB_PASSWORD', '');
} else {
    $db_host = env('DB_HOST', 'localhost');
    $db_name = env('DB_NAME', 'u200723621_sQRge');
    $db_user = env('DB_USER', 'u200723621_Qf7Y9');
    $db_pass = env('DB_PASSWORD', '');
}

// Integrations (Loaded from environment / .env with safe development defaults)
if (!defined('RAZORPAY_KEY_ID')) define('RAZORPAY_KEY_ID', env('RAZORPAY_KEY_ID', ''));
if (!defined('RAZORPAY_KEY_SECRET')) define('RAZORPAY_KEY_SECRET', env('RAZORPAY_KEY_SECRET', ''));
if (!defined('GEMINI_API_KEY')) define('GEMINI_API_KEY', env('GEMINI_API_KEY', ''));

// SMTP Email Configuration
if (!defined('SMTP_HOST')) define('SMTP_HOST', env('SMTP_HOST', 'smtp.sendgrid.net'));
if (!defined('SMTP_PORT')) define('SMTP_PORT', (int)env('SMTP_PORT', 587));
if (!defined('SMTP_USER')) define('SMTP_USER', env('SMTP_USER', 'apikey'));
if (!defined('SMTP_PASS')) define('SMTP_PASS', env('SMTP_PASS', ''));
if (!defined('SMTP_FROM')) define('SMTP_FROM', env('SMTP_FROM', 'noreply@educationalgorithm.com'));
if (!defined('SMTP_FROM_NAME')) define('SMTP_FROM_NAME', env('SMTP_FROM_NAME', 'Education Algorithm'));

// Application Environment & Explicit Base URL (Issue 6)
if (!defined('APP_ENV')) define('APP_ENV', env('APP_ENV', $isLocalEnv ? 'development' : 'production'));

// In production, APP_URL must be explicitly configured to avoid Host Header poisoning
$configuredAppUrl = env('APP_URL', $isLocalEnv ? '' : 'https://educationalgorithm.com');
if (!empty($configuredAppUrl)) {
    if (!defined('APP_URL')) define('APP_URL', rtrim($configuredAppUrl, '/'));
} else {
    $detectedProto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
    $detectedHost  = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $detectedDir   = isset($_SERVER['SCRIPT_NAME']) ? str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])) : '';
    $defaultAppUrl = rtrim($detectedProto . $detectedHost . ($detectedDir !== '/' && $detectedDir !== '.' ? $detectedDir : ''), '/');
    if (!defined('APP_URL')) define('APP_URL', $defaultAppUrl ?: 'https://educationalgorithm.com');
}

// Database Connection with PDO
$connected = false;
$lastError = null;

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    $connected = true;
} catch (PDOException $e) {
    $lastError = $e;
    // If running on localhost and hostinger DB fail, attempt local XAMPP database fallback
    if ($isLocalEnv) {
        try {
            $pdo = new PDO("mysql:host=localhost;dbname=education_local;charset=utf8mb4", "root", "", [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
            $connected = true;
        } catch (PDOException $e2) {
            $lastError = $e2;
        }
    }
}

if (!$connected) {
    error_log("Database connection error: " . ($lastError ? $lastError->getMessage() : 'Unknown error'));
    $isApiCall = str_contains($_SERVER['REQUEST_URI'] ?? '', 'api-') || str_contains($_SERVER['SCRIPT_NAME'] ?? '', 'api-') || (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'));
    if ($isApiCall) {
        if (!headers_sent()) {
            header("Content-Type: application/json; charset=UTF-8");
        }
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database Connection Notice: Could not connect to MySQL database (" . $db_name . ").",
            "message" => $lastError ? $lastError->getMessage() : "Database connection failed"
        ]);
        exit;
    }
    die("<div style='font-family:system-ui, -apple-system, sans-serif; max-width:600px; margin:50px auto; padding:24px; border:1px solid #e2e8f0; border-radius:14px; background:#ffffff; color:#1e293b; box-shadow:0 10px 25px rgba(0,0,0,0.05);'>" .
        "<h3 style='color:#ef4444; margin-top:0; font-size:18px;'>⚠️ Database Connection Notice</h3>" .
        "<p style='font-size:14px; line-height:1.6;'>The application could not connect to MySQL database <strong>" . htmlspecialchars($db_name) . "</strong> with user <strong>" . htmlspecialchars($db_user) . "</strong>.</p>" .
        "<div style='background:#fef2f2; padding:12px 14px; border-radius:8px; font-family:monospace; font-size:13px; color:#b91c1c; margin:16px 0; border:1px solid #fecaca; word-break:break-all;'>" .
        htmlspecialchars($lastError ? $lastError->getMessage() : 'Access Denied') .
        "</div>" .
        "<div style='font-size:13px; color:#475569; line-height:1.6; background:#f8fafc; padding:14px; border-radius:8px; border:1px solid #e2e8f0;'>" .
        "<strong style='color:#0f172a;'>How to fix on Hostinger (1 minute):</strong><br>" .
        "1. Log in to <strong>Hostinger hPanel</strong> &rarr; <strong>Databases</strong> &rarr; <strong>Management</strong>.<br>" .
        "2. Under <strong>MySQL Databases</strong>, find database <code>" . htmlspecialchars($db_name) . "</code>.<br>" .
        "3. If the password was different, click the <strong>⋮ (three dots)</strong> next to user <code>" . htmlspecialchars($db_user) . "</code> &rarr; <strong>Change Password</strong> &rarr; set it to <code>" . htmlspecialchars($db_pass) . "</code>.<br>" .
        "4. Refresh this page." .
        "</div>" .
        "</div>");
}

// CSRF Protection Functions
function csrf_token() {
    static $cookieSet = false;

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    // Set a cookie so static HTML pages can read it for AJAX requests.
    // Only attempt this once per request, and only if output hasn't
    // started yet — calling setcookie() after HTML has been echoed
    // (e.g. by admin-nav.php) triggers a "headers already sent" warning
    // on every subsequent call otherwise.
    if (!$cookieSet && !headers_sent()) {
        setcookie("csrf_token", $_SESSION['csrf_token'], [
            'expires' => 0,
            'path' => '/',
            'secure' => isset($_SERVER['HTTPS']),
            'httponly' => false,
            'samesite' => 'Lax'
        ]);
        $cookieSet = true;
    }
    return $_SESSION['csrf_token'];
}

function csrf_field() {
    return '<input type="hidden" name="csrf_token" value="' . htmlspecialchars(csrf_token()) . '">';
}

function verify_csrf() {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_COOKIE['csrf_token'] ?? '';
    if (empty($token)) {
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $json = json_decode($raw, true);
            if (is_array($json) && !empty($json['csrf_token'])) {
                $token = $json['csrf_token'];
            }
        }
    }
    
    if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals((string)$_SESSION['csrf_token'], (string)$token)) {
        http_response_code(403);
        $isApiCall = (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) || 
                     (isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'application/json')) ||
                     str_contains($_SERVER['REQUEST_URI'] ?? '', 'api-') ||
                     str_contains($_SERVER['SCRIPT_NAME'] ?? '', 'api-');
        if ($isApiCall) {
            if (!headers_sent()) {
                header("Content-Type: application/json; charset=UTF-8");
            }
            echo json_encode(["success" => false, "error" => "Security validation failed (Invalid or missing CSRF token). Please refresh the page and try again."]);
            exit;
        }
        die("Security validation failed (Invalid or missing CSRF token). Please refresh and try again.");
    }
    return true;
}

// Helper to sanitize text output
function e($str) {
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}

// Login Rate Limiting & Lockout Functions — persistent DB-backed protection
function check_login_rate_limit($loginType) {
    global $pdo;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $identifier = strtolower(clean_text((string)$loginType, 100));
    try {
        $stmt = $pdo->prepare("SELECT failed_attempts, last_attempt_at, locked_until FROM login_rate_limits WHERE ip_address = ? AND identifier = ? LIMIT 1");
        $stmt->execute([$ip, $identifier]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return 0;
        if (!empty($row['locked_until']) && strtotime($row['locked_until']) > time()) {
            return (int)ceil((strtotime($row['locked_until']) - time()) / 60);
        }
        if (!empty($row['last_attempt_at']) && strtotime($row['last_attempt_at']) < time() - 300) {
            $pdo->prepare("UPDATE login_rate_limits SET failed_attempts=0, locked_until=NULL WHERE ip_address=? AND identifier=?")->execute([$ip,$identifier]);
        }
    } catch (Throwable $e) {
        error_log('Login rate limiter error: '.$e->getMessage());
        return 1;
    }
    return 0;
}

function increment_login_attempts($loginType) {
    global $pdo;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $identifier = strtolower(clean_text((string)$loginType, 100));
    try {
        $pdo->beginTransaction();
        $stmt = $pdo->prepare("SELECT id, failed_attempts, last_attempt_at FROM login_rate_limits WHERE ip_address=? AND identifier=? FOR UPDATE");
        $stmt->execute([$ip,$identifier]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $now = date('Y-m-d H:i:s');
        if (!$row) {
            $pdo->prepare("INSERT INTO login_rate_limits (ip_address, identifier, failed_attempts, last_attempt_at, locked_until) VALUES (?,?,1,?,NULL)")
                ->execute([$ip,$identifier,$now]);
        } else {
            $attempts = (int)$row['failed_attempts'];
            if (strtotime($row['last_attempt_at']) < time() - 300) $attempts = 0;
            $attempts++;
            $lockedUntil = $attempts >= 5 ? date('Y-m-d H:i:s', time()+300) : null;
            $pdo->prepare("UPDATE login_rate_limits SET failed_attempts=?, last_attempt_at=?, locked_until=? WHERE id=?")
                ->execute([$attempts,$now,$lockedUntil,$row['id']]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        error_log('Login rate limiter increment error: '.$e->getMessage());
    }
}

function clear_login_attempts($loginType) {
    global $pdo;
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $identifier = strtolower(clean_text((string)$loginType, 100));
    try {
        $pdo->prepare("DELETE FROM login_rate_limits WHERE ip_address=? AND identifier=?")->execute([$ip,$identifier]);
    } catch (Throwable $e) {
        error_log('Login rate limiter clear error: '.$e->getMessage());
    }
}

/**
 * Automatically purge video from Bunny.net Cloud CDN storage
 * @param string $bunnyVideoId GUID or embed link
 * @return bool
 */
function delete_bunny_video($bunnyVideoId) {
    if (empty($bunnyVideoId) || $bunnyVideoId === 'bunny_vid_auto') {
        return false;
    }
    
    // Extract GUID if full URL was provided
    if (preg_match('/embed\/(\d+)\/([a-zA-Z0-9\-]+)/', $bunnyVideoId, $m)) {
        $libraryId = $m[1];
        $bunnyVideoId = $m[2];
    } elseif (preg_match('/([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/', $bunnyVideoId, $m)) {
        $bunnyVideoId = $m[1];
    }
    $bunnyVideoId = strtok($bunnyVideoId, '?');

    $libraryId = env('BUNNY_LIBRARY_ID', '');
    $apiKey    = env('BUNNY_API_KEY', '');
    $streamHost = env('BUNNY_STREAM_HOST', 'video.bunnycdn.com');

    if (empty($apiKey) || empty($libraryId)) {
        return false;
    }

    $url = "https://{$streamHost}/library/{$libraryId}/videos/{$bunnyVideoId}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "AccessKey: {$apiKey}",
        "Accept: application/json"
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ($httpCode === 200 || $httpCode === 204 || $httpCode === 404);
}
