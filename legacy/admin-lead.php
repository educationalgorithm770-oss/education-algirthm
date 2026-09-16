<?php
$adminActive = 'analytics';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$adminId = requireAdmin();
$enrollmentId = (int)($_GET['id'] ?? 0);

if (!$enrollmentId) {
    header("Location: admin-dashboard");
    exit;
}

$message = '';

// Update lead status
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_status'])) {
    verify_csrf();
    $newStatus = $_POST['lead_status'] ?? 'new';
    $allowed = ['new', 'contacted', 'follow_up', 'interested', 'converted', 'lost'];
    if (in_array($newStatus, $allowed, true)) {
        $stmt = $pdo->prepare("UPDATE enrollments SET lead_status = ? WHERE id = ?");
        $stmt->execute([$newStatus, $enrollmentId]);
        $message = 'Status updated.';
    }
}

// Add a note
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_note'])) {
    verify_csrf();
    $noteRaw = trim($_POST['note'] ?? '');
    $note = strip_tags($noteRaw);
    if ($note === '') {
        $error = "Note cannot be empty.";
    } elseif (mb_strlen($note) > 1000) {
        $error = "Note is too long (max 1000 characters).";
    } else {
        $stmt = $pdo->prepare("INSERT INTO lead_notes (enrollment_id, created_by, note) VALUES (?, ?, ?)");
        $stmt->execute([$enrollmentId, $_SESSION['admin_username'] ?? 'admin', $note]);
        $message = 'Note added.';
    }
}

// Fetch the lead/enrollment
$stmt = $pdo->prepare("SELECT * FROM enrollments WHERE id = ?");
$stmt->execute([$enrollmentId]);
$lead = $stmt->fetch();

if (!$lead) {
    header("Location: admin-dashboard");
    exit;
}

// Fetch notes timeline (newest first)
$stmt = $pdo->prepare("SELECT * FROM lead_notes WHERE enrollment_id = ? ORDER BY created_at DESC");
$stmt->execute([$enrollmentId]);
$notes = $stmt->fetchAll();

// Fetch this student's payment/enrollment history (other enrollments by same email, if any)
$stmt = $pdo->prepare("SELECT * FROM enrollments WHERE email = ? AND id != ? ORDER BY COALESCE(enrolled_at, created_at) DESC");
$stmt->execute([$lead['email'], $enrollmentId]);
$otherEnrollments = $stmt->fetchAll();

