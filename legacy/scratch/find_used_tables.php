<?php
$files = [
    __DIR__ . '/../admin-ai-studio.php',
    __DIR__ . '/../includes/course-service.php',
    __DIR__ . '/../includes/auth.php'
];

foreach ($files as $f) {
    if (!file_exists($f)) continue;
    echo '=== ' . basename($f) . ' ===' . PHP_EOL;
    $content = file_get_contents($f);
    preg_match_all('/FROM\s+([a-zA-Z0-9_]+)|JOIN\s+([a-zA-Z0-9_]+)|INTO\s+([a-zA-Z0-9_]+)|UPDATE\s+([a-zA-Z0-9_]+)/i', $content, $matches);
    $tables = array_filter(array_unique(array_merge($matches[1], $matches[2], $matches[3], $matches[4])));
    foreach ($tables as $t) {
        if (!empty($t) && !in_array(strtolower($t), ['select', 'where', 'set', 'values'])) {
            echo "  - {$t}" . PHP_EOL;
        }
    }
}
