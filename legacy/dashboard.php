<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/gamification.php";

$studentId = requireStudent();
$studentName = $_SESSION["student_name"] ?? "Student";

// Calculate gamification stats & track activity
$gamification = getStudentGamificationStats($pdo, $studentId);

// Dynamic Time-of-Day Greeting
$hour = (int)date('G');
if ($hour >= 5 && $hour < 12) {
    $greeting = "Good morning";
    $greetingIcon = "☀️";
} elseif ($hour >= 12 && $hour < 17) {
    $greeting = "Good afternoon";
    $greetingIcon = "🌤️";
} else {
    $greeting = "Good evening";
    $greetingIcon = "🌙";
}

// Fetch student's enrolled courses
$enrolledCourses = getStudentCourses($studentId);

// Strictly check if student has active paid enrollments (No unearned fallback preview)
$hasEnrolledCourses = !empty($enrolledCourses);

// Selected course ID from query or first enrolled course
$selectedCourseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : ($enrolledCourses[0]['id'] ?? 0);

// Find active course details
$currentCourse = null;
if ($hasEnrolledCourses) {
    foreach ($enrolledCourses as $c) {
        if ((int)$c['id'] === $selectedCourseId) {
            $currentCourse = $c;
            break;
        }
    }
    if (!$currentCourse && !empty($enrolledCourses)) {
        $currentCourse = $enrolledCourses[0];
        $selectedCourseId = (int)$currentCourse['id'];
    }
}

// Fetch modules strictly for the selected enrolled course
$stmtMod = $pdo->prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC");
$stmtMod->execute([$selectedCourseId]);
$modules = $stmtMod->fetchAll();

$moduleIds = array_column($modules, 'id');
$modulePlaceholder = !empty($moduleIds) ? implode(',', array_fill(0, count($moduleIds), '?')) : '0';

// Fetch Videos
$videosByModule = [];
if (!empty($moduleIds)) {
    $stmtV = $pdo->prepare("SELECT * FROM videos WHERE module_id IN ($modulePlaceholder) ORDER BY sort_order ASC");
    $stmtV->execute($moduleIds);
    foreach ($stmtV->fetchAll() as $v) {
        $videosByModule[$v["module_id"]][] = $v;
    }
}

// Fetch Notes
$notesByModule = [];
if (!empty($moduleIds)) {
    $stmtN = $pdo->prepare("SELECT * FROM notes WHERE module_id IN ($modulePlaceholder) ORDER BY sort_order ASC");
    $stmtN->execute($moduleIds);
    foreach ($stmtN->fetchAll() as $n) {
        $notesByModule[$n["module_id"]][] = $n;
    }
}

// Fetch Code Snippets
$codeByModule = [];
if (!empty($moduleIds)) {
    $stmtC = $pdo->prepare("SELECT * FROM code_snippets WHERE module_id IN ($modulePlaceholder) ORDER BY sort_order ASC");
    $stmtC->execute($moduleIds);
    foreach ($stmtC->fetchAll() as $c) {
        $codeByModule[$c["module_id"]][] = $c;
    }
}

// Fetch Quizzes
$quizzesByModule = [];
if (!empty($moduleIds)) {
    $stmtQ = $pdo->prepare("SELECT * FROM quizzes WHERE module_id IN ($modulePlaceholder)");
    $stmtQ->execute($moduleIds);
    foreach ($stmtQ->fetchAll() as $q) {
        $quizzesByModule[$q["module_id"]] = $q;
    }
}

// Fetch Assignments
$assignmentsByModule = [];
if (!empty($moduleIds)) {
    $stmtA = $pdo->prepare("SELECT * FROM assignments WHERE module_id IN ($modulePlaceholder) ORDER BY created_at ASC");
    $stmtA->execute($moduleIds);
    foreach ($stmtA->fetchAll() as $a) {
        $assignmentsByModule[$a["module_id"]][] = $a;
    }
}

// Fetch Student Submissions
$submissionByAssignment = [];
$stmtSub = $pdo->prepare("SELECT * FROM assignment_submissions WHERE student_id = ? ORDER BY submitted_at DESC");
$stmtSub->execute([$studentId]);
foreach ($stmtSub->fetchAll() as $s) {
    if (!isset($submissionByAssignment[$s["assignment_id"]])) {
        $submissionByAssignment[$s["assignment_id"]] = $s;
    }
}

// Fetch Student Quiz Attempts & Pass Status
$attempts = [];
$passedQuizzesCount = 0;
$stmtAtt = $pdo->prepare("SELECT quiz_id, MAX(score) as best_score, total_questions, MAX(passed) as ever_passed FROM quiz_attempts WHERE student_id = ? GROUP BY quiz_id, total_questions");
$stmtAtt->execute([$studentId]);
foreach ($stmtAtt->fetchAll() as $a) {
    $attempts[$a["quiz_id"]] = $a;
    if ($a["ever_passed"]) {
        $passedQuizzesCount++;
    }
}

// Completed Lesson Items for Student
$completed = [];
$stmtComp = $pdo->prepare("SELECT item_type, item_id FROM lesson_completions WHERE student_id = ?");
$stmtComp->execute([$studentId]);
foreach ($stmtComp->fetchAll() as $c) {
    $completed[$c["item_type"] . "_" . $c["item_id"]] = true;
}

// Overall Course Progress Calculation
$totalCourseItems = 0;
$doneCourseItems = 0;
$totalVideosCount = 0;
$totalNotesCount = 0;
$totalCodeCount = 0;
$nextUpLesson = null;

foreach ($modules as $m) {
    $mid = $m["id"];
    foreach (($videosByModule[$mid] ?? []) as $v) {
        $totalCourseItems++;
        $totalVideosCount++;
        if (isset($completed["video_" . $v["id"]])) {
            $doneCourseItems++;
        } elseif (!$nextUpLesson) {
            $nextUpLesson = ['type' => 'video', 'title' => $v['title'], 'url' => 'watch.php?id=' . $v['id']];
        }
    }
    foreach (($notesByModule[$mid] ?? []) as $n) {
        $totalCourseItems++;
        $totalNotesCount++;
        if (isset($completed["note_" . $n["id"]])) {
            $doneCourseItems++;
        } elseif (!$nextUpLesson) {
            $nextUpLesson = ['type' => 'note', 'title' => $n['title'], 'url' => 'note-view.php?id=' . $n['id']];
        }
    }
    foreach (($codeByModule[$mid] ?? []) as $c) {
        $totalCourseItems++;
        $totalCodeCount++;
        if (isset($completed["code_" . $c["id"]])) {
            $doneCourseItems++;
        } elseif (!$nextUpLesson) {
            $nextUpLesson = ['type' => 'code', 'title' => $c['title'], 'url' => 'code-view.php?id=' . $c['id']];
        }
    }
}
$overallPercent = $totalCourseItems > 0 ? round(($doneCourseItems / $totalCourseItems) * 100) : 0;
$totalQuizzes = count($quizzesByModule);
$totalAssignments = 0;
$submittedAssignmentsCount = 0;
foreach ($assignmentsByModule as $arr) {
    $totalAssignments += count($arr);
    foreach ($arr as $asgn) {
        if (isset($submissionByAssignment[$asgn['id']])) {
            $submittedAssignmentsCount++;
        }
    }
}

