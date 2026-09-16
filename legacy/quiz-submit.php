<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/gamification.php";

$studentId = requireStudent();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    verify_csrf();
}

$quizId = (int)($_POST["quiz_id"] ?? 0);

$quizStmt = $pdo->prepare("
    SELECT q.*, m.course_id 
    FROM quizzes q
    JOIN modules m ON q.module_id = m.id
    WHERE q.id = ?
");
$quizStmt->execute([$quizId]);
$quiz = $quizStmt->fetch();

if (!$quiz) {
    header("Location: dashboard");
    exit;
}

requireCourseAccess($studentId, $quiz['course_id']);

// Issue 5: Server-side quiz timing enforcement
$timeLimitMinutes = (int)($quiz["time_limit_minutes"] ?? 0);
$timeExceeded = false;

if ($timeLimitMinutes > 0) {
    $attemptKey = 'quiz_attempt_' . $quizId;
    if (!isset($_SESSION[$attemptKey]['start_time'])) {
        http_response_code(400);
        exit('Timed assessment must be started from the quiz page. Please restart the quiz.');
    }
    $attemptMeta = $_SESSION[$attemptKey];
    $elapsedSeconds = time() - (int)$attemptMeta['start_time'];
    $allowedSeconds = ($timeLimitMinutes * 60) + 60; // 60s network latency grace period
    if ($elapsedSeconds > $allowedSeconds) {
        $timeExceeded = true;
    }
    unset($_SESSION[$attemptKey]);
}

$stmt = $pdo->prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC");
$stmt->execute([$quizId]);
$questions = $stmt->fetchAll();

$score = 0;
$results = [];

foreach ($questions as $q) {
    $submitted = strtoupper(trim($_POST["q" . $q["id"]] ?? ""));
    $correct = ($submitted === strtoupper(trim($q["correct_option"])));
    if ($correct) $score++;
    $results[] = [
        "question" => $q["question"],
        "submitted" => $submitted,
        "correct" => $q["correct_option"],
        "is_correct" => $correct,
        "option_a" => $q["option_a"],
        "option_b" => $q["option_b"],
        "option_c" => $q["option_c"],
        "option_d" => $q["option_d"]
    ];
}

$total = count($questions);
$percent = $total > 0 ? round(($score / $total) * 100) : 0;
$passPercent = (int)($quiz["pass_percent"] ?? 50);
$passed = $percent >= $passPercent && !$timeExceeded;

// Record attempt
$insert = $pdo->prepare("
    INSERT INTO quiz_attempts (student_id, quiz_id, score, total_questions, passed) 
    VALUES (?, ?, ?, ?, ?)
");
$insert->execute([$studentId, $quizId, $score, $total, $passed ? 1 : 0]);

// Record activity and award XP if passed
recordStudentActivity($pdo, $studentId);

// Fetch recent attempts history
$histStmt = $pdo->prepare("
    SELECT * FROM quiz_attempts 
    WHERE student_id = ? AND quiz_id = ? 
    ORDER BY submitted_at DESC 
    LIMIT 10
");
$histStmt->execute([$studentId, $quizId]);
$history = $histStmt->fetchAll();
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
    <title>Quiz Assessment Results — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
    <link rel="stylesheet" href="assets/command-palette.css?v=2.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 780px;">
        <!-- Score Card -->
        <div class="card" style="text-align: center; padding: 2.25rem 1.5rem;">
            <div style="width: 72px; height: 72px; border-radius: 50%; background: <?php echo $passed ? 'var(--success-light)' : 'var(--danger-light)'; ?>; color: <?php echo $passed ? 'var(--success-text)' : 'var(--danger-text)'; ?>; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 2rem;">
                <?php echo $passed ? '✓' : '✕'; ?>
            </div>

            <h1 style="font-size: 2rem; margin-bottom: 0.25rem; font-weight: 800;"><?php echo $score; ?> / <?php echo $total; ?></h1>
            <p style="font-size: 1rem; font-weight: 600; color: var(--text-secondary);">
                Score: <strong><?php echo $percent; ?>%</strong> (Passing requirement: <?php echo $passPercent; ?>%)
            </p>

            <div style="margin-top: 0.85rem; display: flex; justify-content: center; gap: 0.5rem; flex-wrap: wrap;">
                <span class="badge <?php echo $passed ? 'approved' : 'rejected'; ?>" style="font-size: 0.84rem; padding: 0.35rem 0.85rem;">
                    <?php echo $passed ? 'Assessment Passed (Recorded in Gradebook)' : 'Assessment Incomplete — Retake Required'; ?>
                </span>
            </div>

            <div style="margin-top: 1.25rem; display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap;">
                <a href="quiz?id=<?php echo $quizId; ?>" class="btn btn-secondary btn-sm">
                    Retake Quiz ↺
                </a>
                <a href="dashboard" class="btn btn-primary btn-sm">
                    Back to Curriculum Studio →
                </a>
            </div>
        </div>

        <!-- Attempt History -->
        <?php if (count($history) > 1): ?>
        <div class="card">
            <div class="card-header">
                <h2>Your Attempt History</h2>
            </div>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Submission Date</th>
                            <th>Score</th>
                            <th>Percentage</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($history as $h): 
                            $hPercent = $h['total_questions'] > 0 ? round(($h['score'] / $h['total_questions']) * 100) : 0;
                        ?>
                        <tr>
                            <td><?php echo date('M d, Y - h:i A', strtotime($h['submitted_at'])); ?></td>
                            <td><strong><?php echo $h['score']; ?> / <?php echo $h['total_questions']; ?></strong></td>
                            <td><?php echo $hPercent; ?>%</td>
                            <td>
                                <span class="badge <?php echo $h['passed'] ? 'approved' : 'rejected'; ?>">
                                    <?php echo $h['passed'] ? 'Passed' : 'Failed'; ?>
                                </span>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
        <?php endif; ?>

        <!-- Detailed Breakdown -->
        <div class="card">
            <div class="card-header">
                <h2>Review Answers</h2>
            </div>

            <?php foreach ($results as $index => $r): ?>
            <div style="padding: 1.25rem 0; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">Question <?php echo $index + 1; ?></span>
                    <span class="badge <?php echo $r['is_correct'] ? 'approved' : 'rejected'; ?>">
                        <?php echo $r['is_correct'] ? 'Correct' : 'Incorrect'; ?>
                    </span>
                </div>
                <p style="font-weight: 600; font-size: 0.95rem; margin-bottom: 0.5rem;"><?php echo e($r['question']); ?></p>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    <span>Your Choice: <strong><?php echo e($r['submitted'] ?: 'None'); ?></strong></span>
                    <?php if (!$r['is_correct']): ?>
                        <span style="margin-left: 1.5rem; color: var(--success-text);">Correct Answer: <strong>Option <?php echo e($r['correct']); ?></strong></span>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </main>

    <?php if ($passed): ?>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            confetti({
                particleCount: 90,
                spread: 80,
                origin: { y: 0.55 }
            });
        });
    </script>
    <?php endif; ?>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>


