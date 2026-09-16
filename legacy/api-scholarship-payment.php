<?php
// api-scholarship-payment.php — Server-Side Razorpay Order Creator for Pre-Book Payment
// Route: /api-scholarship-payment
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

verify_csrf();

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true);

if (!is_array($input)) {
    // Fallback to $_POST if form-encoded
    $input = $_POST;
}

$name  = clean_text($input["name"] ?? "", 100);
$email = validate_email_input($input["email"] ?? "") ?: strtolower(trim(clean_text($input["email"] ?? "", 150)));
$phone = clean_text($input["phone"] ?? "", 30);
$courseId = 1; // Standard Java Full Stack Development Program

if (empty($name) || empty($email) || empty($phone)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Please fill in all required fields (Name, Email, Phone)."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Please enter a valid email address."]);
    exit;
}

// Check for existing course details from server database
$stmtCourse = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
$stmtCourse->execute([$courseId]);
$course = $stmtCourse->fetch();

// SERVER IS SOURCE OF TRUTH FOR ALL FINANCIAL CALCULATIONS (NEVER TRUST FRONTEND)
$originalFee = 20000.00;
$scholarshipAmount = 5000.00;
$scholarshipPrice = $originalFee - $scholarshipAmount; // 15000.00
$prebookAmount = 500.00;
$remainingAmount = $scholarshipPrice - $prebookAmount; // 14500.00

// DUPLICATE PRE-BOOK PROTECTION (PHASE 23)
$stmtExisting = $pdo->prepare("
    SELECT id, scholarship_status, payment_status, remaining_amount 
    FROM scholarship_reservations 
    WHERE (student_id IN (SELECT id FROM students WHERE email = ?) OR payment_reference = ?) 
      AND course_id = ? 
      AND scholarship_status IN ('HELD', 'CONVERTED') 
      AND payment_status IN ('PREBOOK_PAID', 'FULLY_PAID')
    LIMIT 1
");
$stmtExisting->execute([$email, $email, $courseId]);
$existingReservation = $stmtExisting->fetch();

if ($existingReservation) {
    echo json_encode([
        "success" => false,
        "already_exists" => true,
        "error" => "You already have an active scholarship reservation for this course.",
        "redirect" => APP_URL . "/student-scholarships"
    ]);
    exit;
}

// Razorpay Key & Secret
$keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : '';
$keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';

if (empty($keyId) || empty($keySecret)) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Payment gateway is not configured on the server."]);
    exit;
}

// Calculate pre-book amount in paise for Razorpay API (₹500.00 = 50000 paise)
$amountInPaise = (int)round($prebookAmount * 100);

// Create Razorpay Order via Server-to-Server cURL
$ch = curl_init("https://api.razorpay.com/v1/orders");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_USERPWD => $keyId . ":" . $keySecret,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode([
        "amount" => $amountInPaise,
        "currency" => "INR",
        "receipt" => "prebook_" . uniqid(),
        "notes" => [
            "type" => "SCHOLARSHIP_PREBOOK",
            "course" => "Java Full Stack Development",
            "email" => $email,
            "name" => $name,
            "prebook_amount" => $prebookAmount,
            "remaining_amount" => $remainingAmount
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
    error_log("Razorpay pre-book order creation failed: " . $response);
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to initialize payment gateway order."]);
    exit;
}

$razorpayOrderId = $orderData["id"];

// Resolve or record student account without granting enrollment
$resolution = resolveExistingStudent($email, $name, $phone);
$studentId = $resolution["student_id"] ?? null;

// Store/Update reservation record in database
$stmtReservation = $pdo->prepare("
    INSERT INTO scholarship_reservations (
        student_id, course_id, original_fee, scholarship_amount, scholarship_price,
        prebook_amount, prebook_paid_amount, remaining_amount, currency,
        scholarship_status, payment_status, enrollment_status, payment_order_id,
        payment_reference, reservation_date
    ) VALUES (
        ?, ?, ?, ?, ?,
        ?, 0.00, ?, 'INR',
        'HOLD_PENDING', 'PREBOOK_PENDING', 'NOT_ENROLLED', ?,
        ?, NOW()
    )
");

$stmtReservation->execute([
    $studentId, $courseId, $originalFee, $scholarshipAmount, $scholarshipPrice,
    $prebookAmount, $remainingAmount, $razorpayOrderId,
    $email
]);

// Return client configuration for Razorpay Checkout Modal
echo json_encode([
    "success" => true,
    "key" => $keyId,
    "order_id" => $razorpayOrderId,
    "amount" => $amountInPaise,
    "currency" => "INR",
    "course_title" => "Java Full Stack Development",
    "student_name" => $name,
    "student_email" => $email,
    "student_phone" => $phone
]);
