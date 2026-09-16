<?php
// scholarship-success.php — Pre-Book Scholarship Held Success Page
// Route: /scholarship/success
require_once __DIR__ . '/config.php';

$orderId = clean_text($_GET["order_id"] ?? "", 100);
$reservation = null;

if (!empty($orderId)) {
    $stmt = $pdo->prepare("
        SELECT r.*, c.title as course_title, s.name as student_name, s.email as student_email 
        FROM scholarship_reservations r
        JOIN courses c ON r.course_id = c.id
        LEFT JOIN students s ON r.student_id = s.id
        WHERE r.payment_order_id = ? LIMIT 1
    ");
    $stmt->execute([$orderId]);
    $reservation = $stmt->fetch();
}

// Fallback values if direct lookup fails
$courseTitle = $reservation["course_title"] ?? "Java Full Stack Development";
$originalFee = $reservation["original_fee"] ?? 20000.00;
$scholarshipAmount = $reservation["scholarship_amount"] ?? 5000.00;
$scholarshipPrice = $reservation["scholarship_price"] ?? 15000.00;
$prebookPaid = $reservation["prebook_paid_amount"] ?? 500.00;
$remainingAmount = $reservation["remaining_amount"] ?? 14500.00;
$scholarshipStatus = $reservation["scholarship_status"] ?? "HELD";
$enrollmentStatus = $reservation["enrollment_status"] ?? "NOT_ENROLLED";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scholarship Held Successfully | Education Algorithm</title>
    <meta name="description" content="Your scholarship reservation has been successfully held. Pre-book payment of ₹500 recorded.">
    <link rel="canonical" href="<?php echo APP_URL; ?>/scholarship-success">
    <link rel="stylesheet" href="css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
    <style>
        .ea-success-card {
            background: linear-gradient(135deg, rgba(14, 23, 46, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-xl);
            padding: 2.5rem;
            max-width: 720px;
            margin: 2rem auto;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .ea-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.4rem 1rem;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 0.88rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .ea-status-pill.held {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid #34d399;
            color: #34d399;
        }
        .ea-status-pill.not-enrolled {
            background: rgba(245, 158, 11, 0.2);
            border: 1px solid #f59e0b;
            color: #fef08a;
        }
        .ea-notice-box {
            background: rgba(99, 102, 241, 0.12);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-md);
            padding: 1.25rem;
            margin: 1.5rem 0;
            color: #cbd5e1;
            font-size: 0.95rem;
            line-height: 1.6;
        }
        /* STUDENT STATUS JOURNEY TRACKER */
        .ea-journey-tracker {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 2rem 0;
            padding: 1.25rem;
            background: #040712;
            border: 1px solid var(--jfw-border);
            border-radius: var(--jfw-radius-lg);
            overflow-x: auto;
            gap: 0.75rem;
        }
        .ea-journey-step {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            font-size: 0.78rem;
            font-weight: 700;
            color: var(--jfw-text-subtle);
            white-space: nowrap;
        }
        .ea-journey-step.done {
            color: #34d399;
        }
        .ea-journey-step.current {
            color: var(--jfw-accent-cyan);
        }
        .ea-journey-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.35rem;
            font-size: 0.85rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--jfw-border);
        }
        .ea-journey-step.done .ea-journey-icon {
            background: rgba(52, 211, 153, 0.2);
            border-color: #34d399;
            color: #34d399;
        }
        .ea-journey-step.current .ea-journey-icon {
            background: rgba(56, 189, 248, 0.2);
            border-color: var(--jfw-accent-cyan);
            color: var(--jfw-accent-cyan);
            box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
        }
    </style>
