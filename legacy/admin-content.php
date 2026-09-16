<?php
$adminActive = 'content';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$adminId = requireAdmin();
$message = "";

// 0. Update Course Pricing & Status
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["update_course_pricing"])) {
    verify_csrf();
    $cId    = validate_integer_range($_POST["course_id"] ?? 0, 1, 100000, 0);
    $cPrice = validate_integer_range($_POST["course_price"] ?? 15000, 0, 1000000, 15000);
    $cStatus = clean_text($_POST["course_status"] ?? 'published', 20);
    if (!in_array($cStatus, ['published', 'draft', 'archived'], true)) {
        $cStatus = 'published';
    }

    if ($cId > 0) {
        $stmt = $pdo->prepare("UPDATE courses SET price = ?, status = ? WHERE id = ?");
        $stmt->execute([$cPrice, $cStatus, $cId]);
        header("Location: admin-content.php?course_id=" . $cId . "&msg=pricing_updated");
        exit;
    }
}

// 0b. Create Brand New Course
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["create_new_course"])) {
    verify_csrf();
    $cTitle    = clean_text($_POST["new_course_title"] ?? "", 150);
    $cPrice    = validate_integer_range($_POST["new_course_price"] ?? 15000, 0, 1000000, 15000);
    $cDuration = clean_text($_POST["new_course_duration"] ?? "12 Weeks", 50);
    $cLevel    = clean_text($_POST["new_course_level"] ?? "Intermediate", 50);
    $cDesc     = clean_text($_POST["new_course_desc"] ?? "", 1000);

    if (!empty($cTitle)) {
        $stmt = $pdo->prepare("INSERT INTO courses (title, description, level, duration, price, status, created_at) VALUES (?, ?, ?, ?, ?, 'published', NOW())");
        $stmt->execute([$cTitle, $cDesc, $cLevel, $cDuration, $cPrice]);
        $newId = (int)$pdo->lastInsertId();
        header("Location: admin-content.php?course_id=" . $newId . "&msg=course_created");
        exit;
    }
}

$error = "";

// 1. Add Module
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_module"])) {
    verify_csrf();
    $courseId = validate_integer_range($_POST["course_id"] ?? 1, 1, 100000, 1);
    $title    = clean_text($_POST["module_title"] ?? "", 150);
    $desc     = clean_text($_POST["module_desc"] ?? "", 1000);
    $order    = validate_integer_range($_POST["module_order"] ?? 0, 0, 1000, 0);
    if ($title) {
        $stmt = $pdo->prepare("INSERT INTO modules (course_id, title, description, sort_order) VALUES (?, ?, ?, ?)");
        $stmt->execute([$courseId, $title, $desc, $order]);
        header("Location: admin-content.php?course_id=" . $courseId . "&msg=module_added");
        exit;
    } else {
        $error = "Valid module title (max 150 chars) is required.";
    }
}

// Delete Module
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_module_id"])) {
    verify_csrf();
    $moduleId = intval($_POST["delete_module_id"]);
    $stmt = $pdo->prepare("DELETE FROM modules WHERE id = ?");
    $stmt->execute([$moduleId]);
    header("Location: admin-content?msg=deleted");
    exit;
}


// 2a. Add Video via Bunny.net ID (paste tab)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_video_bunny"])) {
    verify_csrf();
    $moduleId     = validate_integer_range($_POST["video_module_id"] ?? 0, 1, 100000, 0);
    $title        = clean_text($_POST["video_title"] ?? "", 150);
    $bunnyVideoId = trim($_POST["bunny_video_id"] ?? "");
    $duration     = clean_text($_POST["video_duration"] ?? "", 20);
    $order        = validate_integer_range($_POST["video_order"] ?? 0, 0, 1000, 0);

    if ($title && $moduleId > 0 && !empty($bunnyVideoId)) {
        $stmt = $pdo->prepare("INSERT INTO videos (module_id, title, file_path, bunny_video_id, duration, sort_order) VALUES (?, ?, '', ?, ?, ?)");
        $stmt->execute([$moduleId, $title, $bunnyVideoId, $duration ?: null, $order]);
        $message = "✅ Video lecture linked to High-Speed Cloud CDN successfully!";
    } else {
        $error = "Please provide title, module, and Cloud Video ID.";
    }
}

