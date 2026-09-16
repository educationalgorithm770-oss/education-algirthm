<?php
// student-doubts.php — Student 1-on-1 Faculty Doubt Desk
$activePage = 'doubts';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$message = "";
$error = "";

// Ensure student_doubts table exists
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS student_doubts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        instructor_id INT DEFAULT NULL,
        subject VARCHAR(150) NOT NULL,
        doubt_details TEXT NOT NULL,
        code_snippet TEXT DEFAULT NULL,
        status ENUM('open', 'in_review', 'resolved') DEFAULT 'open',
        faculty_reply TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
} catch (Exception $e) {}

// Handle New Doubt Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
    $subject = strip_tags(trim($_POST["subject"] ?? ""));
    $doubt   = strip_tags(trim($_POST["doubt_details"] ?? ""));
    $code    = trim($_POST["code_snippet"] ?? "");

    if (empty($subject)) {
        $error = "Please enter a subject for your doubt.";
    } elseif (empty($doubt)) {
        $error = "Please describe your doubt in detail.";
    } else {
        $fullDoubtText = "Subject: " . $subject . "\n\n" . $doubt;
        if (!empty($code)) {
            $fullDoubtText .= "\n\nCode Snippet:\n" . $code;
        }

        // Insert into student_doubts
        $stmt = $pdo->prepare("
            INSERT INTO student_doubts (student_id, subject, doubt_details, code_snippet, status)
            VALUES (?, ?, ?, ?, 'open')
        ");
        $stmt->execute([$studentId, $subject, $doubt, $code]);
        $studentDoubtId = (int)$pdo->lastInsertId();

        // Also sync to lesson_doubts so instructors see it in their Faculty Desk queue
        try {
            // Find student's active course ID
            $stmtC = $pdo->prepare("SELECT course_id FROM enrollments WHERE student_id = ? OR email = (SELECT email FROM students WHERE id = ? LIMIT 1) LIMIT 1");
            $stmtC->execute([$studentId, $studentId]);
            $courseId = (int)$stmtC->fetchColumn() ?: 1;

            $stmtL = $pdo->prepare("
                INSERT INTO lesson_doubts (student_id, course_id, question, status, created_at)
                VALUES (?, ?, ?, 'unanswered', NOW())
            ");
            $stmtL->execute([$studentId, $courseId, $fullDoubtText]);
        } catch (Exception $e) {}

        $message = "Your doubt has been submitted to the 1-on-1 Faculty Desk! An instructor will respond shortly.";
    }
}

// Fetch student's doubts history
$stmt = $pdo->prepare("
    SELECT d.*, i.name as faculty_name, i.title as faculty_title 
    FROM student_doubts d
    LEFT JOIN instructors i ON d.instructor_id = i.id
    WHERE d.student_id = ?
    ORDER BY d.created_at DESC
");
$stmt->execute([$studentId]);
$doubts = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>1-on-1 Faculty Doubt Desk • Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
    <style>
        .doubt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        @media (max-width: 900px) { .doubt-grid { grid-template-columns: 1fr; } }
        .form-card { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; }
        .form-group { margin-bottom: 1.15rem; }
        .form-label { display: block; font-size: 0.82rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.35rem; }
        .form-input, .form-textarea { width: 100%; padding: 0.75rem 1rem; background: var(--bg-page); border: 1px solid var(--border); border-radius: 10px; color: var(--text-main); font-size: 0.88rem; outline: none; box-sizing: border-box; }
        .form-textarea { min-height: 110px; resize: vertical; }
        .code-textarea { font-family: monospace; font-size: 0.85rem; min-height: 90px; background: #0f172a; color: #38bdf8; border: 1px solid #1e293b; }
        .btn-submit { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; padding: 0.75rem 1.35rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; }
        .doubt-item { background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; }
        .status-pill { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
        .status-open { background: rgba(99, 102, 241, 0.15); color: #6366f1; }
        .status-resolved { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="padding-top: 2rem;">
        <div style="margin-bottom: 2rem;">
            <span style="background: rgba(99, 102, 241, 0.12); color: #6366f1; font-weight: 700; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 999px; text-transform: uppercase;">💬 1-on-1 Live Faculty Desk</span>
            <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-top: 0.5rem;">Ask Doubts 1-on-1 to Mentors</h1>
            <p style="color: var(--text-muted); font-size: 0.95rem;">Submit technical questions, code bugs, or concept doubts directly to assigned faculty instructors.</p>
        </div>

        <?php if (!empty($message)): ?>
            <div class="alert alert-success" style="margin-bottom: 1.5rem; background: #ecfdf5; color: #047857; padding: 1rem; border-radius: 10px;">
                <span>✓ <?php echo $message; ?></span>
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div class="alert alert-error" style="margin-bottom: 1.5rem; background: #fef2f2; color: #b91c1c; padding: 1rem; border-radius: 10px;">
                <span>⚠️ <?php echo htmlspecialchars($error); ?></span>
            </div>
        <?php endif; ?>

        <div class="doubt-grid">
            <!-- LEFT: SUBMIT NEW DOUBT -->
            <div class="form-card">
                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">📝 Submit a New Doubt</h2>
                <form method="POST">
                    <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
                    <div class="form-group">
                        <label class="form-label">Doubt Title / Subject</label>
                        <input type="text" name="subject" class="form-input" placeholder="e.g. NullPointerException in Spring Boot Controller" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Detailed Doubt Description</label>
                        <textarea name="doubt_details" class="form-textarea" placeholder="Describe what you are trying to solve and where you get stuck..." required></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Code Snippet (Optional)</label>
                        <textarea name="code_snippet" class="form-textarea code-textarea" placeholder="// Paste your Java / Python / C++ code here..."></textarea>
                    </div>

                    <button type="submit" class="btn-submit">Submit Doubt to Faculty Desk ➔</button>
                </form>
            </div>

            <!-- RIGHT: MY SUBMITTED DOUBTS -->
            <div>
                <h2 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">💬 My 1-on-1 Doubts History (<?php echo count($doubts); ?>)</h2>
                
                <?php if (empty($doubts)): ?>
                    <div style="background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px; padding: 2rem; text-align: center; color: var(--text-muted);">
                        You have not submitted any 1-on-1 doubts yet. Use the form on the left to ask your first question!
                    </div>
                <?php else: ?>
                    <?php foreach ($doubts as $d): 
                        $isResolved = ($d['status'] === 'resolved');
                    ?>
                    <div class="doubt-item">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <strong style="font-size: 0.95rem; color: var(--text-main);"><?php echo htmlspecialchars($d['subject']); ?></strong>
                            <span class="status-pill <?php echo $isResolved ? 'status-resolved' : 'status-open'; ?>">
                                <?php echo $isResolved ? '✓ Resolved' : '● Open'; ?>
                            </span>
                        </div>

                        <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.75rem; white-space: pre-wrap;"><?php echo htmlspecialchars($d['doubt_details']); ?></p>

                        <?php if (!empty($d['code_snippet'])): ?>
                            <pre style="background: #0f172a; color: #38bdf8; padding: 0.75rem; border-radius: 8px; font-size: 0.78rem; overflow-x: auto; margin-bottom: 0.75rem;"><code><?php echo htmlspecialchars($d['code_snippet']); ?></code></pre>
                        <?php endif; ?>

                        <?php if (!empty($d['faculty_reply'])): ?>
                            <div style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; margin-top: 0.75rem;">
                                <div style="font-size: 0.78rem; font-weight: 700; color: #6366f1;">👨‍🏫 Faculty Reply (<?php echo htmlspecialchars($d['faculty_name'] ?: 'Lead Instructor'); ?>):</div>
                                <div style="font-size: 0.85rem; color: var(--text-main); margin-top: 0.25rem; line-height: 1.4;"><?php echo htmlspecialchars($d['faculty_reply']); ?></div>
                            </div>
                        <?php endif; ?>

                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.75rem; text-align: right;">
                            Submitted <?php echo date('M d, Y h:i A', strtotime($d['created_at'])); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
    </main>
</body>
</html>
