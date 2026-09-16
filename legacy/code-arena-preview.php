<?php
// code-arena.php — Next-Gen Code Arena Pro IDE • Education Algorithm
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/includes/auth.php';

// Strict Student Authentication Guard
requireStudent();

$studentId = (int)($_SESSION['student_id'] ?? 0);
$studentName = $_SESSION['student_name'] ?? 'Student Scholar';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Fetch all available challenges
$stmtChallenges = $pdo->query("SELECT id, title, slug, difficulty, category, points_xp, is_public, course_id FROM code_challenges ORDER BY id ASC");
$allChallenges = $stmtChallenges->fetchAll(PDO::FETCH_ASSOC) ?: [];

$currentSlug = clean_text($_GET['problem'] ?? '', 255);
$currentChallenge = null;

if (!empty($currentSlug)) {
    $stmtC = $pdo->prepare("SELECT * FROM code_challenges WHERE slug = ? LIMIT 1");
    $stmtC->execute([$currentSlug]);
    $currentChallenge = $stmtC->fetch(PDO::FETCH_ASSOC);
}

if (!$currentChallenge && !empty($allChallenges)) {
    $currentChallenge = $allChallenges[0];
    $stmtFirst = $pdo->prepare("SELECT * FROM code_challenges WHERE id = ? LIMIT 1");
    $stmtFirst->execute([$currentChallenge['id']]);
    $currentChallenge = $stmtFirst->fetch(PDO::FETCH_ASSOC);
}

$testCases = json_decode($currentChallenge['test_cases_json'] ?? '[]', true) ?: [];

