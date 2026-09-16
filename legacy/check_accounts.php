<?php
// Direct connection to Hostinger — bypasses the localhost fallback in config.php
$pdo = new PDO(
    "mysql:host=localhost;dbname=u200723621_sQRge;charset=utf8mb4",
    "u200723621_Qf7Y9",
    "Niree@2525",
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

// List existing students
$stmt = $pdo->query('SELECT id, name, email, status FROM students ORDER BY id DESC LIMIT 15');
$students = $stmt->fetchAll();

echo "=== EXISTING STUDENTS ===\n";
foreach ($students as $s) {
    echo "ID:{$s['id']} | {$s['name']} | {$s['email']} | status:{$s['status']}\n";
}

// Create/reset a known test account
$testEmail    = 'test@educationalgorithm.com';
$testPassword = 'Test@1234';
$testName     = 'Test Student';
$hash         = password_hash($testPassword, PASSWORD_BCRYPT, ['cost' => 12]);

$existing = $pdo->prepare("SELECT id FROM students WHERE LOWER(email) = LOWER(?) LIMIT 1");
$existing->execute([$testEmail]);
$row = $existing->fetch();

if ($row) {
    $pdo->prepare("UPDATE students SET password = ?, status = 'active' WHERE id = ?")
        ->execute([$hash, $row['id']]);
    echo "\n=== TEST ACCOUNT RESET ===\n";
} else {
    $pdo->prepare("INSERT INTO students (name, email, password, status) VALUES (?, ?, ?, 'active')")
        ->execute([$testName, $testEmail, $hash]);
    $id = $pdo->lastInsertId();
    echo "\n=== TEST ACCOUNT CREATED (ID: $id) ===\n";
}

echo "Email   : $testEmail\n";
echo "Password: $testPassword\n";
