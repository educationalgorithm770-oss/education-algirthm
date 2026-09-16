<?php
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/gamification.php";

$studentId = requireStudent();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    die("Method Not Allowed. State changes require POST.");
}

verify_csrf();

$itemType = clean_text($_POST["type"] ?? "", 20);
$itemId   = (int)($_POST["id"] ?? 0);
$rawRedirect = $_POST["redirect"] ?? "dashboard.php";

// Sanitize redirect URL to prevent open redirect
$redirect = "dashboard.php";
if (!empty($rawRedirect) && !preg_match('#^https?://#i', $rawRedirect) && strpos($rawRedirect, '//') === false) {
    $redirect = $rawRedirect;
}

$allowedTypes = ["video", "note", "code"];
if (!in_array($itemType, $allowedTypes) || $itemId <= 0) {
    header("Location: dashboard");
    exit;
}

// Verify that the lesson item belongs to a course the student is authorized to access
$courseId = 0;
try {
    if ($itemType === "video") {
        $stmt = $pdo->prepare("
            SELECT m.course_id FROM videos v 
            JOIN modules m ON v.module_id = m.id 
            WHERE v.id = ? LIMIT 1
        ");
        $stmt->execute([$itemId]);
        $courseId = (int)$stmt->fetchColumn();
    } elseif ($itemType === "note") {
        $stmt = $pdo->prepare("
            SELECT m.course_id FROM notes n 
            JOIN modules m ON n.module_id = m.id 
            WHERE n.id = ? LIMIT 1
        ");
        $stmt->execute([$itemId]);
        $courseId = (int)$stmt->fetchColumn();
    } elseif ($itemType === "code") {
        $stmt = $pdo->prepare("
            SELECT m.course_id FROM code_snippets c 
            JOIN modules m ON c.module_id = m.id 
            WHERE c.id = ? LIMIT 1
        ");
        $stmt->execute([$itemId]);
        $courseId = (int)$stmt->fetchColumn();
    }
} catch (Exception $e) {
    error_log("Failed to resolve course_id for item {$itemType} #{$itemId}: " . $e->getMessage());
}

if ($courseId <= 0 || !hasCourseAccess($studentId, $courseId)) {
    header("Location: dashboard?msg=access_denied");
    exit;
}

// Toggle completion state
try {
    $check = $pdo->prepare("SELECT id FROM lesson_completions WHERE student_id = ? AND item_type = ? AND item_id = ?");
    $check->execute([$studentId, $itemType, $itemId]);

    if ($check->fetch()) {
        $stmt = $pdo->prepare("DELETE FROM lesson_completions WHERE student_id = ? AND item_type = ? AND item_id = ?");
        $stmt->execute([$studentId, $itemType, $itemId]);
    } else {
        $stmt = $pdo->prepare("INSERT IGNORE INTO lesson_completions (student_id, item_type, item_id) VALUES (?, ?, ?)");
        $stmt->execute([$studentId, $itemType, $itemId]);
        recordStudentActivity($pdo, $studentId);
    }
} catch (Exception $e) {
    error_log("Failed to update lesson completion: " . $e->getMessage());
}

header("Location: " . $redirect);
exit;

