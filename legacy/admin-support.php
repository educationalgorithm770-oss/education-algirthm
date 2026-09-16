<?php
$adminActive = 'support';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// Handle Admin Reply & Status
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["reply_ticket"])) {
    verify_csrf();
    $ticketId = intval($_POST["ticket_id"] ?? 0);
    $replyRaw = trim($_POST["admin_reply"] ?? "");
    $reply = strip_tags($replyRaw);
    $status = $_POST["status"] ?? "resolved";

    if ($ticketId && $reply !== "") {
        if (mb_strlen($reply) > 2000) {
            $error = "Reply is too long (max 2000 characters).";
        } else {
            $stmt = $pdo->prepare("UPDATE support_messages SET admin_reply = ?, status = ? WHERE id = ?");
            $stmt->execute([$reply, $status, $ticketId]);
            $message = "Support ticket updated & response sent to student.";
        }
    } else {
        $error = "Please write a response before saving.";
    }
}

// Fetch Tickets
$tickets = $pdo->query("
    SELECT sm.*, st.name as student_name, st.email as student_email 
    FROM support_messages sm 
    JOIN students st ON sm.student_id = st.id 
    ORDER BY sm.created_at DESC
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
    <title>Student Helpdesk & Support — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container" style="max-width: 900px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Student Helpdesk & Support Tickets</h1>
                <p>Reply to student inquiries, technical questions, and coursework assistance tickets.</p>
            </div>
        </div>

        <?php if ($message): ?>
            <div class="alert alert-success">
                <span><?php echo e($message); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <section class="card">
            <div class="card-header">
                <h2>All Inquiries & Tickets (<?php echo count($tickets); ?>)</h2>
            </div>

            <?php if (empty($tickets)): ?>
                <p style="color: var(--text-muted); padding: 2rem 0; text-align: center;">No support messages have been submitted.</p>
            <?php else: ?>
                <?php foreach ($tickets as $t): 
                    $isOpen = ($t['status'] === 'open');
                ?>
                <div class="ticket-item-card <?php echo $isOpen ? 'open' : ''; ?>">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.65rem; margin-bottom: 0.5rem;">
                        <div style="flex: 1; min-width: 0;">
                            <h3 class="ticket-subject-title"><?php echo e($t["subject"]); ?></h3>
                            <div class="ticket-meta-info">
                                From <strong><?php echo e($t['student_name']); ?></strong> (<?php echo e($t['student_email']); ?>) • Submitted <?php echo date('M d, Y • h:i A', strtotime($t['created_at'])); ?>
                            </div>
                        </div>
                        <span class="badge <?php echo $isOpen ? 'open' : 'approved'; ?>" style="flex-shrink: 0; font-size: 0.72rem;">
                            <?php echo $isOpen ? 'Pending Response' : 'Resolved'; ?>
                        </span>
                    </div>

                    <div class="ticket-message-box"><?php echo e($t["message"]); ?></div>

                    <!-- Reply Form -->
                    <form method="POST" style="margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="ticket_id" value="<?php echo $t['id']; ?>">

                        <div class="form-group" style="margin-bottom: 0.75rem;">
                            <label style="font-size: 0.78rem;">Official Response</label>
                            <textarea name="admin_reply" rows="3" placeholder="Type your response to the student..." required maxlength="2000" style="font-size: 0.84rem;"><?php echo e($t['admin_reply'] ?? ''); ?></textarea>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.65rem;">
                            <div style="display: flex; align-items: center; gap: 0.45rem;">
                                <label style="margin-bottom: 0; font-size: 0.8rem; font-weight: 600;">Status:</label>
                                <select name="status" style="width: 130px; margin-bottom: 0; padding: 0.35rem 0.55rem; font-size: 0.82rem;">
                                    <option value="resolved" <?php echo $t['status'] === 'resolved' ? 'selected' : ''; ?>>Resolved</option>
                                    <option value="open" <?php echo $t['status'] === 'open' ? 'selected' : ''; ?>>Keep Open</option>
                                </select>
                            </div>
                            <button type="submit" name="reply_ticket" class="btn btn-primary btn-sm">
                                Save Reply & Notify Student
                            </button>
                        </div>
                    </form>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>