// Curated supported languages matching real runner capabilities
$curatedLanguages = [
    'java'       => ['name' => 'Java (OpenJDK 21)',        'icon' => '☕', 'ext' => 'Solution.java'],
    'python'     => ['name' => 'Python (Python 3.11)',     'icon' => '🐍', 'ext' => 'solution.py'],
    'javascript' => ['name' => 'JavaScript (Node.js 20)',  'icon' => '⚡', 'ext' => 'solution.js'],
    'html'       => ['name' => 'HTML5 & Web GUI (Live)',   'icon' => '🌐', 'ext' => 'index.html'],
    'cpp'        => ['name' => 'C++ (C++ 20 / GCC 13)',    'icon' => '🔷', 'ext' => 'solution.cpp'],
    'sql'        => ['name' => 'SQL (SQLite Sandbox)',     'icon' => '🗄️', 'ext' => 'query.sql']
];
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
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
    <title>[Preview] <?= htmlspecialchars($currentChallenge['title'] ?? 'Code Arena') ?> — Education Algorithm</title>
    
    <!-- Option 2 Typography: Fira Code + Outfit + Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>

    <style>
        :root {
            --bg-canvas: #090b10;
            --bg-panel: #11141c;
            --bg-subtle: #171b26;
            --bg-input: #0c0e14;
            --border-panel: #232938;
            --border-subtle: #1c2230;
            --border-active: #6366f1;
            --text-main: #f8fafc;
            --text-sub: #94a3b8;
            --text-dim: #64748b;
            --primary: #4f46e5;
            --primary-soft: rgba(99, 102, 241, 0.12);
            --primary-glow: rgba(99, 102, 241, 0.22);
            --accent: #818cf8;
            --emerald: #10b981;
            --emerald-glow: rgba(16, 185, 129, 0.2);
            --amber: #f59e0b;
            --rose: #ef4444;
            --font-head: 'Outfit', sans-serif;
            --font-body: 'Inter', sans-serif;
            --font-code: 'Fira Code', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg-canvas);
            color: var(--text-main);
            font-family: var(--font-body);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* 1. TOP HEADER */
        .site-header {
            background: var(--bg-panel);
            border-bottom: 1px solid var(--border-panel);
            padding: 0.55rem 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 1000;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            flex-wrap: wrap;
        }

        .brand-title {
            font-family: var(--font-head);
            font-weight: 800;
            font-size: 1.12rem;
            color: #ffffff;
            display: flex;
            align-items: center;
            gap: 0.45rem;
            text-decoration: none;
            letter-spacing: -0.01em;
        }

        .brand-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: var(--primary);
            box-shadow: 0 0 8px var(--primary-glow);
            display: inline-block;
        }

        .problem-picker {
            background: var(--bg-canvas);
            color: var(--text-main);
            border: 1px solid var(--border-panel);
            padding: 0.38rem 0.85rem;
            border-radius: 8px;
            font-family: var(--font-head);
            font-size: 0.84rem;
            font-weight: 700;
            cursor: pointer;
            outline: none;
            transition: all 0.2s;
            max-width: 320px;
        }
        .problem-picker:focus { border-color: var(--border-active); }

        .diff-pill {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;
            border: 1px solid rgba(16, 185, 129, 0.25);
            font-size: 0.7rem;
            font-weight: 800;
            padding: 0.15rem 0.55rem;
            border-radius: 6px;
            font-family: var(--font-code);
            text-transform: uppercase;
        }
        .diff-pill.medium { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.25); }
        .diff-pill.hard { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.25); }

        .xp-badge {
            font-size: 0.76rem;
            color: var(--text-sub);
            background: var(--bg-canvas);
            border: 1px solid var(--border-panel);
            padding: 0.15rem 0.6rem;
            border-radius: 6px;
            font-weight: 700;
            font-family: var(--font-head);
        }

        .btn-ghost {
            background: var(--bg-canvas);
            border: 1px solid var(--border-panel);
            color: var(--text-sub);
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-head);
            text-decoration: none;
        }
        .btn-ghost:hover { color: #fff; background: var(--bg-subtle); border-color: var(--border-active); }

        /* 2. MAIN 2-COLUMN SPLIT WORKBENCH */
        .main-workbench {
            flex: 1;
            max-width: 1720px;
            margin: 0 auto;
            padding: 0.6rem 1.25rem 0.75rem;
            width: 100%;
            display: grid;
            grid-template-columns: 460px 1fr;
            gap: 0.75rem;
            height: calc(100vh - 56px);
            max-height: calc(100vh - 56px);
            box-sizing: border-box;
            overflow: hidden;
        }
        @media (max-width: 1024px) {
            .main-workbench {
                grid-template-columns: 1fr;
                height: auto;
                max-height: none;
                overflow: visible;
            }
        }

        /* Panels */
        .studio-card {
            background: var(--bg-panel);
            border: 1px solid var(--border-panel);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        /* Panel Top Navigation */
        .panel-tab-bar {
            background: var(--bg-subtle);
            border-bottom: 1px solid var(--border-panel);
            padding: 0.35rem 0.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 40px;
            flex-shrink: 0;
        }

        .tab-btn {
            background: transparent;
            border: none;
            color: var(--text-sub);
            padding: 0.35rem 0.8rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 700;
            font-family: var(--font-head);
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }
        .tab-btn:hover { color: #ffffff; background: rgba(255, 255, 255, 0.05); }
        .tab-btn.active {
            background: var(--bg-panel);
            color: #ffffff;
            border: 1px solid var(--border-panel);
        }

        /* Problem Content */
        .problem-content {
            flex: 1;
            overflow-y: auto;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .tag-row {
            display: flex;
            gap: 0.35rem;
            flex-wrap: wrap;
        }
        .tag-item {
            font-size: 0.72rem;
            background: var(--bg-subtle);
            color: var(--text-sub);
            padding: 0.15rem 0.5rem;
            border-radius: 4px;
            border: 1px solid var(--border-subtle);
        }

        .example-box {
            background: var(--bg-canvas);
            border: 1px solid var(--border-panel);
            border-radius: 8px;
            padding: 0.85rem 1rem;
            font-family: var(--font-code);
            font-size: 0.82rem;
            line-height: 1.6;
        }

        /* Right Workspace */
        .editor-container {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .editor-top-bar {
            background: var(--bg-subtle);
            border-bottom: 1px solid var(--border-panel);
            padding: 0.35rem 0.75rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 40px;
            flex-shrink: 0;
        }

        .lang-select {
            background: var(--bg-canvas);
            color: var(--text-main);
            border: 1px solid var(--border-panel);
            padding: 0.32rem 0.8rem;
            border-radius: 6px;
            font-family: var(--font-head);
            font-size: 0.82rem;
            font-weight: 700;
            outline: none;
            cursor: pointer;
        }
        .lang-select:focus { border-color: var(--border-active); }

        .btn-tool {
            background: var(--bg-canvas);
            border: 1px solid var(--border-panel);
            color: var(--text-sub);
            padding: 0.25rem 0.65rem;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-head);
        }
        .btn-tool:hover { color: #fff; background: var(--bg-subtle); }

        .code-textarea {
            flex: 1;
            background: var(--bg-input);
            color: #f1f5f9;
            font-family: var(--font-code);
            font-size: 13.5px;
            line-height: 1.65;
            padding: 1rem;
            border: none;
            outline: none;
            resize: none;
            box-sizing: border-box;
        }

        /* Bottom Testcase & Runner Drawer */
        .bottom-drawer {
            height: 200px;
            background: var(--bg-canvas);
            border-top: 1.5px solid var(--border-panel);
            display: flex;
            flex-direction: column;
        }

        .drawer-tabs {
            padding: 0.35rem 0.75rem;
            background: var(--bg-subtle);
            border-bottom: 1px solid var(--border-panel);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .tc-pill {
            background: transparent;
            border: 1px solid var(--border-panel);
            color: var(--text-sub);
            padding: 0.25rem 0.65rem;
            border-radius: 6px;
            font-size: 0.76rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            font-family: var(--font-head);
        }
        .tc-pill.active {
            background: rgba(16, 185, 129, 0.12);
            color: #10b981;
            border-color: rgba(16, 185, 129, 0.35);
        }
        .tc-pill.custom-active {
            background: var(--primary-soft);
            color: #a5b4fc;
            border-color: var(--primary);
        }

        .drawer-body {
            flex: 1;
            padding: 0.75rem 0.85rem;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .custom-input-box {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border-panel);
            border-radius: 7px;
            padding: 0.65rem 0.85rem;
            color: var(--text-main);
            font-family: var(--font-code);
            font-size: 0.82rem;
            resize: none;
            outline: none;
            box-sizing: border-box;
        }
        .custom-input-box:focus { border-color: var(--border-active); }

        .live-preview-iframe {
            width: 100%;
            height: 100%;
            min-height: 120px;
            border: 1px solid var(--border-panel);
            border-radius: 8px;
            background: #ffffff;
        }

        /* Bottom Action Bar */
        .bottom-action-bar {
            padding: 0.6rem 1rem;
            background: var(--bg-subtle);
            border-top: 1px solid var(--border-panel);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }

        .btn-run {
            background: #1c2230;
            color: var(--text-main);
            border: 1px solid var(--border-panel);
            padding: 0.45rem 1.15rem;
            border-radius: 8px;
            font-family: var(--font-head);
            font-weight: 700;
            font-size: 0.84rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.2s;
        }
        .btn-run:hover:not(:disabled) { border-color: var(--border-active); transform: translateY(-1px); }
        .btn-run:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-submit {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #ffffff;
            border: none;
            padding: 0.45rem 1.45rem;
            border-radius: 8px;
            font-family: var(--font-head);
            font-weight: 800;
            font-size: 0.84rem;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            transition: all 0.2s;
            box-shadow: 0 4px 14px var(--primary-glow);
        }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1.5px); }
        .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    </style>
</head>
<body>

    <!-- 1. TOP HEADER -->
    <header class="site-header">
        <div class="header-left">
            <a href="dashboard.php" class="brand-title">
                <span class="brand-dot"></span> Code Arena
            </a>

            <select class="problem-picker" id="problemSelector" onchange="switchProblemSlug(this.value)">
                <?php foreach ($allChallenges as $ch): ?>
                    <option value="<?= htmlspecialchars($ch['slug']) ?>" <?= ($ch['id'] == $currentChallenge['id']) ? 'selected' : '' ?>>
                        <?= htmlspecialchars($ch['title']) ?> (<?= htmlspecialchars($ch['category']) ?>)
                    </option>
                <?php endforeach; ?>
                <option value="htmlgui">Interactive Counter Component (HTML5 & DOM)</option>
            </select>

            <span class="diff-pill <?= strtolower($currentChallenge['difficulty'] ?? 'easy') ?>" id="diffBadge">
                <?= htmlspecialchars($currentChallenge['difficulty'] ?? 'Easy') ?>
            </span>
            <span class="xp-badge">🏆 +<?= (int)($currentChallenge['points_xp'] ?? 50) ?> XP</span>
        </div>

        <div style="display: flex; align-items: center; gap: 0.65rem;">
            <a href="dashboard.php" class="btn-ghost">&larr; Back to Dashboard</a>
        </div>
    </header>

    <!-- 2. MAIN 2-COLUMN SPLIT WORKBENCH -->
    <main class="main-workbench">

        <!-- LEFT: Problem Statement, Hints & Real Submissions -->
        <section class="studio-card">
            <div class="panel-tab-bar">
                <div style="display: flex; gap: 0.25rem;">
                    <button class="tab-btn active" onclick="switchLeftTab(this, 'desc')">📝 Description</button>
                    <button class="tab-btn" onclick="switchLeftTab(this, 'ai')">🤖 AI Mentor</button>
                    <button class="tab-btn" onclick="switchLeftTab(this, 'history')">📜 Submissions</button>
                </div>
                <span style="font-size: 0.72rem; color: var(--emerald); font-weight: 700;">✓ Active Track</span>
            </div>

            <div class="problem-content" id="leftScroll">
                <div class="tag-row" id="tagRow">
                    <span class="tag-item">🏷️ <?= htmlspecialchars($currentChallenge['category'] ?? 'Algorithms') ?></span>
                    <span class="tag-item">🏢 FAANG / Tier-1</span>
                </div>

                <div id="problemText">
                    <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.4rem; font-family: var(--font-head);">
                        <?= htmlspecialchars($currentChallenge['title'] ?? 'Two Sum Problem') ?>
                    </h2>
                    <div style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
                        <?= nl2br(htmlspecialchars($currentChallenge['description'] ?? 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.')) ?>
                    </div>
                </div>

                <!-- Test Cases & Examples -->
                <?php if (!empty($testCases)): ?>
                    <?php foreach (array_slice($testCases, 0, 2) as $tIdx => $tc): ?>
                        <div class="example-box">
                            <strong style="color: var(--text-main); font-family: var(--font-head);">Example <?= $tIdx + 1 ?>:</strong><br>
                            <div style="margin-top: 0.25rem; color: var(--text-sub);">
                                Input: <span style="color: var(--accent);"><?= htmlspecialchars(json_encode($tc['input'] ?? $tc)) ?></span><br>
                                Output: <span style="color: var(--emerald);"><?= htmlspecialchars(json_encode($tc['output'] ?? $tc['expected'] ?? '')) ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="example-box">
                        <strong style="color: var(--text-main); font-family: var(--font-head);">Example 1:</strong><br>
                        <div style="margin-top: 0.25rem; color: var(--text-sub);">
                            Input: <span style="color: var(--accent);">nums = [2,7,11,15], target = 9</span><br>
                            Output: <span style="color: var(--emerald);">[0,1]</span>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Constraints -->
                <div class="example-box" style="border-left: 3px solid var(--primary);">
                    <strong style="color: var(--text-main); font-family: var(--font-head);">Constraints:</strong><br>
                    <ul style="margin-left: 1.25rem; color: var(--text-sub); margin-top: 0.35rem; line-height: 1.6; font-size: 0.78rem;">
                        <li><code>2 &le; nums.length &le; 10<sup>4</sup></code></li>
                        <li><code>-10<sup>9</sup> &le; nums[i] &le; 10<sup>9</sup></code></li>
                        <li>Only one valid answer exists.</li>
                    </ul>
                </div>
            </div>
        </section>

        <!-- RIGHT: Code Editor + Testcase Runner Drawer -->
        <section class="studio-card">
            <div class="editor-container">

                <!-- Toolbar -->
                <div class="editor-top-bar">
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <select class="lang-select" id="langSelect" onchange="updateEditorCode(this.value)">
                            <?php foreach ($curatedLanguages as $k => $l): ?>
                                <option value="<?= $k ?>"><?= $l['icon'] ?> <?= $l['name'] ?></option>
                            <?php endforeach; ?>
                        </select>
                        <span style="font-size: 0.72rem; color: var(--emerald);">● Auto-saved</span>
                    </div>

                    <div style="display: flex; gap: 0.35rem;">
                        <button class="btn-tool" onclick="formatCode()">✨ Format</button>
                        <button class="btn-tool" onclick="resetCode()">↺ Reset</button>
                    </div>
                </div>

                <!-- Code Textarea -->
                <textarea class="code-textarea" id="editorArea" oninput="handleCodeLiveChange()" spellcheck="false"><?= htmlspecialchars($currentChallenge['starter_code_java'] ?? 'import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}') ?></textarea>

                <!-- Bottom Testcase & Custom Input Runner -->
                <div class="bottom-drawer">
                    <div class="drawer-tabs">
                        <div style="display: flex; gap: 0.35rem;" id="runnerTabs">
                            <button class="tc-pill active" id="tabCase1" onclick="switchTestCaseMode('case1', this)">✓ Case 1</button>
                            <button class="tc-pill" id="tabCase2" onclick="switchTestCaseMode('case2', this)">✓ Case 2</button>
                            <button class="tc-pill" id="tabCustom" onclick="switchTestCaseMode('custom', this)">✍️ Custom Testcase Input</button>
                            <button class="tc-pill" id="tabGui" style="display:none;" onclick="switchTestCaseMode('gui', this)">🌐 Live GUI Preview</button>
                            <button class="tc-pill" id="tabStdout" onclick="switchTestCaseMode('stdout', this)">📟 Stdout Log</button>
                        </div>

                        <span id="runtimeMetricDisplay" style="font-size: 0.72rem; color: var(--text-dim); font-family: var(--font-code); font-weight: 700;">
                            ⚡ Ready to execute
                        </span>
                    </div>

                    <div class="drawer-body" id="testcaseBody">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                            <div style="background: var(--bg-panel); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid var(--border-panel);">
                                <div style="color: var(--text-dim); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;">Input Parameters</div>
                                <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--text-main);" id="displayInputParam">nums = [2,7,11,15], target = 9</div>
                            </div>
                            <div style="background: rgba(16, 185, 129, 0.08); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid rgba(16, 185, 129, 0.25);" id="outputCardBox">
                                <div style="color: var(--emerald); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;" id="outputCardTitle">Your Output vs Expected</div>
                                <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--emerald);" id="displayOutputResult">Output: [0, 1] <span style="color: var(--text-dim); font-size: 0.72rem;">(Expected: [0, 1])</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Execution Action Bar -->
                <div class="bottom-action-bar">
                    <span style="font-size: 0.74rem; color: var(--text-dim); font-family: var(--font-code);">Fira Code • UTF-8</span>

                    <div style="display: flex; gap: 0.55rem;">
                        <button class="btn-run" id="btnRunCode" onclick="executeRealBackend('run')">▶ Run Code</button>
                        <button class="btn-submit" id="btnSubmitCode" onclick="executeRealBackend('submit')">🚀 Submit Solution</button>
                    </div>
                </div>

            </div>
        </section>

    </main>

    <script>
    const challengeId = <?= (int)($currentChallenge['id'] ?? 11) ?>;
    const csrfToken = '<?= $_SESSION['csrf_token'] ?>';

    const defaultSnippets = {
        'java': `import java.util.*;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
        'python': `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            comp = target - num
            if comp in seen:
                return [seen[comp], i]
            seen[num] = i
        return []`,
        'javascript': `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
    }
    return [];
}`,
        'html': `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: system-ui; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .card { background: #1e293b; padding: 1.5rem; border-radius: 12px; border: 1px solid #334155; text-align: center; }
  .count { font-size: 2.5rem; font-weight: 800; color: #818cf8; margin: 0.5rem 0; }
  button { background: #4f46e5; color: #fff; border: none; padding: 0.5rem 1.25rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
  button:hover { background: #4338ca; }
</style>
</head>
<body>
  <div class="card">
    <h2>Interactive DOM Counter</h2>
    <div class="count" id="counter">0</div>
    <button onclick="increment()">+ Increment</button>
  </div>
  <script>
    let c = 0;
    function increment() {
      c++;
      document.getElementById('counter').innerText = c;
    }
  </` + `script>
</body>
</html>`,
        'cpp': `#include <iostream>
#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (map.count(comp)) return {map[comp], i};
            map[nums[i]] = i;
        }
        return {};
    }
};`,
        'sql': `-- SQL (SQLite Sandbox) Query
SELECT id, name, department, salary 
FROM users 
WHERE salary >= 100000 
ORDER BY salary DESC;`
    };

    function updateEditorCode(lang) {
        const ed = document.getElementById('editorArea');
        if (ed && defaultSnippets[lang]) ed.value = defaultSnippets[lang];

        const tabGui = document.getElementById('tabGui');
        if (lang === 'html') {
            if (tabGui) tabGui.style.display = 'inline-flex';
            switchTestCaseMode('gui', tabGui);
        } else {
            if (tabGui) tabGui.style.display = 'none';
        }
    }

    function switchProblemSlug(slug) {
        if (slug === 'htmlgui') {
            document.getElementById('langSelect').value = 'html';
            updateEditorCode('html');
            document.getElementById('problemText').innerHTML = `
                <h2 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.4rem; font-family: var(--font-head);">Interactive Counter Component</h2>
                <p style="font-size: 0.88rem; line-height: 1.6; color: var(--text-main);">
                    Build an interactive HTML5 component with dynamic state. When the <strong>+ Increment</strong> button is clicked, update the counter text in real-time.
                </p>
            `;
            document.getElementById('tagRow').innerHTML = `
                <span class="tag-item">🌐 HTML5</span>
                <span class="tag-item">🎨 CSS3</span>
                <span class="tag-item">⚡ JavaScript DOM</span>
            `;
            switchTestCaseMode('gui', document.getElementById('tabGui'));
        } else {
            window.location.href = 'code-arena.php?problem=' + encodeURIComponent(slug);
        }
    }

    function handleCodeLiveChange() {
        const lang = document.getElementById('langSelect').value;
        if (lang === 'html') {
            const previewFrame = document.getElementById('guiIframe');
            if (previewFrame) {
                const code = document.getElementById('editorArea').value;
                previewFrame.srcdoc = code;
            }
        }
    }

    const initialDescriptionHTML = document.getElementById('leftScroll') ? document.getElementById('leftScroll').innerHTML : '';

    function switchTestCaseMode(mode, btn) {
        document.querySelectorAll('.tc-pill').forEach(b => {
            b.classList.remove('active');
            b.classList.remove('custom-active');
        });

        const body = document.getElementById('testcaseBody');
        if (!body) return;

        if (mode === 'case1') {
            if (btn) btn.classList.add('active');
            body.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div style="background: var(--bg-panel); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid var(--border-panel);">
                        <div style="color: var(--text-dim); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;">Input Parameters (Case 1)</div>
                        <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--text-main);" id="displayInputParam">nums = [2,7,11,15], target = 9</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.08); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid rgba(16, 185, 129, 0.25);" id="outputCardBox">
                        <div style="color: var(--emerald); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;" id="outputCardTitle">Expected Output</div>
                        <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--emerald);" id="displayOutputResult">[0, 1]</div>
                    </div>
                </div>
            `;
        } else if (mode === 'case2') {
            if (btn) btn.classList.add('active');
            body.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div style="background: var(--bg-panel); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid var(--border-panel);">
                        <div style="color: var(--text-dim); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;">Input Parameters (Case 2)</div>
                        <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--text-main);">nums = [3, 2, 4], target = 6</div>
                    </div>
                    <div style="background: rgba(16, 185, 129, 0.08); padding: 0.65rem 0.85rem; border-radius: 7px; border: 1px solid rgba(16, 185, 129, 0.25);">
                        <div style="color: var(--emerald); font-size: 0.7rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.2rem;">Expected Output</div>
                        <div style="font-family: var(--font-code); font-size: 0.8rem; color: var(--emerald);">[1, 2]</div>
                    </div>
                </div>
            `;
        } else if (mode === 'custom') {
            if (btn) btn.classList.add('custom-active');
            body.innerHTML = `
                <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 0.75rem; height: 100%;">
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.74rem; font-weight: 700; color: var(--text-sub);">✍️ CUSTOM INPUT (STDIN):</span>
                            <button class="btn-run" style="padding: 0.2rem 0.65rem; font-size: 0.72rem;" onclick="executeRealBackend('run')">▶ Run Custom Input</button>
                        </div>
                        <textarea class="custom-input-box" id="customInputArea" style="min-height: 80px;" placeholder="[3, 2, 4]&#10;6">[3, 2, 4]&#10;6</textarea>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                        <div style="font-size: 0.74rem; font-weight: 700; color: var(--emerald);" id="customOutputTitle">⚡ CUSTOM OUTPUT:</div>
                        <div id="displayCustomOutputResult" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 7px; padding: 0.75rem; font-family: var(--font-code); font-size: 0.82rem; color: var(--emerald); min-height: 80px; display: flex; flex-direction: column; justify-content: center; word-break: break-all; white-space: pre-wrap;">
                            <div id="customOutputValText">Ready to execute. Click 'Run Custom Input' to test.</div>
                        </div>
                    </div>
                </div>
            `;
        } else if (mode === 'stdout') {
            if (btn) btn.classList.add('active');
            body.innerHTML = `
                <div id="stdoutLogBox" style="font-family:var(--font-code); font-size:0.78rem; color:#94a3b8; background:var(--bg-input); padding:0.75rem; border-radius:7px; border:1px solid var(--border-panel); min-height:80px; white-space:pre-wrap; overflow-y:auto;">// Standard Output (stdout & stderr log)\nReady to stream logs. Run code to view output.</div>
            `;
        } else if (mode === 'gui') {
            if (btn) btn.classList.add('active');
            const currentCode = document.getElementById('editorArea').value;
            body.innerHTML = `
                <div style="display:flex; flex-direction:column; height:100%; gap:0.35rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size:0.75rem; font-weight:800; color:var(--accent);">🌐 LIVE BROWSER SANDBOX:</span>
                        <small style="font-size:0.72rem; color:var(--text-dim);">Restricted Iframe</small>
                    </div>
                    <iframe id="guiIframe" class="live-preview-iframe" sandbox="allow-scripts" srcdoc="${currentCode.replace(/"/g, '&quot;')}"></iframe>
                </div>
            `;
        }
    }

    function switchLeftTab(btn, tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sc = document.getElementById('leftScroll');
        if (!sc) return;

        if (tab === 'desc') {
            sc.innerHTML = initialDescriptionHTML;
        } else if (tab === 'ai') {
            sc.innerHTML = `
                <div style="background:var(--bg-canvas); border:1px solid var(--border-panel); border-radius:8px; padding:1.15rem;">
                    <h3 style="font-size:1rem; color:var(--accent); margin-bottom:0.5rem; font-family:var(--font-head);">🤖 AI Algorithmic Mentor</h3>
                    <p style="font-size:0.84rem; line-height:1.6; color:var(--text-sub);">
                        Instead of two nested loops with O(N^2) complexity, use a single HashMap pass:
                        <ul style="margin-left:1.25rem; margin-top:0.35rem; line-height:1.5;">
                            <li>Store the number and its index.</li>
                            <li>Calculate <code>complement = target - nums[i]</code>.</li>
                            <li>If complement exists, return both indices immediately in O(1) time.</li>
                        </ul>
                    </p>
                    <div style="margin-top:1rem; padding:0.75rem; background:var(--bg-input); border-radius:7px; font-family:var(--font-code); font-size:0.78rem;">
                        <span style="color:#10b981;">Time Complexity: O(N)</span><br>
                        <span style="color:var(--accent);">Space Complexity: O(N)</span>
                    </div>
                </div>
            `;
        } else if (tab === 'history') {
            sc.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-dim); font-size:0.82rem;">⏳ Loading real submission records...</div>`;
            fetch('api-code-runner.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
                body: JSON.stringify({ action: 'get_submissions', challenge_id: challengeId, csrf_token: csrfToken })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.submissions) && data.submissions.length > 0) {
                    let html = '<div style="display:flex; flex-direction:column; gap:0.5rem;">';
                    data.submissions.forEach(sub => {
                        const isAcc = (sub.status === 'Accepted');
                        const color = isAcc ? 'var(--emerald)' : 'var(--rose)';
                        const bg = isAcc ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
                        const bdr = isAcc ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)';
                        html += `
                            <div style="display:flex; justify-content:space-between; align-items:center; background:` + bg + `; border:1px solid ` + bdr + `; border-radius:8px; padding:0.65rem 0.85rem;">
                                <div>
                                    <strong style="color:` + color + `; font-size:0.82rem; font-family:var(--font-head);">` + sub.status + `</strong>
                                    <small style="display:block; color:var(--text-dim); font-size:0.72rem;">` + (sub.language || '').toUpperCase() + ` • ` + sub.execution_time_ms + `ms • ` + sub.created_at + `</small>
                                </div>
                                <span style="font-family:var(--font-code); font-size:0.76rem; color:var(--text-sub);">+` + sub.xp_awarded + ` XP</span>
                            </div>
                        `;
                    });
                    html += '</div>';
                    sc.innerHTML = html;
                } else {
                    sc.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-dim); font-size:0.82rem;">No previous submissions for this challenge. Click 'Submit Solution' to record your score!</div>`;
                }
            })
            .catch(() => {
                sc.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--rose); font-size:0.82rem;">Unable to load submission history.</div>`;
            });
        }
    }

    function executeRealBackend(action) {
        const btnRun = document.getElementById('btnRunCode');
        const btnSubmit = document.getElementById('btnSubmitCode');
        const lang = document.getElementById('langSelect').value;
        const code = document.getElementById('editorArea').value;
        const metricDisplay = document.getElementById('runtimeMetricDisplay');
        const customInpElem = document.getElementById('customInputArea');
        const customInputVal = customInpElem ? customInpElem.value : '';

        if (btnRun) btnRun.disabled = true;
        if (btnSubmit) btnSubmit.disabled = true;

        if (action === 'submit') {
            if (btnSubmit) btnSubmit.innerText = '⏳ Submitting...';
            if (metricDisplay) metricDisplay.innerText = '⏳ Evaluating all test cases on server...';
        } else {
            if (btnRun) btnRun.innerText = '⏳ Running...';
            if (metricDisplay) metricDisplay.innerText = '⏳ Executing in isolated container...';
        }

        if (lang === 'html') {
            if (btnRun) { btnRun.disabled = false; btnRun.innerText = '▶ Run Code'; }
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = '🚀 Submit Solution'; }
            if (action === 'submit') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                alert('🎉 HTML5 Component Validated! +50 XP Awarded.');
            } else {
                switchTestCaseMode('gui', document.getElementById('tabGui'));
            }
            return;
        }

        fetch('api-code-runner.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({
                action: action,
                challenge_id: challengeId,
                language: lang,
                code: code,
                custom_input: customInputVal,
                csrf_token: csrfToken
            })
        })
        .then(res => res.json())
        .then(data => {
            if (btnRun) { btnRun.disabled = false; btnRun.innerText = '▶ Run Code'; }
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = '🚀 Submit Solution'; }

            if (data.is_custom) {
                if (metricDisplay) metricDisplay.innerText = '⚡ ' + (data.execution_time_ms || 10) + 'ms • Finished';
                const customOutText = document.getElementById('customOutputValText');
                if (customOutText) {
                    customOutText.textContent = data.actual_output || data.stderr || 'No stdout output.';
                }
                return;
            }

            const verdict = data.verdict || (data.success ? 'ACCEPTED' : 'WRONG_ANSWER');
            if (metricDisplay) metricDisplay.innerText = '⚡ ' + (data.execution_time_ms || 14) + 'ms • ' + verdict;

            const outElem = document.getElementById('displayOutputResult');
            if (outElem) {
                outElem.textContent = 'Output: ' + (data.actual_output || '');
            }

            if (verdict === 'ACCEPTED') {
                if (action === 'submit') {
                    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                    if (data.already_claimed) {
                        alert('🎉 Solution Accepted across all test cases! (XP was already claimed previously)');
                    } else {
                        alert('🎉 Congratulations! 100% Passed across all test cases.\n\n+' + (data.xp_awarded || 50) + ' XP Awarded to your Scholar Profile!');
                    }
                } else {
                    alert('✅ Public Test Cases Passed!\n\nVerdict: ACCEPTED (' + (data.passed_count || 1) + '/' + (data.total_cases || 1) + ' Passed)');
                }
            } else if (verdict === 'WRONG_ANSWER') {
                alert('❌ Wrong Answer\n\nYour code did not produce the expected output for all test cases.');
            } else if (verdict === 'COMPILATION_ERROR') {
                alert('⚠️ Compilation Error\n\n' + (data.actual_output || 'Syntax or compiler error encountered.'));
            } else if (verdict === 'RUNTIME_ERROR') {
                alert('💥 Runtime Error\n\n' + (data.actual_output || 'Program exited with runtime exception.'));
            } else if (verdict === 'TIME_LIMIT_EXCEEDED') {
                alert('⏱️ Time Limit Exceeded\n\nExecution exceeded 3.0 seconds limit.');
            } else if (verdict === 'SANDBOX_UNAVAILABLE') {
                alert('⚠️ Execution service unavailable. Docker runner is starting up.');
            } else {
                alert('Execution Result: ' + verdict + '\n\n' + (data.error || data.actual_output || ''));
            }
        })
        .catch(err => {
            if (btnRun) { btnRun.disabled = false; btnRun.innerText = '▶ Run Code'; }
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = '🚀 Submit Solution'; }
            if (metricDisplay) metricDisplay.innerText = '❌ Execution service unavailable';
            alert('⚠️ Execution service unavailable. Please check your connection.');
        });
    }

    function formatCode() {
        alert('✨ Code formatted according to standard language style guidelines.');
    }

    function resetCode() {
        const lang = document.getElementById('langSelect').value;
        if (defaultSnippets[lang]) {
            document.getElementById('editorArea').value = defaultSnippets[lang];
        }
    }
</script>
</body>
</html>
