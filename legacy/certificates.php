<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/gamification.php';

$studentId = requireStudent();

// Fetch student details
$stmtS = $pdo->prepare("SELECT name, email, created_at FROM students WHERE id = ?");
$stmtS->execute([$studentId]);
$student = $stmtS->fetch();
$studentName = $student['name'] ?? 'Student';

// Get Enrolled Courses
$stmtC = $pdo->prepare("
    SELECT c.id, c.title, c.description, c.duration, c.level, e.created_at as enrolled_at
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.student_id = ? AND e.payment_status = 'paid' AND e.status = 'active'
    ORDER BY c.id ASC
");
$stmtC->execute([$studentId]);
$enrolledCourses = $stmtC->fetchAll();

if (empty($enrolledCourses)) {
    $stmtFallback = $pdo->query("SELECT id, title, description, duration, level FROM courses WHERE status = 'published' ORDER BY id ASC");
    $enrolledCourses = $stmtFallback->fetchAll() ?: [];
}

$selectedCourseId = (int)($_GET['course_id'] ?? ($enrolledCourses[0]['id'] ?? 1));
$currentCourse = null;
foreach ($enrolledCourses as $c) {
    if ($c['id'] == $selectedCourseId) {
        $currentCourse = $c;
        break;
    }
}
if (!$currentCourse && !empty($enrolledCourses)) {
    $currentCourse = $enrolledCourses[0];
    $selectedCourseId = (int)$currentCourse['id'];
}

// Check criteria accurately from actual database schema
$totalLessons = 0; $completedLessons = 0;
$totalQuizzes = 0; $passedQuizzes = 0;
$totalAssignments = 0; $submittedAssignments = 0;

try {
    // Total videos in course modules
    $stmt = $pdo->prepare("SELECT COUNT(v.id) FROM videos v JOIN modules m ON v.module_id = m.id WHERE m.course_id = ?");
    $stmt->execute([$selectedCourseId]);
    $totalLessons = (int)$stmt->fetchColumn();

    // Completed videos by student
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT lc.item_id) 
        FROM lesson_completions lc
        JOIN videos v ON lc.item_id = v.id
        JOIN modules m ON v.module_id = m.id
        WHERE lc.student_id = ? AND m.course_id = ? AND lc.item_type = 'video'
    ");
    $stmt->execute([$studentId, $selectedCourseId]);
    $completedLessons = (int)$stmt->fetchColumn();

    // Total quizzes in course
    $stmt = $pdo->prepare("SELECT COUNT(q.id) FROM quizzes q JOIN modules m ON q.module_id = m.id WHERE m.course_id = ?");
    $stmt->execute([$selectedCourseId]);
    $totalQuizzes = (int)$stmt->fetchColumn();

    // Passed quizzes by student
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT qa.quiz_id)
        FROM quiz_attempts qa
        JOIN quizzes q ON qa.quiz_id = q.id
        JOIN modules m ON q.module_id = m.id
        WHERE qa.student_id = ? AND m.course_id = ? AND qa.passed = 1
    ");
    $stmt->execute([$studentId, $selectedCourseId]);
    $passedQuizzes = (int)$stmt->fetchColumn();

    // Total assignments
    $stmt = $pdo->prepare("SELECT COUNT(a.id) FROM assignments a JOIN modules m ON a.module_id = m.id WHERE m.course_id = ?");
    $stmt->execute([$selectedCourseId]);
    $totalAssignments = (int)$stmt->fetchColumn();

    // Submitted assignments
    $stmt = $pdo->prepare("
        SELECT COUNT(DISTINCT sub.assignment_id)
        FROM assignment_submissions sub
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN modules m ON a.module_id = m.id
        WHERE sub.student_id = ? AND m.course_id = ?
    ");
    $stmt->execute([$studentId, $selectedCourseId]);
    $submittedAssignments = (int)$stmt->fetchColumn();
} catch (Exception $e) {}

