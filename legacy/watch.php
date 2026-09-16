<?php
$activePage = 'dashboard';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/gamification.php";
require_once __DIR__ . "/includes/security-events.php";

$studentId = requireStudent();

$videoId = (int)($_GET["id"] ?? 0);
$stmt = $pdo->prepare("
    SELECT v.*, m.title as module_title, m.id as module_id, m.course_id, c.title as course_title
    FROM videos v 
    JOIN modules m ON v.module_id = m.id 
    JOIN courses c ON m.course_id = c.id
    WHERE v.id = ?
");
$stmt->execute([$videoId]);
$video = $stmt->fetch();

if (!$video) {
    header("Location: dashboard");
    exit;
}

// Entitlement check
requireCourseAccess($studentId, $video['course_id']);

// Server-Authoritative Security Restriction Check
$activeSecurityEvent = getActiveLectureSecurityEvent($studentId, $videoId);
$isPlaybackRestricted = !empty($activeSecurityEvent);
$securityRemainingSec = $activeSecurityEvent ? max(0, (int)$activeSecurityEvent['remaining_seconds']) : 0;

// Fetch authenticated student details for dynamic anti-piracy watermarking
$stmtStInfo = $pdo->prepare("SELECT name, email FROM students WHERE id = ? LIMIT 1");
$stmtStInfo->execute([$studentId]);
$stInfo = $stmtStInfo->fetch();
$studentName = $stInfo['name'] ?? ($_SESSION['student_name'] ?? 'Scholar');
$studentEmail = $stInfo['email'] ?? ($_SESSION['student_email'] ?? 'student@example.com');

// Fetch all modules in this course for module switching
$courseModules = [];
try {
    $stmtModules = $pdo->prepare("SELECT id, title FROM modules WHERE course_id = ? ORDER BY id ASC");
    $stmtModules->execute([$video['course_id']]);
    $courseModules = $stmtModules->fetchAll();
} catch (Exception $e) {
    $courseModules = [];
}

// Fetch first video ID for each module
$firstVideoPerModule = [];
if (!empty($courseModules)) {
    try {
        $stmtFirstVids = $pdo->prepare("
            SELECT module_id, MIN(id) as first_video_id
            FROM videos 
            GROUP BY module_id
        ");
        $stmtFirstVids->execute();
        foreach ($stmtFirstVids->fetchAll() as $row) {
            $firstVideoPerModule[$row['module_id']] = (int)$row['first_video_id'];
        }
    } catch (Exception $e) {}
}

// Get other videos in the same module for the playlist
$playlist = [];
try {
    $stmt2 = $pdo->prepare("SELECT id, title, duration FROM videos WHERE module_id = ? ORDER BY sort_order ASC, id ASC");
    $stmt2->execute([$video["module_id"]]);
    $playlist = $stmt2->fetchAll();
} catch (Exception $e) {
    $playlist = [];
}

// Fetch module PDF Notes & Code Snippets for the in-player Resource Drawer
$moduleNotes = [];
try {
    $stmtNotes = $pdo->prepare("SELECT id, title, file_path FROM notes WHERE module_id = ? ORDER BY sort_order ASC, id ASC");
    $stmtNotes->execute([$video["module_id"]]);
    $moduleNotes = $stmtNotes->fetchAll();
} catch (Exception $e) {}

$moduleSnippets = [];
try {
    $stmtSnippets = $pdo->prepare("SELECT id, title, language FROM code_snippets WHERE module_id = ? ORDER BY sort_order ASC, id ASC");
    $stmtSnippets->execute([$video["module_id"]]);
    $moduleSnippets = $stmtSnippets->fetchAll();
} catch (Exception $e) {}

// Find previous and next video IDs
$prevVideoId = null;
$nextVideoId = null;
$currentIndex = -1;
foreach ($playlist as $idx => $item) {
    if ($item['id'] == $videoId) {
        $currentIndex = $idx;
        break;
    }
}
if ($currentIndex > 0) {
    $prevVideoId = $playlist[$currentIndex - 1]['id'];
}
if ($currentIndex >= 0 && $currentIndex < count($playlist) - 1) {
    $nextVideoId = $playlist[$currentIndex + 1]['id'];
}

// Completion state for videos in this module
$completedVideos = [];
$stmtComp = $pdo->prepare("
    SELECT item_id FROM lesson_completions 
    WHERE student_id = ? AND item_type = 'video'
");
$stmtComp->execute([$studentId]);
foreach ($stmtComp->fetchAll() as $row) {
    $completedVideos[$row['item_id']] = true;
}
$isCurrentComplete = isset($completedVideos[$videoId]);

// Student Identity for Dynamic DRM Anti-Piracy Watermark
$studentInfo = [];
try {
    $stmtUser = $pdo->prepare("SELECT name, email FROM students WHERE id = ?");
    $stmtUser->execute([$studentId]);
    $studentInfo = $stmtUser->fetch() ?: [];
} catch (Exception $e) {}
$studentEmail = $studentInfo['email'] ?? ($_SESSION['email'] ?? 'student@educationalgorithm.com');
$studentName = $studentInfo['name'] ?? ($_SESSION['student_name'] ?? 'Student');
$studentIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($video["title"]); ?> — Player Studio</title>
    
        <!-- EARLY-EXECUTION DRM SHIELD (Interception runs before extensions or DOM load) -->
    <script>
    (function() {
        // Global trigger function available instantly
        window.__eaTriggerRecordingBlackout = function(eventType, title, msg) {
            window.__eaRecordingBlocked = true;
            try {
                const payload = JSON.stringify({
                    action: 'log_event',
                    video_id: <?php echo $videoId; ?>,
                    course_id: <?php echo (int)$video['course_id']; ?>,
                    event_type: eventType || 'extension_interception',
                    _token: '<?php echo csrf_token(); ?>'
                });
                if (navigator.sendBeacon) {
                    navigator.sendBeacon('api-security-events.php?action=log_event', new Blob([payload], { type: 'application/json' }));
                }
            } catch(e) {}
            try {
                const veil = document.getElementById('drmBlackoutVeil');
                if (veil) {
                    if (title && document.getElementById('drmVeilTitle')) document.getElementById('drmVeilTitle').textContent = title;
                    if (msg && document.getElementById('drmVeilMsg')) document.getElementById('drmVeilMsg').textContent = msg;
                    veil.style.display = 'flex';
                }
                const v = document.querySelector('video#mainPlayer');
                if (v) {
                    v.pause();
                    v.style.opacity = '0';
                    v.style.visibility = 'hidden';
                }
                const iframe = document.querySelector('iframe#mainPlayer');
                if (iframe) {
                    iframe.style.opacity = '0';
                    iframe.style.visibility = 'hidden';
                    try { iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch(e){}
                }
            } catch(e) {}
        };

        // 1. HARD BLOCK ON MediaRecorder (Chrome Extensions like Loom, Screencastify, Vidyard)
        if (typeof window.MediaRecorder !== 'undefined') {
            const FakeMediaRecorder = function(stream, options) {
                window.__eaTriggerRecordingBlackout('media_recorder_intercept', 'EXTENSION RECORDING BLOCKED 🚫', 'Browser extension recording (MediaRecorder) is strictly prohibited. Playback has been halted.');
                throw new DOMException('MediaRecorder is restricted under Education Algorithm Content Protection Policy.', 'SecurityError');
            };
            FakeMediaRecorder.isTypeSupported = function() { return false; };
            try {
                Object.defineProperty(window, 'MediaRecorder', {
                    value: FakeMediaRecorder,
                    writable: false,
                    configurable: false
                });
            } catch(e) {
                window.MediaRecorder = FakeMediaRecorder;
            }
        }

        // 2. HARD BLOCK ON HTMLMediaElement.prototype.captureStream (Extension Stream Rippers)
        const blockCapture = function() {
            window.__eaTriggerRecordingBlackout('stream_rip_attempt', 'STREAM RIPPER BLOCKED 🚫', 'Direct video stream extraction is prohibited. Playback has been halted.');
            return new MediaStream();
        };

        try {
            if (HTMLMediaElement && HTMLMediaElement.prototype) {
                Object.defineProperty(HTMLMediaElement.prototype, 'captureStream', {
                    value: blockCapture,
                    writable: false,
                    configurable: false
                });
                if ('mozCaptureStream' in HTMLMediaElement.prototype) {
                    Object.defineProperty(HTMLMediaElement.prototype, 'mozCaptureStream', {
                        value: blockCapture,
                        writable: false,
                        configurable: false
                    });
                }
            }
        } catch(e) {}

        try {
            if (HTMLCanvasElement && HTMLCanvasElement.prototype) {
                Object.defineProperty(HTMLCanvasElement.prototype, 'captureStream', {
                    value: blockCapture,
                    writable: false,
                    configurable: false
                });
            }
        } catch(e) {}

        // 3. HARD INTERCEPT ON navigator.mediaDevices.getDisplayMedia (Screen Sharing / Recorders)
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getDisplayMedia = async function(constraints) {
                const stream = await origGetDisplayMedia(constraints);
                if (stream && stream.active) {
                    window.__eaTriggerRecordingBlackout('SCREEN RECORDING ACTIVE ⛔', 'Screen recording is active. Video playback is paused until recording stops.');
                    stream.getVideoTracks().forEach(track => {
                        track.onended = () => {
                            if (typeof window.autoResumePlayback === 'function') {
                                window.autoResumePlayback();
                            }
                        };
                    });
                }
                return stream;
            };
        }
    })();
    </script>

    <!-- Instant Pre-Paint Theme Initialization -->
    <script>
        (function() {
            try {
                const savedTheme = localStorage.getItem('ea_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch(e) {}
        })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="assets/command-palette.css?v=2.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
    <style>
        /* Executive Theater & Player Layout */
        .app-container {
            max-width: 1480px;
            margin: 0 auto;
            padding: 1rem 1.25rem 3rem;
        }

        .breadcrumb-nav {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.82rem;
            color: #64748b;
            margin-bottom: 0.75rem;
        }
        .breadcrumb-nav a {
            color: #4f46e5;
            text-decoration: none;
            font-weight: 600;
        }
        .breadcrumb-nav .separator {
            color: #94a3b8;
        }

        .theater-layout {
            display: grid;
            grid-template-columns: 2.5fr 1.1fr;
            gap: 1.5rem;
            align-items: start;
        }
        @media (max-width: 1024px) {
            .theater-layout {
                grid-template-columns: 1fr;
            }
        }

        .video-stage-wrapper {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        /* 16:9 Video Player Box */
        .video-player-box {
            background: #090d16;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.3);
            position: relative;
            aspect-ratio: 16 / 9;
            width: 100%;
            border: 1px solid #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
        }

        .video-player-box video,
        .video-player-box iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            object-fit: contain;
            outline: none;
            background: #000;
        }

        /* DRM Floating Watermark */
        .dynamic-drm-watermark {
            position: absolute;
            pointer-events: none;
            z-index: 40;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.15);
            color: rgba(255, 255, 255, 0.6);
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.74rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            border-radius: 6px;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
            letter-spacing: 0.04em;
            transition: top 2.5s ease-in-out, left 2.5s ease-in-out, opacity 1s ease-in-out;
            user-select: none;
            -webkit-user-select: none;
        }

        /* Edge-to-Edge Blackout Shield */
        .drm-blackout-veil {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000000;
            z-index: 2147483647;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            box-sizing: border-box;
            user-select: none;
            -webkit-user-select: none;
        }

        .drm-blackout-card {
            background: #090d16;
            border: 2px solid #ef4444;
            border-radius: 16px;
            padding: 2.5rem;
            max-width: 520px;
            width: 100%;
            text-align: center;
            box-shadow: 0 0 90px rgba(239, 68, 68, 0.6);
            box-sizing: border-box;
        }

        @keyframes drmPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(0.85); }
        }

        .drm-status-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.65rem;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #334155;
            padding: 0.75rem 1.25rem;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #94a3b8;
            font-weight: 500;
        }

        .drm-status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #ef4444;
            display: inline-block;
            box-shadow: 0 0 10px #ef4444;
            animation: drmPulse 1.2s infinite;
        }

        /* DRM Protection Banner below video */
        .drm-protection-banner {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.55rem 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.5rem;
            font-size: 0.76rem;
            color: #64748b;
        }
        .drm-protection-banner strong {
            color: #334155;
        }

        /* Video Quick Toolbar */
        .video-quick-bar {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 0.55rem 0.85rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.75rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }

        .video-quick-tools {
            display: flex;
            align-items: center;
            gap: 0.45rem;
            flex-wrap: wrap;
        }

        .video-tool-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #334155;
            padding: 0.35rem 0.65rem;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .video-tool-btn:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        .speed-pill-group {
            display: inline-flex;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 2px;
        }
        .speed-btn {
            background: transparent;
            border: none;
            color: #64748b;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.72rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }
        .speed-btn.active {
            background: #4f46e5;
            color: #ffffff;
            font-weight: 700;
        }

        .spotlight-kbd {
            font-family: monospace;
            font-size: 0.7rem;
            font-weight: 600;
            padding: 2px 5px;
            border-radius: 4px;
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #475569;
        }

        /* Video Action Bar */
        .video-action-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 1rem;
            padding: 0.5rem 0;
        }
        .video-action-bar h1 {
            font-size: 1.35rem;
            font-weight: 800;
            color: #0f172a;
            margin: 0;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.4rem;
            padding: 0.55rem 1.15rem;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 700;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
        }
        .btn-primary {
            background: #4f46e5;
            color: #ffffff;
        }
        .btn-primary:hover {
            background: #4338ca;
        }
        .btn-secondary {
            background: #f1f5f9;
            color: #334155;
            border: 1px solid #cbd5e1;
        }
        .btn-secondary:hover {
            background: #e2e8f0;
        }
        .btn-sm {
            padding: 0.4rem 0.85rem;
            font-size: 0.78rem;
        }

        /* Resource Sidebar Card & Playlist */
        .resource-drawer-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
        }

        .module-switcher-header {
            padding: 0.85rem 1rem;
            border-bottom: 1px solid #f1f5f9;
            background: #f8fafc;
        }
        .module-select-input {
            width: 100%;
            padding: 0.45rem 0.65rem;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 0.82rem;
            font-weight: 600;
            color: #0f172a;
            background: #ffffff;
            outline: none;
        }

        .resource-tabs-nav {
            display: flex;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 0 0.5rem;
        }
        .resource-tab-btn {
            flex: 1;
            padding: 0.65rem 0.4rem;
            background: transparent;
            border: none;
            border-bottom: 2px solid transparent;
            font-size: 0.78rem;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            text-align: center;
            transition: all 0.15s;
        }
        .resource-tab-btn.active {
            color: #4f46e5;
            border-bottom-color: #4f46e5;
            font-weight: 700;
            background: #ffffff;
        }

        .resource-tab-content {
            display: none;
            padding: 0.75rem;
            max-height: 480px;
            overflow-y: auto;
        }
        .resource-tab-content.active {
            display: block;
        }

        .resource-item-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.65rem 0.75rem;
            border-radius: 8px;
            text-decoration: none;
            color: #334155;
            margin-bottom: 0.35rem;
            transition: background 0.15s;
            border: 1px solid transparent;
        }
        .resource-item-row:hover {
            background: #f1f5f9;
        }
        .resource-item-row.active {
            background: #eef2ff;
            border-color: #c7d2fe;
            color: #4338ca;
            font-weight: 700;
        }

        .lesson-type-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 6px;
            background: #e0e7ff;
            color: #4338ca;
            font-size: 0.72rem;
            font-weight: 700;
            flex-shrink: 0;
        }

        .completion-check {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #f1f5f9;
            border: 1.5px solid #cbd5e1;
            color: transparent;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 800;
        }
        .completion-check.completed {
            background: #10b981;
            border-color: #10b981;
            color: #ffffff;
        }

        /* Autoplay Countdown Overlay */
        .autoplay-overlay {
            position: absolute;
            inset: 0;
            background: rgba(9, 13, 22, 0.95);
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            z-index: 30;
            border-radius: 12px;
            padding: 2rem;
        }
        .autoplay-overlay.active {
            display: flex !important;
        }

        /* Zen Mode */
        .theater-layout.zen-mode {
            grid-template-columns: 1fr;
        }
        .theater-layout.zen-mode .resource-drawer-card {
            display: none;
        }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container">
        <!-- Breadcrumb Bar -->
        <nav class="breadcrumb-nav" aria-label="Breadcrumb">
            <a href="dashboard">← Dashboard</a>
            <span class="separator">/</span>
            <span><?php echo e($video["course_title"]); ?></span>
            <span class="separator">/</span>
            <span style="color: var(--text-primary); font-weight: 500;"><?php echo e($video["module_title"]); ?></span>
        </nav>

        <div class="theater-layout">
            <!-- Video Stage (Left) -->
            <section class="video-stage-wrapper">
                <div class="video-player-box" id="videoBox" oncontextmenu="return false;" ondragstart="return false;" style="position: relative; overflow: hidden;">
                    <!-- SINGLE ELEGANT DYNAMIC WATERMARK -->
                    <div id="dynamicWatermark" class="dynamic-drm-watermark" style="top: 12%; left: 15%;">
                        🔒 <?php echo e($studentName); ?> • <?php echo e($studentEmail); ?> • #EA-<?php echo (int)$studentId; ?>
                    </div>

                    <?php if ($isPlaybackRestricted): ?>
                    <!-- 🛡️ SERVER-ENFORCED PERSISTENT SECURITY RESTRICTION (SURVIVES PAGE REFRESH) -->
                    <div class="drm-persistent-block-stage" id="serverBlockStage" style="position: absolute; inset: 0; background: #000000; z-index: 50; display: flex; align-items: center; justify-content: center; padding: 2rem; box-sizing: border-box;">
                        <div class="drm-blackout-card" style="background: #090d16; border: 2px solid #ef4444; border-radius: 16px; padding: 2.25rem; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 0 90px rgba(239, 68, 68, 0.6); box-sizing: border-box;">
                            <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">⛔</div>
                            <h2 style="color: #ef4444; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.4rem; text-transform: uppercase; letter-spacing: 0.04em;">PLAYBACK TEMPORARILY RESTRICTED</h2>
                            <p style="color: #cbd5e1; font-size: 0.88rem; line-height: 1.6; margin: 0 0 1.25rem;">
                                A server-authoritative security event (<strong><?php echo e($activeSecurityEvent['event_type']); ?></strong>) was recorded for this lecture. Video streaming is locked on the backend.
                            </p>
                            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #fca5a5; text-align: left; line-height: 1.6;">
                                <div>• <strong>Scholar:</strong> <?php echo e($studentName); ?> (#EA-<?php echo (int)$studentId; ?>)</div>
                                <div>• <strong>Email:</strong> <?php echo e($studentEmail); ?></div>
                                <div>• <strong>Violation ID:</strong> #SEC-<?php echo (int)$activeSecurityEvent['id']; ?></div>
                                <div>• <strong>Locked At:</strong> <?php echo e($activeSecurityEvent['detected_at']); ?></div>
                            </div>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center;">
                                <div class="drm-status-badge" style="background: rgba(15, 23, 42, 0.95); border: 1px solid #334155; padding: 0.65rem 1.15rem; border-radius: 8px; font-size: 0.82rem; color: #94a3b8;">
                                    <span class="drm-status-dot"></span>
                                    <span id="serverCooldownCountdown">Cooling period active: <strong id="serverCooldownNum" style="color: #f87171;"><?php echo $securityRemainingSec; ?></strong>s remaining</span>
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" id="btnResolveSecurity" onclick="requestSecurityResolution(<?php echo (int)$activeSecurityEvent['id']; ?>)" style="font-size: 0.82rem; padding: 0.45rem 1rem;" <?php echo ($securityRemainingSec > 0 ? 'disabled' : ''); ?>>
                                    🔄 Re-Verify & Resume Playback
                                </button>
                            </div>
                        </div>
                    </div>
                    <?php else: ?>
                    <?php
                    // Smart video source detection (Priority order):
                    // 1. bunny_video_id  → Bunny.net CDN (adaptive HLS, DRM, best quality)
                    // 2. youtube_id      → YouTube embed (free, zero server bandwidth)
                    // 3. video_url       → External CDN (Vimeo, custom Bunny URL, etc)
                    // 4. file_path       → Local MP4 via stream-video.php (dev/fallback only)

                    $bunnyVideoId = !empty($video['bunny_video_id']) ? trim($video['bunny_video_id']) : null;
                    $youtubeId    = !empty($video['youtube_id'])     ? trim($video['youtube_id'])     : null;
                    $externalUrl  = !empty($video['video_url'])      ? trim($video['video_url'])      : null;

                    // Extract YouTube ID from full URL if stored as URL
                    if (!$youtubeId && $externalUrl && preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w\-]{11})/', $externalUrl, $ytm)) {
                        $youtubeId = $ytm[1];
                    }

                    $BUNNY_LIBRARY_ID = env('BUNNY_LIBRARY_ID', '733405');
                    $BUNNY_API_KEY    = env('BUNNY_API_KEY', '');
                    $BUNNY_CDN_HOST   = env('BUNNY_CDN_HOSTNAME', 'iframe.mediadelivery.net');

                    // Smart extraction if instructor pasted full iframe URL or embed URL
                    if ($bunnyVideoId && $bunnyVideoId !== 'bunny_vid_auto') {
                        if (preg_match('/embed\/(\d+)\/([a-zA-Z0-9\-]+)/', $bunnyVideoId, $bm)) {
                            $BUNNY_LIBRARY_ID = $bm[1];
                            $bunnyVideoId = $bm[2];
                        } elseif (preg_match('/([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})/', $bunnyVideoId, $bm)) {
                            $bunnyVideoId = $bm[1];
                        }
                        $bunnyVideoId = strtok($bunnyVideoId, '?');
                    }

                    $hasLocalFile = !empty($video['file_path']) && file_exists(__DIR__ . '/' . $video['file_path']);

                    if ($bunnyVideoId && $bunnyVideoId !== 'bunny_vid_auto' && !empty($BUNNY_LIBRARY_ID)):
                        $bunnyEmbedUrl = "https://{$BUNNY_CDN_HOST}/embed/{$BUNNY_LIBRARY_ID}/{$bunnyVideoId}?autoplay=true&loop=false&muted=false&preload=true&responsive=true";
                    ?>
                    <!-- ENTERPRISE CLOUD CDN VIDEO — Bunny.net Adaptive HLS, DRM, zero server bandwidth -->
                    <iframe
                        id="mainPlayer"
                        src="<?php echo htmlspecialchars($bunnyEmbedUrl, ENT_QUOTES); ?>"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowfullscreen
                        loading="lazy"
                        style="width:100%; aspect-ratio:16/9; border-radius: 8px; background:#000;"
                        title="<?php echo e($video['title']); ?>"
                    ></iframe>
                    <?php elseif ($youtubeId): ?>
                    <!-- YOUTUBE HOSTED VIDEO — zero server bandwidth -->
                    <iframe
                        id="mainPlayer"
                        src="https://www.youtube-nocookie.com/embed/<?php echo htmlspecialchars($youtubeId, ENT_QUOTES); ?>?rel=0&modestbranding=1&enablejsapi=1&autoplay=1"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowfullscreen
                        style="width:100%; aspect-ratio:16/9; border-radius: 8px; background:#000;"
                        title="<?php echo e($video['title']); ?>"
                    ></iframe>
                    <?php elseif ($externalUrl): ?>
                    <!-- EXTERNAL VIDEO URL (Vimeo / CDN) -->
                    <iframe
                        id="mainPlayer"
                        src="<?php echo htmlspecialchars($externalUrl, ENT_QUOTES); ?>"
                        frameborder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowfullscreen
                        style="width:100%; aspect-ratio:16/9; border-radius: 8px; background:#000;"
                        title="<?php echo e($video['title']); ?>"
                    ></iframe>
                    <?php elseif ($hasLocalFile): ?>
                    <!-- LOCAL MP4 STREAM -->
                    <video id="mainPlayer" controls controlsList="nodownload noremoteplayback" disablePictureInPicture="true" preload="metadata" oncontextmenu="return false;" style="width:100%; aspect-ratio:16/9; border-radius: 8px; background:#000;">
                        <source src="<?php echo e('stream-video.php?id=' . $video['id']); ?>" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <?php else: ?>
                    <!-- STUDIO PREVIEW CARD (When lecture is pending upload) -->
                    <div style="width:100%; aspect-ratio:16/9; border-radius:12px; background:linear-gradient(135deg, #090d16, #141b2b); display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:2rem; border:1px solid #1e293b; color:#fff;">
                        <div style="width:58px; height:58px; border-radius:50%; background:rgba(99,102,241,0.15); border:2px solid #6366f1; display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin-bottom:0.85rem;">
                            🎬
                        </div>
                        <h3 style="margin:0 0 0.35rem; font-size:1.15rem; font-weight:800; color:#fff;"><?php echo e($video['title']); ?></h3>
                        <p style="color:#94a3b8; font-size:0.82rem; max-width:400px; margin:0 0 1rem; line-height:1.5;">
                            This lecture stream is being prepared by faculty. You can explore the accompanying notes and code snippets.
                        </p>
                    </div>
                    <?php endif; ?>





                    <?php endif; // End of !isPlaybackRestricted ?>

                    <!-- 100% AUTOMATED SCREEN RECORDING LOCKOUT (NO MANUAL BUTTONS) -->
                    <div class="drm-blackout-veil" id="drmBlackoutVeil" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #000000; z-index: 2147483647; display: none; align-items: center; justify-content: center; padding: 2rem; box-sizing: border-box;">
                        <div style="background: #090d16; border: 2px solid #ef4444; border-radius: 16px; padding: 2.5rem; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 0 90px rgba(239, 68, 68, 0.6); box-sizing: border-box;">
                            <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">⛔</div>
                            <h2 style="color: #ef4444; font-size: 1.35rem; font-weight: 800; margin: 0 0 0.4rem; text-transform: uppercase; letter-spacing: 0.04em;" id="drmVeilTitle">SCREEN RECORDING ACTIVE</h2>
                            <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin: 0 0 1.5rem;" id="drmVeilMsg">
                                Video playback is <strong>locked</strong>. Recording, screen captures, or streaming of Education Algorithm lectures are strictly prohibited.
                            </p>
                            <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 0.85rem 1rem; margin-bottom: 1.5rem; font-size: 0.82rem; color: #fca5a5; text-align: left; line-height: 1.6;">
                                <div>• <strong>Scholar:</strong> <?php echo e($studentName); ?> (#EA-<?php echo (int)$studentId; ?>)</div>
                                <div>• <strong>Email:</strong> <?php echo e($studentEmail); ?></div>
                                <div>• <strong>Protection:</strong> Automated DRM Sensor Active</div>
                            </div>
                            <div style="display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; background: rgba(15, 23, 42, 0.9); border: 1px solid #334155; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.85rem; color: #94a3b8;">
                                <span style="width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block; box-shadow: 0 0 10px #ef4444; animation: pulse 1s infinite;"></span>
                                <span id="autoResumeStatusText">Waiting for recording to stop... Video will resume automatically.</span>
                            </div>
                        </div>
                    </div>

                    <!-- Next Lecture Autoplay Countdown Modal -->
                    <div class="autoplay-overlay" id="autoplayOverlay" style="display: none;">
                        <span style="font-size: 2rem; margin-bottom: 0.35rem;">🎬</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin-bottom: 0.25rem;">Lecture Finished!</h3>
                        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1rem;">
                            Next lecture starting in <strong id="countdownNum" style="color: #6366f1; font-size: 1.1rem;">5</strong> seconds...
                        </p>
                        <div style="display: flex; gap: 0.65rem;">
                            <?php if ($nextVideoId): ?>
                                <a href="watch?id=<?php echo $nextVideoId; ?>" class="btn btn-primary btn-sm">
                                    Play Next Now →
                                </a>
                            <?php endif; ?>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelAutoplay()">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Advanced Video Quick Bar -->
                <!-- Intellectual Property & Anti-Recording Notice -->
                <div class="drm-protection-banner">
                    <div style="display: flex; align-items: center; gap: 0.45rem;">
                        <span>🛡️</span>
                        <span><strong>Protected Content:</strong> Unauthorized recording or redistribution is strictly prohibited and digitally fingerprinted to <strong><?php echo e($studentName); ?> (#EA-<?php echo (int)$studentId; ?>)</strong>.</span>
                    </div>
                    <span style="font-size: 0.72rem; color: #64748b;">EA DRM Guard Active</span>
                </div>

                <div class="video-quick-bar" style="margin-top: 0.75rem;">
                    <div class="video-quick-tools">
                        <button type="button" class="video-tool-btn" onclick="seekVideo(-10)" title="Rewind 10 seconds">
                            ↺ -10s
                        </button>
                        <button type="button" class="video-tool-btn" onclick="seekVideo(10)" title="Forward 10 seconds">
                            +10s ↻
                        </button>
                        <button type="button" class="video-tool-btn" onclick="togglePiP()" title="Picture-in-Picture">
                            ⧉ PiP
                        </button>
                        <button type="button" class="video-tool-btn" onclick="toggleZenMode()" id="zenToggleBtn" title="Distraction-Free Zen View">
                            🗖 Zen Mode
                        </button>
                        
                        <div class="speed-pill-group" title="Playback Speed">
                            <button type="button" class="speed-btn" onclick="setSpeed(0.75, this)">0.75x</button>
                            <button type="button" class="speed-btn active" onclick="setSpeed(1.0, this)">1x</button>
                            <button type="button" class="speed-btn" onclick="setSpeed(1.25, this)">1.25x</button>
                            <button type="button" class="speed-btn" onclick="setSpeed(1.5, this)">1.5x</button>
                            <button type="button" class="speed-btn" onclick="setSpeed(2.0, this)">2x</button>
                        </div>
                    </div>

                    <div style="font-size: 0.72rem; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem;">
                        <span>⌨️ Hotkeys:</span>
                        <span class="spotlight-kbd" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">Space</span>
                        <span class="spotlight-kbd" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">← → 5s</span>
                        <span class="spotlight-kbd" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">M</span>
                        <span class="spotlight-kbd" style="background: rgba(255,255,255,0.08); color: #cbd5e1;">F</span>
                    </div>
                </div>

                <!-- Video Title & Completion Action Bar -->
                <div class="video-action-bar">
                    <div>
                        <h1><?php echo e($video["title"]); ?></h1>
                        <p style="font-size: 0.82rem; margin-top: 0.2rem; color: var(--text-muted);">
                            Module: <?php echo e($video["module_title"]); ?>
                        </p>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                        <!-- Ask Faculty Fast Link -->
                        <a href="support?subject=<?php echo urlencode('Question regarding: ' . $video['title']); ?>&context=<?php echo urlencode("Module: " . $video['module_title'] . "\nLecture: " . $video['title'] . "\n\nMy Question:\n"); ?>" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;" title="Ask an instructor a question about this lecture">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            <span>Ask Faculty</span>
                        </a>

                        <form method="POST" action="mark-complete" style="margin:0;">
                            <?php echo csrf_field(); ?>
                            <input type="hidden" name="type" value="video">
                            <input type="hidden" name="id" value="<?php echo $videoId; ?>">
                            <input type="hidden" name="redirect" value="<?php echo e('watch.php?id=' . $videoId); ?>">
                            <button type="submit" class="btn <?php echo $isCurrentComplete ? 'btn-success' : 'btn-primary'; ?> btn-sm">
                                <?php if ($isCurrentComplete): ?>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Completed</span>
                                <?php else: ?>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>
                                    <span>Mark as Complete</span>
                                <?php endif; ?>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Navigation Controls -->
                <div class="video-nav-controls" style="justify-content: space-between;">
                    <?php if ($prevVideoId): ?>
                        <a href="watch?id=<?php echo $prevVideoId; ?>" class="btn btn-secondary btn-sm">
                            ← Previous Lecture
                        </a>
                    <?php else: ?>
                        <div></div>
                    <?php endif; ?>

                    <?php if ($nextVideoId): ?>
                        <a href="watch?id=<?php echo $nextVideoId; ?>" class="btn btn-primary btn-sm">
                            Next Lecture →
                        </a>
                    <?php endif; ?>
                </div>
            </section>

            <!-- Resource Drawer & Study Hub (Right) -->
            <aside class="resource-drawer-card">
                <!-- Tab Navigation Bar -->
                <div class="resource-drawer-tabs">
                    <button type="button" class="resource-tab-btn active" onclick="switchResourceTab('playlist', this)">
                        🎬 Lectures (<?php echo count($playlist); ?>)
                    </button>
                    <button type="button" class="resource-tab-btn" onclick="switchResourceTab('notes', this)">
                        📄 Notes (<?php echo count($moduleNotes); ?>)
                    </button>
                    <button type="button" class="resource-tab-btn" onclick="switchResourceTab('code', this)">
                        💻 Code (<?php echo count($moduleSnippets); ?>)
                    </button>
                    <button type="button" class="resource-tab-btn" onclick="switchResourceTab('tsnotes', this)">
                        📝 Notes
                    </button>
                </div>

                <!-- Tab 1: Video Playlist -->
                <div class="resource-tab-content active" id="tab-playlist">
                    <?php if (empty($playlist)): ?>
                        <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
                            No lectures in this module.
                        </div>
                    <?php else: ?>
                        <?php foreach ($playlist as $index => $item):
                            $isActive = ($item['id'] == $videoId);
                            $isDone = isset($completedVideos[$item['id']]);
                        ?>
                        <a href="watch?id=<?php echo $item['id']; ?>" class="resource-item-row <?php echo $isActive ? 'active' : ''; ?>">
                            <div style="display: flex; align-items: center; gap: 0.65rem; max-width: 82%;">
                                <div class="lesson-type-badge video" style="width: 22px; height: 22px; font-size: 0.72rem; flex-shrink: 0;">
                                    <?php echo $index + 1; ?>
                                </div>
                                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.84rem;"><?php echo e($item["title"]); ?></span>
                            </div>
                            <div class="completion-check <?php echo $isDone ? 'completed' : ''; ?>" style="width: 17px; height: 17px; font-size: 0.65rem; flex-shrink: 0;">
                                ✓
                            </div>
                        </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <!-- Tab 2: Module PDF Notes -->
                <div class="resource-tab-content" id="tab-notes">
                    <?php if (empty($moduleNotes)): ?>
                        <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
                            No PDF notes attached to this module.
                        </div>
                    <?php else: ?>
                        <?php foreach ($moduleNotes as $mn): ?>
                        <a href="note-view?id=<?php echo $mn['id']; ?>" class="resource-item-row">
                            <div style="display: flex; align-items: center; gap: 0.65rem;">
                                <span style="font-size: 1.1rem;">📄</span>
                                <span style="font-size: 0.84rem; font-weight: 500;"><?php echo e($mn['title']); ?></span>
                            </div>
                            <span class="badge neutral" style="font-size: 0.68rem;">PDF</span>
                        </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <!-- Tab 3: Module Code Snippets -->
                <div class="resource-tab-content" id="tab-code">
                    <?php if (empty($moduleSnippets)): ?>
                        <div style="padding: 1.5rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.82rem;">
                            No code snippets attached to this module.
                        </div>
                    <?php else: ?>
                        <?php foreach ($moduleSnippets as $ms): ?>
                        <a href="code-view?id=<?php echo $ms['id']; ?>" class="resource-item-row">
                            <div style="display: flex; align-items: center; gap: 0.65rem;">
                                <span style="font-size: 1.1rem;">💻</span>
                                <span style="font-size: 0.84rem; font-weight: 500;"><?php echo e($ms['title']); ?></span>
                            </div>
                            <span class="badge neutral" style="font-size: 0.68rem;"><?php echo strtoupper(e($ms['language'])); ?></span>
                        </a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <!-- Tab 4: In-Player Timestamp Notes -->
                <div class="resource-tab-content" id="tab-tsnotes">
                    <div class="ts-notes-wrapper">
                        <div style="display: flex; gap: 0.45rem; margin-bottom: 0.75rem;">
                            <button type="button" class="btn btn-secondary btn-sm" onclick="captureTimestamp()" style="padding: 0.35rem 0.55rem; font-size: 0.75rem; white-space: nowrap;">
                                ⏱️ <span id="currentTsDisplay">00:00</span>
                            </button>
                            <input type="text" id="tsNoteInput" placeholder="Add study note at timestamp..." style="padding: 0.35rem 0.6rem; font-size: 0.8rem;" maxlength="250">
                            <button type="button" class="btn btn-primary btn-sm" onclick="saveTimestampNote()" style="padding: 0.35rem 0.65rem;">
                                Save
                            </button>
                        </div>

                        <div id="tsNotesList">
                            <div style="text-align: center; color: #94a3b8; font-size: 0.78rem; padding: 1rem 0;">
                                Loading notes...
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    </main>

<script>
    const player = document.getElementById('mainPlayer');
    const csrfToken = '<?php echo csrf_token(); ?>';
    const videoId = <?php echo $videoId; ?>;
    const courseId = <?php echo (int)$video['course_id']; ?>;
    let nextVideoUrl = <?php echo $nextVideoId ? json_encode('watch.php?id=' . $nextVideoId) : 'null'; ?>;
    let countdownInterval = null;

    // Server-Authoritative State Flags from PHP
    const isServerRestricted = <?php echo $isPlaybackRestricted ? 'true' : 'false'; ?>;
    let currentSecurityEventId = <?php echo $activeSecurityEvent ? (int)$activeSecurityEvent['id'] : 'null'; ?>;
    let activeMediaStreams = [];

    // 1. Playback Speed Controller
    function setSpeed(speed, btn) {
        if (player) {
            player.playbackRate = speed;
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');
            if (window.showToast) window.showToast('info', `Speed: ${speed}x`, 1500);
        }
    }

    // 2. Relative Seeker
    function seekVideo(seconds) {
        if (player) {
            player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + seconds));
        }
    }

    // 3. Picture-in-Picture
    async function togglePiP() {
        if (!player) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                await player.requestPictureInPicture();
            }
        } catch (err) {
            console.error(err);
        }
    }

    // 4. Keyboard Hotkeys Listener
    document.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (isServerRestricted) return;
            if (player) {
                if (player.paused) player.play(); else player.pause();
            }
        } else if (e.code === 'ArrowLeft') {
            seekVideo(-5);
        } else if (e.code === 'ArrowRight') {
            seekVideo(5);
        } else if (e.key.toLowerCase() === 'm') {
            if (player) player.muted = !player.muted;
        } else if (e.key.toLowerCase() === 'f') {
            if (player) {
                if (!document.fullscreenElement) {
                    player.requestFullscreen().catch(() => {});
                } else {
                    document.exitFullscreen().catch(() => {});
                }
            }
        }
    });

    // 5. Autoplay Next Countdown
    if (player) {
        player.addEventListener('ended', () => {
            if (nextVideoUrl) {
                const overlay = document.getElementById('autoplayOverlay');
                const countdownEl = document.getElementById('countdownNum');
                if (overlay) overlay.classList.add('active');
                let timeLeft = 5;
                if (countdownEl) countdownEl.textContent = timeLeft;

                countdownInterval = setInterval(() => {
                    timeLeft--;
                    if (countdownEl) countdownEl.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        clearInterval(countdownInterval);
                        window.location.href = nextVideoUrl;
                    }
                }, 1000);
            }
        });
    }

    function cancelAutoplay() {
        clearInterval(countdownInterval);
        const overlay = document.getElementById('autoplayOverlay');
        if (overlay) overlay.classList.remove('active');
    }

    // 6. Resource Drawer Tab Switcher
    function switchResourceTab(tabName, btn) {
        document.querySelectorAll('.resource-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.resource-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById('tab-' + tabName);
        if (target) target.classList.add('active');
        if (tabName === 'tsnotes') {
            loadTimestampNotes();
        }
    }

    // 7. In-Video Timestamp Notes
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    if (player) {
        player.addEventListener('timeupdate', () => {
            const display = document.getElementById('currentTsDisplay');
            if (display) {
                display.textContent = formatTime(player.currentTime);
            }
        });
    }

    let capturedSec = 0;
    function captureTimestamp() {
        if (!player) return;
        capturedSec = Math.floor(player.currentTime);
        const display = document.getElementById('currentTsDisplay');
        if (display) display.textContent = formatTime(capturedSec);
        const input = document.getElementById('tsNoteInput');
        if (input) input.focus();
    }

    function jumpToTime(seconds) {
        if (player && !isServerRestricted) {
            player.currentTime = seconds;
            player.play();
        }
    }

    function loadTimestampNotes() {
        const container = document.getElementById('tsNotesList');
        if (!container) return;
        fetch(`api-video-notes.php?action=list&video_id=${videoId}`)
            .then(res => res.json())
            .then(data => {
                const notes = data.notes || [];
                if (!notes.length) {
                    container.innerHTML = '<div style="text-align: center; color: #94a3b8; font-size: 0.78rem; padding: 1.25rem 0;">No personal notes yet. Pause the video and write key concepts!</div>';
                    return;
                }

                container.innerHTML = '';
                notes.forEach(n => {
                    const item = document.createElement('div');
                    item.className = 'ts-note-item';
                    item.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span class="ts-badge" onclick="jumpToTime(${n.timestamp_sec})" title="Click to jump">
                                ⏱️ ${formatTime(n.timestamp_sec)}
                            </span>
                            <button type="button" onclick="deleteNote(${n.id})" style="background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 0.75rem;" title="Delete note">✕</button>
                        </div>
                        <p style="margin: 0; color: #334155; line-height: 1.4;">${escapeHtml(n.note_text)}</p>
                    `;
                    container.appendChild(item);
                });
            });
    }

    function saveTimestampNote() {
        const input = document.getElementById('tsNoteInput');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;

        const sec = capturedSec || (player ? Math.floor(player.currentTime) : 0);
        const formData = new FormData();
        formData.append('action', 'create');
        formData.append('video_id', videoId);
        formData.append('timestamp_sec', sec);
        formData.append('note_text', text);
        formData.append('_token', csrfToken);

        fetch('api-video-notes.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                input.value = '';
                loadTimestampNotes();
                if (window.showToast) window.showToast('success', 'Timestamp note saved!');
            }
        });
    }

    function deleteNote(noteId) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('video_id', videoId);
        formData.append('note_id', noteId);
        formData.append('_token', csrfToken);

        fetch('api-video-notes.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadTimestampNotes();
            }
        });
    }

    function escapeHtml(str) {
        return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
    }

    // Zen Mode Toggle
    function toggleZenMode() {
        const layout = document.querySelector('.theater-layout');
        const btn = document.getElementById('zenToggleBtn');
        if (layout) {
            layout.classList.toggle('zen-mode');
            const isZen = layout.classList.contains('zen-mode');
            if (btn) btn.innerHTML = isZen ? '🗗 Standard' : '🗖 Zen Mode';
            if (window.showToast) window.showToast('info', isZen ? 'Zen Focus Mode enabled' : 'Standard view restored', 1500);
        }
    }

    // Playback Resume Memory (Disabled during restriction)
    const resumeKey = 'video_resume_' + videoId;
    if (player && !isServerRestricted) {
        player.addEventListener('timeupdate', () => {
            if (player.currentTime > 5 && !player.ended) {
                localStorage.setItem(resumeKey, Math.floor(player.currentTime));
            }
        });

        player.addEventListener('ended', () => {
            localStorage.removeItem(resumeKey);
        });

        window.addEventListener('DOMContentLoaded', () => {
            const savedSec = parseInt(localStorage.getItem(resumeKey), 10);
            if (savedSec && savedSec > 10) {
                const mins = Math.floor(savedSec / 60);
                const secs = String(savedSec % 60).padStart(2, '0');
                player.currentTime = savedSec;
                if (window.showToast) {
                    window.showToast('info', `Resumed lecture from ${mins}:${secs}`, 2500);
                }
            }
        });
    }

    // =========================================================
    // 🛡️ SERVER-AUTHORITATIVE SECURITY ENGINE (ZERO AUTO-TIMERS)
    // =========================================================

    // 1. Authorized Resolution Request Flow
    async function requestSecurityResolution(eventId) {
        const btn = document.getElementById('btnResolveSecurity');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Verifying with server...';
        }

        try {
            const res = await fetch('api-security-events.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken
                },
                body: JSON.stringify({
                    action: 'resolve',
                    event_id: eventId || currentSecurityEventId,
                    video_id: videoId,
                    _token: csrfToken
                })
            });
            const data = await res.json();
            if (data.success) {
                if (window.showToast) window.showToast('success', 'Security restriction resolved! Reloading...');
                setTimeout(() => { window.location.reload(); }, 600);
            } else {
                alert(data.error || 'Resolution request denied by server.');
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = '🔄 Re-Verify & Resume Playback';
                }
            }
        } catch(e) {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔄 Re-Verify & Resume Playback';
            }
        }
    }

    // 2. Persist Security Event to Backend Server
    function notifyServerSecurityEvent(eventType, metadata = {}) {
        const payload = JSON.stringify({
            action: 'log_event',
            video_id: videoId,
            course_id: courseId,
            event_type: eventType,
            metadata: metadata,
            _token: csrfToken
        });

        // 1. Beacon for guaranteed delivery on unload
        try {
            if (navigator.sendBeacon) {
                const blob = new Blob([payload], { type: 'application/json' });
                navigator.sendBeacon('api-security-events.php?action=log_event', blob);
            }
        } catch(e) {}

        // 2. Direct Async Fetch
        fetch('api-security-events.php?action=log_event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: payload
        }).then(r => r.json()).then(data => {
            if (data.success && data.eventId) {
                currentSecurityEventId = data.eventId;
            }
        }).catch(() => {});
    }

    // 3. Trigger Server-Authoritative Lockdown
    function triggerSupportedSecurityViolation(eventType, title, msg) {
        // Halt and blank out video immediately
        const video = document.querySelector('video#mainPlayer');
        if (video) {
            video.pause();
            video.style.opacity = '0';
            video.style.visibility = 'hidden';
            video.src = '';
        }
        if (player && typeof player.pause === 'function') {
            player.pause();
        }
        const iframe = document.querySelector('iframe#mainPlayer');
        if (iframe) {
            iframe.style.opacity = '0';
            iframe.style.visibility = 'hidden';
            try { iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*'); } catch(e) {}
            iframe.src = 'about:blank';
        }

        // Persist event to database backend
        notifyServerSecurityEvent(eventType, { timestamp: new Date().toISOString(), url: window.location.href });

        // Display persistent violation overlay (NO AUTO-TIMER)
        const veil = document.getElementById('drmBlackoutVeil');
        if (veil) {
            if (title && document.getElementById('drmVeilTitle')) document.getElementById('drmVeilTitle').textContent = title;
            if (msg && document.getElementById('drmVeilMsg')) document.getElementById('drmVeilMsg').textContent = msg;
            const statusText = document.getElementById('autoResumeStatusText');
            if (statusText) statusText.innerHTML = '🔒 Security violation persisted to server. Playback locked.';
            veil.style.display = 'flex';
        }
    }

    // 4. Supported Screen Recording Interception (getDisplayMedia)
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = async function(constraints) {
            const stream = await originalGetDisplayMedia(constraints);
            if (stream && stream.active) {
                activeMediaStreams.push(stream);
                triggerSupportedSecurityViolation('get_display_media', 'SCREEN RECORDING DETECTED ⛔', 'Active screen recording detected. Playback has been permanently locked on the server.');
            }
            return stream;
        };
    }

    // 5. Normal Tab Switch / Minimize: Pause Locally Without Backend Violation
    document.addEventListener('visibilitychange', function() {
        const video = document.querySelector('video#mainPlayer');
        if (document.hidden) {
            if (video && !video.paused) {
                video.pause();
                video.__wasPausedByTabSwitch = true;
            }
        } else {
            if (video && video.__wasPausedByTabSwitch && !isServerRestricted) {
                video.__wasPausedByTabSwitch = false;
                video.play().catch(() => {});
            }
        }
    });

    // 6. Screenshot / Snipping Shortcut Interception
    window.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
            triggerSupportedSecurityViolation('screen_capture_shortcut', 'SCREENSHOT CAPTURE DETECTED', 'Screenshot shortcut detected. Security violation recorded on backend.');
        }
    });

    window.addEventListener('keydown', function(e) {
        const key = e.key ? e.key.toLowerCase() : '';
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (key === 's' || key === '3' || key === '4')) {
            e.preventDefault();
            triggerSupportedSecurityViolation('screen_capture_shortcut', 'SCREEN SNIPPING DETECTED', 'Snipping tool shortcut detected. Security violation recorded on backend.');
            return false;
        }
    });

    // 7. Dynamic Watermark Position Drifter
    (function() {
        const wm = document.getElementById('dynamicWatermark');
        const box = document.getElementById('videoBox');
        if (!wm || !box) return;
        const positions = [
            { top: '12%', left: '8%' }, { top: '15%', left: '55%' },
            { top: '48%', left: '12%' }, { top: '45%', left: '50%' },
            { top: '75%', left: '10%' }, { top: '72%', left: '52%' }
        ];
        function driftWatermark() {
            const p = positions[Math.floor(Math.random() * positions.length)];
            wm.style.top = p.top;
            wm.style.left = p.left;
            wm.style.opacity = (0.45 + Math.random() * 0.25).toFixed(2);
        }
        driftWatermark();
        setInterval(driftWatermark, 4000);
    })();
    </script>

    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
