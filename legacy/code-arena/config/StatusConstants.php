<?php
/**
 * code-arena/config/StatusConstants.php
 * Canonical Job Lifecycle & Final Verdict Constants for Code Arena
 */
class StatusConstants {
    // Lifecycle States
    public const QUEUED    = 'QUEUED';
    public const ASSIGNED  = 'ASSIGNED';
    public const COMPILING = 'COMPILING';
    public const RUNNING   = 'RUNNING';
    public const JUDGING   = 'JUDGING';

    // Final Verdicts
    public const ACCEPTED              = 'ACCEPTED';
    public const WRONG_ANSWER          = 'WRONG_ANSWER';
    public const COMPILATION_ERROR     = 'COMPILATION_ERROR';
    public const RUNTIME_ERROR         = 'RUNTIME_ERROR';
    public const TIME_LIMIT_EXCEEDED   = 'TIME_LIMIT_EXCEEDED';
    public const MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED';
    public const SECURITY_VIOLATION    = 'SECURITY_VIOLATION';
    public const SYSTEM_ERROR          = 'SYSTEM_ERROR';
    public const SANDBOX_UNAVAILABLE   = 'SANDBOX_UNAVAILABLE';
    public const CANCELLED             = 'CANCELLED';

    public static function isValidStatus(string $status): bool {
        $allowed = [
            self::QUEUED, self::ASSIGNED, self::COMPILING, self::RUNNING, self::JUDGING,
            self::ACCEPTED, self::WRONG_ANSWER, self::COMPILATION_ERROR, self::RUNTIME_ERROR,
            self::TIME_LIMIT_EXCEEDED, self::MEMORY_LIMIT_EXCEEDED, self::SECURITY_VIOLATION,
            self::SYSTEM_ERROR, self::SANDBOX_UNAVAILABLE, self::CANCELLED
        ];
        return in_array($status, $allowed, true);
    }
}
