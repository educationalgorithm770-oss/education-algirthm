<?php
require_once __DIR__ . "/config.php";

$message = "";
$error = "";
$rawToken = trim($_GET["token"] ?? $_POST["token"] ?? "");
$token = $rawToken;
$tokenHash = hash('sha256', $rawToken);

if (empty($rawToken)) {
    die("Invalid access. Missing password recovery token.");
}

// Verify token exists and is valid (matches SHA-256 hash or legacy token)
$stmt = $pdo->prepare("SELECT email, expires_at FROM password_resets WHERE token = ? OR token = ? LIMIT 1");
$stmt->execute([$tokenHash, $rawToken]);
$reset = $stmt->fetch();

if (!$reset) {
    die("This password recovery link is invalid or has already been used.");
}

if ((int)$reset["expires_at"] < time()) {
    die("This password recovery link has expired. Please request a new link at forgot-password.php.");
}

if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["reset_pass_btn"])) {
    verify_csrf();
    $password = $_POST["password"] ?? "";
    $confirm  = $_POST["confirm_password"] ?? "";

    if (strlen($password) < 6) {
        $error = "Password must be at least 6 characters long.";
    } elseif (mb_strlen($password) > 128) {
        $error = "Password exceeds maximum allowed length (128 characters).";
    } elseif ($password !== $confirm) {
        $error = "Passwords do not match. Please verify and try again.";
    } else {
        $hashed = password_hash($password, PASSWORD_DEFAULT);
        $email = $reset["email"];

        // 1. Update student password
        $stmtUpdate = $pdo->prepare("UPDATE students SET password = ? WHERE email = ?");
        $stmtUpdate->execute([$hashed, $email]);

        // 2. Update instructor password if exists
        $stmtInst = $pdo->prepare("UPDATE instructors SET password = ? WHERE email = ? OR username = ?");
        $stmtInst->execute([$hashed, $email, $email]);

        // 3. Update admin password if exists
        $stmtAdmin = $pdo->prepare("UPDATE admins SET password = ? WHERE username = ?");
        $stmtAdmin->execute([$hashed, $email]);

        // Delete reset token
        $stmtDel = $pdo->prepare("DELETE FROM password_resets WHERE token = ?");
        $stmtDel->execute([$token]);

        $message = "Your password has been reset successfully! You can now log in with your new password.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set New Password — Education Algorithm</title>
    
    <script>
        (function() {
            try {
                const savedTheme = localStorage.getItem('ea_theme') || localStorage.getItem('lms_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch(e) {}
        })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=9.0">
    <style>
        body {
            background-color: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
        }
        .reset-card {
            max-width: 440px;
            width: 100%;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            padding: 2.5rem 2rem;
        }
    </style>
</head>
<body>
    <div class="reset-card">
        <div style="text-align: center; margin-bottom: 2rem;">
            <a href="login.php" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; color: var(--primary);">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">Education Algorithm</span>
            </a>
            <h1 style="font-size: 1.4rem; margin-top: 0.75rem;">Set New Password</h1>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">Enter and confirm your new account password.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span style="font-weight: 700;"><?= htmlspecialchars($message) ?></span>
                </div>
                <a href="login.php" class="btn btn-primary" style="display: block; text-align: center; text-decoration: none; padding: 0.65rem; border-radius: 8px; font-weight: 700; font-size: 0.88rem; background: #10b981; color: #fff;">Proceed to Login ➔</a>
            </div>
        <?php else: ?>
            <form method="POST" action="reset-password.php">
                <?= csrf_field() ?>
                <input type="hidden" name="token" value="<?= htmlspecialchars($token) ?>">

                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label" style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem;">New Password</label>
                    <input type="password" name="password" class="form-input" placeholder="At least 6 characters" required autofocus minlength="6" style="width: 100%; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg-surface); color: var(--text-primary); font-size: 0.9rem;">
                </div>

                <div class="form-group" style="margin-bottom: 1.5rem;">
                    <label class="form-label" style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem;">Confirm New Password</label>
                    <input type="password" name="confirm_password" class="form-input" placeholder="Repeat your new password" required minlength="6" style="width: 100%; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg-surface); color: var(--text-primary); font-size: 0.9rem;">
                </div>

                <button type="submit" name="reset_pass_btn" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-weight: 700; border-radius: 8px; font-size: 0.92rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; cursor: pointer;">
                    Update & Save Password ➔
                </button>
            </form>
        <?php endif; ?>

        <div style="text-align: center; margin-top: 1.75rem; border-top: 1px solid var(--border); padding-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted);">
            <a href="login.php" style="color: var(--text-muted); text-decoration: none;">Back to Login</a>
        </div>
    </div>
</body>
</html>
