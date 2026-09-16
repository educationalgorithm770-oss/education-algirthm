<?php
// java-full-stack-workshop/day-1.php — Day 1: Advanced Interactive Beginner Java Foundations
// Route: /java-full-stack-workshop/day-1
require_once __DIR__ . '/../config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Day 1: Java Foundations (Advanced Interactive Beginner Experience) | Education Algorithm</title>
    <meta name="description" content="Day 1 of Education Algorithm's Free 2-Day Live Java Full Stack Workshop. Interactive Java concept visualizers, beginner bug matrix, and dual-pane profile builder.">
    <link rel="canonical" href="https://educationalgorithm.com/java-full-stack-workshop/day-1">
    
    <!-- OpenGraph Tags -->
    <meta property="og:title" content="Day 1: Java Foundations | Education Algorithm">
    <meta property="og:description" content="Never coded before? Join Day 1 of our free live workshop and write your first Java program with interactive visualizers.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://educationalgorithm.com/java-full-stack-workshop/day-1">
    
    <!-- Scoped Custom CSS -->
    <link rel="stylesheet" href="../css/java-full-stack-workshop.css?v=<?php echo time(); ?>">
</head>
<body class="jfw-workshop">

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
                    <li><a href="day-1" class="jfw-nav-link active">Day 1 (Java)</a></li>
                    <li><a href="day-2" class="jfw-nav-link">Day 2 (Web 🔒)</a></li>
                    <li><a href="../java-full-stack-roadmap" class="jfw-nav-link">Curriculum Roadmap</a></li>
                    <li><a href="#lessons" class="jfw-nav-link">Concepts</a></li>
                    <li><a href="#recipe-guide" class="jfw-nav-link">Build Recipe</a></li>
                    <li><a href="#live-studio" class="jfw-nav-link">Live Studio ⚡</a></li>
                    <li><a href="#bugs-section" class="jfw-nav-link">Bug Matrix</a></li>
                    <li><a href="#project" class="jfw-nav-link">Career Project</a></li>
                    <li><a href="#webinar-offer" class="jfw-nav-link">Special Offer</a></li>
                    <li><a href="#faq" class="jfw-nav-link">FAQ</a></li>
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
        <a href="day-1" class="jfw-progress-pill active">
            <span class="jfw-progress-dot"></span> ● DAY 1: JAVA
        </a>
        <span style="color: var(--jfw-text-subtle);">|</span>
        <a href="day-2" class="jfw-progress-pill">
            <span class="jfw-progress-dot"></span> ○ DAY 2: WEB 🔒
        </a>
    </div>

    <!-- 1. 3D HERO SECTION -->
    <section class="jfw-hero jfw-hero-3d-scene">
        <div class="jfw-container">
            <div class="jfw-hero-grid">
                <div>
                    <span class="jfw-badge" style="margin-bottom: 1.25rem;">
                        🔴 FREE 2-DAY LIVE WORKSHOP
                    </span>

                    <h1 class="jfw-hero-title">
                        FROM ZERO <br>
                        TO YOUR <span class="jfw-gradient-accent">FIRST JAVA PROGRAM</span>
                    </h1>

                    <p class="jfw-hero-subtitle">
                        <strong>ADVANCED INTERACTIVE BEGINNER EXPERIENCE</strong> <br>
                        Visual memory slots, live project previewers, beginner bug matrix, and micro-challenge quizzes.
                    </p>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                        <a href="../enroll.php?coupon=STUDENT" class="jfw-btn jfw-btn-primary jfw-btn-large">🚀 RESERVE MY SEAT (₹15K OFFER)</a>
                        <a href="#lessons" class="jfw-btn jfw-btn-secondary jfw-btn-large">EXPLORE INTERACTIVE LESSONS ↓</a>
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
                            <span class="jfw-mono" style="font-size: 0.78rem; color: var(--jfw-text-subtle);">StudentProfile.java</span>
                        </div>
                        <div class="jfw-code-card-body">
                            <div id="jfwHeroCodeLog"></div>
                            <div id="jfwHeroOutput" style="display: none; margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px dashed var(--jfw-border); font-family: var(--jfw-font-mono);"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 2. LESSONS: JAVA CONCEPTS BOX + REAL-WORLD APPLICATION BOX -->
    <section class="jfw-section" id="lessons">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">CONCEPT & REAL-WORLD PAIRING</span>
                <h2 class="jfw-section-title">JAVA CONCEPTS & REAL-WORLD PROBLEMS</h2>
                <p class="jfw-section-desc">Understand the technical concept first, then see how it solves a real-world app problem:</p>
            </div>

            <!-- CONCEPT TASKBAR / TABS -->
            <div class="jfw-card" style="max-width: 960px; margin: 0 auto 2.5rem auto; background: var(--jfw-surface); padding: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem; padding: 0 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                    <strong style="color: #fff; font-size: 0.95rem;">JAVA CONCEPTS TASKBAR:</strong>
                    <span id="jfwQuizScoreBadge" class="jfw-mono" style="color: var(--jfw-accent-emerald); font-weight: 800; font-size: 0.95rem;">Progress: 0 / 7 Challenges Passed</span>
                </div>
                <div class="jfw-concept-taskbar">
                    <button type="button" class="jfw-btn-micro jfw-concept-tab active" data-concept="c-structure">01 Program Structure</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-output">02 Output</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-variables">03 Variables</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-input">04 Scanner Input</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-concat">05 Concatenation (+)</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-decisions">06 Decisions (If/Else)</button>
                    <button type="button" class="jfw-btn-micro jfw-concept-tab" data-concept="c-loops">07 Loops (For)</button>
                </div>
            </div>

            <!-- LESSON PANELS CONTAINER -->
            <div style="max-width: 960px; margin: 0 auto;">
                
                <!-- LESSON 01: PROGRAM STRUCTURE -->
                <div id="c-structure-panel" class="jfw-concept-panel">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-cyan);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                            <span class="jfw-mono" style="color: var(--jfw-accent-cyan); font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                            <button type="button" id="jfwStepCodeBtn" class="jfw-btn-micro" style="background: var(--jfw-primary); color: #fff;">STEP CODE ▶</button>
                        </div>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">01 — WHAT IS A JAVA PROGRAM STRUCTURE?</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            Every Java program requires a container <span class="jfw-kw-chip">class</span> and an execution entry point <span class="jfw-kw-chip">main</span>.
                        </p>
                        
                        <div id="jfwStepCodeBox" class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #38bdf8; line-height: 1.8;">
                            <div class="code-line" data-line="1">public class StudentProfile {</div>
                            <div class="code-line" data-line="2">&nbsp;&nbsp;public static void main(String[] args) {</div>
                            <div class="code-line" data-line="3">&nbsp;&nbsp;&nbsp;&nbsp;System.out.println("Building Student Profile...");</div>
                            <div class="code-line" data-line="4">&nbsp;&nbsp;}</div>
                            <div class="code-line" data-line="5">}</div>
                        </div>
                        
                        <div id="jfwStepperLog" style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--jfw-accent-cyan); font-family: var(--jfw-font-mono);">
                            Click 'STEP CODE ▶' to highlight execution line-by-line!
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-amber);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-amber); font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">SWIGGY FOOD ORDER & ATM TRANSACTION SEQUENCE</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Swiggy cannot assign a delivery driver before payment is verified.<br>
                            <strong>Java Solution:</strong> Java's <code>main()</code> guarantees instructions run in strict linear order (1. Order ➔ 2. Pay ➔ 3. Deliver).
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: var(--jfw-accent-cyan);">💡 MICRO-CHALLENGE 01:</strong> Where does Java start executing instructions?
                        <button type="button" class="jfw-quiz-option" data-correct="false">A) Inside System.out.println()</button>
                        <button type="button" class="jfw-quiz-option" data-correct="true">B) Inside public static void main(String[] args)</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) At the bottom curly brace }</button>
                    </div>
                </div>

                <!-- LESSON 02: OUTPUT -->
                <div id="c-output-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-purple);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-purple); font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">02 — HOW DOES JAVA SHOW OUTPUT? (System.out.println)</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            <code>System.out.println()</code> sends a text string to the terminal display screen.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #34d399;">
                            System.out.println("Hello World");
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-purple);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-purple); font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">WHATSAPP MESSAGES & GPAY PAYMENT RECEIPTS</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> When a transaction completes, users need instant output confirmation.<br>
                            <strong>Java Solution:</strong> <code>System.out.println("Paid ₹250")</code> displays alerts directly on screen.
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: var(--jfw-accent-purple);">💡 MICRO-CHALLENGE 02:</strong> What ends every Java statement?
                        <button type="button" class="jfw-quiz-option" data-correct="false">A) A colon :</button>
                        <button type="button" class="jfw-quiz-option" data-correct="true">B) A semicolon ;</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) A comma ,</button>
                    </div>
                </div>

                <!-- LESSON 03: VARIABLES -->
                <div id="c-variables-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-amber);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-amber); font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">03 — VARIABLES & DATA TYPES (String & int)</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            Variables store data inside labeled memory slots in CPU RAM.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #a5b4fc;">
                            String name = "Rahul";<br>
                            int age = 20;<br>
                            double gpa = 8.5;
                        </div>

                        <!-- CPU MEMORY SLOT INSPECTOR -->
                        <div class="jfw-cpu-memory">
                            <strong style="color: var(--jfw-accent-amber); font-size: 0.85rem;">🧠 VISUAL CPU MEMORY SLOTS:</strong>
                            <div class="jfw-memory-grid">
                                <div class="jfw-memory-slot updated">
                                    <span style="color: var(--jfw-text-subtle);">[RAM Ox10A]</span><br>
                                    <strong style="color: var(--jfw-accent-cyan);">String name</strong> ➔ "Rahul"
                                </div>
                                <div class="jfw-memory-slot updated">
                                    <span style="color: var(--jfw-text-subtle);">[RAM Ox10B]</span><br>
                                    <strong style="color: var(--jfw-accent-amber);">int age</strong> ➔ 20
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-amber);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-amber); font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">INSTAGRAM PROFILE DATA & FOLLOWER COUNTER</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Instagram must remember thousands of usernames and follower counts.<br>
                            <strong>Java Solution:</strong> <code>String username = "@rahul_dev";</code> stores user handles, while <code>int followers = 1450;</code> tracks numbers.
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: var(--jfw-accent-amber);">💡 MICRO-CHALLENGE 03:</strong> Which data type stores text inside quotes?
                        <button type="button" class="jfw-quiz-option" data-correct="false">A) int</button>
                        <button type="button" class="jfw-quiz-option" data-correct="true">B) String</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) double</button>
                    </div>
                </div>

                <!-- LESSON 04: SCANNER INPUT -->
                <div id="c-input-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-emerald);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-emerald); font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">04 — USER INPUT WITH SCANNER</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            <code>Scanner sc = new Scanner(System.in);</code> creates an input listener for keyboard entries.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #cbd5e1;">
                            Scanner sc = new Scanner(System.in);<br>
                            System.out.print("Enter name: ");<br>
                            String name = sc.nextLine();
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid var(--jfw-accent-emerald);">
                        <span class="jfw-mono" style="color: var(--jfw-accent-emerald); font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">ATM KEYPAD PIN ENTRY & GOOGLE SEARCH BAR</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Programs need to ask the user questions and wait for their keyboard input.<br>
                            <strong>Java Solution:</strong> Scanner pauses execution until the user enters their 4-digit ATM PIN.
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: var(--jfw-accent-emerald);">💡 MICRO-CHALLENGE 04:</strong> Which Scanner method reads a full line of text?
                        <button type="button" class="jfw-quiz-option" data-correct="true">A) sc.nextLine()</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">B) sc.nextInt()</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) sc.close()</button>
                    </div>
                </div>

                <!-- LESSON 05: CONCATENATION -->
                <div id="c-concat-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #f472b6;">
                        <span class="jfw-mono" style="color: #f472b6; font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">05 — STRING CONCATENATION (+)</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            The <code>+</code> operator glues fixed text strings and variable values together.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #f472b6;">
                            String name = "Rahul";<br>
                            System.out.println("Hello " + name + "!"); // Hello Rahul!
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #f472b6;">
                        <span class="jfw-mono" style="color: #f472b6; font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">UBER DRIVER SMS NOTIFICATIONS</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Apps need to construct personalized sentences dynamically.<br>
                            <strong>Java Solution:</strong> <code>"Driver " + driverName + " is " + eta + " mins away"</code> builds alerts live!
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: #f472b6;">💡 MICRO-CHALLENGE 05:</strong> What does "Hello " + "World" evaluate to?
                        <button type="button" class="jfw-quiz-option" data-correct="true">A) "Hello World"</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">B) Error</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) "HelloWorld"</button>
                    </div>
                </div>

                <!-- LESSON 06: DECISIONS (IF/ELSE) -->
                <div id="c-decisions-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">
                        <span class="jfw-mono" style="color: #f59e0b; font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">06 — DECISIONS WITH IF / ELSE</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            <code>if (condition) { ... } else { ... }</code> branch execution based on true/false evaluation.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #f59e0b;">
                            int age = 20;<br>
                            if (age >= 18) {<br>
                            &nbsp;&nbsp;System.out.println("Eligible ✓");<br>
                            } else {<br>
                            &nbsp;&nbsp;System.out.println("Underage ✖");<br>
                            }
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #f59e0b;">
                        <span class="jfw-mono" style="color: #f59e0b; font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">NETFLIX PARENTAL LOCK & AGE VERIFICATION</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Restricting A-rated movies automatically for underage users.<br>
                            <strong>Java Solution:</strong> <code>if (userAge >= 18)</code> grants movie access; <code>else</code> triggers parental lock.
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: #f59e0b;">💡 MICRO-CHALLENGE 06:</strong> When does the else block execute?
                        <button type="button" class="jfw-quiz-option" data-correct="false">A) Always</button>
                        <button type="button" class="jfw-quiz-option" data-correct="true">B) When the if condition evaluates to false</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) When the if condition is true</button>
                    </div>
                </div>

                <!-- LESSON 07: LOOPS (FOR LOOP) -->
                <div id="c-loops-panel" class="jfw-concept-panel" style="display: none;">
                    <div class="jfw-card" style="background: var(--jfw-surface); padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #60a5fa;">
                        <span class="jfw-mono" style="color: #60a5fa; font-weight: 800;">📦 BOX 1: CORE JAVA CONCEPT</span>
                        <h3 style="font-size: 1.5rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">07 — REPETITION LOOPS (FOR LOOP)</h3>
                        <p style="color: var(--jfw-text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 1rem;">
                            <code>for (int i = 1; i <= 5; i++)</code> repeats code blocks automatically.
                        </p>
                        <div class="jfw-mono" style="background: #040712; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--jfw-border); font-size: 0.9rem; color: #60a5fa;">
                            for (int i = 1; i <= 5; i++) {<br>
                            &nbsp;&nbsp;System.out.println("Iteration " + i);<br>
                            }
                        </div>
                    </div>

                    <div class="jfw-card" style="background: #081024; padding: 2.25rem; margin-bottom: 1.5rem; border-left: 4px solid #60a5fa;">
                        <span class="jfw-mono" style="color: #60a5fa; font-weight: 800;">🌎 BOX 2: REAL-WORLD PROBLEM SOLVED</span>
                        <h4 style="font-size: 1.25rem; margin: 0.35rem 0 0.85rem 0; color: #fff;">ALARM CLOCK SNOOZE & GYM REPETITION COUNTER</h4>
                        <p style="color: #cbd5e1; font-size: 0.93rem; line-height: 1.7; margin-bottom: 1rem;">
                            <strong>Problem:</strong> Repeating tasks without writing duplicate code lines.<br>
                            <strong>Java Solution:</strong> A for loop repeats print instructions automatically in milliseconds.
                        </p>
                        <div style="text-align: center;">
                            <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary">
                                🚀 TRY ON ONLINEGDB →
                            </a>
                        </div>
                    </div>

                    <!-- QUIZ PILL -->
                    <div class="jfw-quiz-box">
                        <strong style="color: #60a5fa;">💡 MICRO-CHALLENGE 07:</strong> What does i++ do in a for loop?
                        <button type="button" class="jfw-quiz-option" data-correct="true">A) Increments counter i by 1</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">B) Decrements counter i by 1</button>
                        <button type="button" class="jfw-quiz-option" data-correct="false">C) Stops the loop</button>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- SPOON-FED 4-STEP COOKING RECIPE BUILD TUTORIAL -->
    <section class="jfw-section" id="recipe-guide" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">SPOON-FED 4-STEP RECIPE</span>
                <h2 class="jfw-section-title">HOW WE BUILD THE STUDENT PROFILE (LINE BY LINE)</h2>
                <p class="jfw-section-desc">Think of writing Java like following a simple 4-step cooking recipe:</p>
            </div>

            <div style="max-width: 960px; margin: 0 auto;">
                <div class="jfw-recipe-step-card">
                    <span class="jfw-analogy-badge">🥣 RECIPE STEP 1: OPEN THE KITCHEN TABLE (THE CLASS CONTAINER)</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        Before cooking, you need a kitchen table. In Java, <code>public class StudentProfile</code> is your table where all ingredients (code lines) sit. <code>main()</code> is the ignition button that starts the cooking process!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #38bdf8; font-size: 0.85rem;">
                        public class StudentProfile { public static void main(String[] args) { ... } }
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-cyan);">
                    <span class="jfw-analogy-badge">⌨️ RECIPE STEP 2: TURN ON THE KEYBOARD LISTENER</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        <code>Scanner sc = new Scanner(System.in);</code> acts like a listening ear attached to the keyboard. It waits for the student to type their details.
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #38bdf8; font-size: 0.85rem;">
                        Scanner sc = new Scanner(System.in);
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-amber);">
                    <span class="jfw-analogy-badge">🫙 RECIPE STEP 3: PUT OUT LABELED STORAGE JARS (VARIABLES)</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        Think of <code>String name</code> like a glass jar labeled "Name" for storing text, and <code>int age</code> like a jar labeled "Age" for storing numbers. <code>sc.nextLine()</code> fills the jar from the keyboard!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #a5b4fc; font-size: 0.85rem;">
                        String name = sc.nextLine();<br>
                        int age = sc.nextInt();
                    </div>
                </div>

                <div class="jfw-recipe-step-card" style="border-left-color: var(--jfw-accent-emerald);">
                    <span class="jfw-analogy-badge">🍽️ RECIPE STEP 4: SERVE THE DISH ON SCREEN (PRINTING OUTPUT)</span>
                    <p style="color: #cbd5e1; font-size: 0.92rem; line-height: 1.7; margin-bottom: 0.5rem;">
                        <code>System.out.println()</code> takes data from your storage jars, glues text labels with <code>+</code>, and serves the final profile nicely on screen!
                    </p>
                    <div class="jfw-mono" style="background: #040712; padding: 0.85rem; border-radius: 6px; color: #34d399; font-size: 0.85rem;">
                        System.out.println("Name : " + name);<br>
                        System.out.println("Age  : " + age);
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 3-COLUMN LIVE INTERACTIVE JAVA STUDIO & RAM BOARD -->
    <section class="jfw-section" id="live-studio" style="background: var(--jfw-bg);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">3-COLUMN LIVE INTERACTIVE STUDIO</span>
                <h2 class="jfw-section-title">JAVA CODE STEPPER & CPU MEMORY BOARD</h2>
                <p class="jfw-section-desc">Click any code line or press 'PLAY WALKTHROUGH' to watch RAM memory light up & real app mockups update live:</p>
            </div>

            <div class="jfw-studio-grid">
                
                <!-- COL 1: INTERACTIVE CODE STEPPER -->
                <div class="jfw-studio-col">
                    <strong style="color: var(--jfw-accent-cyan); display: block; margin-bottom: 0.75rem; font-size: 0.95rem;">1. CODE STEPPER & EXECUTOR:</strong>
                    
                    <div class="jfw-studio-controls">
                        <button type="button" id="jfwPlayStudioBtn" class="jfw-btn-micro active">PLAY WALKTHROUGH ⚡</button>
                        <button type="button" id="jfwNextStudioBtn" class="jfw-btn-micro">NEXT LINE ▶</button>
                    </div>

                    <div id="jfwStudioCodeBox" class="jfw-mono" style="background: #040712; padding: 1rem; border-radius: 8px; font-size: 0.82rem; line-height: 1.8;">
                        <div class="jfw-code-clickable-line active" data-line="1" style="background: rgba(99, 102, 241, 0.25); color: #38bdf8;">import java.util.Scanner;</div>
                        <div class="jfw-code-clickable-line" data-line="2" style="color: #38bdf8;">public class StudentProfile {</div>
                        <div class="jfw-code-clickable-line" data-line="3" style="color: #38bdf8;">&nbsp;&nbsp;public static void main(String[] args) {</div>
                        <div class="jfw-code-clickable-line" data-line="4" style="color: #a5b4fc;">&nbsp;&nbsp;&nbsp;&nbsp;Scanner sc = new Scanner(System.in);</div>
                        <div class="jfw-code-clickable-line" data-line="5" style="color: #a5b4fc;">&nbsp;&nbsp;&nbsp;&nbsp;String name = sc.nextLine();</div>
                        <div class="jfw-code-clickable-line" data-line="6" style="color: #a5b4fc;">&nbsp;&nbsp;&nbsp;&nbsp;int age = sc.nextInt();</div>
                        <div class="jfw-code-clickable-line" data-line="7" style="color: #34d399;">&nbsp;&nbsp;&nbsp;&nbsp;System.out.println("Name: " + name);</div>
                        <div class="jfw-code-clickable-line" data-line="8" style="color: #38bdf8;">&nbsp;&nbsp;}</div>
                        <div class="jfw-code-clickable-line" data-line="9" style="color: #38bdf8;">}</div>
                    </div>
                </div>

                <!-- COL 2: LIVE CPU RAM MEMORY BOARD -->
                <div class="jfw-studio-col">
                    <strong style="color: var(--jfw-accent-amber); display: block; margin-bottom: 0.75rem; font-size: 0.95rem;">2. LIVE CPU RAM BOARD:</strong>
                    
                    <div id="jfwRamCard1" class="jfw-ram-card active-cyan">
                        <span class="jfw-mono" style="font-size: 0.75rem; color: var(--jfw-text-subtle);">[RAM Ox10A]</span><br>
                        <strong style="color: var(--jfw-accent-cyan);">String name</strong> ➔ <span id="jfwRamVal1" style="color: #fff; font-weight: 800;">"Rahul Sharma"</span>
                    </div>

                    <div id="jfwRamCard2" class="jfw-ram-card">
                        <span class="jfw-mono" style="font-size: 0.75rem; color: var(--jfw-text-subtle);">[RAM Ox10B]</span><br>
                        <strong style="color: var(--jfw-accent-amber);">int age</strong> ➔ <span id="jfwRamVal2" style="color: #fff; font-weight: 800;">20</span>
                    </div>

                    <div style="background: #040712; padding: 0.85rem; border-radius: 8px; font-size: 0.8rem; color: var(--jfw-text-muted);">
                        💡 <strong>Memory Action:</strong> When Scanner reads keyboard entry, Java writes the bytes directly into RAM heap slots above.
                    </div>
                </div>

                <!-- COL 3: DYNAMIC REAL APP MOCKUPS -->
                <div class="jfw-studio-col">
                    <strong style="color: var(--jfw-accent-emerald); display: block; margin-bottom: 0.75rem; font-size: 0.95rem;">3. REAL-WORLD APP IN ACTION:</strong>
                    
                    <div id="jfwAppMockupBox" class="jfw-app-mockup-box">
                        <span style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</span>
                        <strong style="color: #fff; font-size: 1.05rem;">GOOGLE SEARCH & WHATSAPP CHAT</strong>
                        <p style="color: var(--jfw-text-muted); font-size: 0.82rem; margin-top: 0.35rem;">
                            Imports Scanner input streams to capture user keyboard typing in real-time.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- 3. INTERACTIVE BEGINNER BUG MATRIX (6 COMMON PITFALLS) -->
    <section class="jfw-section" id="bugs-section" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">TROUBLESHOOTING MATRIX</span>
                <h2 class="jfw-section-title">6 COMMON BEGINNER JAVA BUGS & FIXES</h2>
                <p class="jfw-section-desc">Learn how to spot and fix classic beginner mistakes instantly:</p>
            </div>

            <div style="max-width: 960px; margin: 0 auto;">
                
                <!-- BUG 1 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">1. Missing Semicolon (;) Error</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="System.out.println(&quot;Hello World&quot;) <span style='color: #f87171;'>// Missing ; at end</span>"
                         data-fixed-code="System.out.println(&quot;Hello World&quot;); <span style='color: #34d399;'>// Added ; period</span>">
                        System.out.println("Hello World") <span style="color: #f87171;">// Missing ; at end</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: Causes compiler error! Every Java sentence ends with a semicolon.</span>
                    </div>
                </div>

                <!-- BUG 2 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">2. Mismatched Curly Braces {}</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="public class Test { public static void main(String[] args) { System.out.println(&quot;Hi&quot;); <span style='color: #f87171;'>// Missing closing }</span>"
                         data-fixed-code="public class Test { public static void main(String[] args) { System.out.println(&quot;Hi&quot;); } } <span style='color: #34d399;'>// Closed both braces</span>">
                        public class Test { public static void main(String[] args) { System.out.println("Hi"); <span style="color: #f87171;">// Missing closing }</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: Every open `{` must have a matching closing `}`.</span>
                    </div>
                </div>

                <!-- BUG 3 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">3. Incorrect Scanner Method Type</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="int age = sc.nextLine(); <span style='color: #f87171;'>// Reading text into int variable</span>"
                         data-fixed-code="int age = sc.nextInt(); <span style='color: #34d399;'>// Used nextInt() for whole numbers</span>">
                        int age = sc.nextLine(); <span style="color: #f87171;">// Reading text into int variable</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: Reading text into an int variable causes InputMismatchException!</span>
                    </div>
                </div>

                <!-- BUG 4 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">4. String Quote Mismatch</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="String name = 'Rahul'; <span style='color: #f87171;'>// Single quotes used for String</span>"
                         data-fixed-code="String name = &quot;Rahul&quot;; <span style='color: #34d399;'>// Double quotes required for String</span>">
                        String name = 'Rahul'; <span style="color: #f87171;">// Single quotes used for String</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: Strings require double quotes `"..."`. Single quotes `'...'` are for single char.</span>
                    </div>
                </div>

                <!-- BUG 5 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">5. Case Sensitivity Mistake (system vs System)</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="system.out.println(&quot;Hello&quot;); <span style='color: #f87171;'>// Lowercase system</span>"
                         data-fixed-code="System.out.println(&quot;Hello&quot;); <span style='color: #34d399;'>// Capitalized System</span>">
                        system.out.println("Hello"); <span style="color: #f87171;">// Lowercase system</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: Java is strictly case-sensitive. `System` must start with a capital `S`.</span>
                    </div>
                </div>

                <!-- BUG 6 -->
                <div class="jfw-bug-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                        <strong style="color: #fff;">6. Class Name vs File Name Mismatch</strong>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="jfw-btn-micro jfw-bug-btn active" data-mode="faulty">SEE BUG ❌</button>
                            <button type="button" class="jfw-btn-micro jfw-bug-btn" data-mode="fixed">FIX CODE ✓</button>
                        </div>
                    </div>
                    <div class="jfw-mono jfw-bug-code" style="background: #040712; padding: 1rem; border-radius: 6px; font-size: 0.88rem; color: #f87171;"
                         data-faulty-code="public class MyProfile { <span style='color: #f87171;'>// File saved as StudentProfile.java</span>"
                         data-fixed-code="public class StudentProfile { <span style='color: #34d399;'>// Class matches file name exactly</span>">
                        public class MyProfile { <span style="color: #f87171;">// File saved as StudentProfile.java</span>
                    </div>
                    <div class="jfw-bug-explain" style="margin-top: 0.75rem; font-size: 0.88rem; color: var(--jfw-text-muted);">
                        <span style="color: #f87171;">❌ Faulty Code: The public class name must match the `.java` file name exactly.</span>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- 4. DUAL-PANE STUDENT CAREER PROFILE BUILDER SECTION -->
    <section class="jfw-section" id="project" style="background: var(--jfw-bg);">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">DAY 1 FINAL PROJECT</span>
                <h2 class="jfw-section-title">STUDENT CAREER PROFILE BUILDER</h2>
                <p class="jfw-section-desc">Type your details below to see Java Scanner variables & live terminal output update in real-time:</p>
            </div>

            <div class="jfw-card" style="max-width: 1040px; margin: 0 auto; background: var(--jfw-surface); padding: 2.25rem;">
                
                <div class="jfw-dual-pane">
                    <!-- LEFT PANE: INTERACTIVE FORM INPUTS -->
                    <div>
                        <h4 style="margin-top: 0; color: var(--jfw-accent-cyan);">1. INPUT YOUR DETAILS (SCANNER INGREDIENTS):</h4>
                        
                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Full Name:</label>
                            <input type="text" id="jfwProfileName" class="jfw-form-input" value="Rahul Sharma" style="width: 100%; padding: 0.6rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 6px; color: #fff;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Age (int):</label>
                            <input type="number" id="jfwProfileAge" class="jfw-form-input" value="20" style="width: 100%; padding: 0.6rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 6px; color: #fff;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">College Name:</label>
                            <input type="text" id="jfwProfileCollege" class="jfw-form-input" value="ABC Engineering College" style="width: 100%; padding: 0.6rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 6px; color: #fff;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Branch / Stream:</label>
                            <input type="text" id="jfwProfileBranch" class="jfw-form-input" value="Computer Science" style="width: 100%; padding: 0.6rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 6px; color: #fff;">
                        </div>

                        <div style="margin-bottom: 1rem;">
                            <label style="display: block; font-size: 0.85rem; color: var(--jfw-text-muted); margin-bottom: 0.35rem;">Career Goal:</label>
                            <input type="text" id="jfwProfileGoal" class="jfw-form-input" value="Java Full Stack Developer" style="width: 100%; padding: 0.6rem; background: #040712; border: 1px solid var(--jfw-border); border-radius: 6px; color: #fff;">
                        </div>
                    </div>

                    <!-- RIGHT PANE: LIVE TERMINAL OUTPUT PREVIEW -->
                    <div>
                        <h4 style="margin-top: 0; color: var(--jfw-accent-emerald);">2. LIVE TERMINAL OUTPUT:</h4>
                        <div id="jfwLiveTerminalOutput" class="jfw-live-terminal"></div>
                    </div>
                </div>

                <div style="margin-top: 2rem; text-align: center;">
                    <a href="https://www.onlinegdb.com/online_java_compiler" target="_blank" rel="noopener noreferrer" class="jfw-btn jfw-btn-primary jfw-btn-large">
                        🚀 RUN PROFILE PROJECT ON ONLINEGDB →
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- 5. WEBINAR SPECIAL OFFER MODULE -->
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
                    Use special webinar coupon code <strong style="color: #34d399;">STUDENT</strong> to get instant ₹5,000 discount.
                </p>

                <div class="jfw-price-display">
                    <span class="jfw-price-strike">₹20,000</span>
                    <span id="jfwPriceOfferText" class="jfw-price-offer">₹15,000</span>
                </div>

                <div class="jfw-coupon-input-group">
                    <input type="text" id="jfwCouponInput" class="jfw-coupon-input" placeholder="ENTER COUPON..." value="STUDENT">
                    <button type="button" id="jfwApplyCouponBtn" class="jfw-btn jfw-btn-primary" style="background: #10b981; border: none;">
                        APPLY COUPON 🏷️
                    </button>
                </div>

                <div id="jfwCouponMsg" style="margin-top: 0.75rem; font-size: 0.88rem; font-weight: 700; color: #34d399;">
                    🎉 WEBINAR OFFER ACTIVE: You save ₹5,000!
                </div>

                <div style="margin-top: 1.5rem; text-align: center;">
                    <a href="../scholarship" class="jfw-btn jfw-btn-primary jfw-btn-large" style="background: #10b981; border: none; padding: 0.85rem 1.75rem;">
                        🔒 HOLD MY SCHOLARSHIP — ₹500
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- 6. FAQ ACCORDION SECTION -->
    <section class="jfw-section" id="faq">
        <div class="jfw-container">
            <div class="jfw-section-header">
                <span class="jfw-badge">FREQUENTLY ASKED QUESTIONS</span>
                <h2 class="jfw-section-title">COMMON QUESTIONS</h2>
            </div>

            <div style="max-width: 800px; margin: 0 auto;">
                <div class="jfw-faq-item">
                    <div class="jfw-faq-question">
                        Do I need any prior coding experience?
                        <span class="jfw-faq-icon">+</span>
                    </div>
                    <div class="jfw-faq-answer">
                        No! Day 1 explains concepts, real-world problems, and beginner bug fixes using interactive visual cards.
                    </div>
                </div>

                <div class="jfw-faq-item">
                    <div class="jfw-faq-question">
                        Is this live workshop completely free?
                        <span class="jfw-faq-icon">+</span>
                    </div>
                    <div class="jfw-faq-answer">
                        Yes! The 2-day workshop is 100% free with live guidance.
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 7. 3D AREA #2: FINAL ENDING CTA SECTION -->
    <section class="jfw-section jfw-ending-3d-scene" style="background: var(--jfw-bg-alt);">
        <div class="jfw-container">
            <div class="jfw-ending-3d-canvas" style="max-width: 860px; margin: 0 auto; text-align: center;">
                <span class="jfw-badge" style="margin-bottom: 1rem;">YOUR DEVELOPER JOURNEY</span>
                
                <h2 class="jfw-heading" style="font-size: 2.6rem; margin: 0 0 0.5rem 0; color: #fff;">
                    READY TO BUILD YOUR FUTURE?
                </h2>
                
                <p style="color: var(--jfw-text-muted); font-size: 1.15rem; max-width: 620px; margin: 0 auto 2rem auto;">
                    You built your first Java program today. Tomorrow we build what people see on the web.
                </p>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-bottom: 2rem;">
                    <a href="../enroll.php?coupon=STUDENT" class="jfw-btn jfw-btn-primary jfw-btn-large">🚀 RESERVE SEAT (₹15K OFFER)</a>
                    <a href="day-2" class="jfw-btn jfw-btn-secondary jfw-btn-large">CONTINUE TO DAY 2 (ENTER PASSCODE) →</a>
                </div>

                <div style="font-size: 0.95rem; color: var(--jfw-text-subtle); font-weight: 700;">
                    YOU START WITH ZERO. YOU DON'T HAVE TO STAY THERE.
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
