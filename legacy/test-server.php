<?php
// Standalone Diagnostics Tool (Zero external dependencies)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Education Algorithm — Server Diagnostics</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
        .card { background: #1e293b; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #334155; }
        .success { color: #34d399; font-weight: bold; }
        .error { color: #fca5a5; font-weight: bold; background: #450a0a; padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #991b1b; }
        pre { background: #090d16; padding: 1rem; border-radius: 8px; color: #38bdf8; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🛠️ Live Hostinger Server Diagnostics</h1>

    <div class="card">
        <h3>1. PHP Environment</h3>
        <p>PHP Version: <strong><?php echo PHP_VERSION; ?></strong></p>
        <p>Server Software: <strong><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></strong></p>
    </div>

    <div class="card">
        <h3>2. Database Connection Test</h3>
        <?php
        $db_host = getenv('DB_HOST') ?: 'localhost';
        $db_name = getenv('DB_NAME') ?: 'u200723621_sQRge';
        $db_user = getenv('DB_USER') ?: 'u200723621_Qf7Y9';
        $db_pass = getenv('DB_PASSWORD') ?: 'Niree@2525';

        echo "<p>Host: <code>$db_host</code> | DB: <code>$db_name</code> | User: <code>$db_user</code></p>";

        try {
            $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            echo "<p class='success'>✓ SUCCESS: Connected to MySQL Database successfully!</p>";

            // Check tables
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            echo "<p>Total Tables Found: <strong>" . count($tables) . "</strong></p>";
            echo "<pre>" . implode("\n", $tables) . "</pre>";

        } catch (PDOException $e) {
            echo "<p class='error'>❌ DATABASE ERROR: " . htmlspecialchars($e->getMessage()) . "</p>";
            echo "<p><strong>How to fix:</strong> Check database password or database name in Hostinger hPanel ➔ MySQL Databases.</p>";
        }
        ?>
    </div>

    <div class="card">
        <h3>3. Essential Files Check</h3>
        <?php
        $checkFiles = ['config.php', 'webinar.php', 'admin-ai-studio.php', '.htaccess', 'includes/course-service.php', 'includes/auth.php'];
        foreach ($checkFiles as $f) {
            $exists = file_exists(__DIR__ . '/' . $f);
            echo "<p style='margin: 0.25rem 0;'>" . ($exists ? "✅" : "❌") . " <code>$f</code> — " . ($exists ? "<span class='success'>EXISTS</span>" : "<span class='error'>MISSING</span>") . "</p>";
        }
        ?>
    </div>
</body>
</html>
