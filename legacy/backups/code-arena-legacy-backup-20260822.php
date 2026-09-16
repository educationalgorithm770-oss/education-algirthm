<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

$studentId = requireStudent();

// Fetch student info
$stmtS = $pdo->prepare("SELECT name, email FROM students WHERE id = ? LIMIT 1");
$stmtS->execute([$studentId]);
$student = $stmtS->fetch();

// Fetch all available challenges
$stmtChallenges = $pdo->query("SELECT id, title, slug, difficulty, category, points_xp FROM code_challenges ORDER BY (slug = 'custom-sandbox') DESC, id ASC");
$allChallenges = $stmtChallenges->fetchAll();

$currentSlug = clean_text($_GET['problem'] ?? '', 255);
$currentChallenge = null;

if (!empty($currentSlug)) {
    $stmtC = $pdo->prepare("SELECT * FROM code_challenges WHERE slug = ? LIMIT 1");
    $stmtC->execute([$currentSlug]);
    $currentChallenge = $stmtC->fetch();
}

if (!$currentChallenge && !empty($allChallenges)) {
    $currentChallenge = $allChallenges[0];
    $stmtFirst = $pdo->prepare("SELECT * FROM code_challenges WHERE id = ? LIMIT 1");
    $stmtFirst->execute([$currentChallenge['id']]);
    $currentChallenge = $stmtFirst->fetch();
}

$isSandbox = ($currentChallenge['slug'] === 'custom-sandbox');
$testCases = json_decode($currentChallenge['test_cases_json'] ?? '[]', true) ?: [];

$pageTitle = $isSandbox ? "Free Custom Code & GUI Sandbox" : "LeetCode Arena — " . ($currentChallenge['title'] ?? 'Code Challenges');
$activePage = 'code-arena';
$activeNav = 'code-arena';
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <script>
    (function() {
        var t = 'dark';
        try { t = localStorage.getItem('lms_theme') || 'dark'; } catch(e){}
        document.documentElement.setAttribute('data-theme', t);
    })();
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo e($pageTitle); ?> — Education Algorithm</title>
    <link rel="stylesheet" href="css/student.css?v=11.0">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

    <style>
    .studio-container {
        max-width: 1560px;
        margin: 0 auto;
        padding: 1rem 1.25rem 3rem;
        box-sizing: border-box;
    }
    
    /* 2-Column Split Workbench */
    .workbench-grid {
        display: grid;
        grid-template-columns: 460px 1fr;
        gap: 1.15rem;
        min-height: 740px;
    }
    @media (max-width: 1100px) {
        .workbench-grid {
            grid-template-columns: 1fr;
        }
    }

    /* Panels */
    .studio-panel {
        background: var(--card-bg) !important;
        border: 1px solid var(--card-border) !important;
        border-radius: 14px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: var(--shadow-card);
    }

    /* Tab Headers */
    .panel-tab-header {
        background: var(--table-head-bg) !important;
        border-bottom: 1px solid var(--card-border) !important;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.4rem 0.85rem;
        min-height: 48px;
        flex-shrink: 0;
        flex-wrap: wrap;
        gap: 0.5rem;
        overflow: visible;
    }
    .tab-group {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        height: 100%;
    }
    .panel-tab-btn {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-muted);
        font-size: 0.84rem;
        font-weight: 700;
        padding: 0.75rem 0.85rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        transition: all 0.15s ease;
    }
    .panel-tab-btn:hover {
        color: var(--text-primary);
    }
    .panel-tab-btn.active {
        color: #6366f1;
        border-bottom-color: #6366f1;
        background: rgba(99, 102, 241, 0.08);
    }

    .panel-scrollable {
        padding: 1.25rem;
        overflow-y: auto;
        flex: 1;
        max-height: 650px;
    }

    /* Chips & Tags */
    .tag-chip {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        background: var(--bg-subtle);
        color: var(--text-secondary);
        border: 1px solid var(--card-border);
        cursor: pointer;
        transition: all 0.15s ease;
    }
    .tag-chip:hover {
        border-color: #6366f1;
        color: #818cf8;
    }
    .difficulty-tag {
        font-size: 0.76rem;
        font-weight: 800;
        padding: 0.22rem 0.65rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        letter-spacing: 0.02em;
    }
    .difficulty-tag.Easy { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    .difficulty-tag.Medium { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .difficulty-tag.Hard { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }

    .example-card {
        background: var(--bg-subtle);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 0.85rem 1.15rem;
        margin: 0.85rem 0;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 0.85rem;
        line-height: 1.5;
        color: var(--text-primary);
    }

    /* INDUSTRIAL NATIVE IDE STUDIO */
    .native-ide-wrapper {
        display: flex;
        background: #090d16;
        min-height: 380px;
        border-bottom: 1px solid #1e293b;
        position: relative;
    }
    .gutter-line-numbers {
        width: 44px;
        background: #060911;
        border-right: 1px solid #1e293b;
        padding: 0.85rem 0.4rem;
        color: #64748b;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 13px;
        line-height: 1.6;
        text-align: right;
        user-select: none;
        box-sizing: border-box;
        overflow: hidden;
    }
    .native-code-textarea {
        flex: 1;
        width: 100% !important;
        background: #090d16 !important;
        color: #f8fafc !important;
        border: none !important;
        outline: none !important;
        padding: 0.85rem 1rem !important;
        font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace !important;
        font-size: 13.5px !important;
        line-height: 1.6 !important;
        tab-size: 4 !important;
        -moz-tab-size: 4 !important;
        resize: vertical !important;
        white-space: pre !important;
        overflow-wrap: normal !important;
        overflow-x: auto !important;
        box-sizing: border-box !important;
        min-height: 380px !important;
    }

    /* Bottom Test Console / GUI Viewport */
    .testcase-console {
        background: #090d16;
        display: flex;
        flex-direction: column;
        min-height: 250px;
    }
    .testcase-header {
        padding: 0.6rem 1rem;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        background: #060911;
    }
    .testcase-tab-btn {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.12);
        color: #94a3b8;
        padding: 0.3rem 0.75rem;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
    }
    .testcase-tab-btn.active {
        background: #6366f1;
        color: #ffffff;
        border-color: #6366f1;
    }
    .testcase-body {
        padding: 0.85rem 1.15rem;
        overflow-y: auto;
        flex: 1;
        color: #f8fafc;
        font-family: monospace;
        font-size: 0.85rem;
        position: relative;
    }

    /* GUI Live Iframe */
    .gui-preview-frame {
        width: 100%;
        height: 250px;
        background: #ffffff;
        border: 1px solid #334155;
        border-radius: 8px;
        box-sizing: border-box;
    }

    /* Submissions & Community Cards */
    .subs-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.82rem;
    }
    .subs-table th {
        text-align: left;
        padding: 0.55rem 0.75rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-muted);
        font-size: 0.74rem;
        text-transform: uppercase;
    }
    .subs-table td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid var(--card-border);
        color: var(--text-primary);
    }
    .community-card {
        background: var(--bg-subtle);
        border: 1px solid var(--card-border);
        border-radius: 10px;
        padding: 0.95rem 1.1rem;
        margin-bottom: 0.85rem;
    }
    .timer-badge {
        font-family: monospace;
        font-size: 0.88rem;
        font-weight: 800;
        background: rgba(99, 102, 241, 0.15);
        color: #818cf8;
        border: 1px solid rgba(99, 102, 241, 0.3);
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }
        /* Mobile & Tablet Responsive Alignments */
    @media (max-width: 768px) {
        .studio-container {
            padding: 0.75rem 0.75rem 3rem !important;
        }
        .workbench-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
        }
        .panel-tab-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 0.6rem 0.75rem !important;
            gap: 0.6rem !important;
        }
        .tab-group {
            width: 100% !important;
            overflow-x: auto !important;
            justify-content: flex-start !important;
            padding-bottom: 0.2rem !important;
        }
        .panel-scrollable {
            max-height: 380px !important;
            padding: 1rem !important;
        }
        .native-ide-wrapper {
            min-height: 320px !important;
        }
        .native-code-textarea {
            min-height: 320px !important;
            font-size: 12.5px !important;
            padding: 0.65rem 0.75rem !important;
        }
        .testcase-console {
            min-height: 220px !important;
        }
        .timer-badge {
            width: 100% !important;
            justify-content: center !important;
        }
        #probSelect {
            width: 100% !important;
            min-width: 100% !important;
        }
    }
    </style>
