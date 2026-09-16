<?php
/**
 * Spotlight Search API Endpoint for Universal Command Palette
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['results' => []]);
    exit;
}

$q = trim($_GET['q'] ?? '');
$results = [];

// Base Navigation Links
$navLinks = [
    ['title' => 'Curriculum Dashboard', 'category' => 'Navigation', 'url' => 'dashboard', 'icon' => '📚'],
    ['title' => 'Certificates & Credentials', 'category' => 'Navigation', 'url' => 'certificates', 'icon' => '🎓'],
    ['title' => 'Profile & Security', 'category' => 'Navigation', 'url' => 'profile', 'icon' => '👤'],
    ['title' => 'Announcements & Alerts', 'category' => 'Navigation', 'url' => 'notifications', 'icon' => '🔔'],
    ['title' => 'Help & Support Desk', 'category' => 'Navigation', 'url' => 'support', 'icon' => '💬'],
    ['title' => 'Payment History & Invoices', 'category' => 'Navigation', 'url' => 'payment-history', 'icon' => '💳'],
];

if (empty($q)) {
    // Return top navigation links & recent modules
    $results = array_merge($results, $navLinks);
    try {
        $recentModules = $pdo->query("SELECT id, title FROM modules ORDER BY sort_order ASC LIMIT 5")->fetchAll();
        foreach ($recentModules as $m) {
            $results[] = [
                'title' => $m['title'],
                'category' => 'Module',
                'url' => 'dashboard#module-' . $m['id'],
                'icon' => '📦'
            ];
        }
    } catch (Exception $e) {}
    echo json_encode(['results' => $results]);
    exit;
}

$safeQ = addcslashes($q, '%_');
$term = '%' . $safeQ . '%';

// 1. Search Nav Links
foreach ($navLinks as $nl) {
    if (stripos($nl['title'], $q) !== false) {
        $results[] = $nl;
    }
}

$studentId = $_SESSION['student_id'] ?? 0;
$isAdmin = !empty($_SESSION['admin_id']);
$isInstructor = !empty($_SESSION['instructor_id']);

$enrolledCourses = ($studentId > 0 && !$isAdmin && !$isInstructor) ? getStudentCourses($studentId) : [];
$enrolledCourseIds = array_column($enrolledCourses, 'id');

// If student is logged in with no active enrollments, return only navigation links
if ($studentId > 0 && !$isAdmin && !$isInstructor && empty($enrolledCourseIds)) {
    echo json_encode(['results' => array_slice($results, 0, 6)]);
    exit;
}

$coursePlaceholder = '';
$courseParams = [];
if (!empty($enrolledCourseIds) && !$isAdmin && !$isInstructor) {
    $coursePlaceholder = 'AND m.course_id IN (' . implode(',', array_fill(0, count($enrolledCourseIds), '?')) . ')';
    $courseParams = $enrolledCourseIds;
}

// 2. Search Videos
try {
    $sql = "SELECT v.id, v.title, m.title as module_title 
            FROM videos v 
            JOIN modules m ON v.module_id = m.id 
            WHERE (v.title LIKE ? OR m.title LIKE ?) {$coursePlaceholder}
            LIMIT 8";
    $params = array_merge([$term, $term], $courseParams);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        $results[] = [
            'title' => $row['title'],
            'category' => 'Video Lecture',
            'subtitle' => $row['module_title'],
            'url' => 'watch?id=' . $row['id'],
            'icon' => '🎬'
        ];
    }
} catch (Exception $e) {}

// 3. Search PDF Notes
try {
    $sql = "SELECT n.id, n.title, m.title as module_title 
            FROM notes n 
            JOIN modules m ON n.module_id = m.id 
            WHERE (n.title LIKE ? OR m.title LIKE ?) {$coursePlaceholder}
            LIMIT 6";
    $params = array_merge([$term, $term], $courseParams);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        $results[] = [
            'title' => $row['title'],
            'category' => 'PDF Note',
            'subtitle' => $row['module_title'],
            'url' => 'note-view?id=' . $row['id'],
            'icon' => '📄'
        ];
    }
} catch (Exception $e) {}

// 4. Search Code Snippets
try {
    $sql = "SELECT c.id, c.title, c.language, m.title as module_title 
            FROM code_snippets c 
            JOIN modules m ON c.module_id = m.id 
            WHERE (c.title LIKE ? OR c.language LIKE ?) {$coursePlaceholder}
            LIMIT 6";
    $params = array_merge([$term, $term], $courseParams);
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        $results[] = [
            'title' => $row['title'] . ' (' . strtoupper($row['language']) . ')',
            'category' => 'Code Snippet',
            'subtitle' => $row['module_title'],
            'url' => 'code-view?id=' . $row['id'],
            'icon' => '💻'
        ];
    }
} catch (Exception $e) {}

// 5. Search Quizzes & Assignments
try {
    $quizPlaceholder = '';
    if (!empty($enrolledCourseIds) && !$isAdmin && !$isInstructor) {
        $quizPlaceholder = 'JOIN modules m ON q.module_id = m.id WHERE q.title LIKE ? AND m.course_id IN (' . implode(',', array_fill(0, count($enrolledCourseIds), '?')) . ')';
        $params = array_merge([$term], $enrolledCourseIds);
    } else {
        $quizPlaceholder = 'WHERE q.title LIKE ?';
        $params = [$term];
    }
    $stmt = $pdo->prepare("SELECT q.id, q.title FROM quizzes q {$quizPlaceholder} LIMIT 4");
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        $results[] = [
            'title' => $row['title'],
            'category' => 'Quiz Assessment',
            'url' => 'quiz?id=' . $row['id'],
            'icon' => '📝'
        ];
    }
} catch (Exception $e) {}

try {
    $assignPlaceholder = '';
    if (!empty($enrolledCourseIds) && !$isAdmin && !$isInstructor) {
        $assignPlaceholder = 'JOIN modules m ON a.module_id = m.id WHERE a.title LIKE ? AND m.course_id IN (' . implode(',', array_fill(0, count($enrolledCourseIds), '?')) . ')';
        $params = array_merge([$term], $enrolledCourseIds);
    } else {
        $assignPlaceholder = 'WHERE a.title LIKE ?';
        $params = [$term];
    }
    $stmt = $pdo->prepare("SELECT a.id, a.title FROM assignments a {$assignPlaceholder} LIMIT 4");
    $stmt->execute($params);
    while ($row = $stmt->fetch()) {
        $results[] = [
            'title' => $row['title'],
            'category' => 'Assignment',
            'url' => 'assignment?id=' . $row['id'],
            'icon' => '🛠️'
        ];
    }
} catch (Exception $e) {}

echo json_encode(['results' => array_slice($results, 0, 15)]);
