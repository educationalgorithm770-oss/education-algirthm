<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$adminActive = 'ai-studio';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";
require_once __DIR__ . "/includes/course-service.php";

$adminId = requireAdmin();
$message = "";
$error = "";

// -------------------------------------------------------------
// POST ACTION ROUTING (Handled through CourseService)
// -------------------------------------------------------------
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    verify_csrf();
    $action = $_POST['action'] ?? '';

    // 1. AI Synthesize & Create Draft Course
    if ($action === 'synthesize_draft') {
        $topic = clean_text($_POST['course_topic'] ?? '', 150);
        $weeks = max(1, min(24, (int)($_POST['course_weeks'] ?? 4)));
        $price = validate_integer_range($_POST['course_price'] ?? 15000, 0, 1000000, 15000);
        $level = clean_text($_POST['course_level'] ?? 'Intermediate', 50);
        $desc = clean_text($_POST['course_desc'] ?? "Comprehensive {$weeks}-Week curriculum covering {$topic} from core paradigms to production architecture.", 1000);

        if (!empty($topic)) {
            $weekThemes = [
                1 => ['title' => 'Core Architecture, Paradigms & Foundations', 'focus' => ['Ecosystem Setup & Toolchain', 'Core Syntax & Paradigm Principles', 'Hands-On Lab: First Working Endpoint']],
                2 => ['title' => 'Data Structures, State Management & Concurrency', 'focus' => ['State Architecture & Data Flow', 'Asynchronous Operations & Event Loops', 'Unit Testing & Automated Assertion Suites']],
                3 => ['title' => 'APIs, High-Throughput Routing & Data Persistence', 'focus' => ['RESTful & GraphQL Schema Design', 'Database Modeling & Query Indexing', 'Authentication, Session Tokens & Middleware']],
                4 => ['title' => 'Containerization, Cloud Infrastructure & CI/CD', 'focus' => ['Docker Containerization Multi-Stage Builds', 'Automated CI/CD Test & Deploy Pipelines', 'Cloud Deployment & Environment Hardening']],
                5 => ['title' => 'Microservices, Event Streams & Message Queues', 'focus' => ['Decoupled Service Architectures', 'Kafka/RabbitMQ Event Driven Messaging', 'Service Discovery & Distributed Tracing']],
                6 => ['title' => 'Caching Strategies, Performance & Latency Tuning', 'focus' => ['Redis In-Memory Key-Value Caching', 'CDN Edge Caching & Compression', 'Database Connection Pooling & Query Optimization']],
                7 => ['title' => 'Production Security, OWASP Hardening & Audits', 'focus' => ['Zero-Trust Architecture & Threat Modeling', 'Rate Limiting, WAF & DDoS Mitigation', 'Secret Management & Encryption at Rest']],
                8 => ['title' => 'Full-Stack Integration, Telemetry & APM Monitoring', 'focus' => ['End-to-End User Flow Implementation', 'Prometheus & Grafana Metrics Dashboards', 'Error Sentry Tracking & Log Aggregation']],
                9 => ['title' => 'Algorithmic Optimization & Advanced Design Patterns', 'focus' => ['Factory, Observer & Strategy Patterns', 'Memory Leak Profiling & Garbage Collection', 'Load Testing under Simulated High Traffic']],
                10 => ['title' => 'Production Scaling, Resilience & Disaster Recovery', 'focus' => ['Database Replication & Read Replicas', 'Multi-Region High Availability Design', 'Circuit Breakers & Fault Tolerance Patterns']],
                11 => ['title' => 'Capstone Architecture, Code Reviews & Defense', 'focus' => ['System Design RFC Formulation', 'Peer Code Review & Refactoring Sprint', 'End-to-End Stress Testing Benchmarks']],
                12 => ['title' => 'Production Launch, Final Defense & Certification', 'focus' => ['Zero-Downtime Blue-Green Deployment', 'Executive Project Showcase & Portfolio Demo', 'Graduation, Peer Defense & Verified Credential']]
            ];

            $modules = [];
            for ($w = 1; $w <= $weeks; $w++) {
                $themeIndex = (($w - 1) % 12) + 1;
                $theme = $weekThemes[$themeIndex];
                $modTitle = "Week {$w}: {$theme['title']} of {$topic}";
                
                $lessons = [];
                foreach ($theme['focus'] as $idx => $f) {
                    $lessons[] = "{$w}." . ($idx + 1) . " {$f} in {$topic}";
                }

                $modules[] = [
                    'week' => "Week {$w}",
                    'title' => $modTitle,
                    'lessons' => $lessons
                ];
            }

            $res = CourseService::createDraftCourse([
                'title' => $topic,
                'price' => $price,
                'level' => $level,
                'duration' => "{$weeks} Weeks (" . ($weeks * 3) . " Modules)",
                'description' => $desc
            ], $adminId, $modules);

            if ($res['success']) {
                $newDraftId = $res['course_id'];
                $message = "✨ Draft Course '{$topic}' synthesized successfully (ID #{$newDraftId}, Price: ₹" . number_format($price) . ")! Please review below and Publish when ready.";
                $_SESSION['last_synthesized_course_id'] = $newDraftId;
            } else {
                $error = $res['error'];
            }
        } else {
            $error = "Please enter a valid course topic.";
        }
    }

    // 2. Publish Course
    elseif ($action === 'publish_course') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $res = CourseService::publishCourse($cId, $adminId);
        if ($res['success']) {
            $message = "🚀 " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 3. Unpublish Course
    elseif ($action === 'unpublish_course') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $res = CourseService::unpublishCourse($cId, $adminId);
        if ($res['success']) {
            $message = "⏸️ " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 4. Archive Course
    elseif ($action === 'archive_course') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $res = CourseService::archiveCourse($cId, $adminId);
        if ($res['success']) {
            $message = "📦 " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 5. Restore Course
    elseif ($action === 'restore_course') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $target = clean_text($_POST['target_status'] ?? 'draft', 20);
        $res = CourseService::restoreCourse($cId, $target, $adminId);
        if ($res['success']) {
            $message = "🔄 " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 6. Update Price Tag
    elseif ($action === 'update_price') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $newPrice = validate_integer_range($_POST['course_price'] ?? 15000, 0, 1000000, 15000);
        $res = CourseService::updatePrice($cId, $newPrice, $adminId);
        if ($res['success']) {
            $message = "🏷️ " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 7. Edit Course Details
    elseif ($action === 'edit_course_details') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $res = CourseService::updateCourse($cId, [
            'title' => $_POST['course_title'] ?? '',
            'description' => $_POST['course_desc'] ?? '',
            'level' => $_POST['course_level'] ?? '',
            'duration' => $_POST['course_duration'] ?? ''
        ], $adminId);
        if ($res['success']) {
            $message = "✅ " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }

    // 8. Delete Draft Course (Strictly Checked for 0 Dependencies)
    elseif ($action === 'delete_course') {
        $cId = validate_integer_range($_POST['course_id'] ?? 0, 1, 100000, 0);
        $res = CourseService::deleteCourse($cId, $adminId);
        if ($res['success']) {
            $message = "🗑️ " . $res['message'];
        } else {
            $error = $res['error'];
        }
    }
}

// Fetch Courses and Stats
$allCourses = CourseService::getAllCoursesAdmin();
$auditLogs = CourseService::getAuditLogs(null, 15);

$totalCount = count($allCourses);
$pubCount = 0;
$draftCount = 0;
$archCount = 0;
$unpubCount = 0;

foreach ($allCourses as $c) {
    if ($c['status'] === 'published') $pubCount++;
    elseif ($c['status'] === 'draft') $draftCount++;
    elseif ($c['status'] === 'archived') $archCount++;
    elseif ($c['status'] === 'unpublished') $unpubCount++;
}

// Check if a specific draft was just created to preview
$previewDraftId = (int)($_GET['preview_draft'] ?? ($_SESSION['last_synthesized_course_id'] ?? 0));
$previewCourse = null;
$previewModules = [];
if ($previewDraftId > 0) {
    $previewCourse = CourseService::getCourseById($previewDraftId, true);
    if ($previewCourse) {
        $stmtM = $pdo->prepare("SELECT * FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC");
        $stmtM->execute([$previewDraftId]);
        $previewModules = $stmtM->fetchAll(PDO::FETCH_ASSOC);
    }
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
    <title>AI Curriculum Synthesizer & Course Control Center — Admin</title>
    <link rel="stylesheet" href="css/student.css?v=12.0">
    <style>
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .stat-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .badge-status-published { background: #dcfce7; color: #15803d; font-weight: 800; }
    .badge-status-draft { background: #fef3c7; color: #b45309; font-weight: 800; }
    .badge-status-unpublished { background: #fee2e2; color: #b91c1c; font-weight: 800; }
    .badge-status-archived { background: #f1f5f9; color: #64748b; font-weight: 800; }

    .price-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
    }
    .price-symbol {
        position: absolute;
        left: 0.85rem;
        font-weight: 800;
        color: #10b981;
        font-size: 1rem;
        pointer-events: none;
    }
    .price-field {
        padding-left: 2rem !important;
        font-weight: 800 !important;
        color: #065f46 !important;
    }
    .action-btn-group {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        flex-wrap: wrap;
    }
    </style>
</head>
<body>
    <div class="admin-app-wrapper">
        <?php include __DIR__ . "/admin-nav.php"; ?>
        
        <main class="app-container" style="max-width: 1440px; margin: 0 auto; padding: 1.5rem 1.25rem 4rem;">
            
            <!-- PAGE HEADER -->
            <header class="admin-header" style="margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <span style="font-size: 1.8rem;">🤖</span>
                        <div>
                            <h1 style="font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0;">AI Curriculum Synthesizer & Course Lifecycle Center</h1>
                            <p style="font-size: 0.85rem; color: #64748b; margin: 0.2rem 0 0;">Single Control Center to Create, Edit, Price, Publish, Unpublish, Archive, and Safely Manage All Courses.</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="admin-content.php" class="btn btn-secondary btn-sm" style="font-weight: 700;">
                            📁 Content & Video Manager →
                        </a>
                        <button type="button" onclick="document.getElementById('auditModal').style.display='block';" class="btn btn-secondary btn-sm" style="font-weight: 700;">
                            📜 Audit History
                        </button>
                    </div>
                </div>
            </header>

            <?php if ($message): ?>
                <div class="alert alert-success" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem; border-radius: 10px; background: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; font-weight: 700;">
                    <?php echo e($message); ?>
                </div>
            <?php endif; ?>

            <?php if ($error): ?>
                <div class="alert alert-danger" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem; border-radius: 10px; background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; font-weight: 700;">
                    <?php echo e($error); ?>
                </div>
            <?php endif; ?>

            <!-- STATS OVERVIEW CARDS -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: #e0e7ff; color: #4338ca; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">📚</div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Courses</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #0f172a;"><?php echo $totalCount; ?></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: #dcfce7; color: #15803d; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🚀</div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Live Published</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #15803d;"><?php echo $pubCount; ?></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: #fef3c7; color: #b45309; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">📝</div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Draft Review</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #b45309;"><?php echo $draftCount; ?></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: #fee2e2; color: #b91c1c; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">⏸️</div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Unpublished</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #b91c1c;"><?php echo $unpubCount; ?></div>
                    </div>
                </div>
                <div class="stat-card">
                    <div style="width: 38px; height: 38px; border-radius: 8px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">📦</div>
                    <div>
                        <div style="font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Archived</div>
                        <div style="font-size: 1.3rem; font-weight: 900; color: #64748b;"><?php echo $archCount; ?></div>
                    </div>
                </div>
            </div>

            <!-- SECTION 1: AI SYNTHESIZER FORM -->
            <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, rgba(99,102,241,0.06) 0%, #ffffff 100%); border: 2px solid #c7d2fe; border-radius: 16px; padding: 1.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #4338ca; margin: 0;">✨ 1-Click Multi-Week Course Synthesizer</h3>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0.25rem 0 0;">Synthesizes a complete weekly syllabus and saves as a <strong>Draft Course</strong> for your review before publishing.</p>
                    </div>
                    <span style="background: #e0e7ff; color: #4338ca; font-weight: 800; font-size: 0.75rem; padding: 0.3rem 0.75rem; border-radius: 100px;">
                        ⚡ Gemini Pro Model
                    </span>
                </div>

                <form method="POST">
                    <?php echo csrf_field(); ?>
                    <input type="hidden" name="action" value="synthesize_draft">
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                        <!-- Topic Input -->
                        <div style="grid-column: span 2;">
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                                📚 Technology / Topic Name
                            </label>
                            <input type="text" name="course_topic" placeholder="e.g. Next.js 15 & React Server Components, Kubernetes DevOps..." required style="width: 100%; padding: 0.65rem 0.9rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.92rem; box-sizing: border-box;">
                        </div>
                        
                        <!-- Duration -->
                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                                📅 Duration
                            </label>
                            <select name="course_weeks" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 700; background: #fff; box-sizing: border-box;">
                                <option value="1">⚡ 1 Week (Sprint)</option>
                                <option value="2">⚡ 2 Weeks (Crash Course)</option>
                                <option value="4" selected>📅 4 Weeks (1 Month Standard)</option>
                                <option value="8">🚀 8 Weeks (2 Months Intensive)</option>
                                <option value="12">🎓 12 Weeks (3 Months Bootcamp)</option>
                                <option value="16">🎓 16 Weeks (Masterclass)</option>
                            </select>
                        </div>

                        <!-- Price Tag -->
                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #065f46; margin-bottom: 0.35rem;">
                                🏷️ Official Price Tag (₹ INR)
                            </label>
                            <div class="price-input-wrapper">
                                <span class="price-symbol">₹</span>
                                <input type="number" name="course_price" value="15000" min="0" max="500000" step="1" required class="price-field" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 2px solid #10b981; font-size: 0.95rem; box-sizing: border-box; background: #f0fdf4;">
                            </div>
                        </div>

                        <!-- Level -->
                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
                                🎯 Target Level
                            </label>
                            <select name="course_level" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; font-weight: 600; background: #fff; box-sizing: border-box;">
                                <option value="Beginner to Pro">Beginner to Pro</option>
                                <option value="Intermediate" selected>Intermediate</option>
                                <option value="Advanced Architecture">Advanced Architecture</option>
                            </select>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end;">
                        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.75rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-weight: 800; font-size: 0.95rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(99,102,241,0.25); cursor: pointer;">
                            ✨ Synthesize & Create Draft Course
                        </button>
                    </div>
                </form>
            </div>

            <!-- SECTION 2: DRAFT COURSE REVIEW & PUBLISH DRAWER (If newly synthesized or clicked) -->
            <?php if ($previewCourse && $previewCourse['status'] === 'draft'): ?>
            <div class="card" style="margin-bottom: 2.5rem; border-top: 4px solid #f59e0b; background: #ffffff; border-radius: 16px; padding: 1.75rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.08);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1.25rem; border-bottom: 1px solid #e2e8f0;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                            <span class="badge badge-status-draft" style="font-size: 0.8rem; padding: 0.2rem 0.65rem; border-radius: 6px;">
                                📝 DRAFT READY FOR REVIEW (ID #<?php echo $previewCourse['id']; ?>)
                            </span>
                            <span class="badge" style="background: #dcfce7; color: #15803d; font-weight: 800; font-size: 0.82rem; padding: 0.2rem 0.65rem; border-radius: 6px;">
                                🏷️ Price Tag: ₹<?php echo number_format($previewCourse['price']); ?>
                            </span>
                        </div>
                        <h2 style="font-size: 1.45rem; font-weight: 900; color: #0f172a; margin: 0;">
                            <?php echo e($previewCourse['title']); ?>
                        </h2>
                        <p style="font-size: 0.84rem; color: #64748b; margin: 0.25rem 0 0;">
                            Slug: <code><?php echo e($previewCourse['slug']); ?></code> • <?php echo count($previewModules); ?> Modules Generated
                        </p>
                    </div>

                    <!-- Direct Publish Action -->
                    <form method="POST" style="margin: 0;">
                        <?php echo csrf_field(); ?>
                        <input type="hidden" name="action" value="publish_course">
                        <input type="hidden" name="course_id" value="<?php echo $previewCourse['id']; ?>">
                        <button type="submit" class="btn btn-primary" style="padding: 0.75rem 1.6rem; background: linear-gradient(135deg, #10b981, #059669); border: none; font-weight: 800; font-size: 0.95rem; border-radius: 10px; box-shadow: 0 4px 12px rgba(16,185,129,0.3); cursor: pointer;">
                            🚀 Validate & Publish Live to Catalog
                        </button>
                    </form>
                </div>

                <!-- Modules Grid Preview -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
                    <?php foreach ($previewModules as $mod): ?>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1rem;">
                        <div style="font-size: 0.72rem; font-weight: 800; color: #6366f1; text-transform: uppercase;">
                            Module <?php echo $mod['sort_order']; ?>
                        </div>
                        <div style="font-weight: 800; color: #0f172a; font-size: 0.92rem; margin: 0.2rem 0 0.5rem;">
                            <?php echo e($mod['title']); ?>
                        </div>
                        <div style="font-size: 0.8rem; color: #64748b; white-space: pre-line;">
                            <?php echo e($mod['description']); ?>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
            <?php endif; ?>

            <!-- SECTION 3: MASTER COURSE LIFECYCLE MANAGEMENT TABLE -->
            <div class="card" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
                    <div>
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">📚 Master Course Catalog & Lifecycle Management</h3>
                        <p style="font-size: 0.84rem; color: #64748b; margin: 0.25rem 0 0;">All courses in MySQL database. The database is the single source of truth for pricing, status, and curriculum.</p>
                    </div>
                </div>

                <div class="table-responsive" style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.88rem;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">ID</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">Course Title & Slug</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">Duration</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">Modules</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">Students</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700;">Status</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700; min-width: 150px;">Price Tag (₹)</th>
                                <th style="padding: 0.85rem 1rem; font-weight: 700; min-width: 220px; text-align: right;">Lifecycle Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($allCourses as $c): ?>
                            <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;">
                                <td style="padding: 0.85rem 1rem; font-weight: 800; color: #64748b;">
                                    #<?php echo $c['id']; ?>
                                </td>
                                <td style="padding: 0.85rem 1rem;">
                                    <div style="font-weight: 800; color: #0f172a; font-size: 0.94rem;"><?php echo e($c['title']); ?></div>
                                    <div style="font-size: 0.76rem; color: #64748b;">
                                        Slug: <code><?php echo e($c['slug'] ?? 'course-'.$c['id']); ?></code> • <?php echo e($c['level'] ?? 'Intermediate'); ?>
                                    </div>
                                </td>
                                <td style="padding: 0.85rem 1rem; color: #475569; font-weight: 600;">
                                    <?php echo e($c['duration'] ?? '12 Weeks'); ?>
                                </td>
                                <td style="padding: 0.85rem 1rem;">
                                    <span style="font-weight: 700; color: #4338ca;"><?php echo (int)($c['module_count'] ?? 0); ?></span>
                                </td>
                                <td style="padding: 0.85rem 1rem;">
                                    <span style="font-weight: 700; color: #15803d;"><?php echo (int)($c['student_count'] ?? 0); ?></span>
                                </td>
                                <td style="padding: 0.85rem 1rem;">
                                    <?php 
                                    $st = strtolower($c['status'] ?? 'draft');
                                    $badgeClass = 'badge-status-' . $st;
                                    ?>
                                    <span class="badge <?php echo $badgeClass; ?>" style="font-size: 0.74rem; padding: 0.25rem 0.6rem; border-radius: 100px;">
                                        <?php echo strtoupper($st); ?>
                                    </span>
                                </td>
                                <td style="padding: 0.85rem 1rem;">
                                    <!-- Inline Price Update Form -->
                                    <form method="POST" style="display: flex; align-items: center; gap: 0.35rem; margin: 0;">
                                        <?php echo csrf_field(); ?>
                                        <input type="hidden" name="action" value="update_price">
                                        <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                        <div class="price-input-wrapper" style="width: 100px;">
                                            <span class="price-symbol" style="font-size: 0.85rem; left: 0.55rem;">₹</span>
                                            <input type="number" name="course_price" value="<?php echo e($c['price']); ?>" min="0" max="500000" step="1" required class="price-field" style="width: 100%; padding: 0.35rem 0.5rem 0.35rem 1.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box;">
                                        </div>
                                        <button type="submit" class="btn btn-secondary btn-sm" title="Save Price" style="padding: 0.35rem 0.55rem; font-size: 0.78rem;">💾</button>
                                    </form>
                                </td>
                                <td style="padding: 0.85rem 1rem; text-align: right;">
                                    <div class="action-btn-group" style="justify-content: flex-end;">
                                        
                                        <!-- Manage Curriculum -->
                                        <a href="admin-content.php?course_id=<?php echo $c['id']; ?>" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700;">
                                            📁 Content
                                        </a>

                                        <!-- PUBLISH / UNPUBLISH -->
                                        <?php if ($st === 'published'): ?>
                                            <form method="POST" style="margin:0;">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="unpublish_course">
                                                <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                                <button type="submit" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700; color: #b91c1c;">
                                                    ⏸️ Unpublish
                                                </button>
                                            </form>
                                        <?php else: ?>
                                            <form method="POST" style="margin:0;">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="publish_course">
                                                <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                                <button type="submit" class="btn btn-primary btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700; background: #10b981; border:none;">
                                                    🚀 Publish
                                                </button>
                                            </form>
                                        <?php endif; ?>

                                        <!-- ARCHIVE / RESTORE -->
                                        <?php if ($st === 'archived'): ?>
                                            <form method="POST" style="margin:0;">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="restore_course">
                                                <input type="hidden" name="target_status" value="published">
                                                <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                                <button type="submit" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700;">
                                                    🔄 Restore
                                                </button>
                                            </form>
                                        <?php else: ?>
                                            <form method="POST" style="margin:0;">
                                                <?php echo csrf_field(); ?>
                                                <input type="hidden" name="action" value="archive_course">
                                                <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                                <button type="submit" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; font-weight: 700; color: #64748b;">
                                                    📦 Archive
                                                </button>
                                            </form>
                                        <?php endif; ?>

                                        <!-- SAFE DELETE (Strictly Checked for 0 Students) -->
                                        <form method="POST" style="margin:0;" onsubmit="return confirm('Are you sure you want to permanently delete Course #<?php echo $c['id']; ?>? Deletion is only permitted if it has 0 student records.');">
                                            <?php echo csrf_field(); ?>
                                            <input type="hidden" name="action" value="delete_course">
                                            <input type="hidden" name="course_id" value="<?php echo $c['id']; ?>">
                                            <button type="submit" class="btn btn-secondary btn-sm" style="padding: 0.35rem 0.55rem; font-size: 0.78rem; color: #ef4444;" title="Delete Course">
                                                🗑️
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

            <!-- AUDIT HISTORY MODAL -->
            <div id="auditModal" style="display: none; position: fixed; inset: 0; background: rgba(15,23,42,0.7); backdrop-filter: blur(4px); z-index: 9999; padding: 1.5rem; overflow-y: auto;">
                <div style="max-width: 800px; margin: 2rem auto; background: #ffffff; border-radius: 16px; padding: 2rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); border: 1px solid #e2e8f0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                        <h3 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0;">📜 Course Management Audit History</h3>
                        <button type="button" onclick="document.getElementById('auditModal').style.display='none';" style="background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer;">&times;</button>
                    </div>

                    <div style="max-height: 450px; overflow-y: auto;">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
                            <thead>
                                <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #475569;">
                                    <th style="padding: 0.5rem;">Time</th>
                                    <th style="padding: 0.5rem;">Admin</th>
                                    <th style="padding: 0.5rem;">Course</th>
                                    <th style="padding: 0.5rem;">Action</th>
                                    <th style="padding: 0.5rem;">Change Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($auditLogs)): ?>
                                    <tr><td colspan="5" style="text-align: center; padding: 1.5rem; color: #64748b;">No audit records found yet.</td></tr>
                                <?php else: ?>
                                    <?php foreach ($auditLogs as $log): ?>
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 0.5rem; color: #64748b; white-space: nowrap;"><?php echo date('M d, H:i', strtotime($log['created_at'])); ?></td>
                                        <td style="padding: 0.5rem; font-weight: 700;"><?php echo e($log['admin_name'] ?? 'Admin #'.$log['admin_id']); ?></td>
                                        <td style="padding: 0.5rem;"><?php echo e($log['course_title'] ?? 'Course #'.$log['course_id']); ?></td>
                                        <td style="padding: 0.5rem;"><span class="badge" style="background:#e0e7ff; color:#4338ca; font-weight:700;"><?php echo strtoupper($log['action']); ?></span></td>
                                        <td style="padding: 0.5rem; font-family: monospace; font-size: 0.76rem; color: #475569; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                            <?php echo htmlspecialchars($log['new_value'] ?? ''); ?>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </main>
    </div>
</body>
</html>
