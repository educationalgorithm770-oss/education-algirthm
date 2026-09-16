<?php
// Serves a video only after verifying the requester is logged in AND
// enrolled in the course it belongs to. The actual file lives under
// uploads/videos/, which is blocked from direct web access by
// uploads/.htaccess — this script is the only way in.
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = 0;
$hasPrivilegedPreview = !empty($_SESSION['admin_id']) || !empty($_SESSION['instructor_id']);
if (!$hasPrivilegedPreview) {
    $studentId = requireStudent();
}
$videoId = (int)($_GET["id"] ?? 0);

$stmt = $pdo->prepare("
    SELECT v.file_path, m.course_id
    FROM videos v
    JOIN modules m ON v.module_id = m.id
    WHERE v.id = ?
");
$stmt->execute([$videoId]);
$video = $stmt->fetch();

if (!$video) {
    http_response_code(404);
    exit("Video not found.");
}

// Entitlement check — redirects/exits internally if not enrolled
if (!empty($_SESSION['admin_id'])) {
    // Admins may preview any course material.
} elseif (!empty($_SESSION['instructor_id'])) {
    require_once __DIR__ . '/instructor-auth.php';
    if (!is_course_assigned_to_instructor((int)$_SESSION['instructor_id'], (int)$video['course_id'])) {
        http_response_code(403);
        exit("Forbidden.");
    }
} else {
    requireCourseAccess($studentId, $video['course_id']);
}

// Server-Authoritative Security Restriction Check
require_once __DIR__ . '/includes/security-events.php';
if ($studentId > 0 && hasActiveSecurityRestriction($studentId, $videoId)) {
    http_response_code(403);
    header('Content-Type: application/json');
    exit(json_encode([
        'error' => 'PLAYBACK_RESTRICTED',
        'message' => 'Video streaming is temporarily locked due to an active security restriction.'
    ]));
}

$path = __DIR__ . "/" . ltrim($video['file_path'], "/");
$realBase = realpath(__DIR__ . "/uploads/videos");
$realPath = realpath($path);

// Defense in depth: file must actually live inside uploads/videos/
if (
    !$realPath ||
    !$realBase ||
    !str_starts_with($realPath, $realBase . DIRECTORY_SEPARATOR) ||
    !is_file($realPath)
) {
    http_response_code(404);
    exit("Video not found.");
}

$fileSize = filesize($realPath);
$mime = mime_content_type($realPath) ?: "video/mp4";

header("Content-Type: " . $mime);
header("Accept-Ranges: bytes");
header("Cache-Control: private, max-age=0, no-store");
header("X-Content-Type-Options: nosniff");

$start = 0;
$end = $fileSize - 1;

// Support HTTP Range requests so the video player can seek
if (isset($_SERVER['HTTP_RANGE'])) {
    if (preg_match('/bytes=(\d*)-(\d*)/', $_SERVER['HTTP_RANGE'], $m)) {
        if ($m[1] !== '') $start = (int)$m[1];
        if ($m[2] !== '') $end = (int)$m[2];
        $end = min($end, $fileSize - 1);

        http_response_code(206);
        header("Content-Range: bytes $start-$end/$fileSize");
    }
}

$length = $end - $start + 1;
header("Content-Length: " . $length);

$fp = fopen($realPath, 'rb');
if ($fp === false) {
    http_response_code(500);
    exit("Unable to read video.");
}
fseek($fp, $start);
$bytesLeft = $length;
$chunkSize = 8192;
while ($bytesLeft > 0 && !feof($fp)) {
    $read = min($chunkSize, $bytesLeft);
    echo fread($fp, $read);
    $bytesLeft -= $read;
    flush();
}
fclose($fp);
exit;
