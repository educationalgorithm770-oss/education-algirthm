<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/config.php';

$testCode = "print('Hello from Python!')\nx = 10\ny = 20\nprint('Sum:', x + y)";

$ch = curl_init('http://localhost/project3/api-code-runner.php');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'action' => 'run',
    'language' => 'python',
    'code' => $testCode
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$res = curl_exec($ch);
curl_close($ch);

echo "API Response:\n" . $res . "\n";
