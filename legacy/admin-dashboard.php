<?php
$adminActive = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

// CSV Export Handler
if (isset($_GET['export']) && $_GET['export'] === 'csv') {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="enrollments_export_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['ID', 'Name', 'Email', 'Phone', 'Course', 'Amount', 'Payment Status', 'Transaction ID', 'Date']);
    
    $exportStmt = $pdo->query("SELECT id, name, email, phone, course, amount, payment_status, razorpay_payment_id, COALESCE(enrolled_at, created_at) as enrolled_at FROM enrollments ORDER BY COALESCE(enrolled_at, created_at) DESC");
    while ($row = $exportStmt->fetch()) {
        fputcsv($out, [
            $row['id'],
            $row['name'],
            $row['email'],
            $row['phone'],
            $row['course'],
            $row['amount'],
            $row['payment_status'],
            $row['razorpay_payment_id'] ?? '',
            $row['enrolled_at']
        ]);
    }
    fclose($out);
    exit;
}

// Compute Executive Analytics
$totalStudents = 0;
$totalRevenue = 0;
$paidEnrollmentsCount = 0;
$pendingLeadsCount = 0;
$pendingReviews = 0;
$openTickets = 0;

try {
    $totalStudents = (int)$pdo->query("SELECT COUNT(*) FROM students")->fetchColumn();
} catch (Exception $e) {}

try {
    $revStmt = $pdo->query("SELECT SUM(amount) FROM enrollments WHERE payment_status = 'paid' OR status = 'active' OR status = 'paid'");
    $totalRevenue = (int)$revStmt->fetchColumn();
    $paidEnrollmentsCount = (int)$pdo->query("SELECT COUNT(*) FROM enrollments WHERE payment_status = 'paid' OR status = 'active' OR status = 'paid'")->fetchColumn();
    $pendingLeadsCount = (int)$pdo->query("SELECT COUNT(*) FROM enrollments WHERE payment_status = 'pending' OR status = 'pending'")->fetchColumn();
} catch (Exception $e) {}

try {
    $pendingReviews = (int)$pdo->query("SELECT COUNT(*) FROM assignment_submissions WHERE status = 'submitted'")->fetchColumn();
    $openTickets = (int)$pdo->query("SELECT COUNT(*) FROM support_messages WHERE status = 'open'")->fetchColumn();
} catch (Exception $e) {}

// Quick Broadcast POST handler
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["quick_broadcast"])) {
    verify_csrf();
    $title = clean_text($_POST["notif_title"] ?? "", 150);
    $body  = clean_text($_POST["notif_message"] ?? "", 3000);
    $priority = clean_text($_POST["priority"] ?? "general", 30);

    if ($title && $body) {
        $prefix = "";
        if ($priority === 'urgent') $prefix = "🚨 [URGENT] ";
        elseif ($priority === 'batch') $prefix = "📢 [BATCH UPDATE] ";
        elseif ($priority === 'career') $prefix = "💼 [CAREER DRIVE] ";
        
        $stmt = $pdo->prepare("INSERT INTO notifications (title, message) VALUES (?, ?)");
        $stmt->execute([$prefix . $title, $body]);
        $message = "Broadcast successfully published to all students!";
    }
}

// Search & Filter enrollments
$search = trim($_GET['search'] ?? '');
$statusFilter = trim($_GET['status'] ?? '');

$query = "SELECT * FROM enrollments WHERE 1=1";
$params = [];

if (!empty($search)) {
    $query .= " AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR razorpay_payment_id LIKE ?)";
    $term = "%$search%";
    $params = array_merge($params, [$term, $term, $term, $term]);
}

if (!empty($statusFilter)) {
    if ($statusFilter === 'paid') {
        $query .= " AND (payment_status = 'paid' OR status = 'active' OR status = 'paid')";
    } elseif ($statusFilter === 'pending') {
        $query .= " AND (payment_status = 'pending' OR status = 'pending')";
    } else {
        $query .= " AND (lead_status = ?)";
        $params[] = $statusFilter;
    }
}

$query .= " ORDER BY COALESCE(enrolled_at, created_at) DESC LIMIT 100";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$enrollments = $stmt->fetchAll();

// Admissions Funnel Calculations
$totalLeads = $paidEnrollmentsCount + $pendingLeadsCount;
$conversionRate = $totalLeads > 0 ? round(($paidEnrollmentsCount / $totalLeads) * 100, 1) : 0;
$avgOrderValue = $paidEnrollmentsCount > 0 ? round($totalRevenue / $paidEnrollmentsCount) : 0;

