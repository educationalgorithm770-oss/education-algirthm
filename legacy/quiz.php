<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();
$quizId = (int)($_GET["id"] ?? 0);

$stmt = $pdo->prepare("
    SELECT q.*, m.title as module_title, m.course_id, c.title as course_title 
    FROM quizzes q
    JOIN modules m ON q.module_id = m.id
    JOIN courses c ON m.course_id = c.id
    WHERE q.id = ?
");
$stmt->execute([$quizId]);
$quiz = $stmt->fetch();

if (!$quiz) {
    header("Location: dashboard");
    exit;
}

requireCourseAccess($studentId, $quiz['course_id']);

// Persistent server-side attempt tracking (Survives page refresh)
if (!isset($_SESSION['quiz_attempt_' . $quizId])) {
    $_SESSION['quiz_attempt_' . $quizId] = [
        'start_time' => time(),
        'quiz_id' => $quizId,
        'time_limit_minutes' => (int)($quiz['time_limit_minutes'] ?? 0)
    ];
}

$stmt2 = $pdo->prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC");
$stmt2->execute([$quizId]);
$questions = $stmt2->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($quiz["title"]); ?> — Quiz Assessment</title>
    
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
    <style>
        .quiz-container {
            max-width: 780px;
            margin: 0 auto;
        }

        .sticky-quiz-bar {
            position: sticky;
            top: 70px;
            z-index: 90;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 0.75rem 1.15rem;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: var(--shadow-sm);
        }

        .timer-badge {
            background: #0f172a;
            color: #fff;
            padding: 0.35rem 0.75rem;
            border-radius: var(--radius-md);
            font-family: var(--font-mono);
            font-weight: 700;
            font-size: 0.88rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        .timer-badge.low {
            background: var(--danger);
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        .question-card {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            padding: 1.15rem 1.35rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }

        .q-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.65rem;
        }

        .q-text {
            font-size: 0.98rem;
            font-weight: 700;
            color: var(--text-primary);
            line-height: 1.45;
            margin-bottom: 0.95rem;
        }

        .option-label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.65rem 0.85rem;
            border: 1.5px solid var(--border);
            border-radius: var(--radius-md);
            margin-bottom: 0.5rem;
            cursor: pointer;
            background: var(--bg-surface);
            transition: all 0.15s ease;
        }

        .option-label:hover {
            border-color: var(--primary);
            background: var(--primary-light);
        }

        .option-label input[type="radio"] {
            accent-color: var(--primary);
            width: 16px;
            height: 16px;
            margin-bottom: 0;
            cursor: pointer;
        }

        .option-label span.opt-key {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: var(--bg-subtle);
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 700;
            flex-shrink: 0;
        }

        .option-label span.opt-text {
            font-size: 0.88rem;
            color: var(--text-primary);
            flex: 1;
        }

        @media (max-width: 768px) {
            .sticky-quiz-bar {
                padding: 0.55rem 0.75rem;
                top: 60px;
                margin-bottom: 0.85rem;
            }
            .question-card {
                padding: 0.85rem 0.95rem;
                margin-bottom: 0.75rem;
            }
            .q-text {
                font-size: 0.92rem;
                margin-bottom: 0.75rem;
            }
            .option-label {
                padding: 0.5rem 0.65rem;
                font-size: 0.82rem;
                gap: 0.5rem;
            }
            .option-label span.opt-key {
                width: 20px;
                height: 20px;
                font-size: 0.7rem;
            }
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container">
        <div class="quiz-container">
            <!-- Breadcrumbs -->
            <nav class="breadcrumb-nav" aria-label="Breadcrumb">
                <a href="dashboard">← Dashboard</a>
                <span class="separator">/</span>
                <span><?php echo e($quiz["course_title"]); ?></span>
                <span class="separator">/</span>
                <span style="color: var(--text-primary); font-weight: 500;"><?php echo e($quiz["module_title"]); ?></span>
            </nav>

            <!-- Sticky Assessment Header / Timer -->
            <div class="sticky-quiz-bar">
                <div>
                    <h2 style="font-size: 1.05rem; font-weight: 800;"><?php echo e($quiz["title"]); ?></h2>
                    <span style="font-size: 0.78rem; color: var(--text-muted);">
                        Passing score: <?php echo (int)$quiz['pass_percent']; ?>% • <?php echo count($questions); ?> questions
                    </span>
                </div>

                <?php if ($quiz['time_limit_minutes'] > 0): ?>
                <div class="timer-badge" id="quizTimer">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span id="timerText">--:--</span>
                </div>
                <?php endif; ?>
            </div>

            <?php if (empty($questions)): ?>
                <div class="card" style="text-align: center; padding: 3rem 1rem;">
                    <p>No questions have been configured for this quiz yet.</p>
                    <a href="dashboard" class="btn btn-secondary" style="margin-top: 1rem;">Back to Dashboard</a>
                </div>
            <?php else: ?>
            <form method="POST" action="quiz-submit" id="quizForm" onsubmit="return validateQuizSubmission()">
                <?php echo csrf_field(); ?>
                <input type="hidden" name="quiz_id" value="<?php echo $quiz['id']; ?>">

                <?php foreach ($questions as $i => $q): 
                    $qDiff = $q['difficulty'] ?? 'Medium';
                    $diffStyle = 'background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3);';
                    if ($qDiff === 'Easy') {
                        $diffStyle = 'background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3);';
                    } elseif ($qDiff === 'Hard') {
                        $diffStyle = 'background: rgba(244,63,94,0.15); color: #f43f5e; border: 1px solid rgba(244,63,94,0.3);';
                    }
                ?>
                <div class="question-card" id="q_card_<?php echo $q['id']; ?>">
                    <div class="q-header" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                        <span class="badge neutral">Question <?php echo $i + 1; ?> of <?php echo count($questions); ?></span>
                        <span style="<?php echo $diffStyle; ?> font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 6px; text-transform: uppercase;">
                            Difficulty: <?php echo e($qDiff); ?>
                        </span>
                    </div>
                    <p class="q-text"><?php echo e($q["question"]); ?></p>

                    <?php 
                    $options = ["A" => $q["option_a"], "B" => $q["option_b"], "C" => $q["option_c"], "D" => $q["option_d"]];
                    foreach ($options as $key => $val): 
                        if (empty($val)) continue;
                    ?>
                    <label class="option-label" for="q<?php echo $q['id']; ?>_<?php echo $key; ?>">
                        <input type="radio" name="q<?php echo $q['id']; ?>" id="q<?php echo $q['id']; ?>_<?php echo $key; ?>" value="<?php echo $key; ?>" required>
                        <span class="opt-key"><?php echo $key; ?></span>
                        <span class="opt-text"><?php echo e($val); ?></span>
                    </label>
                    <?php endforeach; ?>
                </div>
                <?php endforeach; ?>

                <div style="margin-top: 1.5rem; text-align: right;">
                    <button type="submit" class="btn btn-primary" style="padding: 0.85rem 2rem; font-size: 1rem;">
                        Submit Assessment →
                    </button>
                </div>
            </form>
            <?php endif; ?>
        </div>
    </main>

    <?php if ($quiz['time_limit_minutes'] > 0): ?>
    <script>
        let secondsLeft = <?php echo (int)$quiz['time_limit_minutes'] * 60; ?>;
        const timerBadge = document.getElementById('quizTimer');
        const timerText = document.getElementById('timerText');
        const form = document.getElementById('quizForm');

        function updateTimer() {
            const mins = Math.floor(secondsLeft / 60);
            const secs = secondsLeft % 60;
            timerText.textContent = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');

            if (secondsLeft <= 60) {
                timerBadge.classList.add('low');
            }

            if (secondsLeft <= 0) {
                clearInterval(interval);
                alert("Time is up! Your answers will now be submitted.");
                if (form) form.submit();
                return;
            }
            secondsLeft--;
        }
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
    </script>
    <?php endif; ?>

    <script>
    function validateQuizSubmission() {
        return true;
    }
    </script>
    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>


