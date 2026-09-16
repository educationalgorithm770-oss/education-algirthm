<?php
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: Wed, 11 Jan 1984 05:00:00 GMT');
// enroll.php — Enterprise Production Enrollment Portal
require_once __DIR__ . '/config.php';

// Dynamic Database Fetch for Active Published Programs (Database = Single Source of Truth)
require_once __DIR__ . '/includes/course-service.php';
$courses = CourseService::getPublicCourses();

if (empty($courses)) {
    $courses = $pdo->query("SELECT * FROM courses WHERE status = 'published' ORDER BY id ASC")->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

$requestedCourseId = (int)($_GET['course_id'] ?? 0);
$iconsList = ['☕', '🤖', '☁️', '🚀', '⚡', '💻', '🎯'];
$selectedCourse = null;

foreach ($courses as $idx => &$cItem) {
    $cItem['icon'] = $iconsList[$idx % count($iconsList)];
    if ($requestedCourseId > 0 && (int)$cItem['id'] === $requestedCourseId) {
        $selectedCourse = $cItem;
    }
}
unset($cItem);

if (!$selectedCourse && !empty($courses)) {
    $selectedCourse = $courses[0];
}

$selectedCourseId = $selectedCourse ? (int)$selectedCourse['id'] : 1;

// Check for Google OAuth Identity in session
$isGoogleVerified = false;
$googleName = '';
$googleEmail = '';
$googleVerificationId = '';

if (!empty($_SESSION['google_verified_identity']['email']) && !empty($_SESSION['google_verified_identity']['expires_at'])) {
    if (time() <= (int)$_SESSION['google_verified_identity']['expires_at']) {
        $isGoogleVerified = true;
        $googleEmail = $_SESSION['google_verified_identity']['email'];
        $googleName = $_SESSION['google_verified_identity']['name'] ?? '';
        $googleVerificationId = $_SESSION['google_verified_identity']['verification_id'] ?? '';
        if (!empty($_SESSION['google_verified_identity']['course_id'])) {
            $selectedCourseId = (int)$_SESSION['google_verified_identity']['course_id'];
        }
    } else {
        unset($_SESSION['google_verified_identity']);
    }
}

// Check currently logged in student enrollments across all courses
$alreadyEnrolledId = null;
$alreadyEnrolledCourseTitle = '';
$studentPaidCourseMap = []; // Map of [course_id => formatted_enrollment_id]

if (!empty($_SESSION['student_id'])) {
    try {
        $stmtChk = $pdo->prepare("
            SELECT e.id, e.course_id, c.title 
            FROM enrollments e 
            JOIN courses c ON e.course_id = c.id 
            WHERE e.student_id = ? AND e.payment_status = 'paid' AND e.status = 'active'
        ");
        $stmtChk->execute([(int)$_SESSION['student_id']]);
        $enRows = $stmtChk->fetchAll(PDO::FETCH_ASSOC);
        foreach ($enRows as $row) {
            $fmtId = 'EA-2026-' . str_pad($row['id'], 5, '0', STR_PAD_LEFT);
            $studentPaidCourseMap[(int)$row['course_id']] = [
                'enrollment_id' => $fmtId,
                'title' => $row['title']
            ];
            if ((int)$row['course_id'] === $selectedCourseId) {
                $alreadyEnrolledId = $fmtId;
                $alreadyEnrolledCourseTitle = $row['title'];
            }
        }
    } catch (Exception $e) {}
}

// Fetch logged in student details for multi-course enrollment
$loggedInStudent = null;
if (!empty($_SESSION['student_id'])) {
    try {
        $stmtSt = $pdo->prepare("SELECT id, name, email, phone FROM students WHERE id = ? LIMIT 1");
        $stmtSt->execute([(int)$_SESSION['student_id']]);
        $loggedInStudent = $stmtSt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $e) {}
}

$initialName = $googleName ?: ($loggedInStudent['name'] ?? '');
$initialEmail = $googleEmail ?: ($loggedInStudent['email'] ?? '');
$initialPhone = $loggedInStudent['phone'] ?? '';
$isExistingSession = !empty($loggedInStudent) || $isGoogleVerified;

$razorpayKeyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : '';
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Education Algorithm • Official Enrollment Portal</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
        :root {
            --bg-page: #f8fafc;
            --bg-surface: #ffffff;
            --bg-subtle: #f1f5f9;
            --text-primary: #0f172a;
            --text-secondary: #475569;
            --text-muted: #64748b;
            --primary: #4f46e5;
            --primary-hover: #4338ca;
            --primary-light: #eef2ff;
            --primary-glow: rgba(79, 70, 229, 0.18);
            --accent: #06b6d4;
            --success: #10b981;
            --success-light: #ecfdf5;
            --success-text: #047857;
            --danger: #ef4444;
            --danger-light: #fef2f2;
            --border: #e2e8f0;
            --border-subtle: #cbd5e1;
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 14px;
            --radius-xl: 18px;
            --radius-full: 9999px;
            --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
            --shadow-card: 0 8px 24px -4px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.02);
            --font-heading: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
            margin: 0 !important;
            padding: 0 !important;
        }

        body {
            font-family: var(--font-sans);
            background-color: var(--bg-page);
            color: var(--text-secondary);
            font-size: 14px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            -webkit-font-smoothing: antialiased;
            padding-top: 80px !important; /* 34px banner + 46px nav */
            box-sizing: border-box;
            background-image: 
                radial-gradient(circle at 10% 10%, rgba(79, 70, 229, 0.035) 0%, transparent 45%),
                radial-gradient(circle at 90% 85%, rgba(16, 185, 129, 0.03) 0%, transparent 45%),
                linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px);
            background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
        }

        body.banner-dismissed {
            padding-top: 46px !important;
        }
        body.banner-dismissed .site-nav {
            top: 0 !important;
        }
        body.banner-dismissed .announcement-banner {
            display: none !important;
        }

        /* 1. FIXED TOP ANNOUNCEMENT BANNER */
        .announcement-banner {
            background: linear-gradient(135deg, #eef2ff, #f5f3ff);
            border-bottom: 1px solid rgba(79, 70, 229, 0.12);
            padding: 0 1rem;
            font-size: 0.74rem;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            width: 100%;
            height: 34px;
            z-index: 1001;
            box-sizing: border-box;
        }
        .live-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 2.5px rgba(16, 185, 129, 0.25);
            display: inline-block;
            flex-shrink: 0;
        }
        .banner-text { display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
        .banner-text strong { font-weight: 700; color: #0f172a; }
        .banner-link {
            color: var(--primary);
            text-decoration: none;
            border: 1px solid rgba(79, 70, 229, 0.25);
            background: #ffffff;
            padding: 0.1rem 0.5rem;
            border-radius: var(--radius-full);
            font-size: 0.68rem;
            font-weight: 700;
            white-space: nowrap;
        }
        .banner-close { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; padding: 0 0.25rem; }

        /* 2. FIXED BRAND NAVBAR */
        .site-nav {
            position: fixed;
            top: 34px;
            left: 0;
            right: 0;
            width: 100%;
            height: 46px;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-bottom: 1px solid rgba(226, 232, 240, 0.85);
            z-index: 1000;
            box-shadow: 0 1px 8px rgba(0, 0, 0, 0.02);
            transition: top 0.25s ease;
            box-sizing: border-box;
        }
        .nav-inner {
            max-width: 1120px;
            margin: 0 auto;
            padding: 0 1.25rem;
            height: 46px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.75rem;
            box-sizing: border-box;
        }
        .brand-logo {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            text-decoration: none;
            color: var(--text-primary);
        }
        .ea-logo { display: block; flex-shrink: 0; color: var(--primary); width: 24px; height: 24px; }
        .brand-name {
            font-family: var(--font-heading);
            font-weight: 800;
            font-size: 0.95rem;
            color: var(--text-primary);
            white-space: nowrap;
        }
        .brand-badge {
            background: rgba(79, 70, 229, 0.08);
            color: var(--primary);
            font-size: 0.58rem;
            font-weight: 800;
            padding: 0.1rem 0.4rem;
            border-radius: var(--radius-sm);
            border: 1px solid rgba(79, 70, 229, 0.18);
            letter-spacing: 0.06em;
            text-transform: uppercase;
            font-family: var(--font-mono);
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            padding: 0.4rem 1rem;
            border-radius: var(--radius-sm);
            font-size: 0.8rem;
            font-weight: 700;
            font-family: var(--font-heading);
            text-decoration: none;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.2s ease;
        }
        .btn-secondary {
            background: #ffffff;
            border: 1px solid var(--border);
            color: var(--text-primary);
            box-shadow: 0 1px 2px rgba(0,0,0,0.03);
        }
        .btn-secondary:hover { 
            background: var(--primary-light); 
            color: var(--primary); 
            border-color: rgba(79,70,229,0.3); 
        }
        .nav-lms-btn {
            font-size: 0.76rem !important;
            font-weight: 700 !important;
            padding: 0.3rem 0.75rem !important;
            white-space: nowrap !important;
            border-radius: 6px !important;
            height: 28px !important;
        }

        /* 3. STEPPER PROGRESS NAVIGATION */
        .stepper-section {
            max-width: 580px;
            margin: 0.75rem auto 0.35rem !important;
            padding: 0 1rem;
            width: 100%;
            box-sizing: border-box;
        }
        .stage-eyebrow {
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--primary);
            font-family: var(--font-heading);
            text-align: center;
            margin-bottom: 0.45rem;
        }
        .stepper-nav-bar {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            position: relative;
            margin: 0 auto;
            width: 100%;
        }
        .stepper-track-line {
            position: absolute;
            top: 15px;
            left: 28px;
            right: 28px;
            height: 2px;
            background: #e2e8f0;
            z-index: 1;
            border-radius: 99px;
        }
        .stepper-track-fill {
            height: 100%;
            background: linear-gradient(90deg, #4f46e5 0%, #10b981 100%);
            width: 0%;
            border-radius: 99px;
            transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .step-anchor {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            width: 68px;
            gap: 0.25rem;
            z-index: 2;
            cursor: default;
        }
        .step-circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #ffffff;
            border: 2px solid #e2e8f0;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.78rem;
            font-family: var(--font-heading);
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
            transition: all 0.25s ease;
        }
        .step-anchor.active .step-circle {
            background: #4f46e5;
            border-color: #4f46e5;
            color: #ffffff;
            box-shadow: 0 0 0 3px #eef2ff, 0 3px 10px rgba(79, 70, 229, 0.2);
            transform: scale(1.04);
        }
        .step-anchor.done .step-circle {
            background: #10b981;
            border-color: #10b981;
            color: #ffffff;
            box-shadow: 0 0 0 3px #ecfdf5;
        }
        .step-text {
            font-size: 0.65rem;
            font-weight: 600;
            font-family: var(--font-heading);
            color: var(--text-muted);
            white-space: nowrap;
            text-align: center;
        }
        .step-anchor.active .step-text,
        .step-anchor.done .step-text { 
            color: var(--text-primary); 
            font-weight: 700; 
        }

        /* 4. SCREENS CONTAINER */
        .screens-container {
            max-width: 1080px;
            margin: 0 auto 3rem !important;
            padding: 0 1.25rem;
            flex: 1;
            width: 100%;
            box-sizing: border-box;
        }
        .flow-screen { display: none; }
        .flow-screen.active { display: block; animation: fadeInScreen 0.25s ease; }
        @keyframes fadeInScreen {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .dual-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.35rem;
            align-items: start;
            width: 100%;
            box-sizing: border-box;
        }

        .master-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.6rem 1.75rem;
            box-shadow: var(--shadow-card);
            position: relative;
            box-sizing: border-box;
        }

        .panel-title {
            font-size: 1.22rem;
            font-weight: 800;
            color: var(--text-primary);
            letter-spacing: -0.015em;
            margin-bottom: 0.25rem;
            font-family: var(--font-heading);
        }
        .panel-subtitle {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-bottom: 1.15rem;
            line-height: 1.45;
        }

        /* COHORT CARDS */
        .cohort-cards-stack { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
        .cohort-card {
            border: 1.5px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.85rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            background: var(--bg-surface);
            gap: 0.75rem;
        }
        .cohort-card:hover { border-color: var(--primary); transform: translateY(-1.5px); box-shadow: var(--shadow-sm); }
        .cohort-card.selected {
            border-color: var(--primary);
            background: #fdfefe;
            box-shadow: 0 0 0 1.5px var(--primary-light), 0 6px 16px rgba(79, 70, 229, 0.06);
        }
        .cohort-card-left { display: flex; align-items: center; gap: 0.75rem; }
        .cohort-icon-box {
            width: 38px;
            height: 38px;
            border-radius: var(--radius-sm);
            background: var(--primary-light);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            flex-shrink: 0;
        }
        .cohort-title-text b { font-size: 0.86rem; color: var(--text-primary); display: block; font-family: var(--font-heading); margin-bottom: 0.1rem; }
        .cohort-title-text small { font-size: 0.72rem; color: var(--text-muted); }
        .cohort-price-tag { font-family: var(--font-heading); font-weight: 800; font-size: 1rem; color: var(--text-primary); white-space: nowrap; }

        /* TRUST FOOTER */
        .trust-banner-strip {
            background: var(--bg-subtle);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 0.75rem 0.95rem;
            display: flex;
            align-items: center;
            gap: 0.6rem;
            font-size: 0.78rem;
            color: var(--text-secondary);
            font-weight: 600;
        }

        /* FORM INPUTS */
        .form-row { margin-bottom: 0.9rem; }
        .field-label { display: block; font-size: 0.76rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem; font-family: var(--font-heading); }
        .text-input {
            width: 100%;
            padding: 0.65rem 0.85rem;
            border: 1.5px solid var(--border);
            border-radius: var(--radius-sm);
            font-family: inherit;
            font-size: 0.84rem;
            color: var(--text-primary);
            transition: all 0.2s ease;
            background: var(--bg-surface);
            box-sizing: border-box;
        }
        .text-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
        .phone-field-wrap { display: flex; border: 1.5px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: var(--bg-surface); transition: all 0.2s ease; }
        .phone-field-wrap:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
        .phone-code { background: var(--bg-subtle); padding: 0.65rem 0.75rem; font-weight: 700; font-size: 0.8rem; color: var(--text-primary); border-right: 1px solid var(--border); display: flex; align-items: center; gap: 0.3rem; }
        .phone-field-wrap input { border: none; padding: 0.65rem 0.85rem; width: 100%; font-family: inherit; font-size: 0.84rem; color: var(--text-primary); outline: none; box-sizing: border-box; }

        .btn-cta-primary {
            width: 100%;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #ffffff;
            border: none;
            border-radius: var(--radius-sm);
            padding: 0.75rem 1.25rem;
            font-size: 0.88rem;
            font-weight: 700;
            font-family: var(--font-heading);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            box-shadow: 0 3px 12px var(--primary-glow);
            margin-top: 1rem;
            min-height: 42px;
        }
        .btn-cta-primary:hover { transform: translateY(-1.5px); box-shadow: 0 6px 20px var(--primary-glow); background: linear-gradient(135deg, #4338ca 0%, #3730a3 100%); }

        .btn-google-auth {
            width: 100%;
            background: #ffffff;
            border: 1.5px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 0.65rem 1rem;
            color: var(--text-primary);
            font-size: 0.82rem;
            font-weight: 700;
            font-family: var(--font-heading);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.65rem;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-xs);
            margin-top: 0.4rem;
            min-height: 42px;
        }
        .btn-google-auth:hover {
            border-color: #cbd5e1;
            background: #f8fafc;
            transform: translateY(-1px);
        }
        .auth-divider-line {
            display: flex;
            align-items: center;
            text-align: center;
            margin: 1rem 0 0.7rem;
            color: var(--text-muted);
            font-size: 0.68rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-family: var(--font-heading);
        }
        .auth-divider-line::before, .auth-divider-line::after { content: ''; flex: 1; border-bottom: 1px solid var(--border); }
        .auth-divider-line:not(:empty)::before { margin-right: 0.85em; }
        .auth-divider-line:not(:empty)::after { margin-left: 0.85em; }

        /* OTP SCREEN */
        .otp-inputs-flex { display: flex; gap: 0.45rem; justify-content: center; margin: 1.35rem 0 1rem; }
        .otp-box {
            width: 44px;
            height: 48px;
            border: 2px solid var(--border);
            border-radius: var(--radius-sm);
            font-family: var(--font-heading);
            font-size: 1.25rem;
            font-weight: 800;
            text-align: center;
            color: var(--text-primary);
            outline: none;
            transition: all 0.2s;
            background: var(--bg-surface);
        }
        .otp-box:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
        .otp-box.filled { border-color: var(--primary); background: #fbfbfe; }

        /* CHECKOUT & ORDER SUMMARY */
        .order-summary-box {
            background: var(--bg-subtle);
            border: 1.5px solid var(--border);
            border-radius: var(--radius-md);
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        .summary-course-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem; }
        .summary-course-info { display: flex; align-items: center; gap: 0.65rem; }
        .summary-course-icon { font-size: 1.45rem; }
        .summary-course-text b { font-size: 0.88rem; color: var(--text-primary); display: block; font-family: var(--font-heading); }
        .summary-course-text small { font-size: 0.74rem; color: var(--text-muted); }
        .coupon-input-wrap, .coupon-box-flex { display: flex; gap: 0.5rem; margin: 0.85rem 0; align-items: center; }
        .coupon-input-wrap input, .coupon-box-flex input, #promoInput {
            flex: 1;
            text-transform: uppercase;
            font-family: var(--font-mono);
            font-weight: 700;
            font-size: 0.85rem;
            letter-spacing: 0.06em;
            padding: 0.7rem 0.95rem;
            border: 1.5px solid var(--border-subtle, #cbd5e1);
            border-radius: 8px;
            background: #ffffff;
            color: var(--text-primary);
            outline: none;
            transition: all 0.2s ease-in-out;
        }
        .coupon-input-wrap input:focus, .coupon-box-flex input:focus, #promoInput:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3.5px rgba(79, 70, 229, 0.14);
            background: #ffffff;
        }
        .btn-apply-coupon {
            padding: 0.75rem 1.4rem !important;
            font-size: 0.82rem !important;
            font-weight: 800 !important;
            font-family: var(--font-heading) !important;
            letter-spacing: 0.05em !important;
            text-transform: uppercase !important;
            border-radius: 8px !important;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #4338ca 100%) !important;
            color: #ffffff !important;
            border: none !important;
            cursor: pointer !important;
            box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35) !important;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.35rem !important;
            white-space: nowrap !important;
        }
        .btn-apply-coupon:hover {
            background: linear-gradient(135deg, #4338ca 0%, #4f46e5 100%) !important;
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5) !important;
            transform: translateY(-2px) !important;
        }
        .btn-apply-coupon:active {
            transform: translateY(0) scale(0.96) !important;
            box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3) !important;
        }
        .price-breakdown-table { display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px dashed var(--border); padding-top: 0.85rem; }
        .price-item-row { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-secondary); }
        .price-item-row.discount-row { color: var(--success-text); font-weight: 700; }
        .price-item-row.total-amount { color: var(--text-primary); font-size: 1.12rem; font-weight: 800; font-family: var(--font-heading); padding-top: 0.75rem; border-top: 2px dashed var(--border); }

        /* ADMISSION PASS */
        .holographic-scholar-pass {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1.5px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.6rem;
            position: relative;
            box-shadow: 0 8px 25px -4px rgba(15, 23, 42, 0.06);
            margin-bottom: 1.6rem;
        }
        .holographic-scholar-pass::before { content: ''; position: absolute; top: 0; left: 0; width: 5px; bottom: 0; background: linear-gradient(180deg, #4f46e5 0%, #10b981 100%); }
        .pass-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.15rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
        .pass-verified-seal { background: var(--success-light); border: 1px solid var(--success); color: var(--success-text); font-size: 0.7rem; font-weight: 800; font-family: var(--font-heading); padding: 0.3rem 0.7rem; border-radius: var(--radius-full); }
        .pass-data-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .pass-data-item small { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 0.2rem; }
        .pass-data-item b { font-size: 0.92rem; color: var(--text-primary); font-family: var(--font-heading); font-weight: 800; }
        .pass-cohort-schedule-bar { display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); border: 1px solid var(--border); padding: 0.8rem 1rem; border-radius: var(--radius-md); font-size: 0.8rem; }

        #confettiCanvas { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999; }
        .toast-float {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0f172a;
            box-shadow: 0 12px 30px rgba(0,0,0,0.15);
            padding: 0.75rem 1.15rem;
            border-radius: var(--radius-sm);
            font-size: 0.82rem;
            font-weight: 600;
            font-family: var(--font-heading);
            color: #ffffff;
            z-index: 1000;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-float.show { transform: translateY(0); opacity: 1; }
        .toast-float.error { background: #dc2626; }

        /* RESPONSIVE MEDIA QUERIES */
        @media (max-width: 960px) {
            .dual-grid { grid-template-columns: 1fr !important; gap: 1.15rem !important; }
            .screens-container { padding: 0 1rem !important; }
            .master-card { padding: 1.35rem 1.15rem !important; }
        }

        @media (max-width: 640px) {
            body { font-size: 13px; padding-top: 76px !important; }
            .announcement-banner {
                padding: 0 0.5rem !important;
                gap: 0.35rem !important;
                font-size: 0.7rem !important;
                height: 32px !important;
                justify-content: center !important;
            }
            .banner-text { font-size: 0.7rem !important; }
            .banner-link { font-size: 0.65rem !important; padding: 0.08rem 0.4rem !important; }
            .banner-close { display: none !important; }

            .site-nav { top: 32px !important; height: 44px !important; }
            .nav-inner { height: 44px !important; padding: 0 0.85rem !important; }
            .brand-name { font-size: 0.88rem !important; }
            .brand-badge { display: none !important; }
            .nav-lms-btn { font-size: 0.72rem !important; padding: 0.25rem 0.55rem !important; height: 26px !important; }

            .stepper-section {
                margin: 0.45rem auto 0.3rem !important;
                padding: 0 0.5rem !important;
            }
            .stage-eyebrow {
                font-size: 0.62rem !important;
                margin-bottom: 0.3rem !important;
            }
            .stepper-track-line {
                top: 14px !important;
                left: 22px !important;
                right: 22px !important;
                height: 2px !important;
            }
            .step-anchor {
                width: 56px !important;
                gap: 0.2rem !important;
            }
            .step-circle {
                width: 28px !important;
                height: 28px !important;
                font-size: 0.72rem !important;
                border-width: 1.5px !important;
            }
            .step-text {
                font-size: 0.58rem !important;
            }

            .screens-container {
                padding: 0 0.65rem !important;
                margin-bottom: 1.75rem !important;
            }
            .master-card {
                padding: 1.15rem 0.95rem !important;
                border-radius: var(--radius-md) !important;
            }
            .panel-title { font-size: 1.15rem !important; }
            .panel-subtitle { font-size: 0.76rem !important; margin-bottom: 0.85rem !important; }
            .cohort-cards-stack { gap: 0.55rem !important; margin-bottom: 1rem !important; }
            .cohort-card { padding: 0.75rem 0.85rem !important; gap: 0.45rem !important; border-radius: var(--radius-sm) !important; }
            .cohort-icon-box { width: 34px !important; height: 34px !important; font-size: 1.15rem !important; }
            .cohort-title-text b { font-size: 0.8rem !important; }
            .cohort-title-text small { font-size: 0.68rem !important; }
            .cohort-price-tag { font-size: 0.92rem !important; }

            .text-input, .phone-field-wrap input, .coupon-input-wrap input { font-size: 16px !important; /* iOS zoom prevention */ }
            .otp-inputs-flex { gap: 0.3rem !important; }
            .otp-box { width: 38px !important; height: 42px !important; font-size: 1.15rem !important; }
            .pass-data-grid { grid-template-columns: 1fr !important; gap: 0.65rem !important; }
        }
    
        /* 5. SCREEN 2 POLISHED STYLING & BUTTONS */
        .phone-recipient-badge {
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.85rem;
            background: var(--bg-subtle);
            border: 1px solid var(--border);
            padding: 0.55rem 0.95rem;
            border-radius: var(--radius-md);
            font-size: 0.88rem;
            color: var(--text-primary);
            margin-bottom: 1.25rem;
            width: 100%;
            box-sizing: border-box;
        }
        .phone-recipient-badge span {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            word-break: break-all;
        }
        .phone-recipient-badge button {
            background: #ffffff;
            border: 1px solid var(--border);
            color: var(--primary);
            font-size: 0.76rem;
            font-weight: 700;
            font-family: var(--font-heading);
            padding: 0.3rem 0.65rem;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: var(--shadow-xs);
        }
        .phone-recipient-badge button:hover {
            border-color: var(--primary);
            background: #eef2ff;
        }

        .lock-icon-ring {
            width: 46px;
            height: 46px;
            border-radius: 12px;
            background: var(--primary-light);
            color: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.35rem;
            margin-bottom: 0.85rem;
        }

        .otp-timer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: var(--radius-md);
            padding: 0.65rem 0.9rem;
            font-size: 0.82rem;
            color: var(--text-muted);
            margin: 1.15rem 0 0.85rem;
        }
        .otp-timer-row strong {
            color: var(--primary);
            font-family: var(--font-mono);
            font-size: 0.95rem;
        }

        .resend-btn-text {
            background: none;
            border: none;
            color: var(--primary);
            font-weight: 700;
            font-family: var(--font-heading);
            font-size: 0.84rem;
            cursor: pointer;
            padding: 0;
            margin-left: 0.35rem;
            text-decoration: underline;
            transition: color 0.2s;
        }
        .resend-btn-text:hover {
            color: var(--primary-hover);
        }
        .resend-btn-text:disabled {
            color: var(--text-muted);
            cursor: not-allowed;
            text-decoration: none;
        }

        .existing-account-badge {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            color: #065f46;
            padding: 0.65rem 0.85rem;
            border-radius: var(--radius-md);
            font-size: 0.82rem;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: fadeInScreen 0.2s ease;
        }

    </style>
</head>
<body>

    

    <!-- ANNOUNCEMENT BANNER -->
    <div class="announcement-banner" id="topBanner">
        <span class="live-dot"></span>
        <span class="banner-text"><strong>Admissions Open</strong> • Live Batches</span>
        <a href="courses.php" class="banner-link">Explore &rarr;</a>
        <button class="banner-close" onclick="dismissBanner()">&times;</button>
    </div>

    <!-- BRAND NAVBAR -->
    <header class="site-nav" id="siteNav">
        <div class="nav-inner">
            <a href="./" class="brand-logo">
                <svg class="ea-logo" width="30" height="30" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/>
                    <path d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/>
                    <path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>
                    <circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/>
                </svg>
                <span class="brand-name">Education Algorithm</span>
                <span class="brand-badge">EDTECH</span>
            </a>
            <div style="flex-shrink: 0;">
                <a href="login.php" class="btn btn-secondary nav-lms-btn">Student LMS</a>
            </div>
        </div>
    </header>

    <!-- STEPPER NAVIGATION -->
    <section class="stepper-section">
        <div class="stage-eyebrow" id="stageEyebrowText">STEP 1 OF 4 • PROGRAM & SCHOLAR PROFILE</div>
        <div class="stepper-nav-bar">
            <div class="stepper-track-line">
                <div class="stepper-track-fill" id="stepperTrackFill" style="width: 0%;"></div>
            </div>
            <div class="step-anchor active" id="stepAnchor1">
                <div class="step-circle">1</div>
                <span class="step-text">Profile & Track</span>
            </div>
            <div class="step-anchor" id="stepAnchor2">
                <div class="step-circle">2</div>
                <span class="step-text">Email Verify</span>
            </div>
            <div class="step-anchor" id="stepAnchor3">
                <div class="step-circle">3</div>
                <span class="step-text">Payment</span>
            </div>
            <div class="step-anchor" id="stepAnchor4">
                <div class="step-circle">4</div>
                <span class="step-text">Access</span>
            </div>
        </div>
    </section>

    <!-- MAIN ENROLLMENT SCREENS -->
    <main class="screens-container">

        <!-- ═════════════════════════════════════════════════════════════════════
             SCREEN 1: PROGRAM SELECTION & SCHOLAR PROFILE
             ═════════════════════════════════════════════════════════════════════ -->
        <section class="flow-screen <?= !empty($alreadyEnrolledId) ? '' : 'active' ?>" id="screen1">
            <div class="dual-grid">
                <!-- LEFT SIDE: Academic Tracks -->
                <div class="master-card">
                    <span style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; color: var(--primary); font-family: var(--font-heading); text-transform: uppercase;">ACADEMIC TRACKS</span>
                    <h1 class="panel-title" style="margin-top: 0.25rem;">Select Learning Program</h1>
                    <p class="panel-subtitle" style="margin-bottom: 1.25rem;">Choose your target cohort track to begin your structured engineering roadmap.</p>

                    <div class="cohort-cards-stack">
                        <?php 
                        $icons = ['☕', '🤖', '☁️', '🚀', '⚡', '💻', '🎯'];
                        foreach ($courses as $idx => $c): 
                            $cIcon = $icons[$idx % count($icons)];
                        ?>
                        <div class="cohort-card <?= ($c['id'] == $selectedCourseId || ($idx == 0 && !$selectedCourseId)) ? 'selected' : '' ?>" 
                             onclick="selectCohort(this, <?= (int)$c['id'] ?>, '<?= htmlspecialchars($c['title'], ENT_QUOTES) ?>', <?= (int)$c['price'] ?>, '<?= htmlspecialchars($c['description'] ?? ($c['duration'] ?? '12 Weeks') . ' • Live Cohort', ENT_QUOTES) ?>', '<?= $cIcon ?>')">
                            <div class="cohort-card-left">
                                <div class="cohort-icon-box"><?= $cIcon ?></div>
                                <div class="cohort-title-text">
                                    <b><?= htmlspecialchars($c['title']) ?></b>
                                    <small><?= htmlspecialchars($c['duration'] ?? '12 Weeks') ?> • <?= htmlspecialchars($c['level'] ?? 'Intermediate') ?></small>
                                </div>
                            </div>
                            <div class="cohort-price-tag">₹<?= number_format((int)$c['price']) ?></div>
                        </div>
                        <?php endforeach; ?>
                    </div>

                    <div style="background: var(--bg-subtle); border-radius: var(--radius-md); padding: 1.15rem 1rem; display: flex; align-items: center; gap: 0.75rem; font-size: 0.84rem; color: var(--text-secondary); margin-top: 1.5rem;">
                        <span style="font-size: 1.25rem;">⭐</span>
                        <span><strong>4.9/5 Rating</strong> from 1,200+ Placed Engineering Alumni</span>
                    </div>
                </div>

                <!-- RIGHT SIDE: Scholar Identity Form -->
                <div class="master-card">
                    <h1 class="panel-title">Learn with structure. <br><span class="accent">Build real code.</span></h1>
                    <p class="panel-subtitle">Enter your details to reserve your seat in the live cohort.</p>

                    <div class="form-row">
                        <label class="field-label">Full Name</label>
                        <input type="text" class="text-input" id="inputName" placeholder="e.g. Rahul Sharma" value="<?= htmlspecialchars($initialName, ENT_QUOTES) ?>" required>
                    </div>

                    <div class="form-row">
                        <label class="field-label">Email Address (Student Portal Identity)</label>
                        <input type="email" class="text-input" id="inputEmail" placeholder="e.g. rahul@example.com" onblur="checkEmailRealtime()" oninput="debounceEmailCheck()" value="<?= htmlspecialchars($initialEmail, ENT_QUOTES) ?>" <?= $isGoogleVerified ? 'readonly' : '' ?> required>
                    </div>

                    <div class="form-row">
                        <label class="field-label">Mobile Number</label>
                        <div class="phone-field-wrap">
                            <span class="phone-code">🇮🇳 +91</span>
                            <input type="tel" id="inputPhone" placeholder="98765 43210" maxlength="10" value="<?= htmlspecialchars($initialPhone, ENT_QUOTES) ?>" required>
                        </div>
                    </div>

                                        <div id="existingAccountPill" class="existing-account-badge" style="display: none;">
                        <span>✨</span>
                        <div>
                            <strong>Existing Scholar Account Detected</strong>
                            <div style="font-size: 0.76rem; color: #047857; font-weight: 500;">Reusing your student account & LMS credentials. Password not required.</div>
                        </div>
                    </div>
                    <div class="form-row" id="passwordRow" style="<?= ($isGoogleVerified || !empty($loggedInStudent)) ? 'display: none;' : '' ?>">
                        <label class="field-label">Create Password (For LMS Student Portal)</label>
                        <input type="password" class="text-input" id="inputPassword" placeholder="Minimum 6 characters" minlength="6" required>
                    </div>

                    <button type="button" class="btn-cta-primary" id="btnSubmitProfile" onclick="handleProfileSubmit()" style="margin-top: 0.5rem;">
                        <span id="btnSubmitText"><?= ($isGoogleVerified || !empty($loggedInStudent)) ? 'Proceed to Payment →' : 'Continue to Email Verification →' ?></span>
                    </button>

                    <?php if (!$isGoogleVerified): ?>
                    <div class="auth-divider-line">OR 1-CLICK INSTANT FILL</div>
                    <button type="button" class="btn-google-auth" onclick="initiateGoogleAuth()">
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                        </svg>
                        <span>Continue with Google</span>
                    </button>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- ═════════════════════════════════════════════════════════════════════
             SCREEN 2: EMAIL OTP VERIFICATION
             ═════════════════════════════════════════════════════════════════════ -->
        <section class="flow-screen" id="screen2">
            <div class="dual-grid">
                <aside class="master-card">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: var(--success-light); color: var(--success); display: flex; align-items: center; justify-content: center; font-size: 1.35rem;">
                        ✦
                    </div>
                    <div>
                        <h2 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0.35rem 0;">Almost there!</h2>
                        <p style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
                            Verify your email address to secure your student portal account and proceed with enrollment.
                        </p>
                    </div>
                    <div style="height: 1px; background: var(--border); margin: 1.25rem 0;"></div>
                    <div style="display: flex; flex-direction: column; gap: 0.85rem; font-size: 0.86rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <span style="color: var(--success); font-weight: 800;">✓</span>
                            <span>Secure student account authentication</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <span style="color: var(--success); font-weight: 800;">✓</span>
                            <span>Instant course access upon payment</span>
                        </div>
                    </div>
                </aside>

                <div class="master-card">
                    <div class="lock-icon-ring">🔐</div>
                    <h1 class="panel-title">Verify your email</h1>
                    <p class="panel-subtitle" style="margin-bottom: 0.85rem;">We've sent a 6-digit verification code to</p>

                    <div class="phone-recipient-badge">
                        <span>✉️ <strong id="displayEmail"></strong></span>
                        <button type="button" onclick="goToStep(1)">Edit</button>
                    </div>

                    <div style="font-size: 0.8rem; font-weight: 700; font-family: var(--font-heading); color: var(--text-muted); margin-bottom: 0.65rem; text-transform: uppercase;">
                        Enter verification code
                    </div>

                    <div class="otp-inputs-flex">
                        <input type="text" maxlength="1" class="otp-box" id="otp0" autofocus oninput="handleOtpInput(this, 0)" onkeydown="handleOtpKey(event, 0)">
                        <input type="text" maxlength="1" class="otp-box" id="otp1" oninput="handleOtpInput(this, 1)" onkeydown="handleOtpKey(event, 1)">
                        <input type="text" maxlength="1" class="otp-box" id="otp2" oninput="handleOtpInput(this, 2)" onkeydown="handleOtpKey(event, 2)">
                        <input type="text" maxlength="1" class="otp-box" id="otp3" oninput="handleOtpInput(this, 3)" onkeydown="handleOtpKey(event, 3)">
                        <input type="text" maxlength="1" class="otp-box" id="otp4" oninput="handleOtpInput(this, 4)" onkeydown="handleOtpKey(event, 4)">
                        <input type="text" maxlength="1" class="otp-box" id="otp5" oninput="handleOtpInput(this, 5)" onkeydown="handleOtpKey(event, 5)">
                    </div>

                    <div class="otp-timer-row">
                        <span>⏱️ Code expires in</span>
                        <strong id="otpCountdown" class="num-god-level">10:00</strong>
                    </div>

                    <div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 1.75rem;">
                        Didn't receive the code?
                        <button type="button" class="resend-btn-text" id="btnResendOtp" onclick="triggerSendOtp()">Resend Code</button>
                    </div>

                    <button type="button" class="btn-cta-primary" id="btnVerifyOtp" onclick="triggerVerifyOtp()">
                        Verify & Continue <span>→</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- ═════════════════════════════════════════════════════════════════════
             SCREEN 3: PAYMENT & DEDICATED COUPON BOX
             ═════════════════════════════════════════════════════════════════════ -->
        <section class="flow-screen" id="screen3">
            <div class="dual-grid">
                <!-- LEFT SIDE: Order Summary & Coupon -->
                <aside class="master-card">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <h2 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">Order Summary</h2>
                        <span style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">1 Course</span>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.85rem; padding: 1.25rem 0; border-bottom: 1px solid var(--border);">
                        <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;" id="orderSummaryIcon">
                            <?= htmlspecialchars($courses[0]['icon'] ?? '☕') ?>
                        </div>
                        <div>
                            <b id="orderSummaryTitle" style="font-size: 1rem; color: var(--text-primary); display: block; font-family: var(--font-heading);"><?= htmlspecialchars($courses[0]['title']) ?></b>
                            <small id="orderSummaryDuration" style="font-size: 0.76rem; color: var(--text-muted);"><?= htmlspecialchars($courses[0]['description'] ?? '12 Weeks • Live Program') ?></small>
                        </div>
                    </div>

                    <div class="price-lines-wrap">
                        <div class="price-item-row">
                            <span>Course fee</span>
                            <strong id="baseFeeDisplay" class="num-god-level">₹0</strong>
                        </div>
                        <div class="price-item-row discount" id="discountRow" style="display: none;">
                            <span><span id="couponCodeName">COUPON</span> discount</span>
                            <strong id="discountDisplay" class="num-god-level">−₹0</strong>
                        </div>
                        <div class="price-item-row">
                            <span>GST (18%)</span>
                            <strong id="gstDisplay" class="num-god-level">₹0</strong>
                        </div>
                        <div class="price-item-row total-amount">
                            <span>Total payable</span>
                            <strong id="totalPayableDisplay" class="num-god-level">₹0</strong>
                        </div>
                    </div>

                    <!-- DEDICATED COUPON CARD -->
                    <div class="dedicated-coupon-card">
                        <div style="font-size: 0.8rem; font-weight: 700; font-family: var(--font-heading); color: var(--text-primary); margin-bottom: 0.5rem;">
                            🏷️ Have a Coupon Code?
                        </div>
                        <div class="coupon-box-flex">
                            <input type="text" id="promoInput" placeholder="ENTER COUPON CODE">
                            <button type="button" class="btn-apply-coupon" onclick="applyPromoCode()">Apply</button>
                        </div>

                        <div style="font-size: 0.76rem; font-weight: 700; margin-top: 0.5rem;" id="couponSuccessMsg"></div>
                    </div>
                </aside>

                <!-- RIGHT SIDE: Payment Gateway Trigger -->
                <div class="master-card">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                            <span style="font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; color: var(--primary); font-family: var(--font-heading); text-transform: uppercase;">SECURE CHECKOUT</span>
                            <h1 class="panel-title" style="margin-top: 0.2rem;">Choose a payment method</h1>
                        </div>
                        <span style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.76rem; color: var(--success-text); background: var(--success-light); border: 1px solid rgba(16, 185, 129, 0.25); padding: 0.35rem 0.85rem; border-radius: var(--radius-full); font-weight: 700; font-family: var(--font-heading);">
                            🔒 256-bit SSL
                        </span>
                    </div>

                    <div class="methods-list">
                        <div class="pay-method-card selected">
                            <div class="pay-method-left">
                                <div class="glyph-box">₹</div>
                                <div class="method-copy-title">
                                    <b>Razorpay Secure Gateway</b>
                                    <small>UPI (GPay/PhonePe), Cards, Net Banking & EMI</small>
                                </div>
                            </div>
                            <span class="check-badge">✓</span>
                        </div>
                    </div>

                    <button type="button" class="btn-cta-primary" id="btnPayNow" onclick="initiateRazorpayPayment()">
                        Proceed to Pay <span id="btnPayAmount" class="num-god-level">₹0</span> <span>→</span>
                    </button>

                    <div style="display: flex; align-items: center; justify-content: space-around; font-size: 0.76rem; color: var(--text-muted); margin-top: 1.5rem; border-top: 1px solid var(--border); padding-top: 1.15rem;">
                        <span>🛡 Secure payment</span>
                        <span>•</span>
                        <span>🔒 SSL encrypted</span>
                    </div>
                </div>
            </div>
        </section>

        <!-- ═════════════════════════════════════════════════════════════════════
             SCREEN 4: REAL SCHOLAR PASS & ACCESS
             ═════════════════════════════════════════════════════════════════════ -->
        <section class="flow-screen" id="screen4">
            <div class="dual-grid">
                <aside class="master-card">
                    <div style="width: 48px; height: 48px; border-radius: 14px; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.45rem;">
                        ✦
                    </div>
                    <h2 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0.45rem 0;">
                        Your next chapter<br>starts today.
                    </h2>
                    <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.65;">
                        You now hold a confirmed admission into the Education Algorithm Academic Cohort.
                    </p>
                </aside>

                <div class="master-card">
                    <div class="celebrate-ring">✓</div>
                    <span style="font-size: 0.74rem; font-weight: 800; letter-spacing: 0.12em; color: var(--success); font-family: var(--font-heading); text-transform: uppercase;">
                        PAYMENT CONFIRMED • SEAT OFFICIALLY ALLOTTED
                    </span>
                    <h1 class="panel-title" style="margin: 0.4rem 0 0.5rem;">You're officially enrolled! 🎉</h1>
                    <p class="panel-subtitle" style="margin-bottom: 1.5rem;">
                        Welcome to Education Algorithm. Below is your official verifiable student admission pass.
                    </p>

                    <div class="holographic-scholar-pass">
                        <div class="pass-header">
                            <div>
                                <b style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-primary);">OFFICIAL SCHOLAR ADMISSION PASS</b>
                                <small style="display: block; color: var(--text-muted);">Education Algorithm • Academic Cohort 2026</small>
                            </div>
                            <div class="pass-verified-seal">✓ VERIFIED SEAT</div>
                        </div>

                        <div class="pass-data-grid">
                            <div class="pass-data-item">
                                <small>Scholar Name</small>
                                <b id="passScholarName"></b>
                            </div>
                            <div class="pass-data-item">
                                <small>Scholar ID</small>
                                <b id="generatedScholarId" class="num-god-level"></b>
                            </div>
                            <div class="pass-data-item">
                                <small>Account Status</small>
                                <b style="color: var(--success-text);">Active Student</b>
                            </div>
                        </div>

                        <div class="pass-cohort-schedule-bar">
                            <div>
                                <small style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; display: block; font-family: var(--font-heading);">Enrolled Track</small>
                                <b id="successTitle" style="font-size: 0.96rem; color: var(--text-primary); font-family: var(--font-heading);"></b>
                            </div>
                            <button type="button" class="btn btn-secondary" onclick="copyScholarId()" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">📋 Copy ID</button>
                        </div>
                    </div>

                    <a href="dashboard.php" class="btn-cta-primary" style="text-decoration: none; font-size: 1.05rem; padding: 1.15rem 1.5rem;">
                        Go to Student LMS Dashboard <span>→</span>
                    </a>
                </div>
            </div>
        </section>

        <!-- ═════════════════════════════════════════════════════════════════════
             SCREEN: DEDICATED ALREADY ENROLLED STATE (NOT A PAYMENT SUCCESS)
             ═════════════════════════════════════════════════════════════════════ -->
        <section class="flow-screen <?= !empty($alreadyEnrolledId) ? 'active' : '' ?>" id="screenAlreadyEnrolled">
            <div class="master-card" style="max-width: 680px; margin: 0 auto; text-align: center; padding: 3rem 2rem;">
                <div style="width: 72px; height: 72px; border-radius: 50%; background: #ecfdf5; color: #047857; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 1.5rem; box-shadow: 0 4px 15px rgba(16,185,129,0.2);">
                    ✓
                </div>

                <span style="font-size: 0.76rem; font-weight: 800; letter-spacing: 0.12em; color: #047857; font-family: var(--font-heading); text-transform: uppercase; background: #dcfce7; padding: 0.25rem 0.75rem; border-radius: 100px;">
                    ACTIVE ENROLLMENT VERIFIED
                </span>

                <h1 style="font-size: 1.85rem; font-weight: 800; color: var(--text-primary); margin: 0.75rem 0 0.5rem; font-family: var(--font-heading);">
                    You're Already Enrolled
                </h1>

                <p style="font-size: 0.95rem; color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.75rem; line-height: 1.6;">
                    You already have full, verified student access to <strong id="alreadyEnrolledCourseName"><?= htmlspecialchars($alreadyEnrolledCourseTitle ?: ($selectedCourse['title'] ?? 'this course')) ?></strong>.
                </p>

                <div style="background: var(--bg-subtle); border: 1.5px solid var(--border); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem; text-align: left;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
                        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Enrollment Pass ID:</span>
                        <strong style="font-family: var(--font-mono); font-size: 0.95rem; color: var(--primary);" id="alreadyEnrolledPassId"><?= htmlspecialchars($alreadyEnrolledId ?: 'EA-2026-ACTIVE') ?></strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border);">
                        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Entitlement Status:</span>
                        <span style="font-size: 0.8rem; font-weight: 800; color: #15803d; background: #dcfce7; padding: 0.2rem 0.6rem; border-radius: 6px;">🟢 PAID & ACTIVE</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Access Privileges:</span>
                        <span style="font-size: 0.84rem; font-weight: 700; color: var(--text-primary);">Lifetime LMS + Mentor Code Arena</span>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <a href="dashboard.php" id="alreadyEnrolledDashboardBtn" class="btn-cta-primary" style="text-decoration: none; font-size: 1.05rem; padding: 1.15rem 1.5rem;">
                        Go to Student LMS Dashboard <span>→</span>
                    </a>
                    <button type="button" onclick="showScreen1ForOtherTracks()" class="btn btn-secondary" style="padding: 0.85rem 1.5rem; font-size: 0.92rem; font-weight: 700;">
                        📚 Explore & Enroll in Another Track
                    </button>
                </div>
            </div>
        </section>

    </main>

    <div id="toastMessage" class="toast-float">Notification</div>

    <script>
    const isGoogleVerified = <?= $isGoogleVerified ? 'true' : 'false' ?>;
    let currentVerificationId = '<?= htmlspecialchars($googleVerificationId, ENT_QUOTES) ?>';
    let currentOrderId = '';
    let currentKeyId = '<?= htmlspecialchars($razorpayKeyId, ENT_QUOTES) ?>';

    const studentPaidMap = <?= json_encode($studentPaidCourseMap) ?>;

    let selectedCourse = {
        id: <?= (int)$selectedCourse['id'] ?>,
        title: <?= json_encode($selectedCourse['title']) ?>,
        basePrice: <?= (int)$selectedCourse['price'] ?>,
        duration: <?= json_encode($selectedCourse['duration'] ?? '12 Weeks Live') ?>,
        icon: <?= json_encode($selectedCourse['icon'] ?? '☕') ?>
    };

    let activeDiscountAmount = 0;
    let activeCouponText = '';
    let otpTimerInterval = null;

    function dismissBanner() {
        document.body.classList.add('banner-dismissed');
    }

    function goToStep(stepNum) {
        document.querySelectorAll('.flow-screen').forEach(p => p.classList.remove('active'));
        const targetScreen = document.getElementById('screen' + stepNum);
        if (targetScreen) targetScreen.classList.add('active');

        const fill = document.getElementById('stepperTrackFill');
        const percents = [0, 33.3, 66.6, 100];
        if (fill) fill.style.width = percents[stepNum - 1] + '%';

        const stagePill = document.getElementById('stageEyebrowText');
        const stageTitles = [
            'STEP 1 OF 4 • PROGRAM & SCHOLAR PROFILE',
            'STEP 2 OF 4 • EMAIL VERIFICATION',
            'STEP 3 OF 4 • PAYMENT & CHECKOUT',
            'ENROLLMENT COMPLETE'
        ];
        if (stagePill) stagePill.textContent = stageTitles[stepNum - 1];

        for (let i = 1; i <= 4; i++) {
            const node = document.getElementById('stepAnchor' + i);
            if (!node) continue;
            node.classList.remove('active', 'done');
            if (i < stepNum) node.classList.add('done');
            else if (i === stepNum) node.classList.add('active');
        }

        if (stepNum === 2) {
            startOtpTimer(600);
        }

        if (stepNum === 4) {
            launchConfetti();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function initiateGoogleAuth() {
        window.location.href = 'login-google.php?action=redirect&enroll=1&course_id=' + encodeURIComponent(selectedCourse.id);
    }

        function selectCohort(element, id, title, price, duration, icon) {
        document.querySelectorAll('.cohort-card').forEach(c => c.classList.remove('selected'));
        element.classList.add('selected');

        selectedCourse.id = id;
        selectedCourse.title = title;
        selectedCourse.basePrice = price;
        selectedCourse.duration = duration;
        selectedCourse.icon = icon;

        document.getElementById('orderSummaryTitle').textContent = title;
        document.getElementById('orderSummaryDuration').textContent = duration;
        document.getElementById('orderSummaryIcon').textContent = icon;
        document.getElementById('successTitle').textContent = title;

        // Check if student is already enrolled in this selected track
        if (studentPaidMap && studentPaidMap[id]) {
            const enInfo = studentPaidMap[id];
            showAlreadyEnrolledScreen(enInfo.enrollment_id, enInfo.title || title, id);
            return;
        } else {
            // Not enrolled in this track -> Make sure screen 1 is visible
            document.getElementById('screenAlreadyEnrolled').classList.remove('active');
            if (!document.querySelector('.flow-screen.active')) {
                goToStep(1);
            }
        }

        recalcPricing();
    }

    function showAlreadyEnrolledScreen(enrollmentId, courseTitle, courseId) {
        document.querySelectorAll('.flow-screen').forEach(p => p.classList.remove('active'));
        const sc = document.getElementById('screenAlreadyEnrolled');
        if (sc) {
            sc.classList.add('active');
            document.getElementById('alreadyEnrolledCourseName').textContent = courseTitle;
            document.getElementById('alreadyEnrolledPassId').textContent = enrollmentId;
            const dashBtn = document.getElementById('alreadyEnrolledDashboardBtn');
            if (dashBtn) dashBtn.href = 'dashboard.php?course_id=' + encodeURIComponent(courseId);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showScreen1ForOtherTracks() {
        document.getElementById('screenAlreadyEnrolled').classList.remove('active');
        goToStep(1);
    }

    function recalcPricing() {
        const base = selectedCourse.basePrice;
        const discountAmt = activeDiscountAmount;
        const total = Math.max(0, base - discountAmt);

        const fmt = n => '₹' + n.toLocaleString('en-IN');

        document.getElementById('baseFeeDisplay').textContent = fmt(base);
        document.getElementById('discountDisplay').textContent = discountAmt > 0 ? '−' + fmt(discountAmt) : '₹0';
        if (document.getElementById('gstDisplay')) document.getElementById('gstDisplay').textContent = '₹0';
        document.getElementById('totalPayableDisplay').textContent = fmt(total);
        document.getElementById('btnPayAmount').textContent = fmt(total);

        const dRow = document.getElementById('discountRow');
        if (dRow) dRow.style.display = discountAmt > 0 ? 'flex' : 'none';
    }

    function quickApplyCoupon(code) {
        document.getElementById('promoInput').value = code;
        applyPromoCode();
    }

    function applyPromoCode() {
        const code = (document.getElementById('promoInput').value || '').trim().toUpperCase();
        const msg = document.getElementById('couponSuccessMsg');

        if (!code) {
            activeDiscountAmount = 0;
            activeCouponText = '';
            msg.textContent = '';
            recalcPricing();
            return;
        }

        fetch('api-enrollment.php?action=validate_coupon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coupon: code, course_id: selectedCourse.id })
        })
        .then(res => res.json())
        .then(data => {
            currentOrderId = '';
            if (data.success) {
                activeDiscountAmount = Number(data.discount || 0);
                activeCouponText = data.coupon_code || data.code || '';
                msg.style.color = 'var(--success-text)';
                msg.textContent = `✓ ${data.description || 'Coupon applied successfully!'}`;
                document.getElementById('couponCodeName').textContent = activeCouponText;
                showToast(`Coupon ${activeCouponText} applied!`);
                recalcPricing();
            } else {
                activeDiscountAmount = 0;
                activeCouponText = '';
                msg.style.color = 'var(--danger)';
                msg.textContent = `✕ ${data.error || 'Invalid coupon code.'}`;
                showToast(data.error || 'Invalid coupon code', true);
                recalcPricing();
            }
        })
        .catch(err => {
            currentOrderId = '';
            activeDiscountAmount = 0;
            activeCouponText = '';
            msg.style.color = 'var(--danger)';
            msg.textContent = '✕ Error validating coupon. Please try again.';
            showToast('Error validating coupon', true);
            recalcPricing();
        });
    }

    
    let emailCheckTimer = null;
    let isExistingScholarDetected = false;

    function debounceEmailCheck() {
        clearTimeout(emailCheckTimer);
        emailCheckTimer = setTimeout(checkEmailRealtime, 600);
    }

    function checkEmailRealtime() {
        const email = document.getElementById('inputEmail').value.trim();
        if (!email || !email.includes('@') || !email.includes('.')) {
            return;
        }

        fetch('api-enrollment.php?action=check_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                course_id: selectedCourse.id
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.already_enrolled) {
                    showAlreadyEnrolledScreen(data.enrollment_id || 'EA-2026-ACTIVE', data.course_title || selectedCourse.title, selectedCourse.id);
                    return;
                }

                const passRow = document.getElementById('passwordRow');
                const pill = document.getElementById('existingAccountPill');
                const nameInp = document.getElementById('inputName');
                const phoneInp = document.getElementById('inputPhone');

                if (data.is_existing) {
                    isExistingScholarDetected = true;
                    if (passRow) passRow.style.display = 'none';
                    if (pill) pill.style.display = 'flex';
                    if (data.student_name && !nameInp.value) nameInp.value = data.student_name;
                    if (data.student_phone && !phoneInp.value) phoneInp.value = data.student_phone;
                } else {
                    isExistingScholarDetected = false;
                    if (!isGoogleVerified) {
                        if (passRow) passRow.style.display = 'block';
                    }
                    if (pill) pill.style.display = 'none';
                }
            }
        })
        .catch(err => {});
    }

    function handleProfileSubmit() {
        const name = document.getElementById('inputName').value.trim();
        const email = document.getElementById('inputEmail').value.trim();
        const phone = document.getElementById('inputPhone').value.trim();
        const password = document.getElementById('inputPassword').value;

        if (!name || name.length < 2) {
            showToast('Please enter your full name (minimum 2 characters)', true);
            document.getElementById('inputName').focus();
            return;
        }
        if (!email || !email.includes('@')) {
            showToast('Please provide a valid email address', true);
            document.getElementById('inputEmail').focus();
            return;
        }
        if (!phone || phone.length < 7) {
            showToast('Please enter a valid phone number (7–15 digits)', true);
            document.getElementById('inputPhone').focus();
            return;
        }

        if (isGoogleVerified) {
            // Google verified path: Init checkout intent
            const btn = document.getElementById('btnSubmitProfile');
            btn.disabled = true;
            btn.innerHTML = 'Connecting to Secure Checkout... ⏳';

            fetch('api-enrollment.php?action=google_checkout_init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    course_id: selectedCourse.id,
                    coupon: activeCouponText,
                    phone: phone
                })
            })
            .then(res => res.json())
            .then(data => {
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Payment →';
                if (data.success) {
                    currentOrderId = data.order_id;
                    if (data.key_id) currentKeyId = data.key_id;
                    goToStep(3);
                } else {
                    showToast(data.error || 'Unable to start checkout. Please try again.', true);
                }
            })
            .catch(err => {
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Payment →';
                showToast('Network error starting checkout. Please try again.', true);
            });
            return;
        }

        // Normal Email/Password Flow
        if (!isExistingScholarDetected && !isGoogleVerified && (!password || password.length < 6)) {
            showToast('Please create a password with at least 6 characters', true);
            document.getElementById('inputPassword').focus();
            return;
        }

        triggerSendOtp();
    }

    function triggerSendOtp() {
        const name = document.getElementById('inputName').value.trim();
        const email = document.getElementById('inputEmail').value.trim();
        const phone = document.getElementById('inputPhone').value.trim();
        const password = document.getElementById('inputPassword').value;

        const btn = document.getElementById('btnSubmitProfile');
        btn.disabled = true;
        btn.innerHTML = 'Sending Verification Code... ⏳';

        fetch('api-enrollment.php?action=send_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name,
                email: email,
                phone: phone,
                password: password,
                course_id: selectedCourse.id,
                coupon: activeCouponText
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = 'Continue to Email Verification →';
            if (data.success) {
                if (data.already_enrolled) {
                    showAlreadyEnrolledScreen(data.enrollment_id || 'EA-2026-ACTIVE', data.course_title || selectedCourse.title, data.course_id || selectedCourse.id);
                    return;
                }
                currentVerificationId = data.verification_id;
                document.getElementById('displayEmail').textContent = email;
                
                // Clear OTP boxes for clean user typing & pasting
                for (let i = 0; i < 6; i++) {
                    const el = document.getElementById('otp' + i);
                    if (el) el.value = '';
                }
                updateOtpFillStyle();
                showToast(data.message || 'Verification code sent to your email!');
                goToStep(2);
                setTimeout(() => document.getElementById('otp0')?.focus(), 150);
            } else {
                showToast(data.error || 'Unable to send verification code. Please try again.', true);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = 'Continue to Email Verification →';
            showToast('Unable to send verification code. Please check your network and try again.', true);
        });
    }

    function handleOtpInput(input, index) {
        const inputs = document.querySelectorAll('.otp-box');
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
        updateOtpFillStyle();
    }

    function handleOtpKey(e, index) {
        const inputs = document.querySelectorAll('.otp-box');
        if (e.key === 'Backspace' && !inputs[index].value && index > 0) {
            inputs[index - 1].focus();
        }
    }

    function updateOtpFillStyle() {
        document.querySelectorAll('.otp-box').forEach(inp => {
            if (inp.value) inp.classList.add('filled');
            else inp.classList.remove('filled');
        });
    }

    function startOtpTimer(duration) {
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        let timer = duration;
        const display = document.getElementById('otpCountdown');

        otpTimerInterval = setInterval(() => {
            const minutes = parseInt(timer / 60, 10);
            const seconds = parseInt(timer % 60, 10);

            const mStr = minutes < 10 ? '0' + minutes : minutes;
            const sStr = seconds < 10 ? '0' + seconds : seconds;

            display.textContent = mStr + ':' + sStr;

            if (--timer < 0) {
                clearInterval(otpTimerInterval);
                display.textContent = '00:00';
            }
        }, 1000);
    }

    function triggerVerifyOtp() {
        const inputs = document.querySelectorAll('.otp-box');
        let enteredOtp = '';
        inputs.forEach(i => enteredOtp += i.value.trim());

        if (enteredOtp.length < 6) {
            showToast('Please enter the complete 6-digit verification code', true);
            return;
        }

        const email = document.getElementById('inputEmail').value.trim();
        const btn = document.getElementById('btnVerifyOtp');
        btn.disabled = true;
        btn.innerHTML = 'Verifying Code... ⏳';

        fetch('api-enrollment.php?action=verify_otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                otp: enteredOtp,
                verification_id: currentVerificationId,
                coupon: activeCouponText
            })
        })
        .then(res => res.json())
        .then(data => {
            btn.disabled = false;
            btn.innerHTML = 'Verify & Continue →';
            if (data.success) {
                currentOrderId = data.order_id;
                if (data.key_id) currentKeyId = data.key_id;
                showToast('Email verified successfully! ✓');
                goToStep(3);
            } else {
                showToast(data.error || 'Verification failed. Please check the code.', true);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = 'Verify & Continue →';
            showToast('Verification failed. Please check your network and try again.', true);
        });
    }

    function initiateRazorpayPayment() {
        const name = document.getElementById('inputName').value.trim() || 'Scholar';
        const email = document.getElementById('inputEmail').value.trim();
        const phone = document.getElementById('inputPhone').value.trim() || '9876543210';

        const btn = document.getElementById('btnPayNow');
        btn.disabled = true;
        btn.innerHTML = 'Connecting to Payment Gateway... ⏳';

        if (!email) {
            showToast('Student email is required to initiate checkout.', true);
            btn.disabled = false;
            btn.innerHTML = 'Proceed to Pay →';
            goToStep(1);
            return;
        }

        // Dynamically request fresh order from backend with exact active course and coupon
        fetch('api-enrollment.php?action=create_checkout_order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                name: name,
                phone: phone,
                course_id: selectedCourse.id,
                coupon: activeCouponText,
                verification_id: currentVerificationId
            })
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                showToast(data.error || 'Failed to start payment gateway session.', true);
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Pay →';
                return;
            }

            const displayedText = (document.getElementById('totalPayableDisplay').textContent || '0').replace(/[^0-9.]/g, '');
            const displayedRupees = parseFloat(displayedText) || 0;
            const expectedPaise = Math.round(displayedRupees * 100);
            const returnedPaise = Number(data.amount_paise || (data.amount * 100));

            if (returnedPaise !== expectedPaise && Math.abs(returnedPaise - expectedPaise) > 1) {
                showToast('Payment amount discrepancy detected. Refreshing checkout pricing...', true);
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Pay →';
                recalcPricing();
                return;
            }

            currentOrderId = data.order_id;
            if (data.key_id) currentKeyId = data.key_id;

            if (!window.Razorpay) {
                showToast('Razorpay checkout script failed to load. Please check your internet connection or ad-blocker.', true);
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Pay →';
                return;
            }

            const options = {
                key: currentKeyId,
                amount: data.amount_paise || Math.round(data.amount * 100),
                currency: "INR",
                name: 'Education Algorithm',
                description: selectedCourse.title,
                order_id: currentOrderId,
                prefill: {
                    name: name,
                    email: email,
                    contact: phone
                },
                theme: { color: '#4f46e5' },
                handler: function(response) {
                    btn.innerHTML = 'Verifying Cryptographic Signature... ⏳';
                    finalizePaymentWithServer(response);
                },
                modal: {
                    ondismiss: function() {
                        btn.disabled = false;
                        btn.innerHTML = 'Proceed to Pay <span id="btnPayAmount" class="num-god-level">₹' + Math.round(data.amount).toLocaleString('en-IN') + '</span> <span>→</span>';
                        showToast('Payment window closed. Your seat is not reserved until payment is completed.', true);
                    }
                }
            };

            try {
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', function(resp) {
                    btn.disabled = false;
                    btn.innerHTML = 'Proceed to Pay →';
                    showToast(resp.error?.description || 'Payment rejected by bank or gateway.', true);
                });
                rzp.open();
            } catch (e) {
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Pay →';
                showToast('Unable to launch Razorpay popup: ' + e.message, true);
            }
        })
        .catch(err => {
            btn.disabled = false;
            btn.innerHTML = 'Proceed to Pay →';
            showToast('Network error connecting to payment gateway. Please try again.', true);
        });
    }

    function finalizePaymentWithServer(rzpResponse) {
        const email = document.getElementById('inputEmail').value.trim();
        const name = document.getElementById('inputName').value.trim();

        fetch('api-enrollment.php?action=finalize_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                razorpay_order_id: rzpResponse.razorpay_order_id,
                razorpay_payment_id: rzpResponse.razorpay_payment_id,
                razorpay_signature: rzpResponse.razorpay_signature,
                verification_id: currentVerificationId
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('passScholarName').textContent = name;
                document.getElementById('generatedScholarId').textContent = data.enrollment_id;
                document.getElementById('successTitle').textContent = selectedCourse.title;
                showToast('Payment confirmed! Welcome to Education Algorithm! 🎉');
                goToStep(4);
            } else {
                showToast(data.error || 'Cryptographic payment verification failed. Please contact support.', true);
                const btn = document.getElementById('btnPayNow');
                btn.disabled = false;
                btn.innerHTML = 'Proceed to Pay →';
            }
        })
        .catch(err => {
            showToast('Payment verification network error. Please contact admissions with your Payment ID: ' + rzpResponse.razorpay_payment_id, true);
            const btn = document.getElementById('btnPayNow');
            btn.disabled = false;
            btn.innerHTML = 'Proceed to Pay →';
        });
    }

    function copyScholarId() {
        const id = document.getElementById('generatedScholarId').textContent;
        navigator.clipboard.writeText(id).then(() => {
            showToast(`Scholar ID ${id} copied to clipboard!`);
        });
    }

    function showToast(text, isError = false) {
        const t = document.getElementById('toastMessage');
        t.textContent = text;
        if (isError) t.classList.add('error');
        else t.classList.remove('error');
        t.classList.add('show');
        setTimeout(() => {
            t.classList.remove('show');
        }, 4000);
    }

    function launchConfetti() {
        const canvas = document.getElementById('confettiCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#8b5cf6'];

        for (let i = 0; i < 140; i++) {
            particles.push({
                x: canvas.width / 2,
                y: canvas.height / 2,
                r: Math.random() * 6 + 3,
                d: Math.random() * 40,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
                tiltAngle: 0,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 18,
                gravity: 0.35,
                opacity: 1
            });
        }

        let animationFrame;
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.tiltAngle += p.tiltAngleIncremental;
                p.tilt = Math.sin(p.tiltAngle) * 15;
                p.opacity -= 0.007;

                if (p.opacity > 0 && p.y < canvas.height) {
                    alive++;
                    ctx.beginPath();
                    ctx.lineWidth = p.r / 2;
                    ctx.strokeStyle = p.color;
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.moveTo(p.x + p.tilt + p.r, p.y);
                    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
                    ctx.stroke();
                }
            });

            if (alive > 0) {
                animationFrame = requestAnimationFrame(draw);
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                cancelAnimationFrame(animationFrame);
            }
        }

        draw();
    }

    window.addEventListener('DOMContentLoaded', () => {
        recalcPricing();
        <?php if (!empty($alreadyEnrolledId)): ?>
        // Show dedicated Already Enrolled screen — NEVER call goToStep(4) on page load!
        showAlreadyEnrolledScreen(<?= json_encode($alreadyEnrolledId) ?>, <?= json_encode($alreadyEnrolledCourseTitle) ?>, <?= (int)$selectedCourseId ?>);
        <?php endif; ?>
    });
    </script>
<canvas id="confettiCanvas"></canvas>
</body>
</html>