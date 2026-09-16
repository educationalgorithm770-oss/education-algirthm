<?php
// api-scholarship-convert.php — Official Enrollment Conversion Backend Controller
// Route: /api-scholarship-convert.php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

if (empty($_SESSION['admin_id'])) {
    http_response_code(401);
    die("Unauthorized.");
}

verify_csrf();

$reservationId = (int)($_POST['reservation_id'] ?? 0);
$batch = clean_text($_POST['batch'] ?? '', 100);

if ($reservationId <= 0) {
    die("Invalid reservation ID.");
}

$stmt = $pdo->prepare("
    SELECT r.*, c.title as course_title, 
           s.id as resolved_student_id, s.name as student_name, s.email as student_email, s.phone as student_phone
    FROM scholarship_reservations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN students s ON r.student_id = s.id
    WHERE r.id = ? LIMIT 1
");
$stmt->execute([$reservationId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    die("Reservation record not found.");
}

$studentId = $reservation['resolved_student_id'];
$studentEmail = $reservation['student_email'] ?? $reservation['payment_reference'];
$studentName = $reservation['student_name'] ?? 'Student';
$studentPhone = $reservation['student_phone'] ?? '';
$courseId = $reservation['course_id'];
$courseTitle = $reservation['course_title'];
$scholarshipPrice = $reservation['scholarship_price'];
$orderId = $reservation['payment_order_id'];
$paymentId = $reservation['payment_reference'];

// Ensure student record exists in students table
if (empty($studentId) && !empty($studentEmail)) {
    $res = resolveExistingStudent($studentEmail, $studentName, $studentPhone);
    $studentId = $res['student_id'];
}

try {
    $pdo->beginTransaction();

    // 1. Update scholarship_reservations statuses
    $stmtUpdateRes = $pdo->prepare("
        UPDATE scholarship_reservations 
        SET scholarship_status = 'CONVERTED',
            enrollment_status = 'ENROLLED'
        WHERE id = ?
    ");
    $stmtUpdateRes->execute([$reservationId]);

    // 2. Create official course enrollment in enrollments table to GRANT LMS ACCESS
    $stmtEnroll = $pdo->prepare("
        INSERT INTO enrollments (
            student_id, course_id, name, email, phone, course, amount,
            payment_status, status, razorpay_order_id, razorpay_payment_id, enrolled_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            'partial', 'active', ?, ?, NOW()
        )
    ");
    $stmtEnroll->execute([
        $studentId, $courseId, $studentName, $studentEmail, $studentPhone, $courseTitle, $scholarshipPrice,
        $orderId, $paymentId
    ]);

    $pdo->commit();

    header("Location: admin-scholarships.php?converted=1");
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Enrollment conversion failed: " . $e->getMessage());
    die("Error performing enrollment conversion: " . $e->getMessage());
}
