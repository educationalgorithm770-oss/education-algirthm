<?php
/**
 * code-arena/workers/run-native-worker.php — Long-Running Native Execution Worker Daemon
 * Run via CLI: php code-arena/workers/run-native-worker.php
 */
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../queue/QueueManager.php';
require_once __DIR__ . '/NativeWorker.php';

$workerId = 'worker_native_' . bin2hex(random_bytes(4));
echo "===============================================================\n";
echo "🛡️ Code Arena Long-Running Native Worker Daemon ({$workerId})\n";
echo "===============================================================\n";
echo "Listening for enqueued jobs in Redis/MySQL queue...\n";

$worker = new NativeWorker($workerId);
$jobsProcessed = 0;
$isDaemon = (php_sapi_name() === 'cli');

while (true) {
    $jobPayload = QueueManager::claimJob($workerId, 'NATIVE');

    if ($jobPayload) {
        $jobId = $jobPayload['id'];
        $lang = strtolower($jobPayload['language']);

        if (in_array($lang, ['python', 'py', 'java', 'cpp', 'c', 'javascript', 'js', 'node', 'sql'])) {
            echo " [CLAIMED] Job ID: {$jobId} | Lang: {$lang} | Sub ID: {$jobPayload['submission_id']}\n";
            QueueManager::sendHeartbeat($jobId, $workerId);
            $res = $worker->processJob($jobPayload);
            echo " [COMPLETED] Job ID: {$jobId} | Verdict: {$res['verdict']} | Exec Time: {$res['execution_time_ms']}ms\n";
            $jobsProcessed++;
        }
    } else {
        usleep(500000); // Sleep 500ms when queue is empty
    }

    if (!$isDaemon && $jobsProcessed > 0) {
        break; // Single execution pass if run outside CLI loop
    }
}
