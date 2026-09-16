<?php
/**
 * code-arena/queue/QueueManager.php
 * Production Redis & MySQL Transport Queue Manager with Atomic Claiming, Leases, Heartbeats & DLQ
 */
require_once __DIR__ . '/../../config.php';

class QueueManager {
    private static ?Redis $redis = null;
    private static string $nativeQueueKey = 'ea_code_arena_native_queue';
    private static string $webQueueKey    = 'ea_code_arena_web_queue';
    private static string $deadLetterKey  = 'ea_code_arena_dlq';

    private static function getRedis(): ?Redis {
        if (self::$redis !== null) {
            return self::$redis;
        }
        if (class_exists('Redis')) {
            try {
                $r = new Redis();
                $host = env('REDIS_HOST', '127.0.0.1');
                $port = (int)env('REDIS_PORT', 6379);
                if (@$r->connect($host, $port, 1.5)) {
                    self::$redis = $r;
                    return self::$redis;
                }
            } catch (Exception $e) {
                // Fallback to database queue
            }
        }
        return null;
    }

    public static function enqueueJob(int $submissionId, int $studentId, int $challengeId, string $language, string $code, string $customInput = ''): array {
        global $pdo;

        $jobId = 'job_' . bin2hex(random_bytes(12));
        $isWeb = in_array(strtolower($language), ['html', 'css', 'web'], true);
        $jobType = $isWeb ? 'WEB' : 'NATIVE';
        $targetQueueKey = $isWeb ? self::$webQueueKey : self::$nativeQueueKey;
        
        // Create durable execution job record in MySQL if table exists
        try {
            $stmt = $pdo->prepare("
                INSERT INTO execution_jobs (id, submission_id, student_id, job_type, status, priority, retry_count, max_retries, created_at)
                VALUES (?, ?, ?, ?, 'QUEUED', 0, 0, 3, NOW())
            ");
            $stmt->execute([$jobId, $submissionId, $studentId, $jobType]);
        } catch (Throwable $e) {
            error_log("QueueManager execution_jobs notice: " . $e->getMessage());
        }

        $jobPayload = [
            'id' => $jobId,
            'submission_id' => $submissionId,
            'student_id' => $studentId,
            'challenge_id' => $challengeId,
            'language' => $language,
            'job_type' => $jobType,
            'code' => $code,
            'custom_input' => $customInput,
            'enqueued_at' => time()
        ];

        $r = self::getRedis();
        if ($r) {
            $r->lPush($targetQueueKey, json_encode($jobPayload));
        } else {
            // File queue fallback
            $queueDir = __DIR__ . '/../sandbox/queue_storage/' . strtolower($jobType) . '/';
            if (!is_dir($queueDir)) mkdir($queueDir, 0755, true);
            file_put_contents($queueDir . $jobId . '.json', json_encode($jobPayload));
        }

        return [
            'success' => true,
            'submission_id' => $submissionId,
            'job_id' => $jobId,
            'status' => 'QUEUED'
        ];
    }

    public static function claimJob(string $workerId, string $targetType = 'NATIVE'): ?array {
        global $pdo;

        self::reclaimStuckJobs();

        $jobPayload = null;
        $r = self::getRedis();
        $targetQueueKey = (strtoupper($targetType) === 'WEB') ? self::$webQueueKey : self::$nativeQueueKey;

        if ($r) {
            $raw = $r->rPop($targetQueueKey);
            if ($raw) {
                $jobPayload = json_decode($raw, true);
            }
        } else {
            $queueDir = __DIR__ . '/../sandbox/queue_storage/' . strtolower($targetType) . '/';
            if (is_dir($queueDir)) {
                $files = glob($queueDir . 'job_*.json');
                if (!empty($files)) {
                    $file = $files[0];
                    $raw = file_get_contents($file);
                    @unlink($file);
                    if ($raw) {
                        $jobPayload = json_decode($raw, true);
                    }
                }
            }
        }

        if (!$jobPayload) {
            return null;
        }

        $jobId = $jobPayload['id'];
        $stmt = $pdo->prepare("
            UPDATE execution_jobs 
            SET status = 'ASSIGNED', worker_id = ?, started_at = NOW(), heartbeat_at = NOW(), lease_expires_at = DATE_ADD(NOW(), INTERVAL 30 SECOND)
            WHERE id = ? AND status = 'QUEUED'
        ");
        $stmt->execute([$workerId, $jobId]);

        return $jobPayload;
    }

    public static function sendHeartbeat(string $jobId, string $workerId): void {
        global $pdo;
        $stmt = $pdo->prepare("
            UPDATE execution_jobs 
            SET heartbeat_at = NOW(), lease_expires_at = DATE_ADD(NOW(), INTERVAL 30 SECOND) 
            WHERE id = ? AND worker_id = ?
        ");
        $stmt->execute([$jobId, $workerId]);
    }

    public static function updateJobState(string $jobId, string $status, ?string $workerId = null): void {
        global $pdo;
        $stmt = $pdo->prepare("UPDATE execution_jobs SET status = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $jobId]);
    }

    public static function finishJob(string $jobId, int $submissionId, string $verdict, int $execTimeMs = 0, int $memoryKb = 0, int $passedCases = 0, int $totalCases = 0, string $stdout = '', string $stderr = ''): void {
        global $pdo;

        try {
            $pdo->beginTransaction();

            $jobStatus = ($verdict === 'SYSTEM_ERROR') ? 'FAILED' : 'COMPLETED';
            $stmtJob = $pdo->prepare("
                UPDATE execution_jobs 
                SET status = ?, completed_at = NOW() 
                WHERE id = ?
            ");
            $stmtJob->execute([$jobStatus, $jobId]);

            $stmtSub = $pdo->prepare("
                UPDATE code_submissions 
                SET verdict = ?, status = ?, execution_time_ms = ?, memory_kb = ?, passed_test_cases = ?, test_cases_passed = ?, total_test_cases = ?
                WHERE id = ?
            ");
            $stmtSub->execute([$verdict, $verdict, $execTimeMs, $memoryKb, $passedCases, $passedCases, $totalCases, $submissionId]);

            $pdo->commit();
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Finish job error: " . $e->getMessage());
        }
    }

    public static function reclaimStuckJobs(): void {
        global $pdo;
        try {
            // Reclaim jobs with expired lease or missing heartbeat (> 30s)
            $stmt = $pdo->query("
                SELECT id, submission_id, retry_count, max_retries 
                FROM execution_jobs 
                WHERE status IN ('ASSIGNED', 'COMPILING', 'RUNNING', 'JUDGING') 
                AND (lease_expires_at < NOW() OR heartbeat_at < DATE_SUB(NOW(), INTERVAL 30 SECOND))
            ");
            $stuckJobs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($stuckJobs as $j) {
                if ((int)$j['retry_count'] >= (int)$j['max_retries']) {
                    // Move job to Dead-Letter Queue (DLQ)
                    self::moveToDeadLetterQueue($j['id'], (int)$j['submission_id'], 'Lease timeout / worker heartbeat loss');
                } else {
                    // Reclaim job for retry
                    $pdo->prepare("
                        UPDATE execution_jobs 
                        SET status = 'QUEUED', retry_count = retry_count + 1, worker_id = NULL, started_at = NULL 
                        WHERE id = ?
                    ")->execute([$j['id']]);
                }
            }
        } catch (Exception $e) {
            error_log("Reclaim stuck jobs error: " . $e->getMessage());
        }
    }

    public static function moveToDeadLetterQueue(string $jobId, int $submissionId, string $reason): void {
        global $pdo;
        
        $stmt = $pdo->prepare("UPDATE execution_jobs SET status = 'FAILED', error_message = ? WHERE id = ?");
        $stmt->execute([$reason, $jobId]);

        $stmtSub = $pdo->prepare("UPDATE code_submissions SET verdict = 'SYSTEM_ERROR', status = 'SYSTEM_ERROR' WHERE id = ?");
        $stmtSub->execute([$submissionId]);

        $r = self::getRedis();
        if ($r) {
            $r->lPush(self::$deadLetterKey, json_encode([
                'job_id' => $jobId,
                'submission_id' => $submissionId,
                'reason' => $reason,
                'failed_at' => date('Y-m-d H:i:s')
            ]));
        }
    }

    public static function getDeadLetterJobs(): array {
        global $pdo;
        $stmt = $pdo->query("
            SELECT j.id AS job_id, j.submission_id, j.retry_count, j.error_message, j.created_at, s.language, s.student_id
            FROM execution_jobs j
            JOIN code_submissions s ON j.submission_id = s.id
            WHERE j.status = 'FAILED'
            ORDER BY j.created_at DESC
            LIMIT 50
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
