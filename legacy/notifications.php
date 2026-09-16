<?php
$activePage = 'notifications';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();

// Handle Mark All As Read
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['mark_all_read'])) {
    verify_csrf();
    try {
        $allNotifs = $pdo->query("SELECT id FROM notifications")->fetchAll();
        $stmtMark = $pdo->prepare("
            INSERT INTO student_notifications (notification_id, student_id, is_read, read_at)
            VALUES (?, ?, 1, NOW())
            ON DUPLICATE KEY UPDATE is_read = 1, read_at = NOW()
        ");
        foreach ($allNotifs as $n) {
            $stmtMark->execute([$n['id'], $studentId]);
        }
    } catch (Exception $e) {}
    header("Location: notifications?msg=marked_read");
    exit;
}

// Fetch notifications with student read status (with fallback)
$notifications = [];
try {
    $stmt = $pdo->prepare("
        SELECT n.*, sn.is_read, sn.read_at
        FROM notifications n
        LEFT JOIN student_notifications sn ON n.id = sn.notification_id AND sn.student_id = ?
        ORDER BY n.created_at DESC
    ");
    $stmt->execute([$studentId]);
    $notifications = $stmt->fetchAll();
} catch (Exception $e) {
    try {
        $stmt = $pdo->query("SELECT * FROM notifications ORDER BY created_at DESC");
        $notifications = $stmt->fetchAll();
    } catch (Exception $e2) {}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notifications & Announcements — Education Algorithm</title>
    
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
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 760px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Announcements & Alerts</h1>
                <p>Stay informed with updates, assignment releases, and batch schedules.</p>
            </div>

            <?php if (!empty($notifications)): ?>
            <form method="POST">
                <?php echo csrf_field(); ?>
                <button type="submit" name="mark_all_read" value="1" class="btn btn-secondary btn-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Mark all as read</span>
                </button>
            </form>
            <?php endif; ?>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <?php if (empty($notifications)): ?>
                <div style="text-align: center; padding: 3rem 1.5rem;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔔</div>
                    <h3 style="font-size: 1.1rem; font-weight: 700;">No notifications yet</h3>
                    <p style="margin-top: 0.25rem; font-size: 0.84rem; color: #64748b;">You're all caught up on class updates and announcements.</p>
                </div>
            <?php else: ?>
                <?php foreach ($notifications as $n): 
                    $isUnread = empty($n['is_read']);
                ?>
                <div style="padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); background: <?php echo $isUnread ? 'rgba(99, 102, 241, 0.04)' : 'transparent'; ?>; display: flex; gap: 0.85rem; align-items: flex-start;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: <?php echo $isUnread ? 'var(--primary)' : 'transparent'; ?>; margin-top: 0.45rem; flex-shrink: 0; <?php echo $isUnread ? 'box-shadow: 0 0 6px rgba(99, 102, 241, 0.6);' : ''; ?>"></div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.25rem;">
                            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);"><?php echo e($n["title"]); ?></h4>
                            <span class="mono" style="font-size: 0.72rem; color: var(--text-muted);">
                                <?php echo date('M d, Y • h:i A', strtotime($n["created_at"])); ?>
                            </span>
                        </div>
                        <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; margin: 0;"><?php echo nl2br(e($n["message"])); ?></p>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>

