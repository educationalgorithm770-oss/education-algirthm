<?php
$adminActive = 'instructors';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/mail.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// 1. ADD / PROVISION NEW FACULTY MEMBER
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_instructor"])) {
    verify_csrf();
    $name     = clean_text($_POST["name"] ?? "", 100);
    $email    = strtolower(trim($_POST["email"] ?? ""));
    $password = trim($_POST["password"] ?? "");
    $title    = clean_text($_POST["title"] ?? "", 150);
    $selectedCourses = $_POST["courses"] ?? [];

    if ($email && $password) {
        if (empty($name)) {
            $name = explode('@', $email)[0];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Please provide a valid email address.";
        } else {
            $stmt = $pdo->prepare("SELECT id FROM instructors WHERE LOWER(email) = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $error = "A faculty member with this email ({$email}) already exists.";
            } else {
                $hash = password_hash($password, PASSWORD_DEFAULT);
                $verifyToken = bin2hex(random_bytes(32));

                $stmt = $pdo->prepare("INSERT INTO instructors (name, username, email, password, title, status, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, 'active', 0, ?)");
                $stmt->execute([$name, $email, $email, $hash, $title, $verifyToken]);
                $instId = (int)$pdo->lastInsertId();

                // Assign Track Isolation
                if (!empty($selectedCourses) && is_array($selectedCourses)) {
                    $stmtMap = $pdo->prepare("INSERT IGNORE INTO course_instructors (course_id, instructor_id) VALUES (?, ?)");
                    foreach ($selectedCourses as $cId) {
                        $stmtMap->execute([(int)$cId, $instId]);
                    }
                }

                // Send Verification & Welcome Email
                $baseUrl = rtrim(defined('APP_URL') ? APP_URL : 'https://educationalgorithm.com', '/');
                $verifyUrl = $baseUrl . '/instructor-verify.php?token=' . $verifyToken;

                $emailSubject = "🎓 Official Faculty Appointment & Portal Activation — Education Algorithm";
                $emailHtml = "
                    <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f4f5f8; padding: 24px 12px;'>
                        <div style='background: #ffffff; color: #1e293b; padding: 36px 28px; border-radius: 24px; max-width: 540px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;'>
                            
                            <!-- Header Emblem -->
                            <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin-bottom: 20px; text-align: center;'>
                                <tr>
                                    <td align='center'>
                                        <table role='presentation' border='0' cellpadding='0' cellspacing='0' style='margin: 0 auto;'>
                                            <tr>
                                                <td align='center' valign='middle' style='width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #818cf8 100%); text-align: center; font-size: 32px; line-height: 64px; color: #ffffff;'>
                                                    👨‍🏫
                                                </td>
                                            </tr>
                                        </table>
                                        <h1 style='color: #0f172a; margin: 14px 0 4px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;'>Education Algorithm</h1>
                                        <p style='color: #6366f1; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin: 0;'>
                                            FACULTY APPOINTMENT & PORTAL PROVISIONING
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Greeting -->
                            <div style='margin-bottom: 20px; text-align: center;'>
                                <h2 style='font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 8px;'>
                                    Welcome, " . htmlspecialchars($name) . "!
                                </h2>
                                <p style='font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;'>
                                    You have been officially appointed as <strong style='color: #4f46e5;'>" . htmlspecialchars($title ?: 'Faculty Member') . "</strong> at Education Algorithm. Your dedicated instructor portal has been provisioned.
                                </p>
                            </div>

                            <!-- Credentials Box -->
                            <div style='background: #f8fafc; border: 2px dashed #818cf8; border-radius: 16px; padding: 20px 22px; margin: 24px 0;'>
                                <div style='font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin-bottom: 14px;'>
                                    🛡️ OFFICIAL FACULTY ACCESS CREDENTIALS
                                </div>
                                <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%'>
                                    <tr>
                                        <td style='padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b;'>
                                            <strong>👤 User ID / Email:</strong>
                                        </td>
                                        <td style='padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right;'>
                                            <span style='color: #0f172a; font-weight: 700; font-family: Consolas, monospace; background: #e2e8f0; padding: 6px 14px; border-radius: 8px; font-size: 13px; display: inline-block;'>
                                                " . htmlspecialchars($email) . "
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style='padding: 12px 0 0 0; font-size: 14px; color: #64748b;'>
                                            <strong>🔑 Initial Password:</strong>
                                        </td>
                                        <td style='padding: 12px 0 0 0; font-size: 14px; text-align: right;'>
                                            <span style='color: #0284c7; font-weight: 800; font-family: Consolas, monospace; background: #e0f2fe; padding: 6px 14px; border-radius: 8px; font-size: 13px; display: inline-block;'>
                                                " . htmlspecialchars($password) . "
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- CTA Button (iOS & Android Bulletproof) -->
                            <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin: 28px 0 22px; text-align: center;'>
                                <tr>
                                    <td align='center'>
                                        <table role='presentation' border='0' cellpadding='0' cellspacing='0' style='margin: 0 auto;'>
                                            <tr>
                                                <td align='center' bgcolor='#818cf8' style='border-radius: 14px; background-color: #818cf8; text-align: center;'>
                                                    <a href='{$verifyUrl}' style='font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-weight: 700; color: #ffffff; text-decoration: none; display: block; padding: 18px 36px; border-radius: 14px; background-color: #818cf8; -webkit-text-size-adjust: 100%; letter-spacing: 0.01em;'>
                                                        ⚡ Verify & Activate Faculty Account ➔
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Fallback and Security Footer -->
                            <div style='margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; text-align: center;'>
                                <p style='color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0 0 12px;'>
                                    If the button above does not open, copy and paste this link into your browser:<br>
                                    <a href='{$verifyUrl}' style='color: #6366f1; word-break: break-all; text-decoration: underline; -webkit-text-size-adjust: 100%; display: inline-block; padding: 4px 0;'>{$verifyUrl}</a>
                                </p>
                                <p style='color: #cbd5e1; font-size: 11px; margin: 0;'>
                                    🔒 Secure One-Time Token • Education Algorithm • Master Scalable Software Engineering
                                </p>
                            </div>
                        </div>
                    </div>
                ";

                send_system_email($email, $name, $emailSubject, $emailHtml);

                $message = "✅ Faculty member provisioned! Official verification email dispatched to <strong>" . htmlspecialchars($email) . "</strong>.";
            }
        }
    } else {
        $error = "Email Address and Initial Password are required.";
    }
}

