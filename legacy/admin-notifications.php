<?php
$adminActive = 'notifications';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// 1. Post notification
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["post_notification"])) {
    verify_csrf();
    $title = clean_text($_POST["notif_title"] ?? "", 150);
    $body  = clean_text($_POST["notif_message"] ?? "", 3000);

    if ($title && $body) {
        $stmt = $pdo->prepare("INSERT INTO notifications (title, message) VALUES (?, ?)");
        $stmt->execute([$title, $body]);
        $message = "Announcement published to all students.";
    } else {
        $error = "Please provide both an announcement title (max 150 chars) and message.";
    }
}

// Delete notification
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_notification_id"])) {
    verify_csrf();
    $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ?");
    $stmt->execute([intval($_POST["delete_notification_id"])]);
    header("Location: admin-notifications?msg=deleted");
    exit;
}

$notifications = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC")->fetchAll();
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
    <title>Broadcast Announcements — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container" style="max-width: 900px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Broadcast Announcements</h1>
                <p>Publish site-wide notices, holiday updates, and batch schedules to all enrolled students.</p>
            </div>
        </div>

        <?php if ($message || isset($_GET['msg'])): ?>
            <div class="alert alert-success">
                <span><?php echo e($message ?: 'Announcement updated.'); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Create Announcement Card -->
        <div class="card">
            <div class="card-header">
                <h2>New Broadcast Announcement</h2>
            </div>
            <form method="POST">
                <?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="notif_title">Announcement Title</label>
                    <input type="text" name="notif_title" id="notif_title" placeholder="e.g. Live Q&A Session Scheduled for Friday at 7 PM" required maxlength="150">
                </div>

                <div class="form-group">
                    <label for="notif_message">Announcement Body</label>
                    <textarea name="notif_message" id="notif_message" rows="4" placeholder="Type your announcement details..." required maxlength="3000"></textarea>
                </div>

                <button type="submit" name="post_notification" class="btn btn-primary btn-sm">
                    🚀 Broadcast to Students
                </button>
            </form>
        </div>

        <!-- History of Announcements -->
        <section class="card">
            <div class="card-header">
                <h2>Published Announcements (<?php echo count($notifications); ?>)</h2>
            </div>

            <?php if (empty($notifications)): ?>
                <p style="color: var(--text-muted); padding: 1.5rem 0;">No active announcements.</p>
            <?php else: ?>
                <?php foreach ($notifications as $n): ?>
                <div style="padding: 1.25rem 0; border-bottom: 1px solid var(--border); display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
                    <div>
                        <h4 style="font-size: 1.05rem;"><?php echo e($n["title"]); ?></h4>
                        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-top: 0.35rem; white-space: pre-wrap;"><?php echo e($n["message"]); ?></p>
                        <div class="mono" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
                            Published: <?php echo date('M d, Y - h:i A', strtotime($n["created_at"])); ?>
                        </div>
                    </div>
                    <form method="POST" style="display:inline" onsubmit="return confirm('Delete this announcement?')">
                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
                        <input type="hidden" name="delete_notification_id" value="<?php echo (int)$n['id']; ?>">
                        <button type="submit" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: #fecaca; flex-shrink: 0;">Delete</button>
                    </form>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>


