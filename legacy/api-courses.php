<?php
// api-courses.php — Public Dynamic Course Catalog API (Database = Single Source of Truth)
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/course-service.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? 'list';

// 1. List All Published Courses
if ($action === 'list') {
    $courses = CourseService::getPublicCourses();
    echo json_encode([
        'success' => true,
        'count' => count($courses),
        'courses' => $courses
    ]);
    exit;
}

// 2. Get Single Course by ID or Slug
if ($action === 'detail') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $slug = trim($_GET['slug'] ?? '');

    $course = null;
    if ($id > 0) {
        $course = CourseService::getCourseById($id);
    } elseif (!empty($slug)) {
        $course = CourseService::getCourseBySlug($slug);
    }

    if (!$course) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Course not found or is currently unpublished.']);
        exit;
    }

    // Load modules for this course
    $stmtM = $pdo->prepare("SELECT id, title, description, sort_order FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC");
    $stmtM->execute([(int)$course['id']]);
    $modules = $stmtM->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'course' => $course,
        'modules' => $modules
    ]);
    exit;
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Invalid action.']);
exit;
