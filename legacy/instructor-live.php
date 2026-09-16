<?php
$facultyActive = 'live-classes';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);
$courseIds = array_map(function($c) { return (int)$c['id']; }, $assignedCourses);
$courseInSql = !empty($courseIds) ? implode(',', $courseIds) : '0';

$message = "";
$error = "";

// Handle Schedule Live Class
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["schedule_live"])) {
    verify_csrf();
    $targetCourseId = (int)($_POST["course_id"] ?? 0);
    enforce_instructor_course_scope($instId, $targetCourseId);

    $title = clean_text($_POST["title"] ?? "", 150);
    $url   = filter_var($_POST["meeting_url"] ?? "", FILTER_VALIDATE_URL);
    $sched = $_POST["scheduled_at"] ?? "";
    $dur   = (int)($_POST["duration_minutes"] ?? 60);

    if ($title && $url && $sched && $targetCourseId > 0) {
        $stmt = $pdo->prepare("INSERT INTO live_sessions (course_id, instructor_id, title, meeting_url, scheduled_at, duration_mins, status) VALUES (?, ?, ?, ?, ?, ?, 'upcoming')");
        $stmt->execute([$targetCourseId, $instId, $title, $url, $sched, $dur]);

        log_instructor_audit($instId, 'LIVE_CLASS_SCHEDULED', $targetCourseId, "Scheduled class: {$title}");
        $message = "Live Masterclass scheduled successfully!";
    } else {
        $error = "Please provide valid meeting details, URL, and time.";
    }
}

// Fetch Live Classes for Scoped Tracks
$liveClasses = $pdo->query("
    SELECT l.*, c.title as course_title
    FROM live_sessions l
    JOIN courses c ON l.course_id = c.id
    WHERE l.course_id IN ({$courseInSql})
    ORDER BY l.scheduled_at DESC
")->fetchAll();
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
    <title>Live Masterclasses — Faculty Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
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
        padding: 0.55rem 0.85rem;
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        border-radius: 8px;
        color: #ffffff !important;
        font-size: 0.82rem;
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
        padding: 0.55rem 1.1rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.82rem;
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
            <div>
                <h1 style="font-size: 1.45rem; font-weight: 800; letter-spacing: -0.03em;">Live Cohort Masterclasses</h1>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.2rem;">Host interactive Zoom / Google Meet masterclasses strictly for your enrolled students.</p>
            </div>
        </div>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ✓ <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>
        <?php if (!empty($error)): ?>
            <div style="background: rgba(244,63,94,0.15); border: 1px solid #f43f5e; color: #fca5a5; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ⚠ <?= htmlspecialchars($error) ?>
            </div>
        <?php endif; ?>

        <!-- SCHEDULE FORM -->
        <div class="card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1.25rem;">🔴 Schedule Upcoming Masterclass</h3>
            <form method="POST" style="display: grid; grid-template-columns: 1.2fr 2fr 2fr 1.5fr 1fr auto; gap: 1rem; align-items: flex-end;" class="responsive-form-grid" class="responsive-form-grid">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                <input type="hidden" name="schedule_live" value="1">

                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">Target Track</label>
                    <select name="course_id" class="form-input" required>
                        <?php foreach ($assignedCourses as $ac): ?>
                            <option value="<?= $ac['id'] ?>">Track #<?= $ac['id'] ?>: <?= htmlspecialchars($ac['title']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">Masterclass Topic</label>
                    <input type="text" name="title" class="form-input" placeholder="e.g. End-to-End MLOps Pipeline with MLflow" required>
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">Meeting URL (Zoom / Meet)</label>
                    <input type="url" name="meeting_url" class="form-input" placeholder="https://meet.google.com/xyz" required>
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">Date & Time</label>
                    <input type="datetime-local" name="scheduled_at" class="form-input" required>
                </div>
                <div>
                    <label style="font-size: 0.8rem; font-weight: 700; color: #cbd5e1;">Mins</label>
                    <input type="number" name="duration_minutes" class="form-input" value="60" min="15" max="300">
                </div>
                <button type="submit" class="btn-submit">Publish Live Session ➔</button>
            </form>
        </div>

        <!-- SCHEDULED ROSTER -->
        <div class="card">
            <h3 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 1.25rem;">Scheduled Masterclasses</h3>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Topic</th>
                            <th>Target Track</th>
                            <th>Date & Time</th>
                            <th>Duration</th>
                            <th>Status</th>
                            <th>Launch Room</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($liveClasses)): ?>
                            <tr><td colspan="6" style="text-align: center; color: var(--text-subtle); padding: 3rem 0;">No live masterclasses scheduled yet.</td></tr>
                        <?php else: ?>
                            <?php foreach ($liveClasses as $lc): ?>
                                <tr>
                                    <td><strong style="color: var(--text-main);"><?= htmlspecialchars($lc['title']) ?></strong></td>
                                    <td><span style="background: rgba(99,102,241,0.15); color: #c7d2fe; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem;"><?= htmlspecialchars($lc['course_title']) ?></span></td>
                                    <td>🗓️ <?= date('D, M j, Y @ g:i A', strtotime($lc['scheduled_at'])) ?></td>
                                    <td><?= htmlspecialchars((string)($lc['duration_mins'] ?? $lc['duration_minutes'] ?? 60)) ?> mins</td>
                                    <td>
                                        <span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 0.25rem 0.6rem; border-radius: 100px; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">
                                            ● <?= htmlspecialchars($lc['status']) ?>
                                        </span>
                                    </td>
                                    <td>
                                        <a href="<?= htmlspecialchars($lc['meeting_url']) ?>" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; text-decoration: none; padding: 0.45rem 0.9rem; border-radius: 8px; font-weight: 700; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                                            Start Room ➔
                                        </a>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>