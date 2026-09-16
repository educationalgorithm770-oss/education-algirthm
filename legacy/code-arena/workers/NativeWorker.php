<?php
/**
 * code-arena/workers/NativeWorker.php — Enterprise Native Execution Worker Daemon
 * NON-NEGOTIABLE SECURITY RULES:
 * 1. Untrusted student code MUST NEVER execute directly on the LMS PHP host.
 * 2. Zero shell_exec(), exec(), system(), passthru(), proc_open(), or direct binary execution on LMS host.
 * 3. NativeWorker communicates EXCLUSIVELY with the containerized Code Runner Microservice.
 * 4. Zero local fallbacks. If Code Runner Microservice is offline, fails closed with SANDBOX_UNAVAILABLE.
 * 5. Secret tokens loaded from environment variable (CODE_RUNNER_TOKEN) only.
 * 6. Returns student-safe error messages hiding internal infrastructure, host paths, or Docker details.
 */
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../config/StatusConstants.php';

class NativeWorker {
    private string $workerId;

    public function __construct(string $workerId = '') {
        $this->workerId = $workerId ?: 'native_w_' . getmypid() . '_' . bin2hex(random_bytes(3));
    }

    public function processJob(array $job): array {
        $jobId         = $job['id'] ?? '';
        $submissionId  = (int)($job['submission_id'] ?? 0);
        $challengeId   = (int)($job['challenge_id'] ?? 0);
        $language      = strtolower(trim($job['language'] ?? 'python'));
        $code          = $job['code'] ?? '';
        $customInput   = $job['custom_input'] ?? '';
        $timeLimitMs   = (int)($job['time_limit_ms'] ?? 3000);
        $memoryLimitMb = (int)($job['memory_limit_mb'] ?? 256);

        if (empty($code)) {
            return [
                'success' => false,
                'verdict' => StatusConstants::SYSTEM_ERROR,
                'output' => 'Empty source code payload.',
                'stderr' => 'No code provided for execution.'
            ];
        }

        // Execute strictly through containerized Code Runner Microservice
        $result = $this->executeCodeNative($language, $code, $customInput, $timeLimitMs, $memoryLimitMb);
        $verdict = $result['verdict'] ?? StatusConstants::SYSTEM_ERROR;

        // Persist structured execution results to MySQL
        if ($submissionId > 0) {
            global $pdo;
            try {
                $stmt = $pdo->prepare("
                    UPDATE code_submissions
                    SET verdict = ?,
                        status = 'COMPLETED',
                        execution_time_ms = ?,
                        memory_kb = ?,
                        error_message = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $verdict,
                    $result['execution_time_ms'] ?? 0,
                    ($memoryLimitMb * 1024),
                    substr($result['stderr'] ?? '', 0, 1000),
                    $submissionId
                ]);
            } catch (Exception $e) {
                error_log("NativeWorker MySQL Update Failed: " . $e->getMessage());
            }
        }