// 2. Add Video
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_video"])) {

    verify_csrf();
    $moduleId = validate_integer_range($_POST["video_module_id"] ?? 0, 1, 100000, 0);
    $title    = clean_text($_POST["video_title"] ?? "", 150);
    $order    = validate_integer_range($_POST["video_order"] ?? 0, 0, 1000, 0);

    if ($title && $moduleId > 0 && isset($_FILES["video_file"]) && $_FILES["video_file"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "uploads/videos/";
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $ext = strtolower(pathinfo($_FILES["video_file"]["name"], PATHINFO_EXTENSION));
        $allowed = ['mp4', 'webm', 'mov', 'mkv'];
        $mime = mime_content_type($_FILES["video_file"]["tmp_name"]);
        $fileSize = $_FILES["video_file"]["size"];

        if (!in_array($ext, $allowed)) {
            $error = "Invalid video format. Allowed: " . implode(', ', $allowed);
        } elseif (!str_starts_with($mime, 'video/')) {
            $error = "Security check failed. The uploaded file is not a valid video.";
        } elseif ($fileSize > 100 * 1024 * 1024) {
            $error = "Video file size exceeds the 100MB limit.";
        } else {
            $safeName = "video_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $ext;
            $destination = $uploadDir . $safeName;
            if (move_uploaded_file($_FILES["video_file"]["tmp_name"], $destination)) {
                $stmt = $pdo->prepare("INSERT INTO videos (module_id, title, file_path, sort_order) VALUES (?, ?, ?, ?)");
                $stmt->execute([$moduleId, $title, $destination, $order]);
                $message = "Video lecture uploaded successfully.";
            } else {
                $error = "Video upload failed. Check upload size limits.";
            }
        }
    } else {
        $error = "Please provide video title, select a module, and attach a video file.";
    }
}

// Delete Video (Purges from Bunny.net CDN + Local Storage + MySQL)
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_video_id"])) {
    verify_csrf();
    $vidId = intval($_POST["delete_video_id"]);
    $stmt = $pdo->prepare("SELECT file_path, bunny_video_id FROM videos WHERE id = ?");
    $stmt->execute([$vidId]);
    $v = $stmt->fetch();
    if ($v) {
        if (!empty($v["bunny_video_id"])) {
            delete_bunny_video($v["bunny_video_id"]);
        }
        if (!empty($v["file_path"]) && file_exists($v["file_path"])) {
            @unlink($v["file_path"]);
        }
    }
    $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
    $stmt->execute([$vidId]);
    header("Location: admin-content?msg=deleted");
    exit;
}

// 3. Add PDF Note
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_note"])) {
    verify_csrf();
    $moduleId = validate_integer_range($_POST["note_module_id"] ?? 0, 1, 100000, 0);
    $title    = clean_text($_POST["note_title"] ?? "", 150);
    $order    = validate_integer_range($_POST["note_order"] ?? 0, 0, 1000, 0);

    if ($title && $moduleId > 0 && isset($_FILES["note_file"]) && $_FILES["note_file"]["error"] === UPLOAD_ERR_OK) {
        $uploadDir = "uploads/notes/";
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $ext = strtolower(pathinfo($_FILES["note_file"]["name"], PATHINFO_EXTENSION));
        $mime = mime_content_type($_FILES["note_file"]["tmp_name"]);
        $fileSize = $_FILES["note_file"]["size"];

        if ($ext !== 'pdf') {
            $error = "Only PDF files are supported for notes.";
        } elseif ($mime !== 'application/pdf') {
            $error = "Security check failed. The uploaded file is not a valid PDF.";
        } elseif ($fileSize > 20 * 1024 * 1024) {
            $error = "PDF file size exceeds the 20MB limit.";
        } else {
            $safeName = "note_" . time() . "_" . bin2hex(random_bytes(4)) . ".pdf";
            $destination = $uploadDir . $safeName;
            if (move_uploaded_file($_FILES["note_file"]["tmp_name"], $destination)) {
                $stmt = $pdo->prepare("INSERT INTO notes (module_id, title, file_path, sort_order) VALUES (?, ?, ?, ?)");
                $stmt->execute([$moduleId, $title, $destination, $order]);
                $message = "PDF Note uploaded successfully.";
            } else {
                $error = "PDF upload failed.";
            }
        }
    } else {
        $error = "Please provide a note title and select a PDF file.";
    }
}

