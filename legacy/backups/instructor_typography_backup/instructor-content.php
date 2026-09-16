<?php
$facultyActive = 'content';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/instructor-auth.php';
require_instructor_auth();

$instId = (int)$_SESSION['instructor_id'];
$profile = get_instructor_profile($instId);
$assignedCourses = get_instructor_assigned_courses($instId);
$courseIds = array_map(function($c) { return (int)$c['id']; }, $assignedCourses);
$courseInSql = !empty($courseIds) ? implode(',', $courseIds) : '0';

$message = "";
$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    verify_csrf();

    // 1. ADD MODULE
    if (isset($_POST["add_module"])) {
        $courseId = (int)($_POST["course_id"] ?? 0);
        enforce_instructor_course_scope($instId, $courseId);

        $title = clean_text($_POST["module_title"] ?? "", 150);
        $desc  = clean_text($_POST["module_desc"] ?? "", 1000);
        $order = (int)($_POST["module_order"] ?? 0);

        if ($title && $courseId > 0) {
            $stmt = $pdo->prepare("INSERT INTO modules (course_id, title, description, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->execute([$courseId, $title, $desc, $order]);
            log_instructor_audit($instId, 'MODULE_CREATED', $courseId, "Created module: {$title}");
            $message = "Module/Chapter created successfully.";
        } else {
            $error = "Valid module title is required.";
        }
    }

    // 2. ADD VIDEO (BUNNY CDN OR LOCAL)
    
    // 2A. DIRECT FILE UPLOAD TO BUNNY.NET STREAM CDN
    if (isset($_POST["upload_direct_bunny"])) {
        $moduleId = (int)($_POST["video_module_id"] ?? 0);
        $stmtC = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
        $stmtC->execute([$moduleId]);
        $targetCourseId = (int)$stmtC->fetchColumn();
        enforce_instructor_course_scope($instId, $targetCourseId);

        $title = clean_text($_POST["video_title"] ?? "", 150);
        $order = (int)($_POST["video_order"] ?? 0);
        $duration = clean_text($_POST["video_duration"] ?? "", 20);

        if ($title && $moduleId > 0 && isset($_FILES["bunny_file"]) && $_FILES["bunny_file"]["error"] === UPLOAD_ERR_OK) {
            $libraryId = env('BUNNY_LIBRARY_ID', '733405');
            $apiKey    = env('BUNNY_API_KEY', 'e35d749e-e7ee-4ec5-874a6878ea64-fcd0-45f9');
            $streamHost = env('BUNNY_STREAM_HOST', 'video.bunnycdn.com');

            // Step 1: Create Video Entry on Bunny.net
            $createUrl = "https://{$streamHost}/library/{$libraryId}/videos";
            $ch = curl_init($createUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['title' => $title]));
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "AccessKey: {$apiKey}",
                "Content-Type: application/json",
                "Accept: application/json"
            ]);
            $res = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            $videoObj = json_decode($res, true);
            if ($code === 200 && !empty($videoObj['guid'])) {
                $guid = $videoObj['guid'];

                // Step 2: Upload Video File Stream to Bunny.net
                $uploadUrl = "https://{$streamHost}/library/{$libraryId}/videos/{$guid}";
                $filePath = $_FILES["bunny_file"]["tmp_name"];
                $fileHandle = fopen($filePath, 'r');
                $fileSize = filesize($filePath);

                $chUpload = curl_init($uploadUrl);
                curl_setopt($chUpload, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($chUpload, CURLOPT_CUSTOMREQUEST, "PUT");
                curl_setopt($chUpload, CURLOPT_INFILE, $fileHandle);
                curl_setopt($chUpload, CURLOPT_INFILESIZE, $fileSize);
                curl_setopt($chUpload, CURLOPT_UPLOAD, true);
                curl_setopt($chUpload, CURLOPT_HTTPHEADER, [
                    "AccessKey: {$apiKey}",
                    "Content-Type: application/octet-stream"
                ]);
                $uploadRes = curl_exec($chUpload);
                $uploadCode = curl_getinfo($chUpload, CURLINFO_HTTP_CODE);
                fclose($fileHandle);
                curl_close($chUpload);

                if ($uploadCode === 200 || $uploadCode === 201) {
                    $stmt = $pdo->prepare("INSERT INTO videos (module_id, title, file_path, bunny_video_id, duration, sort_order, created_at) VALUES (?, ?, '', ?, ?, ?, NOW())");
                    $stmt->execute([$moduleId, $title, $guid, $duration ?: null, $order]);
                    log_instructor_audit($instId, 'VIDEO_UPLOADED_CLOUD', $targetCourseId, "Uploaded Cloud video: {$title}");
                    $message = "🎉 Video '{$title}' uploaded directly to Cloud Stream! Adaptive multi-bitrate encoding has begun.";
                } else {
                    $error = "Cloud Stream Upload Error (HTTP {$uploadCode}). Video created with GUID: {$guid}.";
                }
            } else {
                $error = "Cloud Stream Service Error: Unable to create video stream. Please check configuration.";
            }
        } else {
            $error = "Please select a valid video file and enter a lecture title.";
        }
    }

    if (isset($_POST["add_video_bunny"])) {
        $moduleId = (int)($_POST["video_module_id"] ?? 0);
        $stmtC = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
        $stmtC->execute([$moduleId]);
        $targetCourseId = (int)$stmtC->fetchColumn();
        enforce_instructor_course_scope($instId, $targetCourseId);

        $title = clean_text($_POST["video_title"] ?? "", 150);
        $bunnyId = trim($_POST["bunny_video_id"] ?? "");
        $duration = clean_text($_POST["video_duration"] ?? "", 20);
        $order = (int)($_POST["video_order"] ?? 0);

        if ($title && $moduleId > 0 && !empty($bunnyId)) {
            $stmt = $pdo->prepare("INSERT INTO videos (module_id, title, file_path, bunny_video_id, duration, sort_order) VALUES (?, ?, '', ?, ?, ?)");
            $stmt->execute([$moduleId, $title, $bunnyId, $duration ?: null, $order]);
            log_instructor_audit($instId, 'VIDEO_PUBLISHED_CDN', $targetCourseId, "Linked video: {$title}");
            $message = "✅ Video lecture linked to High-Speed Cloud CDN successfully!";
        } else {
            $error = "Please provide video title, chapter, and Cloud Video ID.";
        }
    }

    if (isset($_POST["add_video"])) {
        $moduleId = (int)($_POST["video_module_id"] ?? 0);
        $stmtC = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
        $stmtC->execute([$moduleId]);
        $targetCourseId = (int)$stmtC->fetchColumn();
        enforce_instructor_course_scope($instId, $targetCourseId);

        $title = clean_text($_POST["video_title"] ?? "", 150);
        $order = (int)($_POST["video_order"] ?? 0);

        if ($title && $moduleId > 0 && isset($_FILES["video_file"]) && $_FILES["video_file"]["error"] === UPLOAD_ERR_OK) {
            $uploadDir = "uploads/videos/";
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $ext = strtolower(pathinfo($_FILES["video_file"]["name"], PATHINFO_EXTENSION));
            $allowed = ['mp4', 'webm', 'mov', 'mkv'];

            $mime = mime_content_type($_FILES["video_file"]["tmp_name"]) ?: '';
            $allowedMimes = ['video/mp4','video/webm','video/quicktime','video/x-matroska'];
            if (!in_array($ext, $allowed, true) || !in_array($mime, $allowedMimes, true)) {
                $error = "Invalid video file type.";
            } elseif ($_FILES["video_file"]["size"] > 100 * 1024 * 1024) {
                $error = "Video file size exceeds the 100MB limit.";
            } else {
                $safeName = "video_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
                $destination = $uploadDir . $safeName;
                if (move_uploaded_file($_FILES["video_file"]["tmp_name"], $destination)) {
                    $stmt = $pdo->prepare("INSERT INTO videos (module_id, title, file_path, sort_order) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$moduleId, $title, $destination, $order]);
                    log_instructor_audit($instId, 'VIDEO_UPLOADED_SERVER', $targetCourseId, "Uploaded video: {$title}");
                    $message = "Video lecture uploaded successfully.";
                } else {
                    $error = "Video upload failed.";
                }
            }
        }
    }

    // 3. ADD NOTE
    if (isset($_POST["add_note"])) {
        $moduleId = (int)($_POST["note_module_id"] ?? 0);
        $stmtC = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
        $stmtC->execute([$moduleId]);
        $targetCourseId = (int)$stmtC->fetchColumn();
        enforce_instructor_course_scope($instId, $targetCourseId);

        $title = clean_text($_POST["note_title"] ?? "", 150);
        $order = (int)($_POST["note_order"] ?? 0);

        if ($title && $moduleId > 0 && isset($_FILES["note_file"]) && $_FILES["note_file"]["error"] === UPLOAD_ERR_OK) {
            $uploadDir = "uploads/notes/";
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $ext = strtolower(pathinfo($_FILES["note_file"]["name"], PATHINFO_EXTENSION));
            $mime = mime_content_type($_FILES["note_file"]["tmp_name"]) ?: '';
            if ($ext !== 'pdf' || $mime !== 'application/pdf') {
                $error = "Only valid PDF files are supported for notes.";
            } elseif ($_FILES["note_file"]["size"] > 20 * 1024 * 1024) {
                $error = "PDF size exceeds the 20MB limit.";
            } else {
                $safeName = "note_" . time() . "_" . bin2hex(random_bytes(4)) . ".pdf";
                $destination = $uploadDir . $safeName;
                if (move_uploaded_file($_FILES["note_file"]["tmp_name"], $destination)) {
                    $stmt = $pdo->prepare("INSERT INTO notes (module_id, title, file_path, sort_order) VALUES (?, ?, ?, ?)");
                    $stmt->execute([$moduleId, $title, $destination, $order]);
                    log_instructor_audit($instId, 'PDF_NOTE_UPLOADED', $targetCourseId, "Uploaded note: {$title}");
                    $message = "PDF Note uploaded successfully.";
                } else {
                    $error = "PDF upload failed.";
                }
            }
        }
    }

    // 4. ADD CODE SNIPPET
    if (isset($_POST["add_code"])) {
        $moduleId = (int)($_POST["code_module_id"] ?? 0);
        $stmtC = $pdo->prepare("SELECT course_id FROM modules WHERE id = ?");
        $stmtC->execute([$moduleId]);
        $targetCourseId = (int)$stmtC->fetchColumn();
        enforce_instructor_course_scope($instId, $targetCourseId);

        $title = clean_text($_POST["code_title"] ?? "", 150);
        $lang  = strtolower(clean_text($_POST["code_language"] ?? "python", 30));
        $code  = mb_substr($_POST["code_text"] ?? "", 0, 30000, 'UTF-8');
        $order = (int)($_POST["code_order"] ?? 0);

        if ($title && $moduleId > 0 && trim($code) !== '') {
            $stmt = $pdo->prepare("INSERT INTO code_snippets (module_id, title, language, code, sort_order) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$moduleId, $title, $lang, $code, $order]);
            log_instructor_audit($instId, 'CODE_SNIPPET_CREATED', $targetCourseId, "Created code snippet: {$title}");
            $message = "Code snippet created.";
        }
    }

            // 5. DELETES WITH STRICT ROW-LEVEL COURSE SCOPE (ISSUES 14 & 18 FIX)
    if (isset($_POST["delete_module_id"])) {
        $delModId = (int)$_POST["delete_module_id"];
        $stmt = $pdo->prepare("DELETE FROM modules WHERE id = ? AND course_id IN ({$courseInSql})");
        $stmt->execute([$delModId]);
        if ($stmt->rowCount() > 0) {
            log_instructor_audit($instId, 'MODULE_DELETED', null, "Deleted module ID #{$delModId}");
            $message = "Module removed.";
        } else {
            $error = "Unauthorized: You do not have permission to delete this module.";
        }
    } elseif (isset($_POST["delete_video_id"])) {
        $delVidId = (int)$_POST["delete_video_id"];
        $stmtV = $pdo->prepare("SELECT file_path, bunny_video_id FROM videos WHERE id = ? AND module_id IN (SELECT id FROM modules WHERE course_id IN ({$courseInSql}))");
        $stmtV->execute([$delVidId]);
        $v = $stmtV->fetch();

        if ($v) {
            // Auto purge from Bunny.net Stream CDN
            if (!empty($v["bunny_video_id"])) {
                delete_bunny_video($v["bunny_video_id"]);
            }
            // Auto purge local file
            if (!empty($v["file_path"]) && file_exists(__DIR__ . '/' . $v["file_path"])) {
                @unlink(__DIR__ . '/' . $v["file_path"]);
            }
            $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
            $stmt->execute([$delVidId]);
            log_instructor_audit($instId, 'VIDEO_DELETED', null, "Deleted video ID #{$delVidId} from portal and Cloud CDN");
            $message = "Video lecture removed from database and Cloud Video CDN.";
        } else {
            $error = "Unauthorized: You do not have permission to delete this video.";
        }
    } elseif (isset($_POST["delete_note_id"])) {
        $delNoteId = (int)$_POST["delete_note_id"];
        $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ? AND module_id IN (SELECT id FROM modules WHERE course_id IN ({$courseInSql}))");
        $stmt->execute([$delNoteId]);
        if ($stmt->rowCount() > 0) {
            log_instructor_audit($instId, 'NOTE_DELETED', null, "Deleted note ID #{$delNoteId}");
            $message = "Note removed.";
        } else {
            $error = "Unauthorized: You do not have permission to delete this note.";
        }
    } elseif (isset($_POST["delete_code_id"])) {
        $delCodeId = (int)$_POST["delete_code_id"];
        $stmt = $pdo->prepare("DELETE FROM code_snippets WHERE id = ? AND module_id IN (SELECT id FROM modules WHERE course_id IN ({$courseInSql}))");
        $stmt->execute([$delCodeId]);
        if ($stmt->rowCount() > 0) {
            log_instructor_audit($instId, 'CODE_SNIPPET_DELETED', null, "Deleted code snippet ID #{$delCodeId}");
            $message = "Code snippet removed.";
        } else {
            $error = "Unauthorized: You do not have permission to delete this code snippet.";
        }
    }
}

$modules = $pdo->query("SELECT m.*, c.title as course_title FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.course_id IN ({$courseInSql}) ORDER BY m.course_id ASC, m.sort_order ASC")->fetchAll();
$moduleIds = array_map(function($m) { return (int)$m['id']; }, $modules);
$modInSql = !empty($moduleIds) ? implode(',', $moduleIds) : '0';

$videosByModule = [];
foreach ($pdo->query("SELECT * FROM videos WHERE module_id IN ({$modInSql}) ORDER BY sort_order ASC")->fetchAll() as $v) {
    $videosByModule[$v["module_id"]][] = $v;
}
$notesByModule = [];
foreach ($pdo->query("SELECT * FROM notes WHERE module_id IN ({$modInSql}) ORDER BY sort_order ASC")->fetchAll() as $n) {
    $notesByModule[$n["module_id"]][] = $n;
}
$codeByModule = [];
foreach ($pdo->query("SELECT * FROM code_snippets WHERE module_id IN ({$modInSql}) ORDER BY sort_order ASC")->fetchAll() as $c) {
    $codeByModule[$c["module_id"]][] = $c;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Curriculum & 3-Mode Video Studio — Faculty Portal</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
    :root {
        --bg-primary: #07090e;
        --bg-surface: #0f141f;
        --bg-card: #141b2b;
        --border-color: #1e293b;
        --accent-primary: #6366f1;
        --accent-secondary: #8b5cf6;
        --text-main: #f8fafc;
        --text-muted: #94a3b8;
        --text-subtle: #64748b;
        --input-bg: #0b1120;
        --input-border: #334155;
        --input-text: #ffffff;
        --input-placeholder: #64748b;
        --shadow-color: rgba(0,0,0,0.4);
        --chip-bg: rgba(99,102,241,0.15);
        --chip-border: rgba(99,102,241,0.3);
        --chip-text: #c7d2fe;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #07090e !important; color: #f8fafc !important; min-height: 100vh; padding-bottom: 3.5rem; }
    .container { max-width: 1550px; margin: 0 auto; padding: 0 1.5rem; }
    
    /* Cards */
    .card { background: #141b2b !important; border: 1px solid #1e293b !important; border-radius: 18px; padding: 1.75rem; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
    
    /* Headings & Text */
    h1, h2, h3, h4, h5, h6 { color: #f8fafc !important; font-weight: 800; }
    p, span, label { color: #94a3b8; }
    
    /* Hero Banner */
    .hero-banner {
        background: #141b2b !important;
        border: 1px solid #1e293b !important;
        border-radius: 18px;
        padding: 1.5rem 1.75rem;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1.25rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .quick-btn {
        background: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        color: #f8fafc !important;
        padding: 0.55rem 1rem;
        border-radius: 10px;
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        transition: all 0.2s;
    }
    .quick-btn:hover {
        border-color: #6366f1 !important;
        color: #c7d2fe !important;
        transform: translateY(-1px);
    }

    /* Stats Grid */
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.35rem; margin-bottom: 2.25rem; }
    .stat-card {
        background: #141b2b !important;
        border: 1px solid #1e293b !important;
        border-radius: 18px;
        padding: 1.5rem 1.65rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
    }
    .stat-label { font-size: 0.8rem; font-weight: 700; color: #94a3b8 !important; text-transform: uppercase; letter-spacing: 0.03em; }
    .stat-number { font-size: 2.2rem; font-weight: 800; margin: 0.4rem 0 0.2rem; line-height: 1.2; }
    .content-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; }

    /* Form Controls, Inputs & Select Options — 100% Locked Dark */
    .form-group { margin-bottom: 1.25rem; }
    .form-label { display: block; font-size: 0.82rem; font-weight: 700; color: #cbd5e1 !important; margin-bottom: 0.4rem; }
    input, select, textarea, .form-input, .form-control {
        width: 100%;
        padding: 0.8rem 1rem;
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        border-radius: 10px;
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        font-size: 0.9rem;
        outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
    }
    input::placeholder, textarea::placeholder, .form-input::placeholder {
        color: #64748b !important;
        -webkit-text-fill-color: #64748b !important;
        opacity: 1;
    }
    input:focus, select:focus, textarea:focus, .form-input:focus, .form-control:focus {
        border-color: #6366f1 !important;
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        background: #0b1120 !important;
        background-color: #0b1120 !important;
    }
    select option {
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        color: #ffffff !important;
        padding: 0.5rem;
    }
    
    /* Chrome / Edge Autofill Override to prevent White Background */
    input:-webkit-autofill,
    input:-webkit-autofill:hover, 
    input:-webkit-autofill:focus, 
    input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 1000px #0b1120 inset !important;
        -webkit-text-fill-color: #ffffff !important;
        transition: background-color 5000s ease-in-out 0s;
    }

    /* Buttons */
    .btn-submit, .btn-primary {
        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
        color: #ffffff !important;
        border: none !important;
        padding: 0.85rem 1.4rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.92rem;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .btn-submit:hover, .btn-primary:hover { transform: translateY(-1px); }

    /* Tables & Responsive Scrolling */
    .table-custom { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table-custom th { text-align: left; padding: 0.85rem 1rem; color: #64748b !important; font-weight: 700; border-bottom: 1.5px solid #1e293b !important; font-size: 0.78rem; text-transform: uppercase; }
    .table-custom td { padding: 1.1rem 1rem; border-bottom: 1px solid #1e293b !important; color: #94a3b8 !important; }
    .table-responsive { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 12px; }
    .table-responsive table th, .table-responsive table td { white-space: nowrap !important; }

    /* Responsive Grid Stacking for Mobile (< 992px) */
    @media (max-width: 992px) {
        .stat-grid { grid-template-columns: 1fr 1fr !important; }
        .content-grid { grid-template-columns: 1fr !important; }
        .responsive-form-grid { grid-template-columns: 1fr !important; }
        .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr !important; }
        .btn-submit, .btn-primary { width: 100% !important; margin-top: 0.75rem; }
        .container { padding: 0 1rem; }
        .card, .hero-banner { padding: 1.25rem; }
    }
    @media (max-width: 580px) {
        .stat-grid { grid-template-columns: 1fr !important; }
        .hero-banner { flex-direction: column; align-items: flex-start; }
    }

    /* Slick High-Contrast Dark-Theme File Upload Button */
    input[type="file"].form-input,
    input[type="file"] {
        background: #0b1120 !important;
        background-color: #0b1120 !important;
        border: 1.5px solid #334155 !important;
        color: #cbd5e1 !important;
        padding: 0.45rem 0.65rem !important;
        border-radius: 10px !important;
        cursor: pointer;
        display: flex;
        align-items: center;
        width: 100%;
        box-sizing: border-box;
        font-size: 0.85rem;
    }
    input[type="file"]::file-selector-button,
    input[type="file"]::-webkit-file-upload-button {
        background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 0.45rem 1rem !important;
        margin-right: 0.85rem !important;
        font-weight: 700 !important;
        font-size: 0.82rem !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35) !important;
    }
    input[type="file"]::file-selector-button:hover,
    input[type="file"]::-webkit-file-upload-button:hover {
        background: linear-gradient(135deg, #4338ca, #4f46e5) !important;
        transform: translateY(-1px);
    }

</style>
</head>
<body>
    <?php include __DIR__ . '/instructor-nav.php'; ?>

    <div class="container">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 style="font-size: 1.85rem; font-weight: 800; letter-spacing: -0.03em;">Curriculum & 3-Mode Video Studio</h1>
                <p style="color: var(--text-muted); font-size: 0.92rem; margin-top: 0.25rem;">Author video lectures, interactive code snippets, and PDF notes for your assigned tracks.</p>
            </div>
        </div>

        <?php if (!empty($message)): ?>
            <div id="flashSuccessAlert" style="background: rgba(16,185,129,0.15); border: 1px solid #10b981; color: #34d399; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; display: flex; justify-content: space-between; align-items: center; transition: all 0.4s ease; box-shadow: 0 4px 14px rgba(16,185,129,0.2);">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.1rem;">✓</span>
                    <span><?= htmlspecialchars($message) ?></span>
                </div>
                <button type="button" onclick="dismissFlashAlert('flashSuccessAlert')" style="background: transparent; border: none; color: #34d399; font-size: 1.25rem; cursor: pointer; padding: 0 0.35rem; line-height: 1; opacity: 0.8; transition: opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">&times;</button>
            </div>
        <?php endif; ?>
        <?php if (!empty($error)): ?>
            <div id="flashErrorAlert" style="background: rgba(244,63,94,0.15); border: 1px solid #f43f5e; color: #fca5a5; padding: 0.85rem 1.25rem; border-radius: 12px; margin-bottom: 1.5rem; font-weight: 600; display: flex; justify-content: space-between; align-items: center; transition: all 0.4s ease; box-shadow: 0 4px 14px rgba(244,63,94,0.2);">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span style="font-size: 1.1rem;">⚠</span>
                    <span><?= htmlspecialchars($error) ?></span>
                </div>
                <button type="button" onclick="dismissFlashAlert('flashErrorAlert')" style="background: transparent; border: none; color: #fca5a5; font-size: 1.25rem; cursor: pointer; padding: 0 0.35rem; line-height: 1; opacity: 0.8; transition: opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">&times;</button>
            </div>
        <?php endif; ?>

        <!-- 4-CARD STUDIO GRID -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="grid-2">
            <!-- CARD 1: ADD MODULE -->
            <div class="card">
                <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">1. Create Module / Chapter</h3>
                <form method="POST" action="instructor-content.php">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="add_module" value="1">

                    <div class="form-group">
                        <label class="form-label">Target Course Track</label>
                        <select name="course_id" class="form-input" required>
                            <?php foreach ($assignedCourses as $c): ?>
                                <option value="<?= $c["id"] ?>">Track #<?= $c["id"] ?>: <?= htmlspecialchars($c["title"]) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Module Title</label>
                        <input type="text" name="module_title" class="form-input" placeholder="e.g. Chapter 4: Neural Networks" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Module Description (Optional)</label>
                        <textarea name="module_desc" class="form-input" rows="2" placeholder="Brief outline of topics covered..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Curriculum Sort Order</label>
                        <input type="number" name="module_order" class="form-input" value="0">
                    </div>

                    <button type="submit" class="btn-submit" style="width: 100%;">Create Module ➔</button>
                </form>
            </div>

            <!-- CARD 2: PUBLISH VIDEO (EXACT 3 UPLOAD MODES) -->
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 0;">🎬 2. Publish Video Lecture</h3>
                    <span style="background: rgba(99,102,241,0.2); color: #c7d2fe; font-size: 0.72rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 100px;">⚡ HIGH-SPEED CDN</span>
                </div>

                <!-- 3 TAB BUTTONS -->
                <div style="display: flex; gap: 0.5rem; background: #0b1120; border: 1px solid #1e293b; padding: 0.35rem; border-radius: 10px; margin-bottom: 1.25rem;">
                    <button type="button" id="btnTabDirect" onclick="switchVideoUploadMode('direct')" style="flex: 1; border: none; padding: 0.55rem; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: #6366f1; color: #fff;">⚡ Direct Cloud Upload</button>
                    <button type="button" id="btnTabGuid" onclick="switchVideoUploadMode('guid')" style="flex: 1; border: none; padding: 0.55rem; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: transparent; color: #94a3b8;">🔗 Link Stream GUID</button>
                    <button type="button" id="btnTabServer" onclick="switchVideoUploadMode('server')" style="flex: 1; border: none; padding: 0.55rem; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; background: transparent; color: #94a3b8;">💾 Server (Legacy)</button>
                </div>

                <!-- MODE 1: BUNNY STREAM CLOUD CDN -->
                <div id="videoMode_direct">
                    <div style="background: rgba(99,102,241,0.1); border-left: 3px solid #6366f1; padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; font-size: 0.82rem; color: #c7d2fe; margin-bottom: 1rem;">
                        ⚡ <strong>Direct Cloud Stream Upload:</strong> Select your video file (MP4, WebM, MKV). It will upload directly to the High-Speed Video CDN with automated adaptive multi-bitrate transcoding (1080p–240p) and zero server load.
                    </div>
                    <form method="POST" action="instructor-content.php" enctype="multipart/form-data">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="upload_direct_bunny" value="1">

                        <div class="form-group">
                            <label class="form-label">Assign to Module Track</label>
                            <select name="video_module_id" class="form-input" required>
                                <?php foreach ($modules as $m): ?>
                                    <option value="<?= $m["id"] ?>">#<?= $m["id"] ?>: <?= htmlspecialchars($m["course_title"]) ?> ➔ <?= htmlspecialchars($m["title"]) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Lecture Title</label>
                            <input type="text" name="video_title" class="form-input" placeholder="e.g. Lecture 1: Deep Learning & Neural Networks" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Select Video File (.mp4, .webm, .mov, .mkv)</label>
                            <input type="file" name="bunny_file" class="form-input" accept="video/mp4,video/webm,video/quicktime,video/x-matroska" required>
                        </div>

                        <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                            <div class="form-group">
                                <label class="form-label">Duration (e.g. 24:15)</label>
                                <input type="text" name="video_duration" class="form-input" placeholder="24:15">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Curriculum Sort Order</label>
                                <input type="number" name="video_order" class="form-input" value="1">
                            </div>
                        </div>

                        <button type="submit" class="btn-submit" style="width: 100%;">⚡ Upload & Publish to Cloud CDN ➔</button>
                    </form>
                </div>

                <!-- MODE 2: LINK ASSET GUID -->
                <div id="videoMode_guid" style="display: none;">
                    <form method="POST" action="instructor-content.php">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="add_video_bunny" value="1">

                        <div class="form-group">
                            <label class="form-label">Assign to Module Track</label>
                            <select name="video_module_id" class="form-input" required>
                                <?php foreach ($modules as $m): ?>
                                    <option value="<?= $m["id"] ?>">#<?= $m["id"] ?>: <?= htmlspecialchars($m["course_title"]) ?> ➔ <?= htmlspecialchars($m["title"]) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Lecture Title</label>
                            <input type="text" name="video_title" class="form-input" placeholder="e.g. Deep Learning with PyTorch" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Cloud Video ID / Stream GUID or Embed URL</label>
                            <input type="text" name="bunny_video_id" class="form-input" placeholder="e.g. 880610dc-d938-4261-9626-d61263292257 or https://..." required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Duration (e.g. 24:15)</label>
                            <input type="text" name="video_duration" class="form-input" placeholder="24:15">
                        </div>

                        <div class="form-group">
                            <label class="form-label">Curriculum Sort Order</label>
                            <input type="number" name="video_order" class="form-input" value="1">
                        </div>

                        <button type="submit" class="btn-submit" style="width: 100%;">Link Video Asset ➔</button>
                    </form>
                </div>

                <!-- MODE 3: SERVER UPLOAD (LEGACY) -->
                <div id="videoMode_server" style="display: none;">
                    <form method="POST" action="instructor-content.php" enctype="multipart/form-data">
                        <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                        <input type="hidden" name="add_video" value="1">

                        <div class="form-group">
                            <label class="form-label">Assign to Module Track</label>
                            <select name="video_module_id" class="form-input" required>
                                <?php foreach ($modules as $m): ?>
                                    <option value="<?= $m["id"] ?>">#<?= $m["id"] ?>: <?= htmlspecialchars($m["course_title"]) ?> ➔ <?= htmlspecialchars($m["title"]) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Lecture Title</label>
                            <input type="text" name="video_title" class="form-input" placeholder="e.g. Core Fundamentals" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Video File (Max 100MB)</label>
                            <input type="file" name="video_file" class="form-input" accept="video/mp4,video/webm" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Curriculum Sort Order</label>
                            <input type="number" name="video_order" class="form-input" value="1">
                        </div>

                        <button type="submit" class="btn-submit" style="width: 100%;">Upload Video File ➔</button>
                    </form>
                </div>
            </div>
        </div>

        <!-- CARD 3 & 4: PDF NOTES & CODE SNIPPETS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;" class="grid-2">
            <!-- CARD 3: PDF NOTES -->
            <div class="card">
                <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">📑 3. Attach PDF Lecture Notes</h3>
                <form method="POST" action="instructor-content.php" enctype="multipart/form-data">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="add_note" value="1">

                    <div class="form-group">
                        <label class="form-label">Target Module Track</label>
                        <select name="note_module_id" class="form-input" required>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?= $m["id"] ?>">#<?= $m["id"] ?>: <?= htmlspecialchars($m["course_title"]) ?> ➔ <?= htmlspecialchars($m["title"]) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Note Title</label>
                        <input type="text" name="note_title" class="form-input" placeholder="e.g. Architecture Blueprint & System Design Cheatsheet" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">PDF File Attachment (Max 20MB)</label>
                        <input type="file" name="note_file" class="form-input" accept=".pdf" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Curriculum Sort Order</label>
                        <input type="number" name="note_order" class="form-input" value="1">
                    </div>

                    <button type="submit" class="btn-submit" style="width: 100%;">Upload PDF Note ➔</button>
                </form>
            </div>

            <!-- CARD 4: CODE SNIPPETS -->
            <div class="card">
                <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">💻 4. Interactive Code Snippet</h3>
                <form method="POST" action="instructor-content.php">
                    <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                    <input type="hidden" name="add_code" value="1">

                    <div class="form-group">
                        <label class="form-label">Target Module Track</label>
                        <select name="code_module_id" class="form-input" required>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?= $m["id"] ?>">#<?= $m["id"] ?>: <?= htmlspecialchars($m["course_title"]) ?> ➔ <?= htmlspecialchars($m["title"]) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;" class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Snippet Title</label>
                            <input type="text" name="code_title" class="form-input" placeholder="e.g. Redis Distributed Lock" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Language</label>
                            <select name="code_language" class="form-input">
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                                <option value="sql">SQL</option>
                                <option value="javascript">JavaScript</option>
                                <option value="typescript">TypeScript</option>
                                <option value="bash">Bash / Shell</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Code Snippet Content</label>
                        <textarea name="code_text" class="form-input" rows="4" style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;" placeholder="// Paste formatted code here..." required></textarea>
                    </div>

                    <button type="submit" class="btn-submit" style="width: 100%;">Save Code Snippet ➔</button>
                </form>
            </div>
        </div>

        <!-- 5. ACTIVE SYLLABUS ACCORDION TREE -->
        <div class="card">
            <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 1.25rem;">Active Syllabus & Asset Tree (<?= count($modules) ?> Chapters)</h3>
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <?php foreach ($modules as $mod): 
                    $mId = (int)$mod['id'];
                    $vids = $videosByModule[$mId] ?? [];
                    $notes = $notesByModule[$mId] ?? [];
                    $codes = $codeByModule[$mId] ?? [];
                ?>
                    <div style="background: #0b1120; border: 1px solid var(--border-color); border-radius: 14px; padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                            <div>
                                <span style="background: rgba(99,102,241,0.15); color: #c7d2fe; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px;">🎯 <?= htmlspecialchars($mod['course_title']) ?></span>
                                <h4 style="font-size: 1.1rem; font-weight: 800; margin: 0.35rem 0 0; color: #ffffff;">#<?= $mod['id'] ?>: <?= htmlspecialchars($mod['title']) ?></h4>
                            </div>
                            <form method="POST" action="instructor-content.php" onsubmit="return confirm('Are you sure you want to delete this module?');">
                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                <input type="hidden" name="delete_module_id" value="<?= $mod['id'] ?>">
                                <button type="submit" style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.3); color: #f43f5e; padding: 0.35rem 0.75rem; font-size: 0.78rem; border-radius: 6px; cursor: pointer;">Delete Module</button>
                            </form>
                        </div>

                        <!-- 3 SUB-COLUMNS: VIDEOS, NOTES, CODE -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;" class="grid-3">
                            <div style="background: #141b2b; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem;">
                                <strong style="font-size: 0.85rem; color: #38bdf8; display: block; margin-bottom: 0.5rem;">📹 Videos (<?= count($vids) ?>)</strong>
                                <?php if (empty($vids)): ?>
                                    <span style="font-size: 0.78rem; color: var(--text-subtle);">No videos linked</span>
                                <?php else: ?>
                                    <?php foreach ($vids as $v): ?>
                                        <div style="font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;">
                                            <span style="color: #cbd5e1;"><?= htmlspecialchars($v['title']) ?></span>
                                            <form method="POST" action="instructor-content.php">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="delete_video_id" value="<?= $v['id'] ?>">
                                                <button type="submit" style="background: none; border: none; color: #f43f5e; cursor: pointer;">✕</button>
                                            </form>
                                        </div>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>

                            <div style="background: #141b2b; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem;">
                                <strong style="font-size: 0.85rem; color: #fbbf24; display: block; margin-bottom: 0.5rem;">📑 Notes (<?= count($notes) ?>)</strong>
                                <?php if (empty($notes)): ?>
                                    <span style="font-size: 0.78rem; color: var(--text-subtle);">No PDF notes attached</span>
                                <?php else: ?>
                                    <?php foreach ($notes as $nt): ?>
                                        <div style="font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;">
                                            <a href="<?= htmlspecialchars($nt['file_path']) ?>" target="_blank" style="color: #fbbf24; text-decoration: none;"><?= htmlspecialchars($nt['title']) ?></a>
                                            <form method="POST" action="instructor-content.php">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="delete_note_id" value="<?= $nt['id'] ?>">
                                                <button type="submit" style="background: none; border: none; color: #f43f5e; cursor: pointer;">✕</button>
                                            </form>
                                        </div>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>

                            <div style="background: #141b2b; border: 1px solid var(--border-color); border-radius: 10px; padding: 0.85rem;">
                                <strong style="font-size: 0.85rem; color: #34d399; display: block; margin-bottom: 0.5rem;">💻 Code (<?= count($codes) ?>)</strong>
                                <?php if (empty($codes)): ?>
                                    <span style="font-size: 0.78rem; color: var(--text-subtle);">No code snippets</span>
                                <?php else: ?>
                                    <?php foreach ($codes as $cd): ?>
                                        <div style="font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center;">
                                            <span style="color: #cbd5e1;"><?= htmlspecialchars($cd['title']) ?> (<?= $cd['language'] ?>)</span>
                                            <form method="POST" action="instructor-content.php">
                                                <input type="hidden" name="csrf_token" value="<?= csrf_token() ?>">
                                                <input type="hidden" name="delete_code_id" value="<?= $cd['id'] ?>">
                                                <button type="submit" style="background: none; border: none; color: #f43f5e; cursor: pointer;">✕</button>
                                            </form>
                                        </div>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <script>
        function switchVideoUploadMode(mode) {
            ['direct', 'guid', 'server'].forEach(function(m) {
                var el = document.getElementById('videoMode_' + m);
                var btn = document.getElementById('btnTab' + m.charAt(0).toUpperCase() + m.slice(1));
                if (el) el.style.display = (m === mode) ? 'block' : 'none';
                if (btn) {
                    if (m === mode) {
                        btn.style.background = '#6366f1';
                        btn.style.color = '#ffffff';
                    } else {
                        btn.style.background = 'transparent';
                        btn.style.color = '#94a3b8';
                    }
                }
            });
        }

        function dismissFlashAlert(id) {
            var el = document.getElementById(id);
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(-8px)';
                setTimeout(function() {
                    if (el.parentNode) el.parentNode.removeChild(el);
                }, 400);
            }
        }

        // Auto-dismiss alert notifications after 4 seconds
        document.addEventListener('DOMContentLoaded', function() {
            ['flashSuccessAlert', 'flashErrorAlert'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) {
                    setTimeout(function() {
                        dismissFlashAlert(id);
                    }, 4000);
                }
            });
        });
    </script>
</body>
</html>