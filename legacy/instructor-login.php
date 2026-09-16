<?php
require_once __DIR__ . '/config.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!empty($_SESSION['instructor_id']) && !empty($_SESSION['instructor_logged_in'])) {
    header("Location: instructor-dashboard.php");
    exit;
}

$error = "";
$errCode = $_GET['error'] ?? '';

if ($errCode === 'unauthorized_faculty_email') {
    $email = htmlspecialchars($_GET['email'] ?? '');
    $error = "Access Denied: The Google account ({$email}) is not registered as an authorized faculty member. Please contact the administrator.";
} elseif ($errCode === 'account_inactive') {
    $error = "Your faculty account is currently inactive. Please contact the administrator.";
} elseif ($errCode === 'google_token_failed') {
    $error = "Google authentication failed. Please retry.";
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();

    $lockoutMinutes = check_login_rate_limit('instructor');
    if ($lockoutMinutes > 0) {
        $error = "Too many failed attempts. Account locked. Please try again in " . $lockoutMinutes . " minute(s).";
    } else {
        $email    = trim($_POST['email'] ?? '');
        $password = trim($_POST['password'] ?? '');

        if (empty($email) || empty($password)) {
        $error = "Please provide both faculty email and password.";
    } else {
        $stmt = $pdo->prepare("SELECT * FROM instructors WHERE email = ? OR username = ? LIMIT 1");
        $stmt->execute([$email, $email]);
        $inst = $stmt->fetch();

        if ($inst && password_verify($password, $inst['password'])) {
            if ($inst['status'] !== 'active') {
                $error = "Your faculty account is inactive. Please contact administration.";
            } else {
                session_regenerate_id(true);
                clear_login_attempts('instructor');
                $_SESSION['instructor_id']        = (int)$inst['id'];
                $_SESSION['instructor_name']      = $inst['name'];
                $_SESSION['instructor_email']     = $inst['email'];
                $_SESSION['instructor_title']     = $inst['title'];
                $_SESSION['instructor_logged_in'] = true;
                $_SESSION['instructor_device_hash'] = hash('sha256', ($_SERVER['HTTP_USER_AGENT'] ?? ''));

                require_once __DIR__ . '/instructor-auth.php';
                log_instructor_audit($inst['id'], 'FACULTY_LOGIN_SUCCESS', null, 'Faculty logged in successfully.');

                header("Location: instructor-dashboard.php");
                exit;
            }
        } else {
            increment_login_attempts('instructor');
            $error = "Invalid faculty credentials. Please check and retry.";
        }
    }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Portal Login — Education Algorithm</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        html {
            height: 100%;
            width: 100%;
            background: #07090e;
        }
        body {
            margin: 0;
            padding: 2rem 1.5rem;
            min-height: 100vh;
            width: 100%;
            display: grid;
            place-items: center;
            background: #07090e;
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, transparent 65%),
                radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.18) 0%, transparent 65%);
            background-attachment: fixed;
            color: #ffffff;
        }
        .login-wrapper {
            width: 100%;
            max-width: 440px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
        }
        .login-card {
            width: 100%;
            background: #0f141f;
            border: 1px solid #1e293b;
            border-radius: 24px;
            padding: 2.75rem 2.25rem 2.25rem;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.12);
        }
        
        /* 1. CENTERED HEADER */
        .header-brand-centered {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-bottom: 2rem;
            width: 100%;
        }
        .logo-badge-center {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            width: 58px;
            height: 58px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.85rem;
            margin-bottom: 1.25rem;
            box-shadow: 0 10px 24px rgba(99, 102, 241, 0.4);
        }
        .title-main {
            font-size: 1.75rem;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.025em;
            margin-bottom: 0.35rem;
            text-align: center;
            width: 100%;
            line-height: 1.2;
        }
        .subtitle-desc {
            font-size: 0.88rem;
            color: #94a3b8;
            text-align: center;
            width: 100%;
            line-height: 1.4;
        }

        /* 2. FORM FIELDS */
        .form-group {
            margin-bottom: 1.25rem;
            text-align: left;
            width: 100%;
        }
        .form-label {
            display: block;
            font-size: 0.82rem;
            font-weight: 700;
            color: #cbd5e1;
            margin-bottom: 0.45rem;
        }
        .form-input {
            width: 100%;
            padding: 0.85rem 1rem;
            background: #07090e !important;
            border: 1.5px solid #334155 !important;
            border-radius: 12px;
            color: #ffffff !important;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .form-input:focus {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .btn-submit {
            width: 100%;
            padding: 0.95rem;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            margin-top: 0.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .btn-submit:hover {
            transform: translateY(-1px);
        }

        /* 3. DIVIDER */
        .divider {
            display: flex;
            align-items: center;
            text-align: center;
            color: #64748b;
            font-size: 0.75rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            letter-spacing: 0.05em;
            width: 100%;
        }
        .divider::before, .divider::after {
            content: '';
            flex: 1;
            border-bottom: 1px solid #1e293b;
        }
        .divider:not(:empty)::before { margin-right: .85em; }
        .divider:not(:empty)::after { margin-left: .85em; }

        /* 4. GOOGLE AUTH AT THE BOTTOM */
        .btn-google-bottom {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.85rem 1rem;
            background: #ffffff;
            color: #0f172a;
            border: none;
            border-radius: 12px;
            font-size: 0.95rem;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 15px rgba(255, 255, 255, 0.12);
        }
        .btn-google-bottom:hover {
            background: #f8fafc;
            transform: translateY(-1px);
        }

        .alert-error {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            color: #fca5a5;
            padding: 0.85rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
            line-height: 1.4;
            text-align: left;
        }
        .footer-note {
            margin-top: 1.75rem;
            text-align: center;
            font-size: 0.75rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <div class="login-card">
            <!-- 1. CENTERED LOGO & TITLE -->
            <div class="header-brand-centered">
                <div class="logo-badge-center">👨‍🏫</div>
                <h1 class="title-main">Faculty Portal</h1>
                <p class="subtitle-desc">Course-Isolated Faculty Operating System</p>
            </div>

            <?php if (!empty($error)): ?>
                <div class="alert-error"><?= $error ?></div>
            <?php endif; ?>

            <!-- 2. TRADITIONAL LOGIN FORM -->
            <form method="POST" autocomplete="off">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                <div class="form-group">
                    <label class="form-label">Faculty Email Address</label>
                    <input type="email" name="email" class="form-input" placeholder="faculty@educationalgorithm.com" required autocomplete="off">
                </div>
                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <label class="form-label" style="margin-bottom: 0;">Password</label>
                        <a href="instructor-forgot-password.php" style="color: #818cf8; font-size: 0.78rem; text-decoration: none; font-weight: 600;">Forgot Password?</a>
                    </div>
                    <input type="password" name="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
                </div>
                <button type="submit" class="btn-submit">Authenticate Faculty Cockpit ➔</button>
            </form>

            <!-- 3. DIVIDER -->
            <div class="divider">OR FAST LOGIN WITH</div>

            <!-- 4. GOOGLE AUTH AT THE BOTTOM -->
            <a href="instructor-google.php" class="btn-google-bottom">
                <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
            </a>

            <!-- FOOTER -->
            <div class="footer-note">
                <span>Protected by Zero-Trust Tenancy Isolation • Education Algorithm</span>
            </div>
        </div>
    </div>
</body>
</html>