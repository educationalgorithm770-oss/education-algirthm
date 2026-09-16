<?php
require_once __DIR__ . "/config.php";
verify_csrf();
header("Content-Type: application/json");

try {
    $rawInput = file_get_contents("php://input");
    $input = json_decode($rawInput, true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON payload."]);
        exit;
    }

    $name     = clean_text($input["name"] ?? "", 80);
    $email    = validate_email_input($input["email"] ?? "", 191);
    $phoneRaw = trim($input["phone"] ?? "");
    $phone    = validate_phone_input($phoneRaw);
    $courseId = validate_integer_range($input["course_id"] ?? 0, 1, 100000, 0);

    if (empty($name) || mb_strlen($name) < 2) {
        http_response_code(400);
        echo json_encode(["error" => "Valid full name is required (min 2 characters)."]);
        exit;
    }

    if (!$email) {
        http_response_code(400);
        echo json_encode(["error" => "A valid email address is required."]);
        exit;
    }

    if (!$phone) {
        http_response_code(400);
        echo json_encode(["error" => "A valid phone number is required (7–15 digits)."]);
        exit;
    }

    // Fetch authentic course details and price from database (never trust client)
    $stmtCourse = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtCourse->execute([$courseId]);
    $course = $stmtCourse->fetch();

    if (!$course) {
        http_response_code(404);
        echo json_encode(["error" => "Selected course not found."]);
        exit;
    }

    $courseTitle = $course['title'] ?? "Full Stack Development — From Scratch";
    $basePrice   = (float)($course['price'] ?? 15000);
    $discount    = 0;
    $appliedCoupon = null;

    $couponCode = clean_text($input['coupon'] ?? ($input['coupon_code'] ?? ''), 30);
    if (!empty($couponCode)) {
        require_once __DIR__ . '/api-enrollment.php';
        $calc = calculateDiscount($pdo, $couponCode, $basePrice);
        if ($calc) {
            $discount      = (float)$calc['discount'];
            $appliedCoupon = $calc['code'];
        }
    }

    $amount      = max(0, $basePrice - $discount);
    $amountPaise = (int)round($amount * 100);

    // 1. Create the order with Razorpay
    $orderData = [
        "amount" => $amountPaise, // in paise
        "currency" => "INR",
        "receipt" => "rcpt_" . time() . "_" . rand(100, 999),
        "notes" => [
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "course_id" => (string)$course['id'],
            "course_title" => $courseTitle
        ]
    ];

    $keyId = defined('RAZORPAY_KEY_ID') ? RAZORPAY_KEY_ID : '';
    $keySecret = defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : '';

    $ch = curl_init("https://api.razorpay.com/v1/orders");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orderData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_USERPWD, $keyId . ":" . $keySecret);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $order = json_decode($response, true);

    // Enforce authentic gateway order creation in production
    if ($httpCode !== 200 || empty($order["id"])) {
        error_log("Razorpay order creation failed: " . ($response ?: 'Empty response') . " (HTTP $httpCode)");
        http_response_code(502);
        echo json_encode(["error" => "Failed to initiate payment session with gateway. Please try again or contact admissions."]);
        exit;
    }
    $orderId = $order["id"];

    // 2. Save pending enrollment record
    $stmt = $pdo->prepare("
        INSERT INTO enrollments (name, email, phone, course, course_id, amount, payment_status, status, razorpay_order_id) 
        VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)
    ");
    $stmt->execute([$name, $email, $phone, $courseTitle, $course['id'], $amount, $orderId]);

    // Persist a server-side payment intent for exact webhook/verification binding.
    $intentId = bin2hex(random_bytes(16));
    $stmtIntent = $pdo->prepare("INSERT INTO payment_intents (verification_id,email,course_id,amount,amount_paise,coupon_code,razorpay_order_id,status,created_at) VALUES (?,?,?,?,?,?,?,'created',NOW())");
    $stmtIntent->execute([$intentId,$email,(int)$course['id'],$amount,$amountPaise,$appliedCoupon,$orderId]);

    // 3. Pipe to CRM leads pipeline
    $stmtCrmCheck = $pdo->prepare("SELECT id, notes FROM crm_leads WHERE email = ? LIMIT 1");
    $stmtCrmCheck->execute([$email]);
    $existingLead = $stmtCrmCheck->fetch();

    if ($existingLead) {
        $newNotes = $existingLead['notes'] . "\n[" . date('Y-m-d H:i:s') . "] Initiated checkout for: " . $courseTitle;
        $stmtCrmUpd = $pdo->prepare("UPDATE crm_leads SET phone = ?, course_id = ?, status = 'new', notes = ? WHERE id = ?");
        $stmtCrmUpd->execute([$phone, $course['id'], $newNotes, $existingLead['id']]);
    } else {
        $notes = "[" . date('Y-m-d H:i:s') . "] Initiated checkout for: " . $courseTitle;
        $stmtCrmIns = $pdo->prepare("INSERT INTO crm_leads (name, email, phone, course_id, source, status, notes) VALUES (?, ?, ?, ?, 'checkout', 'new', ?)");
        $stmtCrmIns->execute([$name, $email, $phone, $course['id'], $notes]);
    }

    echo json_encode([
        "order_id" => $orderId,
        "amount" => $amount * 100,
        "key_id" => $keyId,
        "name" => $name,
        "email" => $email,
        "phone" => $phone,
        "course_title" => $courseTitle
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["error" => "Internal Order Creation error.", "message" => $e->getMessage()]);
}
