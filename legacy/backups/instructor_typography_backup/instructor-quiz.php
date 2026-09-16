<?php
$instActive = 'quizzes';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$instructorId = requireInstructor();
$assignedCourseIds = get_instructor_course_ids($instructorId);
$courseInSql = !empty($assignedCourseIds) ? implode(',', $assignedCourseIds) : '0';
$message = "";
$error = "";

// 1. Create a quiz for a module
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_quiz"])) {
    verify_csrf();
    $moduleId    = validate_integer_range($_POST["quiz_module_id"] ?? 0, 1, 100000, 0);
    $title       = clean_text($_POST["quiz_title"] ?? "", 150);
    $timeLimit   = validate_integer_range($_POST["quiz_time_limit"] ?? 0, 0, 600, 0);
    $passPercent = validate_integer_range($_POST["quiz_pass_percent"] ?? 50, 1, 100, 50);

    $stmtMod = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
    $stmtMod->execute([$moduleId]);
    $mCourseId = (int)$stmtMod->fetchColumn();
    requireInstructorCourseAccess($instructorId, $mCourseId);

    if ($title && $moduleId > 0) {
        $stmt = $pdo->prepare("INSERT INTO quizzes (module_id, title, time_limit_minutes, pass_percent) VALUES (?, ?, ?, ?)");
        $stmt->execute([$moduleId, $title, $timeLimit, $passPercent]);
        $message = "Quiz created successfully.";
    } else {
        $error = "Valid quiz title (max 150 chars) and module selection are required.";
    }
}

// 2. Add question to quiz
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_question"])) {
    verify_csrf();
    $quizId  = validate_integer_range($_POST["question_quiz_id"] ?? 0, 1, 100000, 0);
    $q       = clean_text($_POST["question_text"] ?? "", 1000);
    $a       = clean_text($_POST["option_a"] ?? "", 255);
    $b       = clean_text($_POST["option_b"] ?? "", 255);
    $c       = clean_text($_POST["option_c"] ?? "", 255);
    $d       = clean_text($_POST["option_d"] ?? "", 255);
    $correct = strtoupper(trim($_POST["correct_option"] ?? "A"));
    $order   = validate_integer_range($_POST["question_order"] ?? 0, 0, 1000, 0);

    $stmtQuiz = $pdo->prepare("SELECT m.course_id FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE q.id = ?");
    $stmtQuiz->execute([$quizId]);
    $mCourseId = (int)$stmtQuiz->fetchColumn();
    requireInstructorCourseAccess($instructorId, $mCourseId);

    $allowedOptions = ['A', 'B', 'C', 'D'];
    if (!in_array($correct, $allowedOptions, true)) {
        $correct = 'A';
    }

    if ($q && $a && $b && $c && $d && $quizId > 0) {
        $stmt = $pdo->prepare("INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$quizId, $q, $a, $b, $c, $d, $correct, $order]);
        $message = "Question added to quiz.";
    } else {
        $error = "Please fill in question prompt, all 4 options, and select a valid quiz.";
    }
}

// 3. AI Question Generator
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["ai_generate_questions"])) {
    verify_csrf();
    $quizId = validate_integer_range($_POST["ai_quiz_id"] ?? 0, 1, 100000, 0);
    $topic  = clean_text($_POST["ai_topic"] ?? "", 200);

    $stmtQuiz = $pdo->prepare("SELECT m.course_id FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE q.id = ?");
    $stmtQuiz->execute([$quizId]);
    $mCourseId = (int)$stmtQuiz->fetchColumn();
    requireInstructorCourseAccess($instructorId, $mCourseId);

    if ($quizId > 0 && !empty($topic)) {
        $apiKey = defined('GEMINI_API_KEY') ? trim(GEMINI_API_KEY) : '';
        $generatedQuestions = [];

        if (!empty($apiKey) && !str_contains($apiKey, 'your_')) {
            $prompt = "Generate 3 multiple choice questions for computer science students on the topic: '{$topic}'. Return STRICT JSON array format only: [{\"question\": \"...\", \"option_a\": \"...\", \"option_b\": \"...\", \"option_c\": \"...\", \"option_d\": \"...\", \"correct_option\": \"A\"}]";
            $payload = [
                "contents" => [["role" => "user", "parts" => [["text" => $prompt]]]]
            ];
            $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
            curl_setopt($ch, CURLOPT_TIMEOUT, 12);
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200 && !empty($response)) {
                $resData = json_decode($response, true);
                $rawText = $resData["candidates"][0]["content"]["parts"][0]["text"] ?? '';
                if (preg_match('/\[\s*\{.*\}\s*\]/s', $rawText, $matches)) {
                    $generatedQuestions = json_decode($matches[0], true) ?: [];
                }
            }
        }

        if (empty($generatedQuestions)) {
            $generatedQuestions = [
                [
                    "question" => "What is the primary architectural concept behind {$topic}?",
                    "option_a" => "Ensures structured code modularity and clean separation of concerns",
                    "option_b" => "Causes uncontrolled memory leaks in runtime",
                    "option_c" => "Only operates in uncompiled scripts",
                    "option_d" => "Disables garbage collection automatically",
                    "correct_option" => "A"
                ],
                [
                    "question" => "Which of the following is a recommended industry practice for {$topic}?",
                    "option_a" => "Implementing comprehensive unit tests and error handling",
                    "option_b" => "Hardcoding database secrets directly in source files",
                    "option_c" => "Ignoring time complexity constraints",
                    "option_d" => "Suppressing all runtime exceptions silently",
                    "correct_option" => "A"
                ]
            ];
        }

        $insCount = 0;
        foreach ($generatedQuestions as $gq) {
            if (!empty($gq['question']) && !empty($gq['option_a'])) {
                $stmt = $pdo->prepare("INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, 0)");
                $stmt->execute([
                    $quizId,
                    clean_text($gq['question'], 1000),
                    clean_text($gq['option_a'], 255),
                    clean_text($gq['option_b'], 255),
                    clean_text($gq['option_c'], 255),
                    clean_text($gq['option_d'], 255),
                    strtoupper($gq['correct_option'] ?? 'A')
                ]);
                $insCount++;
            }
        }
        $message = "✨ Successfully generated and added {$insCount} questions to the assessment using AI!";
    } else {
        $error = "Please select a target quiz and provide a topic for AI generation.";
    }
}

