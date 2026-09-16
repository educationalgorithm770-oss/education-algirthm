<?php
// ISS-08 Fix: Restrict database backup execution to CLI / Cron or Authenticated Admin only
if (php_sapi_name() !== 'cli') {
    require_once __DIR__ . '/config.php';
    require_once __DIR__ . '/includes/auth.php';
    if (!isAdminLoggedIn()) {
        http_response_code(403);
        die("Forbidden: Access denied.");
    }
}

/**
 * backup-db.php — Automated Secure Database Backup Engine
 * Exports entire database to a timestamped .sql file.
 * Requires Admin Session or Cryptographically Verified CRON_SECRET_KEY.
 */
require_once __DIR__ . '/config.php';

// Strict Fail-Closed Cron Authentication
$isCli = (PHP_SAPI === 'cli');

// Scheduled backups must run through the local CLI so no secret is placed in a URL.
if (!$isCli) {
    require_once __DIR__ . '/includes/auth.php';
    requireAdmin();
}

$backupDir = env('BACKUP_DIR', dirname(__DIR__) . '/education_algorithm_backups');
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
    file_put_contents($backupDir . '/.htaccess', "Deny from all\n");
}

// Automated 7-Day Backup Retention & Rotation Policy
$sevenDaysAgo = time() - (7 * 24 * 60 * 60);
$existingBackups = glob($backupDir . '/*.sql');
foreach ($existingBackups as $bf) {
    if (filemtime($bf) < $sevenDaysAgo) {
        @unlink($bf);
    }
}

$filename = 'db_backup_' . date('Y-m-d_H-i-s') . '.sql';
$filePath = $backupDir . '/' . $filename;

$handle = fopen($filePath, 'w');
if (!$handle) {
    http_response_code(500);
    die("Failed to create backup file.");
}

fwrite($handle, "-- ==========================================================\n");
fwrite($handle, "-- Education Algorithm Database Backup\n");
fwrite($handle, "-- Generated at: " . date('Y-m-d H:i:s') . "\n");
fwrite($handle, "-- ==========================================================\n\n");
fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $table) {
    fwrite($handle, "-- Table: `{$table}`\n");
    $createStmt = $pdo->query("SHOW CREATE TABLE `{$table}`")->fetch();
    fwrite($handle, "DROP TABLE IF EXISTS `{$table}`;\n");
    fwrite($handle, $createStmt['Create Table'] . ";\n\n");

    $rows = $pdo->query("SELECT * FROM `{$table}`")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($rows)) {
        fwrite($handle, "INSERT INTO `{$table}` VALUES\n");
        $rowSql = [];
        foreach ($rows as $row) {
            $vals = array_map(function($v) use ($pdo) {
                return ($v === null) ? 'NULL' : $pdo->quote($v);
            }, array_values($row));
            $rowSql[] = "(" . implode(', ', $vals) . ")";
        }
        fwrite($handle, implode(",\n", $rowSql) . ";\n\n");
    }
}

fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
fclose($handle);

if (isset($_GET['download']) && !$isCli) {
    header('Content-Description: File Transfer');
    header('Content-Type: application/sql');
    header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    header('Expires: 0');
    header('Cache-Control: must-revalidate');
    header('Pragma: public');
    header('Content-Length: ' . filesize($filePath));
    readfile($filePath);
    exit;
}

echo json_encode([
    "success" => true,
    "message" => "Database backup created successfully with 7-day retention rotation.",
    "file"    => $filename
]);