<?php
// admin-convert-enrollment.php — Admin Authorized Enrollment Conversion Interface
// Route: /admin-convert-enrollment.php
$adminActive = 'scholarships';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

$reservationId = (int)($_GET['reservation_id'] ?? 0);
$stmt = $pdo->prepare("
    SELECT r.*, c.title as course_title, 
           COALESCE(s.name, 'Student') as student_name, 
           COALESCE(s.email, r.payment_reference) as student_email,
           COALESCE(s.phone, '-') as student_phone
    FROM scholarship_reservations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN students s ON r.student_id = s.id
    WHERE r.id = ? LIMIT 1
");
$stmt->execute([$reservationId]);
$reservation = $stmt->fetch();

if (!$reservation) {
    die("Reservation not found.");
}

$csrfToken = csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convert Scholarship to Enrollment — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
        .convert-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 2.25rem;
            max-width: 620px;
            margin: 2rem auto;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
    </style>
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            
            <div class="convert-card">
                <div style="display: inline-block; padding: 0.25rem 0.75rem; background: #e0e7ff; color: #4338ca; border-radius: 20px; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; margin-bottom: 0.75rem;">
                    AUTHORIZED ENROLLMENT CONVERSION
                </div>
                <h1 style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 0.35rem 0;">Confirm Course Enrollment</h1>
                <p style="font-size: 0.88rem; color: #64748b; margin: 0 0 1.5rem 0;">
                    Converting this scholarship hold will officially register the student in the course database and grant LMS course access.
                </p>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.25rem; margin-bottom: 1.5rem; font-size: 0.9rem; line-height: 1.8;">
                    <div><span style="color: #64748b;">Student Name:</span> <strong style="color: #0f172a;"><?php echo htmlspecialchars($reservation['student_name']); ?></strong></div>
                    <div><span style="color: #64748b;">Student Email:</span> <strong style="color: #0f172a;"><?php echo htmlspecialchars($reservation['student_email']); ?></strong></div>
                    <div><span style="color: #64748b;">Target Course:</span> <strong style="color: #0f172a;"><?php echo htmlspecialchars($reservation['course_title']); ?></strong></div>
                    <div><span style="color: #64748b;">Pre-Book Paid:</span> <strong style="color: #10b981;">₹<?php echo number_format($reservation['prebook_paid_amount']); ?> ✓</strong></div>
                    <div><span style="color: #64748b;">Remaining Amount Due:</span> <strong style="color: #f59e0b;">₹<?php echo number_format($reservation['remaining_amount']); ?></strong></div>
                    <div><span style="color: #64748b;">Current Enrollment Status:</span> <span style="background: #fee2e2; color: #991b1b; padding: 0.15rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.8rem;"><?php echo htmlspecialchars($reservation['enrollment_status']); ?></span></div>
                </div>

                <form action="api-scholarship-convert" method="POST">
                    <input type="hidden" name="csrf_token" value="<?php echo $csrfToken; ?>">
                    <input type="hidden" name="reservation_id" value="<?php echo $reservationId; ?>">

                    <div style="margin-bottom: 1.5rem;">
                        <label style="display: block; font-size: 0.88rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Assigned Batch Name (Optional)</label>
                        <input type="text" name="batch" placeholder="e.g. Sept 2026 Morning Batch..." style="width: 100%; padding: 0.7rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a;">
                    </div>

                    <div style="display: flex; gap: 0.85rem;">
                        <button type="submit" style="flex: 1; padding: 0.75rem 1.25rem; font-weight: 700; font-size: 0.9rem; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">
                            CONFIRM ENROLLMENT & GRANT LMS ACCESS ✓
                        </button>
                        <a href="admin-scholarships" style="padding: 0.75rem 1.25rem; font-weight: 600; font-size: 0.88rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center;">
                            Cancel
                        </a>
                    </div>
                </form>
            </div>

        </main>
    </div>
</body>
</html>