// Prepare structured syllabus payload for Export Syllabus PDF button
$syllabusExportPayload = [
    'course_title' => $currentCourse['title'] ?? 'Full Stack Curriculum',
    'course_desc'  => $currentCourse['description'] ?? 'Comprehensive industry-aligned engineering roadmap.',
    'duration'     => $currentCourse['duration'] ?? '16 Weeks Live',
    'level'        => $currentCourse['level'] ?? 'Intermediate to Advanced',
    'total_modules'=> count($modules),
    'student_name' => $studentName,
    'modules'      => []
];

foreach ($modules as $m) {
    $mid = $m['id'];
    $mItems = [];
    foreach (($videosByModule[$mid] ?? []) as $v) {
        $mItems[] = ['type' => 'Lecture', 'title' => $v['title'], 'duration' => $v['duration'] ?? ''];
    }
    foreach (($notesByModule[$mid] ?? []) as $n) {
        $mItems[] = ['type' => 'Study Guide', 'title' => $n['title'], 'duration' => 'Article'];
    }
    foreach (($codeByModule[$mid] ?? []) as $c) {
        $mItems[] = ['type' => 'Code Lab', 'title' => $c['title'], 'duration' => 'Hands-on'];
    }
    if (isset($quizzesByModule[$mid])) {
        $mItems[] = ['type' => 'Quiz Assessment', 'title' => $quizzesByModule[$mid]['title'] ?? 'Module Assessment', 'duration' => 'MCQ'];
    }
    foreach (($assignmentsByModule[$mid] ?? []) as $a) {
        $mItems[] = ['type' => 'Project Assignment', 'title' => $a['title'], 'duration' => 'Project'];
    }

    $syllabusExportPayload['modules'][] = [
        'title' => $m['title'],
        'description' => $m['description'] ?? '',
        'items' => $mItems
    ];
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Learning Dashboard — Education Algorithm</title>
    
    <!-- Instant Pre-Paint Theme Initialization (Eliminates FOUC / White Flash) -->
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
    /* Ultra-Clean Modern Studio Layout & Components */
    .dashboard-hero-deck {
        margin-bottom: 1.5rem;
    }
    .hero-greeting-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }
    .greeting-title-block h1 {
        font-size: 1.55rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .greeting-title-block p {
        font-size: 0.88rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
    }
    .hero-badge-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        padding: 0.4rem 0.85rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        box-shadow: var(--shadow-sm);
    }
    .hero-badge-pill .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }

    /* Academic Standing & Track Pill */
    .academic-standing-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-primary);
    }
    .standing-pill {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.3);
        padding: 0.3rem 0.75rem;
        border-radius: 9999px;
    }
    .standing-pill strong {
        font-size: 0.75rem;
        color: #10b981;
        letter-spacing: 0.02em;
    }
    .live-batch-pill {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border: 1px solid rgba(16, 185, 129, 0.3);
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: 9999px;
    }

    /* Course Showcase Card */
    .course-showcase-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.1rem 1.4rem;
        margin-bottom: 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        box-shadow: var(--shadow-sm);
    }
    .course-showcase-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        flex: 1;
        min-width: 260px;
    }
    .course-icon-badge {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        background: var(--primary-light, #eef2ff);
        color: var(--primary, #6366f1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    [data-theme="dark"] .course-icon-badge {
        background: rgba(99, 102, 241, 0.18);
        color: #818cf8;
    }
    .course-showcase-meta h2 {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        line-height: 1.35;
    }
    .course-showcase-meta .meta-tags {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-top: 0.2rem;
        flex-wrap: wrap;
    }

    /* Dual Action Banners Deck */
    .dual-banners-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .clean-action-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.15rem 1.35rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 0.85rem;
        box-shadow: var(--shadow-sm);
        transition: all 0.2s ease;
    }
    .clean-action-card:hover {
        border-color: var(--border-hover);
        box-shadow: var(--shadow-md);
    }
    .clean-action-card.live-card {
        border-left: 4px solid var(--primary);
    }
    .clean-action-card.resume-card {
        background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
        color: #ffffff;
        border: none;
        box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);
    }
    .clean-action-card.resume-card:hover {
        box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        transform: translateY(-1px);
    }
    .clean-action-card.completion-alert-card {
        background: rgba(16, 185, 129, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.3);
    }
    [data-theme="dark"] .clean-action-card.completion-alert-card {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.35);
    }

    /* Single-Column Mastery & Progress Deck */
    .single-col-progress-deck {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1.25rem 1.4rem;
        box-shadow: var(--shadow-sm);
        margin-bottom: 1.75rem;
        transition: all 0.2s ease;
    }
    .sc-progress-main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .sc-metrics-row {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        padding-top: 0.85rem;
        border-top: 1px solid var(--border);
    }
    .sc-metric-item {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    .sc-metric-item strong {
        color: var(--text-primary);
        font-weight: 700;
    }
    .sc-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }
    .sc-dot.indigo { background: #6366f1; }
    .sc-dot.emerald { background: #10b981; }
    .sc-dot.amber { background: #f59e0b; }
    .sc-dot.rose { background: #f97316; }

    /* Curriculum Studio Section */
    .curriculum-studio {
        margin-top: 2rem;
    }
    .studio-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }
    .studio-title-wrap h2 {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        margin: 0;
    }
    .studio-title-wrap p {
        font-size: 0.84rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
    }
    .studio-header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* Filter & Search Toolbar */
    .curriculum-toolbar-box {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 1rem 1.25rem;
        margin-bottom: 1.25rem;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .toolbar-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.75rem;
    }
    .module-select-filter {
        flex: 1;
        min-width: 240px;
        padding: 0.55rem 0.85rem;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--bg-subtle);
        color: var(--text-primary);
        font-size: 0.88rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
    }
    .module-select-filter:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .search-input-wrapper {
        flex: 1;
        min-width: 220px;
        position: relative;
        display: flex;
        align-items: center;
    }
    .search-input-wrapper svg.search-icon-svg {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
        z-index: 10;
        width: 16px;
        height: 16px;
    }
    input[type="text"].curriculum-search-box {
        width: 100%;
        padding: 0.55rem 1rem 0.55rem 2.6rem;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--bg-subtle);
        color: var(--text-primary);
        font-size: 0.88rem;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }
    input[type="text"].curriculum-search-box:focus {
        border-color: var(--primary);
        background: var(--bg-surface);
        box-shadow: 0 0 0 3px var(--primary-glow);
    }

    /* Content Type Segmented Filter Pills */
    .content-type-filter-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        overflow-x: auto;
        white-space: nowrap;
        scrollbar-width: none;
        padding-bottom: 0.15rem;
    }
    .content-type-filter-row::-webkit-scrollbar { display: none; }
    .type-filter-btn {
        background: var(--bg-subtle);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        padding: 0.32rem 0.75rem;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        flex-shrink: 0;
    }
    .type-filter-btn:hover {
        background: var(--bg-surface);
        border-color: var(--border-hover);
        color: var(--text-primary);
    }
    .type-filter-btn.active {
        background: var(--primary);
        border-color: var(--primary);
        color: #ffffff;
    }

    /* Horizontal Module Category Carousel Pills */
    .curriculum-pills-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        overflow-x: auto;
        white-space: nowrap;
        padding: 0.15rem 0 0.35rem;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
    }
    .curriculum-pills-row::-webkit-scrollbar { display: none; }
    .curr-pill {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        padding: 0.38rem 0.85rem;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        box-shadow: var(--shadow-xs);
        outline: none;
    }
    .curr-pill:hover {
        background: var(--bg-subtle);
        border-color: var(--border-hover);
        color: var(--text-primary);
        transform: translateY(-1px);
    }
    .curr-pill.active {
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        border-color: #6366f1;
        color: #ffffff;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }
    .curr-pill .pill-badge {
        background: rgba(0, 0, 0, 0.08);
        border-radius: 50%;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 700;
    }
    .curr-pill.active .pill-badge {
        background: rgba(255, 255, 255, 0.25);
        color: #ffffff;
    }

    /* Module Accordion Card Styling */
    .module-accordion, .module-accordion-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        margin-bottom: 1rem;
        overflow: hidden;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-sm);
    }
    .module-accordion.open, .module-accordion-card.open {
        border-color: var(--primary);
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.12);
    }
    .module-header {
        background: var(--bg-surface);
        border-bottom: 1px solid transparent;
        padding: 1.1rem 1.35rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        transition: background 0.18s ease, border-color 0.18s ease;
        user-select: none;
    }
    .module-header:hover {
        background: var(--bg-subtle);
    }
    .module-accordion.open .module-header {
        border-bottom-color: var(--border);
    }
    .module-title-group {
        display: flex;
        align-items: center;
        gap: 0.9rem;
        flex: 1;
        min-width: 0;
    }
    .module-number {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: var(--bg-subtle);
        border: 1px solid var(--border);
        color: var(--primary);
        font-weight: 800;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .module-accordion.open .module-number {
        background: var(--primary);
        color: #ffffff;
        border-color: var(--primary);
    }
    .module-meta h3 {
        font-size: 1rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
    }
    .module-meta .module-subtext {
        font-size: 0.8rem;
        color: var(--text-muted);
        margin-top: 0.2rem;
        display: flex;
        align-items: center;
        gap: 0.45rem;
    }
    .module-status-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .module-chevron {
        color: var(--text-muted);
        transition: transform 0.25s ease;
        display: flex;
        align-items: center;
    }
    .module-accordion.open .module-chevron {
        transform: rotate(180deg);
        color: var(--primary);
    }
    .module-body {
        background: var(--bg-subtle);
        padding: 1.1rem 1.35rem;
        display: none;
    }
    .module-accordion.open .module-body {
        display: block;
    }
    .module-desc-card {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.85rem 1.1rem;
        margin-bottom: 1rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
        line-height: 1.5;
    }
    .lesson-item, .lesson-row {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 0.75rem 1rem;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        text-decoration: none;
        transition: all 0.15s ease;
        gap: 0.75rem;
    }
    .lesson-item:hover, .lesson-row:hover {
        border-color: var(--primary);
        background: var(--bg-page);
        transform: translateX(2px);
    }
    .lesson-title {
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.88rem;
    }

    /* Course Selection Dropdown & Secondaries */
    .course-select-dropdown {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-primary);
        padding: 0.35rem 0.75rem;
        border-radius: 8px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
    }
    .course-select-dropdown:focus {
        border-color: var(--primary);
    }

    /* Responsive Rules */
    @media (max-width: 900px) {
        .metrics-deck {
            grid-template-columns: repeat(2, 1fr);
        }
    }
    @media (max-width: 768px) {
        .metrics-deck {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.6rem;
            margin-bottom: 1.25rem;
        }
        .metric-tile {
            padding: 0.75rem 0.85rem;
            gap: 0.65rem;
        }
        .metric-icon-box {
            width: 32px;
            height: 32px;
        }
        .metric-value {
            font-size: 1.15rem;
        }
        .dual-banners-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
        }
        .clean-action-card {
            padding: 0.85rem 1rem;
        }
        .course-showcase-card {
            padding: 0.85rem 1rem;
        }
        .curriculum-toolbar-box {
            padding: 0.75rem 0.85rem;
            gap: 0.65rem;
        }
        .toolbar-top-row {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
        }
        .module-select-filter {
            width: 100%;
            min-width: 0;
            padding: 0.48rem 0.75rem;
            font-size: 0.82rem;
        }
        .search-input-wrapper {
            width: 100%;
            min-width: 0;
        }
        input[type="text"].curriculum-search-box {
            font-size: 0.82rem;
            padding: 0.48rem 0.75rem 0.48rem 2.4rem;
        }
    }
    @media (max-width: 480px) {
        .greeting-title-block h1 {
            font-size: 1.25rem;
        }
        .hero-badge-pill {
            display: none;
        }
        .metrics-deck {
            gap: 0.45rem;
        }
        .metric-tile {
            padding: 0.6rem 0.7rem;
        }
    }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container">
        <!-- Hero Header & Greeting -->
        <section class="dashboard-hero-deck">
            <div class="hero-greeting-bar">
                <div class="greeting-title-block">
                    <h1>
                        <span id="studentGreetingIcon"><?php echo $greetingIcon; ?></span>
                        <span id="studentGreetingText"><?php echo $greeting; ?>, <?php echo e($studentName); ?></span>
                    </h1>
                    <p>Track your progress, join live mentoring, and master your technical skills.</p>
                </div>
                <div class="hero-badge-pill">
                    <span class="pulse-dot"></span>
                    <span>Active Enrollment</span>
                    <span>•</span>
                    <strong style="color: #6366f1;"><?php echo count($modules); ?> Modules</strong>
                </div>
            </div>

            <!-- Academic Standing & Cohort Overview -->
            <div class="academic-standing-card" style="border-radius: 14px; padding: 1rem 1.35rem; margin-bottom: 1.25rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <div style="display: flex; align-items: center; gap: 0.85rem; flex-wrap: wrap;">
                    <div class="standing-pill">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #10b981;"></span>
                        <strong>Good Standing</strong>
                    </div>

                    <div style="font-size: 0.82rem;">
                        <span>Track: <strong><?php echo e($currentCourse['title'] ?? 'Software Engineering'); ?></strong></span>
                    </div>

                    <div style="font-size: 0.82rem;">
                        <span>Cohort: <strong>Active 2026 Batch</strong></span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <a href="support" class="btn btn-secondary btn-sm" style="font-size: 0.78rem; padding: 0.35rem 0.8rem;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span>Faculty Office Hours</span>
                    </a>
                </div>
            </div>

            <!-- Active Course Showcase Card -->
            <div class="course-showcase-card">
                <div class="course-showcase-left">
                    <div class="course-icon-badge">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    </div>
                    <div class="course-showcase-meta">
                        <h2><?php echo e($currentCourse['title'] ?? 'Course Title'); ?></h2>
                        <div class="meta-tags">
                            <span>🎓 <?php echo e($currentCourse['level'] ?? 'All Levels'); ?></span>
                            <span>•</span>
                            <span>⏱️ <?php echo e($currentCourse['duration'] ?? 'Self-Paced'); ?></span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="printFormattedSyllabus()" style="font-size: 0.78rem; padding: 0.35rem 0.8rem;" title="Print or save course syllabus PDF">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        <span>Export Syllabus</span>
                    </button>

                    <?php if (count($enrolledCourses) > 1): ?>
                    <div>
                        <label for="courseSelect" style="display:none;">Switch Course</label>
                        <select id="courseSelect" class="course-select-dropdown" onchange="window.location.href = 'dashboard?course_id=' + this.value">
                            <?php foreach ($enrolledCourses as $course): ?>
                                <option value="<?php echo $course['id']; ?>" <?php echo $course['id'] == $selectedCourseId ? 'selected' : ''; ?>>
                                    <?php echo e($course['title']); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- Dual Smart Action Deck -->
        <section class="dual-banners-grid">
            <!-- 1. Live Mentorship Classroom Banner -->
            <div class="clean-action-card live-card">
                <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: #eef2ff; color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem; flex-wrap: wrap;">
                            <span class="live-batch-pill">● LIVE BATCH</span>
                            <strong style="font-size: 0.92rem; color: #0f172a;">Weekend Mentorship & Code-Along</strong>
                        </div>
                        <p style="font-size: 0.78rem; color: #64748b; margin: 0 0 0.4rem 0;">
                            Every Sat & Sun • 10:00 AM – 12:30 PM IST • Interactive Q&A
                        </p>
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.72rem;">
                            <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Weekend+Mentorship+%26+Code-Along+-+Education+Algorithm&details=Live+Technical+Workshop+and+Code+Lab.+Join+Link:+https://meet.google.com&location=Online+Classroom&recur=RRULE:FREQ=WEEKLY;BYDAY=SA,SU" target="_blank" rel="noopener noreferrer" style="color: #4f46e5; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem;">
                                📅 Add to Google Calendar
                            </a>
                            <span style="color: #cbd5e1;">•</span>
                            <button type="button" onclick="downloadIcsSchedule()" style="background: none; border: none; color: #64748b; padding: 0; font-size: 0.72rem; cursor: pointer; text-decoration: underline;">
                                📥 .ics Calendar
                            </button>
                        </div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; margin-top: 0.25rem;">
                    <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size: 0.82rem; padding: 0.45rem 1rem;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        <span>Join Live Classroom</span>
                    </a>
                </div>
            </div>

            <!-- 2. Smart Start / Resume Learning Banner -->
            <?php if ($nextUpLesson && $overallPercent < 100): 
                $isNewStudent = ($doneCourseItems === 0);
                $badgeTitle = $isNewStudent ? '🚀 Start Learning' : '▶️ Continue Learning';
                $buttonText = $isNewStudent ? 'Start Lectures →' : 'Continue Lectures →';
            ?>
            <div class="clean-action-card resume-card">
                <div>
                    <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.9; font-weight: 800;"><?php echo $badgeTitle; ?></div>
                    <h3 style="color: #ffffff; font-size: 1.05rem; margin-top: 0.25rem; line-height: 1.35;"><?php echo e($nextUpLesson['title']); ?></h3>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <a href="<?php echo e($nextUpLesson['url']); ?>" class="btn btn-secondary" style="background: rgba(255,255,255,0.2); color: #ffffff; border: 1.5px solid rgba(255,255,255,0.6); font-weight: 800; font-size: 0.84rem; padding: 0.5rem 1.15rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15);">
                        <?php echo $buttonText; ?>
                    </a>
                </div>
            </div>
            <?php else: ?>
            <div class="clean-action-card completion-alert-card">
                <div>
                    <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: #15803d; font-weight: 700;">Course Completion</div>
                    <h3 style="color: #14532d; font-size: 1.05rem; margin-top: 0.25rem;">Congratulations! You finished all modules 🎉</h3>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <a href="certificates" class="btn btn-primary" style="background: #16a34a; border: none; font-size: 0.82rem; padding: 0.45rem 1rem;">
                        Claim Certificate 🏆
                    </a>
                </div>
            </div>
            <?php endif; ?>
        </section>

        <!-- Unified Single-Column Progress & Mastery Deck -->
        <section class="single-col-progress-deck">
            <div class="sc-progress-main">
                <div class="sc-progress-meta">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.45rem; flex-wrap: wrap; gap: 0.5rem;">
                        <span style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Overall Course Progress</span>
                        <strong style="font-size: 1.25rem; font-weight: 800; color: #6366f1;"><?php echo $overallPercent; ?>%</strong>
                    </div>
                    <div class="progress-track" style="height: 8px; border-radius: 9999px; background: #e2e8f0; overflow: hidden;">
                        <div class="progress-fill <?php echo $overallPercent >= 100 ? 'success' : ''; ?>" style="width: <?php echo $overallPercent; ?>%; height: 100%; border-radius: 9999px; background: linear-gradient(90deg, #6366f1, #10b981); transition: width 0.4s ease;"></div>
                    </div>
                </div>

                <div class="sc-metrics-row">
                    <div class="sc-metric-item">
                        <span class="sc-dot indigo"></span>
                        <span style="color: var(--text-muted);">Lessons:</span>
                        <strong><?php echo $doneCourseItems; ?> / <?php echo $totalCourseItems; ?> Done</strong>
                    </div>
                    <div class="sc-metric-item">
                        <span class="sc-dot emerald"></span>
                        <span style="color: var(--text-muted);">Quizzes:</span>
                        <strong><?php echo $passedQuizzesCount; ?> / <?php echo $totalQuizzes; ?> Passed</strong>
                    </div>
                    <div class="sc-metric-item">
                        <span class="sc-dot rose"></span>
                        <span style="color: var(--text-muted);">Assignments:</span>
                        <strong><?php echo $submittedAssignmentsCount; ?> / <?php echo $totalAssignments; ?> Submitted</strong>
                    </div>
                </div>
            </div>
        </section>

        <!-- Course Curriculum Studio Section -->
        <section class="curriculum-studio">
            <div class="studio-header">
                <div class="studio-title-wrap">
                    <h2>Course Curriculum</h2>
                    <p><?php echo count($modules); ?> Structured Modules • <?php echo $totalCourseItems; ?> Interactive Learning Materials</p>
                </div>
                <div class="studio-header-actions">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="expandAllModules(true)" title="Expand all modules">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                        <span>Expand All</span>
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="expandAllModules(false)" title="Collapse all modules">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
                        <span>Collapse All</span>
                    </button>
                </div>
            </div>

            <!-- Curriculum Search & Filter Toolbar Deck -->
            <?php if (!empty($modules)): ?>
            <div class="curriculum-toolbar-box">
                <div class="toolbar-top-row">
                    <!-- Module Select Dropdown -->
                    <select id="curriculumModuleFilter" class="module-select-filter" onchange="filterModuleSelect(this.value)" aria-label="Jump to Module">
                        <option value="all">📚 All Modules (<?php echo count($modules); ?> Total)</option>
                        <?php foreach ($modules as $idx => $mod): ?>
                            <option value="<?php echo $mod['id']; ?>">
                                Module <?php echo $idx + 1; ?>: <?php echo e($mod['title']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>

                    <!-- Real-Time Search Bar -->
                    <div class="search-input-wrapper">
                        <svg class="search-icon-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input type="text" id="lessonSearchInput" class="curriculum-search-box" style="padding-left: 2.6rem !important;" placeholder="Search lectures, notes, quizzes, code..." oninput="searchCurriculumLessons(this.value)" autocomplete="off">
                    </div>
                </div>

                <!-- Content Type Segmented Filter Buttons -->
                <div class="content-type-filter-row">
                    <button type="button" class="type-filter-btn active" data-type="all" onclick="filterContentType('all', this)">
                        <span>All Content</span>
                        <span style="opacity:0.75;">(<?php echo $totalCourseItems; ?>)</span>
                    </button>
                    <button type="button" class="type-filter-btn" data-type="video" onclick="filterContentType('video', this)">
                        <span>🎬 Videos</span>
                        <span style="opacity:0.75;">(<?php echo $totalVideosCount; ?>)</span>
                    </button>
                    <button type="button" class="type-filter-btn" data-type="note" onclick="filterContentType('note', this)">
                        <span>📄 PDF Notes</span>
                        <span style="opacity:0.75;">(<?php echo $totalNotesCount; ?>)</span>
                    </button>
                    <button type="button" class="type-filter-btn" data-type="code" onclick="filterContentType('code', this)">
                        <span>💻 Code Snippets</span>
                        <span style="opacity:0.75;">(<?php echo $totalCodeCount; ?>)</span>
                    </button>
                    <button type="button" class="type-filter-btn" data-type="quiz" onclick="filterContentType('quiz', this)">
                        <span>📝 Quizzes</span>
                        <span style="opacity:0.75;">(<?php echo $totalQuizzes; ?>)</span>
                    </button>
                </div>

                <!-- Single-Row Fast Scroll Category Pills -->
                <div class="curriculum-pills-row" id="modulePillContainer">
                    <button type="button" class="curr-pill active" data-filter="all" onclick="filterModuleView('all', this)">
                        <span>All Modules</span>
                        <span class="pill-badge"><?php echo count($modules); ?></span>
                    </button>
                    <?php foreach ($modules as $idx => $mod): ?>
                    <button type="button" class="curr-pill" data-filter="<?php echo $mod['id']; ?>" onclick="filterModuleView(<?php echo $mod['id']; ?>, this)">
                        <span class="pill-badge"><?php echo $idx + 1; ?></span>
                        <span><?php echo e(mb_strimwidth($mod['title'], 0, 22, '...')); ?></span>
                    </button>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <?php if (empty($modules)): ?>
                <div class="card" style="text-align: center; padding: 3rem 1rem;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-muted); margin-bottom: 1rem;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <h3>No modules published yet</h3>
                    <p style="margin-top: 0.5rem; color: #64748b;">The course material is currently being organized. Check back soon!</p>
                </div>
            <?php endif; ?>

            <!-- Module Accordions List -->
            <div id="modulesAccordionList">
            <?php 
            $urlModId = isset($_GET['module_id']) ? (int)$_GET['module_id'] : 0;
            foreach ($modules as $index => $m):
                $mid = $m["id"];
                $items = array_merge($videosByModule[$mid] ?? [], $notesByModule[$mid] ?? [], $codeByModule[$mid] ?? []);
                $moduleTotal = count($items);
                $moduleDone = 0;
                foreach (($videosByModule[$mid] ?? []) as $v) if (isset($completed["video_" . $v["id"]])) $moduleDone++;
                foreach (($notesByModule[$mid] ?? []) as $n) if (isset($completed["note_" . $n["id"]])) $moduleDone++;
                foreach (($codeByModule[$mid] ?? []) as $c) if (isset($completed["code_" . $c["id"]])) $moduleDone++;
                $isModuleComplete = ($moduleTotal > 0 && $moduleDone === $moduleTotal);
                $isOpen = ($urlModId > 0 ? ($urlModId === (int)$mid) : ($index === 0));
            ?>
            <article class="module-accordion <?php echo $isOpen ? 'open' : ''; ?>" id="module-<?php echo $mid; ?>" data-module-id="<?php echo $mid; ?>">
                <div class="module-header" role="button" tabindex="0" aria-expanded="<?php echo $isOpen ? 'true' : 'false'; ?>" onclick="toggleModuleAccordion(this)">
                    <div class="module-title-group">
                        <div class="module-number"><?php echo $index + 1; ?></div>
                        <div class="module-meta">
                            <h3><?php echo e($m["title"]); ?></h3>
                            <div class="module-subtext">
                                <span><?php echo $moduleTotal; ?> <?php echo $moduleTotal === 1 ? 'lesson' : 'lessons'; ?></span>
                                <?php if ($moduleTotal > 0): ?>
                                    <span>•</span>
                                    <span style="color: <?php echo $isModuleComplete ? '#10b981' : 'inherit'; ?>; font-weight: 600;"><?php echo $moduleDone; ?>/<?php echo $moduleTotal; ?> done</span>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                    <div class="module-status-group">
                        <?php if ($isModuleComplete): ?>
                            <span class="badge paid" style="font-size: 0.72rem;">✓ Completed</span>
                        <?php elseif ($moduleDone > 0): ?>
                            <span class="badge pending" style="font-size: 0.72rem;"><?php echo $moduleDone; ?>/<?php echo $moduleTotal; ?></span>
                        <?php endif; ?>
                        <span class="module-chevron">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                        </span>
                    </div>
                </div>

                <div class="module-body">
                    <?php if (!empty($m["description"])): ?>
                        <div class="module-desc-card">
                            <?php echo nl2br(e($m["description"])); ?>
                        </div>
                    <?php endif; ?>

                    <div class="lesson-list">
                        <?php if ($moduleTotal === 0 && !isset($quizzesByModule[$mid]) && empty($assignmentsByModule[$mid])): ?>
                            <p style="font-size: 0.88rem; color: var(--text-muted); padding: 0.5rem 0;">No content added to this module yet.</p>
                        <?php endif; ?>

                        <!-- Videos -->
                        <?php foreach (($videosByModule[$mid] ?? []) as $v):
                            $isDone = isset($completed["video_" . $v["id"]]);
                        ?>
                        <a href="watch?id=<?php echo $v['id']; ?>" class="lesson-item" data-item-type="video" data-title="<?php echo strtolower(e($v["title"])); ?>">
                            <div class="lesson-left">
                                <div class="lesson-type-badge video" title="Video Lecture">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                </div>
                                <span class="lesson-title"><?php echo e($v["title"]); ?></span>
                            </div>
                            <div class="lesson-right">
                                <?php if (!empty($v["duration"])): ?>
                                    <span class="mono" style="color: var(--text-muted); font-size: 0.75rem;"><?php echo e($v["duration"]); ?></span>
                                <?php endif; ?>
                                <div class="completion-check <?php echo $isDone ? 'completed' : ''; ?>" title="<?php echo $isDone ? 'Completed' : 'Not completed'; ?>">
                                    ✓
                                </div>
                            </div>
                        </a>
                        <?php endforeach; ?>

                        <!-- PDF Notes -->
                        <?php foreach (($notesByModule[$mid] ?? []) as $n):
                            $isDone = isset($completed["note_" . $n["id"]]);
                        ?>
                        <a href="note-view?id=<?php echo $n['id']; ?>" class="lesson-item" data-item-type="note" data-title="<?php echo strtolower(e($n["title"])); ?>">
                            <div class="lesson-left">
                                <div class="lesson-type-badge note" title="PDF Document">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </div>
                                <span class="lesson-title"><?php echo e($n["title"]); ?></span>
                            </div>
                            <div class="lesson-right">
                                <span class="badge neutral" style="font-size: 0.68rem;">PDF</span>
                                <div class="completion-check <?php echo $isDone ? 'completed' : ''; ?>">
                                    ✓
                                </div>
                            </div>
                        </a>
                        <?php endforeach; ?>

                        <!-- Code Snippets -->
                        <?php foreach (($codeByModule[$mid] ?? []) as $c):
                            $isDone = isset($completed["code_" . $c["id"]]);
                        ?>
                        <a href="code-view?id=<?php echo $c['id']; ?>" class="lesson-item" data-item-type="code" data-title="<?php echo strtolower(e($c["title"])); ?>">
                            <div class="lesson-left">
                                <div class="lesson-type-badge code" title="Code Snippet">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                                </div>
                                <span class="lesson-title"><?php echo e($c["title"]); ?></span>
                            </div>
                            <div class="lesson-right">
                                <span class="badge neutral" style="font-size: 0.68rem;"><?php echo strtoupper(e($c['language'] ?? 'CODE')); ?></span>
                                <div class="completion-check <?php echo $isDone ? 'completed' : ''; ?>">
                                    ✓
                                </div>
                            </div>
                        </a>
                        <?php endforeach; ?>
                    </div>

                    <!-- Module Quiz Card -->
                    <?php if (isset($quizzesByModule[$mid])):
                        $quiz = $quizzesByModule[$mid];
                        $attempt = $attempts[$quiz["id"]] ?? null;
                        $hasPassed = $attempt && $attempt["ever_passed"];
                    ?>
                    <div class="assessment-card quiz" data-item-type="quiz">
                        <div>
                            <div class="badge <?php echo $hasPassed ? 'paid' : 'neutral'; ?>" style="margin-bottom: 0.35rem;">
                                <?php echo $hasPassed ? 'Passed' : 'Assessment'; ?>
                            </div>
                            <h4 style="font-size: 1rem;"><?php echo e($quiz["title"]); ?></h4>
                            <?php if ($attempt): ?>
                                <p style="font-size: 0.82rem; margin-top: 0.2rem;">
                                    Best Score: <strong><?php echo $attempt["best_score"]; ?> / <?php echo $attempt["total_questions"]; ?></strong>
                                    <?php echo $hasPassed ? '— <span style="color: #047857; font-weight:600;">Meets pass criteria</span>' : '— <span style="color: #b91c1c; font-weight:600;">Below passing score</span>'; ?>
                                </p>
                            <?php else: ?>
                                <p style="font-size: 0.82rem; margin-top: 0.2rem; color: #64748b;">
                                    Passing threshold: <?php echo (int)($quiz['pass_percent'] ?? 50); ?>% • <?php echo !empty($quiz['time_limit_minutes']) ? $quiz['time_limit_minutes'] . ' min timer' : 'No time limit'; ?>
                                </p>
                            <?php endif; ?>
                        </div>
                        <a href="quiz?id=<?php echo $quiz['id']; ?>" class="btn btn-primary btn-sm">
                            <?php echo $attempt ? 'Retake Quiz' : 'Start Quiz →'; ?>
                        </a>
                    </div>
                    <?php endif; ?>

                    <!-- Module Assignments -->
                    <?php foreach (($assignmentsByModule[$mid] ?? []) as $a):
                        $sub = $submissionByAssignment[$a["id"]] ?? null;
                    ?>
                    <div class="assessment-card assignment" data-item-type="assignment">
                        <div>
                            <div class="badge <?php echo $sub ? ($sub['status'] === 'approved' ? 'approved' : ($sub['status'] === 'rejected' ? 'rejected' : 'submitted')) : 'neutral'; ?>" style="margin-bottom: 0.35rem;">
                                <?php if (!$sub): ?>Assignment Pending
                                <?php elseif ($sub['status'] === 'submitted'): ?>Under Review
                                <?php elseif ($sub['status'] === 'approved'): ?>Approved (<?php echo $sub['marks'] !== null ? $sub['marks'] . ' marks' : 'Passed'; ?>)
                                <?php else: ?>Needs Revisions
                                <?php endif; ?>
                            </div>
                            <h4 style="font-size: 1rem;"><?php echo e($a["title"]); ?></h4>
                            <?php if (!empty($a['due_date'])): ?>
                                <p style="font-size: 0.82rem; margin-top: 0.2rem; color: #64748b;">
                                    Due Date: <?php echo date('M d, Y', strtotime($a['due_date'])); ?>
                                </p>
                            <?php endif; ?>
                        </div>
                        <a href="assignment?id=<?php echo $a['id']; ?>" class="btn btn-secondary btn-sm" style="border-color: #fed7aa;">
                            <?php echo $sub ? 'View Submission' : 'Submit Assignment →'; ?>
                        </a>
                    </div>
                    <?php endforeach; ?>
                </div>
            </article>
            <?php endforeach; ?>
            </div>
        </section>
    </main>

    <script>
    let currentModuleFilter = 'all';
    let currentContentTypeFilter = 'all';
    let currentSearchQuery = '';

    // Robust Touch & Click Accordion Handler
    function toggleModuleAccordion(headerEl) {
        const accordion = headerEl.closest('.module-accordion');
        if (!accordion) return;
        const isOpen = accordion.classList.contains('open');
        if (isOpen) {
            accordion.classList.remove('open');
            headerEl.setAttribute('aria-expanded', 'false');
        } else {
            accordion.classList.add('open');
            headerEl.setAttribute('aria-expanded', 'true');
        }
    }

    // Expand / Collapse all modules
    function expandAllModules(expand = true) {
        document.querySelectorAll('.module-accordion').forEach(acc => {
            if (expand) {
                acc.classList.add('open');
                const hdr = acc.querySelector('.module-header');
                if (hdr) hdr.setAttribute('aria-expanded', 'true');
            } else {
                acc.classList.remove('open');
                const hdr = acc.querySelector('.module-header');
                if (hdr) hdr.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Filter by Dropdown Selector
    function filterModuleSelect(modId) {
        currentModuleFilter = String(modId);
        // Sync with pill active states
        document.querySelectorAll('.curr-pill').forEach(pill => {
            if (pill.dataset.filter === currentModuleFilter) {
                pill.classList.add('active');
                pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            } else {
                pill.classList.remove('active');
            }
        });
        applyAllFilters();
    }

    // Filter by Horizontal Pill Button
    function filterModuleView(modId, btn) {
        currentModuleFilter = String(modId);
        document.querySelectorAll('.curr-pill').forEach(b => b.classList.remove('active'));
        if (btn) {
            btn.classList.add('active');
            btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }

        // Sync dropdown
        const select = document.getElementById('curriculumModuleFilter');
        if (select) select.value = modId;

        applyAllFilters();
    }

    // Filter by Content Type (All, Video, Note, Code, Quiz)
    function filterContentType(type, btn) {
        currentContentTypeFilter = type;
        document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        applyAllFilters();
    }

    // Real-time Lesson Keyword Search
    function searchCurriculumLessons(query) {
        currentSearchQuery = query.trim().toLowerCase();
        applyAllFilters();
    }

    // Unified Master Filter Dispatcher
    function applyAllFilters() {
        const accordions = document.querySelectorAll('.module-accordion');
        
        accordions.forEach(acc => {
            const modId = acc.dataset.moduleId;
            const matchesModule = (currentModuleFilter === 'all' || modId === currentModuleFilter);

            if (!matchesModule) {
                acc.style.display = 'none';
                return;
            }

            let hasVisibleLessons = false;

            // Check lesson items
            const lessonItems = acc.querySelectorAll('.lesson-item');
            lessonItems.forEach(item => {
                const itemType = item.dataset.itemType;
                const title = (item.dataset.title || item.textContent).toLowerCase();
                const matchesType = (currentContentTypeFilter === 'all' || itemType === currentContentTypeFilter);
                const matchesQuery = (!currentSearchQuery || title.includes(currentSearchQuery));

                if (matchesType && matchesQuery) {
                    item.style.display = '';
                    hasVisibleLessons = true;
                } else {
                    item.style.display = 'none';
                }
            });

            // Check quiz cards
            const quizCards = acc.querySelectorAll('.assessment-card.quiz');
            quizCards.forEach(qc => {
                const matchesType = (currentContentTypeFilter === 'all' || currentContentTypeFilter === 'quiz');
                const title = qc.textContent.toLowerCase();
                const matchesQuery = (!currentSearchQuery || title.includes(currentSearchQuery));
                if (matchesType && matchesQuery) {
                    qc.style.display = '';
                    hasVisibleLessons = true;
                } else {
                    qc.style.display = 'none';
                }
            });

            // Check assignment cards
            const asgnCards = acc.querySelectorAll('.assessment-card.assignment');
            asgnCards.forEach(ac => {
                const matchesType = (currentContentTypeFilter === 'all' || currentContentTypeFilter === 'assignment');
                const title = ac.textContent.toLowerCase();
                const matchesQuery = (!currentSearchQuery || title.includes(currentSearchQuery));
                if (matchesType && matchesQuery) {
                    ac.style.display = '';
                    hasVisibleLessons = true;
                } else {
                    ac.style.display = 'none';
                }
            });

            // If a search query or filter is active, auto-open accordion if there are visible items
            if (currentSearchQuery || currentContentTypeFilter !== 'all' || currentModuleFilter !== 'all') {
                if (hasVisibleLessons) {
                    acc.style.display = '';
                    acc.classList.add('open');
                    const hdr = acc.querySelector('.module-header');
                    if (hdr) hdr.setAttribute('aria-expanded', 'true');
                } else {
                    acc.style.display = 'none';
                }
            } else {
                acc.style.display = '';
            }
        });
    }

    // Keyboard navigation for module headers
    document.addEventListener('keydown', function(e) {
        if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.classList.contains('module-header')) {
            e.preventDefault();
            toggleModuleAccordion(document.activeElement);
        }
    });

    // Check for target module in hash or URL query on initial load
    window.addEventListener('DOMContentLoaded', function() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#module-')) {
            const target = document.querySelector(hash);
            if (target) {
                target.classList.add('open');
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // 1. Download .ics Calendar File for Apple / Outlook
    
    // Window Syllabus Data Payload for Instant PDF Export
    window.SYLLABUS_EXPORT_DATA = <?php echo json_encode($syllabusExportPayload, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;

    // Professional Formatted Syllabus PDF Exporter & Print Window
    function printFormattedSyllabus() {
        const data = window.SYLLABUS_EXPORT_DATA;
        if (!data) {
            alert('Syllabus data is loading, please try again in a moment.');
            return;
        }

        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (!printWindow) {
            alert('Please allow popup windows in your browser to export the syllabus document.');
            return;
        }

        let modulesHtml = '';
        if (data.modules && data.modules.length > 0) {
            data.modules.forEach((mod, idx) => {
                let itemsHtml = '';
                if (mod.items && mod.items.length > 0) {
                    itemsHtml = '<ul style="margin: 8px 0 0 16px; padding: 0; color: #475569; font-size: 13px; line-height: 1.6;">' +
                        mod.items.map(item => `<li><strong>[${item.type}]</strong> ${escapeHtml(item.title)} ${item.duration ? '<span style="color:#94a3b8; font-size:11px;">(' + escapeHtml(item.duration) + ')</span>' : ''}</li>`).join('') +
                        '</ul>';
                } else {
                    itemsHtml = '<p style="color:#94a3b8; font-size:13px; font-style:italic; margin: 4px 0 0 16px;">Curriculum topics and live sessions scheduled for this module.</p>';
                }

                modulesHtml += `
                    <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; page-break-inside: avoid;">
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
                                <span style="color: #4f46e5; margin-right: 6px;">Chapter ${idx + 1}:</span> ${escapeHtml(mod.title)}
                            </h3>
                        </div>
                        ${mod.description ? `<p style="font-size: 12.5px; color: #64748b; margin: 4px 0 8px 0;">${escapeHtml(mod.description)}</p>` : ''}
                        ${itemsHtml}
                    </div>
                `;
            });
        } else {
            modulesHtml = '<p style="color:#64748b; font-size:14px; padding: 20px; text-align:center; background:#f8fafc; border-radius:8px;">No curriculum modules published yet.</p>';
        }

        function escapeHtml(str) {
            if (!str) return '';
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        const docHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${escapeHtml(data.course_title)} — Official Syllabus</title>
                <style>
                    @page { size: A4; margin: 15mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; margin: 0; padding: 20px; line-height: 1.5; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4f46e5; padding-bottom: 14px; margin-bottom: 20px; }
                    .brand-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; margin: 0; }
                    .badge { background: #eef2ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #c7d2fe; }
                    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 20px; }
                    .meta-item small { font-size: 10.5px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; }
                    .meta-item strong { font-size: 13px; color: #0f172a; }
                    .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
                    @media print {
                        .no-print { display: none !important; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="background: #0f172a; color: #fff; padding: 12px 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; font-weight: 600;">📄 Ready to print or export as PDF</span>
                    <button onclick="window.print()" style="background: #4f46e5; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 13px;">🖨️ Print / Save as PDF</button>
                </div>
                <div class="header">
                    <div>
                        <h1 class="brand-title">🎓 Education Algorithm</h1>
                        <p style="margin: 2px 0 0; font-size: 12px; color: #64748b;">Enterprise Engineering & Deep-Tech Cohort</p>
                    </div>
                    <span class="badge">OFFICIAL SYLLABUS SPECIFICATION</span>
                </div>

                <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">${escapeHtml(data.course_title)}</h2>
                <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">${escapeHtml(data.course_desc)}</p>

                <div class="meta-grid">
                    <div class="meta-item"><small>Curriculum Duration</small><strong>${escapeHtml(data.duration)}</strong></div>
                    <div class="meta-item"><small>Academic Level</small><strong>${escapeHtml(data.level)}</strong></div>
                    <div class="meta-item"><small>Total Chapters</small><strong>${data.total_modules} Modules</strong></div>
                    <div class="meta-item"><small>Verified For</small><strong>${escapeHtml(data.student_name || 'Enrolled Scholar')}</strong></div>
                </div>

                <h3 style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 20px 0 14px 0; text-transform: uppercase; letter-spacing: 0.5px; border-left: 4px solid #4f46e5; padding-left: 10px;">
                    Detailed Curriculum Chapters & Lessons
                </h3>

                <div class="modules-container">
                    ${modulesHtml}
                </div>

                <div class="footer">
                    <span>Education Algorithm • Academic Cohort 2026</span>
                    <span>Document Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                        }, 400);
                    };
                <\/script>
            </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.documentElement.innerHTML = docHtml;
        printWindow.document.close();
    }

    function downloadIcsSchedule() {
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Education Algorithm//LMS Cohort//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            'SUMMARY:Weekend Mentorship & Code-Along (Education Algorithm)',
            'DESCRIPTION:Live Interactive Mentoring and Hands-on Code Lab.\\nJoin URL: https://meet.google.com',
            'LOCATION:Online Classroom',
            'RRULE:FREQ=WEEKLY;BYDAY=SA,SU',
            'DTSTART:' + new Date().toISOString().slice(0,10).replace(/-/g,'') + 'T043000Z',
            'DTEND:' + new Date().toISOString().slice(0,10).replace(/-/g,'') + 'T070000Z',
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'education_algorithm_mentorship.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.showToast) window.showToast('success', 'Calendar schedule downloaded (.ics)');
    }

    // 3. Client-Side Real-Time Greeting Synchronization
    (function() {
        try {
            const h = new Date().getHours();
            let g = "Good morning", icon = "☀️";
            if (h >= 12 && h < 17) { g = "Good afternoon"; icon = "🌤️"; }
            else if (h >= 17 || h < 5) { g = "Good evening"; icon = "🌙"; }
            const gEl = document.getElementById('studentGreetingText');
            const iEl = document.getElementById('studentGreetingIcon');
            if (gEl) gEl.innerText = g + ", <?php echo e($studentName); ?>";
            if (iEl) iEl.innerText = icon;
        } catch(e) {}
    })();
    </script>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>


