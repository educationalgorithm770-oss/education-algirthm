<?php
// includes/auth.php — Canonical Authentication & Multi-Course Entitlement Service

require_once __DIR__ . '/../config.php';

/**
 * Check if any user (student, instructor, or admin) is logged in
 */
function isLoggedIn(): bool {
    return !empty($_SESSION['student_id']) || !empty($_SESSION['instructor_id']) || !empty($_SESSION['admin_id']);
}

/**
 * Require active student login and revalidate database status on every privileged request
 */
function requireStudent(): int {
    global $pdo;
    
    if (empty($_SESSION['student_id'])) {
        if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Authentication required.']);
            exit;
        }
        $dest = !empty($_SESSION['guest_code_arena']) ? 'enroll.php?source=code_arena_locked' : 'login?msg=unauthorized';
        header("Location: " . $dest);
        exit;
    }

    $studentId = (int)$_SESSION['student_id'];

    // Revalidate student status in database
    try {
        $stmt = $pdo->prepare("SELECT id, status, name, email FROM students WHERE id = ? LIMIT 1");
        $stmt->execute([$studentId]);
        $student = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$student || $student['status'] !== 'active') {
            // Destroy invalidated/suspended session
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Account is inactive or suspended.']);
                exit;
            }
            header("Location: login?msg=account_suspended");
            exit;
        }
        
        $_SESSION['student_name']  = $student['name'];
        $_SESSION['student_email'] = $student['email'];
        return $studentId;
    } catch (Exception $e) {
        error_log("Database student revalidation error: " . $e->getMessage());
        header("Location: login?msg=unauthorized");
        exit;
    }
}

/**
 * Require active instructor login and revalidate database status
 */
function requireInstructor(): int {
    global $pdo;
    
    if (empty($_SESSION['instructor_id'])) {
        if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Instructor authentication required.']);
            exit;
        }
        header("Location: instructor-login?msg=unauthorized");
        exit;
    }

    $instructorId = (int)$_SESSION['instructor_id'];

    try {
        $stmt = $pdo->prepare("SELECT id, status FROM instructors WHERE id = ? LIMIT 1");
        $stmt->execute([$instructorId]);
        $inst = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$inst || ($inst['status'] ?? 'active') !== 'active') {
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            header("Location: instructor-login?msg=account_suspended");
            exit;
        }
        return $instructorId;
    } catch (Exception $e) {
        error_log("Instructor revalidation error: " . $e->getMessage());
        header("Location: instructor-login?msg=unauthorized");
        exit;
    }
}

/**
 * Require active admin login
 */
function requireAdmin(): int {
    global $pdo;
    if (empty($_SESSION['admin_id'])) {
        if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Admin authentication required.']);
            exit;
        }
        header("Location: admin-login.php?msg=unauthorized");
        exit;
    }
    $adminId = (int)$_SESSION['admin_id'];
    try {
        $stmt = $pdo->prepare("SELECT id FROM admins WHERE id = ? LIMIT 1");
        $stmt->execute([$adminId]);
        $adm = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$adm) {
            $_SESSION = [];
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Admin account is invalid.']);
                exit;
            }
            header("Location: admin-login.php?msg=account_suspended");
            exit;
        }
        return $adminId;
    } catch (Exception $e) {
        return $adminId;
    }
}

function getStudentId(): int {
    return (int)($_SESSION['student_id'] ?? 0);
}

function getInstructorId(): int {
    return (int)($_SESSION['instructor_id'] ?? 0);
}

function getAdminId(): int {
    return (int)($_SESSION['admin_id'] ?? 0);
}

/**
 * =========================================================================
 * MASTER IDENTITY RESOLUTION ENGINE: resolveExistingStudent()
 * =========================================================================
 * Strict Rule: ONE REAL STUDENT = ONE STUDENT ACCOUNT (1 row in `students`).
 * Resolves an existing student by authenticated session or normalized email.
 * If found: Returns existing student_id without creating a duplicate student.
 * If not found: Creates exactly ONE student record.
 * NEVER overwrites existing student password during new course enrollments.
 */
