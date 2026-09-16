<?php
$dir = dirname(__DIR__);
$sqlFiles = glob($dir . '/*.sql');
foreach ($sqlFiles as $f) {
    echo '=== ' . basename($f) . ' ===' . PHP_EOL;
    $lines = file($f);
    foreach ($lines as $l) {
        if (stripos($l, 'CREATE TABLE') !== false) {
            echo trim($l) . PHP_EOL;
        }
    }
}
