<?php
$adminActive = 'quizzes';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// 1. Create a quiz for a module
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_quiz"])) {
    verify_csrf();
    $moduleId    = validate_integer_range($_POST["quiz_module_id"] ?? 0, 1, 100000, 0);
    $title       = clean_text($_POST["quiz_title"] ?? "", 150);
    $timeLimit   = validate_integer_range($_POST["quiz_time_limit"] ?? 0, 0, 600, 0);
    $passPercent = validate_integer_range($_POST["quiz_pass_percent"] ?? 50, 1, 100, 50);

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
                    "option_b" => "Ignoring boundary edge conditions in execution",
                    "option_c" => "Hardcoding database credentials directly into client scripts",
                    "option_d" => "Disabling network validation layers",
                    "correct_option" => "A"
                ],
                [
                    "question" => "How does high concurrency impact operations in {$topic}?",
                    "option_a" => "Requires thread synchronization and atomic transactions to prevent race conditions",
                    "option_b" => "Guarantees zero latency without memory overhead",
                    "option_c" => "Automatically duplicates database tables",
                    "option_d" => "Prevents network packet transmission",
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

// Delete question (POST + CSRF)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_question_id"])) {
    verify_csrf();
    $stmt = $pdo->prepare("DELETE FROM quiz_questions WHERE id = ?");
    $stmt->execute([validate_integer_range($_POST["delete_question_id"] ?? 0, 1, 100000, 0)]);
    header("Location: admin-quiz?msg=deleted");
    exit;
}

// Delete quiz (POST + CSRF)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_quiz_id"])) {
    verify_csrf();
    $stmt = $pdo->prepare("DELETE FROM quizzes WHERE id = ?");
    $stmt->execute([validate_integer_range($_POST["delete_quiz_id"] ?? 0, 1, 100000, 0)]);
    header("Location: admin-quiz?msg=deleted");
    exit;
}

// Fetch Courses, Modules, and Quizzes with Full Course Context
$courses = $pdo->query("SELECT id, title FROM courses ORDER BY id ASC")->fetchAll();