</head>
<body class="jfw-workshop">

    <!-- GLOBAL NAVBAR -->
    <header class="jfw-header">
        <div class="jfw-container">
            <div class="jfw-header-inner">
                <a href="<?php echo APP_URL; ?>/" class="jfw-brand-logo">
                    <svg class="ea-logo" width="34" height="34" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Education Algorithm"><g class="ea-g"><path class="ea-base" d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><g class="ea-capg"><path class="ea-cap" d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/></g><g class="ea-tas"><path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/></g></g></svg>
                    <span>Education Algorithm</span>
                    <span class="jfw-brand-badge">EDTECH</span>
                </a>

                <ul class="jfw-nav-links">
                    <li><a href="scholarship" class="jfw-nav-link">Scholarship</a></li>
                    <li><a href="student-scholarships" class="jfw-nav-link active">My Scholarship</a></li>
                </ul>
            </div>
        </div>
    </header>

    <!-- MAIN SUCCESS CONTENT -->
    <main class="jfw-section">
        <div class="jfw-container">

            <div class="ea-success-card">
                <div style="text-align: center;">
                    <div style="margin-bottom: 1rem;">
                        <span class="ea-status-pill held">🔒 SCHOLARSHIP HELD</span>
                        <span class="ea-status-pill not-enrolled" style="margin-left: 0.5rem;">NOT ENROLLED</span>
                    </div>

                    <h1 style="color: #ffffff; font-size: 2.1rem; margin: 0.5rem 0; font-family: var(--jfw-font-heading);">
                        🎉 YOUR SCHOLARSHIP HAS BEEN SUCCESSFULLY HELD
                    </h1>
                    <p style="color: #34d399; font-size: 1.05rem; font-weight: 700; margin: 0;">
                        Your scholarship reservation has been successfully recorded.
                    </p>
                </div>

                <!-- MANDATORY EXPLICIT PRE-BOOK NOTICE -->
                <div class="ea-notice-box">
                    🔒 <strong>SCHOLARSHIP RESERVATION CONFIRMED</strong><br>
                    Your pre-book payment of <strong>₹500</strong> does <strong>NOT</strong> confirm course enrollment.<br>
                    Enrollment will be completed separately after counseling and final confirmation.
                </div>

                <!-- STUDENT STATUS JOURNEY TRACKER -->
                <div class="ea-journey-tracker">
                    <div class="ea-journey-step done">
                        <div class="ea-journey-icon">✓</div>
                        <span>Workshop</span>
                    </div>
                    <div class="ea-journey-step done">
                        <div class="ea-journey-icon">✓</div>
                        <span>Offered</span>
                    </div>
                    <div class="ea-journey-step current">
                        <div class="ea-journey-icon">🔒</div>
                        <span>Held</span>
                    </div>
                    <div class="ea-journey-step">
                        <div class="ea-journey-icon">●</div>
                        <span>Counseling</span>
                    </div>
                    <div class="ea-journey-step">
                        <div class="ea-journey-icon">○</div>
                        <span>Enrollment</span>
                    </div>
                    <div class="ea-journey-step">
                        <div class="ea-journey-icon">○</div>
                        <span>Batch</span>
                    </div>
                    <div class="ea-journey-step">
                        <div class="ea-journey-icon">○</div>
                        <span>LMS Access</span>
                    </div>
                </div>

                <!-- RESERVATION FINANCIAL SUMMARY -->
                <div style="background: #040712; border: 1px solid var(--jfw-border); border-radius: var(--jfw-radius-lg); padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h3 style="color: #fff; margin-top: 0; font-size: 1.1rem; border-bottom: 1px solid var(--jfw-border); padding-bottom: 0.5rem;">
                        Reservation Breakdown
                    </h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.95rem;">
                        <div><span style="color: var(--jfw-text-muted);">Program:</span> <strong style="color: #fff; display: block;"><?php echo htmlspecialchars($courseTitle); ?></strong></div>
                        <div><span style="color: var(--jfw-text-muted);">Original Fee:</span> <strong style="color: #94a3b8; text-decoration: line-through; display: block;">₹<?php echo number_format($originalFee, 2); ?></strong></div>
                        <div><span style="color: var(--jfw-text-muted);">Scholarship Discount:</span> <strong style="color: #34d399; display: block;">− ₹<?php echo number_format($scholarshipAmount, 2); ?></strong></div>
                        <div><span style="color: var(--jfw-text-muted);">Final Scholarship Price:</span> <strong style="color: #34d399; display: block;">₹<?php echo number_format($scholarshipPrice, 2); ?></strong></div>
                        <div><span style="color: var(--jfw-text-muted);">Pre-Book Paid:</span> <strong style="color: #34d399; display: block;">₹<?php echo number_format($prebookPaid, 2); ?> ✓</strong></div>
                        <div><span style="color: var(--jfw-text-muted);">Remaining Course Amount:</span> <strong style="color: var(--jfw-accent-amber); display: block; font-size: 1.1rem;">₹<?php echo number_format($remainingAmount, 2); ?></strong></div>
                    </div>
                </div>

                <!-- COUNSELING & NEXT STEPS SECTION -->
                <div style="background: rgba(14, 23, 46, 0.8); border: 1px dashed var(--jfw-border-glow); border-radius: var(--jfw-radius-lg); padding: 1.5rem; text-align: center;">
                    <span class="jfw-badge" style="background: rgba(99, 102, 241, 0.2); color: var(--jfw-accent-cyan); margin-bottom: 0.5rem;">
                        NEXT STEP: ADMISSIONS COUNSELING
                    </span>
                    <h3 style="color: #ffffff; font-size: 1.25rem; margin: 0.5rem 0;">What Happens Next?</h3>
                    <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.6; max-width: 540px; margin: 0 auto 1.5rem auto;">
                        Our admissions counseling team will contact you regarding course details, batch timing, enrollment confirmation, and final steps to complete your registration.
                    </p>

                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <a href="student-scholarships" class="jfw-btn jfw-btn-primary" style="padding: 0.75rem 1.5rem;">
                            VIEW SCHOLARSHIP DASHBOARD 🎓
                        </a>
                        <a href="https://wa.me/?text=Hello%20Admissions%20Team%2C%20I%20have%20held%20my%20scholarship%20for%20Java%20Full%20Stack." target="_blank" class="jfw-btn jfw-btn-secondary" style="padding: 0.75rem 1.5rem;">
                            CONTACT ADMISSIONS 💬
                        </a>
                    </div>
                </div>

            </div>

        </div>
    </main>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--jfw-border); text-align: center; color: var(--jfw-text-subtle); font-size: 0.9rem;">
        <div class="jfw-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved.</p>
        </div>
    </footer>

</body>
</html>
