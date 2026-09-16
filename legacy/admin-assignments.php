<?php
$adminActive = 'assignments';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// 1. Create Assignment
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_assignment"])) {
    verify_csrf();
    $moduleId     = validate_integer_range($_POST["assignment_module_id"] ?? 0, 1, 100000, 0);
    $title        = clean_text($_POST["assignment_title"] ?? "", 150);
    $instructions = clean_text($_POST["assignment_instructions"] ?? "", 5000);
    $dueDate      = !empty($_POST["assignment_due_date"]) ? $_POST["assignment_due_date"] : null;

    if ($dueDate && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dueDate)) {
        $dueDate = null;
    }

    if ($title && $moduleId > 0 && $instructions) {
        $stmt = $pdo->prepare("INSERT INTO assignments (module_id, title, instructions, due_date) VALUES (?, ?, ?, ?)");
        $stmt->execute([$moduleId, $title, $instructions, $dueDate]);
        $message = "Assignment created successfully.";
    } else {
        $error = "Module, valid title (max 150 chars), and instructions are required.";
    }
}

// 2. Review Submission
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["review_submission"])) {
    verify_csrf();
    $subId    = validate_integer_range($_POST["submission_id"] ?? 0, 1, 100000, 0);
    $status   = $_POST["status"] ?? "approved";
    $marksRaw = $_POST["marks"] ?? "";
    $marks    = ($marksRaw !== '') ? validate_integer_range($marksRaw, 0, 100, null) : null;
    $feedback = clean_text($_POST["feedback"] ?? "", 1000);

    $allowedStatuses = ['approved', 'rejected', 'submitted'];
    if (!in_array($status, $allowedStatuses, true)) {
        $status = 'approved';
    }

    if ($subId > 0) {
        $stmt = $pdo->prepare("UPDATE assignment_submissions SET status = ?, marks = ?, feedback = ?, reviewed_at = NOW() WHERE id = ?");
        $stmt->execute([$status, $marks, $feedback, $subId]);
        $message = "Submission review saved.";
    }
}

$modules = $pdo->query("SELECT * FROM modules ORDER BY sort_order ASC")->fetchAll();
$assignments = $pdo->query("SELECT a.*, m.title as module_title FROM assignments a JOIN modules m ON a.module_id = m.id ORDER BY a.created_at DESC")->fetchAll();

// Submissions queue
$submissions = $pdo->query("
    SELECT s.*, a.title as assignment_title, st.name as student_name, st.email as student_email 
    FROM assignment_submissions s 
    JOIN assignments a ON s.assignment_id = a.id 
    JOIN students st ON s.student_id = st.id 
    ORDER BY s.submitted_at DESC
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
    <title>Assignment Management & Grading — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Assignment Grading & Review Desk</h1>
                <p>Create module coursework and evaluate student submissions.</p>
            </div>
        </div>

        <?php if ($message || isset($_GET['msg'])): ?>
            <div class="alert alert-success">
                <span><?php echo e($message ?: 'Action completed.'); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Create Assignment Card -->
        <div class="card">
            <div class="card-header">
                <h2>Create New Assignment</h2>
            </div>
            <form method="POST">
                <?php echo csrf_field(); ?>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label>Assign to Module</label>
                        <select name="assignment_module_id" required>
                            <option value="">Select Module</option>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Assignment Title</label>
                        <input type="text" name="assignment_title" placeholder="e.g. Build a Responsive Portfolio Site" required maxlength="150">
                    </div>
                </div>

                <div class="form-group">
                    <label>Instructions & Rubric</label>
                    <textarea name="assignment_instructions" rows="4" placeholder="Detail the requirements, deliverables, and guidelines..." required maxlength="5000"></textarea>
                </div>

                <div class="form-group" style="max-width: 250px;">
                    <label>Due Date (Optional)</label>
                    <input type="date" name="assignment_due_date">
                </div>

                <button type="submit" name="add_assignment" class="btn btn-primary btn-sm">Publish Assignment</button>
            </form>
        </div>

        <!-- Student Submissions Review Queue -->
        <section class="card">
            <div class="card-header">
                <h2>Student Submission Review Queue (<?php echo count($submissions); ?>)</h2>
            </div>

            <?php if (empty($submissions)): ?>
                <p style="color: var(--text-muted); padding: 1.5rem 0;">No student submissions have been turned in yet.</p>
            <?php else: ?>
                <?php foreach ($submissions as $s): 
                    $isPending = ($s['status'] === 'submitted');
                ?>
                <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.35rem; margin-bottom: 1.25rem; background: <?php echo $isPending ? '#fffbeb' : 'var(--bg-surface)'; ?>;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div>
                            <span class="badge neutral"><?php echo e($s['assignment_title']); ?></span>
                            <h3 style="font-size: 1.1rem; margin-top: 0.25rem;"><?php echo e($s['student_name']); ?> (<?php echo e($s['student_email']); ?>)</h3>
                            <div class="mono" style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.15rem;">
                                Submitted: <?php echo date('M d, Y - h:i A', strtotime($s['submitted_at'])); ?>
                            </div>
                        </div>
                        <span class="badge <?php echo $s['status'] === 'approved' ? 'approved' : ($s['status'] === 'rejected' ? 'rejected' : 'submitted'); ?>">
                            <?php echo strtoupper($s['status']); ?>
                        </span>
                    </div>

                    <?php if (!empty($s['submission_text'])): ?>
                        <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.9rem; margin-bottom: 0.75rem; white-space: pre-wrap;">
                            <strong>Student Submission Notes:</strong><br><?php echo e($s['submission_text']); ?>
                        </div>
                    <?php endif; ?>

                    <?php if (!empty($s['file_path'])): ?>
                        <div style="margin-bottom: 0.75rem;">
                            <a href="<?php echo e($s['file_path']); ?>" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                                📁 Download Uploaded Project File
                            </a>
                        </div>
                    <?php endif; ?>

                    <!-- Review / Grading Form -->
                    <form method="POST" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="submission_id" value="<?php echo $s['id']; ?>">

                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Decision</label>
                                <select name="status">
                                    <option value="approved" <?php echo $s['status'] === 'approved' ? 'selected' : ''; ?>>Approve & Pass</option>
                                    <option value="rejected" <?php echo $s['status'] === 'rejected' ? 'selected' : ''; ?>>Needs Revisions (Reject)</option>
                                    <option value="submitted" <?php echo $s['status'] === 'submitted' ? 'selected' : ''; ?>>Keep Under Review</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label>Marks / Score (0-100)</label>
                                <input type="number" name="marks" value="<?php echo $s['marks']; ?>" placeholder="e.g. 95">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Instructor Feedback to Student</label>
                            <input type="text" name="feedback" value="<?php echo e($s['feedback'] ?? ''); ?>" placeholder="Great work! The responsive grid layout is clean.">
                        </div>

                        <button type="submit" name="review_submission" class="btn btn-primary btn-sm">Save Grade & Send Feedback</button>
                    </form>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>

