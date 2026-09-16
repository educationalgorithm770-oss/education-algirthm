<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$noteId = (int)($_GET["id"] ?? 0);

$stmt = $pdo->prepare("
    SELECT n.*, m.title as module_title, m.course_id, c.title as course_title 
    FROM notes n 
    JOIN modules m ON n.module_id = m.id 
    JOIN courses c ON m.course_id = c.id
    WHERE n.id = ?
");
$stmt->execute([$noteId]);
$note = $stmt->fetch();

if (!$note) {
    header("Location: dashboard");
    exit;
}

requireCourseAccess($studentId, $note['course_id']);

$check = $pdo->prepare("SELECT id FROM lesson_completions WHERE student_id = ? AND item_type = 'note' AND item_id = ?");
$check->execute([$studentId, $noteId]);
$isComplete = (bool)$check->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($note["title"]); ?> — Education Algorithm</title>
    
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

    <main class="app-container" style="max-width: 900px;">
        <!-- Breadcrumbs -->
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <a href="dashboard">← Dashboard</a>
            <span class="separator">/</span>
            <span><?php echo e($note["course_title"]); ?></span>
            <span class="separator">/</span>
            <span style="color: var(--text-primary); font-weight: 500;"><?php echo e($note["module_title"]); ?></span>
        </nav>

        <div class="card" style="padding: 1.15rem 1.35rem;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.85rem; margin-bottom: 1.15rem;">
                <div>
                    <span class="badge neutral" style="margin-bottom: 0.35rem; font-size: 0.7rem;">PDF Lecture Notes</span>
                    <h1 style="font-size: 1.25rem; font-weight: 800;"><?php echo e($note["title"]); ?></h1>
                    <p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">Module: <?php echo e($note["module_title"]); ?></p>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <a href="<?php echo e('stream-note.php?id=' . $noteId . '&download=1'); ?>" class="btn btn-secondary btn-sm">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>Download PDF</span>
                    </a>
                    <form method="POST" action="mark-complete" style="margin:0;">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="type" value="note">
                        <input type="hidden" name="id" value="<?php echo $noteId; ?>">
                        <input type="hidden" name="redirect" value="<?php echo e('note-view.php?id=' . $noteId); ?>">
                        <button type="submit" class="btn <?php echo $isComplete ? 'btn-success' : 'btn-primary'; ?> btn-sm">
                            <?php if ($isComplete): ?>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                <span>Completed</span>
                            <?php else: ?>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
                                <span>Mark as Complete</span>
                            <?php endif; ?>
                        </button>
                    </form>
                </div>
            </div>

            <!-- PDF Viewer -->
            <div style="border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; background: #525659; min-height: 650px;">
                <iframe src="<?php echo e('stream-note.php?id=' . $noteId); ?>" width="100%" height="700px" style="border: none;">
                    <p style="padding: 2rem; color: #fff; text-align: center;">
                        Your browser does not support inline PDF viewing. 
                        <a href="<?php echo e('stream-note.php?id=' . $noteId . '&download=1'); ?>" style="color: #93c5fd; text-decoration: underline;">Click here to download the file.</a>
                    </p>
                </iframe>
            </div>
        </div>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>


