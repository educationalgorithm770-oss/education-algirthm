<?php
/**
 * webhook-razorpay.php — Canonical Background Payment & Webhook Reconciliation
 * Triggered automatically by Razorpay servers when a payment or refund event occurs.
 */

require_once __DIR__ . '/config.php';

// Set JSON header
header('Content-Type: application/json');

// Handle GET request (Health Check ping from Razorpay dashboard or browser)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    http_response_code(200);
    echo json_encode(['success' => true, 'status' => 'active', 'message' => 'Razorpay Webhook endpoint is live & healthy']);
    exit;
}

// Fetch raw webhook payload
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? '';

if (empty($payload)) {
    http_response_code(200);
    echo json_encode(['success' => true, 'status' => 'active', 'message' => 'Webhook listener active']);
    exit;
}

$webhookSecret = env('RAZORPAY_WEBHOOK_SECRET');
$secret = !empty($webhookSecret) ? $webhookSecret : (defined('RAZORPAY_KEY_SECRET') ? RAZORPAY_KEY_SECRET : (env('RAZORPAY_KEY_SECRET') ?: ''));

// Fail Closed: Strict Signature Verification
if (empty($signature) || empty($secret)) {
    error_log("Razorpay Webhook rejected: missing signature or secret");
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing signature']);
    exit;
}

$expectedSignature = hash_hmac('sha256', $payload, $secret);
if (!hash_equals($expectedSignature, $signature)) {
    error_log("Razorpay Webhook Signature Mismatch!");
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Signature verification failed']);
    exit;
}

$data = json_decode($payload, true);
if (!$data || empty($data['event'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON structure']);
    exit;
}

$event = $data['event'];

// ─────────────────────────────────────────────────────────────────────────────
// CASE 1: Payment Captured or Order Paid (Confirmed Settlement)
// ─────────────────────────────────────────────────────────────────────────────
if (in_array($event, ['payment.captured', 'order.paid'], true)) {
    $payment     = $data['payload']['payment']['entity'] ?? [];
    $orderId     = $payment['order_id'] ?? '';
    $paymentId   = $payment['id'] ?? '';
    $amountPaise = (int)($payment['amount'] ?? 0);
    $amountInr   = (int)($amountPaise / 100);
    $email       = strtolower(trim($payment['email'] ?? ''));
    $phone       = trim($payment['contact'] ?? '');
    $notes       = $payment['notes'] ?? [];

    $courseId = (int)($notes['course_id'] ?? 0);
    $name     = trim($notes['name'] ?? ($notes['student_name'] ?? 'Student'));

    if (!empty($orderId)) {
        $stmtPI = $pdo->prepare("SELECT email, course_id, amount, amount_paise FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1");
        $stmtPI->execute([$orderId]);
        $pi = $stmtPI->fetch();
        if ($pi) {
            if (empty($email)) $email = strtolower(trim($pi['email']));
            if (!$courseId) $courseId = (int)$pi['course_id'];
            if (!$amountInr) $amountInr = (int)$pi['amount'];

            $expectedPaise = (int)($pi['amount_paise'] ?? round((float)$pi['amount'] * 100));
            if ($amountPaise > 0 && $expectedPaise > 0 && $amountPaise !== $expectedPaise) {
                error_log("Razorpay Webhook Amount Mismatch: Received {$amountPaise}, Expected {$expectedPaise}");
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Payment amount mismatch']);
                exit;
            }
        }
    }

    if (!empty($email) && $courseId > 0) {
        try {
            $pdo->beginTransaction();

                        // 1. Canonical Student Resolution: ONE STUDENT = ONE ROW IN STUDENTS
            $resolution = resolveExistingStudent($email, $name, $phone);
            $studentId = $resolution['student_id'];

            // 2. Fetch course title
            $stmtC = $pdo->prepare("SELECT title FROM courses WHERE id = ? LIMIT 1");
            $stmtC->execute([$courseId]);
            $courseTitle = $stmtC->fetchColumn() ?: 'Software Engineering Track';

            // 3. Upsert Enrollment Record (Idempotent)
            $stmtCheckEnr = $pdo->prepare("
                SELECT id FROM enrollments 
                WHERE email = ? AND (razorpay_order_id = ? OR (course_id = ? AND payment_status = 'paid')) 
                LIMIT 1 FOR UPDATE
            ");
            $stmtCheckEnr->execute([$email, $orderId, $courseId]);
            $existingEnr = $stmtCheckEnr->fetch();

            if (!$existingEnr) {
                $stmtEnr = $pdo->prepare("
                    INSERT INTO enrollments (student_id, course_id, name, email, phone, course, amount, payment_status, status, lead_status, razorpay_order_id, razorpay_payment_id, enrolled_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'active', 'converted', ?, ?, NOW())
                ");
                $stmtEnr->execute([$studentId, $courseId, $name, $email, $phone, $courseTitle, $amountInr, $orderId, $paymentId]);
                $enrollmentId = (int)$pdo->lastInsertId();
            } else {
                $enrollmentId = (int)$existingEnr['id'];
                $stmtUpEnr = $pdo->prepare("
                    UPDATE enrollments 
                    SET payment_status = 'paid', status = 'active', razorpay_payment_id = ? 
                    WHERE id = ?
                ");
                $stmtUpEnr->execute([$paymentId, $enrollmentId]);
            }

            // 4. Record Payment Ledger (Idempotent)
            $stmtCheckPay = $pdo->prepare("SELECT id FROM payments WHERE razorpay_payment_id = ? LIMIT 1");
            $stmtCheckPay->execute([$paymentId]);
            if (!$stmtCheckPay->fetch()) {
                $stmtPay = $pdo->prepare("
                    INSERT INTO payments (student_id, enrollment_id, course_id, amount, razorpay_order_id, razorpay_payment_id, status, payment_method, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'paid', 'razorpay_webhook', NOW())
                ");
                $stmtPay->execute([$studentId, $enrollmentId, $courseId, $amountInr, $orderId, $paymentId]);
            }

            // 5. Update Payment Intent
            if (!empty($orderId)) {
                $stmtUpPI = $pdo->prepare("UPDATE payment_intents SET status = 'completed' WHERE razorpay_order_id = ?");
                $stmtUpPI->execute([$orderId]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Payment captured and enrollment activated']);
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("Webhook capture processing error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database transaction failed']);
            exit;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CASE 2: Refund Processed or Created (Immediate Revocation)
// ─────────────────────────────────────────────────────────────────────────────
if (in_array($event, ['refund.processed', 'refund.created', 'payment.dispute.created'], true)) {
    $refund = $data['payload']['refund']['entity'] ?? [];
    $paymentId = $refund['payment_id'] ?? ($data['payload']['payment']['entity']['id'] ?? '');

    if (!empty($paymentId)) {
        try {
            $pdo->beginTransaction();

            $stmtEnr = $pdo->prepare("
                UPDATE enrollments 
                SET payment_status = 'refunded', status = 'suspended' 
                WHERE razorpay_payment_id = ?
            ");
            $stmtEnr->execute([$paymentId]);

            $stmtPay = $pdo->prepare("
                UPDATE payments 
                SET status = 'refunded' 
                WHERE razorpay_payment_id = ?
            ");
            $stmtPay->execute([$paymentId]);

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Refund processed and enrollment revoked']);
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log("Webhook refund error: " . $e->getMessage());
        }
    }
}

// Acknowledge other webhook events securely
echo json_encode(['success' => true, 'message' => 'Event acknowledged']);