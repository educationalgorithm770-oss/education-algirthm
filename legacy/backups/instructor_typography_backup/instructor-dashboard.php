<?php
$facultyActive = 'dashboard';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);
$courseIds = array_map(function($c) { return (int)$c['id']; }, $assignedCourses);
$courseInSql = !empty($courseIds) ? implode(',', $courseIds) : '0';

// Scoped Stats
$stmtEnrolled = $pdo->query("SELECT COUNT(DISTINCT student_id) FROM enrollments WHERE course_id IN ({$courseInSql}) AND status = 'active'");
$totalStudents = (int)$stmtEnrolled->fetchColumn();

$stmtVideos = $pdo->query("SELECT COUNT(*) FROM videos WHERE module_id IN (SELECT id FROM modules WHERE course_id IN ({$courseInSql}))");
$totalVideos = (int)$stmtVideos->fetchColumn();

$stmtQuizzes = $pdo->query("SELECT COUNT(*) FROM quizzes WHERE module_id IN (SELECT id FROM modules WHERE course_id IN ({$courseInSql}))");
$totalQuizzes = (int)$stmtQuizzes->fetchColumn();

$stmtDoubts = $pdo->query("SELECT COUNT(*) FROM lesson_doubts WHERE course_id IN ({$courseInSql}) AND status = 'pending'");
$pendingDoubts = (int)$stmtDoubts->fetchColumn();