// Fetch contact inquiries
$messages = [];
try {
    $messages = $pdo->query("SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 50")->fetchAll();
} catch (Exception $e) {}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Executive Dashboard • Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
    <style>
        .filter-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.25rem;
        }

        .filter-group {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .filter-input {
            padding: 0.5rem 0.85rem;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            font-size: 0.88rem;
            width: 240px;
            max-width: 100%;
            margin-bottom: 0;
        }

        /* Modal Styles */
        .admin-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(10, 15, 30, 0.75);
            backdrop-filter: blur(6px);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            opacity: 0;
            visibility: hidden;
            transition: all 0.25s ease;
        }
        .admin-modal-backdrop.open {
            opacity: 1;
            visibility: visible;
        }
        .admin-modal-box {
            background: var(--bg-surface);
            border-radius: 16px;
            max-width: 580px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
            border: 1px solid var(--border);
            overflow: hidden;
            transform: scale(0.95);
            transition: transform 0.25s ease;
        }
        .admin-modal-backdrop.open .admin-modal-box {
            transform: scale(1);
        }

        /* Funnel Progress */
        .funnel-deck {
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 1.15rem 1.4rem;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1.25rem;
        }

        @media (max-width: 600px) {
            .filter-bar {
                flex-direction: column;
                align-items: stretch;
            }
            .filter-group {
                width: 100%;
            }
            .filter-input {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Executive Command & Revenue Intelligence</h1>
                <p>Platform telemetry, admissions funnel health, and student operations.</p>
            </div>

            <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
                <button type="button" class="btn btn-primary btn-sm" onclick="openBroadcastModal()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    <span>Quick Broadcast</span>
                </button>
                <a href="admin-dashboard?export=csv" class="btn btn-secondary btn-sm">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    <span>Export CSV</span>
                </a>
            </div>
        </div>

        <?php if (!empty($message)): ?>
            <div class="alert alert-success" style="margin-bottom: 1.25rem;">
                <span>&#10003; <?php echo e($message); ?></span>
            </div>
        <?php endif; ?>

        <!-- Executive Financial & Conversion Overview -->
        <div class="funnel-deck">
            <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; color: var(--text-muted);">Admissions Conversion Velocity</div>
                <div style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-top: 0.15rem;">
                    <?php echo $conversionRate; ?>% <span style="font-size: 0.85rem; font-weight: 500; color: #10b981;">(<?php echo $paidEnrollmentsCount; ?> Paid / <?php echo $totalLeads; ?> Total Leads)</span>
                </div>
            </div>
            <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
                <div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Avg Order Value</div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #6366f1;">&#8377;<?php echo number_format($avgOrderValue); ?></div>
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Faculty Queue</div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #f59e0b;"><?php echo $pendingReviews; ?> Reviews</div>
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Support Tickets</div>
                    <div style="font-size: 1.15rem; font-weight: 700; color: #ef4444;"><?php echo $openTickets; ?> Open</div>
                </div>
            </div>
        </div>

        <!-- 5-Card Interactive Analytics Grid -->
        <section class="stats-grid" style="grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));">
            <a href="admin-dashboard?status=paid" class="stat-card" style="text-decoration:none; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="stat-icon emerald">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-label">Total Revenue</div>
                    <div class="stat-value">&#8377;<?php echo number_format($totalRevenue); ?></div>
                </div>
            </a>

            <a href="admin-dashboard?status=paid" class="stat-card" style="text-decoration:none; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="stat-icon indigo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-label">Paid Students</div>
                    <div class="stat-value"><?php echo $paidEnrollmentsCount; ?></div>
                </div>
            </a>

            <a href="admin-dashboard?status=pending" class="stat-card" style="text-decoration:none; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="stat-icon amber">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-label">Enquiry Leads (Unpaid)</div>
                    <div class="stat-value"><?php echo $pendingLeadsCount; ?></div>
                </div>
            </a>

            <a href="admin-assignments.php" class="stat-card" style="text-decoration:none; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="stat-icon indigo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-label">Pending Reviews</div>
                    <div class="stat-value"><?php echo $pendingReviews; ?></div>
                </div>
            </a>

            <a href="admin-support.php" class="stat-card" style="text-decoration:none; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform='translateY(0)'">
                <div class="stat-icon rose">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div class="stat-info">
                    <div class="stat-label">Open Tickets</div>
                    <div class="stat-value"><?php echo $openTickets; ?></div>
                </div>
            </a>
        </section>

        <!-- 1. TOP SECTION: Admissions & Contact Inquiries (Moved to Top as Requested) -->
        <section class="card" style="padding: 1.5rem; margin-bottom: 2rem;">
            <div class="card-header" style="margin-bottom: 1.25rem;">
                <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">Admissions & Contact Inquiries (<?php echo count($messages); ?>)</h2>
            </div>

            <?php if (empty($messages)): ?>
                <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted);">
                    No contact form submissions recorded yet.
                </div>
            <?php else: ?>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Prospect Details & Mobile</th>
                            <th>Inquiry Message</th>
                            <th>Date</th>
                            <th>Quick Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($messages as $m): 
                            $rawPhone = preg_replace('/\D/', '', $m['phone'] ?? '');
                            $waPhone = str_starts_with($rawPhone, '91') ? $rawPhone : '91' . $rawPhone;
                        ?>
                        <tr>
                            <td style="width: 250px;">
                                <strong style="font-size:0.95rem; color:var(--text-main);"><?php echo e($m["name"]); ?></strong>
                                <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
                                    ✉ <a href="mailto:<?php echo e($m['email']); ?>" style="color: var(--primary); text-decoration: none; font-weight:600;">
                                        <?php echo e($m["email"]); ?>
                                    </a>
                                </div>
                                <?php if (!empty($m['phone'])): ?>
                                <div style="font-size: 0.85rem; color: #10b981; font-weight: 700; margin-top: 0.2rem;">
                                    📞 <a href="tel:<?php echo e($m['phone']); ?>" style="color: #059669; text-decoration: none;">
                                        <?php echo e($m["phone"]); ?>
                                    </a>
                                </div>
                                <?php endif; ?>
                            </td>
                            <td style="font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;"><?php echo e($m["message"]); ?></td>
                            <td class="mono" style="font-size: 0.78rem; color: var(--text-muted); width: 120px;">
                                <?php echo date('M d, Y', strtotime($m["created_at"])); ?>
                            </td>
                            <td style="width: 140px;">
                                <?php if (!empty($m['phone'])): ?>
                                    <a href="https://wa.me/<?php echo e($waPhone); ?>" target="_blank" rel="noopener noreferrer" style="display:inline-block; background:#10b981; color:#fff; font-size:0.75rem; font-weight:700; padding:0.4rem 0.75rem; border-radius:6px; text-decoration:none; margin-bottom:0.35rem; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">💬 WhatsApp</a>
                                    <a href="tel:<?php echo e($m['phone']); ?>" style="display:inline-block; background:#e0e7ff; color:#4338ca; font-size:0.75rem; font-weight:700; padding:0.4rem 0.75rem; border-radius:6px; text-decoration:none;">📞 Call Now</a>
                                <?php else: ?>
                                    <span style="font-size:0.75rem; color:#94a3b8;">No phone</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </section>

        <!-- 2. SECOND SECTION: Course Enrollments & Enquiry Leads Table -->
        <section class="card" style="padding: 1.5rem;">
            <div class="filter-bar">
                <div>
                    <h2 style="font-size: 1.25rem;">Enrollments & Enquiry Leads (<?php echo count($enrollments); ?>)</h2>
                </div>

                <form method="GET" class="filter-group">
                    <input type="text" name="search" class="filter-input" placeholder="Search name, email, phone..." value="<?php echo e($search); ?>">
                    <select name="status" class="filter-input" style="width: 200px;">
                        <option value="">All Records</option>
                        <option value="paid" <?php echo $statusFilter === 'paid' ? 'selected' : ''; ?>>? Paid Students Only</option>
                        <option value="pending" <?php echo $statusFilter === 'pending' ? 'selected' : ''; ?>>? Enquiry Leads (Unpaid)</option>
                        <optgroup label="Filter by CRM Lead Stage">
                            <option value="new" <?php echo $statusFilter === 'new' ? 'selected' : ''; ?>>Stage: New Lead</option>
                            <option value="contacted" <?php echo $statusFilter === 'contacted' ? 'selected' : ''; ?>>Stage: Contacted</option>
                            <option value="follow_up" <?php echo $statusFilter === 'follow_up' ? 'selected' : ''; ?>>Stage: Follow-Up</option>
                            <option value="interested" <?php echo $statusFilter === 'interested' ? 'selected' : ''; ?>>Stage: Interested</option>
                            <option value="converted" <?php echo $statusFilter === 'converted' ? 'selected' : ''; ?>>Stage: Converted</option>
                            <option value="lost" <?php echo $statusFilter === 'lost' ? 'selected' : ''; ?>>Stage: Lost</option>
                        </optgroup>
                    </select>
                    <button type="submit" class="btn btn-primary btn-sm">Filter</button>
                    <?php if (!empty($search) || !empty($statusFilter)): ?>
                        <a href="admin-dashboard" class="btn btn-secondary btn-sm">Reset</a>
                    <?php endif; ?>
                </form>
            </div>

            <?php if (empty($enrollments)): ?>
                <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                    No enrollment records match your search criteria.
                </div>
            <?php else: ?>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Student Details</th>
                            <th>Contact</th>
                            <th>Enrolled Program</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Lead Status</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $leadStatusLabels = ['new'=>'New Lead','contacted'=>'Contacted','follow_up'=>'Follow-Up','interested'=>'Interested','converted'=>'Converted','lost'=>'Lost'];
                        $leadStatusColors = ['new'=>'#6366f1','contacted'=>'#0ea5e9','follow_up'=>'#f59e0b','interested'=>'#8b5cf6','converted'=>'#10b981','lost'=>'#ef4444'];
                        foreach ($enrollments as $e):
                            $isPaid = ($e['payment_status'] === 'paid' || $e['status'] === 'active' || $e['status'] === 'paid');
                            $ls = $e['lead_status'] ?? 'new';
                        ?>
                        <tr>
                            <td>
                                <strong><?php echo e($e["name"]); ?></strong>
                                <div class="mono" style="font-size: 0.75rem; color: var(--text-muted);">
                                    Tx: <?php echo e($e["razorpay_payment_id"] ?: '—'); ?>
                                </div>
                            </td>
                            <td>
                                <div style="font-size: 0.88rem;"><?php echo e($e["email"]); ?></div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);"><?php echo e($e["phone"]); ?></div>
                            </td>
                            <td><?php echo e($e["course"] ?? 'Full Stack Development'); ?></td>
                            <td class="mono" style="font-weight: 700;">&#8377;<?php echo number_format($e["amount"] ?? 15000); ?></td>
                            <td>
                                <span class="badge <?php echo $isPaid ? 'paid' : 'pending'; ?>">
                                    <?php echo $isPaid ? '&#10003; PAID' : '&#9203; PENDING'; ?>
                                </span>
                            </td>
                            <td>
                                <span style="display:inline-block; padding:0.25rem 0.6rem; border-radius:999px; font-size:0.72rem; font-weight:700; color:#fff; background:<?php echo $leadStatusColors[$ls] ?? '#6366f1'; ?>; white-space:nowrap;">
                                    <?php echo e($leadStatusLabels[$ls] ?? 'New Lead'); ?>
                                </span>
                            </td>
                            <td style="font-size: 0.82rem; color: var(--text-muted); white-space:nowrap;">
                                <?php echo date('M d, Y', strtotime($e['enrolled_at'] ?? $e['created_at'])); ?>
                            </td>
                            <td>
                                <a href="admin-lead?id=<?php echo (int)$e['id']; ?>" class="btn btn-secondary btn-sm" style="color:#4f46e5; font-weight:700; font-size:0.8rem; padding:0.3rem 0.65rem; text-decoration:none; white-space:nowrap;">View Lead &rarr;</a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </section>
    </main>

    <!-- Quick Broadcast Modal -->
    <div class="admin-modal-backdrop" id="broadcastModalBackdrop" onclick="if(event.target === this) closeBroadcastModal()">
        <div class="admin-modal-box">
            <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; background: #f8fafc;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-size: 1.2rem;">??</span>
                    <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #0f172a;">Quick Broadcast Dispatcher</h3>
                </div>
                <button type="button" onclick="closeBroadcastModal()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;">?</button>
            </div>

            <form method="POST" style="padding: 1.5rem;">
                <?php echo csrf_field(); ?>
                <input type="hidden" name="quick_broadcast" value="1">

                <div class="form-group">
                    <label for="priority" style="font-size: 0.8rem; font-weight: 600;">Announcement Priority Channel</label>
                    <select name="priority" id="priority" class="filter-input" style="width: 100%;">
                        <option value="general">&#128226; General Announcement</option>
                        <option value="urgent">&#128680; Urgent / System Alert</option>
                        <option value="batch">&#128197; Live Batch Schedule & Room Link</option>
                        <option value="career">&#128188; Career Placement & Hiring Opportunity</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="notif_title" style="font-size: 0.8rem; font-weight: 600;">Headline Title</label>
                    <input type="text" name="notif_title" id="notif_title" placeholder="e.g. Sunday Live Mentoring Postponed by 1 Hour" required maxlength="150">
                </div>

                <div class="form-group">
                    <label for="notif_message" style="font-size: 0.8rem; font-weight: 600;">Message Content</label>
                    <textarea name="notif_message" id="notif_message" rows="4" placeholder="Enter instructions or details for all students..." required maxlength="3000"></textarea>
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="closeBroadcastModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary btn-sm">&#128640; Publish to All Students</button>
                </div>
            </form>
        </div>
    </div>

    <script>
    function openBroadcastModal() {
        document.getElementById('broadcastModalBackdrop').classList.add('open');
    }
    function closeBroadcastModal() {
        document.getElementById('broadcastModalBackdrop').classList.remove('open');
    }
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeBroadcastModal();
    });
    </script>
</body>
</html>