// 2. RESEND VERIFICATION EMAIL
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["resend_verification"])) {
    verify_csrf();
    $targetInstId = (int)$_POST["instructor_id"];
    $stmt = $pdo->prepare("SELECT * FROM instructors WHERE id = ?");
    $stmt->execute([$targetInstId]);
    $inst = $stmt->fetch();

    if ($inst && empty($inst['is_verified'])) {
        $verifyToken = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE instructors SET verification_token = ? WHERE id = ?")->execute([$verifyToken, $targetInstId]);

        $baseUrl = rtrim(defined('APP_URL') ? APP_URL : 'https://educationalgorithm.com', '/');
        $verifyUrl = $baseUrl . '/instructor-verify.php?token=' . $verifyToken;

        $emailSubject = "Action Required: Verify Your Faculty Account — Education Algorithm";
        $emailHtml = "
            <div style='font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f4f5f8; padding: 24px 12px;'>
                <div style='background: #ffffff; color: #1e293b; padding: 36px 28px; border-radius: 24px; max-width: 540px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;'>
                    
                    <!-- Header Emblem -->
                    <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin-bottom: 20px; text-align: center;'>
                        <tr>
                            <td align='center'>
                                <table role='presentation' border='0' cellpadding='0' cellspacing='0' style='margin: 0 auto;'>
                                    <tr>
                                        <td align='center' valign='middle' style='width: 64px; height: 64px; border-radius: 20px; background: linear-gradient(135deg, #a855f7 0%, #d946ef 50%, #818cf8 100%); text-align: center; font-size: 32px; line-height: 64px; color: #ffffff;'>
                                            👨‍🏫
                                        </td>
                                    </tr>
                                </table>
                                <h1 style='color: #0f172a; margin: 14px 0 4px; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;'>Education Algorithm</h1>
                                <p style='color: #6366f1; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; margin: 0;'>
                                    FACULTY APPOINTMENT & PORTAL PROVISIONING
                                </p>
                            </td>
                        </tr>
                    </table>

                    <!-- Greeting -->
                    <div style='margin-bottom: 20px; text-align: center;'>
                        <h2 style='font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 8px;'>
                            Welcome, " . htmlspecialchars($inst['name']) . "!
                        </h2>
                        <p style='font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;'>
                            You have been officially appointed as <strong style='color: #4f46e5;'>" . htmlspecialchars($inst['title'] ?: 'Faculty Member') . "</strong> at Education Algorithm. Your dedicated instructor portal has been provisioned.
                        </p>
                    </div>

                    <!-- Credentials Box -->
                    <div style='background: #f8fafc; border: 2px dashed #818cf8; border-radius: 16px; padding: 20px 22px; margin: 24px 0;'>
                        <div style='font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin-bottom: 14px;'>
                            🛡️ OFFICIAL FACULTY ACCESS CREDENTIALS
                        </div>
                        <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%'>
                            <tr>
                                <td style='padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b;'>
                                    <strong>👤 User ID / Email:</strong>
                                </td>
                                <td style='padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; text-align: right;'>
                                    <span style='color: #0f172a; font-weight: 700; font-family: Consolas, monospace; background: #e2e8f0; padding: 6px 14px; border-radius: 8px; font-size: 13px; display: inline-block;'>
                                        " . htmlspecialchars($inst['email']) . "
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <td style='padding: 12px 0 0 0; font-size: 14px; color: #64748b;'>
                                    <strong>🔑 Initial Password:</strong>
                                </td>
                                <td style='padding: 12px 0 0 0; font-size: 14px; text-align: right;'>
                                    <span style='color: #0284c7; font-weight: 800; font-family: Consolas, monospace; background: #e0f2fe; padding: 6px 14px; border-radius: 8px; font-size: 13px; display: inline-block;'>
                                        AlgoFaculty@2026
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- CTA Button (iOS & Android Bulletproof) -->
                    <table role='presentation' border='0' cellpadding='0' cellspacing='0' width='100%' style='margin: 28px 0 22px; text-align: center;'>
                        <tr>
                            <td align='center'>
                                <table role='presentation' border='0' cellpadding='0' cellspacing='0' style='margin: 0 auto;'>
                                    <tr>
                                        <td align='center' bgcolor='#818cf8' style='border-radius: 14px; background-color: #818cf8; text-align: center;'>
                                            <a href='{$verifyUrl}' style='font-size: 16px; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-weight: 700; color: #ffffff; text-decoration: none; display: block; padding: 18px 36px; border-radius: 14px; background-color: #818cf8; -webkit-text-size-adjust: 100%; letter-spacing: 0.01em;'>
                                                ⚡ Verify & Activate Faculty Account ➔
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>

                    <!-- Fallback and Security Footer -->
                    <div style='margin-top: 24px; padding-top: 18px; border-top: 1px solid #f1f5f9; text-align: center;'>
                        <p style='color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0 0 12px;'>
                            If the button above does not open, copy and paste this link into your browser:<br>
                            <a href='{$verifyUrl}' style='color: #6366f1; word-break: break-all; text-decoration: underline; -webkit-text-size-adjust: 100%; display: inline-block; padding: 4px 0;'>{$verifyUrl}</a>
                        </p>
                        <p style='color: #cbd5e1; font-size: 11px; margin: 0;'>
                            🔒 Secure One-Time Token • Education Algorithm • Master Scalable Software Engineering
                        </p>
                    </div>
                </div>
            </div>
        ";
        send_system_email($inst['email'], $inst['name'], $emailSubject, $emailHtml);
        $message = "Verification email resent to <strong>" . htmlspecialchars($inst['email']) . "</strong>.";
    }
}

