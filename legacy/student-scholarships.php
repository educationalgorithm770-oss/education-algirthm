<?php
// student-scholarships.php — Student Scholarship Status Dashboard
// Route: /student-scholarships
require_once __DIR__ . '/config.php';

// Check if student is logged in, or lookup by email parameter
$studentId = $_SESSION['student_id'] ?? null;
$studentEmail = null;

if ($studentId) {
    $stmtS = $pdo->prepare("SELECT email, name FROM students WHERE id = ? LIMIT 1");
    $stmtS->execute([$studentId]);
    $student = $stmtS->fetch();
    $studentEmail = $student['email'] ?? null;
} elseif (!empty($_GET['email'])) {
    $rawEmail = trim($_GET['email']);
    $studentEmail = validate_email_input($rawEmail) ?: strtolower(trim(clean_text($rawEmail, 150)));
}

// Fetch all scholarship reservations for this student
$reservations = [];
if ($studentId || !empty($studentEmail)) {
    $stmtRes = $pdo->prepare("
        SELECT r.*, c.title as course_title, c.slug as course_slug,
               COALESCE(s.email, r.payment_reference) as student_email, COALESCE(s.name, 'Student') as student_name
        FROM scholarship_reservations r
        JOIN courses c ON r.course_id = c.id
        LEFT JOIN students s ON r.student_id = s.id
        WHERE (
            (? > 0 AND r.student_id = ?) OR
            (? != '' AND (s.email = ? OR r.payment_reference = ? OR r.student_id IN (SELECT id FROM students WHERE email = ?)))
        )
        ORDER BY r.id DESC
    ");
    $sId = (int)($studentId ?? 0);
    $sEmail = strtolower(trim((string)$studentEmail));
    $stmtRes->execute([$sId, $sId, $sEmail, $sEmail, $sEmail, $sEmail]);
    $reservations = $stmtRes->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Scholarship Reservations | Education Algorithm</title>
    <meta name="description" content="Track your active scholarship reservations, pre-book payments, and admissions counseling status.">
    <link rel="canonical" href="<?php echo APP_URL; ?>/student-scholarships">
    <link rel="stylesheet" href="css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
    <style>
        .ea-scholarship-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .ea-status-card {
            background: linear-gradient(135deg, rgba(14, 23, 46, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%);
            border: 1px solid var(--jfw-border-glow);
            border-radius: var(--jfw-radius-xl);
            padding: 2rem;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
        }
        .ea-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.3rem 0.85rem;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 0.8rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .ea-status-pill.held { background: rgba(16, 185, 129, 0.2); border: 1px solid #34d399; color: #34d399; }
        .ea-status-pill.pending { background: rgba(245, 158, 11, 0.2); border: 1px solid #f59e0b; color: #fef08a; }
        .ea-status-pill.converted { background: rgba(56, 189, 248, 0.2); border: 1px solid var(--jfw-accent-cyan); color: var(--jfw-accent-cyan); }
        .ea-status-pill.not-enrolled { background: rgba(239, 68, 68, 0.2); border: 1px solid #f87171; color: #f87171; }
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
                    <li><a href="scholarship" class="jfw-nav-link">Scholarship Offer</a></li>
                    <li><a href="student-scholarships" class="jfw-nav-link active">My Scholarship</a></li>
                </ul>
            </div>
        </div>
    </header>

    <!-- MAIN DASHBOARD CONTENT -->
    <main class="jfw-section">
        <div class="jfw-container">

            <div style="text-align: center; max-width: 650px; margin: 0 auto 2.5rem auto;">
                <span class="jfw-badge">STUDENT SCHOLARSHIP PORTAL</span>
                <h1 style="color: #ffffff; font-size: 2.2rem; margin: 0.5rem 0; font-family: var(--jfw-font-heading);">
                    MY SCHOLARSHIPS
                </h1>
                <p style="color: var(--jfw-text-muted); font-size: 1rem;">
                    View your active scholarship holds, pre-book payment receipts, and enrollment counseling status.
                </p>
            </div>

            <!-- ALWAYS VISIBLE LOOKUP FORM -->
            <div style="background: var(--jfw-surface); border: 1px solid var(--jfw-border); border-radius: var(--jfw-radius-xl); padding: 2rem; max-width: 580px; margin: 0 auto 2.5rem auto; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.4);">
                <h3 style="color: #fff; margin: 0 0 0.5rem 0; font-size: 1.15rem;">Look Up Your Scholarship</h3>
                <p style="color: var(--jfw-text-muted); font-size: 0.88rem; margin-bottom: 1.25rem;">
                    Enter the email address used during your ₹500 pre-book payment to view your active status.
                </p>
                <form method="GET" action="student-scholarships" style="display: flex; gap: 0.5rem;">
                    <input type="email" name="email" required value="<?php echo htmlspecialchars($studentEmail ?? ''); ?>" placeholder="Enter your email address..." class="jfw-form-input" style="flex: 1; padding: 0.75rem 1rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 8px; color: #fff; font-size: 0.92rem;">
                    <button type="submit" class="jfw-btn jfw-btn-primary" style="padding: 0.75rem 1.35rem; background: #10b981; border: none; font-weight: 700;">
                        LOOKUP 🔍
                    </button>
                </form>
            </div>

            <?php if (!empty($studentEmail) && empty($reservations)): ?>
                <!-- NO RESULTS STATE -->
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #f87171; border-radius: 12px; padding: 2rem; max-width: 580px; margin: 0 auto; text-align: center; color: #ffffff;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔍</div>
                    <h3 style="margin: 0 0 0.5rem 0; color: #f87171;">No Active Reservation Found</h3>
                    <p style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 1.25rem;">
                        We couldn't find any scholarship reservations linked to <strong style="color: #fff;"><?php echo htmlspecialchars($studentEmail); ?></strong>.
                    </p>
                    <a href="scholarship.php" class="jfw-btn jfw-btn-primary" style="background: #10b981; border: none;">
                        🔒 HOLD MY SCHOLARSHIP — ₹500
                    </a>
                </div>
            <?php elseif (!empty($reservations)): ?>
                <!-- RESERVATION CARDS GRID -->
                <div class="ea-scholarship-grid">
                    <?php foreach ($reservations as $res): ?>
                        <div class="ea-status-card">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <h3 style="color: #ffffff; font-size: 1.25rem; margin: 0; font-family: var(--jfw-font-heading);">
                                    🎓 <?php echo htmlspecialchars($res['course_title']); ?>
                                </h3>
                                <span class="ea-status-pill <?php echo strtolower($res['scholarship_status']) === 'held' ? 'held' : 'pending'; ?>">
                                    🔒 <?php echo htmlspecialchars($res['scholarship_status']); ?>
                                </span>
                            </div>

                            <div style="background: #040712; border: 1px solid var(--jfw-border); border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
                                <div style="display: flex; justify-content: space-between; padding: 0.35rem 0;">
                                    <span style="color: var(--jfw-text-muted);">Original Fee:</span>
                                    <span style="text-decoration: line-through; color: #94a3b8;">₹<?php echo number_format($res['original_fee'], 2); ?></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.35rem 0;">
                                    <span style="color: var(--jfw-text-muted);">Scholarship Discount:</span>
                                    <span style="color: #34d399;">− ₹<?php echo number_format($res['scholarship_amount'], 2); ?></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.35rem 0; font-weight: 700; border-top: 1px dashed var(--jfw-border); margin-top: 0.35rem; padding-top: 0.5rem;">
                                    <span style="color: #fff;">Scholarship Price:</span>
                                    <span style="color: #34d399;">₹<?php echo number_format($res['scholarship_price'], 2); ?></span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.35rem 0;">
                                    <span style="color: var(--jfw-text-muted);">Pre-Book Paid:</span>
                                    <span style="color: #34d399; font-weight: 700;">₹<?php echo number_format($res['prebook_paid_amount'], 2); ?> ✓</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; padding: 0.35rem 0; font-weight: 800; color: var(--jfw-accent-amber);">
                                    <span>Remaining Amount:</span>
                                    <span>₹<?php echo number_format($res['remaining_amount'], 2); ?></span>
                                </div>
                            </div>

                            <div style="font-size: 0.88rem; color: var(--jfw-text-muted); margin-bottom: 1.25rem;">
                                <div><strong>Payment Status:</strong> <span style="color: #34d399; font-weight: 700;"><?php echo htmlspecialchars($res['payment_status']); ?></span></div>
                                <div><strong>Enrollment Status:</strong> <span class="ea-status-pill not-enrolled" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; margin-top: 0.2rem;"><?php echo htmlspecialchars($res['enrollment_status']); ?></span></div>
                                <div style="margin-top: 0.35rem;"><strong>Next Step:</strong> <span style="color: var(--jfw-accent-cyan); font-weight: 700;">ADMISSIONS COUNSELING</span></div>
                            </div>

                            <div style="text-align: center;">
                                <a href="https://wa.me/?text=Hello%20Admissions%20Team%2C%20I%20want%20to%20complete%20counseling%20for%20my%20held%20scholarship." target="_blank" class="jfw-btn jfw-btn-secondary" style="width: 100%; justify-content: center; padding: 0.65rem;">
                                    CONTACT ADMISSIONS COUNSELOR 💬
                                </a>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

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
