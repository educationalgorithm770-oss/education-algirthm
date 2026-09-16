<?php
require_once __DIR__ . "/config.php";
verify_csrf();
header("Content-Type: application/json");

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON payload."]);
    exit;
}

$orderId   = clean_text($input["razorpay_order_id"] ?? "", 100);
$paymentId = clean_text($input["razorpay_payment_id"] ?? "", 100);
$signature = clean_text($input["razorpay_signature"] ?? "", 255);

if (empty($orderId) || empty($paymentId) || !preg_match('/^[a-zA-Z0-9_\-]+$/', $orderId) || !preg_match('/^[a-zA-Z0-9_\-]+$/', $paymentId)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid payment transaction identifiers format."]);
    exit;
}

$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';
if ($keySecret === '') {
    http_response_code(500);
    echo json_encode(["error" => "Payment gateway secret key is not configured on the server."]);
    exit;
}

$expectedSignature = hash_hmac("sha256", $orderId . "|" . $paymentId, $keySecret);
if (empty($signature) || !hash_equals($expectedSignature, $signature)) {
    error_log("Razorpay signature mismatch for Order: {$orderId}, Payment: {$paymentId}");
    http_response_code(400);
    echo json_encode(["error" => "Payment cryptographic signature verification failed."]);
    exit;
}

// Fetch enrollment record
$stmt = $pdo->prepare("SELECT * FROM enrollments WHERE razorpay_order_id = ? LIMIT 1");
$stmt->execute([$orderId]);
$enrollment = $stmt->fetch();

if (!$enrollment) {
    http_response_code(404);
    echo json_encode(["error" => "Enrollment order record not found."]);
    exit;
}

$studentEmail = $enrollment["email"];
$studentName = $enrollment["name"];
$courseId = (int)($enrollment["course_id"] ?? 0);
$amount = (int)($enrollment["amount"] ?? 0);

$intentStmt = $pdo->prepare("SELECT id, course_id, amount, razorpay_order_id, status FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1");
$intentStmt->execute([$orderId]);
$intent = $intentStmt->fetch(PDO::FETCH_ASSOC);
if ($courseId <= 0 || $amount <= 0 || !$intent || $intent['razorpay_order_id'] !== $orderId || (int)$intent['course_id'] !== $courseId || (int)$intent['amount'] !== $amount) {
    http_response_code(400);
    echo json_encode(["error" => "Payment order does not match the stored enrollment intent."]);
    exit;
}

// Idempotency: If this enrollment was already completed and verified, return success safely
if ($enrollment["payment_status"] === "paid" && !empty($enrollment["student_id"])) {
    echo json_encode([
        "success" => true,
        "already_verified" => true,
        "login_email" => $studentEmail,
        "course_id" => $courseId
    ]);
    exit;
}

$loginEmail = $studentEmail;
$loginPassword = null;
$studentId = null;

// Use Database Transaction for all state changes (fail-closed)
try {
    $pdo->beginTransaction();

        // Canonical Student Resolution: ONE STUDENT = ONE ROW IN STUDENTS
    $resolution = resolveExistingStudent($studentEmail, $studentName, $enrollment['phone'] ?? '');
    $studentId = $resolution['student_id'];
    $loginEmail = $studentEmail;
    $loginPassword = null;

    // Update enrollment to active & paid and converted lead
    $stmtUpdate = $pdo->prepare("
        UPDATE enrollments 
        SET student_id = ?, payment_status = 'paid', status = 'active', lead_status = 'converted', razorpay_payment_id = ?, enrolled_at = NOW() 
        WHERE razorpay_order_id = ?
    ");
    $stmtUpdate->execute([$studentId, $paymentId, $orderId]);

    // Update CRM lead status to converted
    $stmtCrmConv = $pdo->prepare("UPDATE crm_leads SET status = 'converted' WHERE email = ?");
    $stmtCrmConv->execute([$studentEmail]);

    // Insert dedicated payment transaction record
    $stmtPayment = $pdo->prepare("
        INSERT INTO payments (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
        VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success')
    ");
    try {
        $stmtPayment->execute([$studentId, $courseId, $amount, $orderId, $paymentId, $signature]);
    } catch (PDOException $e) {
        if ((string)$e->getCode() !== '23000') throw $e;
    }

    // Commit all changes atomically
    $pdo->prepare("UPDATE payment_intents SET status='paid' WHERE id=?")->execute([(int)$intent['id']]);
    $pdo->commit();

    echo json_encode([
        "success" => true,
        "login_email" => $loginEmail,
        "login_password" => $loginPassword,
        "course_id" => $courseId
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("Payment verification transaction failed for order {$orderId}: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Payment verification encountered an internal error. Please contact support."]);
}

