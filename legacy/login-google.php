<?php
/**
 * login-google.php — Real Google OAuth 2.0 Engine with Multi-Course Entitlement Resolution
 * Handles:
 *  1. Google Login (LMS access for existing students with active enrollments)
 *  2. Google Fast-Track Enrollment (pre-fills and verifies identity for new or multi-course enrollment)
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$clientId     = env('GOOGLE_CLIENT_ID', '');
$clientSecret = env('GOOGLE_CLIENT_SECRET', '');

// Compute robust dynamic redirect URI (Never send localhost to live users)
$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = in_array($host, ['localhost', '127.0.0.1'], true) || str_starts_with($host, 'localhost:');
if (!$isLocal && !empty($host)) {
    // Production / Live Domain
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'https';
    $redirectUri = "{$scheme}://{$host}/login-google.php";
} elseif (defined('APP_URL') && !empty(APP_URL) && !str_contains(APP_URL, 'localhost')) {
    $redirectUri = rtrim(APP_URL, '/') . '/login-google.php';
} else {
    // Local development
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    $redirectUri = "{$scheme}://localhost{$scriptDir}/login-google.php";
}

$action = $_GET['action'] ?? 'callback';

// ── STEP 1: Redirect to Google ──
if ($action === 'redirect') {
    $isEnroll = !empty($_GET['enroll']);
    $courseId = (int)($_GET['course_id'] ?? 0);
    $returnPage = clean_text($_GET['return_page'] ?? 'enroll', 50);

    if ($isEnroll) {
        // Validate Course strictly against database
        if ($courseId <= 0) {
            header("Location: courses.php?error=missing_course_selection");
            exit;
        }
        $stmtChkCourse = $pdo->prepare("SELECT id, title FROM courses WHERE id = ? LIMIT 1");
        $stmtChkCourse->execute([$courseId]);
        $validCourse = $stmtChkCourse->fetch();
        if (!$validCourse) {
            header("Location: courses.php?error=invalid_course_id");
            exit;
        }

        $_SESSION['google_oauth_enroll'] = 1;
        $_SESSION['google_oauth_course_id'] = $courseId;
        $_SESSION['google_oauth_return_page'] = $returnPage;
    } else {
        unset($_SESSION['google_oauth_enroll']);
        unset($_SESSION['google_oauth_course_id']);
        unset($_SESSION['google_oauth_return_page']);
    }

    if (empty($clientId) || str_contains($clientId, 'your_google_client_id')) {
        header("Location: login.php?error=google_not_configured");
        exit;
    }

    $state = bin2hex(random_bytes(16));
    $_SESSION['google_oauth_state'] = $state;

    $googleAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query([
        'client_id'             => $clientId,
        'redirect_uri'          => $redirectUri,
        'response_type'         => 'code',
        'scope'                 => 'openid email profile',
        'state'                 => $state,
        'access_type'           => 'online',
        'prompt'                => 'select_account'
    ]);

    header("Location: " . $googleAuthUrl);
    exit;
}

// ── STEP 2: Google Callback ──
if ($action === 'callback') {
    $code  = $_GET['code'] ?? '';
    $state = $_GET['state'] ?? '';

    if (empty($code)) {
        header("Location: login.php?error=google_cancelled");
        exit;
    }

    if (empty($_SESSION['google_oauth_state']) || !hash_equals($_SESSION['google_oauth_state'], $state)) {
        header("Location: login.php?error=invalid_state");
        exit;
    }
    unset($_SESSION['google_oauth_state']);

    // Exchange authorization code for token
    $ch = curl_init("https://oauth2.googleapis.com/token");
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'code'          => $code,
            'client_id'     => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri'  => $redirectUri,
            'grant_type'    => 'authorization_code'
        ]),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_TIMEOUT        => 15
    ]);
    $tokenResp = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $tokenData = json_decode($tokenResp, true);
    if ($httpCode !== 200 || empty($tokenData['access_token'])) {
        error_log("Google Token Exchange Failed: " . ($tokenResp ?: 'no response'));
        header("Location: login.php?error=google_token_failed");
        exit;
    }

    // Fetch user info using access token
    $ch2 = curl_init("https://www.googleapis.com/oauth2/v3/userinfo");
    curl_setopt_array($ch2, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer {$tokenData['access_token']}"],
        CURLOPT_TIMEOUT        => 10
    ]);
    $userResp = curl_exec($ch2);
    curl_close($ch2);

    $googleUser = json_decode($userResp, true);
    if (empty($googleUser['email']) || empty($googleUser['email_verified'])) {
        header("Location: login.php?error=google_unverified");
        exit;
    }

    $email   = validate_email_input($googleUser['email'], 191);
    $name    = clean_text($googleUser['name'] ?? 'Student', 100);
    $isEnrollmentFlow = !empty($_SESSION['google_oauth_enroll']);
    $courseId = (int)($_SESSION['google_oauth_course_id'] ?? 0);

    // ── CASE A: ENROLLMENT FLOW (Multi-Course Capable) ──
    if ($isEnrollmentFlow) {
        unset($_SESSION['google_oauth_enroll']);
        $requestedCourseId = (int)($_SESSION['google_oauth_course_id'] ?? 0);
        unset($_SESSION['google_oauth_course_id']);

        if ($requestedCourseId <= 0) {
            header("Location: courses.php?error=missing_course_id");
            exit;
        }

        // Resolve existing student identity BEFORE creating payment or duplicate
        $resolution = resolveExistingStudent($email, $name);
        $studentId = $resolution['student_id'];

        // Check if student already has active paid enrollment for this specific course
        $existingEnrollment = getStudentEnrollmentForCourse($studentId, $requestedCourseId);
        
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        $returnPage = (!empty($_SESSION['google_oauth_return_page'])) ? $_SESSION['google_oauth_return_page'] : 'enroll';
        unset($_SESSION['google_oauth_return_page']);
        $destPath = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/{$returnPage}" : "{$returnPage}";

        if ($existingEnrollment) {
            // Already enrolled in THIS course -> Show ALREADY_ENROLLED screen
            header("Location: {$destPath}?course_id={$requestedCourseId}&already_enrolled=1&en_id=" . urlencode('EA-2026-' . str_pad($existingEnrollment['id'], 5, '0', STR_PAD_LEFT)));
            exit;
        }

        // New enrollment for this course
        $verificationId = 'GVER_' . bin2hex(random_bytes(16));
        $expiresAt = (int)(time() + 7200);
        try {
            $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
            $stmtV = $pdo->prepare("
                INSERT INTO email_verifications (verification_id, email, otp, otp_hash, payload, expires_at, attempts, is_verified)
                VALUES (?, ?, 'GOOGLE', 'SKIPPED_GOOGLE_OAUTH', ?, ?, 0, 1)
            ");
            $stmtV->execute([$verificationId, $email, json_encode([
                'student_id'      => $studentId,
                'name'            => $name,
                'email'           => $email,
                'course_id'       => $requestedCourseId,
                'is_google_oauth' => true,
                'is_existing'     => ($resolution['status'] === 'EXISTING_STUDENT')
            ]), $expiresAt]);
        } catch (Exception $e) {
            error_log("Google OAuth verification save error: " . $e->getMessage());
        }

        $_SESSION['google_verified_identity'] = [
            'student_id'      => $studentId,
            'email'           => $email,
            'name'            => $name,
            'verification_id' => $verificationId,
            'course_id'       => $requestedCourseId,
            'is_existing'     => ($resolution['status'] === 'EXISTING_STUDENT'),
            'expires_at'      => time() + 3600
        ];

        header("Location: {$destPath}?google_verified=1&course_id=" . $requestedCourseId);
        exit;
    }

    // ── CASE B: LOGIN FLOW (Access LMS Dashboard) ──
    $stmtCheck = $pdo->prepare("
        SELECT s.id, s.name, s.email, s.status, COUNT(e.id) as enroll_count
        FROM students s
        LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'active' AND e.payment_status = 'paid'
        WHERE LOWER(s.email) = ?
        GROUP BY s.id
        LIMIT 1
    ");
    $stmtCheck->execute([$email]);
    $student = $stmtCheck->fetch();

    if (!$student || empty($student['id']) || (int)$student['enroll_count'] === 0) {
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        $destLogin = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/login" : "login";
        header("Location: {$destLogin}?error=no_active_enrollment&email=" . urlencode($email));
        exit;
    }

    if ($student['status'] !== 'active') {
        $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
        $destLogin = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/login" : "login";
        header("Location: {$destLogin}?error=account_suspended");
        exit;
    }

    // Authorized student -> Grant active session
    session_regenerate_id(true);
    $_SESSION['student_id']    = (int)$student['id'];
    $_SESSION['student_name']  = $student['name'];
    $_SESSION['student_email'] = $student['email'];

    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    $destDashboard = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/dashboard" : "dashboard";
    header("Location: {$destDashboard}");
    exit;
}