</head>
<body>
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="studio-container">
        <!-- Top Toolbar & Navigation -->
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; box-shadow: 0 4px 14px rgba(99,102,241,0.35);">
                    ⚡
                </div>
                <div>
                    <h1 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                        <?php echo $isSandbox ? 'Free Custom Code & Interactive GUI Studio' : 'LeetCode Code Arena Pro'; ?>
                    </h1>
                    <p style="font-size: 0.78rem; color: var(--text-muted); margin: 0.15rem 0 0;">
                        <?php echo $isSandbox ? 'Build Live GUI Apps, Web UIs, Visual Widgets & CLI Programs with Real-Time Viewport' : '8 Curated Interview Problems • Timed FAANG Simulator • Community Solutions & AI Coach'; ?>
                    </p>
                </div>
            </div>

            <!-- Problem / Mode Switcher & Interview Timer -->
            <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                <!-- Timer Widget -->
                <div class="timer-badge" id="timerWidget">
                    <span>⏱️</span>
                    <span id="timerDisplay">25:00</span>
                    <button type="button" onclick="toggleTimer()" id="timerToggleBtn" style="background:none; border:none; color:#818cf8; cursor:pointer; font-size:0.75rem; padding:0; margin-left:0.25rem;">Start</button>
                    <button type="button" onclick="resetTimer()" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:0.75rem; padding:0; margin-left:0.15rem;">↺</button>
                </div>

                <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <label for="probSelect" style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">Mode / Challenge:</label>
                    <select id="probSelect" onchange="location.href='code-arena.php?problem='+this.value" style="width: auto; min-width: 330px; padding: 0.45rem 0.85rem; font-size: 0.86rem; font-weight: 600;">
                        <?php foreach ($allChallenges as $ch): ?>
                            <option value="<?php echo e($ch['slug']); ?>" <?php echo ($currentChallenge['id'] === $ch['id']) ? 'selected' : ''; ?>>
                                <?php echo ($ch['slug'] === 'custom-sandbox') ? '🚀 [Free Sandbox] Practice Custom Code & Interactive GUI' : '[' . $ch['difficulty'] . '] ' . e($ch['title']) . ' (+' . $ch['points_xp'] . ' XP)'; ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
        </div>

        <!-- 2-Pane Workbench Grid -->
        <div class="workbench-grid" id="workbenchRoot">
            <!-- LEFT PANEL: Dynamic Problem Deck OR Sandbox Cheat Sheet -->
            <section class="studio-panel">
                <?php if ($isSandbox): ?>
                    <!-- SANDBOX CHEAT SHEET & SCAFFOLD LIBRARY -->
                    <div class="panel-tab-header">
                        <div class="tab-group">
                            <span style="font-size:0.86rem; font-weight:800; color:var(--text-primary);">🎨 1-Click GUI & Code Starters</span>
                        </div>
                        <span class="badge paid" style="font-size:0.74rem;">Interactive GUI Ready</span>
                    </div>

                    <div class="panel-scrollable">
                        <h3 style="font-size:1.05rem; font-weight:800; color:var(--text-primary); margin-bottom:0.4rem;">
                            🖥️ Interactive Web & GUI Sandbox
                        </h3>
                        <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.55; margin-bottom:1rem;">
                            Click any starter below to instantly render an interactive GUI window, canvas animation, or backend script:
                        </p>

                        <!-- GUI Templates -->
                        <div style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.25rem;">
                            <button type="button" class="btn btn-primary" onclick="injectSandboxTemplate('gui_app')" style="text-align:left; justify-content:flex-start; padding:0.65rem 0.95rem; font-size:0.84rem; background:linear-gradient(135deg, #6366f1, #8b5cf6); border:none;">
                                🪟 <strong>Interactive GUI Widget</strong> (Buttons, Inputs & Counter)
                            </button>
                            <button type="button" class="btn btn-primary" onclick="injectSandboxTemplate('gui_canvas')" style="text-align:left; justify-content:flex-start; padding:0.65rem 0.95rem; font-size:0.84rem; background:linear-gradient(135deg, #10b981, #059669); border:none;">
                                🎨 <strong>Interactive Canvas Visualizer</strong> (Graphics & Draw)
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="injectSandboxTemplate('java')" style="text-align:left; justify-content:flex-start; padding:0.65rem 0.95rem; font-size:0.82rem;">
                                ☕ <strong>Java</strong>: Main Class with Loops & Math
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="injectSandboxTemplate('python')" style="text-align:left; justify-content:flex-start; padding:0.65rem 0.95rem; font-size:0.82rem;">
                                🐍 <strong>Python 3</strong>: Lists, Dictionaries & Functions
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="injectSandboxTemplate('sql')" style="text-align:left; justify-content:flex-start; padding:0.65rem 0.95rem; font-size:0.82rem;">
                                🗄️ <strong>SQL</strong>: Live Courses Table Query
                            </button>
                        </div>

                        <!-- Cheat Sheet Quick Reference -->
                        <h4 style="font-size:0.88rem; font-weight:700; color:var(--text-primary); margin-bottom:0.4rem;">💡 How GUI Rendering Works:</h4>
                        <div class="example-card" style="font-size:0.8rem; line-height:1.6;">
                            • When writing <strong>HTML/CSS/JS</strong>, the bottom console opens an <strong>Interactive GUI Viewport</strong> allowing you to click buttons, trigger animations, and test forms in real-time!<br>
                            • For <strong>Java/Python</strong>, text output streams into the live terminal.
                        </div>
                    </div>

                <?php else: ?>
                    <!-- LEETCODE CHALLENGE DECK -->
                    <div class="panel-tab-header">
                        <div class="tab-group">
                            <button type="button" class="panel-tab-btn active" id="tabBtnDesc" onclick="switchLeftTab('desc')">
                                📖 Problem
                            </button>
                            <button type="button" class="panel-tab-btn" id="tabBtnEditorial" onclick="switchLeftTab('editorial')">
                                💡 Editorial
                            </button>
                            <button type="button" class="panel-tab-btn" id="tabBtnCommunity" onclick="switchLeftTab('community')">
                                💬 Solutions
                            </button>
                            <button type="button" class="panel-tab-btn" id="tabBtnSubs" onclick="switchLeftTab('subs')">
                                📜 History
                            </button>
                        </div>
                    </div>

                    <!-- Tab 1: Problem Description -->
                    <div class="panel-scrollable" id="tabContentDesc">
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.65rem; flex-wrap: wrap; margin-bottom: 0.85rem;">
                            <div style="display: flex; align-items: center; gap: 0.65rem;">
                                <span class="difficulty-tag <?php echo $currentChallenge['difficulty']; ?>"><?php echo $currentChallenge['difficulty']; ?></span>
                                <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.3;">
                                    <?php echo e($currentChallenge['title']); ?>
                                </h2>
                            </div>
                            <span class="badge paid" style="font-size: 0.74rem; font-weight: 800;">+<?php echo $currentChallenge['points_xp']; ?> XP</span>
                        </div>

                        <!-- Topic Tags & Company Chips -->
                        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.15rem;">
                            <span class="tag-chip">🏷️ <?php echo e($currentChallenge['category']); ?></span>
                            <span class="tag-chip">🏢 Google</span>
                            <span class="tag-chip">🏢 Amazon</span>
                            <span class="tag-chip">🏢 Microsoft</span>
                        </div>

                        <!-- Problem Statement Body -->
                        <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.65; white-space: pre-wrap;">