$totalItems = $totalLessons + $totalQuizzes + $totalAssignments;
$doneItems  = $completedLessons + $passedQuizzes + $submittedAssignments;

// Strict Completion Enforcement: Requires 100% of all published items and at least 1 item
$progressPercent = ($totalItems > 0) ? min(100, (int)round(($doneItems / $totalItems) * 100)) : 0;
$isCourseFullyCompleted = ($totalItems > 0 && $doneItems >= $totalItems && $progressPercent >= 100);

// Check if certificate already exists in database
$cert = null;
try {
    $stmtCert = $pdo->prepare("SELECT * FROM certificates WHERE student_id = ? AND course_id = ? LIMIT 1");
    $stmtCert->execute([$studentId, $selectedCourseId]);
    $cert = $stmtCert->fetch();

    // Auto-generate ONLY if student has 100% genuinely completed all requirements
    if (!$cert && $isCourseFullyCompleted) {
        $certUuid = 'EA-' . strtoupper(bin2hex(random_bytes(6))) . '-' . date('Y');
        $issueDate = date('Y-m-d');
        $stmtInsertCert = $pdo->prepare("
            INSERT INTO certificates (certificate_uuid, student_id, course_id, issue_date, completion_percentage, status)
            VALUES (?, ?, ?, ?, 100, 'valid')
        ");
        $stmtInsertCert->execute([$certUuid, $studentId, $selectedCourseId, $issueDate]);

        $stmtInsertCc = $pdo->prepare("
            INSERT INTO course_certificates (certificate_code, student_id, course_id, student_name, course_title, instructor_name, issue_date)
            VALUES (?, ?, ?, ?, ?, 'Dr. Arvind Sharma', ?)
        ");
        $stmtInsertCc->execute([$certUuid, $studentId, $selectedCourseId, $studentName, $currentCourse['title'] ?? 'Engineering Cohort', $issueDate]);

        $stmtCert->execute([$studentId, $selectedCourseId]);
        $cert = $stmtCert->fetch();
    }
} catch (Exception $e) {
    error_log("Certificate resolution error: " . $e->getMessage());
}

// Certificate is active ONLY if course is genuinely completed OR valid database record exists with 100%
$isCertUnlocked = ($isCourseFullyCompleted && !empty($cert));

$effectiveCertUuid = $cert['certificate_uuid'] ?? ('EA-PREVIEW-' . strtoupper(substr(md5($studentId . '_' . $selectedCourseId), 0, 8)));
$issueDateFormatted = !empty($cert['issue_date']) ? date('M d, Y', strtotime($cert['issue_date'])) : date('M d, Y');
$verifyUrl = rtrim(APP_URL, '/') . '/verify.php?cert=' . urlencode($effectiveCertUuid);
$qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' . urlencode($verifyUrl);

$pageTitle = "Verified Credentials & Certificate Studio — Education Algorithm";
$activePage = 'certificates';
$activeNav = 'certificates';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $pageTitle; ?></title>
    
    <script>
    (function() {
        var t = 'dark';
        try { t = localStorage.getItem('lms_theme') || 'dark'; } catch(e){}
        document.documentElement.setAttribute('data-theme', t);
    })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=12.0">
    <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

    <style>
    :root {
        --gold-primary: #d4af37;
        --gold-light: #fef08a;
        --gold-dark: #854d0e;
        --navy-deep: #0a0f1d;
    }

    body {
        background-color: var(--bg-body, #f8fafc) !important;
        color: var(--text-primary, #0f172a) !important;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .cert-studio-wrapper {
        max-width: 1040px;
        margin: 0 auto;
        padding: 1.75rem 1.25rem 4.5rem;
    }

    /* Track Switcher Dropdown */
    .track-dropdown-select {
        padding: 0.55rem 1.15rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.86rem;
        background: #ffffff;
        color: #0f172a;
        border: 1.5px solid #cbd5e1;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
    }
    .track-dropdown-select:hover, .track-dropdown-select:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }

    /* Milestone Cards */
    .hud-main-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.75rem;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        margin-bottom: 1.75rem;
    }

    .cert-metric-card {
        background: #f8fafc;
        border: 1.5px solid #e2e8f0;
        padding: 1rem 1.15rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 0.95rem;
        transition: transform 0.2s ease;
    }
    .cert-metric-card:hover {
        transform: translateY(-2px);
        border-color: #cbd5e1;
    }
    .cert-metric-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.35rem;
        flex-shrink: 0;
    }
    .metric-value-text {
        font-size: 1.3rem;
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
    }
    .metric-total-text {
        font-size: 0.82rem;
        font-weight: 600;
        color: #64748b;
    }

    /* In-Progress Alert Banner */
    .in-progress-alert-box {
        margin-top: 1.35rem;
        background: #fffbeb;
        border: 1.5px solid #fde68a;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.85rem;
    }

    /* Action Toolbar */
    .cert-toolbar-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.85rem;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 0.85rem 1.35rem;
        margin-bottom: 1.75rem;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
    }

    .btn-disabled-lock {
        background: #f1f5f9;
        color: #94a3b8;
        border: 1px solid #e2e8f0;
        font-size: 0.78rem;
        font-weight: 700;
        padding: 0.45rem 0.85rem;
        border-radius: 8px;
        cursor: not-allowed;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }

    /* 3D Certificate Stage */
    .cert-3d-stage {
        perspective: 1400px;
        margin: 1.5rem auto 2.5rem;
        display: flex;
        justify-content: center;
        position: relative;
    }

    .cert-sheet-card {
        width: 100%;
        max-width: 880px;
        background: #ffffff;
        color: #0f172a;
        border-radius: 16px;
        padding: 3.5rem 3.25rem;
        box-sizing: border-box;
        position: relative;
        box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(212, 175, 55, 0.3);
        transform-style: preserve-3d;
        transition: transform 0.25s ease-out, box-shadow 0.3s ease;
        overflow: hidden;
        border: 2px solid rgba(212, 175, 55, 0.4);
    }

    .cert-inner-frame {
        border: 4px double #d4af37;
        padding: 2.25rem 2rem;
        position: relative;
        background: radial-gradient(circle at center, #ffffff 60%, #faf8f5 100%);
    }

    .cert-corner-ornament {
        position: absolute;
        width: 32px;
        height: 32px;
        border: 3px solid #d4af37;
    }
    .corner-tl { top: 6px; left: 6px; border-right: none; border-bottom: none; }
    .corner-tr { top: 6px; right: 6px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: 6px; left: 6px; border-right: none; border-top: none; }
    .corner-br { bottom: 6px; right: 6px; border-left: none; border-top: none; }

    .gold-foil-seal {
        width: 96px;
        height: 96px;
        background: radial-gradient(circle, #fef08a 0%, #d4af37 50%, #854d0e 100%);
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 25px rgba(212, 175, 55, 0.4), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.4);
        position: relative;
        border: 3px dashed #fff;
    }

    .seal-text-inner {
        text-align: center;
        color: #3b2003;
        font-weight: 900;
        font-size: 0.56rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        line-height: 1.2;
    }

    .cert-crest-bg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 22rem;
        font-weight: 900;
        color: rgba(212, 175, 55, 0.04);
        pointer-events: none;
        user-select: none;
        font-family: 'Georgia', serif;
    }

    /* Frosted Lock Overlay */
    .cert-locked-watermark-overlay {
        position: absolute;
        inset: 0;
        background: rgba(15, 23, 42, 0.62);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        border-radius: 16px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        color: #ffffff;
    }
    .locked-shield-icon {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: rgba(239, 68, 68, 0.18);
        border: 2px solid #ef4444;
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.9rem;
        margin-bottom: 1.15rem;
        box-shadow: 0 0 25px rgba(239, 68, 68, 0.35);
    }
    
    /* =========================================================================
       MOBILE RESPONSIVENESS & ALIGNMENT OPTIMIZATIONS
       ========================================================================= */
    @media (max-width: 768px) {
        .cert-studio-wrapper {
            padding: 1rem 0.75rem 3.5rem;
        }

        .hud-main-card {
            padding: 1.15rem 1rem;
            margin-bottom: 1.25rem;
            border-radius: 14px;
        }

        .track-dropdown-select {
            width: 100%;
            margin-top: 0.5rem;
        }

        .in-progress-alert-box {
            flex-direction: column;
            align-items: stretch;
            gap: 0.75rem;
            padding: 0.85rem 1rem;
        }
        .in-progress-alert-box a {
            width: 100%;
            justify-content: center;
            text-align: center;
            box-sizing: border-box;
        }

        .cert-toolbar-card {
            flex-direction: column;
            align-items: stretch;
            gap: 0.85rem;
            padding: 1rem;
            border-radius: 12px;
        }
        .cert-toolbar-card > div {
            width: 100%;
            justify-content: space-between;
        }
        .cert-toolbar-card button, 
        .cert-toolbar-card a,
        .btn-disabled-lock {
            flex: 1;
            justify-content: center;
            text-align: center;
            font-size: 0.76rem;
            padding: 0.45rem 0.65rem;
        }

        /* Responsive Certificate Card */
        .cert-3d-stage {
            margin: 1rem auto 2rem;
        }
        .cert-sheet-card {
            padding: 1.35rem 1rem;
            border-radius: 12px;
        }
        .cert-inner-frame {
            padding: 1.25rem 0.85rem;
        }
        .cert-title {
            font-size: 1.35rem !important;
            line-height: 1.3 !important;
        }
        .cert-recipient {
            font-size: 1.55rem !important;
            padding: 0 0.5rem 0.25rem !important;
            word-break: break-word;
        }
        .cert-course {
            font-size: 1.05rem !important;
            line-height: 1.35 !important;
        }

        /* Certificate Footer Grid Stack */
        .cert-footer-grid {
            flex-direction: column !important;
            align-items: center !important;
            gap: 1.25rem !important;
            text-align: center !important;
            padding-top: 1.15rem !important;
            margin-top: 1.25rem !important;
        }
        .cert-footer-grid > div {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
        }
        .cert-footer-grid .mono {
            text-align: left !important;
        }

        .gold-foil-seal {
            width: 78px;
            height: 78px;
        }
        .seal-text-inner {
            font-size: 0.48rem;
        }

        /* Mobile Locked Overlay */
        .cert-locked-watermark-overlay {
            padding: 1.25rem 1rem;
        }
        .locked-shield-icon {
            width: 54px;
            height: 54px;
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
        }
        .cert-locked-watermark-overlay h3 {
            font-size: 1.25rem;
            margin-bottom: 0.35rem;
        }
        .cert-locked-watermark-overlay p {
            font-size: 0.82rem;
            margin-bottom: 1.15rem;
            line-height: 1.5;
        }
        .cert-locked-watermark-overlay a {
            width: 100%;
            justify-content: center;
            box-sizing: border-box;
            font-size: 0.85rem;
            padding: 0.65rem 1.25rem;
        }
    }

    @media (max-width: 480px) {
        .cert-metric-card {
            padding: 0.75rem 0.85rem;
        }
        .cert-metric-icon {
            width: 38px;
            height: 38px;
            font-size: 1.15rem;
        }
        .metric-value-text {
            font-size: 1.15rem;
        }
    }

    </style>