// 3. MANUAL 1-CLICK INSTANT VERIFICATION
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["manual_verify"])) {
    verify_csrf();
    $targetInstId = (int)$_POST["instructor_id"];
    $stmt = $pdo->prepare("UPDATE instructors SET is_verified = 1, status = 'active', verified_at = NOW(), verification_token = NULL WHERE id = ?");
    $stmt->execute([$targetInstId]);
    $message = "⚡ Faculty account verified and activated successfully!";
}

// 4. TOGGLE ACCOUNT STATUS (ACTIVE / INACTIVE)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["toggle_status"])) {
    verify_csrf();
    $targetInstId = (int)$_POST["instructor_id"];
    $currentStatus = $_POST["current_status"] ?? 'active';
    $newStatus = ($currentStatus === 'active') ? 'inactive' : 'active';
    
    $stmt = $pdo->prepare("UPDATE instructors SET status = ? WHERE id = ?");
    $stmt->execute([$newStatus, $targetInstId]);
    $message = "Faculty account status changed to <strong>" . strtoupper($newStatus) . "</strong>.";
}

// 5. PERMANENT ACCOUNT DELETION
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_instructor"])) {
    verify_csrf();
    $targetInstId = (int)$_POST["instructor_id"];
    
    // Revoke course access links first
    $pdo->prepare("DELETE FROM course_instructors WHERE instructor_id = ?")->execute([$targetInstId]);
    // Delete instructor record
    $pdo->prepare("DELETE FROM instructors WHERE id = ?")->execute([$targetInstId]);
    $message = "🗑️ Faculty account and track isolation permissions permanently deleted.";
}

