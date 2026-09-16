<?php
/**
 * download-submission.php — Authenticated Gated File Delivery for Assignment Submissions
 * Enforces role authorization and strict directory traversal prevention.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$subId = (int)($_GET['id'] ?? 0);
if ($subId <= 0) {
    http_response_code(400);
    die("Invalid submission ID.");
}

$stmt = $pdo->prepare("
    SELECT s.*, a.course_id, a.title as assignment_title 
    FROM assignment_submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.id = ? 
    LIMIT 1
");
$stmt->execute([$subId]);
$sub = $stmt->fetch();

if (!$sub) {
    http_response_code(404);
    die("Submission record not found.");
}

$courseId = (int)$sub['course_id'];
$isAuthorized = false;

// 1. Check Student Authorization (Must be submission owner)
if (!empty($_SESSION['student_id']) && (int)$_SESSION['student_id'] === (int)$sub['student_id']) {
    $isAuthorized = true;
}

// 2. Check Instructor Authorization (Must be assigned to course)
if (!empty($_SESSION['instructor_id']) && !empty($_SESSION['instructor_logged_in'])) {
    $instId = (int)$_SESSION['instructor_id'];
    $stmtInst = $pdo->prepare("SELECT 1 FROM course_instructors WHERE instructor_id = ? AND course_id = ? LIMIT 1");
    $stmtInst->execute([$instId, $courseId]);
    if ($stmtInst->fetch()) {
        $isAuthorized = true;
    }
}

// 3. Check Admin Authorization
if (!empty($_SESSION['admin_id'])) {
    $isAuthorized = true;
}

if (!$isAuthorized) {
    http_response_code(403);
    die("Access Denied: You do not have permission to view or download this submission.");
}

// Strict Directory Traversal Guard (PDF ITEM 4 FIX)
$base = realpath(__DIR__ . '/uploads/submissions');
$file = realpath(__DIR__ . '/' . ltrim($sub['file_path'], '/\\'));

if (
    $base === false ||
    $file === false ||
    !str_starts_with($file, $base . DIRECTORY_SEPARATOR) ||
    !is_file($file)
) {
    http_response_code(403);
    exit('Invalid file path.');
}
if (!is_file($file)) {
    http_response_code(404);
    exit('File not found.');
}

// Stream File Securely
$mime = mime_content_type($file) ?: 'application/octet-stream';
header('Content-Description: File Transfer');
header('Content-Type: ' . $mime);
header('Content-Disposition: attachment; filename="' . basename($file) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Content-Length: ' . filesize($file));
readfile($file);
exit;