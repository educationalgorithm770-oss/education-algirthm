<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$assignmentId = (int)($_GET["id"] ?? 0);

$stmt = $pdo->prepare("
    SELECT a.*, m.title as module_title, m.course_id, c.title as course_title
    FROM assignments a 
    JOIN modules m ON a.module_id = m.id 
    JOIN courses c ON m.course_id = c.id
    WHERE a.id = ?
");
$stmt->execute([$assignmentId]);
$assignment = $stmt->fetch();

if (!$assignment) {
    header("Location: dashboard");
    exit;
}

requireCourseAccess($studentId, $assignment['course_id']);

$message = "";
$error = "";

// Handle submission
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    verify_csrf();
    $text     = strip_tags(trim($_POST["submission_text"] ?? ""));
    $filePath = null;

    // 1. Length cap on text field
    if (mb_strlen($text) > 5000) {
        $error = "Text submission is too long (max 5000 characters).";
    }

    // 2. File upload validation (independent of text check)
    if (empty($error) && isset($_FILES["submission_file"]) && $_FILES["submission_file"]["error"] === UPLOAD_ERR_OK) {
        $allowedExts = ['pdf', 'zip', 'docx', 'png', 'jpg', 'jpeg', 'txt'];
        $origName = $_FILES["submission_file"]["name"];
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $fileSize = $_FILES["submission_file"]["size"];

        $mime = mime_content_type($_FILES["submission_file"]["tmp_name"]);
        $disallowedMimes = ['text/html', 'text/javascript', 'application/x-javascript', 'application/javascript', 'application/x-php', 'text/x-php', 'application/x-httpd-php'];

        if (!in_array($ext, $allowedExts)) {
            $error = "Disallowed file type. Allowed formats: " . implode(', ', $allowedExts);
        } elseif (in_array($mime, $disallowedMimes) || str_contains($mime, 'php') || str_contains($mime, 'cgi') || str_contains($mime, 'perl') || str_contains($mime, 'sh') || str_contains($mime, 'html') || str_contains($mime, 'javascript')) {
            $error = "Security check failed. Executable or web-script files are not allowed.";
        } elseif ($fileSize > 25 * 1024 * 1024) { // 25MB max
            $error = "File size exceeds the 25MB limit.";
        } else {
            $uploadDir = "uploads/submissions/";
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $safeName = "sub_" . time() . "_" . bin2hex(random_bytes(6)) . "." . $ext;
            $destination = $uploadDir . $safeName;
            if (move_uploaded_file($_FILES["submission_file"]["tmp_name"], $destination)) {
                $filePath = $destination;
            } else {
                $error = "Could not save uploaded file. Please try again.";
            }
        }
    }

    // 3. Final save
    if (empty($error)) {
        if ($text || $filePath) {
            $stmt = $pdo->prepare("
                INSERT INTO assignment_submissions (assignment_id, student_id, submission_text, file_path, status) 
                VALUES (?, ?, ?, ?, 'submitted')
            ");
            $stmt->execute([$assignmentId, $studentId, $text, $filePath]);
            $message = "Assignment submitted successfully! Your instructor will review it shortly.";
        } else {
            $error = "Please provide an explanation/repo link or attach a project file.";
        }
    }
}

// Fetch latest submission
$stmtSub = $pdo->prepare("
    SELECT * FROM assignment_submissions 
    WHERE assignment_id = ? AND student_id = ? 
    ORDER BY submitted_at DESC 
    LIMIT 1
");
$stmtSub->execute([$assignmentId, $studentId]);
$submission = $stmtSub->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($assignment["title"]); ?> — Assignment Submission</title>
    
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

    <main class="app-container" style="max-width: 780px;">
        <!-- Breadcrumbs -->
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <a href="dashboard">← Dashboard</a>
            <span class="separator">/</span>
            <span><?php echo e($assignment["course_title"]); ?></span>
            <span class="separator">/</span>
            <span style="color: var(--text-primary); font-weight: 500;"><?php echo e($assignment["module_title"]); ?></span>
        </nav>

        <?php if ($message): ?>
            <div class="alert alert-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><?php echo e($message); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Instructions Card -->
        <div class="card">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
                <div>
                    <span class="badge neutral" style="margin-bottom: 0.35rem; font-size: 0.7rem;">Module Assignment</span>
                    <h1 style="font-size: 1.25rem; font-weight: 800;"><?php echo e($assignment["title"]); ?></h1>
                </div>
                <?php if ($assignment["due_date"]): ?>
                    <span class="badge pending" style="font-size: 0.72rem;">
                        Due: <?php echo date('M d, Y', strtotime($assignment["due_date"])); ?>
                    </span>
                <?php endif; ?>
            </div>

            <div style="background: var(--bg-subtle); padding: 1rem 1.15rem; border-radius: var(--radius-md); border: 1px solid var(--border); line-height: 1.6; font-size: 0.88rem; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word; color: var(--text-primary);">
                <?php echo e($assignment["instructions"]); ?>
            </div>
        </div>

        <!-- Submission Status Banner -->
        <?php if ($submission): ?>
        <div class="card" style="border-left: 4px solid <?php echo $submission['status'] === 'approved' ? 'var(--success)' : ($submission['status'] === 'rejected' ? 'var(--danger)' : 'var(--warning)'); ?>;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem;">
                <h3 style="font-size: 1.1rem;">Latest Submission Status</h3>
                <span class="badge <?php echo $submission['status'] === 'approved' ? 'approved' : ($submission['status'] === 'rejected' ? 'rejected' : 'submitted'); ?>">
                    <?php if ($submission['status'] === 'submitted'): ?>⏳ Under Review
                    <?php elseif ($submission['status'] === 'approved'): ?>✓ Approved
                    <?php else: ?>✕ Needs Revisions
                    <?php endif; ?>
                </span>
            </div>

            <p style="font-size: 0.88rem; color: var(--text-muted);">
                Submitted on <strong><?php echo date('M d, Y • h:i A', strtotime($submission['submitted_at'])); ?></strong>
            </p>

            <?php if ($submission['marks'] !== null): ?>
                <div style="margin-top: 0.5rem; font-weight: 700; color: var(--success-text);">
                    Score: <?php echo $submission['marks']; ?> Marks
                </div>
            <?php endif; ?>

            <?php if (!empty($submission['submission_text'])): ?>
                <div style="margin-top: 1rem; padding: 0.85rem; background: var(--bg-subtle); border-radius: var(--radius-sm); font-size: 0.88rem;">
                    <strong>Your Notes/Links:</strong>
                    <p style="margin-top: 0.35rem; white-space: pre-wrap; overflow-wrap: anywhere; word-break: break-word;"><?php echo e($submission['submission_text']); ?></p>
                </div>
            <?php endif; ?>

            <?php if (!empty($submission['file_path'])): ?>
                <div style="margin-top: 0.75rem;">
                    <a href="download-submission.php?id=<?php echo (int)$submission['id']; ?>" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                        📁 View Uploaded File
                    </a>
                </div>
            <?php endif; ?>

            <?php if (!empty($submission['feedback'])): ?>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--warning-light, rgba(245, 158, 11, 0.12)); border: 1px solid var(--warning, #f59e0b); border-radius: var(--radius-md);">
                    <strong style="color: var(--warning-text, #b45309); font-size: 0.9rem;">Instructor Feedback:</strong>
                    <p style="color: var(--text-primary); font-size: 0.88rem; margin-top: 0.35rem;"><?php echo e($submission['feedback']); ?></p>
                </div>
            <?php endif; ?>
        </div>
        <?php endif; ?>

        <!-- Submission Form (if not submitted or needs revisions) -->
        <?php if (!$submission || $submission['status'] === 'rejected'): ?>
        <div class="card">
            <h2 style="font-size: 1.15rem; margin-bottom: 1.25rem;">
                <?php echo $submission ? 'Submit Revisions' : 'Submit Your Project'; ?>
            </h2>

            <form method="POST" enctype="multipart/form-data">
                <?php echo csrf_field(); ?>

                <div class="form-group">
                    <label for="submission_text">Write-up, Notes, or Project Link (GitHub / Hosted URL)</label>
                    <textarea name="submission_text" id="submission_text" rows="5" placeholder="Share your live demo link, GitHub repo, or brief summary of your work..." maxlength="5000"></textarea>
                </div>

                <div class="form-group">
                    <label for="submission_file">Attach Project Archive or Document (ZIP, PDF, DOCX — Max 25MB)</label>
                    <input type="file" name="submission_file" id="submission_file">
                </div>

                <button type="submit" class="btn btn-primary">
                    Submit Project for Review →
                </button>
            </form>
        </div>
        <?php endif; ?>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>


