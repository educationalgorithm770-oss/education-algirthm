<?php
/**
 * includes/course-service.php — Canonical Course Management & Lifecycle Service
 * Single Source of Truth for Education Algorithm Course Operations
 */

require_once __DIR__ . '/../config.php';

class CourseService {

    /**
     * Helper to create SEO-friendly slugs
     */
    public static function slugify(string $text): string {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        $text = strtolower($text);
        return empty($text) ? 'course-' . uniqid() : $text;
    }

    /**
     * Log an administrative course action into the immutable audit trail
     */
    public static function logAudit(int $adminId, int $courseId, string $action, $oldValue, $newValue): bool {
        global $pdo;
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS course_audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT NOT NULL,
                    course_id INT NOT NULL,
                    action VARCHAR(64) NOT NULL,
                    old_value LONGTEXT DEFAULT NULL,
                    new_value LONGTEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_audit_course (course_id),
                    KEY idx_audit_admin (admin_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            $stmt = $pdo->prepare("
                INSERT INTO course_audit_logs (admin_id, course_id, action, old_value, new_value, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            ");
            $oldJson = is_string($oldValue) ? $oldValue : json_encode($oldValue);
            $newJson = is_string($newValue) ? $newValue : json_encode($newValue);
            return $stmt->execute([$adminId, $courseId, $action, $oldJson, $newJson]);
        } catch (Throwable $e) {
            error_log("Failed to write course audit log: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fetch all publicly published courses for the store, catalog, and checkout
     */
    public static function getPublicCourses(): array {
        global $pdo;
        try {
            $stmt = $pdo->prepare("
                SELECT id, title, slug, description, level, duration, price, status, published_at, created_at
                FROM courses 
                WHERE status = 'published' 
                ORDER BY id ASC
            ");
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Throwable $e) {
            error_log("Failed to fetch public courses: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Fetch all courses for Admin Control Center (all states)
     */
    public static function getAllCoursesAdmin(): array {
        global $pdo;
        try {
            $stmt = $pdo->query("
                SELECT c.*, 
                    (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id) as module_count,
                    (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.payment_status = 'paid') as student_count
                FROM courses c
                ORDER BY c.id ASC
            ");
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Throwable $e) {
            error_log("Failed to fetch admin courses: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get a specific course by ID
     */
    public static function getCourseById(int $courseId, bool $allowNonPublished = false): ?array {
        global $pdo;
        if ($courseId <= 0) return null;

        try {
            $sql = "SELECT * FROM courses WHERE id = ?";
            if (!$allowNonPublished) {
                $sql .= " AND status = 'published'";
            }
            $sql .= " LIMIT 1";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([$courseId]);
            $course = $stmt->fetch(PDO::FETCH_ASSOC);
            return $course ?: null;
        } catch (Exception $e) {
            error_log("Failed to fetch course ID {$courseId}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get a specific course by Slug
     */
    public static function getCourseBySlug(string $slug, bool $allowNonPublished = false): ?array {
        global $pdo;
        $slug = trim($slug);
        if (empty($slug)) return null;

        try {
            $sql = "SELECT * FROM courses WHERE slug = ?";
            if (!$allowNonPublished) {
                $sql .= " AND status = 'published'";
            }
            $sql .= " LIMIT 1";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([$slug]);
            $course = $stmt->fetch(PDO::FETCH_ASSOC);
            return $course ?: null;
        } catch (Exception $e) {
            error_log("Failed to fetch course slug {$slug}: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a brand new Draft Course (from AI Synthesizer or manual creation)
     */
    public static function createDraftCourse(array $data, int $adminId, array $syllabusModules = []): array {
        global $pdo;

        $title = clean_text($data['title'] ?? '', 150);
        $price = validate_integer_range($data['price'] ?? 15000, 0, 1000000, 15000);
        $level = clean_text($data['level'] ?? 'Intermediate', 50);
        $duration = clean_text($data['duration'] ?? '4 Weeks', 50);
        $desc = clean_text($data['description'] ?? '', 1000);

        if (empty($title)) {
            return ['success' => false, 'error' => 'Course title is required.'];
        }

        // Generate unique slug
        $baseSlug = self::slugify($title);
        $slug = $baseSlug;
        $counter = 1;
        while (true) {
            $chk = $pdo->prepare("SELECT COUNT(*) FROM courses WHERE slug = ?");
            $chk->execute([$slug]);
            if ((int)$chk->fetchColumn() === 0) break;
            $slug = $baseSlug . '-' . (++$counter);
        }

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO courses (title, slug, description, level, duration, price, status, published_at, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'draft', NULL, NOW())
            ");
            $stmt->execute([$title, $slug, $desc, $level, $duration, $price]);
            $courseId = (int)$pdo->lastInsertId();

            // Insert synthesized modules if provided
            if (!empty($syllabusModules)) {
                $mOrder = 1;
                $stmtM = $pdo->prepare("INSERT INTO modules (course_id, title, description, sort_order) VALUES (?, ?, ?, ?)");
                foreach ($syllabusModules as $m) {
                    $mTitle = clean_text($m['title'] ?? "Module {$mOrder}", 150);
                    $mDesc = !empty($m['lessons']) ? implode("\n", array_slice($m['lessons'], 0, 3)) : '';
                    $stmtM->execute([$courseId, $mTitle, $mDesc, $mOrder]);
                    $mOrder++;
                }
            }

            self::logAudit($adminId, $courseId, 'create', null, [
                'title' => $title,
                'slug' => $slug,
                'price' => $price,
                'status' => 'draft',
                'modules_count' => count($syllabusModules)
            ]);

            $pdo->commit();
            return ['success' => true, 'course_id' => $courseId, 'slug' => $slug];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Failed to create course: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error during course creation: ' . $e->getMessage()];
        }
    }

    /**
     * Update Course Metadata (Title, Description, Level, Duration)
     */
    public static function updateCourse(int $courseId, array $data, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        $title = clean_text($data['title'] ?? $existing['title'], 150);
        $level = clean_text($data['level'] ?? $existing['level'], 50);
        $duration = clean_text($data['duration'] ?? $existing['duration'], 50);
        $desc = clean_text($data['description'] ?? $existing['description'], 1000);

        if (empty($title)) {
            return ['success' => false, 'error' => 'Course title cannot be empty.'];
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE courses 
                SET title = ?, description = ?, level = ?, duration = ?, updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$title, $desc, $level, $duration, $courseId]);

            self::logAudit($adminId, $courseId, 'edit', $existing, [
                'title' => $title,
                'description' => $desc,
                'level' => $level,
                'duration' => $duration
            ]);

            return ['success' => true, 'message' => 'Course details updated successfully.'];
        } catch (Exception $e) {
            error_log("Failed to update course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Update Course Official Price Tag
     */
    public static function updatePrice(int $courseId, int $newPrice, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        $newPrice = validate_integer_range($newPrice, 0, 1000000, 15000);

        try {
            $stmt = $pdo->prepare("UPDATE courses SET price = ?, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$newPrice, $courseId]);

            self::logAudit($adminId, $courseId, 'price_change', [
                'old_price' => (int)$existing['price']
            ], [
                'new_price' => $newPrice
            ]);

            return ['success' => true, 'message' => "Price tag updated to ₹" . number_format($newPrice)];
        } catch (Exception $e) {
            error_log("Failed to update price for course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Publish a Course (Draft / Unpublished / Archived -> Published)
     * Performs strict completeness validation before going live
     */
    public static function publishCourse(int $courseId, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        // Validation Rules:
        if (empty(trim($existing['title']))) {
            return ['success' => false, 'error' => 'Publishing rejected: Course title is missing.'];
        }
        if ((int)$existing['price'] <= 0) {
            return ['success' => false, 'error' => 'Publishing rejected: Course price must be greater than 0.'];
        }
        if (empty(trim($existing['duration']))) {
            return ['success' => false, 'error' => 'Publishing rejected: Course duration is missing.'];
        }

        // Check if course has at least 1 module
        $stmtM = $pdo->prepare("SELECT COUNT(*) FROM modules WHERE course_id = ?");
        $stmtM->execute([$courseId]);
        $moduleCount = (int)$stmtM->fetchColumn();

        if ($moduleCount === 0) {
            return ['success' => false, 'error' => 'Publishing rejected: Course must contain at least 1 module in its curriculum.'];
        }

        try {
            $stmt = $pdo->prepare("
                UPDATE courses 
                SET status = 'published', published_at = IFNULL(published_at, NOW()), updated_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$courseId]);

            self::logAudit($adminId, $courseId, 'publish', [
                'old_status' => $existing['status']
            ], [
                'new_status' => 'published',
                'published_at' => date('Y-m-d H:i:s')
            ]);

            return ['success' => true, 'message' => "Course '{$existing['title']}' is now LIVE on the catalog!"];
        } catch (Exception $e) {
            error_log("Failed to publish course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Unpublish Course (Hides from public catalog while preserving existing paid student access)
     */
    public static function unpublishCourse(int $courseId, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        try {
            $stmt = $pdo->prepare("UPDATE courses SET status = 'unpublished', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$courseId]);

            self::logAudit($adminId, $courseId, 'unpublish', [
                'old_status' => $existing['status']
            ], [
                'new_status' => 'unpublished'
            ]);

            return ['success' => true, 'message' => "Course '{$existing['title']}' has been unpublished. Existing enrolled students retain access."];
        } catch (Exception $e) {
            error_log("Failed to unpublish course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Archive Course (Hides from public catalog; preserves historical data & active student access)
     */
    public static function archiveCourse(int $courseId, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        try {
            $stmt = $pdo->prepare("UPDATE courses SET status = 'archived', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$courseId]);

            self::logAudit($adminId, $courseId, 'archive', [
                'old_status' => $existing['status']
            ], [
                'new_status' => 'archived'
            ]);

            return ['success' => true, 'message' => "Course '{$existing['title']}' archived. All student records and history preserved."];
        } catch (Exception $e) {
            error_log("Failed to archive course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Restore Course (Back to Published or Draft)
     */
    public static function restoreCourse(int $courseId, string $targetStatus, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        if (!in_array($targetStatus, ['published', 'draft'], true)) {
            $targetStatus = 'draft';
        }

        if ($targetStatus === 'published') {
            return self::publishCourse($courseId, $adminId);
        }

        try {
            $stmt = $pdo->prepare("UPDATE courses SET status = 'draft', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$courseId]);

            self::logAudit($adminId, $courseId, 'restore', [
                'old_status' => $existing['status']
            ], [
                'new_status' => 'draft'
            ]);

            return ['success' => true, 'message' => "Course '{$existing['title']}' restored to DRAFT status."];
        } catch (Exception $e) {
            error_log("Failed to restore course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error: ' . $e->getMessage()];
        }
    }

    /**
     * Permanent Delete: Allowed ONLY if 0 dependencies exist
     * If ANY student, payment, certificate, or lesson progress exists, DELETE IS BLOCKED.
     */
    public static function deleteCourse(int $courseId, int $adminId): array {
        global $pdo;

        $existing = self::getCourseById($courseId, true);
        if (!$existing) {
            return ['success' => false, 'error' => 'Course not found.'];
        }

        try {
            // 1. Check Paid/Active Enrollments
            $stmtE = $pdo->prepare("SELECT COUNT(*) FROM enrollments WHERE course_id = ?");
            $stmtE->execute([$courseId]);
            $enrollmentCount = (int)$stmtE->fetchColumn();

            // 2. Check Payments
            $stmtP = $pdo->prepare("SELECT COUNT(*) FROM payments WHERE course_id = ?");
            $stmtP->execute([$courseId]);
            $paymentCount = (int)$stmtP->fetchColumn();

            // 3. Check Certificates
            $stmtC = $pdo->prepare("SELECT COUNT(*) FROM certificates WHERE course_id = ?");
            $stmtC->execute([$courseId]);
            $certCount = (int)$stmtC->fetchColumn();

            // 4. Check Student Lesson Progress
            $stmtL = $pdo->prepare("
                SELECT COUNT(*) FROM lesson_completions lc 
                JOIN videos v ON lc.item_id = v.id 
                JOIN modules m ON v.module_id = m.id 
                WHERE m.course_id = ?
            ");
            $stmtL->execute([$courseId]);
            $progressCount = (int)$stmtL->fetchColumn();

            // Total dependency check
            if ($enrollmentCount > 0 || $paymentCount > 0 || $certCount > 0 || $progressCount > 0) {
                return [
                    'success' => false,
                    'error' => "DELETE BLOCKED: This course contains historical student data ({$enrollmentCount} enrollments, {$paymentCount} payments, {$certCount} certificates). Please Archive the course instead."
                ];
            }

            // Safe to delete empty draft course and its draft curriculum
            $pdo->beginTransaction();

            // Delete draft videos, notes, code snippets, modules
            $stmtV = $pdo->prepare("DELETE v FROM videos v JOIN modules m ON v.module_id = m.id WHERE m.course_id = ?");
            $stmtV->execute([$courseId]);

            $stmtN = $pdo->prepare("DELETE n FROM notes n JOIN modules m ON n.module_id = m.id WHERE m.course_id = ?");
            $stmtN->execute([$courseId]);

            $stmtS = $pdo->prepare("DELETE cs FROM code_snippets cs JOIN modules m ON cs.module_id = m.id WHERE m.course_id = ?");
            $stmtS->execute([$courseId]);

            $stmtMod = $pdo->prepare("DELETE FROM modules WHERE course_id = ?");
            $stmtMod->execute([$courseId]);

            // Delete course record
            $stmtDel = $pdo->prepare("DELETE FROM courses WHERE id = ?");
            $stmtDel->execute([$courseId]);

            self::logAudit($adminId, $courseId, 'delete', $existing, null);

            $pdo->commit();
            return ['success' => true, 'message' => "Draft course '{$existing['title']}' permanently deleted."];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Failed to delete course {$courseId}: " . $e->getMessage());
            return ['success' => false, 'error' => 'Database error during course deletion: ' . $e->getMessage()];
        }
    }

    /**
     * Get Audit Logs for a specific course or globally
     */
    public static function getAuditLogs(?int $courseId = null, int $limit = 50): array {
        global $pdo;
        try {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS course_audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    admin_id INT NOT NULL,
                    course_id INT NOT NULL,
                    action VARCHAR(64) NOT NULL,
                    old_value LONGTEXT DEFAULT NULL,
                    new_value LONGTEXT DEFAULT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    KEY idx_audit_course (course_id),
                    KEY idx_audit_admin (admin_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            ");
            if ($courseId && $courseId > 0) {
                $stmt = $pdo->prepare("
                    SELECT a.*, c.title as course_title, adm.username as admin_name 
                    FROM course_audit_logs a
                    LEFT JOIN courses c ON a.course_id = c.id
                    LEFT JOIN admins adm ON a.admin_id = adm.id
                    WHERE a.course_id = ?
                    ORDER BY a.id DESC
                    LIMIT ?
                ");
                $stmt->bindValue(1, $courseId, PDO::PARAM_INT);
                $stmt->bindValue(2, $limit, PDO::PARAM_INT);
                $stmt->execute();
            } else {
                $stmt = $pdo->prepare("
                    SELECT a.*, c.title as course_title, adm.username as admin_name 
                    FROM course_audit_logs a
                    LEFT JOIN courses c ON a.course_id = c.id
                    LEFT JOIN admins adm ON a.admin_id = adm.id
                    ORDER BY a.id DESC
                    LIMIT ?
                ");
                $stmt->bindValue(1, $limit, PDO::PARAM_INT);
                $stmt->execute();
            }
            return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
        } catch (Throwable $e) {
            error_log("Failed to fetch audit logs: " . $e->getMessage());
            return [];
        }
    }
}
