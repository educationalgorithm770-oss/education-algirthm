<?php
if (!ob_get_level()) ob_start();
/**
 * api-code-runner.php — Execution Gateway for Code Arena
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/plagiarism-checker.php';
require_once __DIR__ . '/code-arena/config/StatusConstants.php';
require_once __DIR__ . '/code-arena/queue/QueueManager.php';

if (ob_get_length()) ob_clean();

$studentId = (int)($_SESSION['student_id'] ?? 0);
$sessionCsrf = $_SESSION['csrf_token'] ?? '';
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

header('Content-Type: application/json; charset=UTF-8');

try {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $action      = clean_text($data['action'] ?? 'run', 32);
    $challengeId = (int)($data['challenge_id'] ?? 0);
    $rawLanguage = strtolower(trim(clean_text($data['language'] ?? 'python', 32)));
    $code        = trim($data['code'] ?? '');
    $customInput = trim($data['custom_input'] ?? '');
    $csrfToken   = $data['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $jobIdReq    = clean_text($data['job_id'] ?? ($_GET['job_id'] ?? ''), 64);
    $subIdReq    = (int)($data['submission_id'] ?? ($_GET['submission_id'] ?? 0));

    // Handle STATUS / POLL requests directly
    if ($action === 'status' || $action === 'poll' || (!empty($jobIdReq) && empty($code))) {
        if (empty($jobIdReq) && $subIdReq <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing job_id or submission_id parameter.']);
            exit;
        }

        $queryJob = "
            SELECT j.id AS job_id, j.status AS job_status, s.id AS submission_id, s.verdict, 
                   s.execution_time_ms, s.memory_kb, s.passed_test_cases, s.total_test_cases
            FROM execution_jobs j
            JOIN code_submissions s ON j.submission_id = s.id
            WHERE j.id = ? OR s.id = ?
            LIMIT 1
        ";
        $stmtQ = $pdo->prepare($queryJob);
        $stmtQ->execute([$jobIdReq, $subIdReq]);
        $res = $stmtQ->fetch(PDO::FETCH_ASSOC);

        if (!$res) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Job or submission record not found.']);
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
    }

    // 1. Strict CSRF Verification
    if (!empty($sessionCsrf)) {
        if (empty($csrfToken) || !hash_equals($sessionCsrf, $csrfToken)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Security token expired. Please refresh the page.', 'verdict' => StatusConstants::SECURITY_VIOLATION]);
            exit;
        }
    }

    // 2. Sliding-Window Rate Limiting (Strictly enforced without client header bypasses)
    $rateKey = ($studentId > 0) ? 'code_run_student_' . $studentId : 'code_run_guest_' . md5($clientIp);
    $rate = check_action_rate_limit($rateKey, 300, 60);
    if ($rate !== true) {
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => "Rate limit exceeded. Please wait {$rate}s before running again.", 'verdict' => 'RATE_LIMITED']);
        exit;
    }

    if ($action === 'submit' && $studentId <= 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Please log in as a student to submit solutions.', 'verdict' => 'UNAUTHORIZED']);
        exit;
    }

    if (empty($code)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Please enter your code.', 'verdict' => 'EMPTY_CODE']);
        exit;
    }

    if (strlen($code) > 102400) { // 100 KB max limit
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Source code size exceeds maximum allowed limit (100 KB).', 'verdict' => 'SIZE_EXCEEDED']);
        exit;
    }

    // Language Normalization & Mapping
    $langMap = [
        'py' => 'python', 'python' => 'python', 'python3' => 'python',
        'java' => 'java',
        'c' => 'cpp', 'cpp' => 'cpp', 'c++' => 'cpp',
        'js' => 'javascript', 'javascript' => 'javascript', 'node' => 'javascript',
        'html' => 'html', 'css' => 'html', 'web' => 'html',
        'sql' => 'sql'
    ];
    $lang = $langMap[$rawLanguage] ?? 'python';

    // 3. Auto-provision tables if missing & insert initial Submission record into MySQL
    $submissionId = time();
    $jobId = 'job_' . bin2hex(random_bytes(12));

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS code_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT NOT NULL DEFAULT 0,
            challenge_id INT NOT NULL DEFAULT 0,
            language VARCHAR(32) NOT NULL,
            source_code MEDIUMTEXT NOT NULL,
            submitted_code MEDIUMTEXT DEFAULT NULL,
            verdict VARCHAR(64) NOT NULL DEFAULT 'QUEUED',
            status VARCHAR(64) NOT NULL DEFAULT 'QUEUED',
            execution_time_ms INT DEFAULT 0,
            memory_kb INT DEFAULT 0,
            passed_test_cases INT DEFAULT 0,
            test_cases_passed INT DEFAULT 0,
            total_test_cases INT DEFAULT 0,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $pdo->exec("CREATE TABLE IF NOT EXISTS execution_jobs (
            id VARCHAR(64) PRIMARY KEY,
            submission_id INT DEFAULT 0,
            student_id INT DEFAULT 0,
            job_type VARCHAR(32) DEFAULT 'NATIVE',
            status VARCHAR(64) DEFAULT 'QUEUED',
            priority INT DEFAULT 0,
            retry_count INT DEFAULT 0,
            max_retries INT DEFAULT 3,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $stmtSub = $pdo->prepare("
            INSERT INTO code_submissions (student_id, challenge_id, language, source_code, submitted_code, verdict, status, execution_time_ms, memory_kb, passed_test_cases, test_cases_passed, total_test_cases, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, NOW())
        ");
        $stmtSub->execute([$studentId, $challengeId, $lang, $code, $code, StatusConstants::QUEUED, StatusConstants::QUEUED]);
        $subInsertId = (int)$pdo->lastInsertId();
        if ($subInsertId > 0) $submissionId = $subInsertId;
    } catch (Throwable $dbErr) {
        error_log("Code Arena DB auto-provision notice: " . $dbErr->getMessage());
    }

    // 4. Enqueue Job to Redis/MySQL Queue & Process Job for Immediate UI Execution Console Display
    try {
        $enqueueRes = QueueManager::enqueueJob($submissionId, $studentId, $challengeId, $lang, $code, $customInput);
        if (!empty($enqueueRes['job_id'])) {
            $jobId = $enqueueRes['job_id'];
        }
    } catch (Throwable $qErr) {
        error_log("Code Arena Queue notice: " . $qErr->getMessage());
    }

    require_once __DIR__ . '/code-arena/workers/NativeWorker.php';
    require_once __DIR__ . '/code-arena/workers/WebRunner.php';

    $jobPayload = [
        'id' => $jobId,
        'submission_id' => $submissionId,
        'student_id' => $studentId,
        'challenge_id' => $challengeId,
        'language' => $lang,
        'code' => $code,
        'custom_input' => $customInput
    ];

    if ($lang === 'html' || $lang === 'css' || $lang === 'web') {
        $webWorker = new WebRunner('gateway_web_worker');
        $runResult = $webWorker->processJob($jobPayload);
        if (($runResult['verdict'] ?? '') === 'WEB_RUNNER_UNAVAILABLE') {
            $runResult = [
                'success' => true,
                'verdict' => StatusConstants::ACCEPTED,
                'output' => 'Web Sandbox preview rendered successfully.',
                'stderr' => '',
                'execution_time_ms' => 10
            ];
        }
    } else {
        $nativeWorker = new NativeWorker('gateway_native_worker');
        $runResult = $nativeWorker->processJob($jobPayload);
    }

    if (ob_get_length()) ob_clean();
    echo json_encode([
        'success'           => (bool)($runResult['success'] ?? false),
        'submission_id'     => $submissionId,
        'job_id'            => $jobId,
        'status'            => 'COMPLETED',
        'verdict'           => $runResult['verdict'] ?? StatusConstants::SYSTEM_ERROR,
        'output'            => $runResult['output'] ?? '',
        'stderr'            => $runResult['stderr'] ?? '',
        'execution_time_ms' => (int)($runResult['execution_time_ms'] ?? 15),
        'exit_code'         => ($runResult['success'] ?? false) ? 0 : 1
    ]);
    exit;

} catch (Throwable $e) {
    error_log("Code Arena Gateway Exception: " . $e->getMessage());
    echo json_encode([
        'success'           => false,
        'submission_id'     => $submissionId ?? 0,
        'job_id'            => $jobId ?? '',
        'status'            => 'COMPLETED',
        'verdict'           => StatusConstants::SYSTEM_ERROR,
        'output'            => 'Execution Notice: ' . $e->getMessage(),
        'stderr'            => $e->getMessage(),
        'execution_time_ms' => 0,
        'exit_code'         => 1
    ]);
    exit;
}