$stmtRecents = $pdo->query("
    SELECT s.name, s.email, c.title as course_title, e.enrolled_at
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN courses c ON e.course_id = c.id
    WHERE e.course_id IN ({$courseInSql}) AND e.status = 'active'
    ORDER BY e.id DESC
    LIMIT 6
");
$recentStudents = $stmtRecents->fetchAll();

$stmtLive = $pdo->query("
    SELECT l.*, c.title as course_title
    FROM live_sessions l
    JOIN courses c ON l.course_id = c.id
    WHERE l.course_id IN ({$courseInSql}) AND l.status = 'upcoming'
    ORDER BY l.scheduled_at ASC
    LIMIT 4
");
$upcomingClasses = $stmtLive->fetchAll();

$stmtRecentDoubts = $pdo->query("
    SELECT d.*, s.name as student_name, c.title as course_title
    FROM lesson_doubts d
    JOIN students s ON d.student_id = s.id
    JOIN courses c ON d.course_id = c.id
    WHERE d.course_id IN ({$courseInSql})
    ORDER BY d.id DESC
    LIMIT 4
");
$recentDoubts = $stmtRecentDoubts->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Cockpit — Faculty Portal</title>
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
        <!-- HERO QUICK LAUNCH -->
        <div class="hero-banner">
            <div>
                <h1 style="font-size: 1.65rem; font-weight: 800; letter-spacing: -0.02em;">Welcome back, <?= htmlspecialchars($profile['name']) ?>! 👋</h1>
                <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 0.2rem;">Track-Isolated Academic Cockpit</p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <a href="instructor-content.php" class="quick-btn">📹 Upload Lecture</a>
                <a href="instructor-live.php" class="quick-btn">🔴 Live Class</a>
                <a href="instructor-quizzes.php" class="quick-btn">🤖 AI Quiz</a>
                <a href="instructor-announcements.php" class="quick-btn">📢 Broadcast</a>
            </div>
        </div>

        <!-- STATS GRID -->
        <div class="stat-grid">
            <div class="stat-card">
                <div class="stat-label">Assigned Students</div>
                <div class="stat-number" style="color: #818cf8;"><?= $totalStudents ?></div>
                <span style="color: #34d399; font-size: 0.75rem; font-weight: 700;">✓ Active Enrolled Cohort</span>
            </div>
            <div class="stat-card">
                <div class="stat-label">Video Lectures</div>
                <div class="stat-number" style="color: #38bdf8;"><?= $totalVideos ?></div>
                <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700;">High-Speed Bunny CDN</span>
            </div>
            <div class="stat-card">
                <div class="stat-label">Interactive Quizzes</div>
                <div class="stat-number" style="color: #ec4899;"><?= $totalQuizzes ?></div>
                <span style="color: #c084fc; font-size: 0.75rem; font-weight: 700;">AI Scoped Assessments</span>
            </div>
            <div class="stat-card">
                <div class="stat-label">Student Doubts</div>
                <div class="stat-number" style="color: #fbbf24;"><?= $pendingDoubts ?></div>
                <span style="color: #f59e0b; font-size: 0.75rem; font-weight: 700;">Requires Solution</span>
            </div>
        </div>

        <!-- 2-COLUMN GRID -->
        <div class="content-grid">
            <!-- RECENT ENROLLED COHORT -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <h3 style="font-size: 1.15rem; font-weight: 800;">👥 Recently Enrolled Students</h3>
                    <span style="font-size: 0.78rem; color: var(--text-subtle);">Track Scoped</span>
                </div>
                <div class="table-responsive">
                    <table class="table-custom">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Enrolled Track</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($recentStudents)): ?>
                                <tr><td colspan="3" style="text-align: center; color: var(--text-subtle); padding: 2.5rem 0;">No students enrolled in your track yet.</td></tr>
                            <?php else: ?>
                                <?php foreach ($recentStudents as $s): ?>
                                    <tr>
                                        <td>
                                            <strong style="color: var(--text-main);"><?= htmlspecialchars($s['name']) ?></strong><br>
                                            <span style="font-size: 0.75rem; color: var(--text-subtle);"><?= htmlspecialchars($s['email']) ?></span>
                                        </td>
                                        <td><span style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #c7d2fe; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; white-space: nowrap;"><?= htmlspecialchars($s['course_title']) ?></span></td>
                                        <td><?= date('M j, Y', strtotime($s['enrolled_at'])) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- UPCOMING LIVE & DOUBTS -->
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-size: 1.15rem; font-weight: 800;">🔴 Live Masterclasses</h3>
                        <a href="instructor-live.php" style="color: var(--accent-primary); font-size: 0.8rem; font-weight: 700; text-decoration: none;">+ Schedule</a>
                    </div>
                    <?php if (empty($upcomingClasses)): ?>
                        <div style="text-align: center; padding: 1.5rem 0; color: var(--text-subtle);">
                            No live classes scheduled yet.
                        </div>
                    <?php else: ?>
                        <?php foreach ($upcomingClasses as $lc): ?>
                            <div style="background: #0b1120; border: 1px solid var(--border-color); border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 0.65rem; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-size: 0.72rem; font-weight: 800; color: var(--accent-primary); text-transform: uppercase;"><?= htmlspecialchars($lc['course_title']) ?></div>
                                    <h4 style="font-size: 0.92rem; font-weight: 700; margin: 0.2rem 0;"><?= htmlspecialchars($lc['title']) ?></h4>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">🗓️ <?= date('D, M j @ g:i A', strtotime($lc['scheduled_at'])) ?></span>
                                </div>
                                <a href="<?= htmlspecialchars($lc['meeting_url']) ?>" target="_blank" style="background: #10b981; color: #fff; text-decoration: none; padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700;">Join ➔</a>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="font-size: 1.15rem; font-weight: 800;">💬 Student Q&A Queue</h3>
                        <a href="instructor-doubts.php" style="color: #fbbf24; font-size: 0.8rem; font-weight: 700; text-decoration: none;">Open Desk ➔</a>
                    </div>
                    <?php if (empty($recentDoubts)): ?>
                        <div style="text-align: center; padding: 1.5rem 0; color: var(--text-subtle);">
                            No doubts pending right now.
                        </div>
                    <?php else: ?>
                        <?php foreach ($recentDoubts as $rd): ?>
                            <div style="background: #0b1120; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.75rem 0.9rem; margin-bottom: 0.5rem;">
                                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.2rem;">
                                    <strong style="color: var(--text-main);"><?= htmlspecialchars($rd['student_name']) ?></strong>
                                    <span style="color: <?= $rd['status'] === 'answered' ? '#34d399' : '#fbbf24' ?>; font-weight: 800; font-size: 0.7rem; text-transform: uppercase;"><?= $rd['status'] ?></span>
                                </div>
                                <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.4;"><?= htmlspecialchars(substr($rd['question'], 0, 85)) ?>...</p>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>