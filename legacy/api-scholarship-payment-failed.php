<?php
// api-scholarship-payment-failed.php — Server Handler for Failed or Cancelled Pre-Book Payments
// Route: /api-scholarship-payment-failed
require_once __DIR__ . '/config.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

verify_csrf();

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true) ?: $_POST;

$orderId = clean_text($input["order_id"] ?? "", 100);
$reason  = clean_text($input["reason"] ?? "Payment cancelled or declined", 255);
$status  = clean_text($input["status"] ?? "FAILED", 20); // FAILED or CANCELLED

if (!empty($orderId)) {
    // Record payment failure / cancellation without granting scholarship hold or enrollment
    $stmtUpdate = $pdo->prepare("
        UPDATE scholarship_reservations 
        SET payment_status = ?,
            scholarship_status = 'OFFERED',
            enrollment_status = 'NOT_ENROLLED'
        WHERE payment_order_id = ? AND payment_status = 'PREBOOK_PENDING'
    ");
    $stmtUpdate->execute([$status, $orderId]);
}

echo json_encode([
    "success" => true,
    "payment_status" => $status,
    "scholarship_status" => "OFFERED",
    "enrollment_status" => "NOT_ENROLLED",
    "message" => "Payment was not completed."
]);