function resolveExistingStudent(string $email, string $name = '', string $phone = '', string $plainPassword = '', bool $lock = false): array {
    global $pdo;

    $normalizedEmail = strtolower(trim($email));
    $cleanName = clean_text($name, 100);
    $cleanPhone = clean_text($phone, 20);

    // Priority 1: Check Normalized Verified Email Identity in Database
    if (!empty($normalizedEmail)) {
        $lockSql = $lock ? " FOR UPDATE" : "";
        $stmtEmail = $pdo->prepare("SELECT id, name, email, phone, status FROM students WHERE LOWER(email) = ? LIMIT 1" . $lockSql);
        $stmtEmail->execute([$normalizedEmail]);
        $existing = $stmtEmail->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            $studentId = (int)$existing['id'];
            
            // Non-destructive update of missing name/phone only
            $updates = [];
            $params = [];
            if (empty($existing['name']) && !empty($cleanName)) {
                $updates[] = "name = ?";
                $params[] = $cleanName;
            }
            if (empty($existing['phone']) && !empty($cleanPhone)) {
                $updates[] = "phone = ?";
                $params[] = $cleanPhone;
            }
            if (!empty($updates)) {
                $params[] = $studentId;
                $pdo->prepare("UPDATE students SET " . implode(', ', $updates) . " WHERE id = ?")->execute($params);
            }

            return [
                'status'     => 'EXISTING_STUDENT',
                'student_id' => $studentId,
                'student'    => array_merge($existing, [
                    'name'  => !empty($existing['name']) ? $existing['name'] : $cleanName,
                    'phone' => !empty($existing['phone']) ? $existing['phone'] : $cleanPhone
                ]),
                'is_new'     => false
            ];
        }
    }

    // Priority 2: Authenticated Session Student ID (only if email matches session)
    if (!empty($_SESSION['student_id'])) {
        $sessId = (int)$_SESSION['student_id'];
        $stmtSess = $pdo->prepare("SELECT id, name, email, phone, status FROM students WHERE id = ? LIMIT 1");
        $stmtSess->execute([$sessId]);
        $curr = $stmtSess->fetch(PDO::FETCH_ASSOC);
        if ($curr && (empty($normalizedEmail) || strtolower($curr['email']) === $normalizedEmail)) {
            return [
                'status'     => 'EXISTING_STUDENT',
                'student_id' => (int)$curr['id'],
                'student'    => $curr,
                'is_new'     => false
            ];
        }
    }

    // Priority 3: Create Brand New Student Record (1st Course Enrollment)
    $passwordHash = !empty($plainPassword) 
        ? password_hash($plainPassword, PASSWORD_DEFAULT) 
        : password_hash(bin2hex(random_bytes(16)), PASSWORD_DEFAULT);

    $stmtInsert = $pdo->prepare("
        INSERT INTO students (name, email, phone, password, status, created_at)
        VALUES (?, ?, ?, ?, 'active', NOW())
    ");
    $stmtInsert->execute([
        $cleanName ?: 'Student',
        $normalizedEmail,
        $cleanPhone ?: '',
        $passwordHash
    ]);

    $newStudentId = (int)$pdo->lastInsertId();

    return [
        'status'     => 'NEW_STUDENT',
        'student_id' => $newStudentId,
        'student'    => [
            'id'     => $newStudentId,
            'name'   => $cleanName ?: 'Student',
            'email'  => $normalizedEmail,
            'phone'  => $cleanPhone ?: '',
            'status' => 'active'
        ],
        'is_new'     => true
    ];
}

/**
 * Check if a student already has an active paid enrollment in a specific course
 */
