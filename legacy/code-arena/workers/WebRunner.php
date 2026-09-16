<?php
/**
 * code-arena/workers/WebRunner.php
 * Automated DOM Assertion & Functional Test Engine for HTML/CSS/JavaScript
 */
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../queue/QueueManager.php';

class WebRunner {
    private string $workerId;

    public function __construct(string $workerId = '') {
        $this->workerId = $workerId ?: 'worker_web_' . bin2hex(random_bytes(4));
    }

    public function processJob(array $jobPayload): array {
        global $pdo;

        $jobId        = $jobPayload['id'];
        $submissionId = (int)$jobPayload['submission_id'];
        $challengeId  = (int)$jobPayload['challenge_id'];
        $userCode     = $jobPayload['code'];

        QueueManager::updateJobState($jobId, 'RUNNING', $this->workerId);

        // Fetch DOM test assertions from database
        $stmtTc = $pdo->prepare("SELECT input, expected_output, is_hidden FROM challenge_test_cases WHERE challenge_id = ? ORDER BY id ASC");
        $stmtTc->execute([$challengeId]);
        $testCases = $stmtTc->fetchAll(PDO::FETCH_ASSOC);

        $runnerScript = __DIR__ . '/playwright-runner.js';
        $payloadData = json_encode([
            'html_code'  => $userCode,
            'test_cases' => $testCases
        ]);

        $descriptors = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $proc = @proc_open("node " . escapeshellarg($runnerScript), $descriptors, $pipes);

        if (is_resource($proc)) {
            fwrite($pipes[0], $payloadData);
            fclose($pipes[0]);

            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            proc_close($proc);

            $res = json_decode(trim($stdout), true);
            if ($res) {
                $finalVerdict = $res['verdict'] ?? 'SYSTEM_ERROR';
                $passedCases = (int)($res['passed_test_cases'] ?? 0);
                $totalCases = (int)($res['total_test_cases'] ?? count($testCases));
                $stdoutMsg = $res['output'] ?? '';
                $stderrMsg = $res['stderr'] ?? '';

                QueueManager::finishJob(
                    $jobId, $submissionId, $finalVerdict,
                    15, 18400, $passedCases, $totalCases,
                    $stdoutMsg, $stderrMsg
                );

                return [
                    'success' => ($finalVerdict === 'ACCEPTED'),
                    'verdict' => $finalVerdict,
                    'output'  => $stdoutMsg,
                    'stderr'  => $stderrMsg,
                    'execution_time_ms' => 15,
                    'passed_test_cases' => $passedCases,
                    'total_test_cases'  => $totalCases
                ];
            }
        }

        return [
            'success' => ($finalVerdict === 'ACCEPTED'),
            'verdict' => $finalVerdict,
            'output'  => $stdout,
            'stderr'  => implode("\n", $consoleErrors),
            'execution_time_ms' => 12,
            'passed_test_cases' => $passedCases,
            'total_test_cases'  => $totalCases
        ];
    }
}
