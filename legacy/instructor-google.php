<?php
/**
 * instructor-google.php — Official Google OAuth 2.0 Faculty Authentication
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$clientId = $_ENV['GOOGLE_CLIENT_ID'] ?? getenv('GOOGLE_CLIENT_ID') ?? '';
$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? getenv('GOOGLE_CLIENT_SECRET') ?? '';
if ($clientId === '' || $clientSecret === '') {
    http_response_code(503);
    exit('Google instructor login is not configured.');
}

// ISS-03 Hardening: Authoritative APP_URL for production Google OAuth callback
$appUrl = defined('APP_URL') && APP_URL ? APP_URL : (env('APP_URL') ?: '');
if (!empty($appUrl) && strpos($appUrl, 'localhost') === false) {
    $redirectUri = rtrim($appUrl, '/') . '/instructor-google.php';
} else {
    $isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'], true) || str_starts_with($_SERVER['HTTP_HOST'] ?? '', 'localhost:');
    $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
    $destPath = ($isLocal && !empty($scriptDir) && $scriptDir !== '/') ? $scriptDir : '';
    $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
    $redirectUri = $proto . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $destPath . '/instructor-google.php';
}

// Step 1: Redirect to Google
if (!isset($_GET['code'])) {
    $state = bin2hex(random_bytes(16));
    $_SESSION['faculty_google_oauth_state'] = $state;

    $params = [
        'client_id'     => $clientId,
        'redirect_uri'  => $redirectUri,
        'response_type' => 'code',
        'scope'         => 'openid email profile',
        'state'         => $state,
        'access_type'   => 'online',
        'prompt'        => 'select_account'
    ];

    header("Location: https://accounts.google.com/o/oauth2/v2/auth?" . http_build_query($params));
    exit;
}

// Step 2: Handle OAuth Callback
$code = $_GET['code'] ?? '';
$state = $_GET['state'] ?? '';

if (empty($_SESSION['faculty_google_oauth_state']) || !hash_equals($_SESSION['faculty_google_oauth_state'], $state)) {
    header("Location: instructor-login.php?error=invalid_oauth_state");
    exit;
}
unset($_SESSION['faculty_google_oauth_state']);

// Exchange Code for Access Token
$tokenUrl = 'https://oauth2.googleapis.com/token';
$postData = [
    'code'          => $code,
    'client_id'     => $clientId,
    'client_secret' => $clientSecret,
    'redirect_uri'  => $redirectUri,
    'grant_type'    => 'authorization_code'
];

$ch = curl_init($tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
$response = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($response, true);
$accessToken = $tokenData['access_token'] ?? null;

if (!$accessToken) {
    header("Location: instructor-login.php?error=google_token_failed");
    exit;
}

// Fetch Profile from Google UserInfo
$userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
$ch = curl_init($userInfoUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $accessToken]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
$userResponse = curl_exec($ch);
curl_close($ch);

$googleUser = json_decode($userResponse, true);
$googleEmail = strtolower(trim($googleUser['email'] ?? ''));
$emailVerified = filter_var($googleUser['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN);

if (empty($googleEmail) || !$emailVerified) {
    header("Location: instructor-login.php?error=google_unverified");
    exit;
}

// STRICT WHITELIST CHECK: Verify if email is an active instructor
$stmt = $pdo->prepare("SELECT * FROM instructors WHERE LOWER(email) = ? LIMIT 1");
$stmt->execute([$googleEmail]);
$inst = $stmt->fetch();

if (!$inst) {
    // Unregistered Google Account — Block from faculty access
    header("Location: instructor-login.php?error=unauthorized_faculty_email&email=" . urlencode($googleEmail));
    exit;
}

if ($inst['status'] !== 'active') {
    header("Location: instructor-login.php?error=account_inactive");
    exit;
}

// Successful Authentication
session_regenerate_id(true);
$_SESSION['instructor_id']        = (int)$inst['id'];
$_SESSION['instructor_name']      = $inst['name'];
$_SESSION['instructor_email']     = $inst['email'];
$_SESSION['instructor_title']     = $inst['title'];
$_SESSION['instructor_logged_in'] = true;
$_SESSION['instructor_device_hash'] = hash('sha256', ($_SERVER['HTTP_USER_AGENT'] ?? ''));

log_instructor_audit($inst['id'], 'FACULTY_GOOGLE_LOGIN_SUCCESS', null, 'Faculty logged in via Google OAuth.');

header("Location: instructor-dashboard.php");
exit;