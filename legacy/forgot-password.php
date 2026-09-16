<?php
require_once __DIR__ . "/config.php";

$message = "";
$error = "";
$devResetNotice = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    verify_csrf();

    $throttle = function_exists('check_action_rate_limit') ? check_action_rate_limit('password_reset', 6, 300) : true;
    if ($throttle !== true) {
        $error = "Too many password reset attempts. Please try again in " . ceil($throttle / 60) . " minute(s).";
    } else {
        $email = validate_email_input($_POST["email"] ?? "", 191);

        if ($email) {
            $userFound = null;
            $role = 'student';

            // Check Students
            $stmt = $pdo->prepare("SELECT id, name, email FROM students WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $student = $stmt->fetch();

            if ($student) {
                $userFound = $student;
                $role = 'student';
            } else {
                // Check Instructors
                $stmtInst = $pdo->prepare("SELECT id, name, email FROM instructors WHERE email = ? LIMIT 1");
                $stmtInst->execute([$email]);
                $inst = $stmtInst->fetch();
                if ($inst) {
                    $userFound = $inst;
                    $role = 'instructor';
                } else {
                    // Check Admins
                    $stmtAdmin = $pdo->prepare("SELECT id, username FROM admins WHERE username = ? LIMIT 1");
                    $stmtAdmin->execute([$email]);
                    $adm = $stmtAdmin->fetch();
                    if ($adm) {
                        $userFound = ['id' => $adm['id'], 'name' => 'Administrator', 'email' => $email];
                        $role = 'admin';
                    }
                }
            }

            if ($userFound) {
                $rawToken = bin2hex(random_bytes(32));
                $tokenHash = hash('sha256', $rawToken);
                $expires = time() + 900; // 15 minutes secure expiry

                // Clear any old resets for this email
                $stmtDel = $pdo->prepare("DELETE FROM password_resets WHERE email = ?");
                $stmtDel->execute([$email]);

                // Save SHA-256 hashed reset token
                $stmtIns = $pdo->prepare("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)");
                $stmtIns->execute([$email, $tokenHash, $expires]);
                $token = $rawToken;

                // Determine base URL dynamically
                $isLocal = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'], true) || str_starts_with($_SERVER['HTTP_HOST'] ?? '', 'localhost:');
                $scriptDir = rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\');
                $destPath = ($isLocal && !empty($scriptDir) && $scriptDir !== '/') ? $scriptDir : '';
                $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
                $baseUrl = $isLocal ? ($proto . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $destPath) : (defined('APP_URL') && APP_URL ? rtrim(APP_URL, '/') : ($proto . ($_SERVER['HTTP_HOST'] ?? 'localhost') . $destPath));
                
                $resetUrl = rtrim($baseUrl, '/') . "/reset-password.php?token=" . $token;
                
                // Construct HTML email
                $userName = htmlspecialchars($userFound['name'] ?? 'User');
                $emailSubject = "Password Reset Request — Education Algorithm";
                $htmlBody = "
                <div style='font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff; color: #1e293b;'>
                    <div style='text-align: center; margin-bottom: 20px;'>
                        <h2 style='color: #4f46e5; margin: 0;'>Education Algorithm</h2>
                        <p style='color: #64748b; font-size: 14px; margin-top: 4px;'>Account Recovery Portal</p>
                    </div>
                    <div style='font-size: 15px; line-height: 1.6;'>
                        <p>Hello <strong>{$userName}</strong>,</p>
                        <p>We received a request to reset the password for your Education Algorithm account.</p>
                        <p style='text-align: center; margin: 28px 0;'>
                            <a href='{$resetUrl}' style='display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 15px;'>Reset My Password →</a>
                        </p>
                        <p style='font-size: 13px; color: #64748b;'>This link is valid for <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your account remains secure.</p>
                        <hr style='border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;'>
                        <p style='font-size: 12px; color: #94a3b8; word-break: break-all;'>If the button above does not work, copy and paste this link into your browser:<br><a href='{$resetUrl}' style='color: #4f46e5;'>{$resetUrl}</a></p>
                    </div>
                </div>";

                // Dispatch email
                $sent = false;
                if (function_exists('send_system_email')) {
                    $sent = send_system_email($email, $userFound['name'] ?? '', $emailSubject, $htmlBody);
                }

                if (!$sent || $isLocal) {
                    $devResetNotice = $resetUrl;
                }
            }

            // Always display standard generic success message for security
            $message = "If an account with that email exists, we have sent a secure password reset link to your registered email address. Please check your inbox (and spam folder).";
        } else {
            $error = "Please enter a valid registered email address.";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password — Education Algorithm</title>
    
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
            <h1 style="font-size: 1.4rem; margin-top: 0.75rem;">Forgot Password?</h1>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">Enter your email to receive a password reset link.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
        <?php endif; ?>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.88rem; margin-bottom: 1.5rem; line-height: 1.5;">
                <div style="display: flex; align-items: flex-start; gap: 0.5rem;">
                    <svg style="flex-shrink: 0; margin-top: 2px;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    <span><?= htmlspecialchars($message) ?></span>
                </div>
                <?php if (!empty($devResetNotice)): ?>
                    <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed rgba(16, 185, 129, 0.3);">
                        <span style="font-size: 0.78rem; font-weight: 700; color: #10b981;">⚡ Direct Reset Link:</span><br>
                        <a href="<?= htmlspecialchars($devResetNotice) ?>" style="color: #6366f1; font-weight: 700; font-size: 0.82rem; word-break: break-all; text-decoration: underline;">Click here to reset your password now ➔</a>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <form method="POST" action="forgot-password.php">
            <?= csrf_field() ?>
            <div class="form-group" style="margin-bottom: 1.25rem;">
                <label class="form-label" style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.4rem;">Registered Email Address</label>
                <input type="email" name="email" class="form-input" placeholder="e.g. yourname@example.com" required autofocus style="width: 100%; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1.5px solid var(--border); background: var(--bg-surface); color: var(--text-primary); font-size: 0.9rem;">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-weight: 700; border-radius: 8px; font-size: 0.92rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; cursor: pointer;">
                Send Password Reset Link ➔
            </button>
        </form>

        <div style="text-align: center; margin-top: 1.75rem; border-top: 1px solid var(--border); padding-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted);">
            Remembered your password? <a href="login.php" style="color: var(--primary); font-weight: 700; text-decoration: none;">Back to Login</a>
        </div>
    </div>
</body>
</html>
