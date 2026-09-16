<?php
/**
 * code-arena/queue/inspect-dlq.php — Dead-Letter Queue Inspection CLI Tool
 */
require_once __DIR__ . '/QueueManager.php';

echo "===============================================================\n";
echo "🛡️ Code Arena Dead-Letter Queue (DLQ) Inspection Tool\n";
echo "===============================================================\n";

$dlqJobs = QueueManager::getDeadLetterJobs();
if (empty($dlqJobs)) {
    echo " ✓ [PASS] Dead-Letter Queue is empty. Zero infrastructure failures.\n";
} else {
    echo " ⚠️ Found " . count($dlqJobs) . " failed job(s) in Dead-Letter Queue:\n\n";
    foreach ($dlqJobs as $j) {
        echo " - Job ID: " . $j['job_id'] . "\n";
        echo "   Submission ID: " . $j['submission_id'] . "\n";
        echo "   Student ID: " . $j['student_id'] . "\n";
        echo "   Language: " . $j['language'] . "\n";
        echo "   Retries: " . $j['retry_count'] . "\n";
        echo "   Failure Reason: " . $j['error_message'] . "\n";
        echo "   Failed At: " . $j['created_at'] . "\n";
        echo "   ---------------------------------------------------------\n";
    }
}
echo "===============================================================\n";
