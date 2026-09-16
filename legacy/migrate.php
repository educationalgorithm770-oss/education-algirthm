<?php
/**
 * migrate.php — Automated Database Migration Engine
 * Tracks applied migrations in schema_migrations table and executes pending .sql migrations.
 */
require_once __DIR__ . '/config.php';

// Auth: CLI execution or Admin Session
$isCli = (php_sapi_name() === 'cli');
if (!$isCli) {
    require_once __DIR__ . '/includes/auth.php';
    requireAdmin();
}

$pdo->exec("
    CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
");

$migrationsDir = __DIR__ . '/database/migrations';
if (!is_dir($migrationsDir)) {
    mkdir($migrationsDir, 0755, true);
}

$applied = $pdo->query("SELECT migration FROM schema_migrations")->fetchAll(PDO::FETCH_COLUMN);
$files = glob($migrationsDir . '/*.sql');
sort($files);

$executedCount = 0;
foreach ($files as $f) {
    $mName = basename($f);
    if (!in_array($mName, $applied)) {
        $sql = file_get_contents($f);
        if (!empty(trim($sql))) {
            $pdo->exec($sql);
        }
        $pdo->prepare("INSERT INTO schema_migrations (migration) VALUES (?)")->execute([$mName]);
        echo "  [✓] Applied migration: {$mName}\n";
        $executedCount++;
    }
}

if ($executedCount === 0) {
    echo "  [✓] Database is already up to date. Zero pending migrations.\n";
}