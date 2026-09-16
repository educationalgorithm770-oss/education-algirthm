<?php
require_once __DIR__ . "/config.php";

// If already logged in, redirect to dashboard
if (!empty($_SESSION["student_id"])) {
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
                    $destDash = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/dashboard" : "dashboard";
                    header("Location: {$destDash}");
    exit;
}

$error = "";
// URL Error parameters
if (isset($_GET['error'])) {
    if ($_GET['error'] === 'no_active_enrollment') {
        $emailParam = htmlspecialchars($_GET['email'] ?? '');
        $error = "No active course enrollment found for <strong>{$emailParam}</strong>. Please enroll in a course first to get student portal access.";
    } elseif ($_GET['error'] === 'account_suspended') {
        $error = "Your student account has been deactivated. Please contact support.";
    } elseif ($_GET['error'] === 'google_not_configured') {
        $error = "Google Sign-In is being configured. Please use email and password.";
    }
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        $error = "Security session expired. Please re-enter your password to continue.";
    } else {
        $lockoutMinutes = check_login_rate_limit('student');
    if ($lockoutMinutes > 0) {
        $error = "Too many failed attempts. Account locked. Please try again in " . $lockoutMinutes . " minute(s).";
    } else {
        $email    = trim($_POST["email"]    ?? "");
        $password = trim($_POST["password"]  ?? "");

        // Validate format + length before touching the DB
        if (empty($email) || empty($password)) {
            $error = "Please enter both your registered email and password.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Please enter a valid email address.";
        } elseif (mb_strlen($email) > 320) {
            $error = "Email address is too long.";
        } elseif (mb_strlen($password) > 128) {
            $error = "Password exceeds maximum allowed length.";
        } else {
            $student = null;
            try {
                $stmt = $pdo->prepare("SELECT id, name, password, status FROM students WHERE email = ? LIMIT 1");
                $stmt->execute([$email]);
                $student = $stmt->fetch();
            } catch (Exception $e) {
                // Fallback query if status column not yet queried
                $stmt = $pdo->prepare("SELECT id, name, password FROM students WHERE email = ? LIMIT 1");
                $stmt->execute([$email]);
                $student = $stmt->fetch();
            }

            $isValidPass = false;
            if ($student && password_verify($password, $student["password"])) {
                $isValidPass = true;
            }

            if ($student && $isValidPass) {
                if (isset($student['status']) && $student['status'] !== 'active') {
                    $error = "Your account has been suspended or deactivated. Please contact support.";
                } else {
                    session_regenerate_id(true);
                    clear_login_attempts('student');
                    $_SESSION["student_id"] = (int)$student["id"];
                    $_SESSION["student_name"] = $student["name"];
                    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
                    $destDash = ($scriptDir && $scriptDir !== '/') ? "{$scriptDir}/dashboard" : "dashboard";
                    header("Location: {$destDash}");
                    exit;
                }
            } else {
                increment_login_attempts('student');
                $error = "Invalid email or password entered. Please check and try again.";
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
    <title>Student Login — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
    <style>
        body {
            background-color: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
        }

        .login-card {
            max-width: 440px;
            width: 100%;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            padding: 2.5rem 2rem;
        }

        .login-brand {
            text-align: center;
            margin-bottom: 2rem;
        }

        .login-brand h1 {
            font-size: 1.5rem;
            margin-top: 0.5rem;
        }
    </style>
<script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <div class="login-card">
        <div class="login-brand">
            <a href="./" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; color: var(--primary);">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                <span style="font-family: var(--font-heading); font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">Education Algorithm</span>
            </a>
            <h1>Student Portal Login</h1>
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.25rem;">Access your lectures, notes, and assignments.</p>
        </div>

        <?php if (!empty($error)): ?>
            <div class="alert alert-danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <form method="POST" action="login.php" autocomplete="off">
            <?php echo csrf_field(); ?>

            <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" name="email" id="email" placeholder="student@example.com" value="<?php echo e($_POST['email'] ?? ''); ?>" required autofocus maxlength="320" autocomplete="off">
            </div>

            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <label for="password" style="margin-bottom: 0;">Password</label>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span id="password-len-hint" style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Min 6 chars</span>
                        <a href="forgot-password" style="font-size: 0.8rem; color: var(--primary); text-decoration: none;">Forgot password?</a>
                    </div>
                </div>
                <div style="position: relative;">
                    <input type="password" name="password" id="password" placeholder="••••••••" required minlength="6" maxlength="128" autocomplete="new-password" style="padding-right: 42px;" oninput="updatePassLength(this, 'password-len-hint')">
                    <button type="button" onclick="togglePasswordVisibility('password', this)" title="Show / Hide Password" aria-label="Toggle password visibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.8rem; font-size: 0.95rem; margin-top: 0.5rem;">
                Sign In to LMS →
            </button>
        </form>
                        <!-- OR DIVIDER -->
        <div style="display: flex; align-items: center; margin: 1.25rem 0; color: var(--text-muted, #64748b); font-size: 0.8rem;">
            <div style="flex: 1; height: 1px; background: var(--border, #e2e8f0);"></div>
            <span style="padding: 0 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">or</span>
            <div style="flex: 1; height: 1px; background: var(--border, #e2e8f0);"></div>
        </div>

        <!-- REAL GOOGLE OAUTH 2.0 BUTTON -->
        <div id="googleBtnContainer" style="display: flex; flex-direction: column; width: 100%; margin-bottom: 0.5rem;">
            <a href="login-google.php?action=redirect" id="customGoogleBtn" 
               style="width: 100%; box-sizing: border-box; display: flex; align-items: center; justify-content: center; gap: 0.65rem; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: var(--radius-md, 10px); padding: 0.75rem 1rem; font-family: inherit; font-size: 0.9rem; font-weight: 700; color: #1e293b; text-decoration: none; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
            </a>
        </div>
<script>
            function handleGoogleOneClick() {
                window.location.href = 'login-google.php?action=redirect';
            }

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
                    hint.textContent = '✓ ' + len + ' chars';
                    hint.style.color = '#16a34a';
                }
            }
        </script>
<div style="text-align: center; margin-top: 1.5rem; padding-top: 1.15rem; border-top: 1px solid var(--border); font-size: 0.85rem; color: var(--text-muted);">
            Enrolled in a program but haven't received login info &rarr;
            <div style="margin-top: 0.35rem;">
                <a href="contact" style="color: var(--primary); font-weight: 600; text-decoration: none;">Contact Admissions Support →</a>
            </div>
        </div>
    </div>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
