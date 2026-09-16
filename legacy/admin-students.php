<?php
$adminActive = 'students';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

// Handle Impersonation (Log in as Student) — POST + CSRF only
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['impersonate'])) {
    verify_csrf();
    $targetStudentId = (int)$_POST['impersonate'];
    $stmtFind = $pdo->prepare("SELECT id, name, email FROM students WHERE id = ? LIMIT 1");
    $stmtFind->execute([$targetStudentId]);
    $studentToImpersonate = $stmtFind->fetch();

    if ($studentToImpersonate) {
        $_SESSION['student_id'] = $studentToImpersonate['id'];
        $_SESSION['student_name'] = $studentToImpersonate['name'];
        $_SESSION['student_email'] = $studentToImpersonate['email'];
        $_SESSION['is_impersonating'] = true;

        $pdo->prepare("INSERT INTO admin_audit_logs (admin_id, admin_name, action_type, description) VALUES (?, 'Super Admin', 'STUDENT_IMPERSONATE', ?)")
            ->execute([$adminId, "Impersonated student #{$studentToImpersonate['id']} ({$studentToImpersonate['name']})"]);

        header("Location: dashboard.php");
        exit;
    }
}

// Handle Manual Course Access Grant
$successMsg = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['grant_access'])) {
    verify_csrf();
    $sId = (int)$_POST['student_id'];
    $cId = (int)$_POST['course_id'];
    
    // Check if enrolled
    $chk = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ?");
    $chk->execute([$sId, $cId]);
    if (!$chk->fetch()) {
        $cRow = $pdo->query("SELECT title, price FROM courses WHERE id = {$cId} LIMIT 1")->fetch();
        $sRow = $pdo->query("SELECT name, email, phone FROM students WHERE id = {$sId} LIMIT 1")->fetch();
        
        $pdo->prepare("
            INSERT INTO enrollments (student_id, course_id, name, email, phone, course, amount, payment_status, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'active')
        ")->execute([$sId, $cId, $sRow['name'], $sRow['email'], $sRow['phone'] ?? '', $cRow['title'] ?? 'Enrolled Course', $cRow['price'] ?? 0]);
        
        $successMsg = "Course access granted successfully to " . e($sRow['name']);
    }
}

// Search & Filter Query
$search = clean_text($_GET['q'] ?? '', 100);
$whereClauses = [];
$params = [];

if (!empty($search)) {
    $whereClauses[] = "(s.name LIKE ? OR s.email LIKE ? OR s.phone LIKE ?)";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
    $params[] = "%{$search}%";
}

$whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";

$studentsQuery = "
    SELECT 
        s.id, 
        s.name, 
        s.email, 
        s.phone, 
        s.created_at,
        COALESCE(st.current_streak, 1) as streak,
        COALESCE(SUM(l.xp_earned), 0) as total_xp,
        COUNT(DISTINCT e.id) as enrolled_courses_count
    FROM students s
    LEFT JOIN student_streaks st ON s.id = st.student_id
    LEFT JOIN student_activity_log l ON s.id = l.student_id
    LEFT JOIN enrollments e ON s.id = e.student_id AND (e.payment_status = 'paid' OR e.status = 'active')
    {$whereSql}
    GROUP BY s.id, s.name, s.email, s.phone, s.created_at, st.current_streak
    ORDER BY s.id DESC
";
$stmtStudents = $pdo->prepare($studentsQuery);
$stmtStudents->execute($params);
$studentsList = $stmtStudents->fetchAll();

$coursesList = $pdo->query("SELECT id, title FROM courses ORDER BY id ASC")->fetchAll();
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
    <title>Student 360° Directory — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
        .table-responsive-box {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .student-table {
            width: 100%;
            min-width: 680px;
            border-collapse: collapse;
            text-align: left;
        }
        .student-table th {
            background: #f8fafc;
            padding: 0.9rem 1.1rem;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
        }
        .student-table td {
            padding: 0.95rem 1.1rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }
        .student-table tr:last-child td {
            border-bottom: none;
        }
        .student-table tr:hover {
            background: #fbfcfe;
        }

        @media (max-width: 768px) {
            .admin-header-flex {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 1rem !important;
            }
            .admin-header-flex .btn-primary {
                width: 100% !important;
                justify-content: center !important;
            }
            .search-form-flex {
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 0.65rem !important;
            }
            .search-form-flex input,
            .search-form-flex button,
            .search-form-flex a {
                width: 100% !important;
                text-align: center !important;
            }
        }
    </style>
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            <header class="admin-header admin-header-flex" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">👥 Student 360° Directory</h1>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Manage enrolled students, track real-time progress, and launch 1-click student impersonation.</p>
                </div>
                <div>
                    <a href="admin-create-enrollment.php" class="btn btn-primary" style="padding: 0.65rem 1.35rem; font-weight: 700; font-size: 0.88rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; text-decoration: none; display: inline-flex; align-items: center; gap: 0.45rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                        <span>➕</span> Create New Enrollment
                    </a>
                </div>
            </header>

            <?php if (isset($_GET['msg']) && $_GET['msg'] === 'enrollment_success'): ?>
                <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                    <span>🎉</span> Enrollment created and course access granted successfully<?php echo !empty($_GET['student']) ? ' to ' . e($_GET['student']) : ''; ?>!
                </div>
            <?php endif; ?>

            <?php if (!empty($successMsg)): ?>
                <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600;">
                    ✓ <?php echo $successMsg; ?>
                </div>
            <?php endif; ?>

            <!-- Search & Actions Bar -->
            <div class="card" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem; border-radius: 12px; background: #ffffff; border: 1px solid #e2e8f0;">
                <form method="GET" class="search-form-flex" style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">
                    <input type="text" name="q" value="<?php echo e($search); ?>" placeholder="Search student name, email, or phone..." style="flex: 1; min-width: 240px; padding: 0.6rem 0.95rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.88rem;">
                    <button type="submit" class="btn btn-primary" style="padding: 0.6rem 1.35rem; font-weight: 700; background: #4f46e5; border: none; border-radius: 8px;">Search Directory</button>
                    <?php if (!empty($search)): ?>
                        <a href="admin-students.php" class="btn btn-secondary" style="padding: 0.6rem 1rem; border-radius: 8px; text-decoration: none;">Clear Filter</a>
                    <?php endif; ?>
                </form>
            </div>

            <!-- Responsive Students Table Container -->
            <div class="table-responsive-box">
                <table class="student-table">
                    <thead>
                        <tr>
                            <th style="width: 70px;">ID</th>
                            <th>Student Details</th>
                            <th>Courses</th>
                            <th>Activity & XP</th>
                            <th>Joined Date</th>
                            <th style="text-align: right;">Admin Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($studentsList)): ?>
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 2.5rem 1rem; color: #64748b;">
                                    No students found matching your criteria.
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($studentsList as $st): ?>
                            <tr>
                                <td style="font-weight: 800; color: #64748b; font-family: monospace;">#<?php echo $st['id']; ?></td>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 38px; height: 38px; border-radius: 50%; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem; flex-shrink: 0; border: 1px solid #c7d2fe;">
                                            <?php echo strtoupper(substr($st['name'], 0, 1)); ?>
                                        </div>
                                        <div>
                                            <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;"><?php echo e($st['name']); ?></div>
                                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 0.1rem;"><?php echo e($st['email']); ?> • <?php echo e($st['phone'] ?: 'No Phone'); ?></div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="badge" style="background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 0.76rem; padding: 0.25rem 0.65rem; border-radius: 6px; border: 1px solid #c7d2fe; display: inline-block;">
                                        🎓 <?php echo (int)$st['enrolled_courses_count']; ?> Enrolled
                                    </span>
                                </td>
                                <td>
                                    <div style="font-size: 0.84rem; font-weight: 800; color: #0f172a;">⚡ <?php echo number_format($st['total_xp']); ?> XP</div>
                                    <div style="font-size: 0.74rem; color: #d97706; font-weight: 700; margin-top: 0.15rem;">🔥 <?php echo (int)$st['streak']; ?> Day Streak</div>
                                </td>
                                <td style="font-size: 0.82rem; color: #64748b; white-space: nowrap;">
                                    <?php echo date('M d, Y', strtotime($st['created_at'])); ?>
                                </td>
                                <td style="text-align: right;">
                                    <form method="POST" style="display:inline" onsubmit="return confirm('Log in as this student to verify their dashboard and course view?')">
                                        <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
                                        <input type="hidden" name="impersonate" value="<?php echo (int)$st['id']; ?>">
                                        <button type="submit" class="btn btn-secondary btn-sm" title="Log in as this student to debug view" style="font-size: 0.76rem; padding: 0.35rem 0.75rem; border-color: #6366f1; color: #4338ca; font-weight: 700; border-radius: 6px; background: #fff; cursor: pointer; white-space: nowrap;">
                                            🔑 Impersonate
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </main>
    </div>
</body>
</html>
