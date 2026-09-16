<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . "/config.php";

if (!empty($_SESSION["admin_id"])) {
    header("Location: admin-dashboard");
    exit;
}

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        $error = "Security session expired. Please re-enter your credentials.";
    } else {
        $lockoutMinutes = check_login_rate_limit('admin');
    if ($lockoutMinutes > 0) {
        $error = "Too many failed attempts. Account locked. Please try again in " . $lockoutMinutes . " minute(s).";
    } else {
        $username = trim($_POST["username"] ?? "");
        $password = trim($_POST["password"] ?? "");

        if (empty($username) || empty($password)) {
            $error = "Please enter both admin username and password.";
        } elseif (mb_strlen($username) > 60) {
            $error = "Username is too long.";
        } elseif (mb_strlen($password) > 128) {
            $error = "Password exceeds maximum allowed length.";
        } elseif (!preg_match('/^[a-zA-Z0-9_\-\.@]+$/', $username)) {
            $error = "Username contains invalid characters.";
        } else {
            $stmt = $pdo->prepare("SELECT id, username, password FROM admins WHERE username = ? LIMIT 1");
            $stmt->execute([$username]);
            $admin = $stmt->fetch();

            if ($admin && password_verify($password, $admin["password"])) {
                session_regenerate_id(true);
                clear_login_attempts('admin');
                $_SESSION["admin_id"] = (int)$admin["id"];
                $_SESSION["admin_username"] = $admin["username"];
                header("Location: admin-dashboard");
                exit;
            } else {
                increment_login_attempts('admin');
                $error = "Invalid administrator username or password.";
            }
        }
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
    <title>Admin Portal Login • Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css">
    <style>
        body {
            background-color: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
        }

        .admin-login-box {
            max-width: 420px;
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
    <div class="admin-login-box">
        <div style="text-align: center; margin-bottom: 2rem;">
            <span class="badge" style="background: #fee2e2; color: #dc2626; margin-bottom: 0.75rem;">
                &#128272; System Administrator
            </span>
            <h1 style="font-size: 1.5rem; margin-top: 0.25rem;">Admin Control Center</h1>
            <p style="font-size: 0.88rem; color: var(--text-muted); margin-top: 0.25rem;">Sign in to manage curriculum, students, and billing.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <form method="POST" action="admin-login.php" autocomplete="off">
            <?php echo csrf_field(); ?>

            <div class="form-group">
                <label for="username">Admin Username</label>
                <input type="text" name="username" id="username" placeholder="admin" value="<?php echo e($_POST['username'] ?? ''); ?>" required autofocus maxlength="60" autocomplete="off" pattern="[a-zA-Z0-9_.\-@]+">
            </div>

            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <label for="password" style="margin-bottom: 0;">Password</label>
                    <span id="admin-pass-len" style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Min 6 chars</span>
                </div>
                <div style="position: relative;">
                    <input type="password" name="password" id="password" placeholder="••••••••" required minlength="6" maxlength="128" autocomplete="new-password" style="padding-right: 42px;" oninput="updatePassLength(this, 'admin-pass-len')">
                    <button type="button" onclick="togglePasswordVisibility('password', this)" title="Show / Hide Password" aria-label="Toggle password visibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem; background: #0f172a; margin-top: 0.5rem;">
                Authenticate & Enter Admin &rarr;
            </button>
        </form>

        <script>
            function togglePasswordVisibility(inputId, btn) {
                const input = document.getElementById(inputId);
                if (!input) return;
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                btn.innerHTML = isPass ? `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                ` : `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                `;
            }

            function updatePassLength(input, hintId) {
                const hint = document.getElementById(hintId);
                if (!hint) return;
                const len = input.value.length;
                if (len === 0) {
                    hint.textContent = 'Min 6 chars';
                    hint.style.color = 'var(--text-muted)';
                } else if (len < 6) {
                    hint.textContent = len + ' / 6+ chars';
                    hint.style.color = '#e11d48';
                } else {
                    hint.innerHTML = '&#128274; ' + len + ' chars';
                    hint.style.color = '#16a34a';
                }
            }
        </script>

        <div style="text-align: center; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted);">
            Switch role: <a href="login" style="color: var(--primary); text-decoration: none; font-weight: 500;">Student Login</a> • <a href="instructor-login" style="color: var(--primary); text-decoration: none; font-weight: 500;">Instructor Portal</a>
        </div>
    </div>
</body>
</html>

