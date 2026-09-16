<?php
$activePage = 'profile';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$message = "";
$error = "";

// Update Profile Info
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST["update_profile"])) {
    verify_csrf();
    $name  = clean_text($_POST["name"] ?? "", 80);
    $phone = trim($_POST["phone"] ?? "");

    if (empty($name)) {
        $error = "Full name cannot be empty.";
    } elseif (mb_strlen($name) < 2) {
        $error = "Full name must be at least 2 characters.";
    } elseif (!empty($phone) && !validate_phone_input($phone)) {
        $error = "Please enter a valid phone number (7–15 digits, digits and + allowed).";
    } else {
        $normalizedPhone = !empty($phone) ? validate_phone_input($phone) : null;
        $stmt = $pdo->prepare("UPDATE students SET name = ?, phone = ? WHERE id = ?");
        $stmt->execute([$name, $normalizedPhone, $studentId]);
        $_SESSION["student_name"] = $name;
        $message = "Profile details updated successfully.";
    }
}

// Change Password
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST["change_password"])) {
    verify_csrf();
    $current = $_POST["current_password"] ?? "";
    $new     = $_POST["new_password"] ?? "";
    $confirm = $_POST["confirm_password"] ?? "";

    if (mb_strlen($new) > 128 || mb_strlen($current) > 128) {
        $error = "Password exceeds maximum allowed length (128 characters).";
    } elseif (strlen($new) < 6) {
        $error = "The new password must be at least 6 characters long.";
    } elseif ($new !== $confirm) {
        $error = "The new password and confirmation password do not match.";
    } else {
        $stmt = $pdo->prepare("SELECT password FROM students WHERE id = ?");
        $stmt->execute([$studentId]);
        $row = $stmt->fetch();

        if (!$row || !password_verify($current, $row["password"])) {
            $error = "The current password you entered is incorrect.";
        } else {
            $hashed = password_hash($new, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE students SET password = ? WHERE id = ?");
            $stmt->execute([$hashed, $studentId]);
            $message = "Your password has been changed successfully.";
        }
    }
}

$stmt = $pdo->prepare("SELECT * FROM students WHERE id = ?");
$stmt->execute([$studentId]);
$student = $stmt->fetch();
$initials = strtoupper(substr($student['name'] ?? 'S', 0, 1));
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Profile & Security — Education Algorithm</title>
    
    <!-- Instant Pre-Paint Theme Initialization -->
    <script>
        (function() {
            try {
                const savedTheme = localStorage.getItem('ea_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch(e) {}
        })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=9.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 720px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Profile & Account Settings</h1>
                <p>Manage your contact details, security credentials, and preferences.</p>
            </div>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><?php echo e($message); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Account Profile Card -->
        <div class="card">
            <div class="card-header">
                <h2>Personal Information</h2>
            </div>

            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border);">
                <div style="width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; font-size: 1.25rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);">
                    <?php echo e($initials); ?>
                </div>
                <div>
                    <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);"><?php echo e($student['name']); ?></h3>
                    <p style="font-size: 0.78rem; color: var(--text-muted);">Enrolled Student</p>
                </div>
            </div>

            <form method="POST">
                <?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="name">Full Name</label>
                    <input type="text" name="name" id="name" value="<?php echo e($student['name']); ?>" required maxlength="80">
                </div>

                <div class="form-group">
                    <label for="email">Email Address (Registered Account)</label>
                    <input type="email" id="email" value="<?php echo e($student['email']); ?>" disabled style="background: var(--bg-subtle); color: var(--text-muted); border: 1px solid var(--border); cursor: not-allowed;">
                </div>

                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" name="phone" id="phone" value="<?php echo e($student['phone'] ?? ''); ?>" placeholder="+91 98765 43210" maxlength="25">
                </div>

                <button type="submit" name="update_profile" class="btn btn-primary btn-sm">
                    Save Profile Changes
                </button>
            </form>
        </div>

        <!-- Change Password Card -->
        <div class="card">
            <div class="card-header">
                <h2>Security & Password</h2>
            </div>

            <form method="POST">
                <?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="current_password">Current Password</label>
                    <div style="position: relative;">
                        <input type="password" name="current_password" id="current_password" required maxlength="128" style="padding-right: 42px;">
                        <button type="button" onclick="togglePasswordVisibility('current_password', this)" title="Show / Hide Password" aria-label="Toggle password visibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <label for="new_password" style="margin-bottom: 0;">New Password</label>
                        <span id="prof-pass-len" style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Min 6 chars</span>
                    </div>
                    <div style="position: relative;">
                        <input type="password" name="new_password" id="new_password" minlength="6" maxlength="128" required style="padding-right: 42px;" oninput="updatePassLength(this, 'prof-pass-len')">
                        <button type="button" onclick="togglePasswordVisibility('new_password', this)" title="Show / Hide Password" aria-label="Toggle password visibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                        <label for="confirm_password" style="margin-bottom: 0;">Confirm New Password</label>
                        <span id="prof-confirm-hint" style="font-size: 0.78rem; color: var(--text-muted); font-weight: 500;">Must match</span>
                    </div>
                    <div style="position: relative;">
                        <input type="password" name="confirm_password" id="confirm_password" minlength="6" maxlength="128" required style="padding-right: 42px;" oninput="checkConfirmMatchProfile()">
                        <button type="button" onclick="togglePasswordVisibility('confirm_password', this)" title="Show / Hide Password" aria-label="Toggle password visibility" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; padding: 4px;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </button>
                    </div>
                </div>

                <button type="submit" name="change_password" class="btn btn-primary">
                    Update Password
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
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
                    checkConfirmMatchProfile();
                }

                function checkConfirmMatchProfile() {
                    const p1 = document.getElementById('new_password').value;
                    const p2 = document.getElementById('confirm_password').value;
                    const hint = document.getElementById('prof-confirm-hint');
                    if (!hint) return;
                    if (p2.length === 0) {
                        hint.textContent = 'Must match';
                        hint.style.color = 'var(--text-muted)';
                    } else if (p1 === p2) {
                        hint.textContent = '✓ Matches';
                        hint.style.color = '#16a34a';
                    } else {
                        hint.textContent = '✗ Passwords do not match';
                        hint.style.color = '#e11d48';
                    }
                }
            </script>
        </div>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
