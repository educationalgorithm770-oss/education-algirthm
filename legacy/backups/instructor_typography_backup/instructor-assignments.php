<?php
$facultyActive = 'assignments';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);
$courseIds = array_map(function($c) { return (int)$c['id']; }, $assignedCourses);
$courseInSql = !empty($courseIds) ? implode(',', $courseIds) : '0';

$message = "";

if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["grade_submission"])) {
    verify_csrf();
    $subId = (int)$_POST["submission_id"];
    $marks = (int)($_POST["marks"] ?? 100);
    $feedback = clean_text($_POST["feedback"] ?? "", 2000);

    $stmtSub = $pdo->prepare("
        SELECT m.course_id FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        JOIN modules m ON a.module_id = m.id
        WHERE s.id = ?
    ");
    $stmtSub->execute([$subId]);
    $targetCourseId = (int)$stmtSub->fetchColumn();

    enforce_instructor_course_scope($instId, $targetCourseId);

    $stmtUp = $pdo->prepare("UPDATE assignment_submissions SET marks = ?, feedback = ?, status = 'reviewed', reviewed_at = NOW() WHERE id = ?");
    $stmtUp->execute([$marks, $feedback, $subId]);

    log_instructor_audit($instId, 'ASSIGNMENT_GRADED', $targetCourseId, "Graded submission ID #{$subId} with {$marks} marks");
    $message = "Assignment graded and student notified successfully!";
}

$stmtSubs = $pdo->query("
    SELECT s.*, a.title as assignment_title, st.name as student_name, st.email as student_email, c.title as course_title
    FROM assignment_submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN modules m ON a.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    JOIN students st ON s.student_id = st.id
    WHERE c.id IN ({$courseInSql})
    ORDER BY s.id DESC
");
$submissions = $stmtSubs->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assignment Reviews & Code Grader — Faculty Portal</title>
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
                <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.03em;">Student Assignment Reviews & Code Grader</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem; margin-top: 0.25rem;">Inspect GitHub repositories and project deliverables submitted by your enrolled students.</p>
            </div>
            <span style="background: rgba(99,102,241,0.15); border: 1px solid #6366f1; color: #c7d2fe; padding: 0.4rem 1rem; border-radius: 100px; font-weight: 800; font-size: 0.85rem;">
                <?= count($submissions) ?> Submissions in Queue
            </span>
        </div>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                ✓ <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <div class="card">
            <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">Submitted Projects & Code Reviews</h3>
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Assignment Title</th>
                            <th>Course Track</th>
                            <th>Submission Deliverable</th>
                            <th>Grade Status</th>
                            <th>Review Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($submissions)): ?>
                            <tr><td colspan="6" style="text-align: center; color: var(--text-subtle); padding: 3rem 0;">No student assignment submissions in your track yet.</td></tr>
                        <?php else: ?>
                            <?php foreach ($submissions as $sub): ?>
                                <tr>
                                    <td>
                                        <strong style="color: var(--text-main);"><?= htmlspecialchars($sub['student_name']) ?></strong><br>
                                        <span style="font-size: 0.75rem; color: var(--text-subtle);"><?= htmlspecialchars($sub['student_email']) ?></span>
                                    </td>
                                    <td><?= htmlspecialchars($sub['assignment_title']) ?></td>
                                    <td><span style="background: rgba(99,102,241,0.15); color: #c7d2fe; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700;"><?= htmlspecialchars($sub['course_title']) ?></span></td>
                                    <td>
                                        <?php if (!empty($sub['file_path'])): ?>
                                            <a href="download-submission.php?id=<?= (int)$sub['id'] ?>" target="_blank" style="color: #38bdf8; text-decoration: none; font-weight: 700;">📂 Download Deliverable ↗</a>
                                        <?php elseif (!empty($sub['submission_text'])): ?>
                                            <span style="font-size: 0.82rem; color: #cbd5e1;"><?= htmlspecialchars(substr($sub['submission_text'], 0, 45)) ?>...</span>
                                        <?php else: ?>
                                            <span style="color: var(--text-subtle);">Direct Text Submission</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if ($sub['status'] === 'reviewed'): ?>
                                            <span style="background: rgba(16,185,129,0.15); color: #34d399; padding: 0.25rem 0.6rem; border-radius: 100px; font-weight: 800; font-size: 0.75rem;">✓ <?= htmlspecialchars($sub['marks'] ?? 100) ?> / 100</span>
                                        <?php else: ?>
                                            <span style="background: rgba(245,158,11,0.15); color: #fbbf24; padding: 0.25rem 0.6rem; border-radius: 100px; font-weight: 800; font-size: 0.75rem;">● PENDING REVIEW</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <form method="POST" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                                            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                            <input type="hidden" name="grade_submission" value="1">
                                            <input type="hidden" name="submission_id" value="<?= $sub['id'] ?>">

                                            <input type="number" name="marks" class="form-input" placeholder="Marks" value="<?= htmlspecialchars($sub['marks'] ?? '90') ?>" min="0" max="100" style="width: 80px; padding: 0.4rem 0.6rem; font-size: 0.78rem;">

                                            <input type="text" name="feedback" class="form-input" placeholder="Feedback notes..." value="<?= htmlspecialchars($sub['feedback'] ?? '') ?>" style="width: 180px; padding: 0.4rem 0.6rem; font-size: 0.78rem;">

                                            <button type="submit" class="btn-submit" style="padding: 0.4rem 0.8rem; font-size: 0.78rem;">Save</button>
                                        </form>
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