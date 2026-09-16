<?php
// api-enrollment.php — Complete Multi-Course Enrollment, Verification & Payment Gateway Engine

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/mail.php';

function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(["success" => false, "error" => $message]);
    exit;
}

// Calculate Discount Helper
function calculateDiscount($pdo, $couponCode, $originalPrice) {
    $couponCode = strtoupper(clean_text($couponCode, 30));
    if (empty($couponCode)) return null;

    try {
        $stmt = $pdo->prepare("
            SELECT * FROM coupons 
            WHERE UPPER(code) = ? 
              AND is_active = 1 
              AND (expires_at IS NULL OR expires_at >= CURDATE())
              AND (max_uses = 0 OR times_used < max_uses)
            LIMIT 1
        ");
        $stmt->execute([$couponCode]);
        $coupon = $stmt->fetch();

        if (!$coupon) return null;

        $discount = 0;
        if ($coupon['discount_type'] === 'percentage') {
            $discount = ($originalPrice * (float)$coupon['discount_value']) / 100;
        } else {
            $discount = (float)$coupon['discount_value'];
        }

        $discount = min($discount, $originalPrice);
        $finalPrice = max(0, $originalPrice - $discount);

        return [
            'code'           => $coupon['code'],
            'discount'       => round($discount, 2),
            'final_price'    => round($finalPrice, 2),
            'discount_type'  => $coupon['discount_type'],
            'discount_value' => (float)$coupon['discount_value']
        ];
    } catch (Exception $e) {
        error_log("Coupon calculation error: " . $e->getMessage());
        return null;
    }
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendError("Invalid HTTP method. Only POST is allowed.", 405);
}

$rawInput = file_get_contents("php://input");
$input = json_decode($rawInput, true) ?: $_POST;
$action = trim($_GET['action'] ?? ($input['action'] ?? ''));

// =========================================================================
// ACTION: check_email — Check existing student and multi-course status
// =========================================================================
if ($action === 'check_email') {
    $email    = strtolower(trim(validate_email_input($input["email"] ?? "", 191)));
    $courseId = validate_integer_range($input["course_id"] ?? 0, 1, 100000, 0);

    if (empty($email)) {
        sendError("Valid email required.");
    }

    // READ-ONLY Check: Do NOT insert new student records during realtime typing!
    $stmtEmail = $pdo->prepare("SELECT id, name, email, phone, status FROM students WHERE LOWER(email) = ? LIMIT 1");
    $stmtEmail->execute([$email]);
    $existingStudent = $stmtEmail->fetch(PDO::FETCH_ASSOC);

    $isExisting = !empty($existingStudent);
    $studentId  = $existingStudent ? (int)$existingStudent['id'] : 0;

    $alreadyEnrolled = ($isExisting && $courseId > 0) ? getStudentEnrollmentForCourse($studentId, $courseId) : null;

    if ($alreadyEnrolled) {
        echo json_encode([
            "success"          => true,
            "is_existing"      => true,
            "already_enrolled" => true,
            "enrollment_id"    => 'EA-2026-' . str_pad($alreadyEnrolled['id'], 5, '0', STR_PAD_LEFT),
            "course_id"        => $courseId,
            "course_title"     => $alreadyEnrolled['course_title'] ?? '',
            "status"           => "active",
            "payment_status"   => "paid",
            "message"          => "You already have an active paid enrollment in this course."
        ]);
        exit;
    }

    echo json_encode([
        "success"          => true,
        "is_existing"      => $isExisting,
        "already_enrolled" => false,
        "student_name"     => $existingStudent['name'] ?? '',
        "student_phone"    => $existingStudent['phone'] ?? ''
    ]);
    exit;
}

// =========================================================================
// ACTION: validate_coupon / apply_coupon
// =========================================================================
if ($action === 'validate_coupon' || $action === 'apply_coupon') {
    $couponCode = clean_text($input['coupon'] ?? ($input['coupon_code'] ?? ''), 30);
    $courseId   = validate_integer_range($input['course_id'] ?? 0, 1, 100000, 0);

    if ($courseId <= 0) {
        sendError("Please select a valid course track.");
    }

    $stmtC = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtC->execute([$courseId]);
    $course = $stmtC->fetch();

    if (!$course) {
        sendError("Selected course does not exist.");
    }

    $basePrice = (float)$course['price'];
    $calc = calculateDiscount($pdo, $couponCode, $basePrice);

    if (!$calc) {
        sendError("Invalid, expired, or fully redeemed coupon code.");
    }

    echo json_encode([
        "success"        => true,
        "coupon_code"    => $calc['code'],
        "code"           => $calc['code'],
        "discount"       => $calc['discount'],
        "final_price"    => $calc['final_price'],
        "payable_amount" => $calc['final_price'],
        "amount_paise"   => (int)round($calc['final_price'] * 100),
        "original_price" => $basePrice,
        "base_price"     => $basePrice,
        "discount_type"  => $calc['discount_type'],
        "discount_value" => $calc['discount_value']
    ]);
    exit;
}

// =========================================================================
// ACTION: send_otp / start_verification — OTP Dispatcher with Multi-Course Detection
// =========================================================================
if ($action === 'send_otp' || $action === 'start_verification') {
    $name        = clean_text($input["name"] ?? "", 100);
    $email       = strtolower(trim(validate_email_input($input["email"] ?? "", 191)));
    $phone       = clean_text($input["phone"] ?? "", 20);
    $password    = $input["password"] ?? "";
    $couponCode  = clean_text($input["coupon"] ?? ($input["coupon_code"] ?? ""), 30);
    $courseId    = validate_integer_range($input["course_id"] ?? 0, 1, 100000, 0);

    if (empty($email)) {
        sendError("A valid email address is required.");
    }
    if ($courseId <= 0) {
        sendError("A valid course selection is required.");
    }

    $stmtCourse = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtCourse->execute([$courseId]);
    $course = $stmtCourse->fetch();

    if (!$course) {
        sendError("The selected course is not available.");
    }

    $courseTitle = $course['title'];
    $basePrice   = (float)$course['price'];
    $discount    = 0;
    $appliedCoupon = "";

    if (!empty($couponCode)) {
        $calc = calculateDiscount($pdo, $couponCode, $basePrice);
        if ($calc) {
            $discount      = (float)$calc['discount'];
            $appliedCoupon = $calc['code'];
        }
    }

    $amount = max(0, $basePrice - $discount);

    // Check if student already exists in database (READ-ONLY LOOKUP — DO NOT CREATE ACCOUNTS IN STEP 1!)
    $stmtEmail = $pdo->prepare("SELECT id, name, email, phone, status FROM students WHERE LOWER(email) = ? LIMIT 1");
    $stmtEmail->execute([$email]);
    $existingStudent = $stmtEmail->fetch(PDO::FETCH_ASSOC);

    $isExistingStudent = !empty($existingStudent);
    $studentId = $existingStudent ? (int)$existingStudent['id'] : 0;

    // If new student, password is required
    if (!$isExistingStudent && strlen($password) < 6) {
        sendError("Password must be at least 6 characters long.");
    }

    // Check if student is already actively enrolled in this specific course
    $alreadyEnrolled = getStudentEnrollmentForCourse($studentId, $courseId);
    if ($alreadyEnrolled) {
        $enIdFormatted = 'EA-2026-' . str_pad($alreadyEnrolled['id'], 5, '0', STR_PAD_LEFT);
        echo json_encode([
            "success"          => true,
            "already_enrolled" => true,
            "enrollment_id"    => $enIdFormatted,
            "course_id"        => $courseId,
            "course_title"     => $courseTitle,
            "status"           => "active",
            "payment_status"   => "paid",
            "message"          => "You already have an active paid enrollment in this course.",
            "dashboard_url"    => "dashboard.php?course_id=" . $courseId
        ]);
        exit;
    }

    // Rate Limiting
    require_once __DIR__ . '/includes/rate-limiter.php';
    $otpIp = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $emailAllowed = check_rate_limit($pdo, hash('sha256', $email), 'otp_email_10m', 10, 600);
    $ipAllowed    = check_rate_limit($pdo, hash('sha256', $otpIp), 'otp_ip_1h', 30, 3600);
    if (!$emailAllowed || !$ipAllowed) {
        http_response_code(429);
        sendError("Too many OTP requests. Please wait a few moments before trying again.");
    }

    $passwordHash   = !empty($password) ? password_hash($password, PASSWORD_DEFAULT) : '';
    $otp            = (string)random_int(100000, 999999);
    $otpHash        = hash('sha256', $otp);
    $verificationId = 'VER_' . bin2hex(random_bytes(16));
    $enrollmentSessionId = 'ESESS_' . bin2hex(random_bytes(16));
    $expiresAt      = (int)(time() + 600); // 10 minutes

    $payloadData = [
        'verification_id'      => $verificationId,
        'enrollment_session_id'=> $enrollmentSessionId,
        'student_id'           => $studentId,
        'is_existing_student'  => $isExistingStudent,
        'name'                 => !empty($name) ? $name : ($resolution['student']['name'] ?? 'Student'),
        'email'                => $email,
        'phone'                => !empty($phone) ? $phone : ($resolution['student']['phone'] ?? ''),
        'password_hash'        => $passwordHash,
        'course_id'            => (int)$course['id'],
        'course_title'         => $courseTitle,
        'base_price'           => $basePrice,
        'discount'             => $discount,
        'coupon_code'          => $appliedCoupon,
        'amount'               => $amount
    ];

    try {
        $pdo->prepare("DELETE FROM email_verifications WHERE email = ?")->execute([$email]);
        $stmtSave = $pdo->prepare("
            INSERT INTO email_verifications (verification_id, email, otp, otp_hash, payload, expires_at, attempts, is_verified)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0)
        ");
        $stmtSave->execute([$verificationId, $email, $otp, $otpHash, json_encode($payloadData), $expiresAt]);

        // Log Prospect Lead into Admissions & Contact Inquiries (Admin Dashboard)
        try {
            $inquiryMsg = "Track of interest: " . $courseTitle . "\n\nStep 1 Email Verification requested from enrollment page.";
            $pdo->prepare("DELETE FROM contact_messages WHERE LOWER(email) = ? AND message LIKE '%Step 1 Email Verification%'")->execute([$email]);
            $stmtInquiry = $pdo->prepare("
                INSERT INTO contact_messages (name, email, phone, message)
                VALUES (?, ?, ?, ?)
            ");
            $stmtInquiry->execute([!empty($name) ? $name : 'Prospect Student', $email, $phone, $inquiryMsg]);
        } catch (Throwable $e) {
            error_log("Failed to log prospect inquiry: " . $e->getMessage());
        }
    } catch (Throwable $e) {
        error_log("Failed to store enrollment verification: " . $e->getMessage());
        sendError("Unable to start email verification. Please try again.", 500);
    }

    $_SESSION['pending_enrollment'] = [
        'verification_id'      => $verificationId,
        'enrollment_session_id'=> $enrollmentSessionId,
        'email'                => $email,
        'otp_hash'             => $otpHash,
        'payload'              => $payloadData,
        'expires_at'           => $expiresAt,
        'attempts'             => 0
    ];

    // Send OTP Email
    $emailSubject = "Your Education Algorithm Verification Code: {$otp}";
    $emailBody = "
        <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; background: #07090e; color: #f8fafc; padding: 32px 24px; border-radius: 16px; max-width: 540px; margin: 0 auto; border: 1px solid #1e293b;'>
            <div style='text-align: center; margin-bottom: 24px;'>
                <h2 style='color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;'>Education Algorithm</h2>
                <p style='color: #94a3b8; font-size: 13px; margin: 4px 0 0;'>Master Scalable Software Engineering</p>
            </div>
            <p style='font-size: 15px; color: #cbd5e1; margin-bottom: 8px;'>Hello <strong>" . htmlspecialchars($payloadData['name']) . "</strong>,</p>
            <p style='font-size: 14px; color: #94a3b8; line-height: 1.6;'>
                Use the following 6-digit verification code to complete your enrollment for <strong style='color: #818cf8;'>" . htmlspecialchars($courseTitle) . "</strong>:
            </p>
            <div style='text-align: center; margin: 28px 0;'>
                <span style='font-family: Consolas, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #6366f1; background: #0f141f; padding: 14px 28px; border-radius: 12px; border: 1px solid #334155; display: inline-block;'>
                    {$otp}
                </span>
            </div>
            <p style='font-size: 13px; color: #64748b; text-align: center; margin: 0;'>
                Code valid for 10 minutes. If you did not request this code, please ignore this email.
            </p>
        </div>
    ";

    send_system_email($email, $payloadData['name'], $emailSubject, $emailBody);

    $msg = "Verification code sent to {$email}.";

    echo json_encode([
        "success"              => true,
        "is_existing_student"  => $isExistingStudent,
        "verification_id"      => $verificationId,
        "enrollment_session_id"=> $enrollmentSessionId,
        "email"                => $email,
        "student_name"         => $payloadData['name'],
        "student_phone"        => $payloadData['phone'],
        "course_title"         => $courseTitle,
        "amount"               => $amount,
        "message"              => $msg
    ]);
    exit;
}

// =========================================================================
// ACTION: verify_otp — Validate OTP code and authorize next stage
// =========================================================================
if ($action === 'verify_otp') {
    $verificationId = clean_text($input['verification_id'] ?? '', 64);
    $userOtp        = trim($input['otp'] ?? '');
    $emailInput     = strtolower(trim(validate_email_input($input['email'] ?? '', 191)));

    if (empty($userOtp)) {
        sendError("6-digit verification code is required.");
    }

    $record = null;
    if (!empty($verificationId)) {
        $stmtV = $pdo->prepare("SELECT * FROM email_verifications WHERE verification_id = ? LIMIT 1");
        $stmtV->execute([$verificationId]);
        $record = $stmtV->fetch();
    }

    if (!$record && !empty($emailInput)) {
        $stmtVE = $pdo->prepare("SELECT * FROM email_verifications WHERE LOWER(email) = LOWER(?) ORDER BY id DESC LIMIT 1");
        $stmtVE->execute([$emailInput]);
        $record = $stmtVE->fetch();
    }

    if (!$record) {
        sendError("Invalid or expired verification session. Please request a new code.");
    }

    if ($record['is_verified'] == 1) {
        // Already verified, proceed smoothly
    } else {
        if (time() > (int)$record['expires_at']) {
            sendError("Verification code has expired. Please request a new code.");
        }

        if ((int)$record['attempts'] >= 8) {
            sendError("Too many incorrect attempts. Please request a new verification code.");
        }

        $expectedHash = $record['otp_hash'];
        $enteredHash  = hash('sha256', $userOtp);
        $plainOtp     = trim($record['otp'] ?? '');

        if (!hash_equals($expectedHash, $enteredHash) && $plainOtp !== $userOtp) {
            $pdo->prepare("UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?")->execute([$record['id']]);
            sendError("Incorrect 6-digit verification code. Please check your inbox and try again.");
        }

        $pdo->prepare("UPDATE email_verifications SET is_verified = 1 WHERE id = ?")->execute([$record['id']]);
    }

    $pending = json_decode($record['payload'], true) ?: [];
    $email       = $record['email'];
    $name        = $pending['name'] ?? 'Student';
    $phone       = $pending['phone'] ?? '';
    $courseId    = (int)($pending['course_id'] ?? 0);
    $courseTitle = $pending['course_title'] ?? 'Selected Track';
    $amount      = (float)($pending['amount'] ?? 0);
    $coupon      = $pending['coupon_code'] ?? '';
    $enrollmentSessionId = $pending['enrollment_session_id'] ?? ('ESESS_' . bin2hex(random_bytes(16)));

    $resolution = resolveExistingStudent($email, $name, $phone);
    $studentId = $resolution['student_id'];

    $alreadyEnrolled = getStudentEnrollmentForCourse($studentId, $courseId);
    if ($alreadyEnrolled) {
        echo json_encode([
            "success"          => true,
            "already_enrolled" => true,
            "enrollment_id"    => 'EA-2026-' . str_pad($alreadyEnrolled['id'], 5, '0', STR_PAD_LEFT),
            "course_id"        => $courseId,
            "course_title"     => $courseTitle,
            "status"           => "active",
            "payment_status"   => "paid",
            "message"          => "You already have an active paid enrollment in this course.",
            "dashboard_url"    => "dashboard.php?course_id=" . $courseId
        ]);
        exit;
    }

    $keyId = env('RAZORPAY_KEY_ID', '');

    echo json_encode([
        "success"              => true,
        "is_existing"          => ($resolution['status'] === 'EXISTING_STUDENT'),
        "student_id"           => $studentId,
        "verification_id"      => $verificationId,
        "enrollment_session_id"=> $enrollmentSessionId,
        "key_id"               => $keyId,
        "amount"               => $amount,
        "course_title"         => $courseTitle,
        "course_id"            => $courseId,
        "user"                 => [
            "name"  => $name,
            "email" => $email,
            "phone" => $phone
        ]
    ]);
    exit;
}

// =========================================================================
// ACTION: create_checkout_order / initiate_checkout
// =========================================================================
if ($action === 'create_checkout_order' || $action === 'initiate_checkout') {
    $courseId       = validate_integer_range($input['course_id'] ?? 0, 1, 100000, 0);
    $couponCode     = clean_text($input['coupon'] ?? ($input['coupon_code'] ?? ''), 30);
    $verificationId = clean_text($input['verification_id'] ?? '', 64);
    $email          = strtolower(trim(validate_email_input($input['email'] ?? '', 191)));
    $name           = clean_text($input['name'] ?? '', 100);
    $phone          = clean_text($input['phone'] ?? '', 20);

    if ($courseId <= 0) {
        sendError("Valid course selection required.");
    }

    $isGoogle = !empty($_SESSION['google_verified_identity']['email']);
    $isLoggedInStudent = !empty($_SESSION['student_id']);

    if (!$isGoogle && !$isLoggedInStudent) {
        if (!empty($verificationId)) {
            $stmtV = $pdo->prepare("SELECT email, payload, is_verified, expires_at FROM email_verifications WHERE verification_id = ? LIMIT 1");
            $stmtV->execute([$verificationId]);
            $vRec = $stmtV->fetch();
            if ($vRec && (int)$vRec['is_verified'] === 1) {
                $email = $vRec['email'];
                $pData = json_decode($vRec['payload'], true) ?: [];
                if (empty($name)) $name = $pData['name'] ?? '';
                if (empty($phone)) $phone = $pData['phone'] ?? '';
            }
        }
        if (empty($email) && !empty($input['email'])) {
            $email = strtolower(trim(validate_email_input($input['email'], 191)));
        }
    } elseif ($isLoggedInStudent && empty($email)) {
        $stmtSt = $pdo->prepare("SELECT name, email, phone FROM students WHERE id = ? LIMIT 1");
        $stmtSt->execute([(int)$_SESSION['student_id']]);
        $stData = $stmtSt->fetch();
        if ($stData) {
            $email = $stData['email'];
            if (empty($name)) $name = $stData['name'];
            if (empty($phone)) $phone = $stData['phone'];
        }
    } elseif ($isGoogle && empty($email)) {
        $email = $_SESSION['google_verified_identity']['email'];
        if (empty($name)) $name = $_SESSION['google_verified_identity']['name'] ?? '';
    }

    if (empty($email)) {
        sendError("Verified student identity required to initiate checkout.");
    }

    $stmtC = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtC->execute([$courseId]);
    $course = $stmtC->fetch();

    if (!$course) {
        sendError("Selected course does not exist.");
    }

    $courseTitle = $course['title'];
    $basePrice   = (float)$course['price'];
    $discount    = 0;
    $appliedCoupon = "";

    if (empty($couponCode) && !empty($pData['coupon_code'])) {
        $couponCode = $pData['coupon_code'];
    }

    if (!empty($couponCode)) {
        $calc = calculateDiscount($pdo, $couponCode, $basePrice);
        if ($calc) {
            $discount      = (float)$calc['discount'];
            $appliedCoupon = $calc['code'];
        }
    }

    $amount = max(0, $basePrice - $discount);

    $resolution = resolveExistingStudent($email, $name, $phone);
    $studentId = $resolution['student_id'];
    $studentName = $resolution['student']['name'] ?? $name;

    // Check if already enrolled in this specific course
    $alreadyEnrolled = getStudentEnrollmentForCourse($studentId, $courseId);
    if ($alreadyEnrolled) {
        echo json_encode([
            "success"          => true,
            "already_enrolled" => true,
            "enrollment_id"    => 'EA-2026-' . str_pad($alreadyEnrolled['id'], 5, '0', STR_PAD_LEFT),
            "course_id"        => $courseId,
            "course_title"     => $courseTitle,
            "status"           => "active",
            "payment_status"   => "paid",
            "message"          => "You already have an active paid enrollment in this course."
        ]);
        exit;
    }

    $keyId     = env('RAZORPAY_KEY_ID', '');
    $keySecret = env('RAZORPAY_KEY_SECRET', '');
    $amountPaise = (int)round($amount * 100);
    $enrollmentSessionId = 'ESESS_' . bin2hex(random_bytes(16));

    if ($amount <= 0) {
        echo json_encode([
            "success"        => true,
            "direct_enroll"  => true,
            "order_id"       => 'FREE_ORDER_' . bin2hex(random_bytes(8)),
            "key_id"         => $keyId,
            "amount"         => 0,
            "amount_paise"   => 0
        ]);
        exit;
    }

    $orderPayload = [
        "amount"   => $amountPaise,
        "currency" => "INR",
        "receipt"  => "rcpt_" . substr(bin2hex(random_bytes(8)), 0, 16),
        "notes"    => [
            "student_id"            => (string)$studentId,
            "email"                 => $email,
            "name"                  => $studentName,
            "course_id"             => (string)$courseId,
            "course_title"          => $courseTitle,
            "enrollment_session_id" => $enrollmentSessionId
        ]
    ];

    $ch = curl_init("https://api.razorpay.com/v1/orders");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_USERPWD        => "{$keyId}:{$keySecret}",
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS     => json_encode($orderPayload),
        CURLOPT_TIMEOUT        => 12
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $orderData = json_decode($response, true);
    if ($httpCode !== 200 || empty($orderData['id'])) {
        error_log("Razorpay Order Error: " . ($response ?: 'No response') . " HTTP: $httpCode");
        sendError("Failed to initiate gateway order session.");
    }

    $razorpayOrderId = $orderData['id'];

    try {
        $stmtPI = $pdo->prepare("
            INSERT INTO payment_intents (verification_id, email, course_id, amount, amount_paise, coupon_code, razorpay_order_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'created', NOW())
        ");
        $stmtPI->execute([$verificationId, $email, $courseId, $amount, $amountPaise, $appliedCoupon, $razorpayOrderId]);
    } catch (Exception $e) {
        error_log("Payment intent insert error: " . $e->getMessage());
    }

    echo json_encode([
        "success"              => true,
        "order_id"             => $razorpayOrderId,
        "razorpay_order_id"    => $razorpayOrderId,
        "key_id"               => $keyId,
        "amount"               => $amount,
        "amount_paise"         => $amountPaise,
        "payable_amount"       => $amount,
        "currency"             => "INR",
        "course_id"            => $courseId,
        "course_title"         => $courseTitle,
        "coupon_code"          => $appliedCoupon,
        "discount"             => $discount,
        "enrollment_session_id"=> $enrollmentSessionId
    ]);
    exit;
}

// =========================================================================
// ACTION: google_checkout_init
// =========================================================================
if ($action === 'google_checkout_init') {
    $courseId   = validate_integer_range($input['course_id'] ?? 0, 1, 100000, 0);
    $couponCode = clean_text($input['coupon'] ?? ($input['coupon_code'] ?? ''), 30);

    if ($courseId <= 0) {
        sendError("Please select a valid course.");
    }

    $email = $_SESSION['google_verified_identity']['email'] ?? '';
    $name  = $_SESSION['google_verified_identity']['name'] ?? '';
    $verificationId = $_SESSION['google_verified_identity']['verification_id'] ?? clean_text($input['verification_id'] ?? '', 64);
    $enrollmentSessionId = 'ESESS_' . bin2hex(random_bytes(16));

    if (empty($email) && !empty($verificationId)) {
        $stmtV = $pdo->prepare("SELECT * FROM email_verifications WHERE verification_id = ? AND is_verified = 1 LIMIT 1");
        $stmtV->execute([$verificationId]);
        $vRec = $stmtV->fetch();
        if ($vRec) {
            $email = $vRec['email'];
            $payload = json_decode($vRec['payload'], true) ?: [];
            $name = $payload['name'] ?? 'Google Scholar';
        }
    }

    if (empty($email)) {
        sendError("Google verification session not found or expired. Please retry sign-in.");
    }

    $stmtC = $pdo->prepare("SELECT id, title, price FROM courses WHERE id = ? LIMIT 1");
    $stmtC->execute([$courseId]);
    $course = $stmtC->fetch();

    if (!$course) {
        sendError("Selected course not found.");
    }

    $courseTitle = $course['title'];
    $basePrice   = (float)$course['price'];
    $amount      = $basePrice;
    $discount    = 0;
    $appliedCoupon = "";

    if (!empty($couponCode)) {
        $calc = calculateDiscount($pdo, $couponCode, $basePrice);
        if ($calc) {
            $amount        = $calc['final_price'];
            $discount      = $calc['discount'];
            $appliedCoupon = $calc['code'];
        }
    }

    $resolution = resolveExistingStudent($email, $name);
    $studentId = $resolution['student_id'];

    $alreadyEnrolled = getStudentEnrollmentForCourse($studentId, $courseId);
    if ($alreadyEnrolled) {
        echo json_encode([
            "success"          => true,
            "already_enrolled" => true,
            "enrollment_id"    => 'EA-2026-' . str_pad($alreadyEnrolled['id'], 5, '0', STR_PAD_LEFT),
            "course_id"        => $courseId,
            "course_title"     => $courseTitle,
            "status"           => "active",
            "payment_status"   => "paid",
            "message"          => "You already have an active paid enrollment in this course.",
            "dashboard_url"    => "dashboard.php?course_id=" . $courseId
        ]);
        exit;
    }

    if ($amount <= 0) {
        echo json_encode([
            "success"        => true,
            "direct_enroll"  => true,
            "is_existing"    => ($resolution['status'] === 'EXISTING_STUDENT'),
            "verification_id"=> $verificationId,
            "amount"         => 0
        ]);
        exit;
    }

    $keyId     = env('RAZORPAY_KEY_ID', '');
    $keySecret = env('RAZORPAY_KEY_SECRET', '');
    $amountPaise = (int)round($amount * 100);

    $orderPayload = [
        "amount"   => $amountPaise,
        "currency" => "INR",
        "receipt"  => "rcpt_" . substr(bin2hex(random_bytes(8)), 0, 16),
        "notes"    => [
            "student_id"            => (string)$studentId,
            "email"                 => $email,
            "name"                  => $name,
            "course_id"             => (string)$courseId,
            "course_title"          => $courseTitle,
            "enrollment_session_id" => $enrollmentSessionId,
            "flow"                  => "google_oauth"
        ]
    ];

    $ch = curl_init("https://api.razorpay.com/v1/orders");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_USERPWD        => "{$keyId}:{$keySecret}",
        CURLOPT_HTTPHEADER     => ["Content-Type: application/json"],
        CURLOPT_POSTFIELDS     => json_encode($orderPayload),
        CURLOPT_TIMEOUT        => 12
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $orderData = json_decode($response, true);
    if ($httpCode !== 200 || empty($orderData['id'])) {
        error_log("Razorpay order creation failed (Google flow): " . ($response ?: 'Empty response') . " (HTTP $httpCode)");
        sendError("Failed to initiate payment session with gateway.");
    }

    $razorpayOrderId = $orderData['id'];

    try {
        $stmtPI = $pdo->prepare("
            INSERT INTO payment_intents (verification_id, email, course_id, amount, amount_paise, coupon_code, razorpay_order_id, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'created', NOW())
        ");
        $stmtPI->execute([$verificationId, $email, $courseId, $amount, $amountPaise, $appliedCoupon, $razorpayOrderId]);
    } catch (Exception $e) {
        error_log("Google checkout payment intent insert error: " . $e->getMessage());
    }

    echo json_encode([
        "success"              => true,
        "is_existing"          => ($resolution['status'] === 'EXISTING_STUDENT'),
        "student_id"           => $studentId,
        "verification_id"      => $verificationId,
        "enrollment_session_id"=> $enrollmentSessionId,
        "order_id"             => $razorpayOrderId,
        "razorpay_order_id"    => $razorpayOrderId,
        "key_id"               => $keyId,
        "amount"               => $amount,
        "amount_paise"         => $amountPaise,
        "course_title"         => $courseTitle,
        "course_id"            => $courseId,
        "user"                 => [
            "name"  => $name,
            "email" => $email,
            "phone" => ""
        ]
    ]);
    exit;
}

// =========================================================================
// ACTION: finalize_payment / verify_payment / direct_enroll
// =========================================================================
if ($action === 'finalize_payment' || $action === 'verify_payment' || $action === 'direct_enroll') {
    $orderId        = clean_text($input['razorpay_order_id'] ?? ($input['order_id'] ?? ''), 100);
    $paymentId      = clean_text($input['razorpay_payment_id'] ?? ($input['payment_id'] ?? ''), 100);
    $signature      = clean_text($input['razorpay_signature'] ?? ($input['signature'] ?? ''), 255);
    $verificationId = clean_text($input['verification_id'] ?? '', 64);
    $isDirect       = ($action === 'direct_enroll');

    $paymentIntent = null;
    if (!$isDirect) {
        if (empty($orderId) || empty($paymentId) || empty($signature)) {
            sendError("Incomplete payment details received.");
        }

        $keySecret = env('RAZORPAY_KEY_SECRET', '');
        $expectedSignature = hash_hmac("sha256", $orderId . "|" . $paymentId, $keySecret);
        if (!hash_equals($expectedSignature, $signature)) {
            error_log("Razorpay Signature Mismatch: Order={$orderId}, Payment={$paymentId}");
            sendError("Payment verification failed. Invalid gateway signature.");
        }

        $stmtPI = $pdo->prepare("SELECT * FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1");
        $stmtPI->execute([$orderId]);
        $paymentIntent = $stmtPI->fetch();

        if (!$paymentIntent) {
            sendError("Payment intent session not found.");
        }

        $email    = strtolower(trim($paymentIntent['email']));
        $courseId = (int)$paymentIntent['course_id'];
        $amount   = (float)$paymentIntent['amount'];
        $coupon   = $paymentIntent['coupon_code'] ?? '';
    } else {
        $stmtV = $pdo->prepare("SELECT * FROM email_verifications WHERE verification_id = ? AND is_verified = 1 LIMIT 1");
        $stmtV->execute([$verificationId]);
        $vRec = $stmtV->fetch();

        if (!$vRec) {
            sendError("Invalid verification session for direct enrollment.");
        }

        $pData = json_decode($vRec['payload'], true) ?: [];
        $email    = strtolower(trim($vRec['email']));
        $courseId = (int)($pData['course_id'] ?? 0);
        $amount   = 0.0;
        $coupon   = $pData['coupon_code'] ?? '';
        $orderId  = 'FREE_ENROLL_' . bin2hex(random_bytes(8));
        $paymentId= 'FREE_PAY_' . bin2hex(random_bytes(8));
        $signature= 'FREE_DIRECT_SIGNATURE';
    }

    if ($courseId <= 0 || empty($email)) {
        sendError("Invalid enrollment parameters.");
    }

    try {
        $pdo->beginTransaction();

        $stmtC = $pdo->prepare("SELECT title FROM courses WHERE id = ? LIMIT 1");
        $stmtC->execute([$courseId]);
        $courseTitle = $stmtC->fetchColumn() ?: 'Selected Track';

        $name = '';
        $phone = '';

        if (!empty($verificationId)) {
            $stmtV = $pdo->prepare("SELECT payload FROM email_verifications WHERE verification_id = ? LIMIT 1");
            $stmtV->execute([$verificationId]);
            $rawP = $stmtV->fetchColumn();
            if ($rawP) {
                $pData = json_decode($rawP, true) ?: [];
                $name = $pData['name'] ?? '';
                $phone = $pData['phone'] ?? '';
            }
        }

        // Canonical Student Resolution: ONE STUDENT = ONE ROW IN STUDENTS
        $resolution = resolveExistingStudent($email, $name, $phone, '', true);
        $studentId = $resolution['student_id'];
        $studentName = $resolution['student']['name'] ?? 'Student';
        $studentPhone = $resolution['student']['phone'] ?? '';

        // Check if enrollment already created (Idempotency)
        $stmtCheckEnr = $pdo->prepare("
            SELECT id FROM enrollments 
            WHERE student_id = ? AND course_id = ? AND payment_status = 'paid' AND status = 'active'
            LIMIT 1 FOR UPDATE
        ");
        $stmtCheckEnr->execute([$studentId, $courseId]);
        $existingEnrollment = $stmtCheckEnr->fetch();

        if ($existingEnrollment) {
            $enrollmentDbId = (int)$existingEnrollment['id'];
        } else {
            // Insert New Course Enrollment for This Student
            $stmtEnroll = $pdo->prepare("
                INSERT INTO enrollments (student_id, course_id, name, email, phone, course, amount, payment_status, status, lead_status, razorpay_order_id, razorpay_payment_id, enrolled_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'active', 'converted', ?, ?, NOW())
            ");
            $stmtEnroll->execute([$studentId, $courseId, $studentName, $email, $studentPhone, $courseTitle, $amount, $orderId, $paymentId]);
            $enrollmentDbId = (int)$pdo->lastInsertId();
        }

        // Record Payment Ledger
        $stmtCheckPay = $pdo->prepare("SELECT id FROM payments WHERE razorpay_payment_id = ? LIMIT 1");
        $stmtCheckPay->execute([$paymentId]);
        if (!$stmtCheckPay->fetch()) {
            $stmtPay = $pdo->prepare("
                INSERT INTO payments (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, created_at)
                VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success', NOW())
            ");
            $stmtPay->execute([$studentId, $courseId, $amount, $orderId, $paymentId, $signature]);
        }

        if (!empty($coupon)) {
            $pdo->prepare("UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = UPPER(?) AND is_active = 1")->execute([$coupon]);
        }

        if ($paymentIntent) {
            $pdo->prepare("UPDATE payment_intents SET status = 'paid', coupon_redeemed_at = NOW() WHERE id = ?")->execute([(int)$paymentIntent['id']]);
        }

        $pdo->prepare("DELETE FROM email_verifications WHERE verification_id = ? OR email = ?")->execute([$verificationId, $email]);

        $pdo->commit();

        session_regenerate_id(true);
        $_SESSION['student_id']    = $studentId;
        $_SESSION['student_name']  = $studentName;
        $_SESSION['student_email'] = $email;
        $_SESSION['last_enrolled_course_id'] = $courseId;

        $realEnrollmentId = 'EA-2026-' . str_pad($enrollmentDbId, 5, '0', STR_PAD_LEFT);

        echo json_encode([
            "success"          => true,
            "is_existing"      => ($resolution['status'] === 'EXISTING_STUDENT'),
            "student_id"       => $studentId,
            "enrollment_id"    => $realEnrollmentId,
            "course_title"     => $courseTitle,
            "course_id"        => $courseId,
            "amount"           => $amount,
            "student_name"     => $studentName,
            "student_email"    => $email,
            "dashboard_url"    => "dashboard.php?course_id=" . $courseId,
            "message"          => "Enrollment activated successfully!"
        ]);
        exit;

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Enrollment finalization error: " . $e->getMessage());
        sendError("Failed to finalize enrollment. Please contact support.");
    }
}

// ACTION: razorpay_webhook / webhook
if ($action === 'razorpay_webhook' || $action === 'webhook') {
    require_once __DIR__ . '/webhook-razorpay.php';
    exit;
}

sendError("Invalid action specified.");
