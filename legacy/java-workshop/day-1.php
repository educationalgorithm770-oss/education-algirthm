<?php
// java-workshop/day-1.php — Day 1: From Zero to Your First Java Program
// Route: /java-workshop/day-1
require_once __DIR__ . '/../config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Day 1: From Zero to Your First Java Program | Education Algorithm</title>
    <meta name="description" content="Day 1 of Education Algorithm's Free 2-Day Live Java Full Stack Workshop. Start from zero coding knowledge and write your first Java program.">
    <link rel="canonical" href="https://educationalgorithm.com/java-workshop/day-1">
    
    <!-- OpenGraph Tags -->
    <meta property="og:title" content="Day 1: From Zero to Your First Java Program | Education Algorithm">
    <meta property="og:description" content="Never coded before? Join Day 1 of our free live workshop and write your first Java program step by step.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://educationalgorithm.com/java-workshop/day-1">
    
    <!-- Scoped Custom CSS -->
    <link rel="stylesheet" href="../css/java-workshop.css?v=<?php echo time(); ?>">
</head>
<body class="jw-workshop">

    <!-- GLOBAL STICKY NAVBAR -->
    <header class="jw-header">
        <div class="jw-container">
            <div class="jw-header-inner">
                <!-- EXACT EDUCATION ALGORITHM BRAND LOGO -->
                <a href="../" class="jw-brand-logo">
                    <svg class="ea-logo" width="34" height="34" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Education Algorithm"><g class="ea-g"><path class="ea-base" d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><g class="ea-capg"><path class="ea-cap" d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/></g><g class="ea-tas"><path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/></g></g></svg>
                    <span>Education Algorithm</span>
                    <span class="jw-brand-badge">WORKSHOP</span>
                </a>

                <ul class="jw-nav-links">
                    <li><a href="day-1" class="jw-nav-link active">Day 1</a></li>
                    <li><a href="day-2" class="jw-nav-link">Day 2</a></li>
                    <li><a href="#build" class="jw-nav-link">What You'll Build</a></li>
                    <li><a href="#journey" class="jw-nav-link">4-Month Journey</a></li>
                    <li><a href="#faq" class="jw-nav-link">FAQ</a></li>
                </ul>

                <div>
                    <a href="../enroll.php" class="jw-btn jw-btn-primary" style="padding: 0.65rem 1.35rem; font-size: 0.88rem;">
                        Reserve My Free Seat
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- GLOBAL FLOATING WORKSHOP PROGRESS -->
    <div class="jw-floating-progress">
        <a href="day-1" class="jw-progress-pill active">
            <span class="jw-progress-dot"></span> Day 1
        </a>
        <span style="color: var(--jw-text-subtle);">|</span>
        <a href="day-2" class="jw-progress-pill">
            <span class="jw-progress-dot"></span> Day 2
        </a>
    </div>

    <!-- 1. DAY 1 HERO SECTION -->
    <section class="jw-hero">
        <div class="jw-container">
            <div class="jw-hero-grid">
                <div>
                    <span class="jw-badge" style="margin-bottom: 1.25rem;">
                        🔴 FREE 2-DAY LIVE WORKSHOP
                    </span>

                    <h1 class="jw-hero-title">
                        Think Coding Is Difficult? <br>
                        <span class="jw-gradient-accent">Let's Start From Zero.</span>
                    </h1>

                    <p class="jw-hero-subtitle">
                        Learn the basics of programming, understand Java, write your first programs, and build your first mini project — step by step.
                    </p>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                        <a href="../enroll.php" class="jw-btn jw-btn-primary jw-btn-large">🚀 Reserve My Free Seat</a>
                        <a href="#demo" class="jw-btn jw-btn-secondary jw-btn-large">👀 Preview the Project ↓</a>
                    </div>

                    <div style="display: flex; gap: 1.5rem; font-size: 0.85rem; color: var(--jw-text-subtle); font-weight: 700;">
                        <span>✓ ZERO CODING REQUIRED</span>
                        <span>✓ LIVE HANDS-ON</span>
                        <span>✓ 100% BEGINNER FRIENDLY</span>
                    </div>
                </div>

                <!-- RIGHT: ANIMATED BEGINNER CODE EDITOR CARD -->
                <div>
                    <div class="jw-code-card">
                        <div class="jw-code-card-header">
                            <div class="jw-dots">
                                <span class="jw-dot jw-dot-red"></span>
                                <span class="jw-dot jw-dot-yellow"></span>
                                <span class="jw-dot jw-dot-green"></span>
                            </div>
                            <span class="jw-mono" style="font-size: 0.78rem; color: var(--jw-text-subtle);">Main.java — Beginner Workspace</span>
                        </div>
                        <div class="jw-code-card-body">
                            <div id="jwHeroCodeLog"></div>
                            <div id="jwHeroOutput" style="display: none; margin-top: 1.25rem; padding-top: 0.85rem; border-top: 1px dashed var(--jw-border); font-family: var(--jw-font-mono);"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 2. START WITH ZERO SECTION -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">BEGINNER FIRST</span>
                <h2 class="jw-section-title">Never Written Code Before? Perfect.</h2>
                <p class="jw-section-desc">We designed this workshop assuming you have zero prior programming experience.</p>
            </div>

            <div class="jw-cards-grid">
                <div class="jw-card">
                    <span class="jw-card-icon">☕</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">No Java Knowledge</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">We'll introduce Java from the absolute beginning, explaining every keyword step by step.</p>
                </div>

                <div class="jw-card">
                    <span class="jw-card-icon">💡</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">No Programming Experience</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">We'll first explain what programming actually means using simple everyday examples.</p>
                </div>

                <div class="jw-card">
                    <span class="jw-card-icon">💻</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">Hands-On Learning</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">You won't just watch. You'll write code with us and see live output immediately.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 3. WHAT IS PROGRAMMING? INTERACTIVE VISUAL -->
    <section class="jw-section">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">FOUNDATION</span>
                <h2 class="jw-section-title">Before Java, Let's Understand One Thing.</h2>
                <p class="jw-section-desc">What does a computer actually do when you run a program?</p>
            </div>

            <div style="background: var(--jw-surface); border: 1px solid var(--jw-border-glow); border-radius: var(--jw-radius-xl); padding: 2.5rem; max-width: 860px; margin: 0 auto; text-align: center; box-shadow: var(--jw-shadow-glow);">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap; font-family: var(--jw-font-heading); font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 2rem;">
                    <span>YOU</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span>GIVE INSTRUCTIONS</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span>COMPUTER</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span class="jw-gradient-accent">RESULT</span>
                </div>

                <button type="button" id="jwTryExampleBtn" class="jw-btn jw-btn-primary">
                    Try an Example ✨
                </button>

                <div id="jwExampleResult" style="display: none; margin-top: 1.75rem; background: #040712; padding: 1.25rem; border-radius: var(--jw-radius-md); text-align: left;"></div>
            </div>
        </div>
    </section>

    <!-- 4. YOUR FIRST JAVA PROGRAM PLAYGROUND -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">HANDS-ON PLAYGROUND</span>
                <h2 class="jw-section-title">Your First Line of Code</h2>
                <p class="jw-section-desc">Click the RUN CODE button to execute your first Java program live:</p>
            </div>

            <div class="jw-playground-card">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: stretch;">
                    <!-- CODE EDITOR -->
                    <div style="background: #040712; border-radius: var(--jw-radius-md); padding: 1.25rem; font-family: var(--jw-font-mono); font-size: 0.9rem; border: 1px solid var(--jw-border);">
                        <div style="color: #64748b; margin-bottom: 0.5rem;">// Code Editor</div>
                        <div><span style="color: #c084fc;">public class</span> <span style="color: #fff;">Main</span> {</div>
                        <div>&nbsp;&nbsp;<span style="color: #c084fc;">public static void</span> <span style="color: #60a5fa;">main</span>(String[] args) {</div>
                        <div>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #38bdf8;">System.out.println</span>(<span style="color: #34d399;">"Hello World"</span>);</div>
                        <div>&nbsp;&nbsp;}</div>
                        <div>}</div>
                    </div>

                    <!-- TERMINAL OUTPUT -->
                    <div style="background: #040712; border-radius: var(--jw-radius-md); padding: 1.25rem; font-family: var(--jw-font-mono); font-size: 0.9rem; border: 1px solid var(--jw-border); display: flex; flex-direction: column; justify-content: space-between;">
                        <div>
                            <div style="color: #64748b; margin-bottom: 0.5rem;">// Console Terminal</div>
                            <div id="jwPlaygroundConsole">
                                <div style="color: var(--jw-text-subtle);">Click RUN CODE ▶ to execute program...</div>
                            </div>
                        </div>

                        <button type="button" id="jwRunPlaygroundBtn" class="jw-btn jw-btn-primary" style="margin-top: 1rem; width: 100%;">
                            RUN CODE ▶
                        </button>
                    </div>
                </div>

                <div id="jwPlaygroundCelebration" style="display: none; margin-top: 1.5rem; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: var(--jw-radius-md); padding: 1rem; text-align: center; color: #34d399; font-weight: 700;">
                    🎉 You just ran your first Java program! Congratulations!
                </div>
            </div>
        </div>
    </section>

    <!-- 5. JAVA CONCEPTS TIMELINE -->
    <section class="jw-section">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">CURRICULUM</span>
                <h2 class="jw-section-title">What You'll Learn in Day 1</h2>
                <p class="jw-section-desc">Hover over any concept to reveal its beginner-friendly explanation:</p>
            </div>

            <div class="jw-timeline-grid">
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">01</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Programming Basics</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Giving sequence instructions to computers.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">02</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">What Is Java?</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">The translator language between humans & machines.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">03</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Your First Program</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Writing and running System.out.println().</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">04</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Variables</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Think of a variable as a storage box for information.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">05</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">User Input</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Giving your program ears to listen to keyboard input.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">06</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Conditions</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Making decisions with if and else statements.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">07</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Loops</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Automating repetitive tasks effortlessly.</p>
                </div>
                <div class="jw-timeline-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 0.85rem;">08</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Methods</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Giving specific tasks their own unique name.</p>
                </div>
                <div class="jw-timeline-card" style="border-color: var(--jw-accent-emerald);">
                    <span class="jw-mono" style="color: var(--jw-accent-emerald); font-weight: 800; font-size: 0.85rem;">09</span>
                    <h4 style="margin: 0.4rem 0; font-size: 1.1rem;">Mini Project</h4>
                    <p style="color: var(--jw-text-muted); font-size: 0.85rem; margin: 0;">Building the Student Career Profile Generator!</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 6. LIVE DEMO — STUDENT CAREER PROFILE GENERATOR -->
    <section class="jw-section" id="demo" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">DAY 1 HANDS-ON PROJECT</span>
                <h2 class="jw-section-title">Let's Build Something Together</h2>
                <p class="jw-section-desc">Try this interactive demo of the <strong>Student Career Profile Generator</strong>:</p>
            </div>

            <div style="text-align: center; margin-bottom: 2rem;">
                <button type="button" id="jwOpenProfileModalBtn" class="jw-btn jw-btn-primary jw-btn-large">
                    🎓 Try the Demo Modal
                </button>
            </div>

            <div id="jwProfileResultDisplay">
                <div style="border: 1px solid var(--jw-border); border-radius: var(--jw-radius-lg); padding: 2rem; background: #040712; max-width: 500px; margin: 0 auto; text-align: left;">
                    <div class="jw-mono" style="color: var(--jw-text-subtle); font-size: 0.8rem; margin-bottom: 1rem;">╭──────────────────────────────────╮</div>
                    <div class="jw-heading" style="font-size: 1.3rem; text-align: center; color: #fff; margin-bottom: 1rem;">🎓 STUDENT CAREER PROFILE</div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem; color: #cbd5e1;">
                        <tr><td style="padding: 0.4rem 0; color: var(--jw-text-subtle);">Name</td><td style="font-weight: 700; color: #fff;">Rahul</td></tr>
                        <tr><td style="padding: 0.4rem 0; color: var(--jw-text-subtle);">Age</td><td style="font-weight: 700; color: #fff;">20</td></tr>
                        <tr><td style="padding: 0.4rem 0; color: var(--jw-text-subtle);">College</td><td style="font-weight: 700; color: #fff;">ABC Engineering</td></tr>
                        <tr><td style="padding: 0.4rem 0; color: var(--jw-text-subtle);">Branch</td><td style="font-weight: 700; color: #fff;">CSE</td></tr>
                        <tr><td style="padding: 0.4rem 0; color: var(--jw-text-subtle);">Career Goal</td><td style="font-weight: 700; color: var(--jw-accent-emerald);">Java Developer</td></tr>
                    </table>
                    <div class="jw-mono" style="color: var(--jw-primary); text-align: center; margin-top: 1.25rem; font-size: 0.85rem; font-weight: 700;">🚀 Your journey starts today!</div>
                    <div class="jw-mono" style="color: var(--jw-text-subtle); font-size: 0.8rem; margin-top: 0.5rem;">╰──────────────────────────────────╯</div>
                </div>
            </div>
        </div>
    </section>

    <!-- 7. WHAT YOU WILL WALK AWAY WITH -->
    <section class="jw-section">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">YOUR ACHIEVEMENTS</span>
                <h2 class="jw-section-title">By the End of Day 1, You'll Be Able To Say...</h2>
            </div>

            <div style="max-width: 680px; margin: 0 auto; background: var(--jw-surface); border-radius: var(--jw-radius-xl); padding: 2.5rem; border: 1px solid var(--jw-border-glow); box-shadow: var(--jw-shadow-glow);">
                <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 1.05rem; color: #cbd5e1; margin-bottom: 2rem;">
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I understand what programming means</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I can read basic Java code</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I can write a Java program</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I understand variables</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I can take user input</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I understand basic conditions and loops</div>
                    <div><span style="color: var(--jw-accent-emerald); font-weight: 800;">✓</span> I built my first mini project</div>
                </div>

                <div style="text-align: center; border-top: 1px solid var(--jw-border); padding-top: 1.5rem;">
                    <h2 class="jw-heading jw-gradient-accent" style="font-size: 3rem; margin: 0;">“I CAN CODE.”</h2>
                </div>
            </div>
        </div>
    </section>

    <!-- 8. WHY EDUCATION ALGORITHM -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">METHODOLOGY</span>
                <h2 class="jw-section-title">Why Education Algorithm?</h2>
                <p class="jw-section-desc">We believe students learn faster when they understand something, try it themselves, and immediately build with it.</p>
            </div>

            <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap; font-family: var(--jw-font-heading); font-size: 1.5rem; font-weight: 800; color: #fff; text-align: center;">
                <span>LEARN</span>
                <span style="color: var(--jw-primary);">➔</span>
                <span>PRACTICE</span>
                <span style="color: var(--jw-primary);">➔</span>
                <span>BUILD</span>
                <span style="color: var(--jw-primary);">➔</span>
                <span class="jw-gradient-accent">GROW</span>
            </div>
        </div>
    </section>

    <!-- 9. DAY 2 TEASER -->
    <section class="jw-section">
        <div class="jw-container">
            <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.15) 100%); border: 1px solid var(--jw-border-glow); border-radius: var(--jw-radius-xl); padding: 3.5rem 2.5rem; text-align: center; max-width: 860px; margin: 0 auto; box-shadow: var(--jw-shadow-glow);">
                <span class="jw-badge" style="margin-bottom: 1rem;">WHAT'S NEXT</span>
                <h2 class="jw-heading" style="font-size: 2.4rem; margin: 0 0 1rem 0;">Tomorrow, We Build the Face of Your Application.</h2>
                
                <div style="display: flex; align-items: center; justify-content: center; gap: 1.25rem; flex-wrap: wrap; margin: 2rem 0; font-family: var(--jw-font-mono); font-size: 1rem; color: #a5b4fc;">
                    <div>DAY 1: ☕ JAVA</div>
                    <div>➔</div>
                    <div>DAY 2: 🌐 HTML + 🎨 CSS</div>
                    <div>➔</div>
                    <div style="color: #34d399; font-weight: 800;">YOUR FIRST WEB EXPERIENCE</div>
                </div>

                <a href="day-2" class="jw-btn jw-btn-primary jw-btn-large">
                    Preview Day 2 →
                </a>
            </div>
        </div>
    </section>

    <!-- 10. FINAL DAY 1 CTA -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div style="text-align: center; max-width: 720px; margin: 0 auto;">
                <span class="jw-badge" style="margin-bottom: 1rem;">GET STARTED</span>
                <h2 class="jw-section-title">You Don't Need To Know Coding.</h2>
                <h3 class="jw-gradient-accent" style="font-size: 2.2rem; margin-bottom: 2rem;">You Just Need To Start.</h3>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="../enroll.php" class="jw-btn jw-btn-primary jw-btn-large">🚀 JOIN THE FREE WORKSHOP</a>
                    <a href="day-2" class="jw-btn jw-btn-secondary jw-btn-large">DAY 2 →</a>
                </div>
            </div>
        </div>
    </section>

    <!-- DEMO MODAL POPUP -->
    <div class="jw-modal-backdrop" id="jwProfileModal">
        <div class="jw-modal-card">
            <button class="jw-modal-close" id="jwCloseProfileModalBtn">&times;</button>
            <h3 class="jw-heading" style="font-size: 1.6rem; margin: 0 0 0.5rem 0;">Student Career Profile Demo</h3>
            <p style="color: var(--jw-text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">Enter details to dynamically generate your profile card:</p>

            <form id="jwProfileForm">
                <div style="margin-bottom: 1rem; text-align: left;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #cbd5e1;">Full Name *</label>
                    <input type="text" name="p_name" class="jw-form-input" placeholder="e.g. Rahul Sharma" required>
                </div>
                <div style="margin-bottom: 1rem; text-align: left;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #cbd5e1;">Age *</label>
                    <input type="number" name="p_age" class="jw-form-input" placeholder="e.g. 20" required>
                </div>
                <div style="margin-bottom: 1rem; text-align: left;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #cbd5e1;">College *</label>
                    <input type="text" name="p_college" class="jw-form-input" placeholder="e.g. ABC Engineering" required>
                </div>
                <div style="margin-bottom: 1rem; text-align: left;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #cbd5e1;">Branch *</label>
                    <input type="text" name="p_branch" class="jw-form-input" placeholder="e.g. CSE / IT" required>
                </div>
                <div style="margin-bottom: 1.5rem; text-align: left;">
                    <label style="display: block; font-size: 0.82rem; font-weight: 700; margin-bottom: 0.35rem; color: #cbd5e1;">Career Goal *</label>
                    <input type="text" name="p_goal" class="jw-form-input" placeholder="e.g. Java Developer" required>
                </div>

                <button type="submit" class="jw-btn jw-btn-primary" style="width: 100%;">
                    🚀 GENERATE PROFILE
                </button>
            </form>
        </div>
    </div>

    <!-- STICKY MOBILE BOTTOM CTA -->
    <div class="jw-mobile-cta">
        <a href="../enroll.php" class="jw-btn jw-btn-primary" style="width: 100%;">🚀 Reserve Free Seat</a>
    </div>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--jw-border); text-align: center; color: var(--jw-text-subtle); font-size: 0.9rem;">
        <div class="jw-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved.</p>
        </div>
    </footer>

    <!-- Scoped Custom JS -->
    <script src="../assets/java-workshop.js?v=<?php echo time(); ?>"></script>
</body>
</html>