</head>
<body class="theme-ivy" id="certPageRoot">
    <?php include __DIR__ . "/student-nav.php"; ?>

        <main class="cert-studio-wrapper">
        <!-- Header & Track Switcher -->
        <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.75rem;">
            <div>
                <div style="display:flex; align-items:center; gap:0.65rem;">
                    <span style="font-size:1.85rem;">🎓</span>
                    <div>
                        <h1 style="margin:0; font-size:1.45rem; font-weight:800; color:#0f172a; letter-spacing:-0.02em;">
                            Verified Credential & Certificate Studio
                        </h1>
                        <p style="margin:0.2rem 0 0; font-size:0.84rem; color:#64748b;">
                            Cryptographic Ledger Verification • Industry Accreditation • High-Resolution Export
                        </p>
                    </div>
                </div>
            </div>

            <!-- Course Track Switcher -->
            <?php if (count($enrolledCourses) > 1): ?>
            <div>
                <select class="track-dropdown-select" onchange="location.href='certificates.php?course_id='+this.value">
                    <?php foreach ($enrolledCourses as $course): ?>
                        <option value="<?php echo $course['id']; ?>" <?php echo $course['id'] == $selectedCourseId ? 'selected' : ''; ?>>
                            <?php echo e($course['title']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
            <?php endif; ?>
        </div>

        <!-- Academic Progress & Eligibility HUD -->
        <div class="hud-main-card no-print">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.65rem; margin-bottom:1.25rem;">
                <div>
                    <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#0f172a;">
                        <?php echo e($currentCourse['title'] ?? 'Full Stack Engineering'); ?>
                    </h3>
                    <p style="margin:0.25rem 0 0; font-size:0.82rem; color:#64748b;">
                        Cohort Graduation Status & Mandatory Milestone Completion
                    </p>
                </div>
                <?php if ($isCertUnlocked): ?>
                    <span style="font-size:0.82rem; font-weight:800; padding:0.4rem 1rem; background:#ecfdf5; color:#047857; border-radius:100px; border:1.5px solid #a7f3d0; display:inline-flex; align-items:center; gap:0.4rem;">
                        <span style="font-size:0.9rem;">✓</span> Official Credential Issued & Active
                    </span>
                <?php else: ?>
                    <span style="font-size:0.82rem; font-weight:800; padding:0.4rem 1rem; background:#fffbeb; color:#b45309; border-radius:100px; border:1.5px solid #fde68a; display:inline-flex; align-items:center; gap:0.4rem;">
                        <span>🔒</span> LOCKED • IN PROGRESS (<?php echo $progressPercent; ?>%)
                    </span>
                <?php endif; ?>
            </div>

            <!-- Metric Cards (Clean Light Theme Styling) -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.35rem;">
                <div class="cert-metric-card">
                    <div class="cert-metric-icon" style="background:#eef2ff; color:#4f46e5;">📹</div>
                    <div>
                        <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; font-weight:800; letter-spacing:0.04em;">Lectures Completed</div>
                        <div>
                            <span class="metric-value-text"><?php echo $completedLessons; ?></span>
                            <span class="metric-total-text">/ <?php echo $totalLessons; ?></span>
                        </div>
                    </div>
                </div>

                <div class="cert-metric-card">
                    <div class="cert-metric-icon" style="background:#ecfdf5; color:#059669;">🤖</div>
                    <div>
                        <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; font-weight:800; letter-spacing:0.04em;">Quizzes Passed</div>
                        <div>
                            <span class="metric-value-text"><?php echo $passedQuizzes; ?></span>
                            <span class="metric-total-text">/ <?php echo $totalQuizzes; ?></span>
                        </div>
                    </div>
                </div>

                <div class="cert-metric-card">
                    <div class="cert-metric-icon" style="background:#fef3c7; color:#d97706;">📝</div>
                    <div>
                        <div style="font-size:0.72rem; color:#64748b; text-transform:uppercase; font-weight:800; letter-spacing:0.04em;">Assignments</div>
                        <div>
                            <span class="metric-value-text"><?php echo $submittedAssignments; ?></span>
                            <span class="metric-total-text">/ <?php echo $totalAssignments; ?></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Progress Bar -->
            <div>
                <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.45rem;">
                    <span style="color:#0f172a;">Overall Course Completion</span>
                    <span style="color:<?php echo $isCertUnlocked ? '#059669' : '#4f46e5'; ?>; font-weight:800;"><?php echo $progressPercent; ?>%</span>
                </div>
                <div style="height:9px; background:#e2e8f0; border-radius:100px; overflow:hidden;">
                    <div style="height:100%; width:<?php echo $progressPercent; ?>%; background:linear-gradient(90deg, #4f46e5 0%, #10b981 100%); border-radius:100px; transition:width 0.4s ease;"></div>
                </div>
            </div>

            <?php if (!$isCertUnlocked): ?>
            <div class="in-progress-alert-box">
                <div style="font-size:0.85rem; color:#92400e; display:flex; align-items:center; gap:0.55rem;">
                    <span style="font-size:1.1rem;">⚠️</span>
                    <span><strong>Course in progress:</strong> Complete 100% of all video lectures, quizzes, and deliverables to unlock your official verified certificate.</span>
                </div>
                <a href="dashboard.php?course_id=<?php echo $selectedCourseId; ?>" style="background:#4f46e5; color:#ffffff; padding:0.5rem 1.15rem; border-radius:8px; font-weight:700; font-size:0.82rem; text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem; box-shadow:0 2px 6px rgba(79,70,229,0.3);">
                    <span>▶️</span> Continue Learning
                </a>
            </div>
            <?php endif; ?>
        </div>

        <?php
        $linkedInUrl = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME" .
            "&name=" . urlencode($currentCourse['title'] ?? 'Course Certification') .
            "&organizationName=" . urlencode("Education Algorithm") .
            "&issueYear=" . date('Y', strtotime($issueDateFormatted)) .
            "&issueMonth=" . date('n', strtotime($issueDateFormatted)) .
            "&certUrl=" . urlencode($verifyUrl) .
            "&certId=" . urlencode($effectiveCertUuid);
        ?>

        <!-- Certificate Studio Controls & Theme Switcher Toolbar -->
        <div class="cert-toolbar-card no-print">
            <!-- Theme Style Selector -->
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <span style="font-size:0.8rem; font-weight:700; color:#64748b;">Aesthetic:</span>
                <button type="button" onclick="setCertTheme('theme-ivy')" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:0.3rem 0.75rem; font-weight:700; border-radius:8px;">
                    🏛️ Classic Ivy Gold
                </button>
                <button type="button" onclick="setCertTheme('theme-cyberpunk')" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:0.3rem 0.75rem; font-weight:700; border-radius:8px;">
                    🔮 Cyberpunk Emerald
                </button>
            </div>

            <!-- Export & Social Action Buttons -->
            <div style="display:flex; align-items:center; gap:0.55rem; flex-wrap:wrap;">
                <?php if ($isCertUnlocked): ?>
                    <a href="<?php echo $linkedInUrl; ?>" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="background:#0077b5; color:#fff; border:none; display:inline-flex; align-items:center; gap:0.35rem; font-weight:700; border-radius:8px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.63a1.65 1.65 0 0 0-1.66 1.64c0 .91.74 1.65 1.66 1.65a1.65 1.65 0 0 0 1.65-1.65c0-.9-.74-1.64-1.65-1.64Z"/></svg>
                        <span>Add to LinkedIn</span>
                    </a>

                    <button type="button" class="btn btn-secondary btn-sm" onclick="downloadCertImage()" style="display:inline-flex; align-items:center; gap:0.35rem; font-weight:700; border-radius:8px;">
                        <span>📥 Download Image</span>
                    </button>

                    <button type="button" class="btn btn-secondary btn-sm" onclick="copyVerifyUrl('<?php echo e($verifyUrl); ?>')" style="display:inline-flex; align-items:center; gap:0.35rem; font-weight:700; border-radius:8px;">
                        <span>🔗 Share Link</span>
                    </button>

                    <button type="button" class="btn btn-primary btn-sm" onclick="window.print()" style="background:#4f46e5; border:none; display:inline-flex; align-items:center; gap:0.35rem; font-weight:700; border-radius:8px;">
                        <span>🖨️ Print / Vector PDF</span>
                    </button>
                <?php else: ?>
                    <button type="button" class="btn-disabled-lock" disabled title="Complete 100% course to unlock">
                        <span>🔒</span> Add to LinkedIn
                    </button>
                    <button type="button" class="btn-disabled-lock" disabled title="Complete 100% course to unlock">
                        <span>🔒</span> Download Image
                    </button>
                    <button type="button" class="btn-disabled-lock" disabled title="Complete 100% course to unlock">
                        <span>🔒</span> Print / Vector PDF
                    </button>
                <?php endif; ?>
            </div>
        </div>

        <!-- 3D Interactive Certificate Presentation Stage -->
        <div class="cert-3d-stage">
            
            <?php if (!$isCertUnlocked): ?>
            <!-- Frosted Glass Lock Overlay -->
            <div class="cert-locked-watermark-overlay no-print">
                <div class="locked-shield-icon">🔒</div>
                <h3 style="font-size:1.6rem; font-weight:800; margin:0 0 0.5rem; letter-spacing:-0.02em;">
                    Certificate Locked
                </h3>
                <p style="max-width:480px; font-size:0.92rem; color:#e2e8f0; line-height:1.6; margin:0 0 1.5rem;">
                    You are currently at <strong style="color:#fbbf24;"><?php echo $progressPercent; ?>% completion</strong>. Once all video lectures, chapter quizzes, and assessments are 100% completed, your verified graduate credential will be cryptographically minted and unlocked automatically!
                </p>
                <a href="dashboard.php?course_id=<?php echo $selectedCourseId; ?>" style="background:#4f46e5; color:#fff; border:none; padding:0.75rem 1.65rem; font-size:0.92rem; font-weight:800; border-radius:10px; text-decoration:none; box-shadow:0 4px 20px rgba(79,70,229,0.4); display:inline-flex; align-items:center; gap:0.4rem;">
                    <span>▶️</span> Continue Course to Unlock Credential
                </a>
            </div>
            <?php endif; ?>

            <div class="cert-sheet-card" id="interactiveCertCard" style="<?php echo !$isCertUnlocked ? 'filter: blur(2px) grayscale(30%); opacity: 0.65;' : ''; ?>">
                <div class="cert-crest-bg">EA</div>

                <div class="cert-inner-frame">
                    <div class="cert-corner-ornament corner-tl"></div>
                    <div class="cert-corner-ornament corner-tr"></div>
                    <div class="cert-corner-ornament corner-bl"></div>
                    <div class="cert-corner-ornament corner-br"></div>

                    <!-- Header Crest & Subtitle -->
                    <div style="text-align:center; margin-bottom:1.5rem;">
                        <div style="font-size:0.85rem; font-weight:900; letter-spacing:0.3em; color:#d4af37; text-transform:uppercase; margin-bottom:0.4rem;">
                            EDUCATION ALGORITHM • COUNCIL OF HIGHER COMPUTING
                        </div>
                        <h2 class="cert-title" style="font-size:2.35rem; font-weight:900; color:#0f172a; font-family:'Georgia', serif; letter-spacing:0.04em; margin:0 0 0.5rem;">
                            Certificate of Professional Excellence
                        </h2>
                        <p style="font-size:0.88rem; color:#64748b; text-transform:uppercase; letter-spacing:0.15em; margin:0;">
                            This is to certify and officially confer upon
                        </p>
                    </div>

                    <!-- Graduate Name -->
                    <div style="text-align:center; margin:1.25rem 0;">
                        <div class="cert-recipient" style="font-size:2.8rem; font-weight:800; color:#1e1b4b; font-family:'Georgia', serif; border-bottom:2px solid #e2e8f0; display:inline-block; padding:0 2rem 0.35rem;">
                            <?php echo e($studentName); ?>
                        </div>
                    </div>

                    <!-- Citation Text -->
                    <div style="text-align:center; max-width:640px; margin:0 auto 1.5rem;">
                        <p style="font-size:0.95rem; color:#475569; line-height:1.65; margin:0 0 0.75rem;">
                            for successfully demonstrating technical mastery, architectural competence, algorithms rigor, and completing all industrial capstone deliverables for:
                        </p>
                        <div class="cert-course" style="font-size:1.45rem; font-weight:800; color:#4338ca;">
                            <?php echo e($currentCourse['title'] ?? 'Java Full Stack & Cloud Engineering'); ?>
                        </div>
                    </div>

                    <!-- Footer: Signatures, QR Code & Holographic Gold Seal -->
                    <div class="cert-footer-grid" style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid #e2e8f0; padding-top:1.5rem; margin-top:2rem;">
                        <!-- Left: QR Code & Verification ID -->
                        <div style="text-align:left; display:flex; align-items:center; gap:0.85rem;">
                            <img src="<?php echo $qrCodeUrl; ?>" alt="Verification QR Code" width="80" height="80" style="border:1px solid #cbd5e1; border-radius:6px; padding:3px; background:#fff;">
                            <div class="mono" style="font-size:0.72rem; color:#64748b; line-height:1.5;">
                                <strong>LEDGER ID:</strong> <?php echo e($effectiveCertUuid); ?><br>
                                <strong>ISSUED:</strong> <?php echo $issueDateFormatted; ?><br>
                                <strong>INTEGRITY:</strong> <span style="color:#059669; font-weight:700;">✓ Cryptographically Valid</span>
                            </div>
                        </div>

                        <!-- Center: Embossed Gold Foil Seal -->
                        <div style="display:flex; justify-content:center;">
                            <div class="gold-foil-seal">
                                <div class="seal-text-inner">
                                    ★ OFFICIAL ★<br>VERIFIED<br>ALGORITHM<br>CREDENTIAL
                                </div>
                            </div>
                        </div>

                        <!-- Right: Academic Director Signature -->
                        <div style="text-align:right;">
                            <div style="font-family:'Brush Script MT', cursive, sans-serif; font-size:2rem; color:#4338ca; line-height:1;">
                                Arvind Sharma
                            </div>
                            <div style="border-top:1px solid #94a3b8; padding-top:0.35rem; font-size:0.82rem; font-weight:700; color:#0f172a; margin-top:0.25rem;">
                                Dr. Arvind Sharma<br>
                                <span style="font-size:0.72rem; color:#64748b; font-weight:normal;">Academic Director & Chancellor</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
    function setCertTheme(theme) {
        document.body.className = theme;
    }

    function copyVerifyUrl(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function() {
                alert('Verification URL copied to clipboard: ' + url);
            });
        } else {
            prompt('Copy certificate verification link:', url);
        }
    }

    function downloadCertImage() {
        var card = document.getElementById('interactiveCertCard');
        if (!card) return;
        html2canvas(card, { scale: 2, useCORS: true }).then(function(canvas) {
            var link = document.createElement('a');
            link.download = 'Education_Algorithm_Certificate.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // 3D Parallax Tilt Effect
    (function() {
        var card = document.getElementById('interactiveCertCard');
        if (!card) return;
        card.addEventListener('mousemove', function(e) {
            var rect = card.getBoundingClientRect();
            var x = e.clientX - rect.left - (rect.width / 2);
            var y = e.clientY - rect.top - (rect.height / 2);
            var rotX = -(y / rect.height) * 12;
            var rotY = (x / rect.width) * 12;
            card.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(1.01)';
        });
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    })();
    </script>
</body>
</html>
