<?php
$adminActive = 'finance';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

// Handle Create Coupon
$couponMsg = '';
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['create_coupon'])) {
    verify_csrf();
    $code = strtoupper(clean_text($_POST['code'] ?? '', 30));
    $type = clean_text($_POST['discount_type'] ?? 'percentage', 20);
    $val  = (int)($_POST['discount_value'] ?? 10);
    $max  = (int)($_POST['max_uses'] ?? 100);
    $exp  = clean_text($_POST['expires_at'] ?? '', 20);

    if (!empty($code) && $val > 0) {
        $ins = $pdo->prepare("INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at) VALUES (?, ?, ?, ?, ?)");
        $ins->execute([$code, $type, $val, $max, !empty($exp) ? $exp : null]);
        $couponMsg = "Coupon '{$code}' created successfully!";
    }
}

// Toggle Coupon Status (POST + CSRF - ISSUE 26 FIX)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && isset($_POST['toggle_coupon'])) {
    verify_csrf();
    $cId = (int)$_POST['coupon_id'];
    if ($cId > 0) {
        $pdo->prepare("UPDATE coupons SET is_active = IF(is_active=1, 0, 1) WHERE id = ?")->execute([$cId]);
        header("Location: admin-finance.php");
        exit;
    }
}

// Financial Aggregations (Reconciled against verified Payments ledger)
$totalRevenue = 0;
$paidCount = 0;

try {
    $totalRevenue = (int)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'success'")->fetchColumn();
    $paidCount = (int)$pdo->query("SELECT COUNT(*) FROM payments WHERE status = 'success'")->fetchColumn();
} catch (Throwable $e) {
    error_log("Finance query error (payments): " . $e->getMessage());
}

if ($totalRevenue === 0) {
    try {
        $totalRevenue = (int)$pdo->query("SELECT COALESCE(SUM(amount), 0) FROM enrollments WHERE payment_status = 'paid' AND status = 'active'")->fetchColumn();
        $paidCount = (int)$pdo->query("SELECT COUNT(*) FROM enrollments WHERE payment_status = 'paid' AND status = 'active'")->fetchColumn();
    } catch (Throwable $e) {
        error_log("Finance query error (enrollments): " . $e->getMessage());
    }
}
$avgOrderVal = ($paidCount > 0) ? round($totalRevenue / $paidCount) : 0;

$couponsList = [];
try {
    $couponsList = $pdo->query("SELECT * FROM coupons ORDER BY id DESC")->fetchAll(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    error_log("Finance query error (coupons): " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Microsoft Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y45hrispgg");
</script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Financial Studio & Coupons — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            <header class="admin-header">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">💳 Financials & Promotional Coupons</h1>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Track revenue metrics, average order values, and configure dynamic promotional discount codes.</p>
                </div>
            </header>

            <!-- Financial Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="card">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Total Platform Revenue</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #10b981; margin-top: 0.35rem;">₹<?php echo number_format($totalRevenue); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">All-time gross collections</div>
                </div>
                <div class="card">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Paid Enrollments</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #6366f1; margin-top: 0.35rem;"><?php echo number_format($paidCount); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Verified course purchases</div>
                </div>
                <div class="card">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Average Order Value (AOV)</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 0.35rem;">₹<?php echo number_format($avgOrderVal); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Per successful checkout</div>
                </div>
            </div>

            <?php if (!empty($couponMsg)): ?>
                <div style="background: #dcfce7; border: 1px solid #86efac; color: #166534; padding: 0.85rem 1.25rem; border-radius: 8px; margin-bottom: 1.25rem; font-weight: 600;">
                    ✓ <?php echo $couponMsg; ?>
                </div>
            <?php endif; ?>

            <!-- Coupon Manager -->
            <div style="display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem;">
                <!-- Create Coupon Form -->
                <div class="card">
                    <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-bottom: 1rem;">➕ Create Promo Coupon</h3>
                    <form method="POST">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="create_coupon" value="1">
                        
                        <div class="form-group">
                            <label>Coupon Code (Uppercase)</label>
                            <input type="text" name="code" placeholder="e.g. FESTIVE40" required style="text-transform: uppercase;">
                        </div>

                        <div class="form-group">
                            <label>Discount Type</label>
                            <select name="discount_type">
                                <option value="percentage">Percentage Off (%)</option>
                                <option value="fixed">Fixed Amount Off (₹)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Discount Value</label>
                            <input type="number" name="discount_value" min="1" placeholder="e.g. 40 (for 40%) or 1000" required>
                        </div>

                        <div class="form-group">
                            <label>Max Total Redemptions</label>
                            <input type="number" name="max_uses" value="100" min="1">
                        </div>

                        <div class="form-group">
                            <label>Expiration Date (Optional)</label>
                            <input type="date" name="expires_at">
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 0.5rem;">
                            Publish Coupon
                        </button>
                    </form>
                </div>

                <!-- Existing Coupons Table -->
                <div class="card" style="padding: 0; overflow: hidden; border-radius: 12px;">
                    <div style="padding: 1.1rem 1.4rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; font-weight: 800; font-size: 0.95rem; color: #0f172a;">
                        Active Promotional Coupons
                    </div>
                    <table class="table" style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; text-align: left; font-size: 0.76rem; text-transform: uppercase; color: #64748b;">
                                <th style="padding: 0.85rem 1rem;">Code</th>
                                <th style="padding: 0.85rem 1rem;">Discount</th>
                                <th style="padding: 0.85rem 1rem;">Redemptions</th>
                                <th style="padding: 0.85rem 1rem;">Status</th>
                                <th style="padding: 0.85rem 1rem; text-align: right;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($couponsList as $cp): ?>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <td style="padding: 0.95rem 1rem; font-family: monospace; font-size: 0.9rem; font-weight: 800; color: #4338ca;">
                                    <?php echo e($cp['code']); ?>
                                </td>
                                <td style="padding: 0.95rem 1rem; font-weight: 700; color: #0f172a;">
                                    <?php echo ($cp['discount_type'] === 'percentage') ? $cp['discount_value'] . '%' : '₹' . number_format($cp['discount_value']); ?> OFF
                                </td>
                                <td style="padding: 0.95rem 1rem; font-size: 0.84rem; color: #64748b;">
                                    <?php echo $cp['times_used']; ?> / <?php echo $cp['max_uses']; ?>
                                </td>
                                <td style="padding: 0.95rem 1rem;">
                                    <span class="badge" style="background: <?php echo $cp['is_active'] ? '#dcfce7; color: #166534;' : '#fee2e2; color: #991b1b;'; ?> font-weight: 700; font-size: 0.72rem; padding: 0.2rem 0.55rem; border-radius: 4px;">
                                        <?php echo $cp['is_active'] ? 'Active' : 'Disabled'; ?>
                                    </span>
                                </td>
                                <td style="padding: 0.95rem 1rem; text-align: right;">
                                    <form method="POST" style="display:inline;">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="toggle_coupon" value="1">
                                        <input type="hidden" name="coupon_id" value="<?php echo (int)$cp['id']; ?>">
                                        <button type="submit" class="btn btn-secondary btn-sm" style="font-size: 0.74rem;">
                                            <?php echo $cp['is_active'] ? 'Disable' : 'Enable'; ?>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>
</body>
</html>