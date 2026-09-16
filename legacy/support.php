<?php
$activePage = 'support';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$message = "";
$error = "";

$prefillSubject = trim($_GET['subject'] ?? '');
$prefillMsg = trim($_GET['context'] ?? '');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    verify_csrf();
    $subject = strip_tags(trim($_POST["subject"] ?? ""));
    $msg     = strip_tags(trim($_POST["message"] ?? ""));

    if (empty($subject)) {
        $error = "Please provide a ticket subject.";
    } elseif (mb_strlen($subject) > 150) {
        $error = "Subject is too long (max 150 characters).";
    } elseif (empty($msg)) {
        $error = "Please provide a message description.";
    } elseif (mb_strlen($msg) > 3000) {
        $error = "Message is too long (max 3000 characters).";
    } else {
        $stmt = $pdo->prepare("
            INSERT INTO support_messages (student_id, subject, message, status) 
            VALUES (?, ?, ?, 'open')
        ");
        $stmt->execute([$studentId, $subject, $msg]);
        $message = "Your support ticket has been submitted. Our instructor team will respond shortly.";
        $prefillSubject = '';
        $prefillMsg = '';
    }
}

$stmt = $pdo->prepare("
    SELECT * FROM support_messages 
    WHERE student_id = ? 
    ORDER BY created_at DESC
");
$stmt->execute([$studentId]);
$tickets = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Help & Support Desk — Education Algorithm</title>
    
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
    <link rel="stylesheet" href="assets/command-palette.css?v=2.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 760px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Faculty Helpdesk & Office Hours</h1>
                <p>Have questions about coursework, code labs, or system setup? Connect directly with your instructors.</p>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Create Support Ticket -->
        <div class="card">
            <div class="card-header">
                <h2>Submit an Inquiry / Question</h2>
            </div>
            <form method="POST">
                <?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="subject">Inquiry Subject</label>
                    <input type="text" name="subject" id="subject" value="<?php echo e($prefillSubject); ?>" placeholder="e.g. Question regarding Module 2 Async JS exercises" required maxlength="150">
                </div>

                <div class="form-group">
                    <label for="message">Detailed Explanation / Code Link</label>
                    <textarea name="message" id="message" rows="4" placeholder="Explain your question or problem in detail..." required maxlength="3000"><?php echo e($prefillMsg); ?></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    <span>Submit to Faculty Desk</span>
                </button>
            </form>
        </div>

        <!-- Ticket History -->
        <div class="card">
            <div class="card-header">
                <h2>Your Support Tickets</h2>
                <span class="mono" style="color: var(--text-muted);"><?php echo count($tickets); ?> Total</span>
            </div>

            <?php if (empty($tickets)): ?>
                <div style="text-align: center; padding: 2.5rem 1rem;">
                    <p style="color: var(--text-muted);">You have no open or past support tickets.</p>
                </div>
            <?php else: ?>
                <?php foreach ($tickets as $t): 
                    $isResolved = ($t['status'] === 'resolved');
                ?>
                <div style="padding: 1rem 0; border-bottom: 1px solid var(--border); min-width: 0; max-width: 100%;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.65rem; margin-bottom: 0.45rem;">
                        <div style="flex: 1; min-width: 0;">
                            <h4 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); overflow-wrap: anywhere; word-break: break-word;"><?php echo e($t["subject"]); ?></h4>
                            <div class="mono" style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">
                                Submitted on <?php echo date('M d, Y • h:i A', strtotime($t["created_at"])); ?>
                            </div>
                        </div>
                        <span class="badge <?php echo $isResolved ? 'approved' : 'open'; ?>" style="flex-shrink: 0; font-size: 0.72rem;">
                            <?php echo $isResolved ? 'Resolved' : 'Open Ticket'; ?>
                        </span>
                    </div>

                    <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; background: var(--bg-subtle); padding: 0.75rem 0.95rem; border-radius: var(--radius-sm); border: 1px solid var(--border); margin: 0.65rem 0;">
                        <?php echo e($t["message"]); ?>
                    </div>

                    <?php if (!empty($t["admin_reply"])): ?>
                    <div style="margin-top: 0.75rem; background: var(--primary-light, rgba(99, 102, 241, 0.15)); border-left: 3px solid var(--primary); border-radius: var(--radius-sm); padding: 0.85rem 1rem; overflow-wrap: anywhere; word-break: break-word;">
                        <div style="font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.25rem;">
                            Response from Faculty / Mentor Team
                        </div>
                        <div style="font-size: 0.86rem; color: var(--text-primary); line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;"><?php echo e($t["admin_reply"]); ?></div>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
