<?php
// instructor-forgot-password.php — Faculty Password Recovery System
require_once __DIR__ . '/config.php';

$message = "";
$error = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $email = trim($_POST['email'] ?? '');

    if (empty($email)) {
        $error = "Please provide your faculty email address.";
    } else {
        $stmt = $pdo->prepare("SELECT id, name, email FROM instructors WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $inst = $stmt->fetch();

        if ($inst) {
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour token

            // Save reset token in instructor_password_resets table or store in notes
            try {
                $pdo->exec("CREATE TABLE IF NOT EXISTS instructor_password_resets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    instructor_id INT NOT NULL,
                    email VARCHAR(191) NOT NULL,
                    token VARCHAR(100) NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )");

                $stmtIns = $pdo->prepare("INSERT INTO instructor_password_resets (instructor_id, email, token, expires_at) VALUES (?, ?, ?, ?)");
                $stmtIns->execute([$inst['id'], $inst['email'], $token, $expiresAt]);
            } catch (Exception $e) {}

            $resetLink = "instructor-reset-password.php?token=" . $token;
            $message = "Password reset instructions have been generated for <strong>" . htmlspecialchars($inst['email']) . "</strong>. <br><a href='" . $resetLink . "' style='color:#818cf8; font-weight:700; text-decoration:underline;'>Click here to reset your password now &rarr;</a>";
        } else {
            // For security, present standard notice
            $message = "If an authorized faculty account exists for <strong>" . htmlspecialchars($email) . "</strong>, reset instructions have been dispatched.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Password Recovery • Education Algorithm</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: #07090e; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .reset-card { background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 440px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .logo-badge { font-size: 2.2rem; margin-bottom: 0.5rem; text-align: center; }
        .title { font-size: 1.5rem; font-weight: 800; text-align: center; margin-bottom: 0.35rem; color: #ffffff; }
        .subtitle { font-size: 0.85rem; color: #94a3b8; text-align: center; margin-bottom: 1.75rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-label { display: block; font-size: 0.8rem; font-weight: 700; color: #cbd5e1; margin-bottom: 0.4rem; }
        .form-input { width: 100%; padding: 0.75rem 1rem; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #fff; font-size: 0.9rem; outline: none; }
        .form-input:focus { border-color: #6366f1; box-shadow: 0 0 12px rgba(99, 102, 241, 0.25); }
        .btn-submit { width: 100%; padding: 0.85rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
        .btn-submit:hover { opacity: 0.95; }
        .alert-info { background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); color: #c7d2fe; padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.5; }
        .alert-error { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.85rem 1rem; border-radius: 10px; font-size: 0.85rem; margin-bottom: 1.25rem; }
        .back-link { display: block; text-align: center; margin-top: 1.5rem; font-size: 0.82rem; color: #94a3b8; text-decoration: none; font-weight: 600; }
        .back-link:hover { color: #818cf8; }
    </style>
</head>
<body>
    <div class="reset-card">
        <div class="logo-badge">🔑</div>
        <h1 class="title">Faculty Password Recovery</h1>
        <p class="subtitle">Enter your registered faculty email address to receive password reset instructions.</p>

        <?php if (!empty($message)): ?>
            <div class="alert-info"><?php echo $message; ?></div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="alert-error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
            <div class="form-group">
                <label class="form-label">Faculty Email Address</label>
                <input type="email" name="email" class="form-input" placeholder="faculty@educationalgorithm.com" required>
            </div>
            <button type="submit" class="btn-submit">Generate Reset Link ➔</button>
        </form>

        <a href="instructor-login.php" class="back-link">← Back to Faculty Portal Login</a>
    </div>
</body>
</html>
