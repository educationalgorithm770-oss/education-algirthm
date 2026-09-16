<?php
// api-scholarship-final-payment.php — Server-Side Razorpay Order Creator for Remaining Balance Payment
// Route: /api-scholarship-final-payment
require_once __DIR__ . '/config.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

verify_csrf();

$reservationId = (int)($_POST["reservation_id"] ?? 0);
if ($reservationId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid reservation ID."]);
    exit;
}

// Retrieve scholarship reservation from database
$stmt = $pdo->prepare("
    SELECT r.*, c.title as course_title, s.name as student_name, s.email as student_email, s.phone as student_phone
    FROM scholarship_reservations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN students s ON r.student_id = s.id
    WHERE r.id = ? LIMIT 1
");
$stmt->execute([$reservationId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    http_response_code(404);
    echo json_encode(["success" => false, "error" => "Reservation record not found."]);
    exit;
}

// SERVER CALCULATES REMAINING BALANCE (NEVER TRUST FRONTEND)
$remainingAmount = (float)$reservation['remaining_amount']; // 14500.00
if ($remainingAmount <= 0.00) {
    echo json_encode(["success" => false, "error" => "This reservation has already been fully paid."]);
    exit;
}

$keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : '';
$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';

if (empty($keyId) || empty($keySecret)) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Payment gateway credentials not configured."]);
    exit;
}

$amountInPaise = (int)round($remainingAmount * 100);

// Create Razorpay Order for Final Balance Payment
$ch = curl_init("https://api.razorpay.com/v1/orders");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $keyId . ":" . $keySecret,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        "amount" => $amountInPaise,
        "currency" => "INR",
        "receipt" => "final_" . uniqid(),
        "notes" => [
            "type" => "SCHOLARSHIP_FINAL_PAYMENT",
            "reservation_id" => $reservationId,
            "course" => $reservation['course_title']
        ]
    ]),
    CURLOPT_HTTPHEADER => ["Content-Type: application/json"],
    CURLOPT_TIMEOUT => 15
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$orderData = json_decode($response, true);
if ($httpCode !== 200 || empty($orderData["id"])) {
    error_log("Razorpay final payment order creation failed: " . $response);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to initialize payment gateway order."]);
    exit;
}

$razorpayOrderId = $orderData["id"];

// Update reservation status to FINAL_PAYMENT_PENDING
$stmtUpdate = $pdo->prepare("UPDATE scholarship_reservations SET payment_status = 'FINAL_PAYMENT_PENDING' WHERE id = ?");
$stmtUpdate->execute([$reservationId]);

echo json_encode([
    "success" => true,
    "key" => $keyId,
    "order_id" => $razorpayOrderId,
    "amount" => $amountInPaise,
    "currency" => "INR",
    "course_title" => $reservation['course_title'],
    "student_name" => $reservation['student_name'] ?? 'Student',
    "student_email" => $reservation['student_email'] ?? $reservation['payment_reference'],
    "student_phone" => $reservation['student_phone'] ?? ''
]);
