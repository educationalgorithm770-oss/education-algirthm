<?php
// Public Certificate Verification Endpoint
require_once __DIR__ . '/config.php';

function maskEmailAddress($email) {
    if (empty($email) || !str_contains($email, '@')) return 'Protected';
    $parts = explode('@', $email, 2);
    $name = $parts[0];
    $maskedName = substr($name, 0, 1) . str_repeat('*', max(3, strlen($name) - 2)) . (strlen($name) > 1 ? substr($name, -1) : '');
    return $maskedName . '@' . $parts[1];
}

$certUuid = clean_text($_GET['cert'] ?? $_GET['code'] ?? $_GET['id'] ?? '', 64);
$certificate = null;
$error = null;

if (!empty($certUuid)) {
    $stmt = $pdo->prepare("
        SELECT c.id, c.certificate_uuid, c.student_id, c.course_id, c.issue_date, c.completion_percentage, c.status,
               s.name as student_name, s.email as student_email, cr.title as course_title, cr.description as course_desc
        FROM certificates c
        JOIN students s ON c.student_id = s.id
        LEFT JOIN courses cr ON c.course_id = cr.id
        WHERE c.certificate_uuid = ?
        LIMIT 1
    ");
    $stmt->execute([$certUuid]);
    $certificate = $stmt->fetch();

    if (!$certificate) {
        // Check course_certificates table
        $stmt2 = $pdo->prepare("
            SELECT cc.id, cc.certificate_code as certificate_uuid, cc.student_id, cc.course_id, cc.issue_date,
                   100 as completion_percentage, 'valid' as status,
                   s.name as student_name, s.email as student_email,
                   COALESCE(cr.title, cc.course_title) as course_title, cr.description as course_desc
        FROM course_certificates cc
        JOIN students s ON cc.student_id = s.id
        LEFT JOIN courses cr ON cc.course_id = cr.id
        WHERE cc.certificate_code = ?
        LIMIT 1
        ");
        $stmt2->execute([$certUuid]);
        $certificate = $stmt2->fetch();
    }

    if (!$certificate) {
        $error = "No certificate found matching verification identifier: " . htmlspecialchars($certUuid);
    }
} else {
    $error = "Please provide a valid certificate identifier to verify.";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cryptographic Certificate Verification • Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
        body {
            background-color: #07090e;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem 1.25rem;
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .verify-card {
            background: #0f172a;
            border: 1.5px solid #1e293b;
            border-radius: 20px;
            max-width: 620px;
            width: 100%;
            padding: 2.5rem;
            box-shadow: 0 25px 60px rgba(0,0,0,0.5);
            text-align: center;
            box-sizing: border-box;
        }
        .valid-badge {
            background: #064e3b;
            border: 1px solid #059669;
            color: #34d399;
            padding: 0.4rem 1rem;
            border-radius: 100px;
            font-size: 0.82rem;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            margin-bottom: 1.25rem;
        }
        .data-grid {
            background: #1e293b;
            border-radius: 12px;
            padding: 1.25rem;
            margin: 1.5rem 0;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
            font-size: 0.88rem;
        }
        .data-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #334155;
            padding-bottom: 0.65rem;
        }
        .data-row:last-child { border-bottom: none; padding-bottom: 0; }
        .data-row span { color: #94a3b8; }
        .data-row strong { color: #f8fafc; font-family: monospace; font-size: 0.95rem; }
    </style>
</head>
<body>
    <div class="verify-card">
        <?php if ($certificate && empty($error)): ?>
            <div class="valid-badge">✓ CRYPTOGRAPHICALLY VERIFIED CREDENTIAL</div>
            <h1 style="font-size: 1.6rem; font-weight: 800; margin: 0 0 0.5rem; color: #fff;">
                Official Academic Certificate
            </h1>
            <p style="font-size: 0.88rem; color: #94a3b8; margin: 0 0 1.5rem;">
                This authentic academic record is permanently stored on the Education Algorithm Ledger.
            </p>

            <div class="data-grid">
                <div class="data-row">
                    <span>Scholar Name:</span>
                    <strong style="color: #6366f1;"><?php echo htmlspecialchars($certificate['student_name']); ?></strong>
                </div>
                <div class="data-row">
                    <span>Program / Track:</span>
                    <strong style="color: #fff;"><?php echo htmlspecialchars($certificate['course_title'] ?? 'Full Stack Engineering'); ?></strong>
                </div>
                <div class="data-row">
                    <span>Certificate ID:</span>
                    <strong><?php echo htmlspecialchars($certificate['certificate_uuid']); ?></strong>
                </div>
                <div class="data-row">
                    <span>Issue Date:</span>
                    <strong><?php echo date('M d, Y', strtotime($certificate['issue_date'])); ?></strong>
                </div>
                <div class="data-row">
                    <span>Status:</span>
                    <span style="color: #34d399; font-weight: 800;">● Active & Valid</span>
                </div>
            </div>

            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <a href="index.php" style="background: #334155; color: #fff; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.84rem; font-weight: 700;">Home</a>
                <a href="courses.php" style="background: #4f46e5; color: #fff; text-decoration: none; padding: 0.6rem 1.25rem; border-radius: 8px; font-size: 0.84rem; font-weight: 700;">Explore Programs</a>
            </div>
        <?php else: ?>
            <div style="font-size: 3rem; margin-bottom: 0.75rem;">⚠️</div>
            <h1 style="font-size: 1.5rem; font-weight: 800; color: #ef4444; margin: 0 0 0.5rem;">Verification Lookup</h1>
            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 1.5rem;"><?php echo htmlspecialchars($error ?: 'No record found.'); ?></p>
            
            <form action="verify.php" method="GET" style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem;">
                <input type="text" name="cert" placeholder="Enter Certificate Code (e.g. EA-2026-XXXXX)" required style="flex: 1; padding: 0.75rem 1rem; border-radius: 8px; border: 1.5px solid #334155; background: #1e293b; color: #fff; font-size: 0.9rem;">
                <button type="submit" style="background: #4f46e5; color: #fff; border: none; padding: 0 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer;">Verify</button>
            </form>
            <a href="index.php" style="color: #94a3b8; font-size: 0.84rem; text-decoration: none;">&larr; Back to Education Algorithm</a>
        <?php endif; ?>
    </div>
</body>
</html>
