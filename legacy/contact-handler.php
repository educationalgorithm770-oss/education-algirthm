<?php
require_once __DIR__ . "/config.php";

$success = false;
$error = "";

// Callback popup posts with X-Requested-With and wants JSON back instead of
// a full HTML page, so the visitor is never navigated away.
$wantsJson = (
    (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
    || (isset($_GET['format']) && $_GET['format'] === 'json')
);

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    verify_csrf();

    // Anti-spam throttling: max 5 messages per 60 seconds per IP
    $throttle = check_action_rate_limit('contact_form', 5, 60);
    if ($throttle !== true) {
        $error = "Too many contact submissions. Please wait {$throttle} seconds before submitting again.";
    } else {
        $name    = clean_text($_POST["name"] ?? "", 80);
        $email   = validate_email_input($_POST["email"] ?? "", 191);
        $phone   = validate_phone_input($_POST["phone"] ?? "");
        $track   = clean_text($_POST["program_interest"] ?? "", 80);
        $message = clean_text($_POST["message"] ?? "", 3000);

        // --- Server-side Validation ---
        if (empty($name)) {
            $error = "Please enter your full name.";
        } elseif (mb_strlen($name) < 2) {
            $error = "Name must be at least 2 characters.";
        } elseif (!$email) {
            $error = "Please enter a valid email address (e.g. you@example.com).";
        } elseif (!$phone) {
            $error = "Please enter a valid mobile number (7\u{2013}15 digits).";
        } elseif (empty($message)) {
            $error = "Please enter your message.";
        } elseif (mb_strlen($message) < 10) {
            $error = "Message is too short. Please provide more detail (at least 10 characters).";
        } else {
            // Keep the chosen track with the enquiry so it is not lost
            $fullMessage = $message;
            if ($track !== "") {
                $fullMessage = "Track of interest: " . $track . "\n\n" . $message;
            }

            try {
                // Save contact message
                $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)");
                $stmt->execute([$name, $email, $phone, $fullMessage]);

                // Upsert into CRM — update notes if same email submits again (no duplicates)
                $notes = "Contact Form Message:\n" . $fullMessage;
                $stmtCrm = $pdo->prepare("
                    INSERT INTO crm_leads (name, email, phone, source, status, notes)
                    VALUES (?, ?, ?, 'contact_form', 'new', ?)
                    ON DUPLICATE KEY UPDATE
                        name   = VALUES(name),
                        phone  = VALUES(phone),
                        notes  = CONCAT(IFNULL(notes,''), '\n\n--- New Message ---\n', VALUES(notes)),
                        status = IF(status = 'lost', 'new', status)
                ");
                $stmtCrm->execute([$name, $email, $phone, $notes]);

                $success = true;
            } catch (Throwable $e) {
                error_log("Contact submission error: " . $e->getMessage());
                // Fallback attempt without CRM if CRM fails
                try {
                    $stmt = $pdo->prepare("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)");
                    $stmt->execute([$name, $email, "Phone: " . $phone . "\n\n" . $fullMessage]);
                    $success = true;
                } catch (Throwable $e2) {
                    $error = "Unable to process message at this time. Please try again later.";
                }
            }
        }
    }
}

if ($wantsJson) {
    header('Content-Type: application/json');
    echo json_encode($success ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    exit;
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
    <title>Message Received — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css">
    <style>
        body {
            background-color: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
        }
        .msg-box {
            max-width: 480px;
            width: 100%;
            background: var(--bg-surface);
            border: 1px solid var(--border);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            padding: 3rem 2rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="msg-box">
        <?php if ($success): ?>
            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--success-light); color: var(--success-text); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 2rem;">
                ✓
            </div>
            <h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">Message Delivered</h1>
            <p style="color: var(--text-secondary); margin-bottom: 1.75rem;">
                Thank you for getting in touch! An admissions advisor will reply to <strong><?php echo e($email); ?></strong> within 24 hours.
            </p>
        <?php else: ?>
            <div style="width: 72px; height: 72px; border-radius: 50%; background: var(--danger-light); color: var(--danger-text); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; font-size: 2rem;">
                ✕
            </div>
            <h1 style="font-size: 1.75rem; margin-bottom: 0.5rem;">Submission Incomplete</h1>
            <p style="color: var(--text-secondary); margin-bottom: 1.75rem;"><?php echo e($error); ?></p>
        <?php endif; ?>

        <a href="./" class="btn btn-primary" style="padding: 0.75rem 1.75rem;">
            ← Return to Homepage
        </a>
    </div>
</body>
</html>
