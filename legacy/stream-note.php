<?php
// Serves a PDF note only after verifying the requester is logged in AND
// enrolled in the course it belongs to. The actual file lives under
// uploads/notes/, which is blocked from direct web access by
// uploads/.htaccess — this script is the only way in.
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = 0;
$hasPrivilegedPreview = !empty($_SESSION['admin_id']) || !empty($_SESSION['instructor_id']);
if (!$hasPrivilegedPreview) {
    $studentId = requireStudent();
}
$noteId = (int)($_GET["id"] ?? 0);

$stmt = $pdo->prepare("
    SELECT n.file_path, n.title, m.course_id
    FROM notes n
    JOIN modules m ON n.module_id = m.id
    WHERE n.id = ?
");
$stmt->execute([$noteId]);
$note = $stmt->fetch();

if (!$note) {
    http_response_code(404);
    exit("Note not found.");
}

// Entitlement check — redirects/exits internally if not enrolled
if (!empty($_SESSION['admin_id'])) {
    // Admins may preview any course material.
} elseif (!empty($_SESSION['instructor_id'])) {
    require_once __DIR__ . '/instructor-auth.php';
    if (!is_course_assigned_to_instructor((int)$_SESSION['instructor_id'], (int)$note['course_id'])) {
        http_response_code(403);
        exit("Forbidden.");
    }
} else {
    requireCourseAccess($studentId, $note['course_id']);
}

$path = __DIR__ . "/" . ltrim($note['file_path'], "/");
$realBase = realpath(__DIR__ . "/uploads/notes");
$realPath = realpath($path);

// Defense in depth: file must actually live inside uploads/notes/
if (
    !$realPath ||
    !$realBase ||
    !str_starts_with($realPath, $realBase . DIRECTORY_SEPARATOR) ||
    !is_file($realPath)
) {
    http_response_code(404);
    exit("Note not found.");
}

$download = isset($_GET['download']);

header("Content-Type: application/pdf");
header("Cache-Control: private, max-age=0, no-store");
header("X-Content-Type-Options: nosniff");
header("Content-Length: " . filesize($realPath));
if ($download) {
    $safeName = preg_replace('/[^A-Za-z0-9 _.-]/', '', $note['title']) ?: 'note';
    header("Content-Disposition: attachment; filename=\"$safeName.pdf\"");
} else {
    header("Content-Disposition: inline");
}

readfile($realPath);
exit;
