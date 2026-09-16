<?php
$activePage = 'payments';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = requireStudent();

$stmt = $pdo->prepare("SELECT email FROM students WHERE id = ?");
$stmt->execute([$studentId]);
$email = $stmt->fetchColumn();

// Fetch payment transactions from enrollments
$stmt = $pdo->prepare("
    SELECT e.*, c.title as course_title
    FROM enrollments e
    LEFT JOIN courses c ON e.course_id = c.id
    WHERE e.student_id = ? OR e.email = ?
    ORDER BY e.created_at DESC
");
$stmt->execute([$studentId, $email]);
$payments = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment History & Invoices — Education Algorithm</title>
    
    <!-- Instant Pre-Paint Theme Initialization -->
    <script>
        (function() {
            try {
                const savedTheme = localStorage.getItem('ea_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch(e) {}
        })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=9.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 860px;">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Payment History & Invoices</h1>
                <p>View your course enrollment transactions, invoice IDs, and payment verification receipts.</p>
            </div>
        </div>

        <div class="card" style="padding: 0; overflow: hidden;">
            <?php if (empty($payments)): ?>
                <div style="text-align: center; padding: 3rem 1.5rem;">
                    <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">💳</div>
                    <h3 style="font-size: 1.1rem; font-weight: 700;">No payment transactions recorded</h3>
                    <p style="margin-top: 0.25rem; font-size: 0.84rem; color: #64748b;">Enrollments completed through Razorpay will appear here automatically.</p>
                </div>
            <?php else: ?>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Program / Course</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Transaction ID</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($payments as $p): 
                            $isPaid = ($p['payment_status'] === 'paid' || $p['status'] === 'active' || $p['status'] === 'paid');
                            $courseName = !empty($p['course_title']) ? $p['course_title'] : (!empty($p['course']) ? $p['course'] : 'Full Stack Web Development');
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo e($courseName); ?></strong>
                            </td>
                            <td class="mono" style="font-weight: 700; font-size: 0.92rem;">
                                ₹<?php echo number_format($p["amount"] ?? 15000); ?>
                            </td>
                            <td>
                                <span class="badge <?php echo $isPaid ? 'paid' : 'pending'; ?>">
                                    <?php echo $isPaid ? '✓ Paid & Active' : '⏳ Pending'; ?>
                                </span>
                            </td>
                            <td>
                                <span class="mono" style="color: var(--text-muted); font-size: 0.78rem;">
                                    <?php echo e($p["razorpay_payment_id"] ?: ($p["razorpay_order_id"] ?: '—')); ?>
                                </span>
                            </td>
                            <td style="font-size: 0.85rem; color: var(--text-secondary);">
                                <?php echo date('M d, Y', strtotime($p["created_at"] ?? 'now')); ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </main>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
