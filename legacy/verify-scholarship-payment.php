<?php
// verify-scholarship-payment.php — Server-Side Pre-Book Payment Verification Engine
// Route: /verify-scholarship-payment
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$orderId   = clean_text($_GET["order_id"] ?? $_POST["razorpay_order_id"] ?? "", 100);
$paymentId = clean_text($_GET["payment_id"] ?? $_POST["razorpay_payment_id"] ?? "", 100);
$signature = clean_text($_GET["signature"] ?? $_POST["razorpay_signature"] ?? "", 255);

if (empty($orderId) || empty($paymentId) || empty($signature)) {
    http_response_code(400);
    die("<div style='font-family:sans-serif; text-align:center; padding:3rem;'><h2>⚠️ Invalid Payment Identifiers</h2><p>Missing payment transaction parameters.</p><a href='scholarship-confirm'>Back to Confirmation</a></div>");
}

$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';
if (empty($keySecret)) {
    http_response_code(500);
    die("<div style='font-family:sans-serif; text-align:center; padding:3rem;'><h2>⚠️ Server Error</h2><p>Payment secret key is not configured.</p></div>");
}

// SERVER-SIDE CRYPTOGRAPHIC HMAC SIGNATURE VERIFICATION
$expectedSignature = hash_hmac("sha256", $orderId . "|" . $paymentId, $keySecret);
if (!hash_equals($expectedSignature, $signature)) {
    error_log("Pre-book signature mismatch for Order: {$orderId}, Payment: {$paymentId}");
    http_response_code(400);
    die("<div style='font-family:sans-serif; text-align:center; padding:3rem;'><h2>❌ Payment Verification Failed</h2><p>Cryptographic signature mismatch. Your payment could not be verified.</p><a href='scholarship-confirm'>Try Again</a></div>");
}

// Fetch scholarship reservation record matching razorpay order ID
$stmt = $pdo->prepare("SELECT * FROM scholarship_reservations WHERE payment_order_id = ? LIMIT 1");
$stmt->execute([$orderId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    http_response_code(404);
    die("<div style='font-family:sans-serif; text-align:center; padding:3rem;'><h2>⚠️ Reservation Record Not Found</h2><p>No scholarship reservation matches this order ID.</p></div>");
}

// IDEMPOTENCY CHECK (PHASE 8): If already verified, redirect safely to success page
if ($reservation["payment_status"] === "PREBOOK_PAID" && $reservation["scholarship_status"] === "HELD") {
    header("Location: " . APP_URL . "/scholarship-success.php?order_id=" . urlencode($orderId));
    exit;
}

// TRANSACTIONAL STATE UPDATE (FAIL-CLOSED)
try {
    $pdo->beginTransaction();

    // 1. Update scholarship_reservations strictly enforcing pre-book success state rules
    $stmtUpdate = $pdo->prepare("
        UPDATE scholarship_reservations 
        SET scholarship_status = 'HELD',
            payment_status = 'PREBOOK_PAID',
            enrollment_status = 'NOT_ENROLLED',
            prebook_paid_amount = 500.00,
            remaining_amount = 14500.00,
            payment_reference = ?,
            reservation_date = NOW()
        WHERE id = ?
    ");
    $stmtUpdate->execute([$paymentId, $reservation["id"]]);

    // 2. Log transaction in payments table for accounting audit trail
    $studentId = $reservation["student_id"];
    $courseId = $reservation["course_id"];
    $prebookAmount = 500.00;

    $stmtPayment = $pdo->prepare("
        INSERT INTO payments (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
        VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success')
    ");
    try {
        $stmtPayment->execute([$studentId, $courseId, $prebookAmount, $orderId, $paymentId, $signature]);
    } catch (PDOException $e) {
        if ((string)$e->getCode() !== '23000') throw $e;
    }

    $pdo->commit();

    // Redirect to isolated pre-book success page
    header("Location: " . APP_URL . "/scholarship-success.php?order_id=" . urlencode($orderId));
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Pre-book verification failed for order {$orderId}: " . $e->getMessage());
    http_response_code(500);
    die("<div style='font-family:sans-serif; text-align:center; padding:3rem;'><h2>⚠️ Server Error</h2><p>Payment verification encountered an internal error. Please contact support.</p></div>");
}
