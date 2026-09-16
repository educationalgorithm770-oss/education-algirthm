<?php
// admin-inquiries-live.php — Live Inquiries Viewer with Phone & WhatsApp
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$adminId = requireAdmin();

// Fetch contact inquiries
$stmt = $pdo->prepare("SELECT id, name, email, phone, message, created_at FROM contact_messages ORDER BY id DESC LIMIT 100");
$stmt->execute();
$messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Live Admissions & Contact Inquiries • Education Algorithm</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; padding: 2rem 1rem; }
        .container { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.07); }
        h2 { font-size: 1.35rem; font-weight: 800; color: #4f46e5; margin-bottom: 1.25rem; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
        th { background: #f1f5f9; padding: 0.75rem 1rem; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #475569; }
        td { padding: 0.85rem 1rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .btn-wa { background: #10b981; color: #fff; font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem; border-radius: 6px; text-decoration: none; display: inline-block; margin-right: 0.25rem; }
        .btn-call { background: #e0e7ff; color: #4338ca; font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem; border-radius: 6px; text-decoration: none; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <h2>Admissions & Contact Inquiries (<?php echo count($messages); ?>)</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Prospect Name & Email</th>
                    <th>Mobile Phone</th>
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
                    <td><strong>#<?php echo (int)$m['id']; ?></strong></td>
                    <td>
                        <strong><?php echo htmlspecialchars($m['name']); ?></strong><br>
                        <a href="mailto:<?php echo htmlspecialchars($m['email']); ?>" style="color:#4f46e5; text-decoration:none; font-size:0.82rem;">
                            <?php echo htmlspecialchars($m['email']); ?>
                        </a>
                    </td>
                    <td style="color:#059669; font-weight:700;">
                        <?php echo htmlspecialchars($m['phone'] ?: 'N/A'); ?>
                    </td>
                    <td style="white-space: pre-wrap; font-size: 0.85rem; color:#334155;">
                        <?php echo htmlspecialchars($m['message']); ?>
                    </td>
                    <td style="font-size:0.8rem; color:#64748b; white-space:nowrap;">
                        <?php echo date('M d, Y h:i A', strtotime($m['created_at'])); ?>
                    </td>
                    <td>
                        <?php if (!empty($m['phone'])): ?>
                            <a href="https://wa.me/<?php echo $waPhone; ?>" target="_blank" class="btn-wa">💬 WhatsApp</a>
                            <a href="tel:<?php echo htmlspecialchars($m['phone']); ?>" class="btn-call">📞 Call</a>
                        <?php else: ?>
                            <span style="color:#94a3b8; font-size:0.75rem;">No Phone</span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