<?php echo e($currentChallenge['description']); ?>
                        </div>

                        <!-- Example Input / Output -->
                        <h4 style="font-size: 0.88rem; font-weight: 700; margin: 1.25rem 0 0.45rem; color: var(--text-primary);">Example 1:</h4>
                        <div class="example-card">
                            <div style="margin-bottom: 0.5rem;"><strong style="color: var(--text-muted);">Input:</strong> <span style="color: #e0e7ff;"><?php echo e($currentChallenge['input_format']); ?></span></div>
                            <div><strong style="color: var(--text-muted);">Output:</strong> <span style="color: #34d399; font-weight: 700;"><?php echo e($currentChallenge['output_format']); ?></span></div>
                        </div>

                        <!-- Constraints -->
                        <?php if (!empty($currentChallenge['constraints'])): ?>
                        <h4 style="font-size: 0.88rem; font-weight: 700; margin: 1.35rem 0 0.4rem; color: var(--text-primary);">Constraints & Complexity Goals:</h4>
                        <div class="example-card" style="color: var(--text-muted);">
<?php echo e($currentChallenge['constraints']); ?>
                        </div>
                        <?php endif; ?>
                    </div>

                    <!-- Tab 2: Editorial & Complexity -->
                    <div class="panel-scrollable" id="tabContentEditorial" style="display: none;">
                        <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
                            💡 Official Editorial & Complexity Breakdown
                        </h3>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.6;">
                            In technical interviews, interviewers prioritize optimal asymptotic complexity over brute-force solutions.
                        </p>
                        
                        <div style="background: var(--bg-subtle); border: 1px solid var(--card-border); border-radius: 10px; padding: 1rem; margin: 1rem 0;">
                            <strong style="color: #10b981; font-size: 0.88rem;">Optimal Approach</strong>
                            <p style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 0.35rem;">
                                Utilize direct single-pass iterations or two-pointer narrowing to eliminate redundant comparisons.
                            </p>
                            <div style="font-family: monospace; font-size: 0.8rem; color: #818cf8; margin-top: 0.5rem;">
                                • Time Complexity: <strong>O(N)</strong> or <strong>O(log N)</strong><br>
                                • Space Complexity: <strong>O(1)</strong> auxiliary memory
                            </div>
                        </div>
                    </div>

                    <!-- Tab 3: Community Solutions & Discussions -->
                    <div class="panel-scrollable" id="tabContentCommunity" style="display: none;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                                💬 Community Approaches
                            </h3>
                            <button type="button" class="btn btn-primary btn-sm" onclick="showPublishModal()" style="font-size: 0.74rem; padding: 0.25rem 0.65rem;">
                                + Share Solution
                            </button>
                        </div>

                        <div id="communityContainer">
                            <p style="font-size: 0.82rem; color: var(--text-muted);">Loading community approaches...</p>
                        </div>
                    </div>

                    <!-- Tab 4: Submissions History -->
                    <div class="panel-scrollable" id="tabContentSubs" style="display: none;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.85rem;">
                            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin: 0;">
                                📜 Your Submissions Log
                            </h3>
                            <button type="button" class="btn btn-secondary btn-sm" onclick="loadSubmissionsHistory()" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;">
                                ↺ Refresh
                            </button>
                        </div>
                        <div id="subsContainer">
                            <p style="font-size: 0.82rem; color: var(--text-muted);">Loading records...</p>
                        </div>
                    </div>
                <?php endif; ?>
            </section>

            <!-- RIGHT PANEL: Native IDE Studio & Live Viewport -->
            <section class="studio-panel">
                <!-- Editor Toolbar -->
                <div class="panel-tab-header">
                    <div style="display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap;">
                        <select id="languageSelect" onchange="switchIdeLanguage(this.value)" style="width: auto; padding: 0.35rem 0.85rem; font-size: 0.84rem; font-weight: 700; border-radius: 8px;">
                            <option value="gui_web">🪟 HTML/JS (Interactive GUI)</option>
                            <option value="javascript">JavaScript (Node.js)</option>
                            <option value="python">Python 3</option>
                            <option value="java">Java 21</option>
                            <option value="cpp">C++ (GCC 13)</option>
                            <option value="sql">SQL (MySQL 8)</option>
                        </select>
                        
                        <button type="button" class="btn btn-secondary btn-sm" onclick="resetBoilerplate()" title="Reset to default template" style="font-size: 0.74rem; padding: 0.25rem 0.55rem;">
                            ↺ Reset
                        </button>

                        <!-- Snippet Starter Dropdown -->
                        <select onchange="insertCodeSnippet(this.value); this.value='';" style="width: auto; padding: 0.32rem 0.65rem; font-size: 0.75rem; font-weight: 600; border-radius: 6px;">
                            <option value="">⚡ Snippets...</option>
                            <option value="gui_button">GUI Button & Alert</option>
                            <option value="gui_canvas_box">Canvas Animation Loop</option>
                            <option value="for_loop">Array For-Loop</option>
                            <option value="hash_map">HashMap / Map</option>
                        </select>
                    </div>

                    <!-- AI Coach Tools -->
                    <div style="display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="triggerAiMentor('ai_explain')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: #6366f1; color: #818cf8;">
                            🤖 Explain Bug
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="triggerAiMentor('ai_optimize')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: #10b981; color: #34d399;">
                            ⚡ Check Big-O
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm" onclick="triggerAiMentor('ai_edge_cases')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: #f59e0b; color: #fbbf24;">
                            🧪 Corner Cases
                        </button>
                    </div>
                </div>

                <!-- Industrial Native Code IDE Area -->
                <div class="native-ide-wrapper">
                    <div class="gutter-line-numbers" id="lineNumbersGutter">1</div>
                    <textarea class="native-code-textarea" id="ideTextarea" spellcheck="false" autocomplete="off" autocapitalize="off" placeholder="Write your solution here..."></textarea>
                </div>

                <!-- Bottom Test Console, Custom Runtime Stdin & Live Output Viewport -->
                <div class="testcase-console">
                    <div class="testcase-header">
                        <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                            <button type="button" class="testcase-tab-btn active" id="tabBtnOutput" onclick="switchConsoleTab('output')">
                                🖥️ Console Output
                            </button>
                            <button type="button" class="testcase-tab-btn" id="tabBtnStdin" onclick="switchConsoleTab('stdin')">
                                ⌨️ Custom Input (stdin)
                            </button>
                            <?php if (!$isSandbox && !empty($testCases)): ?>
                            <button type="button" class="testcase-tab-btn" id="tabBtnTestcases" onclick="switchConsoleTab('testcases')">
                                🧪 Test Cases (<?php echo count($testCases); ?>)
                            </button>
                            <?php endif; ?>
                        </div>

                        <div id="executionBadge" style="font-size: 0.74rem; color: #94a3b8;">
                            <span class="mono">Ctrl+Enter</span> to run • <span class="mono">Ctrl+Shift+S</span> to submit
                        </div>
                    </div>

                    <!-- PANE 1: Console Output -->
                    <div class="testcase-body" id="consoleOutput" style="display: block;">
                        <div id="caseViewDefault">
                            <?php if ($isSandbox): ?>
                                <div style="color:#94a3b8; font-size:0.84rem; line-height:1.6;">
                                    Click <strong>▶ Run Code</strong> to execute your program or test standard input in the <strong>⌨️ Custom Input (stdin)</strong> tab!
                                </div>
                            <?php elseif (!empty($testCases[0])): ?>
                                <div style="font-size:0.82rem; line-height:1.6;">
                                    <div style="color:#94a3b8;">Default Problem Input:</div>
                                    <div style="color:#e0e7ff; background:rgba(255,255,255,0.05); padding:0.35rem 0.65rem; border-radius:4px; margin-bottom:0.4rem; font-family:monospace;"><?php echo e($testCases[0]['input'] ?? ''); ?></div>
                                    <div style="color:#94a3b8;">Expected Output:</div>
                                    <div style="color:#34d399; background:rgba(255,255,255,0.05); padding:0.35rem 0.65rem; border-radius:4px; font-family:monospace;"><?php echo e($testCases[0]['expected'] ?? ''); ?></div>
                                </div>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- PANE 2: Custom Standard Input (stdin) -->
                    <div class="testcase-body" id="consoleStdin" style="display: none; padding: 0.85rem 1rem;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                            <label for="customStdinInput" style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">
                                Standard Input (stdin) — Enter runtime inputs line-by-line:
                            </label>
                            <div style="display: flex; gap: 0.4rem;">
                                <button type="button" onclick="document.getElementById('customStdinInput').value = '1\n1';" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: #cbd5e1; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; cursor: pointer;">Sample: 1, 1</button>
                                <button type="button" onclick="document.getElementById('customStdinInput').value = '';" style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; font-size: 0.72rem; padding: 0.15rem 0.45rem; border-radius: 4px; cursor: pointer;">Clear stdin</button>
                            </div>
                        </div>
                        <textarea id="customStdinInput" placeholder="Enter input values here (e.g.&#10;1&#10;1)" style="width: 100%; min-height: 140px; background: #060911; color: #34d399; font-family: 'JetBrains Mono', monospace; font-size: 13px; line-height: 1.5; padding: 0.65rem 0.85rem; border: 1px solid #1e293b; border-radius: 6px; outline: none; box-sizing: border-box; resize: vertical;"></textarea>
                    </div>

                    <!-- PANE 3: Problem Test Cases -->
                    <?php if (!$isSandbox && !empty($testCases)): ?>
                    <div class="testcase-body" id="consoleTestcases" style="display: none; padding: 0.85rem 1rem;">
                        <div style="display: flex; gap: 0.4rem; margin-bottom: 0.75rem;">
                            <?php foreach ($testCases as $idx => $tc): ?>
                            <button type="button" class="testcase-tab-btn <?php echo ($idx === 0) ? 'active' : ''; ?>" onclick="selectTestCaseTab(<?php echo $idx; ?>, this)">
                                Case <?php echo $idx + 1; ?>
                            </button>
                            <?php endforeach; ?>
                        </div>
                        <div id="tcDetailBox" style="background: #060911; border: 1px solid #1e293b; border-radius: 6px; padding: 0.75rem 0.95rem; font-family: monospace; font-size: 0.84rem;">
                            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.2rem;">Input:</div>
                            <div style="color: #e2e8f0; margin-bottom: 0.6rem;"><?php echo e($testCases[0]['input'] ?? ''); ?></div>
                            <div style="color: #94a3b8; font-size: 0.75rem; margin-bottom: 0.2rem;">Expected Output:</div>
                            <div style="color: #34d399;"><?php echo e($testCases[0]['expected'] ?? ''); ?></div>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Action Footer Bar -->
                <div style="padding: 0.75rem 1.15rem; background: var(--table-head-bg); border-top: 1px solid var(--card-border); display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;">
                    <button type="button" class="btn btn-primary" onclick="executeStudioCode('run')" id="runCodeBtn" style="padding: 0.55rem 1.35rem; font-size: 0.86rem; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none;">
                        ▶ Run / Launch GUI App
                    </button>
                    <?php if (!$isSandbox): ?>
                    <button type="button" class="btn btn-primary" onclick="executeStudioCode('submit')" id="submitCodeBtn" style="padding: 0.55rem 1.5rem; font-size: 0.86rem; background: linear-gradient(135deg, #10b981, #059669); border: none;">
                        🚀 Submit Solution (+<?php echo $currentChallenge['points_xp']; ?> XP)
                    </button>
                    <?php endif; ?>
                </div>
        </div>

        <!-- AI Coach Interactive Assistant Modal -->
        <div id="aiCoachModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center; padding:1.25rem; box-sizing:border-box; backdrop-filter:blur(6px);">
            <div style="background:#090d16; border:2px solid #6366f1; border-radius:18px; max-width:640px; width:100%; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.8); overflow:hidden;">
                <div style="padding:1.25rem 1.5rem; background:linear-gradient(135deg, #1e1b4b, #0f172a); border-bottom:1px solid #334155; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span style="font-size:1.6rem;" id="aiModalIcon">🤖</span>
                        <div>
                            <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#ffffff !important;" id="aiModalTitle">AI Engineering Coach</h3>
                            <p style="margin:0.2rem 0 0; font-size:0.82rem; font-weight:600; color:#38bdf8 !important;" id="aiModalSub">Algorithmic Guidance & Analysis</p>
                        </div>
                    </div>
                    <button onclick="closeAiModal()" style="background:none; border:none; color:#f8fafc; font-size:1.6rem; cursor:pointer; padding:0 0.4rem; line-height:1; font-weight:bold;">&times;</button>
                </div>
                <div style="padding:1.5rem; overflow-y:auto; font-size:0.94rem; line-height:1.7; color:#f8fafc !important; background:#090d16;" id="aiModalContent">
                    <!-- Content Injected via triggerAiMentor -->
                </div>
                <div style="padding:0.95rem 1.5rem; background:#060911; border-top:1px solid #1e293b; display:flex; justify-content:flex-end;">
                    <button onclick="closeAiModal()" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg, #6366f1, #8b5cf6); border:none; padding:0.5rem 1.4rem; font-weight:800; font-size:0.88rem;">Got It, Thanks!</button>
                </div>
            </div>
        </div>
    </main>

    <!-- Starters & Studio Engine -->
    <script>
    const challengeStarters = {
        gui_web: `<!-- Interactive Web & Tkinter-style GUI App -->
<div style="padding: 20px; font-family: sans-serif; background: #0f172a; color: #fff; border-radius: 10px;">
    <h2 style="margin: 0 0 10px; color: #38bdf8;">🪟 Interactive GUI Window</h2>
    <p style="color: #94a3b8; font-size: 14px;">Click the buttons to interact with this live application widget:</p>
    
    <div style="display: flex; gap: 10px; align-items: center; margin-top: 15px;">
        <button onclick="changeCount(-1)" style="padding: 8px 16px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">- Decrement</button>
        <span id="counterValue" style="font-size: 22px; font-weight: bold; width: 40px; text-align: center;">0</span>
        <button onclick="changeCount(1)" style="padding: 8px 16px; background: #10b981; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">+ Increment</button>
    </div>

    <div style="margin-top: 15px;">
        <input id="userName" placeholder="Enter your name..." style="padding: 8px 12px; border-radius: 6px; border: 1px solid #334155; background: #1e293b; color: #fff;">
        <button onclick="greetUser()" style="padding: 8px 16px; background: #6366f1; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-left: 8px;">Greet Me</button>
    </div>
    <div id="greetingOutput" style="margin-top: 12px; font-weight: bold; color: #facc15;"></div>
</div>

<script>
let count = 0;
function changeCount(delta) {
    count += delta;
    document.getElementById('counterValue').innerText = count;
}
function greetUser() {
    const name = document.getElementById('userName').value || 'Developer';
    document.getElementById('greetingOutput').innerText = '🎉 Hello, ' + name + '! Welcome to the Interactive GUI!';
}
<\/script>`,
        javascript: <?php echo json_encode($currentChallenge['starter_code_js'] ?: "// JavaScript Solution\nfunction solution() {\n    // Write your solution\n}"); ?>,
        python: <?php echo json_encode($currentChallenge['starter_code_python'] ?: "# Python 3 Solution\ndef solution():\n    pass"); ?>,
        java: <?php echo json_encode($currentChallenge['starter_code_java'] ?: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello from Java!\");\n    }\n}"); ?>,
        cpp: <?php echo json_encode($currentChallenge['starter_code_cpp'] ?: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello from C++!\" << endl;\n    return 0;\n}"); ?>,
        sql: <?php echo json_encode($currentChallenge['starter_code_sql'] ?: "-- SQL Solution\nSELECT * FROM courses;"); ?>
    };

    const isSandboxMode = <?php echo $isSandbox ? 'true' : 'false'; ?>;
    const testCasesList = <?php echo json_encode($testCases); ?>;
    const challengeId = <?php echo (int)$currentChallenge['id']; ?>;
    const textarea = document.getElementById('ideTextarea');
    const gutter = document.getElementById('lineNumbersGutter');

    // Update Line Numbers on Input and Scroll
    function updateLineNumbers() {
        const lines = textarea.value.split('\n').length;
        let lineNumsHtml = '';
        for (let i = 1; i <= Math.max(lines, 18); i++) {
            lineNumsHtml += i + '<br>';
        }
        gutter.innerHTML = lineNumsHtml;
    }

    // Keyboard Shortcuts
    textarea.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            executeStudioCode('run');
        } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
            e.preventDefault();
            executeStudioCode('submit');
        } else if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });

    textarea.addEventListener('input', updateLineNumbers);
    textarea.addEventListener('scroll', function() {
        gutter.scrollTop = this.scrollTop;
    });

    // Interview Mode Timer Logic
    let timerSeconds = 25 * 60;
    let timerInterval = null;
    let timerRunning = false;

    function toggleTimer() {
        const toggleBtn = document.getElementById('timerToggleBtn');
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            if (toggleBtn) {
                toggleBtn.innerText = 'Resume';
                toggleBtn.style.color = '#818cf8';
            }
        } else {
            timerRunning = true;
            if (toggleBtn) {
                toggleBtn.innerText = 'Pause';
                toggleBtn.style.color = '#ef4444';
            }
            timerInterval = setInterval(() => {
                if (timerSeconds > 0) {
                    timerSeconds--;
                    updateTimerDisplay();
                } else {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    if (toggleBtn) {
                        toggleBtn.innerText = 'Start';
                        toggleBtn.style.color = '#818cf8';
                    }
                    alert('⏰ 25-Minute Coding Assessment Time Elapsed! Great job practicing.');
                }
            }, 1000);
        }
    }

    function resetTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerSeconds = 25 * 60;
        updateTimerDisplay();
        const toggleBtn = document.getElementById('timerToggleBtn');
        if (toggleBtn) {
            toggleBtn.innerText = 'Start';
            toggleBtn.style.color = '#818cf8';
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(timerSeconds / 60);
        const secs = timerSeconds % 60;
        const disp = document.getElementById('timerDisplay');
        if (disp) {
            disp.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        textarea.value = isSandboxMode ? challengeStarters['gui_web'] : (challengeStarters['javascript'] || challengeStarters['java']);
        updateLineNumbers();
        updateTimerDisplay();
    });

    function switchIdeLanguage(lang) {
        textarea.value = challengeStarters[lang] || '';
        updateLineNumbers();
    }

    
    function switchConsoleTab(tab) {
        ['output', 'stdin', 'testcases'].forEach(t => {
            const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
            const pane = document.getElementById('console' + t.charAt(0).toUpperCase() + t.slice(1));
            if (btn) btn.classList.toggle('active', t === tab);
            if (pane) pane.style.display = (t === tab) ? 'block' : 'none';
        });
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    function resetBoilerplate() {
        const lang = document.getElementById('languageSelect').value;
        if (confirm('Reset code to initial template?')) {
            textarea.value = challengeStarters[lang] || '';
            updateLineNumbers();
        }
    }

    function injectSandboxTemplate(lang) {
        const langSelect = document.getElementById('languageSelect');
        if (lang === 'gui_app') {
            if (langSelect) langSelect.value = 'gui_web';
            textarea.value = challengeStarters['gui_web'];
        } else if (lang === 'gui_canvas') {
            if (langSelect) langSelect.value = 'gui_web';
            textarea.value = `<!-- Interactive Canvas Visualizer -->
<div style="background:#090d16; padding:15px; border-radius:8px; text-align:center; color:#fff;">
    <h3 style="margin:0 0 10px; color:#10b981;">🎨 Interactive Canvas Animation</h3>
    <canvas id="myCanvas" width="400" height="180" style="background:#1e293b; border-radius:6px; border:1px solid #334155;"></canvas>
    <div style="margin-top:8px;">
        <button onclick="startAnim()" style="padding:6px 14px; background:#10b981; color:#fff; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">▶ Start Ball Bounce</button>
    </div>
</div>

<script>
let x = 50, y = 50, dx = 3, dy = 3, animId = null;
function startAnim() {
    if (animId) return;
    const canvas = document.getElementById('myCanvas');
    const ctx = canvas.getContext('2d');
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI*2);
        ctx.fillStyle = "#38bdf8";
        ctx.fill();
        ctx.closePath();
        if(x + dx > canvas.width - 16 || x + dx < 16) dx = -dx;
        if(y + dy > canvas.height - 16 || y + dy < 16) dy = -dy;
        x += dx; y += dy;
        animId = requestAnimationFrame(draw);
    }
    draw();
}
<\/script>`;
        } else if (lang === 'java') {
            if (langSelect) langSelect.value = 'java';
            textarea.value = challengeStarters['java'] || "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"=== Java 21 Output ===\");\n        int sum = 0;\n        for (int i = 1; i <= 10; i++) sum += i;\n        System.out.println(\"Sum 1 to 10: \" + sum);\n    }\n}";
        } else if (lang === 'python') {
            if (langSelect) langSelect.value = 'python';
            textarea.value = challengeStarters['python'] || "# Python 3 Algorithm & Math\ndef calculate_fibonacci(n):\n    fib = [0, 1]\n    for i in range(2, n):\n        fib.append(fib[-1] + fib[-2])\n    return fib\n\nprint(\"=== Python 3 Output ===\")\nprint(\"Fibonacci (First 10):\", calculate_fibonacci(10))\nprint(\"Environment: Python 3 on Education Algorithm\");";
        } else if (lang === 'sql') {
            if (langSelect) langSelect.value = 'sql';
            textarea.value = challengeStarters['sql'] || "-- SQL Query Scratchpad\nSELECT id, title, price, level FROM courses LIMIT 5;";
        } else {
            if (langSelect) langSelect.value = lang;
            textarea.value = challengeStarters[lang] || '';
        }
        updateLineNumbers();
        executeStudioCode('run');
    }

    function insertCodeSnippet(snippet) {
        if (!snippet) return;
        if (snippet === 'gui_button') {
            textarea.value += `\n<button onclick="alert('Button Clicked!')" style="padding:10px 20px; background:#6366f1; color:#fff; border:none; border-radius:6px; font-weight:bold; cursor:pointer;">Click Me</button>\n`;
        } else if (snippet === 'gui_canvas_box') {
            textarea.value += `\n<canvas id="boxCanvas" width="300" height="150" style="background:#1e293b;"></canvas>\n`;
        } else if (snippet === 'for_loop') {
            textarea.value += `\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}\n`;
        } else if (snippet === 'hash_map') {
            textarea.value += `\nconst map = new Map();\nmap.set('key', 'value');\n`;
        }
        updateLineNumbers();
    }

    async function executeStudioCode(action) {
        switchConsoleTab('output');
        const code = textarea.value;
        const lang = document.getElementById('languageSelect').value;
        const consoleDiv = document.getElementById('consoleOutput');
        const badge = document.getElementById('executionBadge');
        const btn = document.getElementById('runCodeBtn');

        // IF HTML/GUI WEB IS SELECTED -> RENDER DIRECTLY IN LIVE VIEWPORT USING SRCDOC!
        if (lang === 'gui_web' || /<div|<button|<canvas|<script/i.test(code)) {
            badge.innerHTML = `<span style="color:#10b981; font-weight:700;">⚡ GUI Window Live & Interactive</span>`;
            
            // Build full clean HTML wrapper
            const fullHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; }
                    </style>
                </head>
                <body>
                    ${code}
                </body>
                </html>
            `;

            consoleDiv.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                    <strong style="color:#38bdf8; font-size:0.92rem; display:flex; align-items:center; gap:0.4rem;">
                        <span>🖥️</span> Live GUI Window & Interactive Viewport
                    </strong>
                    <span style="font-size:0.74rem; color:#94a3b8; background:rgba(255,255,255,0.06); padding:0.2rem 0.55rem; border-radius:4px;">
                        Interactive • Click inputs & buttons
                    </span>
                </div>
                <iframe class="gui-preview-frame" id="guiPreviewIframe" sandbox="allow-scripts" referrerpolicy="no-referrer" style="width:100%; min-height:280px; background:#0f172a; border:1px solid #334155; border-radius:8px;"></iframe>
            `;
            
            const iframe = document.getElementById('guiPreviewIframe');
            iframe.srcdoc = fullHtml;
            return;
        }

        // Otherwise execute backend language (Java, Python, JS, SQL, C++)
        btn.disabled = true;
        btn.innerHTML = '⏳ Executing...';
        badge.innerHTML = '<span style="color:#f59e0b;">⏳ Running compiler...</span>';

        try {
            const res = await fetch('api-code-runner.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': '<?php echo csrf_token(); ?>'
                },
                body: JSON.stringify({
                    action: action,
                    challenge_id: challengeId,
                    language: lang,
                    code: code,
                    custom_input: document.getElementById('customStdinInput')?.value || ''
                })
            });
            const data = await res.json();
            btn.disabled = false;
            btn.innerHTML = '▶ Run / Launch GUI App';

            if (data.success) {
                badge.innerHTML = data.memory_kb !== null && data.memory_kb !== undefined ? `⚡ Runtime: <strong>${data.execution_time_ms}ms</strong> • Memory: <strong>${data.memory_kb}KB</strong>` : `⚡ Runtime: <strong>${data.execution_time_ms}ms</strong>`;
                const actualOut = escapeHtml(String(data.actual_output || 'No output produced'));
                
                if (data.is_sandbox) {
                    consoleDiv.innerHTML = `
                        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem;">
                            <div style="color:#38bdf8; font-weight:800; font-size:1.05rem;">
                                🖥️ Program Output (stdout)
                            </div>
                            <div style="font-size:0.75rem; color:#94a3b8;">
                                Runtime: <strong style="color:#34d399;">${data.execution_time_ms}ms</strong>
                            </div>
                        </div>
                        <div style="background:#060911; border:1px solid #1e293b; color:#38bdf8; padding:0.65rem 0.95rem; border-radius:6px; font-family:monospace; font-size:0.88rem; white-space:pre-wrap;">${actualOut}</div>
                    `;
                } else {
                    consoleDiv.innerHTML = `
                        <div style="color:#10b981; font-weight:800; font-size:1.05rem; margin-bottom:0.35rem;">
                            🎉 Execution Succeeded (${data.passed_test_cases || 0}/${data.total_test_cases || 0} Cases Passed)
                        </div>
                        <div style="background:#060911; border:1px solid #1e293b; color:#38bdf8; padding:0.5rem 0.85rem; border-radius:6px; font-family:monospace; font-size:0.86rem; white-space:pre-wrap;">${actualOut}</div>
                    `;
                }
            } else {
                consoleDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#f87171; padding:0.65rem 0.95rem; border-radius:6px; font-family:monospace; font-size:0.88rem; white-space:pre-wrap;">Error: ${escapeHtml(String(data.error || 'Execution failed.'))}</div>`;
            }
        } catch (err) {
            btn.disabled = false;
            btn.innerHTML = '▶ Run / Launch GUI App';
            consoleDiv.innerHTML = `<div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; color:#f87171; padding:0.65rem 0.95rem; border-radius:6px; font-family:monospace; font-size:0.88rem;">Network Error: ${escapeHtml(String(err.message || 'Request failed.'))}</div>`;
        }
    }

    // AI Coach Mentorship Tools
    function triggerAiMentor(type) {
        const modal = document.getElementById('aiCoachModal');
        const icon = document.getElementById('aiModalIcon');
        const title = document.getElementById('aiModalTitle');
        const sub = document.getElementById('aiModalSub');
        const content = document.getElementById('aiModalContent');
        const code = textarea.value;
        const lang = document.getElementById('languageSelect').value;

        if (!modal) return;
        modal.style.display = 'flex';

        if (type === 'ai_explain') {
            icon.innerText = '🤖';
            title.innerText = 'AI Bug & Logic Analyzer';
            sub.innerText = 'Active Codebase: ' + lang.toUpperCase() + ' Syntax & Semantic Verification';
            
            let analysisHtml = '';
            if (code.includes('for') || code.includes('while')) {
                analysisHtml += `<div style="background:#131d36; border:1px solid #6366f1; border-left:5px solid #818cf8; padding:0.95rem 1.15rem; border-radius:8px; margin-bottom:1rem; color:#f8fafc;">
                    <strong style="color:#a5b4fc; font-size:1.02rem; display:block; margin-bottom:0.35rem;">🔄 Loop Structure & Boundary Checks</strong>
                    <span style="color:#e2e8f0; line-height:1.6;">Active loops detected. Ensure termination bounds (e.g. <code style="background:#060911; color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:bold;">i &lt; len</code> vs <code style="background:#060911; color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:bold;">i &lt;= len</code>) are guarded against index out-of-bounds errors.</span>
                </div>`;
            }
            if (code.includes('if') || code.includes('else')) {
                analysisHtml += `<div style="background:#0f2420; border:1px solid #10b981; border-left:5px solid #34d399; padding:0.95rem 1.15rem; border-radius:8px; margin-bottom:1rem; color:#f8fafc;">
                    <strong style="color:#6ee7b7; font-size:1.02rem; display:block; margin-bottom:0.35rem;">⚡ Branching & Conditional Logic</strong>
                    <span style="color:#e2e8f0; line-height:1.6;">Validate that all edge cases, falsy/null values, and explicit return paths are accounted for.</span>
                </div>`;
            }
            analysisHtml += `
                <div style="background:#1e293b; border:1px solid #334155; padding:0.95rem 1.15rem; border-radius:8px; color:#f8fafc; line-height:1.65;">
                    <strong style="color:#fbbf24; font-size:1rem; display:block; margin-bottom:0.25rem;">💡 Pro Mentor Recommendation</strong>
                    <span>If debugging failed test cases, add print statements (e.g. <code style="background:#090d16; color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:bold;">print()</code> / <code style="background:#090d16; color:#38bdf8; padding:2px 6px; border-radius:4px; font-weight:bold;">console.log()</code>) before conditionals to trace intermediate variable states in the stdout console below.</span>
                </div>
            `;
            content.innerHTML = analysisHtml;

        } else if (type === 'ai_optimize') {
            icon.innerText = '⚡';
            title.innerText = 'Big-O Time & Space Complexity';
            sub.innerText = 'Theoretical Runtime & Memory Complexity Analysis';

            let complexity = 'O(N)';
            let spaceComp = 'O(1) to O(N)';
            let desc = 'Single-pass traversal detected. Ideal linear scaling for high-throughput and large data cohorts.';

            if ((code.match(/for|while/g) || []).length >= 2) {
                complexity = 'O(N²) (Quadratic)';
                desc = 'Nested loops detected. For N = 100,000, O(N²) reaches 10,000,000,000 operations and will trigger Time Limit Exceeded (TLE). Consider optimizing with a Hash Table / HashMap to achieve O(N) linear time.';
            } else if (code.includes('sort(') || code.includes('.sort')) {
                complexity = 'O(N log N)';
                desc = 'Sorting operation identified. Standard comparison-based lower bound.';
            }

            content.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.95rem; margin-bottom:1.25rem;">
                    <div style="background:#131d36; border:2px solid #6366f1; padding:1rem; border-radius:12px; text-align:center;">
                        <div style="font-size:0.78rem; text-transform:uppercase; color:#a5b4fc; font-weight:800; letter-spacing:0.05em;">TIME COMPLEXITY</div>
                        <div style="font-size:1.65rem; font-weight:900; color:#38bdf8; margin-top:0.35rem;">${complexity}</div>
                    </div>
                    <div style="background:#0f2420; border:2px solid #10b981; padding:1rem; border-radius:12px; text-align:center;">
                        <div style="font-size:0.78rem; text-transform:uppercase; color:#6ee7b7; font-weight:800; letter-spacing:0.05em;">AUXILIARY SPACE</div>
                        <div style="font-size:1.65rem; font-weight:900; color:#34d399; margin-top:0.35rem;">${spaceComp}</div>
                    </div>
                </div>
                <div style="background:#1e293b; border:1px solid #334155; padding:1rem 1.25rem; border-radius:10px;">
                    <strong style="color:#ffffff; font-size:0.98rem; display:block; margin-bottom:0.35rem;">📊 Complexity Assessment:</strong>
                    <p style="color:#f1f5f9; line-height:1.65; margin:0; font-size:0.92rem;">${desc}</p>
                </div>
            `;

        } else if (type === 'ai_edge_cases') {
            icon.innerText = '🧪';
            title.innerText = 'Corner Cases & Stress Tests';
            sub.innerText = 'Must-Test Boundary Conditions for High-Scoring Solutions';

            content.innerHTML = `
                <div style="margin-bottom:0.85rem; color:#f8fafc; font-weight:600; font-size:0.96rem;">
                    Ensure your algorithm accounts for the following FAANG interview boundary constraints:
                </div>
                <div style="display:flex; flex-direction:column; gap:0.65rem;">
                    <div style="background:#1e293b; border-left:4px solid #38bdf8; padding:0.75rem 1rem; border-radius:6px; color:#f8fafc; font-size:0.9rem;">
                        <strong style="color:#38bdf8;">• Empty & Minimum Input:</strong> <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">[]</code>, <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">""</code>, <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">0</code>, or single-element arrays.
                    </div>
                    <div style="background:#1e293b; border-left:4px solid #10b981; padding:0.75rem 1rem; border-radius:6px; color:#f8fafc; font-size:0.9rem;">
                        <strong style="color:#34d399;">• Duplicate Elements:</strong> Arrays with identical duplicate values (e.g. <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">[3, 3]</code> target <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">6</code>).
                    </div>
                    <div style="background:#1e293b; border-left:4px solid #f59e0b; padding:0.75rem 1rem; border-radius:6px; color:#f8fafc; font-size:0.9rem;">
                        <strong style="color:#fbbf24;">• Negative Values & Zero:</strong> Ensure arithmetic and indexing logic handles negative values gracefully.
                    </div>
                    <div style="background:#1e293b; border-left:4px solid #ec4899; padding:0.75rem 1rem; border-radius:6px; color:#f8fafc; font-size:0.9rem;">
                        <strong style="color:#f472b6;">• 32-bit Integer Overflow:</strong> Values exceeding <code style="background:#090d16; color:#facc15; padding:2px 5px; border-radius:4px;">2³¹ − 1 (2,147,483,647)</code>.
                    </div>
                    <div style="background:#1e293b; border-left:4px solid #8b5cf6; padding:0.75rem 1rem; border-radius:6px; color:#f8fafc; font-size:0.9rem;">
                        <strong style="color:#a78bfa;">• High Volume Stress:</strong> Large cohorts (N ≥ 100,000 items) to verify against Time Limit Exceeded (TLE).
                    </div>
                </div>
            `;
        }
    }

    function closeAiModal() {
        const modal = document.getElementById('aiCoachModal');
        if (modal) modal.style.display = 'none';
    }
    </script>
</body>
</html>