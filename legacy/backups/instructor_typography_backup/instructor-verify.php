<?php
require_once __DIR__ . '/config.php';

$token = trim($_GET['token'] ?? '');
$status = 'invalid';
$facultyName = '';

if (!empty($token)) {
    $stmt = $pdo->prepare("SELECT * FROM instructors WHERE verification_token = ? LIMIT 1");
    $stmt->execute([$token]);
    $inst = $stmt->fetch();

    if ($inst) {
        $stmtUp = $pdo->prepare("UPDATE instructors SET is_verified = 1, status = 'active', verified_at = NOW(), verification_token = NULL WHERE id = ?");
        $stmtUp->execute([$inst['id']]);

        require_once __DIR__ . '/instructor-auth.php';
        log_instructor_audit($inst['id'], 'EMAIL_VERIFIED_SUCCESS', null, 'Faculty verified email address.');

        $status = 'success';
        $facultyName = $inst['name'];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Email Verification — Education Algorithm</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #07090e 0%, #0f172a 50%, #030712 100%);
            padding: 1.5rem;
            color: #ffffff;
        }
        .card {
            background: #0f141f;
            border: 1px solid #1e293b;
            border-radius: 24px;
            max-width: 480px;
            width: 100%;
            padding: 2.5rem;
            text-align: center;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        }
        .badge-icon {
            width: 64px;
            height: 64px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin: 0 auto 1.5rem;
        }
        .btn-action {
            display: inline-block;
            width: 100%;
            padding: 0.95rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            margin-top: 1.5rem;
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
        }
    </style>
</head>
<body>
    <div class="card">
        <?php if ($status === 'success'): ?>
            <div class="badge-icon" style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #10b981;">✓</div>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem;">Email Verified Successfully!</h2>
            <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.5; margin-bottom: 1.25rem;">
                Welcome to Education Algorithm, <strong><?= htmlspecialchars($facultyName) ?></strong>! Your faculty account has been activated with full Row-Level Course Access.
            </p>
            <a href="instructor-login.php" class="btn-action">Access Faculty Portal ➔</a>
        <?php else: ?>
            <div class="badge-icon" style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444;">✕</div>
            <h2 style="font-size: 1.6rem; font-weight: 800; margin-bottom: 0.5rem;">Invalid or Expired Token</h2>
            <p style="color: #94a3b8; font-size: 0.92rem; line-height: 1.5; margin-bottom: 1.25rem;">
                This verification link is invalid or has already been used. Please log in directly or contact the platform administrator.
            </p>
            <a href="instructor-login.php" class="btn-action">Return to Login ➔</a>
        <?php endif; ?>
    </div>
</body>
</html>