// Fetch Courses & Instructors
$courses = $pdo->query("SELECT id, title FROM courses ORDER BY id ASC")->fetchAll();

$instructors = $pdo->query("
    SELECT i.*, 
           GROUP_CONCAT(c.title SEPARATOR '||') as course_titles,
           GROUP_CONCAT(c.id SEPARATOR ',') as course_ids
    FROM instructors i
    LEFT JOIN course_instructors ci ON i.id = ci.instructor_id
    LEFT JOIN courses c ON ci.course_id = c.id
    GROUP BY i.id
    ORDER BY i.id DESC
")->fetchAll();
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
    <title>Faculty Management & Track Isolation — Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: #07090e !important; color: #ffffff !important; min-height: 100vh; }
        .app-container { max-width: 1550px; margin: 0 auto; padding: 1.5rem 1.5rem 3.5rem; }
        .inst-card { background: #0f141f !important; border: 1px solid #1e293b !important; border-radius: 18px; padding: 1.75rem; margin-bottom: 2rem; color: #ffffff; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .course-chip-select { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: #07090e; border: 1.5px solid #334155; padding: 1rem; border-radius: 12px; margin-top: 0.5rem; }
        .chip-option { display: flex; align-items: center; gap: 0.6rem; font-size: 0.85rem; color: #cbd5e1; cursor: pointer; }
        input[type="text"], input[type="email"], input[type="password"], select {
            width: 100%;
            padding: 0.8rem 1rem;
            background: #07090e !important;
            border: 1.5px solid #334155 !important;
            border-radius: 10px;
            color: #ffffff !important;
            font-size: 0.9rem;
            outline: none;
        }
        /* Chrome & Safari Autofill White Box Override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #07090e inset !important;
            -webkit-text-fill-color: #ffffff !important;
            caret-color: #ffffff !important;
            transition: background-color 5000s ease-in-out 0s;
        }
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
        
        /* Table Styling - 100% Crisp Alignment & Dark Lock */
        .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; border: 1px solid #1e293b; }
        .table-custom { width: 100%; min-width: 1050px; border-collapse: collapse; text-align: left; }
        .table-custom th { 
            background: #111827 !important; 
            color: #94a3b8 !important; 
            font-size: 0.76rem; 
            font-weight: 800; 
            text-transform: uppercase; 
            letter-spacing: 0.05em; 
            padding: 1rem 1.15rem; 
            border-bottom: 2px solid #1e293b;
            white-space: nowrap;
        }
        .table-custom td { 
            padding: 1rem 1.15rem; 
            border-bottom: 1px solid #1e293b !important; 
            color: #f8fafc; 
            font-size: 0.88rem; 
            vertical-align: middle; 
        }
        .table-custom tr:hover td { background: rgba(30, 41, 59, 0.3) !important; }

        /* Badge & Button Utilities */
        .badge-verified {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 0.3rem 0.75rem;
            border-radius: 100px;
            border: 1px solid rgba(16, 185, 129, 0.3);
            white-space: nowrap;
        }
        .badge-pending {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            font-size: 0.74rem;
            font-weight: 800;
            padding: 0.3rem 0.65rem;
            border-radius: 6px;
            border: 1px solid rgba(245, 158, 11, 0.3);
            white-space: nowrap;
        }
        .badge-status {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            font-size: 0.75rem;
            font-weight: 800;
            padding: 0.3rem 0.75rem;
            border-radius: 100px;
            white-space: nowrap;
        }
        .status-active {
            background: rgba(16, 185, 129, 0.12);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-inactive {
            background: rgba(239, 68, 68, 0.12);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
        }
        .dot-green { background: #10b981; box-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }
        .dot-red { background: #ef4444; box-shadow: 0 0 6px rgba(239, 68, 68, 0.6); }

        .btn-table-action {
            height: 30px;
            padding: 0 0.65rem;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.3rem;
            white-space: nowrap;
            text-decoration: none;
            transition: all 0.15s ease;
        }
        .btn-resend {
            background: #1e293b;
            border: 1px solid #334155;
            color: #94a3b8;
        }
        .btn-resend:hover {
            background: #334155;
            color: #fff;
        }
        .btn-verify-now {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: #34d399;
        }
        .btn-verify-now:hover {
            background: #10b981;
            color: #fff;
        }
        .btn-suspend {
            background: rgba(245, 158, 11, 0.12);
            border: 1px solid rgba(245, 158, 11, 0.35);
            color: #fbbf24;
        }
        .btn-suspend:hover {
            background: #f59e0b;
            color: #000;
        }
        .btn-activate {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.4);
            color: #34d399;
        }
        .btn-activate:hover {
            background: #10b981;
            color: #fff;
        }
        .btn-delete {
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid rgba(239, 68, 68, 0.35);
            color: #f87171;
        }
        .btn-delete:hover {
            background: #ef4444;
            color: #fff;
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.85rem; font-weight: 800; color: #fff; margin-bottom: 0.35rem;">👨‍🏫 Faculty Provisioning & Track Isolation</h1>
                <p style="color: #94a3b8; font-size: 0.95rem;">Empower instructors with Zero-Trust Row-Level Access to their designated curriculum tracks only.</p>
            </div>
        </div>

        <?php if (!empty($message)): ?>
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #34d399; padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                <?= $message ?>
            </div>
        <?php endif; ?>

        <?php if (!empty($error)): ?>
            <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid #f43f5e; color: #fb7185; padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600;">
                <?= $error ?>
            </div>
        <?php endif; ?>

        <!-- 1. APPOINT NEW FACULTY MEMBER -->
        <div class="inst-card">
            <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 1.25rem; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
                <span>➕</span> Provision New Faculty Member
            </h3>
            
            <form method="POST" action="admin-instructors.php">
                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                <input type="hidden" name="add_instructor" value="1">

                <div class="form-grid" style="margin-bottom: 1.25rem;">
                    <div>
                        <label style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Faculty Full Name</label>
                        <input type="text" name="name" placeholder="e.g. Dr. Harish Chandra" required>
                    </div>
                    <div>
                        <label style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Email Address (Login ID)</label>
                        <input type="email" name="email" placeholder="faculty@educationalgorithm.com" required>
                    </div>
                </div>

                <div class="form-grid" style="margin-bottom: 1.25rem;">
                    <div>
                        <label style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Designation / Title</label>
                        <input type="text" name="title" placeholder="e.g. Lead Java & Cloud Architect" required>
                    </div>
                    <div>
                        <label style="font-size: 0.82rem; font-weight: 700; color: #cbd5e1; display: block; margin-bottom: 0.35rem;">Initial Temporary Password</label>
                        <input type="text" name="password" value="AlgoFaculty@2026" required>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="font-size: 0.82rem; font-weight: 700; color: #818cf8; display: block; margin-bottom: 0.35rem;">🎯 Assign Track Isolation (Instructor will ONLY have access to checked courses):</label>
                    <div class="course-chip-select">
                        <?php foreach ($courses as $c): ?>
                            <label class="chip-option">
                                <input type="checkbox" name="courses[]" value="<?= $c['id'] ?>" style="width: 18px; height: 18px; accent-color: #6366f1;">
                                <span>#<?= $c['id'] ?>: <?= htmlspecialchars($c['title']) ?></span>
                            </label>
                        <?php endforeach; ?>
                    </div>
                </div>

                <button type="submit" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; border: none; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.95rem; cursor: pointer;">
                    ✉️ Create & Dispatch Verification Email ➔
                </button>
            </form>
        </div>

                <!-- 2. DIRECTORY ROSTER -->
        <div class="inst-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: #ffffff; margin: 0;">Authorized Faculty Roster (<?= count($instructors) ?> Members)</h3>
            </div>
            
            <div class="table-responsive">
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th style="width: 22%;">Faculty Member</th>
                            <th style="width: 18%;">Designation</th>
                            <th style="width: 24%;">Assigned Tracks</th>
                            <th style="width: 18%; text-align: center;">Verification</th>
                            <th style="width: 8%; text-align: center;">Status</th>
                            <th style="width: 10%; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($instructors as $inst): ?>
                            <?php 
                                $displayName = !empty($inst['name']) ? $inst['name'] : (!empty($inst['email']) ? explode('@', $inst['email'])[0] : 'Faculty Member'); 
                                $isActive = ($inst['status'] === 'active');
                            ?>
                            <tr>
                                <td>
                                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                                        <div style="width: 38px; height: 38px; border-radius: 10px; background: #1e293b; border: 1px solid #334155; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #818cf8; font-size: 0.9rem; flex-shrink: 0;">
                                            <?= strtoupper(substr($displayName, 0, 1)) ?>
                                        </div>
                                        <div style="min-width: 0;">
                                            <strong style="color: #fff; font-size: 0.92rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><?= htmlspecialchars($displayName) ?></strong>
                                            <span style="font-size: 0.75rem; color: #94a3b8; font-family: monospace; display: block; white-space: nowrap;"><?= htmlspecialchars($inst['email'] ?: 'No email') ?></span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style="color: #cbd5e1; font-size: 0.85rem; font-weight: 500;"><?= htmlspecialchars($inst['title'] ?: 'Faculty Member') ?></span>
                                </td>
                                <td>
                                    <?php if (empty($inst['course_titles'])): ?>
                                        <span style="color: #f43f5e; font-size: 0.75rem; font-weight: 700;">⚠️ No Tracks</span>
                                    <?php else: ?>
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.35rem;">
                                            <?php foreach (explode('||', $inst['course_titles']) as $t): ?>
                                                <span style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #c7d2fe; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; white-space: nowrap;">
                                                    🎯 <?= htmlspecialchars($t) ?>
                                                </span>
                                            <?php endforeach; ?>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align: center;">
                                    <?php if (!empty($inst['is_verified'])): ?>
                                        <span class="badge-verified">
                                            ✓ Verified
                                        </span>
                                    <?php else: ?>
                                        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; white-space: nowrap;">
                                            <span class="badge-pending">
                                                Pending
                                            </span>
                                            
                                            <!-- Resend Email -->
                                            <form method="POST" action="admin-instructors.php" style="display: inline; margin: 0;">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="resend_verification" value="1">
                                                <input type="hidden" name="instructor_id" value="<?= $inst['id'] ?>">
                                                <button type="submit" class="btn-table-action btn-resend" title="Resend invitation email">
                                                    Resend
                                                </button>
                                            </form>

                                            <!-- 1-Click Manual Verify -->
                                            <form method="POST" action="admin-instructors.php" style="display: inline; margin: 0;" onsubmit="return confirm('Manually verify and activate <?= htmlspecialchars($displayName) ?> immediately?')">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="manual_verify" value="1">
                                                <input type="hidden" name="instructor_id" value="<?= $inst['id'] ?>">
                                                <button type="submit" class="btn-table-action btn-verify-now" title="Manually verify on the spot">
                                                    ⚡ Verify
                                                </button>
                                            </form>
                                        </div>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align: center;">
                                    <?php if ($isActive): ?>
                                        <span class="badge-status status-active">
                                            <span class="status-dot dot-green"></span> Active
                                        </span>
                                    <?php else: ?>
                                        <span class="badge-status status-inactive">
                                            <span class="status-dot dot-red"></span> Inactive
                                        </span>
                                    <?php endif; ?>
                                </td>
                                <td style="text-align: right;">
                                    <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 0.4rem; white-space: nowrap;">
                                        <!-- Toggle Status (Activate / Suspend) -->
                                        <form method="POST" action="admin-instructors.php" style="display: inline; margin: 0;">
                                            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                            <input type="hidden" name="toggle_status" value="1">
                                            <input type="hidden" name="instructor_id" value="<?= $inst['id'] ?>">
                                            <input type="hidden" name="current_status" value="<?= $inst['status'] ?>">
                                            <?php if ($isActive): ?>
                                                <button type="submit" class="btn-table-action btn-suspend" title="Suspend portal access">
                                                    ⏸️ Suspend
                                                </button>
                                            <?php else: ?>
                                                <button type="submit" class="btn-table-action btn-activate" title="Reactivate portal access">
                                                    🟢 Activate
                                                </button>
                                            <?php endif; ?>
                                        </form>

                                        <!-- Delete Faculty Account -->
                                        <form method="POST" action="admin-instructors.php" style="display: inline; margin: 0;" onsubmit="return confirm('⚠️ WARNING: Permanently delete <?= htmlspecialchars($displayName) ?>? This will revoke all course permissions and cannot be undone.')">
                                            <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                            <input type="hidden" name="delete_instructor" value="1">
                                            <input type="hidden" name="instructor_id" value="<?= $inst['id'] ?>">
                                            <button type="submit" class="btn-table-action btn-delete" title="Permanently delete faculty account">
                                                🗑️ Delete
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</body>
</html>
