<?php
// includes/security-events.php
// Server-Authoritative Lecture Security Events & Recording Protection Library
require_once __DIR__ . '/../config.php';

/**
 * Creates a persistent security event associated with the authenticated student session.
 *
 * @param int $studentId
 * @param int $courseId
 * @param int $videoId
 * @param string $eventType (e.g. 'get_display_media', 'media_recorder_intercept', 'stream_rip_attempt', 'shortcut_capture')
 * @param string $severity ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
 * @param array $metadata
 * @param int $cooldownSec (Default: 300s / 5 minutes)
 * @return array
 */
function createLectureSecurityEvent(int $studentId, int $courseId, int $videoId, string $eventType, string $severity = 'HIGH', array $metadata = [], int $cooldownSec = 300): array {
    global $pdo;

    $sessionId = session_id() ?: ('sess_' . bin2hex(random_bytes(16)));
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $userAgent = mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);
    $detectedAt = date('Y-m-d H:i:s');
    $expiresAt = date('Y-m-d H:i:s', time() + $cooldownSec);

    // Check if there is already an ACTIVE event for this student + video to avoid spamming duplicates
    $stmtCheck = $pdo->prepare("
        SELECT id, expires_at, status 
        FROM lecture_security_events 
        WHERE student_id = ? AND video_id = ? AND status = 'ACTIVE'
        ORDER BY id DESC LIMIT 1
    ");
    $stmtCheck->execute([$studentId, $videoId]);
    $existing = $stmtCheck->fetch();

    if ($existing) {
        // Extend existing active event expiration if new detection arrives
        $stmtUpdate = $pdo->prepare("
            UPDATE lecture_security_events 
            SET expires_at = ?, metadata = ?, updated_at = NOW() 
            WHERE id = ?
        ");
        $stmtUpdate->execute([$expiresAt, json_encode($metadata), $existing['id']]);
        $eventId = (int)$existing['id'];
    } else {
        $stmtInsert = $pdo->prepare("
            INSERT INTO lecture_security_events 
            (student_id, course_id, video_id, session_id, event_type, status, severity, detected_at, expires_at, metadata, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsert->execute([
            $studentId,
            $courseId,
            $videoId,
            $sessionId,
            $eventType,
            $severity,
            $detectedAt,
            $expiresAt,
            json_encode($metadata),
            $ip,
            $userAgent
        ]);
        $eventId = (int)$pdo->lastInsertId();
    }

    return [
        'success' => true,
        'eventId' => $eventId,
        'securityStatus' => 'RESTRICTED',
        'playbackAllowed' => false,
        'expiresAt' => $expiresAt,
        'cooldownSeconds' => $cooldownSec,
        'reason' => 'ACTIVE_SECURITY_EVENT',
        'eventType' => $eventType
    ];
}

/**
 * Checks and retrieves any ACTIVE, unexpired security event for a student and lecture.
 *
 * @param int $studentId
 * @param int $videoId
 * @return array|null
 */
function getActiveLectureSecurityEvent(int $studentId, int $videoId): ?array {
    global $pdo;

    if ($studentId <= 0 || $videoId <= 0) {
        return null;
    }

    // Auto-expire past events first
    try {
        $pdo->prepare("
            UPDATE lecture_security_events 
            SET status = 'EXPIRED', updated_at = NOW() 
            WHERE student_id = ? AND video_id = ? AND status = 'ACTIVE' AND expires_at <= NOW()
        ")->execute([$studentId, $videoId]);
    } catch (Exception $e) {}

    $stmt = $pdo->prepare("
        SELECT id, student_id, course_id, video_id, session_id, event_type, status, severity, detected_at, expires_at, metadata,
               TIMESTAMPDIFF(SECOND, NOW(), expires_at) as remaining_seconds
        FROM lecture_security_events
        WHERE student_id = ? AND video_id = ? AND status = 'ACTIVE' AND expires_at > NOW()
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$studentId, $videoId]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    return $event ?: null;
}

/**
 * Returns true if student is currently restricted from viewing the video.
 *
 * @param int $studentId
 * @param int $videoId
 * @return bool
 */
function hasActiveSecurityRestriction(int $studentId, int $videoId): bool {
    $event = getActiveLectureSecurityEvent($studentId, $videoId);
    return !empty($event);
}

/**
 * Resolves an active security event after verification / cooling period.
 *
 * @param int $eventId
 * @param int $studentId
 * @param string $reason
 * @return bool
 */
function resolveLectureSecurityEvent(int $eventId, int $studentId, string $reason = 'STUDENT_COOLDOWN_EXPIRED'): bool {
    global $pdo;

    $stmt = $pdo->prepare("
        UPDATE lecture_security_events 
        SET status = 'RESOLVED', resolved_at = NOW(), resolution_reason = ?, updated_at = NOW()
        WHERE id = ? AND student_id = ? AND status = 'ACTIVE'
    ");
    $stmt->execute([$reason, $eventId, $studentId]);
    return $stmt->rowCount() > 0;
}