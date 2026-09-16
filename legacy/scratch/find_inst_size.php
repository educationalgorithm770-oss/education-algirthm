<?php
$lines = file(__DIR__ . '/../instructor-content.php');
foreach ($lines as $idx => $l) {
    if (strpos($l, '100MB') !== false || strpos($l, '100*1024*1024') !== false) {
        echo "Line " . ($idx + 1) . ": " . trim($l) . PHP_EOL;
    }
}