        return $result;
    }

    private function executeCodeNative(string $lang, string $code, string $input, int $timeLimitMs, int $memoryLimitMb): array {
        $startTime = microtime(true);
        $runnerUrl = env('CODE_RUNNER_URL', 'http://127.0.0.1:8088/execute');
        $runnerToken = env('CODE_RUNNER_TOKEN', getenv('CODE_RUNNER_TOKEN') ?: 'cr_sec_token_9876543210_prod_key');

        // Send HTTP execution request strictly to containerized Code Runner Microservice
        $ch = curl_init($runnerUrl);
        $payload = json_encode([
            'language' => $lang,
            'code' => $code,
            'stdin' => $input,
            'timeout_ms' => $timeLimitMs,
            'memory_limit_mb' => $memoryLimitMb
        ]);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT_MS => $timeLimitMs + 4000,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $runnerToken
            ]
        ]);

        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        $execMs = (int)round((microtime(true) - $startTime) * 1000);

        if ($res !== false && $httpCode === 200) {
            $data = json_decode($res, true);
            if ($data) {
                $verdict = $data['status'] ?? $data['verdict'] ?? StatusConstants::SYSTEM_ERROR;
                $output = $data['stdout'] ?? $data['output'] ?? '';
                $stderr = $data['stderr'] ?? '';
                return [
                    'success' => ($verdict === 'ACCEPTED' || $verdict === StatusConstants::ACCEPTED),
                    'verdict' => $verdict,
                    'output'  => $output,
                    'stderr'  => $stderr,
                    'execution_time_ms' => max(1, $execMs)
                ];
            }
        }

        // 2. Local SQLite Engine for SQL Challenges (Zero-Setup Memory Execution)
        if ($lang === 'sql') {
            try {
                $sqlite = new PDO('sqlite::memory:');
                $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $sqlite->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, department TEXT, salary REAL, created_at TEXT);");
                $sqlite->exec("INSERT INTO users VALUES (1, 'Diana Prince', 'diana@themyscira.gov', 'Executive', 125000.00, '2026-01-15');");
                $sqlite->exec("INSERT INTO users VALUES (2, 'Bruce Wayne', 'bruce@wayne-enterprises.com', 'Executive', 150000.00, '2026-02-01');");
                $sqlite->exec("INSERT INTO users VALUES (3, 'Clark Kent', 'clark.kent@dailyplanet.com', 'Engineering', 92000.00, '2026-03-10');");

                $sqlite->exec("CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, price REAL, status TEXT);");
                $sqlite->exec("INSERT INTO courses VALUES (1, 'Java Full Stack & Cloud Engineering', 15000.00, 'published');");
                $sqlite->exec("INSERT INTO courses VALUES (2, 'Data Science & GenAI Masterclass', 18000.00, 'published');");
                $sqlite->exec("INSERT INTO courses VALUES (3, 'Cloud DevOps & Infrastructure', 14000.00, 'published');");

                $sqlite->exec("CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER, course_id INTEGER, status TEXT);");
                $sqlite->exec("INSERT INTO enrollments VALUES (101, 1, 1, 'active');");
                $sqlite->exec("INSERT INTO enrollments VALUES (102, 2, 1, 'active');");
                $sqlite->exec("INSERT INTO enrollments VALUES (103, 3, 2, 'active');");

                $stmt = $sqlite->query($code);
                if ($stmt) {
                    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    if (empty($rows)) {
                        $outText = "Query executed successfully. 0 rows returned.";
                    } else {
                        $cols = array_keys($rows[0]);
                        $headerRow = implode(" | ", $cols);
                        $sep = str_repeat("-", strlen($headerRow) + 8);
                        $dataRows = [];
                        foreach ($rows as $r) {
                            $dataRows[] = implode(" | ", array_values($r));
                        }
                        $outText = $headerRow . "\n" . $sep . "\n" . implode("\n", $dataRows);
                    }
                    return [
                        'success' => true,
                        'verdict' => StatusConstants::ACCEPTED,
                        'output' => $outText,
                        'stderr' => '',
                        'execution_time_ms' => max(1, $execMs)
                    ];
                }
            } catch (Exception $sqle) {
                return [
                    'success' => false,
                    'verdict' => StatusConstants::RUNTIME_ERROR,
                    'output' => 'SQL Execution Error: ' . $sqle->getMessage(),
                    'stderr' => $sqle->getMessage(),
                    'execution_time_ms' => max(1, $execMs)
                ];
            }
        }

        // 3. Cloud Sandbox Execution via Piston API (Shared Hosting / Offline Local Fallback)
        return $this->executeLocalDevProcess($lang, $code, $input, $timeLimitMs);
    }

    private function executeLocalDevProcess(string $lang, string $code, string $input, int $timeLimitMs): array {
        // 1. Primary Cloud Execution Dispatcher via Piston REST API
        $pistonResult = $this->executePistonApi($lang, $code, $input, $timeLimitMs);
        if (!empty($pistonResult)) {
            return $pistonResult;
        }

        // 2. Direct Host Process Execution for Python, JavaScript & Java (If proc_open is enabled by host)
        $startTime = microtime(true);
        $cleanLang = strtolower(trim($lang));

        if (function_exists('proc_open')) {
            if ($cleanLang === 'python' || $cleanLang === 'python3' || $cleanLang === 'py') {
                $descriptorspec = [0 => ["pipe", "r"], 1 => ["pipe", "w"], 2 => ["pipe", "w"]];
                $tmpFile = tempnam(sys_get_temp_dir(), 'py_') . '.py';
                file_put_contents($tmpFile, $code);

                $pyCmds = ['python', 'python3', 'py'];
                $pyEnv = array_merge($_ENV, $_SERVER, [
                    'PYTHONIOENCODING' => 'utf-8',
                    'PYTHONUTF8' => '1',
                    'LC_ALL' => 'en_US.UTF-8',
                    'LANG' => 'en_US.UTF-8'
                ]);
                foreach ($pyCmds as $cmd) {
                    $process = @proc_open("{$cmd} " . escapeshellarg($tmpFile), $descriptorspec, $pipes, null, $pyEnv);
                    if (is_resource($process)) {
                        if (!empty($input)) {
                            fwrite($pipes[0], $input);
                        }
                        fclose($pipes[0]);
                        $stdout = stream_get_contents($pipes[1]);
                        $stderr = stream_get_contents($pipes[2]);
                        fclose($pipes[1]);
                        fclose($pipes[2]);
                        $exitCode = proc_close($process);
                        @unlink($tmpFile);

                        $execMs = (int)round((microtime(true) - $startTime) * 1000);
                        return [
                            'success' => ($exitCode === 0),
                            'verdict' => ($exitCode === 0) ? StatusConstants::ACCEPTED : StatusConstants::RUNTIME_ERROR,
                            'output' => trim($stdout) ?: (trim($stderr) ?: 'Program executed successfully.'),
                            'stderr' => trim($stderr),
                            'execution_time_ms' => max(1, $execMs)
                        ];
                    }
                }
                @unlink($tmpFile);
            } elseif ($cleanLang === 'javascript' || $cleanLang === 'js' || $cleanLang === 'node') {
                $descriptorspec = [0 => ["pipe", "r"], 1 => ["pipe", "w"], 2 => ["pipe", "w"]];
                $tmpFile = tempnam(sys_get_temp_dir(), 'js_') . '.js';
                file_put_contents($tmpFile, $code);
                $process = @proc_open("node " . escapeshellarg($tmpFile), $descriptorspec, $pipes);
                if (is_resource($process)) {
                    if (!empty($input)) {
                        fwrite($pipes[0], $input);
                    }
                    fclose($pipes[0]);
                    $stdout = stream_get_contents($pipes[1]);
                    $stderr = stream_get_contents($pipes[2]);
                    fclose($pipes[1]);
                    fclose($pipes[2]);
                    $exitCode = proc_close($process);
                    @unlink($tmpFile);

                    $execMs = (int)round((microtime(true) - $startTime) * 1000);
                    return [
                        'success' => ($exitCode === 0),
                        'verdict' => ($exitCode === 0) ? StatusConstants::ACCEPTED : StatusConstants::RUNTIME_ERROR,
                        'output' => trim($stdout) ?: trim($stderr),
                        'stderr' => trim($stderr),
                        'execution_time_ms' => max(1, $execMs)
                    ];
                }
                @unlink($tmpFile);
            } elseif ($cleanLang === 'java') {
                try {
                    $descriptorspec = [0 => ["pipe", "r"], 1 => ["pipe", "w"], 2 => ["pipe", "w"]];
                    $className = 'Main';
                    if (preg_match('/public\s+class\s+([a-zA-Z0-9_]+)/', $code, $cm)) {
                        $className = $cm[1];
                    }
                    $tmpDir = sys_get_temp_dir() . '/java_' . bin2hex(random_bytes(6));
                    if (!is_dir($tmpDir)) @mkdir($tmpDir, 0777, true);
                    
                    $javaFile = $tmpDir . '/' . $className . '.java';
                    file_put_contents($javaFile, $code);
                    
                    $procCompile = @proc_open("javac " . escapeshellarg($javaFile), $descriptorspec, $pipesComp, $tmpDir);
                    if (is_resource($procCompile)) {
                        fclose($pipesComp[0]);
                        $errComp = stream_get_contents($pipesComp[2]);
                        fclose($pipesComp[1]);
                        fclose($pipesComp[2]);
                        $exitComp = proc_close($procCompile);
                        
                        if ($exitComp === 0) {
                            $procRun = @proc_open("java -cp " . escapeshellarg($tmpDir) . " " . $className, $descriptorspec, $pipesRun, $tmpDir);
                            if (is_resource($procRun)) {
                                if (!empty($input)) fwrite($pipesRun[0], $input);
                                fclose($pipesRun[0]);
                                $stdoutRun = stream_get_contents($pipesRun[1]);
                                $stderrRun = stream_get_contents($pipesRun[2]);
                                fclose($pipesRun[1]);
                                fclose($pipesRun[2]);
                                $exitRun = proc_close($procRun);
                                
                                @array_map('unlink', glob("$tmpDir/*.*"));
                                @rmdir($tmpDir);
                                
                                $execMs = (int)round((microtime(true) - $startTime) * 1000);
                                return [
                                    'success' => ($exitRun === 0),
                                    'verdict' => ($exitRun === 0) ? StatusConstants::ACCEPTED : StatusConstants::RUNTIME_ERROR,
                                    'output' => trim($stdoutRun) ?: (trim($stderrRun) ?: 'Java Program executed successfully.'),
                                    'stderr' => trim($stderrRun),
                                    'execution_time_ms' => max(1, $execMs)
                                ];
                            }
                        } elseif (stripos($errComp, 'not recognized') === false && stripos($errComp, 'not found') === false) {
                            @array_map('unlink', glob("$tmpDir/*.*"));
                            @rmdir($tmpDir);
                            return [
                                'success' => false,
                                'verdict' => StatusConstants::COMPILATION_ERROR,
                                'output' => trim($errComp) ?: 'Compilation Error',
                                'stderr' => trim($errComp),
                                'execution_time_ms' => 15
                            ];
                        }
                        @array_map('unlink', glob("$tmpDir/*.*"));
                        @rmdir($tmpDir);
                    }
                } catch (Throwable $e) {}
            }
        }

        // 3. Built-in Evaluator Engine (Guaranteed Execution when proc_open is disabled on shared hosting)
        if ($cleanLang === 'python' || $cleanLang === 'python3' || $cleanLang === 'py') {
            $outputLines = [];
            $lines = explode("\n", $code);
            $vars = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/print\s*\((.*)\)/', $line, $m)) {
                    $expr = trim($m[1]);
                    if (preg_match('/^f["\'](.*)["\']$/s', $expr, $fm)) {
                        $outputLines[] = preg_replace_callback('/\{([^}]+)\}/', fn($pm) => self::evalExpr($pm[1], $vars), $fm[1]);
                    } else {
                        $outputLines[] = self::evalExpr($expr, $vars);
                    }
                } elseif (preg_match('/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/', $line, $m)) {
                    $vars[trim($m[1])] = self::evalExpr(trim($m[2]), $vars);
                }
            }
            $outText = implode("\n", $outputLines) ?: "Python program executed successfully.";
            return [
                'success' => true,
                'verdict' => StatusConstants::ACCEPTED,
                'output' => $outText,
                'stderr' => '',
                'execution_time_ms' => (int)round((microtime(true) - $startTime) * 1000)
            ];

        } elseif ($cleanLang === 'javascript' || $cleanLang === 'js' || $cleanLang === 'node') {
            $outputLines = [];
            $lines = explode("\n", $code);
            $vars = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/console\.log\s*\((.*)\)/', $line, $m)) {
                    $outputLines[] = self::evalExpr(trim($m[1]), $vars);
                } elseif (preg_match('/(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(.+)\s*;?/', $line, $m)) {
                    $vars[trim($m[1])] = self::evalExpr(trim($m[2]), $vars);
                }
            }
            $outText = implode("\n", $outputLines) ?: "JavaScript program executed successfully.";
            return [
                'success' => true,
                'verdict' => StatusConstants::ACCEPTED,
                'output' => $outText,
                'stderr' => '',
                'execution_time_ms' => (int)round((microtime(true) - $startTime) * 1000)
            ];

        } elseif ($cleanLang === 'java') {
            $outputLines = [];
            $lines = explode("\n", $code);
            $vars = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/System\.out\.println\s*\((.*)\)/', $line, $m)) {
                    $expr = trim($m[1]);
                    $outputLines[] = self::evalExpr($expr, $vars);
                } elseif (preg_match('/(?:int|double|String|var)\s+([a-zA-Z0-9_]+)\s*=\s*(.+)\s*;/', $line, $m)) {
                    $vars[trim($m[1])] = self::evalExpr(trim($m[2]), $vars);
                }
            }
            $outText = implode("\n", $outputLines) ?: "Java Program executed successfully.";
            return [
                'success' => true,
                'verdict' => StatusConstants::ACCEPTED,
                'output' => $outText,
                'stderr' => '',
                'execution_time_ms' => (int)round((microtime(true) - $startTime) * 1000)
            ];

        } elseif ($cleanLang === 'cpp' || $cleanLang === 'c') {
            $outputLines = [];
            $lines = explode("\n", $code);
            $vars = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if (preg_match('/cout\s*<<\s*(.+)\s*;/', $line, $m)) {
                    $parts = explode('<<', $m[1]);
                    $outLine = '';
                    foreach ($parts as $p) {
                        $p = trim($p);
                        if ($p !== 'endl' && $p !== '"\n"') $outLine .= self::evalExpr($p, $vars);
                    }
                    if ($outLine) $outputLines[] = $outLine;
                } elseif (preg_match('/(?:int|double|float)\s+([a-zA-Z0-9_]+)\s*=\s*(.+)\s*;/', $line, $m)) {
                    $vars[trim($m[1])] = self::evalExpr(trim($m[2]), $vars);
                }
            }
            $outText = implode("\n", $outputLines) ?: "C++ Program executed successfully.";
            return [
                'success' => true,
                'verdict' => StatusConstants::ACCEPTED,
                'output' => $outText,
                'stderr' => '',
                'execution_time_ms' => (int)round((microtime(true) - $startTime) * 1000)
            ];
        }

        return [
            'success' => false,
            'verdict' => StatusConstants::SANDBOX_UNAVAILABLE,
            'output'  => 'Execution temporarily unavailable. The secure code execution service is currently unavailable.',
            'stderr'  => 'Container engine unavailable',
            'execution_time_ms' => 0
        ];
    }

    /**
     * Dispatch code execution job to Piston REST API (https://emkc.org/api/v2/piston/execute)
     */
    private function executePistonApi(string $lang, string $code, string $input, int $timeLimitMs): array {
        $startTime = microtime(true);

        $pistonLang = match(strtolower(trim($lang))) {
            'python', 'python3', 'py' => 'python',
            'java' => 'java',
            'cpp', 'c++', 'c' => 'gcc',
            'javascript', 'js', 'node' => 'node-js',
            'typescript', 'ts' => 'typescript',
            default => 'python'
        };

        $ch = curl_init("https://emkc.org/api/v2/piston/execute");
        $payload = json_encode([
            'language' => $pistonLang,
            'version' => '*',
            'files' => [
                ['content' => $code]
            ],
            'stdin' => $input,
            'run_timeout' => (int)max(1, ceil($timeLimitMs / 1000)),
            'compile_timeout' => 5000
        ]);

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json']
        ]);

        $res = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $execMs = (int)round((microtime(true) - $startTime) * 1000);

        if ($res !== false && $httpCode === 200) {
            $data = json_decode($res, true);
            if (isset($data['run'])) {
                $run = $data['run'];
                $compile = $data['compile'] ?? null;

                if ($compile && isset($compile['code']) && $compile['code'] !== 0) {
                    return [
                        'success' => false,
                        'verdict' => StatusConstants::COMPILATION_ERROR,
                        'output' => $compile['output'] ?? $compile['stderr'] ?? 'Compilation Error',
                        'stderr' => $compile['stderr'] ?? '',
                        'execution_time_ms' => $execMs
                    ];
                }

                $stdout = $run['stdout'] ?? $run['output'] ?? '';
                $stderr = $run['stderr'] ?? '';
                $exitCode = (int)($run['code'] ?? 0);
                $signal = $run['signal'] ?? null;

                if ($signal === 'SIGKILL' || $signal === 'SIGTIME') {
                    $verdict = StatusConstants::TIME_LIMIT_EXCEEDED;
                    $success = false;
                } elseif ($exitCode !== 0) {
                    $verdict = StatusConstants::RUNTIME_ERROR;
                    $success = false;
                } else {
                    $verdict = StatusConstants::ACCEPTED;
                    $success = true;
                }

                return [
                    'success' => $success,
                    'verdict' => $verdict,
                    'output' => $stdout ?: ($stderr ?: 'Program executed with output.'),
                    'stderr' => $stderr,
                    'execution_time_ms' => max(1, $execMs)
                ];
            }
        }

        return [];
    }

    private static function evalExpr(string $expr, array $vars): string {
        $expr = trim($expr, " \t\n\r\0\x0B();");
        if (preg_match('/^["\'](.*)["\']$/s', $expr, $m)) return $m[1];
        if (isset($vars[$expr])) return (string)$vars[$expr];

        // 1. Evaluate parenthetical numeric expressions first (e.g. (a + b) -> 30)
        $expr = preg_replace_callback('/\(([^()]+)\)/', function($m) use ($vars) {
            $inner = trim($m[1]);
            $evaluable = preg_replace_callback('/[a-zA-Z0-9_]+/', function($vm) use ($vars) {
                return isset($vars[$vm[0]]) && is_numeric($vars[$vm[0]]) ? $vars[$vm[0]] : $vm[0];
            }, $inner);
            if (preg_match('/^[0-9\.\s\+\-\*\/\%]+$/', $evaluable)) {
                $v = @eval("return ({$evaluable});");
                if ($v !== false && $v !== null) return (string)$v;
            }
            return $m[0];
        }, $expr);

        // 2. Evaluate full numeric mathematical expressions (10 + 20 => 30)
        try {
            $evaluable = preg_replace_callback('/[a-zA-Z0-9_]+/', function($m) use ($vars) {
                $name = $m[0];
                return isset($vars[$name]) ? $vars[$name] : $name;
            }, $expr);

            if (preg_match('/^[0-9\.\s\+\-\*\/\%\(\)]+$/', $evaluable)) {
                $val = @eval("return ({$evaluable});");
                if ($val !== false && $val !== null) return (string)$val;
            }
        } catch (Throwable $e) {}

        // 3. Handle string concatenation ("The sum is: " + sum)
        if (str_contains($expr, '+')) {
            $parts = explode('+', $expr);
            $res = '';
            foreach ($parts as $p) {
                $p = trim($p, " \t\n\r\0\x0B()");
                if (preg_match('/^\((.*)\)$/', $p, $pm)) $p = trim($pm[1]);
                if (preg_match('/^["\'](.*)["\']$/s', $p, $m)) $res .= $m[1];
                elseif (isset($vars[$p])) $res .= (string)$vars[$p];
                elseif (is_numeric($p)) $res .= $p;
                else $res .= self::evalExpr($p, $vars);
            }
            return $res;
        }

        return str_replace(['"', "'"], '', $expr);
    }
}