function getStudentEnrollmentForCourse(int $studentId, int $courseId): ?array {
    global $pdo;

    if ($studentId <= 0 || $courseId <= 0) {
        return null;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT e.*, c.title as course_title, c.price as course_price
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ? 
              AND e.course_id = ? 
              AND e.payment_status = 'paid' 
              AND e.status = 'active'
            ORDER BY e.id DESC
            LIMIT 1
        ");
        $stmt->execute([$studentId, $courseId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    } catch (Exception $e) {
        error_log("Enrollment course check error: " . $e->getMessage());
        return null;
    }
}

/**
 * Check if an email already has an active paid enrollment in a specific course
 */
function getEmailEnrollmentForCourse(string $email, int $courseId): ?array {
    global $pdo;

    $normalizedEmail = strtolower(trim($email));
    if (empty($normalizedEmail) || $courseId <= 0) {
        return null;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT e.*, c.title as course_title, c.price as course_price, s.id as student_db_id
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            LEFT JOIN students s ON e.student_id = s.id
            WHERE (LOWER(e.email) = ? OR LOWER(s.email) = ?)
              AND e.course_id = ? 
              AND e.payment_status = 'paid' 
              AND e.status = 'active'
            ORDER BY e.id DESC
            LIMIT 1
        ");
        $stmt->execute([$normalizedEmail, $normalizedEmail, $courseId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    } catch (Exception $e) {
        error_log("Email enrollment course check error: " . $e->getMessage());
        return null;
    }
}

/**
 * Canonical Entitlement Check:
 * Verifies student is active, enrollment is paid + active + not expired.
 * Fail-Closed on any error or missing record.
 */
function hasCourseAccess($student_id, $course_id): bool {
    global $pdo;
    
    $student_id = (int)$student_id;
    $course_id  = (int)$course_id;

    if ($student_id <= 0 || $course_id <= 0) {
        return false;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT e.id 
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            WHERE e.student_id = ? 
              AND e.course_id = ? 
              AND s.status = 'active'
              AND e.payment_status = 'paid' 
              AND e.status = 'active'
              AND (e.expires_at IS NULL OR e.expires_at >= NOW())
            LIMIT 1
        ");
        $stmt->execute([$student_id, $course_id]);
        return (bool)$stmt->fetchColumn();
    } catch (Exception $e) {
        error_log("Canonical entitlement check failed: " . $e->getMessage());
        return false; // Strict fail-closed
    }
}

/**
 * Require active course access. Denies access and redirects if not enrolled.
 */
function requireCourseAccess($student_id, $course_id) {
    $student_id = (int)$student_id;
    $course_id  = (int)$course_id;

    if (!hasCourseAccess($student_id, $course_id)) {
        if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied. Valid course enrollment required.']);
            exit;
        }
        header("Location: dashboard?msg=access_denied&course_id=" . $course_id);
        exit;
    }
}

/**
 * Verify instructor course assignment (Multi-Tenancy Guard)
 */
function hasInstructorCourseAccess(int $instructorId, int $courseId): bool {
    global $pdo;
    
    if ($instructorId <= 0 || $courseId <= 0) {
        return false;
    }

    try {
        $stmt = $pdo->prepare("
            SELECT id FROM course_instructors 
            WHERE instructor_id = ? AND course_id = ?
            LIMIT 1
        ");
        $stmt->execute([$instructorId, $courseId]);
        return (bool)$stmt->fetchColumn();
    } catch (Exception $e) {
        error_log("Instructor course access check error: " . $e->getMessage());
        return false; // Strict fail-closed
    }
}

/**
 * Require instructor assigned to specific course
 */
function requireInstructorCourseAccess(int $instructorId, int $courseId) {
    if (!hasInstructorCourseAccess($instructorId, $courseId)) {
        if (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied. You are not assigned to this course.']);
            exit;
        }
        header("Location: instructor-dashboard?msg=unauthorized_course");
        exit;
    }
}

/**
 * Get all active enrolled courses for a student (Fails closed on error)
 */
function getStudentCourses($student_id) {
    global $pdo;
    $student_id = (int)$student_id;
    if ($student_id <= 0) return [];

    try {
        $stmt = $pdo->prepare("
            SELECT c.*, e.id as enrollment_id, e.status as enrollment_status, e.enrolled_at 
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            WHERE e.student_id = ? AND e.payment_status = 'paid' AND e.status = 'active'
            ORDER BY c.id ASC
        ");
        $stmt->execute([$student_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    } catch (Exception $e) {
        error_log("Enrollment lookup failed for student {$student_id}: " . $e->getMessage());
        return []; // Fail closed - never grant all courses on error
    }
}

/**
 * Get unread notification count for student
 */
function getUnreadNotificationCount($student_id) {
    global $pdo;
    $student_id = (int)$student_id;
    if ($student_id <= 0) return 0;

    try {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM student_notifications WHERE student_id = ? AND is_read = 0");
        $stmt->execute([$student_id]);
        return (int)$stmt->fetchColumn();
    } catch (Exception $e) {
        return 0;
    }
}
