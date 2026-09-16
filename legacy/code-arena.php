<?php
$activePage = 'code-arena';
require_once __DIR__ . "/config.php";
require_once __DIR__ . "/includes/auth.php";

$studentId = (int)($_SESSION['student_id'] ?? 0);
$isGuest = ($studentId <= 0);

$defaultStarterCode = "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Welcome to Code Arena Pro Studio!\");\n        int a = 15;\n        int b = 35;\n        System.out.println(\"Calculated Sum: \" + (a + b));\n    }\n}";

$snippet = [
    'title' => 'Code Arena',
    'code'  => $defaultStarterCode,
    'language' => 'java'
];

$rawLang = 'java';
$isWebLang = false;
$csrfToken = csrf_token();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <?php include_once __DIR__ . '/includes/google-analytics.php'; ?>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Arena — Multi-Language Pro Studio • Education Algorithm</title>
    
    <!-- Instant Pre-Paint Theme Initialization -->
    <script>
        (function() {
            try {
                const savedTheme = localStorage.getItem('ea_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                document.documentElement.setAttribute('data-theme', savedTheme);
            } catch(e) {}
        })();
    </script>

    <link rel="stylesheet" href="css/student.css?v=12.0">
    <link rel="stylesheet" href="assets/command-palette.css?v=2.0">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
    <style>
        .playground-wrapper {
            background: #090d16;
            border: 1px solid #1e293b;
            border-radius: var(--radius-lg, 16px);
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
        }

        /* Top Command Toolbar */
        .playground-toolbar {
            background: #0f172a;
            padding: 0.65rem 1.15rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1e293b;
            flex-wrap: wrap;
            gap: 0.75rem;
        }

        .window-controls-group {
            display: flex;
            align-items: center;
            gap: 0.85rem;
        }

        .code-window-dots {
            display: flex;
            gap: 6px;
        }

        .code-dot {
            width: 11px;
            height: 11px;
            border-radius: 50%;
        }
        .code-dot.red { background: #ef4444; }
        .code-dot.yellow { background: #f59e0b; }
        .code-dot.green { background: #10b981; }

        /* Language Switcher Dropdown */
        .lang-select-box {
            background: #1e293b;
            border: 1.5px solid #334155;
            color: #38bdf8;
            font-size: 0.78rem;
            font-weight: 700;
            padding: 0.25rem 0.65rem;
            border-radius: 7px;
            outline: none;
            cursor: pointer;
        }

        /* View Mode Segmented Pill */
        .view-mode-pill {
            display: inline-flex;
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 2px;
            gap: 2px;
        }

        .view-btn {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 0.25rem 0.65rem;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            transition: all 0.15s ease;
        }

        .view-btn:hover {
            color: #f8fafc;
            background: rgba(255, 255, 255, 0.08);
        }

        .view-btn.active {
            background: #4f46e5;
            color: #ffffff;
            font-weight: 700;
            box-shadow: 0 1px 4px rgba(79, 70, 229, 0.4);
        }

        .playground-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        /* Quick Starters Ribbon */
        .quick-templates-bar {
            background: #0d1322;
            border-bottom: 1px solid #1e293b;
            padding: 0.45rem 1.15rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 0.65rem;
            font-size: 0.76rem;
        }

        .template-chips {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            flex-wrap: wrap;
        }

        .template-chip {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #cbd5e1;
            padding: 0.2rem 0.55rem;
            border-radius: 6px;
            font-size: 0.72rem;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .template-chip:hover {
            background: #4f46e5;
            color: #ffffff;
            border-color: #4f46e5;
        }

        /* Dual-Pane Studio Workspace */
        .studio-workspace {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 480px;
            background: #070a11;
        }

        .studio-workspace.view-editor {
            grid-template-columns: 1fr;
        }
        .studio-workspace.view-editor .preview-container {
            display: none;
        }

        .studio-workspace.view-preview {
            grid-template-columns: 1fr;
        }
        .studio-workspace.view-preview .editor-container {
            display: none;
        }

        .editor-container {
            position: relative;
            border-right: 1px solid #1e293b;
            background: #090d16;
            display: flex;
            flex-direction: column;
        }

        .editor-textarea {
            width: 100%;
            height: 100%;
            min-height: 480px;
            background: transparent;
            color: #38bdf8;
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 14px;
            line-height: 1.6;
            padding: 1.25rem 1.35rem;
            border: none;
            resize: none;
            outline: none;
            box-sizing: border-box;
            white-space: pre;
            tab-size: 4;
        }

        .preview-container {
            background: #0b0f19;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-left: 1px solid #1e293b;
        }

        .preview-header {
            background: #0f172a;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            color: #94a3b8;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1e293b;
        }

        .preview-iframe {
            width: 100%;
            flex: 1;
            min-height: 340px;
            border: none;
            background: #ffffff;
        }

        /* Terminal Console for Backend Code */
        .terminal-screen-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #0a0e17;
            padding: 1rem 1.25rem;
            font-family: 'JetBrains Mono', monospace;
            overflow-y: auto;
            color: #e2e8f0;
            min-height: 380px;
        }

        .terminal-cmd-line {
            color: #818cf8;
            font-size: 0.8rem;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }

        .terminal-stdout-pre {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.88rem;
            line-height: 1.6;
            color: #34d399;
            white-space: pre-wrap;
            word-break: break-word;
            margin: 0;
            flex: 1;
        }

        .terminal-meta-row {
            margin-top: 1rem;
            padding-top: 0.75rem;
            border-top: 1px solid #1e293b;
            display: flex;
            gap: 1rem;
            font-size: 0.72rem;
            color: #64748b;
        }

        .console-drawer {
            background: #090d16;
            border-top: 1px solid #1e293b;
            padding: 0.65rem 1rem;
            max-height: 140px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.75rem;
        }

        .console-log-line {
            color: #94a3b8;
            margin-bottom: 4px;
            display: flex;
            gap: 0.4rem;
        }

        .console-tag {
            color: #10b981;
            font-weight: 700;
        }

        @media (max-width: 900px) {
            .studio-workspace {
                grid-template-columns: 1fr;
            }
            .editor-container {
                border-right: none;
                border-bottom: 1px solid #1e293b;
            }
            .preview-container {
                border-left: none;
            }
        }
    
        /* Auto-Detect Toast Notification */
        .auto-detect-toast {
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid #4f46e5;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.35), 0 0 15px rgba(79, 70, 229, 0.2);
            color: #ffffff;
            padding: 0.65rem 1.15rem;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.65rem;
            z-index: 9999;
            backdrop-filter: blur(12px);
            opacity: 0;
            transform: translateY(-12px);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }
        .auto-detect-toast.show {
            opacity: 1;
            transform: translateY(0);
        }

    </style>
<style>
        /* Auto-Detect Toast Notification */
        .auto-detect-toast {
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid #6366f1;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 0 15px rgba(79, 70, 229, 0.25);
            color: #ffffff;
            padding: 0.65rem 1.15rem;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.65rem;
            z-index: 9999;
            backdrop-filter: blur(12px);
            opacity: 0;
            transform: translateY(-12px);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }
        .auto-detect-toast.show {
            opacity: 1;
            transform: translateY(0);
        }
</style>
</head>
<body data-page="code-view">
    <?php include __DIR__ . "/student-nav.php"; ?>

    <main class="app-container" style="max-width: 1280px; margin: 0 auto; padding: 1.25rem 1rem 4rem;">
        <!-- Clean Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.85rem;">
            <div>
                <a href="<?php echo $isGuest ? 'enroll.php?feature=curriculum&source=code_arena' : 'dashboard'; ?>" style="color: #6366f1; text-decoration: none; font-size: 0.82rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; margin-bottom: 0.25rem;">
                    &larr; <?php echo $isGuest ? 'Join Batch & Enroll' : 'Back to Dashboard'; ?>
                </a>
                <h1 style="font-size: 1.45rem; font-weight: 800; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                    <span>Code Arena</span>
                    <span style="font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 999px; background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid #10b981; text-transform: uppercase;">
                        PRO STUDIO
                    </span>
                </h1>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0.15rem 0 0;">
                    Universal Multi-Language IDE • Real-time Python, Java, C++, HTML Web GUI, JavaScript, and SQL
                </p>
            </div>
        </div>

        <!-- Master Interactive Code Studio -->
        <div class="playground-wrapper">
            <!-- Window Command Toolbar -->
            <div class="playground-toolbar">
                <div class="window-controls-group">
                    <div class="code-window-dots">
                        <div class="code-dot red"></div>
                        <div class="code-dot yellow"></div>
                        <div class="code-dot green"></div>
                    </div>

                    <!-- Language Switcher Dropdown -->
                    <select id="langSelector" class="lang-select-box" onchange="onLanguageChange(this.value)">
                        <option value="java" <?php echo ($rawLang === 'java') ? 'selected' : ''; ?>>☕ Java</option>
                        <option value="cpp" <?php echo in_array($rawLang, ['cpp', 'c', 'c++']) ? 'selected' : ''; ?>>⚡ C++</option>
                        <option value="python" <?php echo in_array($rawLang, ['python', 'py']) ? 'selected' : ''; ?>>🐍 Python</option>
                        <option value="html" <?php echo $isWebLang ? 'selected' : ''; ?>>🌐 HTML / Web GUI</option>
                        <option value="javascript" <?php echo in_array($rawLang, ['javascript', 'js', 'node']) ? 'selected' : ''; ?>>📜 JavaScript (Node)</option>
                        <option value="sql" <?php echo ($rawLang === 'sql') ? 'selected' : ''; ?>>🗄️ SQL</option>
                    </select>

                    <!-- View Switcher -->
                    <div class="view-mode-pill">
                        <button type="button" class="view-btn active" id="btnModeSplit" onclick="setViewMode('split')" title="Split Editor & Output">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg> Split View
                        </button>
                        <button type="button" class="view-btn" id="btnModeEditor" onclick="setViewMode('editor')" title="Code Editor Only">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Editor Only
                        </button>
                        <button type="button" class="view-btn" id="btnModePreview" onclick="setViewMode('preview')" title="Live Output Only">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Output Only
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="playground-actions">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="toggleStdinDrawer()" id="btnToggleStdin" style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); font-size: 0.75rem; padding: 0.35rem 0.7rem; font-weight: 700;">
                        ⌨️ Input (STDIN)
                    </button>

                    <label style="margin-bottom: 0; color: #94a3b8; font-size: 0.75rem; display: flex; align-items: center; gap: 0.35rem; cursor: pointer;">
                        <input type="checkbox" id="autoRunToggle" checked style="accent-color: #6366f1; width: 14px; height: 14px; margin: 0;">
                        <span>Live Auto-Run</span>
                    </label>

                    <button class="btn btn-primary btn-sm" onclick="runSandbox()" style="font-size: 0.75rem; padding: 0.35rem 0.85rem; background: #4f46e5; border: none; border-radius: 6px; font-weight: 700;">
                        ▶ Run Code <span class="spotlight-kbd" style="font-size: 0.62rem; margin-left: 0.25rem; background: rgba(0,0,0,0.3); padding: 1px 4px; border-radius: 3px;">Ctrl+↵</span>
                    </button>

                    <button class="btn btn-secondary btn-sm" onclick="resetToOriginal()" style="background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.15); font-size: 0.75rem; padding: 0.35rem 0.7rem;" title="Reset to initial snippet">
                        ↺ Reset
                    </button>

                    <button class="btn btn-secondary btn-sm" id="copyBtn" onclick="copyCodeContent()" style="background: rgba(255,255,255,0.08); color: #fff; border-color: rgba(255,255,255,0.15); font-size: 0.75rem; padding: 0.35rem 0.7rem;">
                        📋 Copy
                    </button>

                    <div style="display: inline-flex; border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; overflow: hidden;">
                        <button type="button" onclick="adjustFontSize(-1)" style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: none; padding: 0.25rem 0.5rem; font-size: 0.72rem; cursor: pointer;" title="Decrease font size">A-</button>
                        <button type="button" onclick="adjustFontSize(1)" style="background: rgba(255,255,255,0.08); color: #cbd5e1; border: none; border-left: 1px solid rgba(255,255,255,0.15); padding: 0.25rem 0.5rem; font-size: 0.72rem; cursor: pointer;" title="Increase font size">A+</button>
                    </div>
                </div>
            </div>

            <!-- Program STDIN Input Drawer -->
            <div id="stdinDrawer" style="display: none; background: #0c101d; border-bottom: 1px solid #1e293b; padding: 0.75rem 1.15rem; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                    <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8;">⌨️ Program Standard Input (STDIN)</span>
                    <span style="font-size: 0.72rem; color: #64748b;">Values consumed by Scanner / cin / input() (space or newline separated)</span>
                </div>
                <textarea id="customStdinInput" style="width: 100%; height: 52px; background: #070a12; border: 1.5px solid #334155; border-radius: 8px; color: #34d399; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; padding: 0.5rem 0.75rem; box-sizing: border-box; resize: vertical;" placeholder="e.g. 5 (or multiple inputs like 10 20)">2 3</textarea>
            </div>

            <!-- Quick Snippet Starters (Dynamically Updated via JS) -->
            <div class="quick-templates-bar">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                    <span style="color: #64748b; font-weight: 600;">⚡ Quick Add:</span>
                    <div class="template-chips" id="templateChipsContainer">
                        <!-- Filled by updateQuickChips() -->
                    </div>
                </div>
                <div style="color: #64748b; font-size: 0.72rem; display: flex; align-items: center; gap: 0.75rem;">
                    <span>💡 Tab key indents code (4 spaces)</span>
                </div>
            </div>

            <!-- AI Code Mentor Toolbar -->
            <div class="ai-mentor-bar" style="background: linear-gradient(90deg, #1e1b4b, #0f172a); border-bottom: 1px solid #312e81; padding: 0.45rem 1.15rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;">
                    <span style="color: #a5b4fc; font-weight: 700; font-size: 0.78rem; display: flex; align-items: center; gap: 0.35rem;">
                        🤖 AI Mentor:
                    </span>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="askAiCode('explain')" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: rgba(99, 102, 241, 0.15); border-color: #6366f1; color: #e0e7ff;">
                        🔍 Explain Logic
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="askAiCode('debug')" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #fecaca;">
                        🐛 Debug & Fix
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="askAiCode('optimize')" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #a7f3d0;">
                        ⚡ Check Big-O
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="askAiCode('testcases')" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #fde68a;">
                        🧪 Test Cases
                    </button>
                </div>
                <div id="aiStatusBadge" style="font-size: 0.72rem; color: #94a3b8;">
                    Ready
                </div>
            </div>

            <!-- AI Code Assistant Result Drawer -->
            <div id="aiResultDrawer" style="display: none; background: #0f172a; border-bottom: 1px solid #1e293b; padding: 0.85rem 1.15rem; color: #f8fafc; font-size: 0.82rem; line-height: 1.45; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; border-bottom: 1px solid #334155; padding-bottom: 0.35rem;">
                    <span style="font-weight: 700; color: #818cf8; font-size: 0.8rem;" id="aiDrawerTitle">🤖 AI Code Mentor Analysis</span>
                    <button type="button" onclick="closeAiDrawer()" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 0.95rem;">✕</button>
                </div>
                <div id="aiDrawerContent" style="max-height: 220px; overflow-y: auto;"></div>
            </div>

            <!-- Workspace Body -->
            <div class="studio-workspace" id="studioWorkspace">
                <!-- Left: Code Editor -->
                <div class="editor-container">
                    <textarea id="liveCodeInput" class="editor-textarea" spellcheck="false"><?php echo htmlspecialchars($snippet["code"]); ?></textarea>
                </div>

                <!-- Right: Output Panel (Web Sandbox OR Terminal Console) -->
                <div class="preview-container" id="outputContainer">
                    <div class="preview-header">
                        <span id="outputPaneTitle">💻 Execution Console</span>
                        <span id="runStatusBadge" style="color: #10b981; font-weight: 700;">● Live Ready</span>
                    </div>

                    <!-- Web Sandbox (iframe) -->
                    <div id="webOutputWrapper" style="display: none; flex: 1; flex-direction: column;">
                        <iframe id="sandboxFrame" sandbox="allow-scripts allow-modals" referrerpolicy="no-referrer" class="preview-iframe" title="Live Code Output"></iframe>
                        <div class="console-drawer" id="consoleOutput">
                            <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 0.2rem;">📋 JavaScript Console Output</div>
                            <div id="consoleLines">
                                <div class="console-log-line"><span class="console-tag">READY:</span> Sandbox initialized. Console logs will appear here.</div>
                            </div>
                        </div>
                    </div>

                    <!-- Backend Terminal Console -->
                    <div id="terminalOutputWrapper" class="terminal-screen-wrapper">
                        <div class="terminal-cmd-line">
                            <span>❯</span> <span id="terminalCmdText" style="color: #38bdf8; font-weight: 700;">$ java run</span>
                        </div>
                        <pre class="terminal-stdout-pre" id="terminalStdout">Executing...</pre>
                        <div class="terminal-meta-row" id="terminalMetaRow">
                            <span>⚡ Time: <strong id="metaExecTime" style="color:#e2e8f0;">--</strong></span>
                            <span>🛡️ Exit Code: <strong id="metaExitCode" style="color:#10b981;">0</strong></span>
                            <span>✓ Verdict: <strong id="metaVerdict" style="color:#10b981;">ACCEPTED</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        const originalCode = <?php echo json_encode($snippet["code"]); ?>;
        let currentLanguage = <?php echo json_encode($rawLang); ?>;
        const csrfSecurityToken = <?php echo json_encode($csrfToken); ?>;
        const codeInput = document.getElementById('liveCodeInput');
        const workspace = document.getElementById('studioWorkspace');
        const autoRunToggle = document.getElementById('autoRunToggle');
        let autoRunTimer = null;

        // 1. Language Configuration & Templates
        const templatesByLang = {
            'java': [
                { label: '+ System.out.println', code: '\n        System.out.println("Output: " + result);' },
                { label: '+ Scanner Input', code: '\n        Scanner sc = new Scanner(System.in);\n        int val = sc.nextInt();' },
                { label: '+ int Variable', code: '\n        int number = 10;' },
                { label: '+ For Loop', code: '\n        for (int i = 0; i < 5; i++) {\n            System.out.println("Item: " + i);\n        }' },
                { label: '+ If-Else', code: '\n        if (num > 0) {\n            System.out.println("Positive");\n        } else {\n            System.out.println("Non-positive");\n        }' }
            ],
            'cpp': [
                { label: '+ cout <<', code: '\n    cout << "The result is: " << result << endl;' },
                { label: '+ cin >>', code: '\n    int a, b;\n    cin >> a >> b;' },
                { label: '+ #include <iostream>', code: '#include <iostream>\nusing namespace std;\n' },
                { label: '+ For Loop', code: '\n    for (int i = 0; i < 5; i++) {\n        cout << i << endl;\n    }' },
                { label: '+ If-Else', code: '\n    if (score >= 50) {\n        cout << "Passed" << endl;\n    }' }
            ],
            'python': [
                { label: '+ print()', code: '\nprint(f"Result: {result}")' },
                { label: '+ input()', code: '\nuser_input = input("Enter value: ")' },
                { label: '+ def function()', code: '\ndef calculate(a, b):\n    return a + b\n' },
                { label: '+ for loop', code: '\nfor i in range(5):\n    print(f"Step {i}")\n' },
                { label: '+ if/else', code: '\nif score >= 90:\n    print("Grade A")\nelse:\n    print("Pass")\n' }
            ],
            'html': [
                { label: '+ Interactive Button', code: '\n<button onclick="alert(\'Clicked!\')" style="background:#4f46e5;color:#fff;border:none;padding:10px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Click Me</button>\n' },
                { label: '+ CSS Card Box', code: '\n<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:1.25rem;max-width:320px;font-family:sans-serif;">\n  <h3 style="margin:0 0 8px;color:#0f172a;">Sample Card</h3>\n  <p style="margin:0;color:#64748b;font-size:14px;">Customizable card component.</p>\n</div>\n' },
                { label: '+ JS Alert Script', code: '\n<script>\n  console.log("Ready!");\n  alert("Hello World");\n<\/script>\n' },
                { label: '+ Modern Gradient', code: '\n<style>\n  body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }\n<\/style>\n' }
            ],
            'javascript': [
                { label: '+ console.log', code: '\nconsole.log("Result:", result);' },
                { label: '+ const func', code: '\nconst calculate = (a, b) => a + b;' },
                { label: '+ for loop', code: '\nfor (let i = 0; i < 5; i++) {\n  console.log(i);\n}' }
            ],
            'sql': [
                { label: '+ SELECT *', code: 'SELECT * FROM users;' },
                { label: '+ WHERE Filter', code: 'SELECT name, department, salary FROM users WHERE salary > 90000;' },
                { label: '+ GROUP BY', code: 'SELECT department, COUNT(*) as total, AVG(salary) as avg_sal FROM users GROUP BY department;' }
            ]
        };

                // Auto-detect code language in real time
        function detectLanguageFromCode(code) {
            const trimmed = code.trim();
            if (!trimmed) return null;

            // 1. HTML5 / Web GUI tags
            if (/<!DOCTYPE\s+html|<(html|head|body|div|button|style|script|canvas|svg|table|form|input|select|textarea|dialog|details|summary|ul|ol|li)\b|<\/(html|head|body|div|button|style|script|canvas|svg|table|form|p|code|span|a|ul|ol|li)>|<p[\s>]|<code[\s>]|<span[\s>]|<a\s+[^>]*href/i.test(trimmed)) {
                return 'html';
            }
            // 2. C++
            if (/#include\s*<|std::|cin\s*>>|cout\s*<<|\b(nullptr|std::vector|std::string)\b/i.test(trimmed)) {
                return 'cpp';
            }
            // 3. Java
            if (/public\s+class|public\s+static\s+void\s+main|System\.out\.(println|print)|import\s+java\.|new\s+Scanner|Scanner\s+\w+/i.test(trimmed)) {
                return 'java';
            }
            // 4. SQL Relational Query
            if (/SELECT\s+.*FROM|INSERT\s+INTO|CREATE\s+TABLE|UPDATE\s+.*SET|DELETE\s+FROM|GROUP\s+BY|ORDER\s+BY/i.test(trimmed)) {
                return 'sql';
            }
            // 5. Python 3
            if (/def\s+\w+\s*\(|class\s+\w+:|self\.\w+|__init__|import\s+(os|sys|json|datetime|math|random|re)|from\s+\w+\s+import|while\s+True:|elif\s+|for\s+\w+\s+in\s+|print\s*\(|input\s*\(/i.test(trimmed)) {
                if (!trimmed.includes('public class') && !trimmed.includes('System.out') && !trimmed.includes('#include') && !trimmed.includes('console.log')) {
                    return 'python';
                }
            }
            // 6. JavaScript / Node.js
            if (/\b(const|let|var)\s+\w+\s*=|console\.(log|warn|error)|\s*=>\s*|document\.getElementById|addEventListener|JSON\.(stringify|parse)|async\s+function|require\(/i.test(trimmed)) {
                return 'javascript';
            }
            return null;
        }

        const langDisplayNames = {
            'python': 'Python 3 🐍',
            'java': 'Java ☕',
            'cpp': 'C++ ⚡',
            'html': 'HTML5 / Web GUI 🌐',
            'javascript': 'JavaScript / Node.js 📜',
            'sql': 'SQL Relational Sandbox 🗄️'
        };

        function showAutoDetectToast(lang) {
            let toast = document.getElementById('autoDetectToast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'autoDetectToast';
                toast.className = 'auto-detect-toast';
                document.body.appendChild(toast);
            }
            const displayName = langDisplayNames[lang] || lang.toUpperCase();
            toast.innerHTML = `<span style="color: #38bdf8;">✨ Auto-Detected</span> <span>${displayName}</span> <span style="font-size: 0.75rem; color: #94a3b8; font-weight: normal;">(Switched Sandbox)</span>`;
            toast.classList.add('show');
            
            clearTimeout(window.__toastTimer);
            window.__toastTimer = setTimeout(() => {
                toast.classList.remove('show');
            }, 2600);
        }

        function checkAutoLanguage(isExplicit = false) {
            const code = codeInput ? codeInput.value : '';
            const detected = detectLanguageFromCode(code);
            if (detected && detected !== currentLanguage) {
                currentLanguage = detected;
                const selector = document.getElementById('langSelector');
                if (selector) selector.value = detected;
                updateQuickChips();
                updateOutputModeUI();
                checkAutoStdin();
                showAutoDetectToast(detected);
                if (isExplicit && typeof runSandbox === 'function') {
                    runSandbox();
                }
            }
        }

        const startersByLang = {
            'java': `public class Main {
    public static void main(String[] args) {
        System.out.println("=========================================");
        System.out.println(" ☕ JAVA 21 PRO STUDIO — EDUCATION ALGORITHM");
        System.out.println("=========================================");
        
        // 1. Array Processing
        int[] numbers = {15, 30, 45, 60, 75};
        int sum = 0;
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("✓ Array Elements Sum: " + sum);
        System.out.println("✓ Average Value: " + (sum / (double)numbers.length));
        
        // 2. Binary Search Algorithm
        int target = 60;
        int index = binarySearch(numbers, target);
        System.out.println("✓ Binary Search for " + target + " -> Found at Index: " + index);
    }
    
    private static int binarySearch(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
}`,
            'cpp': `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    cout << "=========================================" << endl;
    cout << " ⚡ C++ 20 ALGORITHMIC EXECUTION ENGINE" << endl;
    cout << "=========================================" << endl;
    
    vector<int> data = {42, 12, 88, 5, 67, 34};
    cout << "Original Vector: ";
    for (int v : data) cout << v << " ";
    cout << endl;
    
    sort(data.begin(), data.end());
    cout << "✓ Sorted Vector: ";
    for (int v : data) cout << v << " ";
    cout << endl;
    
    cout << "✓ Min Element: " << data.front() << ", Max Element: " << data.back() << endl;
    return 0;
}`,
            'python': `# 🐍 PYTHON 3.12 PRO STUDIO — EDUCATION ALGORITHM
import math

def generate_fibonacci(n):
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

print("=========================================")
print(" 🐍 PYTHON 3.12 ALGORITHMIC EXECUTION")
print("=========================================")

fib = generate_fibonacci(10)
print(f"✓ First 10 Fibonacci Numbers: {fib}")

squares = {x: x**2 for x in range(1, 6)}
print(f"✓ Number Squares Dictionary: {squares}")
print("🚀 Execution Completed Successfully!")`,
            'html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Education Algorithm Live Web Studio</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background: #0f172a;
            color: #f8fafc;
            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 1.5rem;
        }
        .card {
            background: linear-gradient(145deg, #1e1b4b, #312e81);
            border: 1px solid rgba(99, 102, 241, 0.4);
            border-radius: 18px;
            padding: 2rem;
            max-width: 420px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(79, 70, 229, 0.25);
            animation: pulseGlow 3s ease-in-out infinite alternate;
        }
        @keyframes pulseGlow {
            0% { box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(79,70,229,0.2); }
            100% { box-shadow: 0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(79,70,229,0.5); }
        }
        h2 { font-size: 1.35rem; color: #ffffff; margin-bottom: 0.5rem; }
        p { font-size: 0.85rem; color: #a5b4fc; margin-bottom: 1.5rem; }
        .counter-btn {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            font-size: 0.95rem;
            font-weight: 800;
            border-radius: 12px;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.4);
            transition: all 0.2s ease;
        }
        .counter-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(79, 70, 229, 0.6); }
        .count-val { color: #34d399; font-weight: 900; }
    </style>
</head>
<body>
    <div class="card">
        <h2>⚡ Live Interactive Web Studio</h2>
        <p>Education Algorithm Pro Multi-Language Sandbox</p>
        <button class="counter-btn" onclick="inc()">
            🚀 Interactive Counter: <span id="num" class="count-val">0</span>
        </button>
    </div>
    <script>
        let val = 0;
        function inc() {
            val++;
            document.getElementById('num').innerText = val;
            console.log("Updated counter value:", val);
        }
    <\/script>
</body>
</html>`,
            'javascript': `// 📜 JAVASCRIPT NODE.JS PRO STUDIO
console.log("=========================================");
console.log(" 💻 NODE.JS ES6+ HIGH-PERFORMANCE ENGINE");
console.log("=========================================");

const students = [
    { name: "Alex Morgan", track: "Java Full Stack", score: 95 },
    { name: "Rahul Verma", track: "Data Science & AI", score: 88 },
    { name: "Priya Sharma", track: "Cloud DevOps", score: 92 }
];

const topPerformers = students
    .filter(s => s.score >= 90)
    .map(s => \`\${s.name} (\${s.track}) - \${s.score}%\`);

console.log("✓ Top Performing Scholars (>=90%):");
topPerformers.forEach(p => console.log("   • " + p));`,
            'sql': `-- 🗄️ SQL RELATIONAL DATA ENGINE
SELECT 
    c.title AS course_name, 
    COUNT(e.id) AS total_enrolled_scholars, 
    AVG(c.price) AS course_fee
FROM courses c
LEFT JOIN enrollments e ON c.id = e.course_id
GROUP BY c.id, c.title
ORDER BY total_enrolled_scholars DESC;`
        };

        function onLanguageChange(newLang) {
            currentLanguage = newLang;
            if (startersByLang[newLang]) {
                codeInput.value = startersByLang[newLang];
            }
            updateQuickChips();
            updateOutputModeUI();
            checkAutoStdin();
            runSandbox();
        }

        function updateQuickChips() {
            const container = document.getElementById('templateChipsContainer');
            if (!container) return;
            const chips = templatesByLang[currentLanguage] || templatesByLang['java'];
            container.innerHTML = chips.map(c => `
                <button type="button" class="template-chip" onclick="insertSnippetCode('${escapeHtml(c.code)}')">${escapeHtml(c.label)}</button>
            `).join('');
        }

        function updateOutputModeUI() {
            const isWeb = (currentLanguage === 'html' || currentLanguage === 'htm' || currentLanguage === 'css');
            const webWrapper = document.getElementById('webOutputWrapper');
            const termWrapper = document.getElementById('terminalOutputWrapper');
            const titleEl = document.getElementById('outputPaneTitle');
            const cmdTextEl = document.getElementById('terminalCmdText');

            if (isWeb) {
                if (webWrapper) webWrapper.style.display = 'flex';
                if (termWrapper) termWrapper.style.display = 'none';
                if (titleEl) titleEl.textContent = '🖥️ Realtime Web Sandbox Output';
            } else {
                if (webWrapper) webWrapper.style.display = 'none';
                if (termWrapper) termWrapper.style.display = 'flex';
                if (titleEl) titleEl.textContent = `💻 Execution Console ($ ${currentLanguage} run)`;
                if (cmdTextEl) cmdTextEl.textContent = `$ ${currentLanguage} run`;
            }
        }

        // 2. View Mode Switcher (Split / Editor Only / Output Only)
        function setViewMode(mode) {
            workspace.className = 'studio-workspace view-' + mode;
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            if (mode === 'split') document.getElementById('btnModeSplit').classList.add('active');
            if (mode === 'editor') document.getElementById('btnModeEditor').classList.add('active');
            if (mode === 'preview') {
                document.getElementById('btnModePreview').classList.add('active');
                runSandbox();
            }
        }

        // 3. Multi-Language Execution Runner
        function runSandbox() {
            const rawCode = codeInput.value;
            const statusBadge = document.getElementById('runStatusBadge');

            if (!rawCode.trim()) {
                if (statusBadge) statusBadge.textContent = '● Empty Code';
                return;
            }

            statusBadge.textContent = '● Executing...';
            statusBadge.style.color = '#f59e0b';

            const isWeb = (currentLanguage === 'html' || currentLanguage === 'htm' || currentLanguage === 'css');

            if (isWeb) {
                // HTML/Web Sandbox Mode
                const iframe = document.getElementById('sandboxFrame');
                const consoleLines = document.getElementById('consoleLines');
                if (consoleLines) consoleLines.innerHTML = '';
                if (!iframe) return;

                try {
                    const isFullDoc = rawCode.toLowerCase().includes('<html') || rawCode.toLowerCase().includes('<!doctype');
                    const consoleScript = `
                        <script>
                            (function() {
                                const origLog = console.log;
                                console.log = function(...args) {
                                    try { origLog.apply(console, args); } catch(e){}
                                    try { window.parent.postMessage({ type: 'CONSOLE_LOG', data: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') }, '*'); } catch(e){}
                                };
                                window.onerror = function(msg, url, line) {
                                    try { window.parent.postMessage({ type: 'CONSOLE_LOG', data: 'Error: ' + msg + ' (Line ' + line + ')' }, '*'); } catch(e){}
                                };
                            })();
                        <\/script>
                    `;

                    let finalHtml = '';
                    if (isFullDoc) {
                        finalHtml = rawCode.replace(/<head>/i, '<head>' + consoleScript);
                        if (finalHtml === rawCode) finalHtml = consoleScript + rawCode;
                    } else {
                        finalHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>body { margin:0; padding:1rem; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
        /* Auto-Detect Toast Notification */
        .auto-detect-toast {
            position: fixed;
            top: 24px;
            right: 24px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid #4f46e5;
            box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.35), 0 0 15px rgba(79, 70, 229, 0.2);
            color: #ffffff;
            padding: 0.65rem 1.15rem;
            border-radius: 8px;
            font-size: 0.84rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.65rem;
            z-index: 9999;
            backdrop-filter: blur(12px);
            opacity: 0;
            transform: translateY(-12px);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            pointer-events: none;
        }
        .auto-detect-toast.show {
            opacity: 1;
            transform: translateY(0);
        }

    </style>
    ${consoleScript}
</head>
<body>
    ${rawCode}
</body>
</html>`;
                    }

                    iframe.srcdoc = finalHtml;
                    setTimeout(() => {
                        statusBadge.textContent = '● Live Ready';
                        statusBadge.style.color = '#10b981';
                    }, 150);
                } catch (err) {
                    statusBadge.textContent = '● Error';
                    statusBadge.style.color = '#ef4444';
                }
            } else {
                // Backend Languages (Java, C++, Python, Node, SQL)
                const stdoutEl = document.getElementById('terminalStdout');
                const execTimeEl = document.getElementById('metaExecTime');
                const exitCodeEl = document.getElementById('metaExitCode');
                const verdictEl = document.getElementById('metaVerdict');

                fetch('api-code-runner.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfSecurityToken
                    },
                    body: JSON.stringify({
                        action: 'run',
                        language: currentLanguage,
                        code: rawCode,
                        custom_input: document.getElementById('customStdinInput') ? document.getElementById('customStdinInput').value : '',
                        csrf_token: csrfSecurityToken
                    })
                })
                .then(async res => {
                    const text = await res.text();
                    try {
                        return JSON.parse(text);
                    } catch (e) {
                        throw new Error(text || 'Server response could not be parsed');
                    }
                })
                .then(data => {
                    const outText = data.output || data.stderr || data.actual_output || data.error || '';
                    statusBadge.textContent = data.success ? '● Completed' : '● Completed';
                    statusBadge.style.color = data.success ? '#10b981' : '#f59e0b';
                    if (stdoutEl) {
                        stdoutEl.textContent = outText || '(Execution returned no output)';
                        stdoutEl.style.color = data.success ? '#34d399' : '#f87171';
                    }
                    if (execTimeEl) execTimeEl.textContent = (data.execution_time_ms || 12) + 'ms';
                    if (exitCodeEl) {
                        exitCodeEl.textContent = data.exit_code !== undefined ? String(data.exit_code) : (data.success ? '0' : '1');
                        exitCodeEl.style.color = data.success ? '#10b981' : '#ef4444';
                    }
                    if (verdictEl) {
                        verdictEl.textContent = data.verdict || (data.success ? 'ACCEPTED' : 'ERROR');
                        verdictEl.style.color = data.success ? '#10b981' : '#ef4444';
                    }
                })
                .catch(err => {
                    statusBadge.textContent = '● Error';
                    statusBadge.style.color = '#ef4444';
                    if (stdoutEl) {
                        stdoutEl.textContent = 'Execution Error: ' + err.message;
                        stdoutEl.style.color = '#f87171';
                    }
                });
            }
        }

        // Listen for console.log messages from iframe
        window.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'CONSOLE_LOG') {
                const consoleLines = document.getElementById('consoleLines');
                if (consoleLines) {
                    const line = document.createElement('div');
                    line.className = 'console-log-line';
                    line.innerHTML = `<span class="console-tag">LOG:</span> <span>${escapeHtml(e.data.data)}</span>`;
                    consoleLines.appendChild(line);
                }
            }
        });

        // 4. Live Auto-Run on typing (500ms debounce)
                // Auto-detect language immediately on paste
        if (codeInput) {
            codeInput.addEventListener('paste', () => {
                setTimeout(() => {
                    checkAutoLanguage(true);
                }, 50);
            });
        }

        codeInput.addEventListener('input', () => {
            checkAutoLanguage();
            if (autoRunToggle.checked) {
                clearTimeout(autoRunTimer);
                autoRunTimer = setTimeout(runSandbox, 500);
            }
        });

        // 5. Tab key indentation support & Ctrl+Enter to Run
        codeInput.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                runSandbox();
            }
        });

        // 6. Quick Snippet Inserter
        function insertSnippetCode(snippetText) {
            codeInput.value += snippetText;
            checkAutoLanguage();
            checkAutoStdin();
            runSandbox();
        }

        // 7. Toggle STDIN Drawer
        function toggleStdinDrawer(forceOpen = null) {
            const drawer = document.getElementById('stdinDrawer');
            const btn = document.getElementById('btnToggleStdin');
            if (!drawer) return;
            const isOpen = (forceOpen !== null) ? forceOpen : (drawer.style.display !== 'none');
            drawer.style.display = isOpen ? 'none' : 'block';
            if (btn) {
                btn.style.background = isOpen ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.25)';
            }
        }

        function checkAutoStdin() {
            const code = codeInput ? codeInput.value : '';
            if (code.includes('Scanner') || code.includes('System.in') || code.includes('cin >>') || code.includes('input(') || code.includes('sys.stdin')) {
                const drawer = document.getElementById('stdinDrawer');
                if (drawer && drawer.style.display === 'none') {
                    toggleStdinDrawer(false); // open
                }
            }
        }

        if (codeInput) {
            codeInput.addEventListener('input', checkAutoStdin);
        }
        if (document.getElementById('customStdinInput')) {
            document.getElementById('customStdinInput').addEventListener('input', () => {
                if (autoRunToggle.checked) {
                    clearTimeout(autoRunTimer);
                    autoRunTimer = setTimeout(runSandbox, 500);
                }
            });
        }

        // 8. Reset & Copy
        function resetToOriginal() {
            if (confirm('Restore the original code snippet? Any custom edits will be replaced.')) {
                codeInput.value = originalCode;
                checkAutoStdin();
                runSandbox();
            }
        }

        function copyCodeContent() {
            navigator.clipboard.writeText(codeInput.value).then(() => {
                const btn = document.getElementById('copyBtn');
                const orig = btn.innerHTML;
                btn.innerHTML = '<span>✓ Copied!</span>';
                setTimeout(() => { btn.innerHTML = orig; }, 1800);
            });
        }

        let currentFontSize = 14;
        function adjustFontSize(delta) {
            currentFontSize = Math.max(11, Math.min(22, currentFontSize + delta));
            codeInput.style.fontSize = currentFontSize + 'px';
        }

        function escapeHtml(str) {
            return String(str).replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
        }

        // 9. AI Code Mentor Integration
        async function askAiCode(action) {
            const code = codeInput.value.trim();
            if (!code) {
                alert('Editor is empty! Please write some code first.');
                return;
            }

            const badge = document.getElementById('aiStatusBadge');
            const drawer = document.getElementById('aiResultDrawer');
            const titleEl = document.getElementById('aiDrawerTitle');
            const contentEl = document.getElementById('aiDrawerContent');

            badge.textContent = '● Analyzing with Gemini AI...';
            badge.style.color = '#818cf8';

            const actionTitles = {
                'explain': '🔍 AI Code Logic Explanation',
                'debug': '🐛 AI Bug Analysis & Fixes',
                'optimize': '⚡ Time & Space Complexity (Big-O)',
                'testcases': '🧪 Generated Edge Test Cases'
            };

            titleEl.textContent = actionTitles[action] || '🤖 AI Code Mentor Analysis';
            contentEl.innerHTML = '<div style="color: #94a3b8; padding: 0.5rem 0;">Analyzing code with Gemini AI engine...</div>';
            drawer.style.display = 'block';

            try {
                const res = await fetch('api-ai-code.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: action,
                        code: code,
                        language: currentLanguage,
                        title: <?php echo json_encode($snippet['title']); ?>
                    })
                });

                const data = await res.json();
                const replyContent = data.content || data.reply || "";
                if (data.success || replyContent) {
                    badge.textContent = '✓ Ready';
                    badge.style.color = '#10b981';
                    contentEl.innerHTML = formatMarkdown(replyContent);
                } else {
                    badge.textContent = '● Analysis Error';
                    badge.style.color = '#ef4444';
                    contentEl.innerHTML = `<div style="color: #ef4444;">${escapeHtml(data.error || 'Failed to analyze code.')}</div>`;
                }
            } catch (err) {
                badge.textContent = '● Network Error';
                badge.style.color = '#ef4444';
                contentEl.innerHTML = '<div style="color: #ef4444;">Connection error. Please try again.</div>';
            }
        }

        function closeAiDrawer() {
            document.getElementById('aiResultDrawer').style.display = 'none';
        }

        function formatMarkdown(text) {
            let html = escapeHtml(text);
            // Clean LaTeX Math rendering: \(O(N)\) -> styled badge
            html = html.replace(/\\\((.*?)\\\)/g, '<code style="background:rgba(99,102,241,0.2);color:#a5b4fc;padding:2px 6px;border-radius:4px;font-family:monospace;font-weight:700;">$1</code>');
            html = html.replace(/\\\[(.*?)\\\]/g, '<div style="margin:4px 0;background:rgba(99,102,241,0.15);color:#a5b4fc;padding:4px 8px;border-radius:6px;font-family:monospace;font-weight:700;">$1</div>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 5px; border-radius: 4px; color: #38bdf8;">$1</code>');
            html = html.replace(/\n/g, '<br>');
            return html;
        }

        // Initialize Studio
        document.addEventListener('DOMContentLoaded', () => {
            checkAutoLanguage();
            updateQuickChips();
            updateOutputModeUI();
            checkAutoStdin();
            runSandbox();
        });
    </script>
</body>
</html>