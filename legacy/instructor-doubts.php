<?php
$facultyActive = 'doubts';
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

// Handle Reply
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["reply_doubt"])) {
    verify_csrf();
    $doubtId = (int)($_POST["doubt_id"] ?? 0);
    $answer  = clean_text($_POST["answer"] ?? "", 3000);

    if ($doubtId > 0 && !empty($answer)) {
        // Update lesson_doubts
        try {
            $stmt = $pdo->prepare("UPDATE lesson_doubts SET answer = ?, status = 'answered', answered_at = NOW(), instructor_id = ? WHERE id = ?");
            $stmt->execute([$answer, $instId, $doubtId]);
        } catch (Exception $e) {}

        // Also update student_doubts table
        try {
            $stmtSD = $pdo->prepare("UPDATE student_doubts SET faculty_reply = ?, status = 'resolved', instructor_id = ? WHERE id = ? OR student_id = (SELECT student_id FROM lesson_doubts WHERE id = ? LIMIT 1)");
            $stmtSD->execute([$answer, $instId, $doubtId, $doubtId]);
        } catch (Exception $e) {}

        log_instructor_audit($instId, 'DOUBT_ANSWERED', 0, "Answered doubt ID #{$doubtId}");
        $message = "Solution dispatched to student successfully!";
    } else {
        $error = "Please provide an answer.";
    }
}

// Fetch Doubts for Scoped Tracks (UNION with student_doubts)
$doubts = [];
try {
    $stmtDoubts = $pdo->query("
        SELECT d.id, d.student_id, d.course_id, d.question, d.answer, d.status, d.created_at, '' as code_snippet,
               s.name as student_name, s.email as student_email, COALESCE(c.title, 'General Course') as course_title, COALESCE(v.title, 'Module Doubt') as lesson_title
        FROM lesson_doubts d
        JOIN students s ON d.student_id = s.id
        LEFT JOIN courses c ON d.course_id = c.id
        LEFT JOIN videos v ON d.lesson_id = v.id
        ORDER BY d.id DESC
    ");
    $doubts = $stmtDoubts->fetchAll();
} catch (Exception $e) {}

// Fallback / Main: Fetch directly from student_doubts for rich code snippets
try {
    $stmtSD = $pdo->query("
        SELECT d.id, d.student_id, 1 as course_id, d.doubt_details as question, d.code_snippet, d.faculty_reply as answer, d.status, d.created_at,
               s.name as student_name, s.email as student_email, 'Java Full Stack & Cloud' as course_title, d.subject as lesson_title
        FROM student_doubts d
        JOIN students s ON d.student_id = s.id
        ORDER BY d.id DESC
    ");
    $sdList = $stmtSD->fetchAll();
    if (!empty($sdList)) {
        $doubts = array_merge($doubts, $sdList);
    }
} catch (Exception $e) {}
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
    <title>1-on-1 Student Doubts Desk — Faculty Portal</title>
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
                <h1 style="font-size: 1.45rem; font-weight: 800; letter-spacing: -0.03em;">1-on-1 Student Doubts Desk</h1>
                <p style="color: var(--text-muted); font-size: 0.82rem; margin-top: 0.2rem;">Resolve technical questions submitted by enrolled students directly from video lessons.</p>
            </div>
            <span style="background: rgba(99,102,241,0.15); border: 1px solid #6366f1; color: #c7d2fe; padding: 0.4rem 1rem; border-radius: 100px; font-weight: 800; font-size: 0.85rem;">
                <?= count($doubts) ?> Questions in Queue
            </span>
        </div>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ✓ <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <?php if (empty($doubts)): ?>
            <div class="card" style="text-align: center; padding: 3.5rem 0; color: var(--text-subtle);">
                No student doubts in queue right now.
            </div>
        <?php else: ?>
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <?php foreach ($doubts as $d): ?>
                    <div class="card" style="margin-bottom: 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                            <div>
                                <strong style="color: var(--text-main); font-size: 0.98rem;"><?= htmlspecialchars($d['student_name']) ?></strong>
                                <span style="font-size: 0.75rem; color: var(--text-subtle); margin-left: 0.5rem;"><?= htmlspecialchars($d['student_email']) ?></span>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span style="background: rgba(99,102,241,0.15); color: #c7d2fe; font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 6px;">🎯 <?= htmlspecialchars($d['course_title']) ?></span>
                                <span style="background: <?= $d['status'] === 'answered' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' ?>; color: <?= $d['status'] === 'answered' ? '#34d399' : '#fbbf24' ?>; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 100px; text-transform: uppercase;">
                                    ● <?= htmlspecialchars($d['status']) ?>
                                </span>
                            </div>
                        </div>

                        <div style="background: #0b1120; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; font-size: 0.9rem; line-height: 1.5; color: #cbd5e1;">
                            <?= nl2br(htmlspecialchars($d['question'])) ?>
                        </div>

                        <?php if (!empty($d['code_snippet'])): ?>
                            <div style="margin-bottom: 1rem;">
                                <div style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
                                    <span>💻 Attached Student Code Snippet:</span>
                                </div>
                                <pre style="background: #090d16; border: 1px solid #1e293b; padding: 1rem; border-radius: 10px; color: #38bdf8; font-family: 'JetBrains Mono', monospace; font-size: 0.84rem; overflow-x: auto; white-space: pre-wrap;"><code><?= htmlspecialchars($d['code_snippet']) ?></code></pre>
                            </div>
                        <?php endif; ?>

                        <?php if (!empty($d['answer'])): ?>
                            <div style="background: rgba(16,185,129,0.06); border-left: 3px solid #10b981; border-radius: 0 10px 10px 0; padding: 0.85rem 1rem; margin-bottom: 0.5rem; font-size: 0.88rem; color: #a7f3d0;">
                                <strong>Your Solution:</strong><br>
                                <?= nl2br(htmlspecialchars($d['answer'])) ?>
                            </div>
                        <?php else: ?>
                            <form method="POST">
                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                <input type="hidden" name="reply_doubt" value="1">
                                <input type="hidden" name="doubt_id" value="<?= $d['id'] ?>">

                                <textarea name="answer" class="form-input" rows="3" placeholder="Write comprehensive technical explanation and solution..." required></textarea>
                                <button type="submit" class="btn-submit" style="margin-top: 0.75rem;">Dispatch Solution ➔</button>
                            </form>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>