<?php
$files = glob(__DIR__ . '/../database/migrations/*.sql');
sort($files);
foreach ($files as $f) {
    echo '=== ' . basename($f) . ' ===' . PHP_EOL;
    echo file_get_contents($f) . PHP_EOL . PHP_EOL;
}
