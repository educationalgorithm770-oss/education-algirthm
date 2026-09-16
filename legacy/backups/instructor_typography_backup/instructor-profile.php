<?php
$facultyActive = 'profile';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);

$message = "";
$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    verify_csrf();

    // 1. UPDATE GENERAL PROFILE
    if (isset($_POST["update_profile"])) {
        $name     = clean_text($_POST["name"] ?? "", 100);
        $phone    = clean_text($_POST["phone"] ?? "", 30);
        $title    = clean_text($_POST["title"] ?? "", 150);
        $bio      = clean_text($_POST["bio"] ?? "", 2000);
        $linkedin = filter_var($_POST["linkedin_url"] ?? "", FILTER_VALIDATE_URL) ?: null;
        $github   = filter_var($_POST["github_url"] ?? "", FILTER_VALIDATE_URL) ?: null;

        if ($name) {
            $stmt = $pdo->prepare("UPDATE instructors SET name = ?, phone = ?, title = ?, bio = ?, linkedin_url = ?, github_url = ? WHERE id = ?");
            $stmt->execute([$name, $phone, $title, $bio, $linkedin, $github, $instId]);

            $_SESSION['instructor_name'] = $name;
            $_SESSION['instructor_title'] = $title;
            $profile = get_instructor_profile($instId);

            log_instructor_audit($instId, 'PROFILE_UPDATED', null, 'Faculty updated profile information.');
            $message = "Faculty profile details updated successfully!";
        } else {
            $error = "Full Name cannot be empty.";
        }
    }

    // 2. CHANGE PASSWORD
    if (isset($_POST["change_password"])) {
        $currPass = $_POST["current_password"] ?? "";
        $newPass  = $_POST["new_password"] ?? "";
        $confPass = $_POST["confirm_password"] ?? "";

        $stmt = $pdo->prepare("SELECT password FROM instructors WHERE id = ?");
        $stmt->execute([$instId]);
        $hash = $stmt->fetchColumn();

        if (!password_verify($currPass, $hash)) {
            $error = "Current password is incorrect.";
        } elseif (strlen($newPass) < 8) {
            $error = "New password must be at least 8 characters long.";
        } elseif ($newPass !== $confPass) {
            $error = "New password and confirmation do not match.";
        } else {
            $newHash = password_hash($newPass, PASSWORD_DEFAULT);
            $pdo->prepare("UPDATE instructors SET password = ? WHERE id = ?")->execute([$newHash, $instId]);
            log_instructor_audit($instId, 'PASSWORD_CHANGED', null, 'Faculty changed account password.');
            $message = "Account password updated securely!";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Profile & Settings — Faculty Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
    :root {
        --bg-primary: #07090e;
        --bg-surface: #0f141f;
        --bg-card: #141b2b;
        --border-color: #1e293b;
        --accent-primary: #6366f1;
        --accent-secondary: #8b5cf6;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --text-subtle: #64748b;
        --input-bg: #0b1120;
        --input-border: #334155;
        --input-text: #ffffff;
        --input-placeholder: #64748b;
        --shadow-color: rgba(0,0,0,0.4);
        --chip-bg: rgba(99,102,241,0.15);
        --chip-border: rgba(99,102,241,0.3);
        --chip-text: #c7d2fe;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #07090e !important; color: #f8fafc !important; min-height: 100vh; padding-bottom: 3.5rem; }
    .container { max-width: 1550px; margin: 0 auto; padding: 0 1.5rem; }
    
    /* Cards */
    .card { background: #141b2b !important; border: 1px solid #1e293b !important; border-radius: 18px; padding: 1.75rem; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    
    /* Headings & Text */
    h1, h2, h3, h4, h5, h6 { color: #f8fafc !important; font-weight: 800; }
    p, span, label { color: #94a3b8; }
    
    /* Hero Banner */
    .hero-banner {
        background: #141b2b !important;
        border: 1px solid #1e293b !important;
        border-radius: 18px;
        padding: 1.5rem 1.75rem;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.25rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .quick-btn {
        background: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        color: #f8fafc !important;
        padding: 0.55rem 1rem;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s;
    }
    .quick-btn:hover {
        border-color: #6366f1 !important;
        color: #c7d2fe !important;
        transform: translateY(-1px);
    }

    /* Stats Grid */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.35rem; margin-bottom: 2.25rem; }
    .stat-card {
        background: #141b2b !important;
        border: 1px solid #1e293b !important;
        border-radius: 18px;
        padding: 1.5rem 1.65rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
    }
    .stat-label { font-size: 0.8rem; font-weight: 700; color: #94a3b8 !important; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat-number { font-size: 2.2rem; font-weight: 800; margin: 0.4rem 0 0.2rem; line-height: 1.2; }
    .content-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; }

    /* Form Controls, Inputs & Select Options — 100% Locked Dark */
    .form-group { margin-bottom: 1.25rem; }
    .form-label { display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1 !important; margin-bottom: 0.4rem; }
    input, select, textarea, .form-input, .form-control {
        width: 100%;
        padding: 0.8rem 1rem;
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        border-radius: 10px;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    input::placeholder, textarea::placeholder, .form-input::placeholder {
        color: #64748b !important;
        -webkit-text-fill-color: #64748b !important;
        opacity: 1;
    }
    input:focus, select:focus, textarea:focus, .form-input:focus, .form-control:focus {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        background: #0b1120 !important;
        background-color: #0b1120 !important;
    }
    select option {
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        color: #ffffff !important;
        padding: 0.5rem;
    }
    
    /* Chrome / Edge Autofill Override to prevent White Background */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #0b1120 inset !important;
        -webkit-text-fill-color: #ffffff !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    /* Buttons */
    .btn-submit, .btn-primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
        color: #ffffff !important;
        border: none !important;
        padding: 0.85rem 1.4rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.92rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .btn-submit:hover, .btn-primary:hover { transform: translateY(-1px); }

    /* Tables & Responsive Scrolling */
    .table-custom { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table-custom th { text-align: left; padding: 0.85rem 1rem; color: #64748b !important; font-weight: 700; border-bottom: 1.5px solid #1e293b !important; font-size: 0.78rem; text-transform: uppercase; }
    .table-custom td { padding: 1.1rem 1rem; border-bottom: 1px solid #1e293b !important; color: #94a3b8 !important; }
    .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
    .table-responsive table th, .table-responsive table td { white-space: nowrap !important; }

    /* Responsive Grid Stacking for Mobile (< 992px) */
    @media (max-width: 992px) {
        .stat-grid { grid-template-columns: 1fr 1fr !important; }
        .content-grid { grid-template-columns: 1fr !important; }
        .responsive-form-grid { grid-template-columns: 1fr !important; }
        .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
        .btn-submit, .btn-primary { width: 100% !important; margin-top: 0.75rem; }
        .container { padding: 0 1rem; }
        .card, .hero-banner { padding: 1.25rem; }
    }
    @media (max-width: 580px) {
        .stat-grid { grid-template-columns: 1fr !important; }
        .hero-banner { flex-direction: column; align-items: flex-start; }
    }
</style>
</head>
<body>
    <?php include __DIR__ . '/instructor-nav.php'; ?>

    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.03em;">Faculty Profile & Academic Settings</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem; margin-top: 0.25rem;">Manage your official faculty contact details, phone number, bio, and account credentials.</p>
            </div>
        </div>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #10b981; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ✓ <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>
        <?php if (!empty($error)): ?>
            <div style="background: rgba(244,63,94,0.15); border: 1px solid #f43f5e; color: #f43f5e; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ⚠ <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- 2-COLUMN PROFILE WORKSPACE -->
        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem;" class="grid-2">
            <!-- GENERAL PROFILE FORM -->
            <div class="card">
                <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">👤 Faculty Profile & Contact Information</h3>
                <form method="POST">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="update_profile" value="1">

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" name="name" class="form-input" value="<?= htmlspecialchars($profile['name'] ?? '') ?>" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Official Email Address</label>
                            <input type="email" class="form-input" value="<?= htmlspecialchars($profile['email'] ?? '') ?>" disabled style="opacity: 0.7; cursor: not-allowed;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Mobile / WhatsApp Number</label>
                            <input type="tel" name="phone" class="form-input" placeholder="+91 9876543210" value="<?= htmlspecialchars($profile['phone'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Academic Designation / Title</label>
                            <input type="text" name="title" class="form-input" placeholder="e.g. Lead AI Scientist & Data Architect" value="<?= htmlspecialchars($profile['title'] ?? '') ?>">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Faculty Bio & Research Expertise</label>
                        <textarea name="bio" class="form-input" rows="4" placeholder="Brief biography, research focus, industry experience..."><?= htmlspecialchars($profile['bio'] ?? '') ?></textarea>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="grid-2">
                        <div class="form-group">
                            <label class="form-label">LinkedIn Profile URL</label>
                            <input type="url" name="linkedin_url" class="form-input" placeholder="https://linkedin.com/in/username" value="<?= htmlspecialchars($profile['linkedin_url'] ?? '') ?>">
                        </div>
                        <div class="form-group">
                            <label class="form-label">GitHub Profile URL</label>
                            <input type="url" name="github_url" class="form-input" placeholder="https://github.com/username" value="<?= htmlspecialchars($profile['github_url'] ?? '') ?>">
                        </div>
                    </div>

                    <button type="submit" class="btn-submit">Save Profile Changes ➔</button>
                </form>
            </div>

            <!-- SECURITY & TRACK SUMMARY -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <!-- ASSIGNED TRACKS -->
                <div class="card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.75rem;">🎯 Assigned Academic Tracks</h3>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem;">You have Row-Level Access Control (RLAC) to publish and grade inside these tracks:</p>
                    <?php foreach ($assignedCourses as $ac): ?>
                        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); color: var(--accent-primary); font-size: 0.85rem; font-weight: 700; padding: 0.65rem 0.85rem; border-radius: 10px; margin-bottom: 0.5rem;">
                            🎯 Track #<?= $ac['id'] ?>: <?= htmlspecialchars($ac['title']) ?>
                        </div>
                    <?php endforeach; ?>
                </div>

                <!-- CHANGE PASSWORD -->
                <div class="card">
                    <h3 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem;">🔐 Change Account Password</h3>
                    <form method="POST">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="change_password" value="1">

                        <div class="form-group">
                            <label class="form-label">Current Password</label>
                            <input type="password" name="current_password" class="form-input" placeholder="••••••••" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">New Password (Min 8 chars)</label>
                            <input type="password" name="new_password" class="form-input" placeholder="••••••••" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" name="confirm_password" class="form-input" placeholder="••••••••" required>
                        </div>

                        <button type="submit" class="btn-submit" style="width: 100%;">Update Password ➔</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</body>
</html>