// Delete Note
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_note_id"])) {
    verify_csrf();
    $noteId = intval($_POST["delete_note_id"]);
    $stmt = $pdo->prepare("SELECT file_path FROM notes WHERE id = ?");
    $stmt->execute([$noteId]);
    $n = $stmt->fetch();
    if ($n && !empty($n["file_path"]) && file_exists($n["file_path"])) @unlink($n["file_path"]);
    $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ?");
    $stmt->execute([$noteId]);
    header("Location: admin-content?msg=deleted");
    exit;
}

// 4. Add Code Snippet
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["add_code"])) {
    verify_csrf();
    $moduleId = validate_integer_range($_POST["code_module_id"] ?? 0, 1, 100000, 0);
    $title    = clean_text($_POST["code_title"] ?? "", 150);
    $lang     = strtolower(clean_text($_POST["code_language"] ?? "html", 30));
    $code     = mb_substr($_POST["code_text"] ?? "", 0, 30000, 'UTF-8');
    $order    = validate_integer_range($_POST["code_order"] ?? 0, 0, 1000, 0);

    $allowedLangs = ['html', 'css', 'javascript', 'js', 'php', 'python', 'sql', 'bash', 'json', 'typescript', 'ts', 'c', 'cpp', 'java'];
    if (!in_array($lang, $allowedLangs, true)) {
        $lang = 'javascript';
    }

    if ($title && $moduleId > 0 && trim($code) !== '') {
        $stmt = $pdo->prepare("INSERT INTO code_snippets (module_id, title, language, code, sort_order) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$moduleId, $title, $lang, $code, $order]);
        $message = "Code snippet created.";
    } else {
        $error = "Please provide a title, select a module, and enter snippet code.";
    }
}

// Delete Code Snippet
if ($_SERVER["REQUEST_METHOD"] === "POST" && isset($_POST["delete_code_id"])) {
    verify_csrf();
    $codeId = intval($_POST["delete_code_id"]);
    $stmt = $pdo->prepare("DELETE FROM code_snippets WHERE id = ?");
    $stmt->execute([$codeId]);
    header("Location: admin-content?msg=deleted");
    exit;
}

// Fetch Courses, Modules and Items (Scoped to Selected Course)
$courses = $pdo->query("SELECT * FROM courses ORDER BY id ASC")->fetchAll();
if (empty($courses)) {
    $courses = [['id' => 1, 'title' => 'Full Stack Web Development']];
}

$selectedCourseId = isset($_GET['course_id']) ? (int)$_GET['course_id'] : ($courses[0]['id'] ?? 1);
$currentCourse = null;
foreach ($courses as $c) {
    if ((int)$c['id'] === $selectedCourseId) {
        $currentCourse = $c;
        break;
    }
}
if (!$currentCourse) {
    $currentCourse = $courses[0];
    $selectedCourseId = (int)$currentCourse['id'];
}

$stmtModules = $pdo->prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC");
$stmtModules->execute([$selectedCourseId]);
$modules = $stmtModules->fetchAll();

$videosByModule = [];
foreach ($pdo->query("SELECT * FROM videos ORDER BY sort_order ASC")->fetchAll() as $v) {
    $videosByModule[$v["module_id"]][] = $v;
}

$notesByModule = [];
foreach ($pdo->query("SELECT * FROM notes ORDER BY sort_order ASC")->fetchAll() as $n) {
    $notesByModule[$n["module_id"]][] = $n;
}

$codeByModule = [];
foreach ($pdo->query("SELECT * FROM code_snippets ORDER BY sort_order ASC")->fetchAll() as $c) {
    $codeByModule[$c["module_id"]][] = $c;
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
    <title>Curriculum & Content Management — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=<?php echo time(); ?>">
    <style>
        input[type="file"] {
            background: #ffffff !important;
            background-color: #ffffff !important;
            border: 1px solid #cbd5e1 !important;
            color: #334155 !important;
            padding: 0.35rem 0.55rem !important;
            border-radius: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
            font-size: 0.84rem !important;
        }
        input[type="file"]::file-selector-button,
        input[type="file"]::-webkit-file-upload-button {
            background: #4f46e5 !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 0.4rem 0.85rem !important;
            margin-right: 0.85rem !important;
            font-weight: 600 !important;
            font-size: 0.82rem !important;
            cursor: pointer !important;
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/admin-nav.php"; ?>

    <main class="app-container">
        <div class="page-header">
            <div class="page-header-text">
                <h1>Curriculum & Content Management</h1>
                <p>Manage curriculum hierarchy: Courses → Modules → Video Lectures, Notes & Code Snippets.</p>
            </div>
        </div>

        <!-- Authoritative Course Selector Context Bar (Matching Native Admin UI) -->
        <div class="card" style="margin-bottom: 1.5rem; padding: 1.1rem 1.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 42px; height: 42px; border-radius: 10px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                    🎓
                </div>
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Active Course Curriculum</span>
                        <span class="badge" style="background: #dcfce7; color: #15803d; font-weight: 800; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 6px;">
                            🏷️ Price: ₹<?php echo number_format($currentCourse['price'] ?? 15000); ?>
                        </span>
                        <span class="badge" style="background: #e0e7ff; color: #4338ca; font-weight: 800; font-size: 0.75rem; padding: 0.15rem 0.5rem; border-radius: 6px;">
                            <?php echo strtoupper(e($currentCourse['status'] ?? 'published')); ?>
                        </span>
                    </div>
                    <div style="font-size: 1.2rem; font-weight: 800; color: #0f172a; margin-top: 0.1rem;"><?php echo e($currentCourse['title']); ?></div>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
                <label for="adminCourseSwitch" style="font-size: 0.84rem; font-weight: 600; color: #475569;">Switch Course:</label>
                <select id="adminCourseSwitch" onchange="window.location.href='admin-content.php?course_id='+this.value;" style="padding: 0.5rem 1rem; background: #f8fafc; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.88rem; font-weight: 600; outline: none; cursor: pointer;">
                    <?php foreach ($courses as $c): ?>
                        <option value="<?php echo $c['id']; ?>" <?php echo ((int)$c['id'] === $selectedCourseId) ? 'selected' : ''; ?>>
                            <?php echo e($c['title']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>
        </div>

        <?php if ($message || isset($_GET['msg'])): ?>
            <div class="alert alert-success">
                <span><?php echo e($message ?: 'Action completed successfully.'); ?></span>
            </div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="alert alert-danger">
                <span><?php echo e($error); ?></span>
            </div>
        <?php endif; ?>

        <!-- Content Creation Forms Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 1.25rem; margin-bottom: 2rem;">
            <!-- Add Module Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2>1. Add New Module</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <input type="hidden" name="course_id" value="<?php echo $selectedCourseId; ?>">
                    <div class="form-group">
                        <label>Module Title</label>
                        <input type="text" name="module_title" placeholder="e.g. Module 3: Modern JavaScript & Async" required>
                    </div>
                    <div class="form-group">
                        <label>Short Description</label>
                        <input type="text" name="module_desc" placeholder="Brief overview of what students will learn">
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="module_order" value="<?php echo count($modules) + 1; ?>">
                    </div>
                    <button type="submit" name="add_module" class="btn btn-primary btn-sm">Create Module</button>
                </form>
            </div>

            <!-- Upload Video Card — Enterprise Cloud CDN -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:0.55rem;">
                        <span style="font-size:1.35rem;">🎬</span>
                        <h2 style="margin:0;">2. Publish Video Lecture</h2>
                    </div>
                    <span style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; font-size:0.68rem; font-weight:800; padding:0.2rem 0.6rem; border-radius:100px; letter-spacing:0.04em;">
                        ⚡ HIGH-SPEED CDN
                    </span>
                </div>

                <!-- ENTERPRISE TAB SWITCHER -->
                <div style="display:flex; gap:0; margin-bottom:1rem; border:1.5px solid #e2e8f0; border-radius:10px; overflow:hidden;">
                    <button type="button" onclick="switchVideoTab('bunny')" id="tabBunny"
                        style="flex:1; padding:0.6rem 0.4rem; font-size:0.8rem; font-weight:700; background:#4f46e5; color:#fff; border:none; cursor:pointer; transition:all 0.2s;">
                        ⚡ Direct Upload
                    </button>
                    <button type="button" onclick="switchVideoTab('paste')" id="tabPaste"
                        style="flex:1; padding:0.6rem 0.4rem; font-size:0.8rem; font-weight:700; background:#f8fafc; color:#64748b; border:none; cursor:pointer; transition:all 0.2s;">
                        🔗 Link Asset GUID
                    </button>
                    <button type="button" onclick="switchVideoTab('local')" id="tabLocal"
                        style="flex:1; padding:0.6rem 0.4rem; font-size:0.8rem; font-weight:700; background:#f8fafc; color:#64748b; border:none; cursor:pointer; transition:all 0.2s;">
                        💾 Server (Legacy)
                    </button>
                </div>

                <!-- TAB 1: DIRECT CLOUD UPLOAD -->
                <div id="panelBunny">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:3.5px solid #6366f1; border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.79rem; color:#334155; line-height:1.45;">
                        <strong style="color:#1e293b;">⚡ Global Edge Delivery:</strong> Files upload directly to edge network with automated multi-bitrate transcoding (1080p–240p) and adaptive streaming.
                    </div>
                    <div class="form-group">
                        <label>Assign to Module Track</label>
                        <select id="bunnyModuleId">
                            <option value="">Select Target Module</option>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Lecture Title</label>
                        <input type="text" id="bunnyTitle" placeholder="e.g. Lecture 1: Spring Boot Microservices Architecture">
                    </div>
                    <div class="form-group">
                        <label>Master Video File (MP4, WebM, MKV)</label>
                        <input type="file" id="bunnyFile" accept="video/*">
                    </div>
                    <div class="form-group">
                        <label>Curriculum Sort Order</label>
                        <input type="number" id="bunnyOrder" value="1" style="width:110px;">
                    </div>

                    <!-- Upload Progress -->
                    <div id="bunnyProgress" style="display:none; margin-bottom:1rem;">
                        <div style="background:#e2e8f0; border-radius:100px; height:10px; overflow:hidden;">
                            <div id="bunnyProgressBar" style="width:0%; height:100%; background:linear-gradient(90deg,#4f46e5,#7c3aed); transition:width 0.3s; border-radius:100px;"></div>
                        </div>
                        <div id="bunnyProgressText" style="font-size:0.78rem; color:#64748b; margin-top:0.4rem; text-align:center;">Preparing upload...</div>
                    </div>

                    <!-- Status Badge -->
                    <div id="bunnyStatus" style="display:none; padding:0.65rem; border-radius:8px; font-size:0.82rem; margin-bottom:1rem;"></div>

                    <button type="button" onclick="startBunnyUpload()" id="bunnyUploadBtn" class="btn btn-primary btn-sm" style="width:100%; justify-content:center;">
                        Publish Lecture to Cloud Stream ➔
                    </button>
                </div>

                <!-- TAB 2: LINK BY ASSET GUID -->
                <div id="panelPaste" style="display:none;">
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:3.5px solid #3b82f6; border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.79rem; color:#334155; line-height:1.45;">
                        <strong style="color:#1e293b;">🔗 Media Asset Linking:</strong> Connect an existing cloud video GUID to a curriculum module instantly without re-uploading.
                    </div>
                    <form method="POST">
                        <?php echo csrf_field(); ?>
                        <div class="form-group">
                            <label>Assign to Module Track</label>
                            <select name="video_module_id" required>
                                <option value="">Select Target Module</option>
                                <?php foreach ($modules as $m): ?>
                                    <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Lecture Title</label>
                            <input type="text" name="video_title" placeholder="e.g. Lecture 2: Distributed System Design" required>
                        </div>
                        <div class="form-group">
                            <label>Video Asset GUID <span style="color:#64748b; font-weight:400; font-size:0.75rem;">(36-char cloud media key)</span></label>
                            <input type="text" name="bunny_video_id" placeholder="e.g. 880610dc-d938-4261-9626-d61263292257" required
                                style="font-family:monospace; font-size:0.85rem; letter-spacing:0.02em;">
                        </div>
                        <div class="form-group">
                            <label>Duration <span style="color:#64748b; font-weight:400; font-size:0.75rem;">(Optional, e.g. 45:20)</span></label>
                            <input type="text" name="video_duration" placeholder="45:20">
                        </div>
                        <div class="form-group">
                            <label>Curriculum Sort Order</label>
                            <input type="number" name="video_order" value="1" style="width:110px;">
                        </div>
                        <button type="submit" name="add_video_bunny" class="btn btn-primary btn-sm" style="width:100%; justify-content:center;">Attach Video to Module ➔</button>
                    </form>
                </div>

                <!-- TAB 3: SERVER FILE (Legacy) -->
                <div id="panelLocal" style="display:none;">
                    <div style="background:#fff1f2; border:1px solid #fecdd3; border-left:3.5px solid #e11d48; border-radius:8px; padding:0.75rem; margin-bottom:1rem; font-size:0.79rem; color:#9f1239; line-height:1.45;">
                        <strong>⚠️ Note:</strong> Server-hosted files consume shared host bandwidth. For optimal streaming performance, use <strong>Direct Upload</strong>.
                    </div>
                    <form method="POST" enctype="multipart/form-data">
                        <?php echo csrf_field(); ?>
                        <div class="form-group">
                            <label>Assign to Module Track</label>
                            <select name="video_module_id" required>
                                <option value="">Select Target Module</option>
                                <?php foreach ($modules as $m): ?>
                                    <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Lecture Title</label>
                            <input type="text" name="video_title" placeholder="e.g. Lecture 1: Java Basics" required>
                        </div>
                        <div class="form-group">
                            <label>Video File (MP4, WebM)</label>
                            <input type="file" name="video_file" accept="video/*" required>
                        </div>
                        <div class="form-group">
                            <label>Curriculum Sort Order</label>
                            <input type="number" name="video_order" value="1" style="width:110px;">
                        </div>
                        <button type="submit" name="add_video" class="btn btn-secondary btn-sm" style="width:100%; justify-content:center;">Upload to Server</button>
                    </form>
                </div>
            </div>

            <!-- Upload PDF Notes Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2>3. Upload PDF Notes</h2>
                </div>
                <form method="POST" enctype="multipart/form-data">
                    <?php echo csrf_field(); ?>
                    <div class="form-group">
                        <label>Assign to Module</label>
                        <select name="note_module_id" required>
                            <option value="">Select Module</option>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Document Title</label>
                        <input type="text" name="note_title" placeholder="e.g. JavaScript Cheatsheet & Lab Guide" required>
                    </div>
                    <div class="form-group">
                        <label>PDF Document</label>
                        <input type="file" name="note_file" accept=".pdf" required>
                    </div>
                    <div class="form-group">
                        <label>Sort Order</label>
                        <input type="number" name="note_order" value="1">
                    </div>
                    <button type="submit" name="add_note" class="btn btn-primary btn-sm">Upload PDF</button>
                </form>
            </div>

            <!-- Add Code Snippet Card -->
            <div class="card" style="margin-bottom: 0;">
                <div class="card-header">
                    <h2>4. Add Code Snippet</h2>
                </div>
                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <div class="form-group">
                        <label>Assign to Module</label>
                        <select name="code_module_id" required>
                            <option value="">Select Module</option>
                            <?php foreach ($modules as $m): ?>
                                <option value="<?php echo $m['id']; ?>"><?php echo e($m['title']); ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Snippet Title</label>
                        <input type="text" name="code_title" placeholder="e.g. Express REST API Starter" required>
                    </div>
                    <div class="form-group">
                        <label>Language</label>
                        <select name="code_language">
                            <option value="javascript">JavaScript</option>
                            <option value="php">PHP</option>
                            <option value="python">Python</option>
                            <option value="html">HTML / CSS</option>
                            <option value="sql">SQL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Code Content</label>
                        <textarea name="code_text" rows="4" placeholder="// Paste code here..." required></textarea>
                    </div>
                    <button type="submit" name="add_code" class="btn btn-primary btn-sm">Save Snippet</button>
                </form>
            </div>
        </div>

        <!-- Curriculum Explorer / Current Content Tree -->
        <section class="card">
            <div class="card-header">
                <h2>Published Curriculum Hierarchy</h2>
                <span class="mono" style="color: var(--text-muted);"><?php echo count($modules); ?> Modules</span>
            </div>

            <?php if (empty($modules)): ?>
                <p style="color: var(--text-muted); padding: 1.5rem 0;">No modules have been created yet.</p>
            <?php else: ?>
                <?php foreach ($modules as $index => $m): 
                    $mid = $m['id'];
                    $vids = $videosByModule[$mid] ?? [];
                    $notes = $notesByModule[$mid] ?? [];
                    $code = $codeByModule[$mid] ?? [];
                ?>
                <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem; background: var(--bg-surface);">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                        <div>
                            <span class="badge neutral" style="margin-bottom: 0.25rem;">Module <?php echo $index + 1; ?></span>
                            <h3 style="font-size: 1.15rem;"><?php echo e($m['title']); ?></h3>
                            <?php if (!empty($m['description'])): ?>
                                <p style="font-size: 0.88rem; color: var(--text-muted);"><?php echo e($m['description']); ?></p>
                            <?php endif; ?>
                        </div>
                        <form method="POST" style="display:inline" onsubmit="return confirm('Are you sure you want to delete this module and all its attached videos/notes?')">
<input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
<input type="hidden" name="delete_module_id" value="<?php echo (int)$mid; ?>">
<button type="submit" class="btn btn-secondary btn-sm" style="color: var(--danger); border-color: #fecaca;">
                            Delete Module
                        </a>
                    </div>

                    <!-- Module Item Tree -->
                    <div style="margin-top: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
                        <?php if (empty($vids) && empty($notes) && empty($code)): ?>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">No lessons uploaded to this module yet.</p>
                        <?php endif; ?>

                        <!-- Videos List -->
                        <?php foreach ($vids as $v): ?>
                        <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; margin-bottom: 0.4rem; border-radius: 8px; background: var(--bg-page); border: 1px solid var(--border);">
                            <span class="badge neutral" style="background: #fee2e2; color: #dc2626; flex-shrink: 0; white-space: nowrap;">VIDEO</span>
                            <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem;" title="<?php echo e($v['title']); ?>"><?php echo e($v['title']); ?></span>
                            <form method="POST" style="display:inline" onsubmit="return confirm('Delete video?')">
<input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
<input type="hidden" name="delete_video_id" value="<?php echo (int)$v['id']; ?>">
<button type="submit" style="flex-shrink:0; white-space:nowrap; color:#ef4444; font-size:.75rem; font-weight:600; background:#fef2f2; border:1px solid #fecaca; padding:.2rem .55rem; border-radius:6px;">Delete</button>
</form>
                        </div>
                        <?php endforeach; ?>

                        <!-- Notes List -->
                        <?php foreach ($notes as $n): ?>
                        <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; margin-bottom: 0.4rem; border-radius: 8px; background: var(--bg-page); border: 1px solid var(--border);">
                            <span class="badge neutral" style="background: #e0e7ff; color: #4338ca; flex-shrink: 0; white-space: nowrap;">PDF</span>
                            <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem;" title="<?php echo e($n['title']); ?>"><?php echo e($n['title']); ?></span>
                            <form method="POST" style="display:inline" onsubmit="return confirm('Delete note?')">
<input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
<input type="hidden" name="delete_note_id" value="<?php echo (int)$n['id']; ?>">
<button type="submit" style="flex-shrink:0; white-space:nowrap; color:#ef4444; font-size:.75rem; font-weight:600; background:#fef2f2; border:1px solid #fecaca; padding:.2rem .55rem; border-radius:6px;">Delete</button>
</form>
                        </div>
                        <?php endforeach; ?>

                        <!-- Code List -->
                        <?php foreach ($code as $c): ?>
                        <div style="display: flex; align-items: center; gap: 0.6rem; padding: 0.45rem 0.6rem; margin-bottom: 0.4rem; border-radius: 8px; background: var(--bg-page); border: 1px solid var(--border);">
                            <span class="badge neutral" style="background: #dcfce7; color: #15803d; flex-shrink: 0; white-space: nowrap;">CODE</span>
                            <span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.88rem;" title="<?php echo e($c['title']); ?>"><?php echo e($c['title']); ?> (<?php echo strtoupper(e($c['language'])); ?>)</span>
                            <form method="POST" style="display:inline" onsubmit="return confirm('Delete snippet?')">
<input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8'); ?>">
<input type="hidden" name="delete_code_id" value="<?php echo (int)$c['id']; ?>">
<button type="submit" style="flex-shrink:0; white-space:nowrap; color:#ef4444; font-size:.75rem; font-weight:600; background:#fef2f2; border:1px solid #fecaca; padding:.2rem .55rem; border-radius:6px;">Delete</button>
</form>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </section>
    </main>

<script>
/* ============================================================
   BUNNY.NET ADMIN UPLOAD ENGINE
   - Tab switcher (Bunny / Paste / Local)
   - Direct browser-to-Bunny XHR upload with progress
   - Encoding status poller
   ============================================================ */

function switchVideoTab(tab) {
    const panels = { bunny: 'panelBunny', paste: 'panelPaste', local: 'panelLocal' };
    const tabs   = { bunny: 'tabBunny',   paste: 'tabPaste',   local: 'tabLocal'   };
    Object.keys(panels).forEach(function(k) {
        document.getElementById(panels[k]).style.display = (k === tab) ? 'block' : 'none';
        document.getElementById(tabs[k]).style.background = (k === tab) ? '#4f46e5' : '#f8fafc';
        document.getElementById(tabs[k]).style.color      = (k === tab) ? '#fff'    : '#64748b';
    });
}

function setStatus(msg, type) {
    var el = document.getElementById('bunnyStatus');
    var colors = { success: ['#ecfdf5','#065f46'], error: ['#fef2f2','#991b1b'], info: ['#eff6ff','#1e40af'], warn: ['#fffbeb','#92400e'] };
    var c = colors[type] || colors.info;
    el.style.background = c[0];
    el.style.color      = c[1];
    el.innerHTML        = msg;
    el.style.display    = 'block';
}

async function startBunnyUpload() {
    var moduleId = document.getElementById('bunnyModuleId').value;
    var title    = document.getElementById('bunnyTitle').value.trim();
    var fileEl   = document.getElementById('bunnyFile');
    var order    = document.getElementById('bunnyOrder').value;
    var btn      = document.getElementById('bunnyUploadBtn');

    if (!moduleId) return alert('Please select a module.');
    if (!title) return alert('Please enter a lecture title.');
    if (!fileEl.files.length) return alert('Please select a video file.');

    var file=fileEl.files[0];
    if (file.size > 5120*1024*1024) return alert('Video file exceeds 5GB.');
    btn.disabled=true;
    btn.textContent='⏳ Uploading...';
    document.getElementById('bunnyProgress').style.display='block';
    setStatus('Uploading securely through Education Algorithm...', 'info');

    try {
        var form=new FormData();
        form.append('action','upload_video');
        form.append('module_id',moduleId);
        form.append('title',title);
        form.append('order',order);
        form.append('csrf_token','<?php echo csrf_token(); ?>');
        form.append('video',file);

        await new Promise(function(resolve,reject){
            var xhr=new XMLHttpRequest();
            xhr.open('POST','api-bunny.php');
            xhr.upload.onprogress=function(e){
                if(e.lengthComputable){
                    var pct=Math.round((e.loaded/e.total)*100);
                    document.getElementById('bunnyProgressBar').style.width=pct+'%';
                    document.getElementById('bunnyProgressText').textContent='Uploading: '+pct+'%';
                }
            };
            xhr.onload=function(){
                try {
                    var data=JSON.parse(xhr.responseText||'{}');
                    if(xhr.status>=200 && xhr.status<300 && data.success){ resolve(data); }
                    else { reject(new Error(data.error||('Upload failed: HTTP '+xhr.status))); }
                } catch(e){ reject(new Error('Invalid server response.')); }
            };
            xhr.onerror=function(){ reject(new Error('Network error during upload.')); };
            xhr.send(form);
        });

        document.getElementById('bunnyProgressBar').style.width='100%';
        setStatus('✅ Video uploaded and attached successfully. Refreshing...', 'success');
        window.setTimeout(function(){ window.location.reload(); },700);
    } catch(err) {
        setStatus('❌ Error: '+err.message,'error');
        btn.disabled=false;
        btn.textContent='🚀 Upload to Cloud CDN';
    }
}
</script>
</body>
</html>



