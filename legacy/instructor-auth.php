<?php
/**
 * instructor-auth.php — Zero-Trust Row-Level Access Control (RLAC) & Session Gatekeeper
 */

require_once __DIR__ . '/config.php';

function require_instructor_auth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (empty($_SESSION['instructor_id']) || empty($_SESSION['instructor_logged_in'])) {
        header("Location: instructor-login.php");
        exit;
    }

    // ISS-21 Hardening: Re-validate instructor status from Database
    global $pdo;
    try {
        $stmt = $pdo->prepare("SELECT id, status FROM instructors WHERE id = ? LIMIT 1");
        $stmt->execute([(int)$_SESSION['instructor_id']]);
        $inst = $stmt->fetch();
        if (!$inst || $inst['status'] !== 'active') {
            session_unset();
            session_destroy();
            header("Location: instructor-login.php?error=account_suspended");
            exit;
        }
    } catch (Exception $e) {
        error_log("Instructor auth validation error: " . $e->getMessage());
    }

    // Device binding check
    $currentHash = hash('sha256', ($_SERVER['HTTP_USER_AGENT'] ?? ''));
    if (!empty($_SESSION['instructor_device_hash']) && $_SESSION['instructor_device_hash'] !== $currentHash) {
        session_destroy();
        header("Location: instructor-login.php?error=device_mismatch");
        exit;
    }
}


function get_instructor_profile($instructorId = null) {
    global $pdo;
    if (!$instructorId) {
        $instructorId = $_SESSION['instructor_id'] ?? 0;
    }

    $stmt = $pdo->prepare("SELECT id, name, email, phone, title, bio, avatar_url, status FROM instructors WHERE id = ? LIMIT 1");
    $stmt->execute([$instructorId]);
    return $stmt->fetch() ?: null;
}

function get_instructor_assigned_courses($instructorId = null) {
    global $pdo;
    if (!$instructorId) {
        $instructorId = $_SESSION['instructor_id'] ?? 0;
    }

    $stmt = $pdo->prepare("
        SELECT c.id, c.title, c.price, ci.assigned_at
        FROM courses c
        JOIN course_instructors ci ON c.id = ci.course_id
        WHERE ci.instructor_id = ?
        ORDER BY c.id ASC
    ");
    $stmt->execute([$instructorId]);
    return $stmt->fetchAll() ?: [];
}

function get_instructor_course_ids($instructorId = null) {
    $courses = get_instructor_assigned_courses($instructorId);
    return array_map(function($c) { return (int)$c['id']; }, $courses);
}

function is_course_assigned_to_instructor($instructorId, $courseId) {
    $allowed = get_instructor_course_ids($instructorId);
    return in_array((int)$courseId, $allowed, true);
}

function enforce_instructor_course_scope($instructorId, $targetCourseId) {
    if (!is_course_assigned_to_instructor($instructorId, $targetCourseId)) {
        log_instructor_audit($instructorId, 'SECURITY_VIOLATION_UNAUTHORIZED_COURSE_ACCESS', $targetCourseId, 'Attempted to access unauthorized course.');
        http_response_code(403);
        die("<h1>403 Forbidden</h1><p>Security Alert: You are not authorized to manage Course ID #{$targetCourseId}. This event has been logged.</p>");
    }
}

function log_instructor_audit($instructorId, $action, $courseId = null, $details = '') {
    global $pdo;
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $stmt = $pdo->prepare("
            INSERT INTO instructor_audit_logs (instructor_id, action, course_id, details, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$instructorId, $action, $courseId, $details, $ip]);
    } catch (Exception $e) {}
}