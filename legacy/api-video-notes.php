<?php
/**
 * API for Student In-Video Timestamp Notes
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/gamification.php';

header('Content-Type: application/json');

$studentId = getStudentId();
if (!$studentId) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$action = $_GET['action'] ?? ($_POST['action'] ?? 'list');
$videoId = (int)($_GET['video_id'] ?? ($_POST['video_id'] ?? 0));

if ($videoId <= 0) {
    echo json_encode(['error' => 'Invalid video ID']);
    exit;
}

$stmtVideoScope = $pdo->prepare("SELECT m.course_id FROM videos v JOIN modules m ON v.module_id = m.id WHERE v.id = ? LIMIT 1");
$stmtVideoScope->execute([$videoId]);
$videoCourseId = (int)$stmtVideoScope->fetchColumn();
if ($videoCourseId <= 0 || !hasCourseAccess($studentId, $videoCourseId)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

if ($action === 'list') {
    $stmt = $pdo->prepare("SELECT * FROM student_video_notes WHERE student_id = ? AND video_id = ? ORDER BY timestamp_sec ASC, created_at ASC");
    $stmt->execute([$studentId, $videoId]);
    $notes = $stmt->fetchAll();
    echo json_encode(['notes' => $notes]);
    exit;
}

if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $timestampSec = max(0, (int)($_POST['timestamp_sec'] ?? 0));
    $noteText = substr(clean_text($_POST['note_text'] ?? '', 5000), 0, 5000);

    if (empty($noteText)) {
        echo json_encode(['error' => 'Note cannot be empty']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO student_video_notes (student_id, video_id, timestamp_sec, note_text) VALUES (?, ?, ?, ?)");
    $stmt->execute([$studentId, $videoId, $timestampSec, $noteText]);
    $newId = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'note' => [
            'id' => $newId,
            'timestamp_sec' => $timestampSec,
            'note_text' => $noteText,
            'created_at' => date('Y-m-d H:i:s')
        ]
    ]);
    exit;
}

if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $noteId = (int)($_POST['note_id'] ?? 0);
    $stmt = $pdo->prepare("DELETE FROM student_video_notes WHERE id = ? AND student_id = ?");
    $stmt->execute([$noteId, $studentId]);
    echo json_encode(['success' => true]);
    exit;
}

echo json_encode(['error' => 'Invalid request']);
