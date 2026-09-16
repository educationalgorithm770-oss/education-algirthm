<?php
// api-scholarship-counseling.php — Counseling Workflow & Student Notification Engine
// Route: /api-scholarship-counseling.php
require_once __DIR__ . '/config.php';

header("Content-Type: application/json");

// Require Admin Login for counseling status updates
if (empty($_SESSION['admin_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Unauthorized access."]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed."]);
    exit;
}

verify_csrf();

$reservationId = (int)($_POST["reservation_id"] ?? 0);
$action = clean_text($_POST["action"] ?? "", 30);
$notes = clean_text($_POST["counseling_notes"] ?? "", 500);

if ($reservationId <= 0) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Invalid reservation ID."]);
    exit;
}

$stmt = $pdo->prepare("
    SELECT r.*, c.title as course_title, s.email as student_email, s.name as student_name 
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

$newEnrollmentStatus = $reservation['enrollment_status'];

if ($action === 'start_counseling') {
    $newEnrollmentStatus = 'COUNSELLING_PENDING';
} elseif ($action === 'complete_counseling') {
    $newEnrollmentStatus = 'ENROLLMENT_PENDING';
}

// Update enrollment_status
$stmtUpdate = $pdo->prepare("
    UPDATE scholarship_reservations 
    SET enrollment_status = ? 
    WHERE id = ?
");
$stmtUpdate->execute([$newEnrollmentStatus, $reservationId]);

// Send Student Counseling Email (Phase 20)
$studentEmail = $reservation['student_email'] ?? $reservation['payment_reference'];
$studentName = $reservation['student_name'] ?? 'Student';

if (!empty($studentEmail) && filter_var($studentEmail, FILTER_VALIDATE_EMAIL)) {
    $subject = "🎓 Scholarship Held — Admissions Counseling Next Step";
    $body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background: #040712; color: #f8fafc;'>
            <h2 style='color: #34d399; margin-top: 0;'>🎓 Scholarship Successfully Held</h2>
            <p>Hello <strong>" . htmlspecialchars($studentName) . "</strong>,</p>
            <p>Your scholarship for the <strong>" . htmlspecialchars($reservation['course_title']) . "</strong> has been successfully reserved.</p>
            
            <div style='background: #0e172e; padding: 15px; border-radius: 8px; margin: 15px 0; font-size: 14px;'>
                <div><strong>Original Fee:</strong> ₹" . number_format($reservation['original_fee'], 2) . "</div>
                <div><strong>Scholarship Discount:</strong> − ₹" . number_format($reservation['scholarship_amount'], 2) . "</div>
                <div><strong>Scholarship Price:</strong> ₹" . number_format($reservation['scholarship_price'], 2) . "</div>
                <div><strong>Pre-Book Paid:</strong> ₹" . number_format($reservation['prebook_paid_amount'], 2) . " ✓</div>
                <div><strong>Remaining Amount:</strong> ₹" . number_format($reservation['remaining_amount'], 2) . "</div>
            </div>

            <div style='background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; color: #fef08a; font-size: 13px;'>
                <strong>Important Notice:</strong> Your pre-book payment does NOT confirm course enrollment. Enrollment will be completed separately after counseling and final confirmation.
            </div>

            <p style='margin-top: 20px;'><strong>Next Step:</strong> Admissions Counseling.</p>
            <p>Our admissions team will contact you shortly regarding course details, batch timing, and final enrollment confirmation.</p>
            
            <p style='color: #94a3b8; font-size: 12px; margin-top: 25px;'>© Education Algorithm. All rights reserved.</p>
        </div>
    ";

    try {
        if (function_exists('send_email')) {
            send_email($studentEmail, $subject, $body);
        }
    } catch (Exception $e) {
        error_log("Failed to send counseling email: " . $e->getMessage());
    }
}

echo json_encode([
    "success" => true,
    "reservation_id" => $reservationId,
    "enrollment_status" => $newEnrollmentStatus,
    "message" => "Counseling status updated successfully."
]);
