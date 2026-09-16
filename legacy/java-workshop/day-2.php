<?php
// java-workshop/day-2.php — Day 2: From Java to Your First Web Experience
// Route: /java-workshop/day-2
require_once __DIR__ . '/../config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Day 2: From Java to Your First Web Experience | Education Algorithm</title>
    <meta name="description" content="Day 2 of Education Algorithm's Free 2-Day Live Java Full Stack Workshop. Learn HTML, CSS, JavaScript, and connect web pages to Java.">
    <link rel="canonical" href="https://educationalgorithm.com/java-workshop/day-2">
    
    <!-- OpenGraph Tags -->
    <meta property="og:title" content="Day 2: From Java to Your First Web Experience | Education Algorithm">
    <meta property="og:description" content="Turn yesterday's Java knowledge into something you can see, click, and interact with on the web.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://educationalgorithm.com/java-workshop/day-2">
    
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
                    <span class="jw-brand-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3);">WORKSHOP</span>
                </a>

                <ul class="jw-nav-links">
                    <li><a href="day-1" class="jw-nav-link">Day 1</a></li>
                    <li><a href="day-2" class="jw-nav-link active">Day 2</a></li>
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
        <a href="day-1" class="jw-progress-pill done">
            <span class="jw-progress-dot"></span> ✓ Day 1
        </a>
        <span style="color: var(--jw-text-subtle);">|</span>
        <a href="day-2" class="jw-progress-pill active">
            <span class="jw-progress-dot"></span> Day 2
        </a>
    </div>

    <!-- 1. DAY 2 HERO SECTION -->
    <section class="jw-hero">
        <div class="jw-container">
            <div class="jw-hero-grid">
                <div>
                    <span class="jw-badge jw-badge-emerald" style="margin-bottom: 1.25rem;">
                        DAY 2 — BUILD MODE
                    </span>

                    <h1 class="jw-hero-title">
                        Yesterday You Wrote Code. <br>
                        <span class="jw-gradient-purple">Today, You'll See It Come Alive.</span>
                    </h1>

                    <p class="jw-hero-subtitle">
                        Learn HTML, CSS, understand how webpages work, and connect the concepts back to Java in a simple beginner-friendly project.
                    </p>

                    <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 2rem;">
                        <a href="../enroll.php" class="jw-btn jw-btn-primary jw-btn-large">🚀 Start Building</a>
                        <a href="#build" class="jw-btn jw-btn-secondary jw-btn-large">Preview Final Project ↓</a>
                    </div>
                </div>

                <!-- RIGHT: ANIMATED BROWSER MOCKUP -->
                <div>
                    <div class="jw-code-card">
                        <div class="jw-code-card-header">
                            <div class="jw-dots">
                                <span class="jw-dot jw-dot-red"></span>
                                <span class="jw-dot jw-dot-yellow"></span>
                                <span class="jw-dot jw-dot-green"></span>
                            </div>
                            <span class="jw-mono" style="font-size: 0.78rem; color: var(--jw-text-subtle);">my-first-app.com — Web Interface</span>
                        </div>
                        <div class="jw-code-card-body" style="background: #080e1e; font-family: var(--jw-font-main);">
                            <div style="font-weight: 800; font-size: 1.1rem; color: #fff; margin-bottom: 1rem; text-align: center;">🎓 MY CAREER PROFILE</div>
                            <div style="font-size: 0.85rem; color: var(--jw-text-subtle); margin-bottom: 0.25rem;">Full Name</div>
                            <div style="background: #040712; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--jw-border); margin-bottom: 0.75rem; color: #fff;">Rahul Sharma</div>
                            <div style="font-size: 0.85rem; color: var(--jw-text-subtle); margin-bottom: 0.25rem;">Career Goal</div>
                            <div style="background: #040712; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--jw-border); margin-bottom: 1rem; color: var(--jw-accent-emerald); font-weight: 700;">Java Full Stack Developer</div>
                            <button type="button" class="jw-btn jw-btn-primary" style="width: 100%; padding: 0.55rem; font-size: 0.85rem;">🚀 CREATE PROFILE</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 2. WHAT IS A WEBSITE? INTERACTIVE CARDS -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">WEB FOUNDATIONS</span>
                <h2 class="jw-section-title">Let's Build the Thing You Actually See.</h2>
                <p class="jw-section-desc">Every webpage on the internet is built using three simple building blocks:</p>
            </div>

            <div class="jw-cards-grid">
                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800; font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">HTML</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">Structure</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">HTML tells the browser what elements exist (headings, inputs, text, buttons).</p>
                </div>

                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-purple); font-weight: 800; font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">CSS</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">Design</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">CSS decides how those elements look (colors, spacing, fonts, shadows).</p>
                </div>

                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-amber); font-weight: 800; font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">JavaScript</span>
                    <h3 style="font-size: 1.35rem; margin: 0 0 0.75rem 0;">Interaction</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.95rem; margin: 0;">JavaScript makes the webpage respond to actions when clicked.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 3. BEFORE / AFTER INTERACTIVE SLIDER -->
    <section class="jw-section">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">VISUAL TRANSFORMATION</span>
                <h2 class="jw-section-title">See HTML Transform With CSS</h2>
                <p class="jw-section-desc">Drag the slider below to see how CSS turns plain HTML into a beautiful interface:</p>
            </div>

            <div class="jw-ba-wrapper">
                <!-- BEFORE: PLAIN HTML -->
                <div style="background: #ffffff; color: #000000; padding: 2.5rem; font-family: sans-serif; min-height: 260px;">
                    <h3 style="margin-top: 0;">My Career Profile</h3>
                    <p>Name: [ Rahul ]</p>
                    <p>College: [ ABC Engineering ]</p>
                    <button style="padding: 4px 8px;">Button</button>
                </div>

                <!-- AFTER: BEAUTIFUL CSS -->
                <div id="jwBaAfterOverlay" class="jw-ba-after">
                    <div style="background: #0e172e; color: #ffffff; padding: 2.5rem; height: 100%; min-height: 260px; font-family: var(--jw-font-main);">
                        <h3 style="margin-top: 0; color: var(--jw-accent-cyan);">🎓 My Career Profile</h3>
                        <p style="color: #cbd5e1;">Name: <strong style="color: #fff;">Rahul Sharma</strong></p>
                        <p style="color: #cbd5e1;">College: <strong style="color: #fff;">ABC Engineering</strong></p>
                        <button type="button" class="jw-btn jw-btn-primary" style="padding: 0.45rem 1rem; font-size: 0.82rem;">🚀 Create Profile</button>
                    </div>
                </div>
            </div>

            <div style="max-width: 860px; margin: 1rem auto 0 auto; text-align: center;">
                <input type="range" id="jwBaSlider" min="0" max="100" value="50" style="width: 80%; cursor: pointer;">
            </div>
        </div>
    </section>

    <!-- 4. SIMPLE JAVA CONNECTION EXPLANATION -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">BACKEND ARCHITECTURE</span>
                <h2 class="jw-section-title">So Where Does Java Come In?</h2>
                <p class="jw-section-desc">Here is the simple connection between what the user sees and Java in the background:</p>
            </div>

            <div style="background: var(--jw-surface); border: 1px solid var(--jw-border-glow); border-radius: var(--jw-radius-xl); padding: 2.5rem; max-width: 860px; margin: 0 auto; text-align: center; box-shadow: var(--jw-shadow-glow);">
                <div style="display: flex; align-items: center; justify-content: center; gap: 1.25rem; flex-wrap: wrap; font-family: var(--jw-font-heading); font-size: 1.3rem; font-weight: 800; color: #fff;">
                    <span>👨🎓 STUDENT</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span>🌐 WEBPAGE</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span>☕ JAVA</span>
                    <span style="color: var(--jw-primary);">↓</span>
                    <span class="jw-gradient-accent">🎉 RESULT</span>
                </div>

                <p style="color: var(--jw-text-muted); margin-top: 1.5rem; font-size: 1.05rem;">
                    Today we'll show you this connection in a simple way. In the full program, you'll learn professional backend technologies step by step.
                </p>
            </div>
        </div>
    </section>

    <!-- 5. FINAL PROJECT PREVIEW -->
    <section class="jw-section" id="build">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">DAY 2 FINAL PROJECT</span>
                <h2 class="jw-section-title">🎓 Build Your Career Profile</h2>
                <p class="jw-section-desc">Try building your own student career profile card right now:</p>
            </div>

            <div id="jwProfileResultDisplay">
                <div style="border: 1px solid var(--jw-border-glow); border-radius: var(--jw-radius-lg); padding: 2rem; background: #040712; max-width: 520px; margin: 0 auto; text-align: left; box-shadow: var(--jw-shadow-glow);">
                    <div class="jw-mono" style="color: var(--jw-text-subtle); font-size: 0.8rem; margin-bottom: 1rem;">╭──────────────────────────────────╮</div>
                    <div class="jw-heading" style="font-size: 1.35rem; text-align: center; color: #fff; margin-bottom: 1rem;">CAREER PROFILE</div>
                    
                    <button type="button" id="jwOpenProfileModalBtn" class="jw-btn jw-btn-primary" style="width: 100%;">
                        🚀 CREATE PROFILE NOW
                    </button>
                    <div class="jw-mono" style="color: var(--jw-text-subtle); font-size: 0.8rem; margin-top: 1rem;">╰──────────────────────────────────╯</div>
                </div>
            </div>
        </div>
    </section>

    <!-- 6. WHAT JUST HAPPENED? ARCHITECTURE SECTION -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">FULL STACK UNDERSTANDING</span>
                <h2 class="jw-section-title">You Just Experienced Full Stack Development.</h2>
            </div>

            <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap; font-family: var(--jw-font-mono); font-size: 0.95rem; color: #cbd5e1;">
                <span class="jw-badge" style="background: rgba(255,255,255,0.05);">STUDENT</span> <span>↓</span>
                <span style="color: var(--jw-accent-cyan);">HTML</span> <span>↓</span>
                <span style="color: var(--jw-accent-purple);">CSS</span> <span>↓</span>
                <span style="color: var(--jw-accent-amber);">JAVASCRIPT</span> <span>↓</span>
                <span style="color: var(--jw-primary);">JAVA</span> <span>↓</span>
                <span style="color: var(--jw-accent-emerald); font-weight: 800;">APPLICATION</span>
            </div>
        </div>
    </section>

    <!-- 7. DEVELOPER ROADMAP -->
    <section class="jw-section" id="journey">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">THE 4-MONTH JOURNEY</span>
                <h2 class="jw-section-title">This Is Only Your Beginning.</h2>
                <p class="jw-section-desc">You don't need to know all of this today. This is the journey we'll take step by step:</p>
            </div>

            <div class="jw-roadmap-list">
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem;">Java Fundamentals</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Variables, input, conditionals, and loops.</p>
                </div>
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem;">Object-Oriented Programming (OOP)</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Classes, objects, inheritance, and encapsulation.</p>
                </div>
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem;">SQL + Databases</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Storing student data persistently in databases.</p>
                </div>
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem;">HTML + CSS + JavaScript</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Building modern responsive user interfaces.</p>
                </div>
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem;">Spring Boot & REST APIs</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Connecting frontend interfaces to Java backend services.</p>
                </div>
                <div class="jw-roadmap-item">
                    <span class="jw-roadmap-dot" style="background: var(--jw-accent-emerald);"></span>
                    <h4 style="margin: 0 0 0.25rem 0; font-size: 1.15rem; color: var(--jw-accent-emerald);">Java Full Stack Developer</h4>
                    <p style="margin: 0; color: var(--jw-text-muted); font-size: 0.9rem;">Deploying full-stack applications & interview prep.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 8. WHY THE 4-MONTH PROGRAM -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">FULL PROGRAM</span>
                <h2 class="jw-section-title">The Workshop Is Just The Beginning.</h2>
                <p class="jw-section-desc">In two days, you'll experience the foundations. Our 4-Month Java Full Stack Program takes you much further:</p>
            </div>

            <div class="jw-cards-grid">
                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-cyan); font-weight: 800;">MONTH 1</span>
                    <h3 style="font-size: 1.25rem; margin: 0.4rem 0;">Java + Programming</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.9rem; margin: 0;">Master core Java and object-oriented logic.</p>
                </div>
                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-purple); font-weight: 800;">MONTH 2</span>
                    <h3 style="font-size: 1.25rem; margin: 0.4rem 0;">Frontend + SQL</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.9rem; margin: 0;">Build HTML/CSS interfaces and SQL databases.</p>
                </div>
                <div class="jw-card">
                    <span class="jw-mono" style="color: var(--jw-accent-amber); font-weight: 800;">MONTH 3</span>
                    <h3 style="font-size: 1.25rem; margin: 0.4rem 0;">Spring Boot + Backend</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.9rem; margin: 0;">Develop backend APIs and server logic.</p>
                </div>
                <div class="jw-card" style="grid-column: span 3;">
                    <span class="jw-mono" style="color: var(--jw-accent-emerald); font-weight: 800;">MONTH 4</span>
                    <h3 style="font-size: 1.25rem; margin: 0.4rem 0;">Full Stack Projects + Placement</h3>
                    <p style="color: var(--jw-text-muted); font-size: 0.9rem; margin: 0;">Build 4 real-world projects, deploy to live servers, and prepare for interviews.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 9. FAQ ACCORDION -->
    <section class="jw-section" id="faq">
        <div class="jw-container">
            <div class="jw-section-header">
                <span class="jw-badge">FAQ</span>
                <h2 class="jw-section-title">Frequently Asked Questions</h2>
            </div>

            <div style="max-width: 800px; margin: 0 auto;">
                <div class="jw-faq-item">
                    <div class="jw-faq-question">
                        <span>Do I need Java knowledge?</span>
                        <span class="jw-faq-icon">+</span>
                    </div>
                    <div class="jw-faq-answer">
                        No. The workshop begins from the absolute basics.
                    </div>
                </div>

                <div class="jw-faq-item">
                    <div class="jw-faq-question">
                        <span>I'm completely new to coding. Can I join?</span>
                        <span class="jw-faq-icon">+</span>
                    </div>
                    <div class="jw-faq-answer">
                        Yes! This workshop is designed specifically for beginners.
                    </div>
                </div>

                <div class="jw-faq-item">
                    <div class="jw-faq-question">
                        <span>Will I build a project?</span>
                        <span class="jw-faq-icon">+</span>
                    </div>
                    <div class="jw-faq-answer">
                        Yes. Students follow a guided beginner-friendly mini project.
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 10. FINAL DAY 2 CTA -->
    <section class="jw-section" style="background: var(--jw-bg-alt);">
        <div class="jw-container">
            <div style="text-align: center; max-width: 760px; margin: 0 auto;">
                <span class="jw-badge" style="margin-bottom: 1rem;">FINAL STEP</span>
                <h2 class="jw-section-title">Two Days Can Change The Way You See Coding.</h2>
                <p style="color: var(--jw-text-muted); font-size: 1.1rem; margin-bottom: 2rem;">
                    You don't need to become a developer this weekend. You just need to discover that you can start.
                </p>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="../enroll.php" class="jw-btn jw-btn-primary jw-btn-large">🚀 RESERVE MY FREE SEAT</a>
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
