<?php
// admin-scholarships.php — Admin Scholarship Reservation CRM & Reporting View
// Route: /admin-scholarships.php
$adminActive = 'scholarships';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();

// Admin Filters
$filterScholarshipStatus = clean_text($_GET['scholarship_status'] ?? '', 30);
$filterEnrollmentStatus = clean_text($_GET['enrollment_status'] ?? '', 30);
$searchQuery = clean_text($_GET['q'] ?? '', 100);

$whereClauses = [];
$params = [];

if (!empty($filterScholarshipStatus)) {
    $whereClauses[] = "r.scholarship_status = ?";
    $params[] = $filterScholarshipStatus;
}

if (!empty($filterEnrollmentStatus)) {
    $whereClauses[] = "r.enrollment_status = ?";
    $params[] = $filterEnrollmentStatus;
}

if (!empty($searchQuery)) {
    $whereClauses[] = "(s.name LIKE ? OR s.email LIKE ? OR r.payment_reference LIKE ? OR r.payment_order_id LIKE ?)";
    $term = "%" . $searchQuery . "%";
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
    $params[] = $term;
}

$whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";

// Fetch Scholarship Reservations
$stmtList = $pdo->prepare("
    SELECT r.*, c.title as course_title, 
           COALESCE(s.name, 'Guest Student') as student_name, 
           COALESCE(s.email, r.payment_reference) as student_email,
           COALESCE(s.phone, '-') as student_phone
    FROM scholarship_reservations r
    JOIN courses c ON r.course_id = c.id
    LEFT JOIN students s ON r.student_id = s.id
    $whereSql
    ORDER BY r.id DESC
");
$stmtList->execute($params);
$reservations = $stmtList->fetchAll();

// Financial Metrics Aggregation (Phase 29)
$stmtMetrics = $pdo->query("
    SELECT 
        COUNT(CASE WHEN scholarship_status = 'HELD' THEN 1 END) as total_held_count,
        SUM(CASE WHEN payment_status = 'PREBOOK_PAID' THEN prebook_paid_amount ELSE 0 END) as total_prebook_revenue,
        SUM(CASE WHEN scholarship_status = 'HELD' THEN remaining_amount ELSE 0 END) as total_outstanding_balance,
        COUNT(CASE WHEN scholarship_status = 'CONVERTED' THEN 1 END) as total_converted_count
    FROM scholarship_reservations
");
$metrics = $stmtMetrics->fetch();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scholarship Holds & Pre-Books — Admin Control Center</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
        .table-responsive-box {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            background: #ffffff;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .admin-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
            text-align: left;
        }
        .admin-table th {
            background: #f8fafc;
            padding: 0.9rem 1.1rem;
            font-size: 0.76rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
            border-bottom: 1px solid #e2e8f0;
            white-space: nowrap;
        }
        .admin-table td {
            padding: 0.95rem 1.1rem;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
            font-size: 0.88rem;
            color: #0f172a;
            white-space: nowrap;
        }
        .admin-table tr:last-child td {
            border-bottom: none;
        }
        .admin-table tr:hover {
            background: #fbfcfe;
        }
        .badge-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.2rem 0.6rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
        }
        .badge-held { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
        .badge-pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .badge-converted { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
        .badge-not-enrolled { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    </style>
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1400px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            <header class="admin-header" style="margin-bottom: 1.5rem;">
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">🎓 Scholarship Holds & Pre-Books</h1>
                    <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Manage webinar scholarship reservations separately from official course enrollments.</p>
                </div>
            </header>

            <!-- Financial Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Scholarships Held</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #10b981; margin-top: 0.35rem;"><?php echo number_format($metrics['total_held_count'] ?? 0); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Active ₹500 reservations</div>
                </div>
                <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Pre-Book Revenue (₹500s)</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #6366f1; margin-top: 0.35rem;">₹<?php echo number_format($metrics['total_prebook_revenue'] ?? 0); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Collected pre-book fees</div>
                </div>
                <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Outstanding Balance</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #f59e0b; margin-top: 0.35rem;">₹<?php echo number_format($metrics['total_outstanding_balance'] ?? 0); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Remaining ₹14,500 dues</div>
                </div>
                <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div style="font-size: 0.78rem; text-transform: uppercase; color: #64748b; font-weight: 700;">Converted Enrollments</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #8b5cf6; margin-top: 0.35rem;"><?php echo number_format($metrics['total_converted_count'] ?? 0); ?></div>
                    <div style="font-size: 0.76rem; color: #64748b; margin-top: 0.2rem;">Official course registrations</div>
                </div>
            </div>

            <!-- Filters & Search Form -->
            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                <form method="GET" action="admin-scholarships" style="display: flex; gap: 0.85rem; flex-wrap: wrap; align-items: center;">
                    <input type="text" name="q" value="<?php echo htmlspecialchars($searchQuery); ?>" placeholder="Search student name, email, payment ref..." style="flex: 1; min-width: 240px; padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a;">
                    
                    <select name="scholarship_status" onchange="this.form.submit()" style="padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a; background: #ffffff;">
                        <option value="">All Scholarship Statuses</option>
                        <option value="HELD" <?php echo $filterScholarshipStatus === 'HELD' ? 'selected' : ''; ?>>HELD</option>
                        <option value="HOLD_PENDING" <?php echo $filterScholarshipStatus === 'HOLD_PENDING' ? 'selected' : ''; ?>>HOLD_PENDING</option>
                        <option value="EXPIRED" <?php echo $filterScholarshipStatus === 'EXPIRED' ? 'selected' : ''; ?>>EXPIRED</option>
                        <option value="CANCELLED" <?php echo $filterScholarshipStatus === 'CANCELLED' ? 'selected' : ''; ?>>CANCELLED</option>
                        <option value="CONVERTED" <?php echo $filterScholarshipStatus === 'CONVERTED' ? 'selected' : ''; ?>>CONVERTED</option>
                    </select>

                    <select name="enrollment_status" onchange="this.form.submit()" style="padding: 0.6rem 0.85rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; color: #0f172a; background: #ffffff;">
                        <option value="">All Enrollment Statuses</option>
                        <option value="NOT_ENROLLED" <?php echo $filterEnrollmentStatus === 'NOT_ENROLLED' ? 'selected' : ''; ?>>NOT_ENROLLED</option>
                        <option value="COUNSELLING_PENDING" <?php echo $filterEnrollmentStatus === 'COUNSELLING_PENDING' ? 'selected' : ''; ?>>COUNSELLING_PENDING</option>
                        <option value="ENROLLMENT_PENDING" <?php echo $filterEnrollmentStatus === 'ENROLLMENT_PENDING' ? 'selected' : ''; ?>>ENROLLMENT_PENDING</option>
                        <option value="ENROLLED" <?php echo $filterEnrollmentStatus === 'ENROLLED' ? 'selected' : ''; ?>>ENROLLED</option>
                    </select>

                    <button type="submit" style="padding: 0.6rem 1.25rem; font-weight: 700; font-size: 0.88rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                        Filter Results
                    </button>

                    <?php if (!empty($searchQuery) || !empty($filterScholarshipStatus) || !empty($filterEnrollmentStatus)): ?>
                        <a href="admin-scholarships" style="font-size: 0.85rem; color: #64748b; text-decoration: none; font-weight: 600;">Reset Filters</a>
                    <?php endif; ?>
                </form>
            </div>

            <!-- Table View -->
            <div class="table-responsive-box">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Details</th>
                            <th>Course</th>
                            <th>Original Fee</th>
                            <th>Scholarship</th>
                            <th>Pre-Book Paid</th>
                            <th>Remaining</th>
                            <th>Scholarship Status</th>
                            <th>Payment Status</th>
                            <th>Enrollment Status</th>
                            <th>Date</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($reservations)): ?>
                            <tr>
                                <td colspan="12" style="text-align: center; color: #64748b; padding: 2.5rem;">No scholarship reservations found matching your criteria.</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($reservations as $r): ?>
                                <tr>
                                    <td><strong>#<?php echo $r['id']; ?></strong></td>
                                    <td>
                                        <div style="font-weight: 700; color: #0f172a;"><?php echo htmlspecialchars($r['student_name']); ?></div>
                                        <div style="font-size: 0.78rem; color: #64748b;"><?php echo htmlspecialchars($r['student_email']); ?></div>
                                        <div style="font-size: 0.78rem; color: #94a3b8;"><?php echo htmlspecialchars($r['student_phone']); ?></div>
                                    </td>
                                    <td><strong><?php echo htmlspecialchars($r['course_title']); ?></strong></td>
                                    <td style="text-decoration: line-through; color: #94a3b8;">₹<?php echo number_format($r['original_fee']); ?></td>
                                    <td style="color: #10b981; font-weight: 700;">− ₹<?php echo number_format($r['scholarship_amount']); ?></td>
                                    <td style="color: #10b981; font-weight: 800;">₹<?php echo number_format($r['prebook_paid_amount']); ?> ✓</td>
                                    <td style="color: #f59e0b; font-weight: 800;">₹<?php echo number_format($r['remaining_amount']); ?></td>
                                    <td>
                                        <span class="badge-pill <?php echo strtolower($r['scholarship_status']) === 'held' ? 'badge-held' : (strtolower($r['scholarship_status']) === 'converted' ? 'badge-converted' : 'badge-pending'); ?>">
                                            🔒 <?php echo htmlspecialchars($r['scholarship_status']); ?>
                                        </span>
                                    </td>
                                    <td><span style="color: #10b981; font-weight: 700;"><?php echo htmlspecialchars($r['payment_status']); ?></span></td>
                                    <td>
                                        <span class="badge-pill <?php echo strtolower($r['enrollment_status']) === 'enrolled' ? 'badge-converted' : 'badge-not-enrolled'; ?>">
                                            <?php echo htmlspecialchars($r['enrollment_status']); ?>
                                        </span>
                                    </td>
                                    <td style="color: #64748b; font-size: 0.8rem;"><?php echo date('d M Y, h:i A', strtotime($r['created_at'])); ?></td>
                                    <td>
                                        <?php if (strtolower($r['enrollment_status']) !== 'enrolled'): ?>
                                            <a href="admin-convert-enrollment?reservation_id=<?php echo $r['id']; ?>" style="padding: 0.4rem 0.75rem; font-weight: 700; font-size: 0.78rem; background: linear-gradient(135deg, #10b981, #059669); color: #ffffff; border: none; border-radius: 6px; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);">
                                                <span>✓</span> Convert to Enrollment
                                            </a>
                                        <?php else: ?>
                                            <span style="color: #10b981; font-weight: 700; font-size: 0.8rem;">✓ Enrolled</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

        </main>
    </div>
</body>
</html>
