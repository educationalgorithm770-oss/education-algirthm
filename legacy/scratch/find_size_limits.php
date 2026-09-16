<?php
$files = array_merge(
    glob(__DIR__ . '/../*.php'),
    glob(__DIR__ . '/../includes/*.php')
);

foreach ($files as $f) {
    $content = file_get_contents($f);
    if (strpos($content, '100MB') !== false || strpos($content, '100*1024*1024') !== false) {
        echo "Found 100MB in: " . basename($f) . PHP_EOL;
    }
}
