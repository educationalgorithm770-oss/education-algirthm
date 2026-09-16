<?php
require_once __DIR__ . '/config.php';
if (session_status() === PHP_SESSION_NONE) session_start();

if (!empty($_SESSION['instructor_id'])) {
    require_once __DIR__ . '/instructor-auth.php';
    log_instructor_audit($_SESSION['instructor_id'], 'FACULTY_LOGOUT', null, 'Faculty logged out.');
}

unset($_SESSION['instructor_id']);
unset($_SESSION['instructor_name']);
unset($_SESSION['instructor_email']);
unset($_SESSION['instructor_title']);
unset($_SESSION['instructor_logged_in']);
unset($_SESSION['instructor_device_hash']);

header("Location: instructor-login.php");
exit;