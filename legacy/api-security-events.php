<?php
// api-security-events.php
// Server-Authoritative Endpoint for Logging and Querying Lecture Security Events
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/security-events.php';

header('Content-Type: application/json');

$studentId = $_SESSION['student_id'] ?? 0;
if (!$studentId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required.', 'playbackAllowed' => false]);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (!$action && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $jsonData = json_decode($rawInput, true);
    if (is_array($jsonData)) {
        $action = $jsonData['action'] ?? '';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET STATUS: Retrieve Current Server-Authoritative Security State
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'get_status' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    $videoId = (int)($_GET['video_id'] ?? 0);
    if ($videoId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing video_id parameter.']);
        exit;
    }

    $activeEvent = getActiveLectureSecurityEvent($studentId, $videoId);
    if ($activeEvent) {
        echo json_encode([
            'success'         => true,
            'videoId'         => $videoId,
            'playbackAllowed' => false,
            'securityStatus'  => 'RESTRICTED',
            'reason'          => 'ACTIVE_SECURITY_EVENT',
            'activeEvent'     => [
                'id'                => (int)$activeEvent['id'],
                'eventType'         => $activeEvent['event_type'],
                'severity'          => $activeEvent['severity'],
                'detectedAt'        => $activeEvent['detected_at'],
                'expiresAt'         => $activeEvent['expires_at'],
                'remainingSeconds'  => max(0, (int)$activeEvent['remaining_seconds'])
            ],
            'serverTime'      => date('Y-m-d H:i:s')
        ]);
    } else {
        echo json_encode([
            'success'         => true,
            'videoId'         => $videoId,
            'playbackAllowed' => true,
            'securityStatus'  => 'NORMAL',
            'reason'          => 'NO_ACTIVE_RESTRICTION',
            'activeEvent'     => null,
            'serverTime'      => date('Y-m-d H:i:s')
        ]);
    }
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOG EVENT: Securely Register Supported Security/Recording Violation
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'log_event') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $videoId   = (int)($data['video_id'] ?? 0);
    $courseId  = (int)($data['course_id'] ?? 0);
    $eventType = clean_text($data['event_type'] ?? 'unknown_capture', 64);
    $metadata  = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];

    if ($videoId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid video_id parameter.']);
        exit;
    }

    // Auto-fetch courseId if omitted
    if ($courseId <= 0) {
        $stmtC = $pdo->prepare("SELECT m.course_id FROM videos v JOIN modules m ON v.module_id = m.id WHERE v.id = ?");
        $stmtC->execute([$videoId]);
        $courseId = (int)$stmtC->fetchColumn();
    }

    // Supported Security Events
    $allowedEvents = [
        'get_display_media',
        'media_recorder_intercept',
        'stream_rip_attempt',
        'screen_capture_shortcut',
        'anomalous_capture'
    ];

    if (!in_array($eventType, $allowedEvents, true)) {
        $eventType = 'anomalous_capture';
    }

    // High confidence capture events trigger 300-second (5 min) cooling period
    $cooldownSec = 300;
    $res = createLectureSecurityEvent($studentId, $courseId, $videoId, $eventType, 'HIGH', $metadata, $cooldownSec);

    echo json_encode([
        'success'         => true,
        'eventId'         => $res['eventId'],
        'securityStatus'  => 'RESTRICTED',
        'playbackAllowed' => false,
        'expiresAt'       => $res['expiresAt'],
        'cooldownSeconds' => $cooldownSec,
        'reason'          => 'ACTIVE_SECURITY_EVENT',
        'eventType'       => $eventType
    ]);
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RESOLVE RESTRICTION: Verified Resolution After Cooldown or Confirmation
// ─────────────────────────────────────────────────────────────────────────────
if ($action === 'resolve') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $eventId = (int)($data['event_id'] ?? 0);
    $videoId = (int)($data['video_id'] ?? 0);
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($data['_token'] ?? ($data['csrf_token'] ?? ''));

    if (empty($csrfToken) || !hash_equals($_SESSION['csrf_token'] ?? '', $csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Security session expired. Please reload page.']);
        exit;
    }

    $activeEvent = getActiveLectureSecurityEvent($studentId, $videoId);
    if (!$activeEvent) {
        echo json_encode(['success' => true, 'message' => 'No active restriction to resolve.', 'playbackAllowed' => true]);
        exit;
    }

    // Enforce cooldown requirement before student self-resolution
    $remaining = (int)$activeEvent['remaining_seconds'];
    if ($remaining > 0) {
        echo json_encode([
            'success'          => false,
            'error'            => "Cooling period active. Please wait {$remaining} seconds before re-verifying.",
            'playbackAllowed'  => false,
            'remainingSeconds' => $remaining
        ]);
        exit;
    }

    resolveLectureSecurityEvent((int)$activeEvent['id'], $studentId, 'STUDENT_VERIFIED_RESOLUTION');

    echo json_encode([
        'success'         => true,
        'message'         => 'Security restriction cleared. Playback authorized.',
        'playbackAllowed' => true,
        'securityStatus'  => 'NORMAL'
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Unknown action.']);