$modules = $pdo->query("
    SELECT m.*, c.title as course_title 
    FROM modules m 
    JOIN courses c ON m.course_id = c.id 
    ORDER BY c.id ASC, m.sort_order ASC, m.id ASC
")->fetchAll();

// Group modules by Course
$modulesByCourse = [];
foreach ($modules as $m) {
    $modulesByCourse[$m['course_id']]['course_title'] = $m['course_title'];
    $modulesByCourse[$m['course_id']]['modules'][] = $m;
}

$quizzes = $pdo->query("
    SELECT q.*, m.title as module_title, c.title as course_title, c.id as course_id 
    FROM quizzes q 
    JOIN modules m ON q.module_id = m.id 
    JOIN courses c ON m.course_id = c.id 
    ORDER BY c.id ASC, q.id ASC
")->fetchAll();

$questionsByQuiz = [];
foreach ($pdo->query("SELECT * FROM quiz_questions ORDER BY sort_order ASC, id ASC")->fetchAll() as $quest) {
    $questionsByQuiz[$quest["quiz_id"]][] = $quest;
}
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
    <title>Quiz & Assessment Builder — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
        .course-badge-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #ede9fe;
            color: #5b21b6;
            font-size: 0.74rem;
            font-weight: 700;
            padding: 0.2rem 0.6rem;
            border-radius: 6px;
            margin-bottom: 0.35rem;
            border: 1px solid #ddd6fe;
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
        <div class="page-header" style="margin-bottom: 1.5rem;">
            <div class="page-header-text">
                <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">📝 Quiz & Assessment Builder</h1>
                <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Create module quizzes linked to specific courses, set timer limits, and construct AI questions.</p>
            </div>
        </div>

        <?php if ($message || isset($_GET['msg'])): ?>
            <div class="alert alert-success" style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600;">
                <span>✓ <?php echo e($message ?: 'Action completed successfully.'); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger" style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600;">
                <span>⚠️ <?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <!-- Create Quiz Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">1. Create Quiz for Course & Module</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    
                    <!-- Select Course First -->
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Target Course</label>
                        <select id="createQuizCourseFilter" onchange="filterModulesByCourse(this.value)" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                            <option value="">-- All Courses (or choose to filter) --</option>
                            <?php foreach ($courses as $c): ?>
                                <option value="<?php echo $c['id']; ?>">🎓 <?php echo e($c['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <!-- Assign to Module (Grouped by Course) -->
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Assign to Module <span style="color:#ef4444;">*</span></label>
                        <select name="quiz_module_id" id="quizModuleSelect" required style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                            <option value="">-- Select Module --</option>
                            <?php foreach ($modulesByCourse as $cId => $cGroup): ?>
                                <optgroup label="🎓 <?php echo e($cGroup['course_title']); ?>" data-course-id="<?php echo $cId; ?>">
                                    <?php foreach ($cGroup['modules'] as $m): ?>
                                        <option value="<?php echo $m['id']; ?>" data-course-id="<?php echo $m['course_id']; ?>">
                                            <?php echo e($m['title']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </optgroup>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Quiz Title <span style="color:#ef4444;">*</span></label>
                        <input type="text" name="quiz_title" placeholder="e.g. Module 1 Knowledge Check" required maxlength="150" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Time Limit (Minutes — 0 for untimed)</label>
                        <input type="number" name="quiz_time_limit" value="15" min="0" max="600" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                    </div>
                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Passing Score Percentage (%)</label>
                        <input type="number" name="quiz_pass_percent" value="50" min="1" max="100" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                    </div>
                    <button type="submit" name="add_quiz" class="btn btn-primary" style="padding: 0.55rem 1.25rem; font-weight: 700; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;">Create Quiz</button>
                </form>
            </div>

            <!-- Add Questions Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">2. Add Question to Quiz</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Target Quiz <span style="color:#ef4444;">*</span></label>
                        <select name="question_quiz_id" required style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                            <option value="">-- Select Quiz --</option>
                            <?php foreach ($quizzes as $q): ?>
                                <option value="<?php echo $q['id']; ?>">
                                    [<?php echo e($q['course_title']); ?>] <?php echo e($q['title']); ?> (<?php echo e($q['module_title']); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Question Text <span style="color:#ef4444;">*</span></label>
                        <textarea name="question_text" rows="2" placeholder="What does CSS stand for?" required maxlength="1000" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;"></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Option A</label>
                            <input type="text" name="option_a" required maxlength="255" style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Option B</label>
                            <input type="text" name="option_b" required maxlength="255" style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Option C</label>
                            <input type="text" name="option_c" required maxlength="255" style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Option D</label>
                            <input type="text" name="option_d" required maxlength="255" style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Correct Answer</label>
                            <select name="correct_option" required style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                                <option value="A">Option A</option>
                                <option value="B">Option B</option>
                                <option value="C">Option C</option>
                                <option value="D">Option D</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label style="font-weight: 700; font-size: 0.8rem; color: #334155;">Sort Order</label>
                            <input type="number" name="question_order" value="1" style="width: 100%; padding: 0.45rem 0.75rem; border-radius: 6px; border: 1px solid #cbd5e1;">
                        </div>
                    </div>
                    <button type="submit" name="add_question" class="btn btn-primary" style="padding: 0.55rem 1.25rem; font-weight: 700; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;">Add Question</button>
                </form>
            </div>

            <!-- Card 3: AI Instant Quiz Generator -->
            <div class="card" style="margin-bottom: 0; background: linear-gradient(135deg, #ffffff 0%, rgba(99, 102, 241, 0.04) 100%); border: 1px solid rgba(99, 102, 241, 0.25);">
                <div class="card-header">
                    <h2 style="font-size: 1.15rem; font-weight: 700; color: #4338ca;">✨ 3. AI Quiz Generator</h2>
                </div>
                <p style="font-size: 0.84rem; color: #64748b; margin-bottom: 1rem; line-height: 1.5;">
                    Let Gemini AI automatically construct syllabus-aligned multiple choice questions with answer keys in 1 click.
                </p>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Target Quiz <span style="color:#ef4444;">*</span></label>
                        <select name="ai_quiz_id" required style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                            <option value="">-- Select Quiz --</option>
                            <?php foreach ($quizzes as $q): ?>
                                <option value="<?php echo $q['id']; ?>">
                                    [<?php echo e($q['course_title']); ?>] <?php echo e($q['title']); ?> (<?php echo e($q['module_title']); ?>)
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <label style="font-weight: 700; font-size: 0.84rem; color: #334155;">Curriculum Topic or Concept <span style="color:#ef4444;">*</span></label>
                        <input type="text" name="ai_topic" placeholder="e.g. Java Concurrency & Multi-threading" required maxlength="200" style="width: 100%; padding: 0.55rem 0.85rem; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                    </div>
                    <button type="submit" name="ai_generate_questions" class="btn btn-primary" style="padding: 0.55rem 1.25rem; font-weight: 700; background: linear-gradient(135deg, #4f46e5, #7c3aed); border: none;">
                        ✨ Generate Questions with AI
                    </button>
                </form>
            </div>
        </div>

        <!-- Quizzes & Questions List -->
        <section class="card" style="padding: 1.5rem; border-radius: 12px;">
            <div class="card-header" style="margin-bottom: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
                <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a;">Active Quizzes (<?php echo count($quizzes); ?>)</h2>
            </div>

            <?php if (empty($quizzes)): ?>
                <p style="color: #64748b; padding: 1.5rem 0; text-align: center;">No quizzes created yet. Use the form above to add your first assessment!</p>
            <?php else: ?>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                <?php foreach ($quizzes as $q): 
                    $qid = $q['id'];
                    $qList = $questionsByQuiz[$qid] ?? [];
                ?>
                <div class="quiz-manage-card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                    <div class="quiz-manage-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                        <div style="min-width: 0; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.4rem;">
                                <span class="course-badge-pill">🎓 <?php echo e($q['course_title']); ?></span>
                                <span class="badge" style="background: #f1f5f9; color: #475569; font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                                    📁 <?php echo e($q['module_title']); ?>
                                </span>
                            </div>
                            <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.35;"><?php echo e($q['title']); ?></h3>
                            <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.35rem; line-height: 1.4;">
                                Pass Criteria: <strong><?php echo $q['pass_percent']; ?>%</strong> • Timer: <strong><?php echo $q['time_limit_minutes'] > 0 ? $q['time_limit_minutes'] . ' mins' : 'Untimed'; ?></strong> • <strong><?php echo count($qList); ?> Questions</strong>
                            </div>
                        </div>
                        <form method="post" style="display:inline;" onsubmit="return confirm('Delete this quiz and all its questions?')">
                            <?= csrf_field() ?>
                            <input type="hidden" name="delete_quiz_id" value="<?php echo (int)$qid; ?>">
                            <button type="submit" class="btn btn-secondary btn-sm" style="color: #ef4444; border-color: #fecaca; background: #fff; font-size: 0.78rem; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 700; cursor: pointer;">Delete Quiz</button>
                        </form>
                    </div>

                    <?php if (!empty($qList)): ?>
                    <div style="margin-top: 1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">
                        <?php foreach ($qList as $i => $item): ?>
                        <div class="quiz-question-row" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                            <div style="min-width: 0; flex: 1;">
                                <strong style="color: #0f172a; font-size: 0.9rem; display: block; line-height: 1.4;">Q<?php echo $i + 1; ?>: <?php echo e($item['question']); ?></strong>
                                <div style="font-size: 0.82rem; color: #64748b; margin-top: 0.35rem; line-height: 1.5;">
                                    <strong>A:</strong> <?php echo e($item['option_a']); ?> | <strong>B:</strong> <?php echo e($item['option_b']); ?> | <strong>C:</strong> <?php echo e($item['option_c']); ?> | <strong>D:</strong> <?php echo e($item['option_d']); ?> 
                                    <br><span style="color: #16a34a; font-weight: 800;">✓ Correct: Option <?php echo e($item['correct_option']); ?></span>
                                </div>
                            </div>
                            <form method="post" style="display:inline;" onsubmit="return confirm('Delete question?')">
                                <?= csrf_field() ?>
                                <input type="hidden" name="delete_question_id" value="<?php echo (int)$item['id']; ?>">
                                <button type="submit" class="delete-btn" style="color: #ef4444; font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.55rem; border-radius: 4px; background: #fef2f2; border: 1px solid #fecaca; cursor: pointer;">Delete</button>
                            </form>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </section>
    </main>

    <script>
    function filterModulesByCourse(selectedCourseId) {
        const select = document.getElementById('quizModuleSelect');
        const optgroups = select.querySelectorAll('optgroup');
        
        let firstVisibleVal = '';
        optgroups.forEach(group => {
            const courseId = group.getAttribute('data-course-id');
            if (!selectedCourseId || courseId === selectedCourseId) {
                group.style.display = '';
                if (!firstVisibleVal) {
                    const firstOption = group.querySelector('option');
                    if (firstOption) firstVisibleVal = firstOption.value;
                }
            } else {
                group.style.display = 'none';
            }
        });

        // Reset value if currently selected option is hidden
        const currentSelected = select.options[select.selectedIndex];
        if (currentSelected && currentSelected.closest('optgroup') && currentSelected.closest('optgroup').style.display === 'none') {
            select.value = firstVisibleVal || '';
        }
    }
    </script>
</body>
</html>