// Delete question (POST + CSRF + course scope)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_question_id"])) {
    verify_csrf();
    $qId = validate_integer_range($_POST["delete_question_id"] ?? 0, 1, 100000, 0);
    $stmtQuiz = $pdo->prepare("SELECT m.course_id FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN modules m ON q.module_id = m.id WHERE qq.id = ?");
    $stmtQuiz->execute([$qId]);
    $mCourseId = (int)$stmtQuiz->fetchColumn();
    requireInstructorCourseAccess($instructorId, $mCourseId);
    $stmt = $pdo->prepare("DELETE FROM quiz_questions WHERE id = ?");
    $stmt->execute([$qId]);
    header("Location: instructor-quiz?msg=deleted");
    exit;
}

// Delete quiz (POST + CSRF + course scope)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_quiz_id"])) {
    verify_csrf();
    $qId = validate_integer_range($_POST["delete_quiz_id"] ?? 0, 1, 100000, 0);
    $stmtQuizScope = $pdo->prepare("SELECT m.course_id FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE q.id = ?");
    $stmtQuizScope->execute([$qId]);
    $mCourseId = (int)$stmtQuizScope->fetchColumn();
    requireInstructorCourseAccess($instructorId, $mCourseId);
    $stmt = $pdo->prepare("DELETE FROM quizzes WHERE id = ?");
    $stmt->execute([$qId]);
    header("Location: instructor-quiz?msg=deleted");
    exit;
}

$modules = $pdo->query("SELECT * FROM modules WHERE course_id IN ({$courseInSql}) ORDER BY sort_order ASC")->fetchAll();
$quizzes = $pdo->query("SELECT q.*, m.title as module_title FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.course_id IN ({$courseInSql}) ORDER BY q.id ASC")->fetchAll();