// Fetch support tickets from this email (if a student account exists)
$supportTickets = [];
try {
    $stmt = $pdo->prepare("
        SELECT sm.* FROM support_messages sm
        JOIN students s ON sm.student_id = s.id
        WHERE s.email = ?
        ORDER BY sm.created_at DESC LIMIT 10
    ");
    $stmt->execute([$lead['email']]);
    $supportTickets = $stmt->fetchAll();
} catch (Exception $e) {}

$statusLabels = [
    'new' => 'New Lead',
    'contacted' => 'Contacted',
    'follow_up' => 'Follow-Up Needed',
    'interested' => 'Interested',
    'converted' => 'Converted',
    'lost' => 'Lost',
];
$statusColors = [
    'new' => '#6366f1',
    'contacted' => '#0ea5e9',
    'follow_up' => '#f59e0b',
    'interested' => '#8b5cf6',
    'converted' => '#10b981',
    'lost' => '#ef4444',
];
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
    <title>Lead — <?php echo e($lead['name']); ?> — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=9.0">
    <style>
        .lead-header{
            display:flex; justify-content:space-between; align-items:flex-start;
            flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;
        }
        .lead-name{font-size:1.5rem; font-weight:800; margin-bottom:0.25rem;}
        .lead-meta{color:var(--text-muted,#64748b); font-size:0.9rem;}
        .status-pill{
            display:inline-flex; align-items:center; gap:0.4rem;
            padding:0.35rem 0.85rem; border-radius:999px; font-size:0.8rem; font-weight:700;
            color:#fff;
        }
        .back-link{color:#4f46e5; text-decoration:none; font-size:0.9rem; font-weight:600; display:inline-block; margin-bottom:1rem;}

        .lead-grid{display:grid; grid-template-columns:2fr 1fr; gap:1.5rem;}
        @media (max-width:860px){ .lead-grid{grid-template-columns:1fr;} }

        .card{background:var(--bg-surface, #fff); border:1px solid var(--border, #e2e8f0); border-radius:16px; padding:1.5rem; margin-bottom:1.5rem;}
        .card h3{font-size:1.05rem; margin-bottom:1rem;}

        .info-row{display:flex; justify-content:space-between; padding:0.6rem 0; border-bottom:1px solid var(--border, #f1f5f9); font-size:0.9rem;}
        .info-row:last-child{border-bottom:none;}
        .info-row span:first-child{color:var(--text-muted,#64748b);}
        .info-row span:last-child{font-weight:600; text-align:right;}

        .status-form select{
            width:100%; padding:0.65rem; border:1px solid #e2e8f0; border-radius:8px; margin-bottom:0.75rem; font-family:inherit;
        }
        .status-form button, .note-form button{
            width:100%; padding:0.7rem; background:#4f46e5; color:#fff; border:none;
            border-radius:8px; font-weight:700; cursor:pointer;
        }

        .note-form textarea{
            width:100%; padding:0.7rem; border:1px solid #e2e8f0; border-radius:8px;
            font-family:inherit; margin-bottom:0.75rem; min-height:80px; resize:vertical;
        }
        .timeline{display:flex; flex-direction:column; gap:1rem;}
        .timeline-item{padding:0.9rem 1rem; background:#f8fafc; border-radius:10px; border-left:3px solid #4f46e5;}
        .timeline-item .meta{font-size:0.75rem; color:var(--text-muted,#64748b); margin-bottom:0.35rem;}
        .timeline-item .body{font-size:0.9rem; white-space:pre-wrap;}
        .empty-note{color:var(--text-muted,#64748b); font-size:0.88rem; padding:0.5rem 0;}

        .message-banner{background:#ecfdf5; color:#047857; padding:0.8rem 1rem; border-radius:8px; margin-bottom:1rem; font-size:0.9rem;}

        .mini-table{width:100%; border-collapse:collapse; font-size:0.85rem;}
        .mini-table th, .mini-table td{text-align:left; padding:0.5rem; border-bottom:1px solid #f1f5f9;}
    </style>
</head>
<body style="background:#f8fafc;">
    <?php include 'admin-nav.php'; ?>

    <div style="max-width:1100px; margin:0 auto; padding:2rem 1.5rem;">
        <a href="admin-dashboard" class="back-link">← Back to Enrollments</a>

        <?php if ($message): ?>
            <div class="message-banner"><?php echo e($message); ?></div>
        <?php endif; ?>

        <div class="lead-header">
            <div>
                <div class="lead-name"><?php echo e($lead['name']); ?></div>
                <div class="lead-meta"><?php echo e($lead['email']); ?> · <?php echo e($lead['phone']); ?></div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <?php 
                $cleanPhone = preg_replace('/[^0-9]/', '', $lead['phone'] ?? '');
                if (strlen($cleanPhone) === 10) $cleanPhone = '91' . $cleanPhone;
                ?>
                <?php if (!empty($cleanPhone)): ?>
                <a href="https://wa.me/<?php echo $cleanPhone; ?>?text=Hi%20<?php echo urlencode($lead['name']); ?>,%20this%20is%20Education%20Algorithm%20Admissions.%20We%20saw%20your%20interest%20in%20our%20<?php echo urlencode($lead['course'] ?? 'Full Stack'); ?>%20course!%20How%20can%20we%20assist%20you%20today?" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="background:#25D366; color:#fff; border:none; font-weight:700;">
                    💬 WhatsApp Prospect
                </a>
                <?php endif; ?>
                <a href="mailto:<?php echo e($lead['email']); ?>?subject=Admissions%20Inquiry%20—%20Education%20Algorithm&body=Hi%20<?php echo urlencode($lead['name']); ?>,%0D%0A%0D%0AThank%20you%20for%20your%20interest%20in%20our%20<?php echo urlencode($lead['course'] ?? 'Full Stack'); ?>%20program.%0D%0A%0D%0AWe%20would%20love%20to%20help%20you%20with%20your%20enrollment%20and%20curriculum%20questions.%0D%0A%0D%0ABest%20regards,%0D%0AAdmissions%20Office" class="btn btn-secondary btn-sm">
                    ✉️ Email Prospect
                </a>
                <span class="status-pill" style="background: <?php echo $statusColors[$lead['lead_status']] ?? '#6366f1'; ?>;">
                    <?php echo e($statusLabels[$lead['lead_status']] ?? 'New Lead'); ?>
                </span>
            </div>
        </div>

        <div class="lead-grid">
            <div>
                <div class="card">
                    <h3>Contact & Enrollment Details</h3>
                    <div class="info-row"><span>Course</span><span><?php echo e($lead['course']); ?></span></div>
                    <div class="info-row"><span>Amount</span><span>₹<?php echo number_format($lead['amount']); ?></span></div>
                    <div class="info-row"><span>Payment Status</span><span><?php echo e(ucfirst($lead['payment_status'])); ?></span></div>
                    <div class="info-row"><span>Enrollment Status</span><span><?php echo e(ucfirst($lead['status'])); ?></span></div>
                    <div class="info-row"><span>Payment ID</span><span><?php echo e($lead['razorpay_payment_id'] ?: '—'); ?></span></div>
                    <div class="info-row"><span>Enrolled</span><span><?php echo date('M d, Y', strtotime($lead['enrolled_at'] ?? $lead['created_at'])); ?></span></div>
                </div>

                <div class="card">
                    <h3>Add a Note</h3>
                    <form method="POST" class="note-form">
                        <?php echo csrf_field(); ?>
                        <textarea name="note" placeholder="e.g. Called on Aug 14 — interested but wants to wait for next batch. Follow up in 3 days." required maxlength="1000"></textarea>
                        <button type="submit" name="add_note">Save Note</button>
                    </form>
                </div>

                <div class="card">
                    <h3>Activity Timeline (<?php echo count($notes); ?>)</h3>
                    <?php if (count($notes) === 0): ?>
                        <p class="empty-note">No notes yet. Log your first call or follow-up above.</p>
                    <?php else: ?>
                        <div class="timeline">
                            <?php foreach ($notes as $n): ?>
                            <div class="timeline-item">
                                <div class="meta"><?php echo e($n['created_by']); ?> · <?php echo date('M d, Y g:i A', strtotime($n['created_at'])); ?></div>
                                <div class="body"><?php echo e($n['note']); ?></div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <?php if (count($supportTickets) > 0): ?>
                <div class="card">
                    <h3>Support Tickets</h3>
                    <div class="table-responsive">
                        <table class="mini-table">
                            <tr><th>Subject</th><th>Status</th><th>Date</th></tr>
                            <?php foreach ($supportTickets as $t): ?>
                            <tr>
                                <td><?php echo e($t['subject']); ?></td>
                                <td><?php echo e(ucfirst($t['status'])); ?></td>
                                <td><?php echo date('M d, Y', strtotime($t['created_at'])); ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </table>
                    </div>
                </div>
                <?php endif; ?>
            </div>

            <div>
                <div class="card">
                    <h3>Update Lead Status</h3>
                    <form method="POST" class="status-form">
                        <?php echo csrf_field(); ?>
                        <select name="lead_status">
                            <?php foreach ($statusLabels as $key => $label): ?>
                                <option value="<?php echo $key; ?>" <?php echo $lead['lead_status'] === $key ? 'selected' : ''; ?>><?php echo e($label); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <button type="submit" name="update_status">Update Status</button>
                    </form>
                </div>

                <?php if (count($otherEnrollments) > 0): ?>
                <div class="card">
                    <h3>Other Enrollments (Same Email)</h3>
                    <?php foreach ($otherEnrollments as $oe): ?>
                    <div class="info-row">
                        <span><?php echo e($oe['course']); ?></span>
                        <span><?php echo e(ucfirst($oe['payment_status'])); ?></span>
                    </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <div class="card">
                    <h3>Quick Actions</h3>
                    <a href="mailto:<?php echo e($lead['email']); ?>" style="display:block; padding:0.6rem 0; color:#4f46e5; text-decoration:none; font-weight:600; font-size:0.9rem;">✉ Send Email</a>
                    <a href="tel:<?php echo e($lead['phone']); ?>" style="display:block; padding:0.6rem 0; color:#4f46e5; text-decoration:none; font-weight:600; font-size:0.9rem;">📞 Call <?php echo e($lead['phone']); ?></a>
                    <a href="https://wa.me/91<?php echo e(preg_replace('/\D/', '', $lead['phone'])); ?>" target="_blank" rel="noopener noreferrer" style="display:block; padding:0.6rem 0; color:#4f46e5; text-decoration:none; font-weight:600; font-size:0.9rem;">💬 WhatsApp</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>


