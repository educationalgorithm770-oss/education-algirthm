<?php
$phpFiles = array_merge(
    glob(__DIR__ . '/../*.php'),
    glob(__DIR__ . '/../includes/*.php')
);

$errors = [];
foreach ($phpFiles as $f) {
    $cmd = 'C:\xampp\php\php.exe -l ' . escapeshellarg($f);
    $out = shell_exec($cmd);
    if (!str_contains($out, 'No syntax errors detected')) {
        $errors[basename($f)] = $out;
    }
}

if (empty($errors)) {
    echo "ALL PHP FILES ARE 100% SYNTAX CLEAN!" . PHP_EOL;
} else {
    echo "FOUND ERRORS:" . PHP_EOL;
    print_r($errors);
}
