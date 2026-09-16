<?php
// Setup script: creates local education_local DB + imports schema + creates test accounts
$host = 'localhost';
$user = 'root';
$pass = '';

try {
    // Create DB if not exists
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `education_local` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci");
    echo "✓ Database 'education_local' ready\n";

    // Switch to it
    $pdo->exec("USE `education_local`");

    // Import the exported schema/data
    $sqlFile = __DIR__ . '/database_export.sql';
    if (!file_exists($sqlFile)) {
        echo "✗ database_export.sql not found at: $sqlFile\n";
        exit(1);
    }

    $sql = file_get_contents($sqlFile);
    // Split on statement delimiter and run each
    $statements = array_filter(array_map('trim', explode(";\n", $sql)));
    $count = 0;
    foreach ($statements as $stmt) {
        if (empty($stmt) || str_starts_with($stmt, '--') || str_starts_with($stmt, '/*')) continue;
        try {
            $pdo->exec($stmt . ';');
            $count++;
        } catch (PDOException $e) {
            // Ignore duplicate/already-exists errors
        }
    }
    echo "✓ Schema imported ($count statements executed)\n";

    // Create test student account
    $testEmail    = 'student@test.com';
    $testPassword = 'Test@1234';
    $hash         = password_hash($testPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    $existing = $pdo->prepare("SELECT id FROM students WHERE LOWER(email) = ? LIMIT 1");
    $existing->execute([strtolower($testEmail)]);
    if ($existing->fetch()) {
        $pdo->prepare("UPDATE students SET password=?, status='active' WHERE email=?")->execute([$hash, $testEmail]);
        echo "✓ Student account reset\n";
    } else {
        $pdo->prepare("INSERT INTO students (name,email,password,status) VALUES ('Test Student',?,?,'active')")->execute([$testEmail,$hash]);
        echo "✓ Student account created\n";
    }

    // Create test admin account
    $adminUsername = 'admin@test.com';
    $adminPassword = 'Admin@1234';
    $adminHash     = password_hash($adminPassword, PASSWORD_BCRYPT, ['cost' => 12]);
    $existingAdmin = $pdo->prepare("SELECT id FROM admins WHERE LOWER(username) = ? LIMIT 1");
    $existingAdmin->execute([strtolower($adminUsername)]);
    if ($existingAdmin->fetch()) {
        $pdo->prepare("UPDATE admins SET password=? WHERE username=?")->execute([$adminHash, $adminUsername]);
        echo "✓ Admin account reset\n";
    } else {
        $pdo->prepare("INSERT INTO admins (username,password) VALUES (?,?)")->execute([$adminUsername,$adminHash]);
        echo "✓ Admin account created\n";
    }

    echo "\n============================\n";
    echo "STUDENT LOGIN\n";
    echo "  Email   : $testEmail\n";
    echo "  Password: $testPassword\n";
    echo "  URL     : http://localhost:3000/login\n\n";
    echo "ADMIN LOGIN\n";
    echo "  Email/User: $adminUsername\n";
    echo "  Password  : $adminPassword\n";
    echo "  URL       : http://localhost:3000/admin/login\n";
    echo "============================\n";

} catch (PDOException $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
