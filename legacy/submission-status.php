<?php
/**
 * submission-status.php — Dedicated Status Query Endpoint with Student Ownership Verification
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/code-arena/config/StatusConstants.php';

$studentId = (int)($_SESSION['student_id'] ?? 0);
$isStaff = (function_exists('isAdmin') && isAdmin());

if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

header('Content-Type: application/json; charset=UTF-8');

$jobIdReq = clean_text($_GET['job_id'] ?? ($_POST['job_id'] ?? ''), 64);
$subIdReq = (int)($_GET['submission_id'] ?? ($_POST['submission_id'] ?? 0));

if (empty($jobIdReq) && $subIdReq <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing job_id or submission_id parameter.']);
    exit;
}

try {
    // Ownership authorization check: student can only read their own submission
    if (!$isStaff && $studentId > 0) {
        $query = "
            SELECT j.id AS job_id, j.status AS job_status, s.id AS submission_id, s.student_id, s.verdict, 
                   s.execution_time_ms, s.memory_kb, s.passed_test_cases, s.total_test_cases
            FROM execution_jobs j
            JOIN code_submissions s ON j.submission_id = s.id
            WHERE (j.id = ? OR s.id = ?) AND s.student_id = ?
            LIMIT 1
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$jobIdReq, $subIdReq, $studentId]);
    } else {
        // Staff or guest query
        $query = "
            SELECT j.id AS job_id, j.status AS job_status, s.id AS submission_id, s.student_id, s.verdict, 
                   s.execution_time_ms, s.memory_kb, s.passed_test_cases, s.total_test_cases
            FROM execution_jobs j
            JOIN code_submissions s ON j.submission_id = s.id
            WHERE (j.id = ? OR s.id = ?)
            LIMIT 1
        ";
        $stmt = $pdo->prepare($query);
        $stmt->execute([$jobIdReq, $subIdReq]);
    }

    $res = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$res) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Submission or job record not found or access denied.']);
        exit;
    }

    echo json_encode([
        'success'           => true,
        'job_id'            => $res['job_id'],
        'submission_id'     => (int)$res['submission_id'],
        'status'            => $res['job_status'],
        'verdict'           => $res['verdict'],
        'execution_time_ms' => (int)$res['execution_time_ms'],
        'memory_kb'         => (int)$res['memory_kb'],
        'passed_test_cases' => (int)$res['passed_test_cases'],
        'total_test_cases'  => (int)$res['total_test_cases']
    ]);
    exit;
} catch (Exception $e) {
    error_log("submission-status error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'verdict' => StatusConstants::SYSTEM_ERROR, 'error' => 'Failed to fetch submission status.']);
    exit;
}
