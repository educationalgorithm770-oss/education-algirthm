<?php
/**
 * code-arena/workers/run-web-worker.php — Long-Running HTML Web Execution Worker Daemon
 * Run via CLI: php code-arena/workers/run-web-worker.php
 */
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../queue/QueueManager.php';
require_once __DIR__ . '/WebRunner.php';

$workerId = 'worker_web_' . bin2hex(random_bytes(4));
echo "===============================================================\n";
echo "🛡️ Code Arena Long-Running Web Worker Daemon ({$workerId})\n";
echo "===============================================================\n";
echo "Listening for HTML/CSS DOM execution jobs in Redis/MySQL queue...\n";

$runner = new WebRunner($workerId);
$jobsProcessed = 0;
$isDaemon = (php_sapi_name() === 'cli');

while (true) {
    $jobPayload = QueueManager::claimJob($workerId, 'WEB');

    if ($jobPayload) {
        $jobId = $jobPayload['id'];
        $lang = strtolower($jobPayload['language']);

        if (in_array($lang, ['html', 'css', 'web'])) {
            echo " [CLAIMED WEB JOB] Job ID: {$jobId} | Sub ID: {$jobPayload['submission_id']}\n";
            QueueManager::sendHeartbeat($jobId, $workerId);
            $res = $runner->processJob($jobPayload);
            echo " [COMPLETED WEB JOB] Job ID: {$jobId} | Verdict: {$res['verdict']}\n";
            $jobsProcessed++;
        }
    } else {
        usleep(500000); // Sleep 500ms
    }

    if (!$isDaemon && $jobsProcessed > 0) {
        break;
    }
}
