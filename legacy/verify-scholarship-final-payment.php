<?php
// verify-scholarship-final-payment.php — Server-Side Verification for Final Balance Payment
// Route: /verify-scholarship-final-payment
require_once __DIR__ . '/config.php';

$orderId   = clean_text($_GET["order_id"] ?? $_POST["razorpay_order_id"] ?? "", 100);
$paymentId = clean_text($_GET["payment_id"] ?? $_POST["razorpay_payment_id"] ?? "", 100);
$signature = clean_text($_GET["signature"] ?? $_POST["razorpay_signature"] ?? "", 255);
$reservationId = (int)($_GET["reservation_id"] ?? $_POST["reservation_id"] ?? 0);

if (empty($orderId) || empty($paymentId) || empty($signature)) {
    http_response_code(400);
    die("Invalid payment transaction identifiers format.");
}

$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';
if (empty($keySecret)) {
    http_response_code(500);
    die("Payment secret key is not configured.");
}

// HMAC SIGNATURE VERIFICATION
$expectedSignature = hash_hmac("sha256", $orderId . "|" . $paymentId, $keySecret);
if (!hash_equals($expectedSignature, $signature)) {
    error_log("Final payment signature mismatch for Order: {$orderId}, Payment: {$paymentId}");
    http_response_code(400);
    die("Cryptographic signature verification failed.");
}

// Fetch reservation record
$stmt = $pdo->prepare("
    SELECT r.*, c.title as course_title, s.name as student_name, s.email as student_email, s.phone as student_phone 
    FROM scholarship_reservations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN students s ON r.student_id = s.id
    WHERE (r.id = ? OR r.payment_order_id = ?) LIMIT 1
");
$stmt->execute([$reservationId, $orderId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    http_response_code(404);
    die("Reservation record not found.");
}

// IDEMPOTENCY CHECK
if ($reservation["payment_status"] === "FULLY_PAID" && $reservation["enrollment_status"] === "ENROLLED") {
    header("Location: " . APP_URL . "/student-courses?enroll_success=1");
    exit;
}

try {
    $pdo->beginTransaction();

    $studentId = $reservation['student_id'];
    $studentEmail = $reservation['student_email'] ?? $reservation['payment_reference'];
    $studentName = $reservation['student_name'] ?? 'Student';
    $studentPhone = $reservation['student_phone'] ?? '';
    $courseId = $reservation['course_id'];
    $courseTitle = $reservation['course_title'];
    $remainingAmount = (float)$reservation['remaining_amount'];

    // 1. Update scholarship_reservations to FULLY_PAID & ENROLLED
    $stmtUpdate = $pdo->prepare("
        UPDATE scholarship_reservations 
        SET scholarship_status = 'CONVERTED',
            payment_status = 'FULLY_PAID',
            enrollment_status = 'ENROLLED',
            remaining_amount = 0.00
        WHERE id = ?
    ");
    $stmtUpdate->execute([$reservation['id']]);

    // 2. Create/Update official course enrollment in enrollments table to UNLOCK LMS ACCESS
    $stmtEnroll = $pdo->prepare("
        INSERT INTO enrollments (
            student_id, course_id, name, email, phone, course, amount,
            payment_status, status, razorpay_order_id, razorpay_payment_id, enrolled_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            'paid', 'active', ?, ?, NOW()
        )
        ON DUPLICATE KEY UPDATE payment_status = 'paid', status = 'active', enrolled_at = NOW()
    ");
    $stmtEnroll->execute([
        $studentId, $courseId, $studentName, $studentEmail, $studentPhone, $courseTitle, $reservation['scholarship_price'],
        $orderId, $paymentId
    ]);

    // 3. Log payment transaction
    $stmtPayment = $pdo->prepare("
        INSERT INTO payments (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
        VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success')
    ");
    try {
        $stmtPayment->execute([$studentId, $courseId, $remainingAmount, $orderId, $paymentId, $signature]);
    } catch (PDOException $e) {
        if ((string)$e->getCode() !== '23000') throw $e;
    }

    $pdo->commit();

    header("Location: " . APP_URL . "/student-courses?enroll_success=1");
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Final payment verification failed: " . $e->getMessage());
    http_response_code(500);
    die("Final payment verification encountered an internal error.");
}
