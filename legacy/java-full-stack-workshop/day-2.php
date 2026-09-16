<?php
// java-full-stack-workshop/day-2.php — Day 2: Advanced Interactive Web Dev & Full-Stack Highway
// Route: /java-full-stack-workshop/day-2
require_once __DIR__ . '/../config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Day 2: Web Development & Full-Stack Highway | Education Algorithm</title>
    <meta name="description" content="Day 2 of Education Algorithm's Free 2-Day Live Java Full Stack Workshop. Multi-theme CSS visualizers, 8-step full-stack highway tracer, and career roadmap.">
    <link rel="canonical" href="https://educationalgorithm.com/java-full-stack-workshop/day-2">
    
    <!-- OpenGraph Tags -->
    <meta property="og:title" content="Day 2: Web Development & Full-Stack Highway | Education Algorithm">
    <meta property="og:description" content="Understand what users see and how Java connects to the web in Day 2 of our free live workshop.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://educationalgorithm.com/java-full-stack-workshop/day-2">
    
    <!-- Scoped Custom CSS -->
    <link rel="stylesheet" href="../css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
</head>
<body class="jfw-workshop">

    <!-- DAY 2 PASSCODE LOCK OVERLAY -->
    <div id="jfwDay2LockOverlay" class="jfw-lock-modal-overlay">
        <div class="jfw-lock-card">
            <span class="jfw-lock-icon">🔒</span>
            <span class="jfw-badge" style="margin-bottom: 0.75rem;">DAY 2 IS PROTECTED</span>
            <h2 style="color: #ffffff; margin: 0.5rem 0 1rem 0; font-size: 1.6rem; font-family: var(--jfw-font-heading);">
                ENTER UNLOCK PASSCODE
            </h2>
            <p style="color: var(--jfw-text-muted); font-size: 0.92rem; margin-bottom: 1.5rem; line-height: 1.6;">
                Day 2 Web Development content is reserved for students who have completed Day 1 or joined the live webinar session.
            </p>

            <form id="jfwLockForm" onsubmit="return false;">
                <input type="password" id="jfwPasscodeInput" class="jfw-lock-input" placeholder="Enter Passcode..." autocomplete="off">
                <button type="submit" id="jfwUnlockBtn" class="jfw-btn jfw-btn-primary" style="width: 100%; padding: 0.85rem; margin-top: 0.5rem;">
                    UNLOCK DAY 2 CONTENT 🔓
                </button>
            </form>

            <div id="jfwLockError" class="jfw-lock-error">
                ❌ Invalid Passcode. Please check with your instructor or complete Day 1.
            </div>

            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <a href="day-1" class="jfw-btn jfw-btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.85rem;">
                    ← BACK TO DAY 1 (JAVA BASICS)
                </a>
                <a href="../java-full-stack-roadmap" class="jfw-btn jfw-btn-secondary" style="width: 100%; padding: 0.65rem; font-size: 0.85rem; border-color: #38bdf8; color: #38bdf8;">
                    EXPLORE CURRICULUM ROADMAP →
                </a>
            </div>

            <div style="margin-top: 1.25rem; font-size: 0.8rem; color: var(--jfw-text-subtle); border-top: 1px solid var(--jfw-border); padding-top: 0.85rem;">
                💡 <em>Hint: Passcode is revealed live during the webinar session.</em>
            </div>
        </div>
    </div>

    <!-- GLOBAL STICKY NAVBAR -->
    <header class="jfw-header">
        <div class="jfw-container">
            <div class="jfw-header-inner">
                <!-- EXACT EDUCATION ALGORITHM BRAND LOGO -->
                <a href="../" class="jfw-brand-logo">
                    <svg class="ea-logo" width="34" height="34" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Education Algorithm"><g class="ea-g"><path class="ea-base" d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><g class="ea-capg"><path class="ea-cap" d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/></g><g class="ea-tas"><path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/></g></g></svg>
                    <span>Education Algorithm</span>
                    <span class="jfw-brand-badge">EDTECH</span>
                </a>

                <ul class="jfw-nav-links">
                    <li><a href="day-1" class="jfw-nav-link">Day 1 (Java)</a></li>
                    <li><a href="day-2" class="jfw-nav-link active">Day 2 (Web)</a></li>
                    <li><a href="../java-full-stack-roadmap" class="jfw-nav-link">Curriculum Roadmap</a></li>
                    <li><a href="#assembly-section" class="jfw-nav-link">Assembly</a></li>
                    <li><a href="#html-section" class="jfw-nav-link">HTML</a></li>
                    <li><a href="#css-section" class="jfw-nav-link">CSS Visualizer</a></li>
                    <li><a href="#js-section" class="jfw-nav-link">JavaScript</a></li>
                    <li><a href="#house-guide" class="jfw-nav-link">4-Layer House</a></li>
                    <li><a href="#deep-dive-matrix" class="jfw-nav-link">Deep-Dive</a></li>
                    <li><a href="#java-connect-section" class="jfw-nav-link">Java Highway</a></li>
                    <li><a href="#webinar-offer" class="jfw-nav-link">Special Offer</a></li>
                </ul>

                <div>
                    <a href="../enroll?coupon=STUDENT" class="jfw-btn jfw-btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.88rem;">
                        RESERVE SEAT (₹15K OFFER)
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- FLOATING WORKSHOP PROGRESS TRACKER -->
    <div class="jfw-floating-progress">
        <a href="day-1" class="jfw-progress-pill done">
            <span class="jfw-progress-dot"></span> ✓ DAY 1: JAVA
        </a>
        <span style="color: var(--jfw-text-subtle);">|</span>
        <a href="day-2" class="jfw-progress-pill active">
            <span class="jfw-progress-dot"></span> ● DAY 2: WEB
        </a>
    </div>

    <!-- 1. 3D HERO SECTION (DAY 2) -->
    <section class="jfw-hero jfw-hero-3d-scene">
        <div class="jfw-container">
            <div class="jfw-hero-grid">
                <div>
                    <span class="jfw-badge" style="margin-bottom: 1.25rem;">
                        ⚡ DAY 2 — WEB DEVELOPMENT & FULL STACK
                    </span>

                    <h1 class="jfw-hero-title">
                        WHAT PEOPLE SEE <br>
                        AND HOW <span class="jfw-gradient-accent">JAVA CONNECTS TO IT</span>
                    </h1>

                    <p class="jfw-hero-subtitle">
                        Master the 3 web layers (HTML, CSS, JavaScript) and trace live data packets moving between browser and Java Spring Boot.
                    </p>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                        <a href="../enroll?coupon=STUDENT" class="jfw-btn jfw-btn-primary jfw-btn-large">🚀 RESERVE MY SEAT (₹15K OFFER)</a>
                        <a href="#assembly-section" class="jfw-btn jfw-btn-secondary jfw-btn-large">EXPLORE WEBSITE ASSEMBLY ↓</a>
                    </div>
                </div>

                <!-- RIGHT: 3D HERO CANVAS -->
                <div>
                    <div class="jfw-hero-3d-canvas">
                        <div class="jfw-code-card-header">
                            <div class="jfw-dots">
                                <span class="jfw-dot jfw-dot-red"></span>
                                <span class="jfw-dot jfw-dot-yellow"></span>
                                <span class="jfw-dot jfw-dot-green"></span>
                            </div>
                            <span class="jfw-mono" style="font-size: 0.78rem; color: var(--jfw-text-subtle);">FullStackPipeline.js</span>
                        </div>
                        <div class="jfw-code-card-body">
                            <div class="jfw-mono" style="font-size: 0.88rem; color: #a5b4fc; line-height: 1.7;">
                                <span style="color: #64748b;">// 1. Browser User Action</span><br>
                                const user = { name: <span style="color: #34d399;">"Rahul"</span> };<br><br>
                                <span style="color: #64748b;">// 2. HTTP POST Request ➔ Java API</span><br>
                                fetch(<span style="color: #38bdf8;">"/api/profile"</span>, { method: <span style="color: #f59e0b;">"POST"</span> });<br><br>
                                <span style="color: #10b981; font-weight: 700;">✓ 200 OK — Java Processed Profile Data</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION 01: WHAT IS A WEBSITE? (THE 3-LAYER STACK) -->
    <section class="jfw-section" id="assembly-section">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SECTION 01</span>
                <h2 class="jfw-section-title">WHAT IS A WEBSITE? (THE 3 LAYERS)</h2>
                <p class="jfw-section-desc">Every website on the internet is built from three complementary layers working together:</p>
            </div>

            <!-- INTERACTIVE ASSEMBLY CANVAS STEPPER -->
            <div class="jfw-card" style="max-width: 900px; margin: 0 auto; background: var(--jfw-surface); padding: 2rem;">
                <div style="display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
                    <button type="button" id="jfwAssemblyStep1Btn" class="jfw-btn-micro active">1. HTML STRUCTURE</button>
                    <button type="button" id="jfwAssemblyStep2Btn" class="jfw-btn-micro">2. CSS DESIGN</button>
                    <button type="button" id="jfwAssemblyStep3Btn" class="jfw-btn-micro">3. JAVASCRIPT INTERACTION</button>
                </div>

                <div id="jfwAssemblyBrowserCanvas" style="background: #040712; padding: 2rem; border-radius: 12px; border: 1px solid var(--jfw-border); min-height: 220px; transition: all 0.3s ease;">
                    <div style="color: #ffffff; font-family: sans-serif;">
                        <h3>My Student Profile</h3>
                        <p>Welcome to my web page!</p>
                        <input placeholder="Enter name..." style="padding: 4px 8px;">
                        <button id="jfwAssemblyDemoBtn" style="padding: 4px 8px;">Click Me</button>
                    </div>
                </div>

                <div id="jfwAssemblyExplainText" style="margin-top: 1.25rem; font-size: 0.92rem; color: #cbd5e1; text-align: center;">
                    💡 <strong>HTML (Structure):</strong> Decides what elements (headings, text, inputs, buttons) exist on the page.
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION 02: HTML — BUILD THE STRUCTURE -->
    <section class="jfw-section" id="html-section">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SECTION 02</span>
                <h2 class="jfw-section-title">HTML — BUILD THE STRUCTURE</h2>
                <p class="jfw-section-desc">HTML (HyperText Markup Language) tells the browser what elements should exist on the page.</p>
            </div>

            <!-- HOUSE ANALOGY vs WEBPAGE -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 900px; margin: 0 auto 2.5rem auto;">
                <div class="jfw-card">
                    <strong style="color: var(--jfw-accent-cyan); font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">🏠 House Analogy:</strong>
                    <ul style="color: var(--jfw-text-muted); padding-left: 1.25rem; margin: 0; line-height: 1.8;">
                        <li>House ➔ Outer Frame</li>
                        <li>Rooms ➔ Content Sections</li>
                        <li>Doors ➔ Input Openings</li>
                        <li>Windows ➔ Visual Views</li>
                    </ul>
                </div>

                <div class="jfw-card">
                    <strong style="color: var(--jfw-accent-purple); font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">🌐 Webpage Structure:</strong>
                    <ul style="color: var(--jfw-text-muted); padding-left: 1.25rem; margin: 0; line-height: 1.8;">
                        <li><code>&lt;div&gt;</code> ➔ Section Container</li>
                        <li><code>&lt;h1&gt;</code> ➔ Main Heading</li>
                        <li><code>&lt;input&gt;</code> ➔ Data Input Field</li>
                        <li><code>&lt;button&gt;</code> ➔ Clickable Action</li>
                    </ul>
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION 03: WHAT IS CSS? (MULTI-THEME VISUALIZER & SLIDER) -->
    <section class="jfw-section" id="css-section" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SECTION 03</span>
                <h2 class="jfw-section-title">WHAT IS CSS? (MULTI-THEME VISUALIZER)</h2>
                <p class="jfw-section-desc">CSS styles raw HTML elements. Toggle theme presets to see CSS transform aesthetics instantly:</p>
            </div>

            <!-- THEME PRESET BUTTONS -->
            <div style="display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <button type="button" class="jfw-theme-btn active" data-theme="default">DEFAULT SAAS DARK</button>
                <button type="button" class="jfw-theme-btn" data-theme="cyberpunk">CYBERPUNK NEON</button>
                <button type="button" class="jfw-theme-btn" data-theme="minimal">CLEAN MINIMAL</button>
            </div>

            <!-- BEFORE / AFTER DRAGGABLE SLIDER -->
            <div class="jfw-ba-wrapper">
                <div class="jfw-ba-before">
                    <h3 style="margin-top: 0; color: #000; font-size: 1.3rem;">My Career Profile</h3>
                    <p style="margin: 0.5rem 0;">Name: [ Rahul ]</p>
                    <p style="margin: 0.5rem 0 1.25rem 0;">College: [ ABC Engineering ]</p>
                    <button style="padding: 4px 8px; cursor: pointer;">Button</button>
                </div>

                <div id="jfwBaAfterOverlay" class="jfw-ba-after">
                    <div class="jfw-ba-after-inner">
                        <h3 style="margin-top: 0; color: var(--jfw-accent-cyan); font-size: 1.3rem;">🎓 My Career Profile</h3>
                        <p style="color: #cbd5e1; margin: 0.5rem 0;">Name: <strong style="color: #fff;">Rahul Sharma</strong></p>
                        <p style="color: #cbd5e1; margin: 0.5rem 0 1.25rem 0;">College: <strong style="color: #fff;">ABC Engineering</strong></p>
                        <button type="button" class="jfw-btn jfw-btn-primary" style="padding: 0.45rem 1rem; font-size: 0.85rem;">🚀 Create Profile</button>
                    </div>
                </div>
            </div>

            <!-- SLIDER CONTROL BAR -->
            <div class="jfw-ba-slider-container">
                <div style="margin-bottom: 0.5rem; font-weight: 700; font-size: 0.85rem; color: var(--jfw-accent-cyan);">
                    ⬅ DRAG SLIDER TO COMPARE: UNSTYLED HTML (LEFT) vs STYLED CSS (RIGHT) ➡
                </div>
                <input type="range" id="jfwBaSlider" min="0" max="100" value="50">
            </div>
        </div>
    </section>

    <!-- SECTION 04: JAVASCRIPT — MAKE THE PAGE RESPOND -->
    <section class="jfw-section" id="js-section">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SECTION 04</span>
                <h2 class="jfw-section-title">JAVASCRIPT — MAKE THE PAGE RESPOND</h2>
                <p class="jfw-section-desc">JavaScript makes your webpage interactive by reacting to user clicks and keystrokes instantly:</p>
            </div>

            <!-- JAVASCRIPT EVENT PIPELINE VISUALIZER -->
            <div class="jfw-card" style="max-width: 900px; margin: 0 auto; background: var(--jfw-surface); padding: 2.25rem;">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <button type="button" id="jfwJsMainClickBtn" class="jfw-btn jfw-btn-primary jfw-btn-large">
                        CLICK ME ⚡ (TRIGGER EVENT PIPELINE)
                    </button>
                </div>

                <div id="jfwJsBrowserText" style="text-align: center; margin-bottom: 2rem; min-height: 40px; font-size: 1.1rem; color: var(--jfw-text-muted);">
                    Waiting for user click...
                </div>

                <!-- 5-STEP PIPELINE NODES -->
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; text-align: center;">
                    <div class="jfw-pipeline-node" style="background: #040712; padding: 0.85rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.78rem;">
                        1. User Clicks
                    </div>
                    <div class="jfw-pipeline-node" style="background: #040712; padding: 0.85rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.78rem;">
                        2. Browser Detects
                    </div>
                    <div class="jfw-pipeline-node" style="background: #040712; padding: 0.85rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.78rem;">
                        3. JS Triggered
                    </div>
                    <div class="jfw-pipeline-node" style="background: #040712; padding: 0.85rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.78rem;">
                        4. Logic Runs
                    </div>
                    <div class="jfw-pipeline-node" style="background: #040712; padding: 0.85rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.78rem;">
                        5. UI Updates
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SPOON-FED 4-LAYER SMART HOUSE WEB TUTORIAL -->
    <section class="jfw-section" id="house-guide" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SPOON-FED 4-LAYER HOUSE ANALOGY</span>
                <h2 class="jfw-section-title">HOW WEBSITES & FULL STACK WORK (SUPER SIMPLE)</h2>
                <p class="jfw-section-desc">Think of building a full-stack web app like building a smart house:</p>
            </div>

            <div style="max-width: 960px; margin: 0 auto;">
                <div class="jfw-recipe-step-card">
                    <span class="jfw-analogy-badge">🧱 HOUSE LAYER 1: HTML IS THE BRICKS & FRAME (STRUCTURE)</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        HTML builds the physical walls, room partitions, doors (input boxes), and doorbells (buttons) on the page.
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #38bdf8; font-size: 0.85rem;">
                        &lt;h3&gt;Student Profile&lt;/h3&gt; &lt;input placeholder="Enter name..."&gt; &lt;button&gt;Submit&lt;/button&gt;
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-cyan);">
                    <span class="jfw-analogy-badge">🎨 HOUSE LAYER 2: CSS IS THE PAINT & INTERIOR DESIGN</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        CSS paints the walls dark blue, rounds the card corners, and adds glowing lights so the page looks modern and attractive!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #38bdf8; font-size: 0.85rem;">
                        .profile-card { background: #0e172e; color: #ffffff; border-radius: 12px; }
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-amber);">
                    <span class="jfw-analogy-badge">🔔 HOUSE LAYER 3: JAVASCRIPT IS THE SMART DOORBELL SENSOR</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        JavaScript acts like a smart sensor. When a visitor presses the button, JavaScript detects the click instantly!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #a5b4fc; font-size: 0.85rem;">
                        button.addEventListener('click', function() { alert('Profile Created!'); });
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-emerald);">
                    <span class="jfw-analogy-badge">🔒 HOUSE LAYER 4: JAVA & DATABASE IS THE SECURE STORAGE VAULT</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        Java takes the user's data from the door, carries it inside, and locks it inside a permanent storage locker (Database Table) so it is never lost!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #34d399; font-size: 0.85rem;">
                        Java Backend receives data ➔ Saves row permanently in MySQL Database
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 4-COLUMN DEEP-DIVE WEB & FULL-STACK MATRIX -->
    <section class="jfw-section" id="deep-dive-matrix" style="background: var(--jfw-bg);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">FULL STACK DEEP DIVE</span>
                <h2 class="jfw-section-title">4-COLUMN WEB & FULL STACK MATRIX</h2>
                <p class="jfw-section-desc">Understand how each web layer functions in the browser, GPU engine, and backend database:</p>
            </div>

            <div style="max-width: 1040px; margin: 0 auto; overflow-x: auto;">
                <table class="jfw-deepdive-table">
                    <thead>
                        <tr>
                            <th>Layer Code Line</th>
                            <th>Zero-Jargon Meaning</th>
                            <th>Browser / Engine Action</th>
                            <th>Real App Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="jfw-mono" style="color: #38bdf8;">&lt;input id="name" placeholder="..."&gt;</td>
                            <td>Creates a blank typing box on the webpage screen.</td>
                            <td>Instantiates HTMLInputElement DOM node in browser memory.</td>
                            <td>Amazon checkout form address typing box.</td>
                        </tr>
                        <tr>
                            <td class="jfw-mono" style="color: #38bdf8;">.card { background: #0e172e; }</td>
                            <td>Paints the container card dark SaaS blue.</td>
                            <td>Computes CSS box model and renders GPU texture layer.</td>
                            <td>Spotify Dark Mode theme UI aesthetics.</td>
                        </tr>
                        <tr>
                            <td class="jfw-mono" style="color: #a5b4fc;">btn.addEventListener('click', ...);</td>
                            <td>Tells browser to run code when user clicks button.</td>
                            <td>Registers async event handler in JS Event Loop.</td>
                            <td>Swiggy "Place Order" button instant click trigger.</td>
                        </tr>
                        <tr>
                            <td class="jfw-mono" style="color: #34d399;">INSERT INTO student VALUES (...);</td>
                            <td>Saves user data row permanently in database table.</td>
                            <td>Writes B-Tree index node to disk storage permanently.</td>
                            <td>Bank account balance record persistence.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- SECTION 05: WHERE JAVA FITS (THE FULL STACK HIGHWAY) -->
    <section class="jfw-section" id="java-connect-section" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SECTION 05</span>
                <h2 class="jfw-section-title">WHERE JAVA FITS (THE FULL STACK HIGHWAY)</h2>
                <p class="jfw-section-desc">Trace data packets moving between browser, Java Spring Boot, and MySQL Database. Click any node to inspect details:</p>
            </div>

            <!-- 8-STEP FULL STACK FLOW SIMULATOR -->
            <div class="jfw-card" style="max-width: 960px; margin: 0 auto; background: var(--jfw-surface); padding: 2rem;">
                <div style="display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem;">
                    <button type="button" id="jfwPlayFlowBtn" class="jfw-btn jfw-btn-primary">PLAY FLOW ⚡</button>
                    <button type="button" id="jfwPauseFlowBtn" class="jfw-btn jfw-btn-secondary">PAUSE ⏸</button>
                </div>

                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;">
                    <div class="jfw-flow-step-box active" data-step="0">
                        <strong style="color: var(--jfw-accent-cyan); display: block; margin-bottom: 0.35rem;">1. User Action</strong>
                        Student fills form & clicks submit on browser.
                    </div>

                    <div class="jfw-flow-step-box" data-step="1">
                        <strong style="color: var(--jfw-accent-cyan); display: block; margin-bottom: 0.35rem;">2. JS Capture</strong>
                        JavaScript gathers form values into JSON format.
                    </div>

                    <div class="jfw-flow-step-box" data-step="2">
                        <strong style="color: var(--jfw-accent-purple); display: block; margin-bottom: 0.35rem;">3. HTTP Request</strong>
                        Browser sends POST request across the internet.
                    </div>

                    <div class="jfw-flow-step-box" data-step="3">
                        <strong style="color: var(--jfw-accent-purple); display: block; margin-bottom: 0.35rem;">4. Java Controller</strong>
                        Spring Boot API receives request payload.
                    </div>

                    <div class="jfw-flow-step-box" data-step="4">
                        <strong style="color: var(--jfw-accent-amber); display: block; margin-bottom: 0.35rem;">5. Java Service</strong>
                        Java validates profile rules & processes logic.
                    </div>

                    <div class="jfw-flow-step-box" data-step="5">
                        <strong style="color: var(--jfw-accent-amber); display: block; margin-bottom: 0.35rem;">6. Database Save</strong>
                        MySQL persists student profile row permanently.
                    </div>

                    <div class="jfw-flow-step-box" data-step="6">
                        <strong style="color: var(--jfw-accent-emerald); display: block; margin-bottom: 0.35rem;">7. HTTP Response</strong>
                        Java sends 200 OK + profile ID back to browser.
                    </div>

                    <div class="jfw-flow-step-box" data-step="7">
                        <strong style="color: var(--jfw-accent-emerald); display: block; margin-bottom: 0.35rem;">8. UI Render</strong>
                        JavaScript renders live confirmation card on screen.
                    </div>
                </div>

                <!-- NODE INSPECTOR DRAWER -->
                <div id="jfwNodeDrawer" class="jfw-node-drawer" style="display: block;">
                    <strong style="color: var(--jfw-accent-cyan); font-size: 0.9rem;">🔍 HIGHWAY NODE INSPECTOR:</strong>
                    <div id="jfwNodeDrawerContent" class="jfw-mono" style="margin-top: 0.5rem; font-size: 0.88rem; color: #a5b4fc; line-height: 1.6;">
                        1. USER ACTION: Student clicks 'Create Profile' button on HTML form.
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- SECTION 06: CAREER & SALARY CALCULATOR MATRIX -->
    <section class="jfw-section" id="career-calculator" style="background: var(--jfw-bg);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">INTERACTIVE CAREER CALCULATOR</span>
                <h2 class="jfw-section-title">YOUR CAREER & SALARY TRAJECTORY</h2>
                <p class="jfw-section-desc">Select your current stage to see your target tech stack, project depth, and salary trajectory:</p>
            </div>

            <div class="jfw-card" style="max-width: 960px; margin: 0 auto; background: var(--jfw-surface); padding: 2.25rem;">
                <!-- CALCULATOR SLIDER -->
                <div style="margin-bottom: 2rem; text-align: center;">
                    <label style="display: block; font-weight: 700; color: #fff; margin-bottom: 0.75rem;">SELECT YOUR CURRENT STAGE:</label>
                    <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                        <button type="button" class="jfw-btn-micro jfw-calc-btn active" data-stage="college">1st / 2nd Year Student</button>
                        <button type="button" class="jfw-btn-micro jfw-calc-btn" data-stage="final">Final Year CS / IT</button>
                        <button type="button" class="jfw-btn-micro jfw-calc-btn" data-stage="non-it">Non-IT Switcher</button>
                    </div>
                </div>

                <!-- DYNAMIC CALC RESULT CARDS -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <!-- FRONTEND ONLY -->
                    <div class="jfw-card" style="border-left: 4px solid var(--jfw-accent-cyan);">
                        <strong style="color: var(--jfw-accent-cyan); font-size: 1.15rem; display: block; margin-bottom: 0.5rem;">💻 Path A: Frontend Developer</strong>
                        <div id="jfwFrontendStageText" style="color: var(--jfw-text-muted); font-size: 0.92rem; line-height: 1.8;">
                            • Tech: HTML, CSS, JavaScript<br>
                            • Scope: UI Screens & Static Templates<br>
                            • Entry Salary: <strong>₹3.5LPA - ₹5LPA</strong>
                        </div>
                    </div>

                    <!-- JAVA FULL STACK -->
                    <div class="jfw-card" style="border-left: 4px solid var(--jfw-accent-emerald); background: #081024;">
                        <strong style="color: var(--jfw-accent-emerald); font-size: 1.15rem; display: block; margin-bottom: 0.5rem;">🚀 Path B: Java Full Stack Engineer</strong>
                        <div id="jfwFullStackStageText" style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.8;">
                            • Tech: HTML, CSS, JS + Java Spring Boot + MySQL<br>
                            • Scope: End-to-End System Architect<br>
                            • Entry Salary: <strong>₹6.5LPA - ₹12LPA</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- WEBINAR SPECIAL OFFER MODULE -->
    <section class="jfw-section" id="webinar-offer" style="background: var(--jfw-bg-alt); padding-top: 2rem;">
        <div class="jfw-container">
            <div class="jfw-coupon-card">
                <span class="jfw-badge" style="background: rgba(16, 185, 129, 0.15); border-color: #34d399; color: #34d399; margin-bottom: 0.5rem;">
                    🎁 EXCLUSIVE WEBINAR STUDENT OFFER
                </span>
                <h3 style="color: #ffffff; font-size: 1.8rem; margin: 0.5rem 0; font-family: var(--jfw-font-heading);">
                    GET THE FULL 4-MONTH PROGRAM FOR ₹15,000 ONLY!
                </h3>
                <p style="color: var(--jfw-text-muted); font-size: 0.95rem; margin: 0;">
                    Use special webinar coupon code <strong style="color: #34d399;">STUDENT</strong> to get instant ₹20,000 discount.
                </p>

                <div class="jfw-price-display">
                    <span class="jfw-price-strike">₹35,000</span>
                    <span id="jfwPriceOfferText" class="jfw-price-offer">₹15,000</span>
                </div>

                <div class="jfw-coupon-input-group">
                    <input type="text" id="jfwCouponInput" class="jfw-coupon-input" placeholder="ENTER COUPON..." value="STUDENT">
                    <button type="button" id="jfwApplyCouponBtn" class="jfw-btn jfw-btn-primary" style="background: #10b981; border: none;">
                        APPLY COUPON 🏷️
                    </button>
                </div>

                <div id="jfwCouponMsg" style="margin-top: 0.75rem; font-size: 0.88rem; font-weight: 700; color: #34d399;">
                    🎉 WEBINAR OFFER ACTIVE: You save ₹20,000!
                </div>
            </div>
        </div>
    </section>

    <!-- 5. 3D AREA #2: FINAL ENDING CTA SECTION -->
    <section class="jfw-section jfw-ending-3d-scene">
        <div class="jfw-container">
            <div class="jfw-ending-3d-canvas" style="max-width: 860px; margin: 0 auto; text-align: center;">
                <span class="jfw-badge" style="margin-bottom: 1rem;">COMPLETE 4-MONTH JAVA FULL STACK PROGRAM</span>
                
                <h2 class="jfw-heading" style="font-size: 2.6rem; margin: 0 0 0.5rem 0; color: #fff;">
                    READY TO BECOME A FULL STACK DEVELOPER?
                </h2>
                
                <p style="color: var(--jfw-text-muted); font-size: 1.15rem; max-width: 620px; margin: 0 auto 2rem auto;">
                    You learned how Java and Web Dev work together over these 2 days. Take the next step into our live guided 4-Month Full Stack Career Program.
                </p>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
                    <a href="../scholarship" class="jfw-btn jfw-btn-primary jfw-btn-large" style="background: #10b981; border: none;">🔒 HOLD SCHOLARSHIP (₹500)</a>
                    <a href="day-1" class="jfw-btn jfw-btn-secondary jfw-btn-large">REVIEW DAY 1 JAVA BASICS ←</a>
                </div>

                <div style="font-size: 0.95rem; color: var(--jfw-text-subtle); font-weight: 700;">
                    START WITH ZERO. BUILD YOUR CAREER WITH EDUCATION ALGORITHM.
                </div>
            </div>
        </div>
    </section>

    <!-- STICKY MOBILE BOTTOM CTA -->
    <div class="jfw-mobile-cta">
        <a href="../enroll?coupon=STUDENT" class="jfw-btn jfw-btn-primary" style="width: 100%;">🚀 Reserve Seat (₹15K Offer)</a>
    </div>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--jfw-border); text-align: center; color: var(--jfw-text-subtle); font-size: 0.9rem;">
        <div class="jfw-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved.</p>
        </div>
    </footer>

    <!-- Scoped Custom JS -->
    <script src="../assets/java-full-stack-workshop.js?v=<?php echo time(); ?>"></script>
</body>
</html>