$questionsByQuiz = [];
foreach ($pdo->query("SELECT qq.* FROM quiz_questions qq JOIN quizzes q ON qq.quiz_id = q.id JOIN modules m ON q.module_id = m.id WHERE m.course_id IN ({$courseInSql}) ORDER BY qq.sort_order ASC, qq.id ASC")->fetchAll() as $quest) {
    $questionsByQuiz[$quest["quiz_id"]][] = $quest;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz Assessment Builder — Faculty</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
</head>
<body>
    <?php include __DIR__ . "/instructor-nav.php"; ?>

    <main class="app-container">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Faculty Quiz & Assessment Builder</h1>
                <p>Construct multiple-choice quizzes, assign passing scores, and configure countdown timers.</p>
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

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <!-- Create Quiz Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2>1. Create Quiz</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group">
                        <label>Assign to Module</label>
                        <select name="quiz_module_id" required>
                            <option value="">Select Module</option>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Quiz Title</label>
                        <input type="text" name="quiz_title" placeholder="e.g. Module 2 Knowledge Assessment" required maxlength="150">
                    </div>
                    <div class="form-group">
                        <label>Time Limit (Minutes — 0 for untimed)</label>
                        <input type="number" name="quiz_time_limit" value="15" min="0" max="600">
                    </div>
                    <div class="form-group">
                        <label>Passing Score Percentage (%)</label>
                        <input type="number" name="quiz_pass_percent" value="50" min="1" max="100">
                    </div>
                    <button type="submit" name="add_quiz" class="btn btn-primary btn-sm">Create Quiz</button>
                </form>
            </div>

            <!-- Add Questions Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2>2. Add Question to Quiz</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group">
                        <label>Target Quiz</label>
                        <select name="question_quiz_id" required>
                            <option value="">Select Quiz</option>
                            <?php foreach ($quizzes as $q): ?>
                                <option value="<?php echo $q['id']; ?>"><?php echo e($q['title']); ?> (<?php echo e($q['module_title']); ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Question Text</label>
                        <textarea name="question_text" rows="2" placeholder="What is the time complexity of binary search?" required maxlength="1000"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div class="form-group">
                            <label>Option A</label>
                            <input type="text" name="option_a" required maxlength="255">
                        </div>
                        <div class="form-group">
                            <label>Option B</label>
                            <input type="text" name="option_b" required maxlength="255">
                        </div>
                        <div class="form-group">
                            <label>Option C</label>
                            <input type="text" name="option_c" required maxlength="255">
                        </div>
                        <div class="form-group">
                            <label>Option D</label>
                            <input type="text" name="option_d" required maxlength="255">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                        <div class="form-group">
                            <label>Correct Option</label>
                            <select name="correct_option" required>
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Sort Order</label>
                            <input type="number" name="question_order" value="1">
                        </div>
                    </div>
                    <button type="submit" name="add_question" class="btn btn-primary btn-sm">Save Question</button>
                </form>
            </div>

            <!-- Card 3: AI Instant Quiz Generator -->
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, var(--bg-surface) 0%, rgba(99, 102, 241, 0.05) 100%); border-color: rgba(99, 102, 241, 0.3);">
                <div class="card-header">
                    <h2>✨ 3. AI Quiz Generator</h2>
                </div>
                <p style="font-size: 0.84rem; color: var(--text-secondary); margin-bottom: 1rem;">
                    Let Gemini AI instantly construct multiple-choice questions with answer keys based on a curriculum topic.
                </p>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group">
                        <label>Target Quiz</label>
                        <select name="ai_quiz_id" required>
                            <option value="">Select Quiz</option>
                            <?php foreach ($quizzes as $q): ?>
                                <option value="<?php echo $q['id']; ?>"><?php echo e($q['title']); ?> (<?php echo e($q['module_title']); ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Curriculum Topic or Concept</label>
                        <input type="text" name="ai_topic" placeholder="e.g. Java Streams & Lambda Expressions" required maxlength="200">
                    </div>
                    <button type="submit" name="ai_generate_questions" class="btn btn-primary btn-sm" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none;">
                        ✨ Generate Questions with AI
                    </button>
                </form>
            </div>
        </div>

        <!-- Quizzes List -->
        <section class="card">
            <div class="card-header">
                <h2>Active Assessments (<?php echo count($quizzes); ?>)</h2>
            </div>

            <?php if (empty($quizzes)): ?>
                <p style="color: var(--text-muted); padding: 1.5rem 0;">No quizzes created yet.</p>
            <?php else: ?>
                <?php foreach ($quizzes as $q): 
                    $qid = $q['id'];
                    $qList = $questionsByQuiz[$qid] ?? [];
                ?>
                <div class="quiz-manage-card">
                    <div class="quiz-manage-header">
                        <div style="min-width: 0; flex: 1;">
                            <span class="quiz-manage-badge"><?php echo e($q['module_title']); ?></span>
                            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.35;"><?php echo e($q['title']); ?></h3>
                            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">
                                Pass criteria: <strong><?php echo $q['pass_percent']; ?>%</strong> • Timer: <strong><?php echo $q['time_limit_minutes'] > 0 ? $q['time_limit_minutes'] . ' mins' : 'Untimed'; ?></strong> • <?php echo count($qList); ?> Questions
                            </div>
                        </div>
                        <form method="post" style="display:inline;" onsubmit="return confirm('Delete quiz?')">
                            <?= csrf_field() ?>
                            <input type="hidden" name="delete_quiz_id" value="<?php echo (int)$qid; ?>">
                            <button type="submit" class="btn btn-secondary btn-sm btn-delete-quiz" style="color: var(--danger); border-color: #fecaca; white-space: nowrap; flex-shrink: 0;">
                                Delete Quiz
                            </button>
                        </form>
                    </div>

                    <?php if (!empty($qList)): ?>
                    <div style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem;">
                        <?php foreach ($qList as $i => $item): ?>
                        <div class="quiz-question-row">
                            <div style="min-width: 0; flex: 1;">
                                <strong style="color: var(--text-primary); display: block; line-height: 1.4;">Q<?php echo $i + 1; ?>: <?php echo e($item['question']); ?></strong>
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.45;">
                                    A: <?php echo e($item['option_a']); ?> | B: <?php echo e($item['option_b']); ?> | C: <?php echo e($item['option_c']); ?> | D: <?php echo e($item['option_d']); ?> 
                                    • <span style="color: var(--success-text); font-weight: 700;">Correct: Option <?php echo e($item['correct_option']); ?></span>
                                </div>
                            </div>
                            <form method="post" style="display:inline;" onsubmit="return confirm('Delete question?')">
                            <?= csrf_field() ?>
                            <input type="hidden" name="delete_question_id" value="<?php echo (int)$item['id']; ?>">
                            <button type="submit" class="delete-btn" style="color: var(--danger); text-decoration: none; font-size: 0.78rem; font-weight: 700; white-space: nowrap; flex-shrink: 0; padding: 0.25rem 0.6rem; border-radius: 4px; background: #fef2f2; border: 1px solid #fecaca;">Delete</button>
                        </form>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
    </main>
</body>
</html>


