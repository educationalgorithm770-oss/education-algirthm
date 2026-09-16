<?php
$adminActive = 'students';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// Fetch all available courses
$stmtCourses = $pdo->query("SELECT id, title, price, level FROM courses ORDER BY id ASC");
$allCourses = $stmtCourses->fetchAll();

// Fetch existing students for dropdown
$stmtStudents = $pdo->query("SELECT id, name, email, phone FROM students ORDER BY name ASC LIMIT 500");
$allStudents = $stmtStudents->fetchAll();

// Handle Form Submission
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["create_enrollment"])) {
    verify_csrf();

    $studentMode = clean_text($_POST["student_mode"] ?? "existing", 20);
    $courseId    = (int)($_POST["course_id"] ?? 0);
    $amount      = (float)($_POST["amount"] ?? 0);
    $paymentStatus = clean_text($_POST["payment_status"] ?? "paid", 20);
    $enrollmentStatus = clean_text($_POST["enrollment_status"] ?? "active", 20);
    $batch       = clean_text($_POST["batch_name"] ?? "Standard Cohort", 100);
    $transactionId = clean_text($_POST["transaction_id"] ?? "", 100);

    // Validate course
    $stmtC = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtC->execute([$courseId]);
    $selectedCourse = $stmtC->fetch();

    if (!$selectedCourse) {
        $error = "Please select a valid course.";
    } else {
        $studentId = 0;
        $studentName = "";
        $studentEmail = "";
        $studentPhone = "";

        if ($studentMode === "new") {
            $studentName  = clean_text($_POST["new_student_name"] ?? "", 100);
            $studentEmail = validate_email_input($_POST["new_student_email"] ?? "", 191);
            $studentPhone = clean_text($_POST["new_student_phone"] ?? "", 20);
            $rawPass      = $_POST["new_student_password"] ?? "";

            if (empty($studentName) || strlen($studentName) < 2) {
                $error = "Student name must be at least 2 characters.";
            } elseif (empty($studentEmail)) {
                $error = "Please enter a valid student email address.";
            } else {
                // Check if email already exists
                $stmtCheckS = $pdo->prepare("SELECT id FROM students WHERE email = ? LIMIT 1");
                $stmtCheckS->execute([$studentEmail]);
                $existingS = $stmtCheckS->fetch();

                if ($existingS) {
                    $studentId = (int)$existingS['id'];
                    $studentName = $existingS['name'];
                } else {
                    $passToHash = !empty($rawPass) ? $rawPass : 'Student@' . rand(1000, 9999);
                    $hashedPass = password_hash($passToHash, PASSWORD_DEFAULT);
                    $stmtNewS = $pdo->prepare("INSERT INTO students (name, email, phone, password, status, created_at) VALUES (?, ?, ?, ?, 'active', NOW())");
                    $stmtNewS->execute([$studentName, $studentEmail, $studentPhone, $hashedPass]);
                    $studentId = (int)$pdo->lastInsertId();

                    if (function_exists('send_system_email')) {
                        $subj = "Welcome to Education Algorithm — Your Student Account Credentials";
                        $body = "<div style='font-family:Arial,sans-serif;padding:20px;color:#1e293b;'><h2>Welcome to Education Algorithm, " . e($studentName) . "!</h2><p>Your student account has been created by the Admissions team.</p><p><strong>Email:</strong> " . e($studentEmail) . "<br><strong>Temporary Password:</strong> " . e($passToHash) . "</p><p><a href='" . (defined('APP_URL') ? APP_URL : '') . "/login.php' style='display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px;'>Log In to Student Portal</a></p></div>";
                        @send_system_email($studentEmail, $studentName, $subj, $body);
                    }
                }
            }
        } else {
            // Existing student chosen
            $studentId = (int)($_POST["existing_student_id"] ?? 0);
            $stmtFind = $pdo->prepare("SELECT id, name, email, phone FROM students WHERE id = ? LIMIT 1");
            $stmtFind->execute([$studentId]);
            $sRow = $stmtFind->fetch();

            if (!$sRow) {
                $error = "Please select an existing student.";
            } else {
                $studentName  = $sRow['name'];
                $studentEmail = $sRow['email'];
                $studentPhone = $sRow['phone'] ?? '';
            }
        }

        if (empty($error) && $studentId > 0) {
            // Check for duplicate enrollment in same course
            $stmtChkEnroll = $pdo->prepare("SELECT id FROM enrollments WHERE student_id = ? AND course_id = ? LIMIT 1");
            $stmtChkEnroll->execute([$studentId, $courseId]);
            $existingEnroll = $stmtChkEnroll->fetch();

            if ($existingEnroll) {
                $stmtUp = $pdo->prepare("
                    UPDATE enrollments 
                    SET amount = ?, payment_status = ?, status = ?, razorpay_payment_id = COALESCE(NULLIF(?, ''), razorpay_payment_id)
                    WHERE id = ?
                ");
                $stmtUp->execute([$amount, $paymentStatus, $enrollmentStatus, $transactionId, $existingEnroll['id']]);
                $message = "Enrollment updated successfully for " . e($studentName) . " in " . e($selectedCourse['title']);
            } else {
                $stmtIns = $pdo->prepare("
                    INSERT INTO enrollments (student_id, course_id, name, email, phone, course, amount, payment_status, status, razorpay_payment_id, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ");
                $stmtIns->execute([
                    $studentId,
                    $courseId,
                    $studentName,
                    $studentEmail,
                    $studentPhone,
                    $selectedCourse['title'],
                    $amount,
                    $paymentStatus,
                    $enrollmentStatus,
                    $transactionId ?: ('adm_manual_' . time())
                ]);
                $message = "New enrollment created successfully for " . e($studentName) . " in " . e($selectedCourse['title']);
            }

            // Record Admin Audit Log
            try {
                $pdo->prepare("INSERT INTO admin_audit_logs (admin_id, admin_name, action_type, description) VALUES (?, 'Super Admin', 'CREATE_ENROLLMENT', ?)")
                    ->execute([$adminId, "Created manual enrollment for student #{$studentId} ({$studentName}) in course #{$courseId} ({$selectedCourse['title']})"]);
            } catch (Exception $e) {}

            header("Location: admin-students.php?msg=enrollment_success&student=" . urlencode($studentName));
            exit;
        }
    }
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
    <title>Create New Enrollment — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
    <style>
        body {
            background-color: #f8fafc;
            color: #0f172a;
        }
        .admin-main-container {
            max-width: 960px;
            margin: 0 auto;
            padding: 1.5rem 1.25rem 4rem;
        }
        .admin-page-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.75rem 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 2rem;
        }
        .form-section-header {
            font-size: 0.95rem;
            font-weight: 700;
            color: #0f172a;
            margin: 1.5rem 0 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #f1f5f9;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .form-section-header:first-of-type {
            margin-top: 0;
        }
        .form-grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
            margin-bottom: 1rem;
        }
        @media (max-width: 700px) {
            .form-grid-2 { grid-template-columns: 1fr; }
        }
        .form-group label {
            display: block;
            font-size: 0.82rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 0.35rem;
        }
        .form-control-input {
            width: 100%;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            padding: 0.55rem 0.85rem;
            border-radius: 6px;
            font-size: 0.88rem;
            box-sizing: border-box;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-control-input:focus {
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
        }
        .mode-toggle-group {
            display: inline-flex;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 3px;
            margin-bottom: 1.25rem;
        }
        .mode-btn {
            background: transparent;
            border: none;
            color: #64748b;
            padding: 0.4rem 1rem;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .mode-btn.active {
            background: #ffffff;
            color: #4f46e5;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            font-weight: 700;
        }
    </style>
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>

        <main class="admin-main-container">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
                <div>
                    <div style="font-size: 0.8rem; font-weight: 600; color: #4f46e5; margin-bottom: 0.25rem;">
                        <a href="admin-students.php" style="color: #4f46e5; text-decoration: none;">← Back to Student 360° Directory</a>
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">
                        Create New Student Enrollment
                    </h1>
                </div>
            </div>

            <?php if (!empty($error)): ?>
                <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-size: 0.88rem; font-weight: 600;">
                    ⚠️ <?php echo e($error); ?>
                </div>
            <?php endif; ?>

            <div class="admin-page-card">
                <form method="POST" action="admin-create-enrollment.php">
                    <input type="hidden" name="csrf_token" value="<?php echo csrf_token(); ?>">
                    <input type="hidden" name="create_enrollment" value="1">
                    <input type="hidden" name="student_mode" id="studentModeInput" value="existing">

                    <!-- 1. Student Identity -->
                    <div class="form-section-header">
                        <span>👤</span> 1. Student Profile
                    </div>

                    <div class="mode-toggle-group">
                        <button type="button" class="mode-btn active" id="btnModeExisting" onclick="setStudentMode('existing')">
                            Existing Registered Student
                        </button>
                        <button type="button" class="mode-btn" id="btnModeNew" onclick="setStudentMode('new')">
                            ➕ Register New Student
                        </button>
                    </div>

                    <!-- Existing Student Dropdown -->
                    <div id="sectionExistingStudent">
                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label for="existingStudentSelect">Select Student from Directory:</label>
                            <select name="existing_student_id" id="existingStudentSelect" class="form-control-input">
                                <option value="">-- Choose Existing Student (<?php echo count($allStudents); ?> Registered) --</option>
                                <?php foreach ($allStudents as $st): ?>
                                    <option value="<?php echo $st['id']; ?>">
                                        <?php echo e($st['name']); ?> (<?php echo e($st['email']); ?>) <?php echo !empty($st['phone']) ? '• ' . e($st['phone']) : ''; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <!-- New Student Registration Inputs -->
                    <div id="sectionNewStudent" style="display: none;">
                        <div class="form-grid-2">
                            <div class="form-group">
                                <label for="newStudentName">Full Name *</label>
                                <input type="text" name="new_student_name" id="newStudentName" class="form-control-input" placeholder="e.g. Rahul Sharma">
                            </div>
                            <div class="form-group">
                                <label for="newStudentEmail">Email Address *</label>
                                <input type="email" name="new_student_email" id="newStudentEmail" class="form-control-input" placeholder="student@example.com">
                            </div>
                        </div>
                        <div class="form-grid-2" style="margin-bottom: 1.25rem;">
                            <div class="form-group">
                                <label for="newStudentPhone">Mobile Phone</label>
                                <input type="tel" name="new_student_phone" id="newStudentPhone" class="form-control-input" placeholder="+91 98765 43210">
                            </div>
                            <div class="form-group">
                                <label for="newStudentPassword">Password (Optional)</label>
                                <input type="text" name="new_student_password" id="newStudentPassword" class="form-control-input" placeholder="Auto-generated if empty">
                            </div>
                        </div>
                    </div>

                    <!-- 2. Course & Cohort Allocation -->
                    <div class="form-section-header">
                        <span>📚</span> 2. Course & Cohort Allocation
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="courseSelect">Select Course Program *</label>
                            <select name="course_id" id="courseSelect" class="form-control-input" onchange="updateCoursePrice(this)" required>
                                <option value="">-- Choose Course Program --</option>
                                <?php foreach ($allCourses as $c): ?>
                                    <option value="<?php echo $c['id']; ?>" data-price="<?php echo $c['price']; ?>">
                                        <?php echo e($c['title']); ?> (₹<?php echo number_format($c['price']); ?> • <?php echo ucfirst($c['level'] ?? 'All'); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="batchName">Cohort / Batch Name</label>
                            <input type="text" name="batch_name" id="batchName" class="form-control-input" value="Standard Cohort">
                        </div>
                    </div>

                    <!-- 3. Financial & Access Controls -->
                    <div class="form-section-header">
                        <span>💳</span> 3. Financials & Access
                    </div>

                    <div class="form-grid-2">
                        <div class="form-group">
                            <label for="enrollAmount">Payable Amount (₹ INR) *</label>
                            <input type="number" step="0.01" name="amount" id="enrollAmount" class="form-control-input" value="15000" required>
                        </div>
                        <div class="form-group">
                            <label for="paymentStatus">Payment Status *</label>
                            <select name="payment_status" id="paymentStatus" class="form-control-input">
                                <option value="paid">✅ Paid (Full Access Granted)</option>
                                <option value="waived">🎟️ Scholarship / 100% Fee Waiver</option>
                                <option value="pending">⏳ Pending Payment Capture</option>
                                <option value="failed">❌ Payment Failed</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-grid-2" style="margin-bottom: 1.75rem;">
                        <div class="form-group">
                            <label for="enrollmentStatus">Course Access Status *</label>
                            <select name="enrollment_status" id="enrollmentStatus" class="form-control-input">
                                <option value="active">🟢 Active (Access Enabled)</option>
                                <option value="pending">🟡 Pending Onboarding</option>
                                <option value="suspended">🔴 Suspended</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="transactionId">Payment Ref / Transaction ID</label>
                            <input type="text" name="transaction_id" id="transactionId" class="form-control-input" placeholder="e.g. pay_manual_admin_<?php echo time(); ?>">
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1.25rem; border-top: 1px solid #f1f5f9;">
                        <a href="admin-students.php" class="btn btn-secondary" style="padding: 0.55rem 1.25rem; text-decoration: none; border-radius: 6px;">
                            Cancel
                        </a>
                        <button type="submit" class="btn btn-primary" style="padding: 0.55rem 1.5rem; font-weight: 700; background: #4f46e5; border: none; border-radius: 6px; color: #fff;">
                            Grant Enrollment Access
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </div>

    <script>
    function setStudentMode(mode) {
        document.getElementById('studentModeInput').value = mode;
        document.getElementById('btnModeExisting').classList.toggle('active', mode === 'existing');
        document.getElementById('btnModeNew').classList.toggle('active', mode === 'new');
        document.getElementById('sectionExistingStudent').style.display = (mode === 'existing') ? 'block' : 'none';
        document.getElementById('sectionNewStudent').style.display = (mode === 'new') ? 'block' : 'none';
    }

    function updateCoursePrice(sel) {
        const opt = sel.options[sel.selectedIndex];
        if (opt && opt.dataset.price) {
            document.getElementById('enrollAmount').value = opt.dataset.price;
        }
    }
    </script>
</body>
</html>
