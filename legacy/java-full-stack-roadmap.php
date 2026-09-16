<?php
// java-full-stack-roadmap.php — Master Flagship Version 26.0 (10/10 Premium Education Algorithm Color System)
// Route: /java-full-stack-roadmap or /curriculum
require_once __DIR__ . '/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
    <title>Java Full Stack Development — 10/10 Premium Color System | Education Algorithm</title>
    <meta name="description" content="Master Java 21, React 18, MySQL 8.0, Spring Boot 3, and Cloud Architecture in Education Algorithm's flagship interactive developer learning experience.">
    <link rel="canonical" href="<?php echo APP_URL; ?>/java-full-stack-roadmap">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/chatbot.css?v=5.0.0">
    <style>
        /* ==================================================
           50 — STRICT EDUCATION ALGORITHM COLOR SYSTEM TOKENS
           ================================================== */
        :root {
            /* Background System */
            --bg-primary: #070A0F;
            --bg-section: #0B1017;
            --bg-card: #101923;
            --bg-card-elevated: #141F2C;
            --bg-hover: #182638;
            --bg-active: #172B46;
            
            /* Border System */
            --border: #1C2938;
            --border-subtle: #172230;
            --border-active: #2E5FA8;
            --border-blue-active: #3B82F6;
            --border-cyan-active: #06B6D4;
            
            /* Text System */
            --text-primary: #F8FAFC;
            --text-secondary: #B8C2D1;
            --text-muted: #728096;
            --text-dim: #64748B;
            
            /* Primary Brand Blue System */
            --brand-blue: #2563EB;
            --brand-blue-electric: #3B82F6;
            --brand-blue-bright: #60A5FA;
            
            /* Technical Cyan System */
            --tech-cyan: #06B6D4;
            --tech-cyan-bright: #22D3EE;
            
            /* Premium Violet System */
            --premium-violet: #7C3AED;
            --premium-violet-bright: #A78BFA;
            
            /* Status System */
            --success: #22C55E;
            --warning: #F59E0B;
            --error: #EF4444;
            
            /* Subdued Glows */
            --glow-blue: rgba(59, 130, 246, 0.12);
            --glow-cyan: rgba(6, 182, 212, 0.10);
            --glow-violet: rgba(124, 58, 237, 0.10);

            /* Fonts */
            --font-ui: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-display: 'Manrope', 'Inter', sans-serif;
            --font-mono: Consolas, 'Fira Code', Monaco, monospace;
        }

        html, body {
            width: 100%;
            max-width: 100vw;
            overflow-x: hidden !important;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-family: var(--font-ui);
            scroll-behavior: smooth;
            -webkit-font-smoothing: antialiased;
        }

        *, *:before, *:after { box-sizing: inherit; }

        h1, h2, h3, h4 { font-family: var(--font-display); margin: 0; font-weight: 800; }
        
        .hero-h1 {
            font-size: 3.8rem;
            line-height: 1.08;
            letter-spacing: -0.025em;
            color: var(--text-primary);
        }

        .section-h2 {
            font-size: 2.5rem;
            line-height: 1.18;
            letter-spacing: -0.02em;
            color: var(--text-primary);
        }

        /* 30 — GRADIENT TEXT RULE (MAX 3 MOMENTS ON PAGE) */
        .gradient-text-hero {
            background: linear-gradient(135deg, var(--brand-blue-bright) 0%, var(--premium-violet-bright) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .gradient-text-tech {
            background: linear-gradient(135deg, var(--tech-cyan-bright) 0%, var(--brand-blue-electric) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .ea-container {
            max-width: 1240px;
            margin: 0 auto;
            padding: 0 1.5rem;
            width: 100%;
        }

        /* Motion Reveal System */
        .motion-reveal {
            opacity: 0;
            transform: translateY(24px);
            transition: opacity 0.45s ease-out, transform 0.45s ease-out;
            will-change: opacity, transform;
        }

        .motion-reveal.is-visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* Precision Cursor (Desktop Only) */
        @media (min-width: 1024px) {
            body { cursor: default; }
            .custom-cursor-dot {
                position: fixed;
                top: 0; left: 0;
                width: 10px; height: 10px;
                border-radius: 50%;
                background: var(--brand-blue-bright);
                pointer-events: none;
                z-index: 99999;
                transform: translate(-50%, -50%);
                transition: width 0.2s ease, height 0.2s ease, background 0.2s ease;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
            }
            .custom-cursor-dot.expand {
                width: 24px; height: 24px;
                background: rgba(6, 182, 212, 0.4);
                border: 1px solid var(--tech-cyan-bright);
            }
        }

        /* 20 — PRIMARY BUTTON SYSTEM */
        .ea-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.8rem 1.6rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.9rem;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            white-space: nowrap;
            border: none;
        }

        .ea-btn-primary {
            background: var(--brand-blue);
            color: #ffffff;
        }

        .ea-btn-primary:hover {
            background: var(--brand-blue-electric);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
        }

        .ea-btn-primary:active {
            background: #1D4ED8;
        }

        /* 21 — SECONDARY BUTTON SYSTEM */
        .ea-btn-secondary {
            background: transparent;
            border: 1px solid #334155;
            color: var(--text-secondary);
        }

        .ea-btn-secondary:hover {
            background: var(--bg-card-elevated);
            border-color: var(--brand-blue-electric);
            color: #ffffff;
            transform: translateY(-2px);
        }

        .ea-eyebrow {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.35rem 0.85rem;
            border-radius: 30px;
            background: rgba(37, 99, 235, 0.08);
            border: 1px solid rgba(37, 99, 235, 0.25);
            color: var(--brand-blue-bright);
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            margin-bottom: 1rem;
        }

        /* NAVBAR (37 — GLASSMORPHISM RULE) */
        .ea-navbar {
            position: sticky;
            top: 0;
            z-index: 999;
            height: 72px;
            background: rgba(15, 23, 38, 0.82);
            backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(148, 163, 184, 0.08);
            display: flex;
            align-items: center;
        }

        .ea-navbar-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
        }

        .ea-brand {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            text-decoration: none;
            color: #fff;
            font-weight: 800;
            font-size: 1.15rem;
        }

        .ea-nav-menu {
            display: flex;
            align-items: center;
            gap: 2rem;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .ea-nav-item a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.88rem;
            font-weight: 600;
            transition: color 0.2s ease;
        }

        .ea-nav-item a:hover { color: #fff; }

        /* TOP SCROLL READING PROGRESS BAR */
        .top-scroll-progress {
            position: fixed;
            top: 0; left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--brand-blue-bright) 0%, var(--tech-cyan-bright) 100%);
            z-index: 99999;
            width: 0%;
            transition: width 0.1s linear;
        }

        /* YOU ARE HERE STICKY NAVIGATOR & SCROLLER TOOL */
        .you-are-here-bar {
            position: sticky;
            top: 72px;
            z-index: 998;
            background: var(--bg-section);
            border-bottom: 1px solid var(--border);
            padding: 0.6rem 0;
            font-size: 0.8rem;
        }

        .yah-track {
            display: flex;
            align-items: center;
            overflow-x: auto;
            gap: 0.6rem;
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
        }

        .yah-track::-webkit-scrollbar { display: none; }

        .yah-scroll-arrow {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            width: 26px; height: 26px;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 800;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }

        .yah-scroll-arrow:hover {
            border-color: var(--tech-cyan-bright);
            color: var(--tech-cyan-bright);
            background: var(--bg-hover);
        }

        .yah-status-label {
            color: var(--tech-cyan-bright);
            font-weight: 800;
            font-size: 0.78rem;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 0.4rem;
            white-space: nowrap;
        }

        .yah-node {
            color: var(--text-muted);
            font-weight: 700;
            font-size: 0.76rem;
            padding: 0.25rem 0.55rem;
            border-radius: 6px;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .yah-node:hover { color: #fff; background: var(--bg-hover); }
        .yah-node.active { color: var(--brand-blue-bright); background: rgba(37, 99, 235, 0.12); }

        /* HERO SECTION */
        .ea-hero-section {
            padding: 4.5rem 0 3.5rem 0;
            position: relative;
            background: radial-gradient(circle at 75% 25%, var(--glow-blue) 0%, var(--glow-violet) 50%, transparent 70%);
        }

        .ea-hero-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 3.5rem;
            align-items: center;
        }

        .hero-stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-top: 2.5rem;
            padding-top: 1.75rem;
            border-top: 1px solid var(--border-subtle);
        }

        .hero-stat-card { text-align: left; }
        .hero-stat-val { font-size: 1.9rem; font-weight: 800; color: #fff; font-family: var(--font-display); }
        .hero-stat-lbl { font-size: 0.74rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 0.15rem; }

        /* HERO WORKSTATION CANVAS */
        .hero-system-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 1.25rem;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
            position: relative;
        }

        #heroCanvas3D {
            width: 100%;
            height: 320px;
            background: #080D14;
            border-radius: 12px;
            display: block;
        }

        /* SECTIONS */
        .ea-section { padding: 5rem 0; }
        .ea-section-alt { padding: 5rem 0; background: var(--bg-section); border-y: 1px solid var(--border-subtle); }

        .section-header {
            text-align: center;
            max-width: 720px;
            margin: 0 auto 3rem auto;
        }

        .section-desc { color: var(--text-secondary); font-size: 1.05rem; line-height: 1.6; margin-top: 0.75rem; }

        /* STARTING POINT SELECTOR */
        .starting-point-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }

        .starting-point-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.75rem;
            cursor: pointer;
            transition: all 0.25s ease;
        }

        .starting-point-card:hover, .starting-point-card.active {
            border-color: var(--brand-blue-electric);
            background: var(--bg-card-elevated);
            transform: translateY(-3px);
        }

        /* 22 — TECHNOLOGY TAGS */
        .tech-tag-pill {
            background: #0D1722;
            border: 1px solid #203147;
            color: #AFC0D5;
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.2rem 0.55rem;
            border-radius: 6px;
            font-family: var(--font-mono);
        }

        .tech-tag-pill.cyan { color: var(--tech-cyan-bright); }

        /* 24 — WEEK CARD COLORS */
        .command-bar-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.25rem;
            margin-bottom: 2rem;
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
        }

        .filter-chip-group { display: flex; gap: 0.4rem; flex-wrap: wrap; }

        .filter-chip-btn {
            background: #0F1722;
            border: 1px solid #1D2B3C;
            color: var(--text-muted);
            padding: 0.4rem 0.85rem;
            border-radius: 8px;
            font-size: 0.78rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .filter-chip-btn:hover { background: #162338; color: var(--text-secondary); }

        .filter-chip-btn.active {
            background: var(--bg-active);
            color: var(--brand-blue-bright);
            border-color: var(--brand-blue-electric);
        }

        .search-input-wrapper { position: relative; min-width: 280px; }

        .search-input-field {
            width: 100%;
            padding: 0.55rem 2.2rem 0.55rem 0.9rem;
            background: #0F1722;
            border: 1px solid #1D2B3C;
            border-radius: 8px;
            color: #fff;
            font-size: 0.82rem;
        }

        .search-kbd-badge {
            position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
            background: var(--bg-card-elevated); border: 1px solid var(--border);
            color: var(--text-dim); font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; font-family: var(--font-mono);
        }

        .timeline-vertical-wrap { position: relative; max-width: 900px; margin: 0 auto; }
        .timeline-center-line { position: absolute; top: 0; bottom: 0; left: 28px; width: 3px; background: var(--border); }

        .month-banner-row {
            background: var(--bg-card-elevated);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 1rem 1.25rem;
            margin: 2.25rem 0 1.25rem 0;
            display: flex;
            align-items: center;
            gap: 0.85rem;
            position: relative;
            z-index: 2;
        }

        .month-badge-tag {
            background: var(--brand-blue);
            color: #fff;
            font-weight: 800;
            font-size: 0.75rem;
            padding: 0.25rem 0.65rem;
            border-radius: 6px;
        }

        .week-item-block { position: relative; padding-left: 68px; margin-bottom: 1.25rem; }

        .week-item-dot {
            position: absolute; left: 20px; top: 20px; width: 18px; height: 18px;
            border-radius: 50%; background: var(--bg-card); border: 3px solid var(--brand-blue); z-index: 3;
        }

        .week-item-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.35rem;
            transition: all 0.25s ease;
        }

        .week-item-card:hover { border-color: #294768; background: var(--bg-card-elevated); }
        .week-item-card.active { background: var(--bg-active); border-color: var(--brand-blue-electric); }

        .expandable-week-content {
            display: none;
            background: #080D14;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.15rem;
            margin-top: 0.85rem;
            color: var(--text-secondary);
            font-size: 0.85rem;
            line-height: 1.6;
        }

        .expandable-week-content.active { display: block; }

        /* 43 — CODE EDITOR SYNTAX COLORS */
        .code-window-syntax {
            background: #080D14;
            border: 1px solid #1B2838;
            border-radius: 12px;
            padding: 1.25rem;
            font-family: var(--font-mono);
            font-size: 0.82rem;
            color: #E2E8F0;
        }
        .code-kw { color: var(--brand-blue-bright); }
        .code-str { color: var(--tech-cyan-bright); }
        .code-fn { color: var(--premium-violet-bright); }
        .code-cm { color: var(--text-dim); }

        /* 27 & 28 — ARCHITECTURE & DATA FLOW COLORS */
        .arch-node-frontend { border-color: var(--brand-blue-electric); }
        .arch-node-api { border-color: var(--tech-cyan-bright); }
        .arch-node-backend { border-color: var(--premium-violet); }
        .arch-node-db { border-color: var(--tech-cyan); }

        .sim-node-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            flex-wrap: wrap;
        }

        .sim-node-item {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 0.75rem 1rem;
            flex: 1;
            min-width: 110px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .sim-node-item.active-glow {
            border-color: var(--tech-cyan-bright);
            box-shadow: 0 0 15px var(--glow-cyan);
            background: var(--bg-hover);
        }

        /* 26 — SKILL UNLOCK COLORS */
        .skill-card-locked { background: #0D151F; border: 1px solid #1C2938; color: #64748B; }
        .skill-card-unlocked { background: #101D30; border: 1px solid var(--brand-blue); color: var(--brand-blue-bright); }

        /* FAQ ACCORDION SYSTEM */
        .faq-accordion-box { max-width: 820px; margin: 2rem auto 0 auto; }

        .faq-accordion-item {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 14px;
            margin-bottom: 1rem;
            overflow: hidden;
            transition: border-color 0.25s ease, background 0.25s ease;
        }

        .faq-accordion-item:hover { border-color: var(--brand-blue-electric); background: var(--bg-hover); }

        .faq-acc-btn {
            width: 100%;
            padding: 1.25rem 1.5rem;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-weight: 700;
            font-size: 1.05rem;
            font-family: var(--font-display);
            text-align: left;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            outline: none;
            transition: color 0.2s ease;
        }

        .faq-acc-btn:hover { color: var(--brand-blue-bright); }
        .faq-acc-btn span { font-size: 0.85rem; color: var(--text-muted); transition: transform 0.3s ease; }
        .faq-acc-btn.active span { transform: rotate(180deg); color: var(--brand-blue-bright); }

        .faq-acc-body {
            padding: 0 1.5rem 1.25rem 1.5rem;
            color: var(--text-secondary);
            font-size: 0.95rem;
            line-height: 1.65;
            display: none;
            border-top: 1px solid var(--border-subtle);
            margin-top: 0.25rem;
            padding-top: 1rem;
        }

        .faq-acc-body.active { display: block; animation: fadeIn 0.3s ease-out; }

        /* 35 — FINAL CTA COLOR COMPOSITION */
        .final-cta-card {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 24px;
            padding: 3.5rem 1.5rem;
            max-width: 860px;
            margin: 0 auto;
            text-align: center;
            position: relative;
            box-shadow: 0 0 50px var(--glow-blue);
        }

        /* Social Proof Toast */
        .social-proof-toast-fixed {
            position: fixed;
            bottom: 24px;
            left: 24px;
            background: #0B1017;
            border: 1.5px solid var(--brand-blue);
            border-radius: 12px;
            padding: 0.75rem 1rem;
            color: #fff;
            font-size: 0.82rem;
            box-shadow: 0 12px 35px rgba(0,0,0,0.7);
            z-index: 999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            max-width: 360px;
            backdrop-filter: blur(12px);
        }

        /* Floating Mobile Sticky CTA */
        .floating-mobile-cta {
            position: fixed; bottom: 0; left: 0; right: 0; width: 100vw; max-width: 100%;
            background: rgba(11, 16, 23, 0.96); backdrop-filter: blur(12px);
            border-top: 1px solid var(--border); padding: 0.65rem 1rem; z-index: 998;
            display: flex; align-items: center; justify-content: space-between;
        }

        @media (min-width: 769px) { .floating-mobile-cta { display: none; } }

        /* Modal Case Study Overlay */
        .modal-backdrop {
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(7, 10, 15, 0.88); backdrop-filter: blur(12px);
            z-index: 9999; display: none; align-items: center; justify-content: center; padding: 1rem;
        }

        .modal-card-case {
            background: var(--bg-card); border: 1px solid var(--border);
            border-radius: 18px; max-width: 720px; width: 100%; max-height: 90vh;
            overflow-y: auto; padding: 1.5rem; color: #fff;
        }

        @media (max-width: 768px) {
            h1.hero-h1 { font-size: 2.1rem !important; line-height: 1.15 !important; }
            h2.section-h2 { font-size: 1.6rem !important; line-height: 1.25 !important; }
            h3 { font-size: 1.1rem !important; }

            .ea-container { padding: 0 1rem !important; width: 100% !important; max-width: 100vw !important; }

            /* Header & Nav Mobile Fixes */
            .ea-navbar { height: 64px !important; }
            .ea-nav-menu { display: none !important; }
            .nav-webinar-btn-desktop { display: none !important; }
            .ea-brand span { font-size: 0.95rem !important; }

            /* Hero Grid */
            .ea-hero-grid { grid-template-columns: 1fr !important; gap: 1.75rem !important; }
            .ea-hero-section { padding: 2rem 0 2rem 0 !important; }
            .hero-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.65rem !important; margin-top: 1.5rem !important; padding-top: 1.25rem !important; }
            .hero-stat-val { font-size: 1.5rem !important; }
            .hero-stat-lbl { font-size: 0.68rem !important; }

            #heroCanvas3D { height: 220px !important; }

            /* Sticky Journey Scroller Mobile Fixes */
            .you-are-here-bar { top: 64px !important; padding: 0.45rem 0 !important; }
            .yah-scroll-arrow { display: none !important; }
            .yah-track { gap: 0.4rem !important; width: 100% !important; }
            .yah-status-label { font-size: 0.72rem !important; }
            .yah-node { font-size: 0.7rem !important; padding: 0.25rem 0.45rem !important; }

            /* Grids Stacking */
            .starting-point-grid { grid-template-columns: 1fr !important; gap: 1rem !important; }
            .project-flagship-grid { grid-template-columns: 1fr !important; gap: 1.25rem !important; }
            
            .sim-node-bar { flex-direction: column !important; gap: 0.4rem !important; }
            .sim-node-item { width: 100% !important; min-width: 100% !important; text-align: left !important; }

            /* Hide floating toast on mobile to prevent content & bottom CTA overlap */
            .social-proof-toast-fixed { display: none !important; }

            .floating-mobile-cta { padding: 0.6rem 0.85rem !important; z-index: 9998 !important; }

            .week-item-block { padding-left: 45px !important; }
            .week-item-dot { left: 12px !important; width: 14px !important; height: 14px !important; top: 22px !important; }
            .timeline-center-line { left: 18px !important; }
        }

        @media (max-width: 480px) {
            h1.hero-h1 { font-size: 1.8rem !important; }
            .ea-btn { padding: 0.65rem 1rem !important; font-size: 0.8rem !important; }
            .search-input-wrapper { min-width: 100% !important; }
        }
    </style>
</head>
<body>

    <!-- TOP SCROLL READING PROGRESS BAR -->
    <div class="top-scroll-progress" id="topScrollProgress"></div>

    <!-- Precision Dot Cursor (Desktop Only) -->
    <div class="custom-cursor-dot" id="customCursorDot"></div>

    <!-- NAVBAR -->
    <header class="ea-navbar">
        <div class="ea-container">
            <div class="ea-navbar-inner">
                <a href="<?php echo APP_URL; ?>/" class="ea-brand">
                    <svg class="ea-logo" width="30" height="30" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Education Algorithm"><g class="ea-g"><path class="ea-base" d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="currentColor" stroke-width="3.4" fill="none" stroke-linecap="round"/><g class="ea-capg"><path class="ea-cap" d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="currentColor"/></g><g class="ea-tas"><path d="M41.6 17.8v8.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="41.6" cy="30.2" r="3.2" fill="currentColor"/></g></g></svg>
                    <span>Education Algorithm</span>
                </a>

                <ul class="ea-nav-menu">
                    <li class="ea-nav-item"><a href="#roadmap">Curriculum</a></li>
                    <li class="ea-nav-item"><a href="#journey">Journey</a></li>
                    <li class="ea-nav-item"><a href="#projects">Projects</a></li>
                    <li class="ea-nav-item"><a href="#skills">Skills</a></li>
                    <li class="ea-nav-item"><a href="#architecture">Architecture</a></li>
                    <li class="ea-nav-item"><a href="#career">Career</a></li>
                    <li class="ea-nav-item"><a href="#faq">FAQ</a></li>
                </ul>

                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <a href="scholarship" class="ea-btn nav-webinar-btn-desktop" style="background: transparent; border: 1px solid var(--tech-cyan); color: var(--tech-cyan-bright); padding: 0.45rem 0.95rem; font-size: 0.82rem;">
                        ← WEBINAR OFFER
                    </a>
                    <a href="scholarship-confirm" class="ea-btn ea-btn-primary" style="padding: 0.55rem 1.15rem; font-size: 0.85rem;">
                        JOIN COURSE — ₹15,000
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- YOU ARE HERE STICKY NAVIGATOR & STAGE SCROLLER TOOL -->
    <div class="you-are-here-bar">
        <div class="ea-container">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem;">
                <button type="button" class="yah-scroll-arrow" onclick="scrollYahTrack(-150)" title="Scroll Left">‹</button>
                
                <div class="yah-track" id="yahTrackScroll">
                    <a href="scholarship" class="yah-node" style="color: var(--tech-cyan-bright); background: rgba(6, 182, 212, 0.12); border: 1px solid var(--tech-cyan); text-decoration: none;">
                        ← WEBINAR OFFER
                    </a>
                    <span style="color: var(--border);">|</span>
                    <div class="yah-status-label" id="yahCurrentLabel">
                        <span style="color: var(--success);">●</span> YOU ARE HERE: JAVA FOUNDATIONS
                    </div>
                    <div class="yah-node active" onclick="scrollToSection('roadmap')">FOUNDATIONS</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node active" onclick="scrollToSection('roadmap')">JAVA</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node" onclick="scrollToSection('roadmap')">WEB</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node" onclick="scrollToSection('roadmap')">DATABASE</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node" onclick="scrollToSection('architecture')">BACKEND</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node" onclick="scrollToSection('projects')">FULL STACK</div>
                    <span style="color: var(--border);">—</span>
                    <div class="yah-node" onclick="scrollToSection('projects')">PROJECTS</div>
                </div>

                <button type="button" class="yah-scroll-arrow" onclick="scrollYahTrack(150)" title="Scroll Right">›</button>
            </div>
        </div>
    </div>

    <!-- HERO SECTION -->
    <section class="ea-hero-section">
        <div class="ea-container">
            <div class="ea-hero-grid">
                <div>
                    <span class="ea-eyebrow">JAVA FULL STACK DEVELOPMENT</span>
                    <h1 class="hero-h1">
                        FROM ZERO TO <br>
                        <span class="gradient-text-hero" id="heroTransformWord">FULL STACK DEVELOPER</span>
                    </h1>
                    <p style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.65; margin-top: 1.25rem; max-width: 620px;">
                        Learn Java, build modern websites, understand databases and APIs, develop backend applications, and build complete full-stack projects.
                    </p>

                    <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap;">
                        <a href="scholarship-confirm" class="ea-btn ea-btn-primary">
                            START MY JOURNEY
                        </a>
                        <a href="#roadmap" class="ea-btn ea-btn-secondary">
                            EXPLORE CURRICULUM
                        </a>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.75rem;">No prior programming experience required.</div>

                    <!-- Metrics Count-Up -->
                    <div class="hero-stats-grid">
                        <div class="hero-stat-card">
                            <div class="hero-stat-val count-num" data-val="16">0</div>
                            <div class="hero-stat-lbl">16 WEEKS</div>
                        </div>
                        <div class="hero-stat-card">
                            <div class="hero-stat-val count-num" data-val="16">0</div>
                            <div class="hero-stat-lbl">16+ PROJECTS</div>
                        </div>
                        <div class="hero-stat-card">
                            <div class="hero-stat-val count-num" data-val="4">0</div>
                            <div class="hero-stat-lbl">4 MAJOR BUILDS</div>
                        </div>
                        <div class="hero-stat-card">
                            <div class="hero-stat-val" style="color: var(--brand-blue-bright);"><span class="count-num" data-val="100">0</span>%</div>
                            <div class="hero-stat-lbl">PRACTICAL LEARNING</div>
                        </div>
                    </div>
                </div>

                <!-- HERO WORKSTATION CANVAS SYSTEM -->
                <div class="hero-system-card motion-reveal">
                    <canvas id="heroCanvas3D"></canvas>
                    <div class="tech-tooltip-box" id="techTooltip" style="position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); background: #101923; border: 1px solid var(--tech-cyan); color: var(--tech-cyan-bright); padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; display: none;">WHERE IT FITS</div>
                </div>
            </div>
        </div>
    </section>

    <!-- CHOOSE YOUR STARTING POINT -->
    <section class="ea-section-alt">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">PERSONALIZED EMPHASIS</span>
                <h2 class="section-h2">WHERE ARE YOU STARTING FROM?</h2>
                <p class="section-desc">Select your experience level to personalize curriculum recommendations.</p>
            </div>

            <div class="starting-point-grid motion-reveal">
                <div class="starting-point-card active" onclick="selectStartingPoint(this, 'new')">
                    <span style="font-size: 1.5rem;">🌱</span>
                    <h3 style="color: #fff; font-size: 1.15rem; margin: 0.5rem 0;">I'M COMPLETELY NEW</h3>
                    <p style="color: var(--text-secondary); font-size: 0.88rem; margin: 0;">"I've never programmed before."</p>
                </div>
                <div class="starting-point-card" onclick="selectStartingPoint(this, 'basics')">
                    <span style="font-size: 1.5rem;">💻</span>
                    <h3 style="color: #fff; font-size: 1.15rem; margin: 0.5rem 0;">I KNOW THE BASICS</h3>
                    <p style="color: var(--text-secondary); font-size: 0.88rem; margin: 0;">"I've tried coding before."</p>
                </div>
                <div class="starting-point-card" onclick="selectStartingPoint(this, 'projects')">
                    <span style="font-size: 1.5rem;">🚀</span>
                    <h3 style="color: #fff; font-size: 1.15rem; margin: 0.5rem 0;">I WANT TO BUILD PROJECTS</h3>
                    <p style="color: var(--text-secondary); font-size: 0.88rem; margin: 0;">"I want practical development skills."</p>
                </div>
            </div>
        </div>
    </section>

    <!-- WHAT WILL I BECOME TRANSFORMATION SLIDER -->
    <section class="ea-section" id="journey">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">TRANSFORMATION SLIDER</span>
                <h2 class="section-h2">WHAT WILL I BECOME?</h2>
                <p class="section-desc">Drag the slider to see your progression from day zero to full-stack developer.</p>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 2rem 1.5rem; text-align: center;" class="motion-reveal">
                <input type="range" id="transformSlider" min="1" max="3" value="2" step="1" oninput="updateTransformationSlider(this.value)" style="width: 80%; accent-color: var(--brand-blue); margin-bottom: 1.5rem;">
                
                <div style="display: flex; justify-content: space-around; color: #fff; font-weight: 800; font-size: 0.9rem;">
                    <div id="tfState1" style="opacity: 0.4;">01 TODAY<br><span style="font-weight: 400; font-size: 0.8rem; color: var(--text-muted);">"I don't know where to start."</span></div>
                    <div id="tfState2" style="color: var(--brand-blue-bright);">02 LEARNING<br><span style="font-weight: 400; font-size: 0.8rem; color: var(--text-secondary);">"Java ➔ Web ➔ Database ➔ Backend"</span></div>
                    <div id="tfState3" style="opacity: 0.4;">03 AFTER JOURNEY<br><span style="font-weight: 400; font-size: 0.8rem; color: var(--text-muted);">"I can build full-stack apps."</span></div>
                </div>
            </div>
        </div>
    </section>

    <!-- 33 — ROADMAP COLOR COMPOSITION -->
    <section class="ea-section-alt" id="roadmap">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">CHRONOLOGICAL ROADMAP</span>
                <h2 class="section-h2">YOUR 16-WEEK DEVELOPER JOURNEY</h2>
                <p class="section-desc">Every week takes you one step closer to building real applications.</p>
            </div>

            <!-- CURRICULUM COMMAND CENTER SEARCH & CHIPS -->
            <div class="command-bar-box motion-reveal">
                <div class="filter-chip-group">
                    <button type="button" class="filter-chip-btn active" onclick="filterRoadmap('all', this)">ALL</button>
                    <button type="button" class="filter-chip-btn" onclick="filterRoadmap('java', this)">JAVA</button>
                    <button type="button" class="filter-chip-btn" onclick="filterRoadmap('web', this)">FRONTEND</button>
                    <button type="button" class="filter-chip-btn" onclick="filterRoadmap('db', this)">DATABASE</button>
                    <button type="button" class="filter-chip-btn" onclick="filterRoadmap('backend', this)">BACKEND</button>
                    <button type="button" class="filter-chip-btn" onclick="filterRoadmap('capstone', this)">PROJECTS</button>
                </div>

                <div class="search-input-wrapper">
                    <input type="text" id="roadmapSearchInput" class="search-input-field" placeholder="Search Spring Boot, HashMaps, Docker...">
                    <span class="search-kbd-badge">⌘ K</span>
                </div>
            </div>

            <!-- TIMELINE CONTAINER -->
            <div class="timeline-vertical-wrap">
                <div class="timeline-center-line"></div>

                <!-- MONTH 01 -->
                <div class="month-banner-row motion-reveal">
                    <span class="month-badge-tag">MONTH 01</span>
                    <h3 style="color: #fff; font-size: 1.2rem; margin: 0;">JAVA FOUNDATIONS & OBJECT-ORIENTED ARCHITECTURE</h3>
                </div>

                <!-- WEEK 01 -->
                <div class="week-item-block roadmap-week-item java motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 01</span>
                            <span style="font-size: 0.75rem; color: var(--success); font-weight: 700;">UNLOCKED ✓</span>
                        </div>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">JAVA PROGRAMMING BASICS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Understand how programs think. Primitive data types, type casting, operators, and modern switch branching.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">CLI Unit & Currency Converter</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-1')">
                                Expand Week ▼
                            </button>
                        </div>

                        <div id="week-exp-1" class="expandable-week-content">
                            <strong style="color: #fff;">WHY THIS MATTERS:</strong> Programs must store variables and execute decision logic.<br>
                            <strong style="color: #fff;">LEARN:</strong> Variables, Data Types, Conditions, Loops.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Programming Logic, Java Basics.<br>
                            <strong style="color: var(--brand-blue-bright);">OUTCOME:</strong> Write beginner Java programs independently.
                        </div>
                    </div>
                </div>

                <!-- WEEK 02 -->
                <div class="week-item-block roadmap-week-item java motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 02</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">LOOPS & ARRAY MEMORY LAYOUT</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Array reference indexing, JVM stack vs heap memory allocation, and loops.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Grade Calculator & Statistical Analyzer</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-2')">
                                Expand Week ▼
                            </button>
                        </div>

                        <div id="week-exp-2" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Loop iterations, array heap allocation, stack frames.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Array Traversals, Memory Awareness.
                        </div>
                    </div>
                </div>

                <!-- WEEK 03 -->
                <div class="week-item-block roadmap-week-item java motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 03</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">OBJECT-ORIENTED PROGRAMMING (OOP)</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Classes, Encapsulation, Inheritance, Polymorphism, and Interfaces.</p>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Bank Account Management System</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-3')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-3" class="expandable-week-content">
                            <strong style="color: var(--success);">UNLOCK:</strong> Object Modeling, Inheritance.
                        </div>
                    </div>
                </div>

                <!-- WEEK 04 -->
                <div class="week-item-block roadmap-week-item java motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 04</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">JAVA COLLECTIONS FRAMEWORK</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">HashMap O(1) hashing, ArrayList dynamic resizing, HashSet, and Generics.</p>

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Student Record & Course Management System</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-4')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-4" class="expandable-week-content">
                            <strong style="color: var(--success);">UNLOCK:</strong> HashMaps O(1), Generics.
                        </div>
                    </div>
                </div>

                <!-- MONTH 02 -->
                <div class="month-banner-row motion-reveal">
                    <span class="month-badge-tag">MONTH 02</span>
                    <h3 style="color: #fff; font-size: 1.2rem; margin: 0;">DATABASE MANAGEMENT & WEB FUNDAMENTALS</h3>
                </div>

                <!-- WEEK 05 -->
                <div class="week-item-block roadmap-week-item java db motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 05</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">ADVANCED JAVA, FILE I/O & JDBC TRANSACTIONS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Exception handling, custom exceptions, File I/O Streams, CSV parsing, JDBC drivers, Connection pooling, and PreparedStatements.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">CSV-to-Database Record Importer</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-5')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-5" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Exception handling hierarchies, JDBC transaction control, Connection pools.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Production Error Resilience & Database Connectivity.
                        </div>
                    </div>
                </div>

                <!-- WEEK 06 -->
                <div class="week-item-block roadmap-week-item db motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 06</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">RELATIONAL DATABASE DESIGN & MYSQL 8.0</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Relational ER modeling, Tables, Primary & Foreign keys, SQL CRUD, Complex JOINs, Subqueries, Indexes, and GROUP BY aggregations.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Library Management Relational Database</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-6')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-6" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Schema normalization, Foreign Key constraints, Multi-table JOIN queries.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> SQL Schema Architecture & Query Optimization.
                        </div>
                    </div>
                </div>

                <!-- WEEK 07 -->
                <div class="week-item-block roadmap-week-item web motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 07</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">SEMANTIC HTML5 & RESPONSIVE CSS3 LAYOUTS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Semantic markup, CSS Box Model, Typography, Flexbox, CSS Grid layouts, Media queries, and Mobile-First responsive design.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Course Catalog & Academy Landing Page</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-7')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-7" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> CSS Flexbox/Grid alignment, viewport breakpoints, custom CSS variables.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Modern Responsive UI Engineering.
                        </div>
                    </div>
                </div>

                <!-- WEEK 08 -->
                <div class="week-item-block roadmap-week-item web motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 08</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">JAVASCRIPT ES6+, DOM MANIPULATION & FETCH API</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">JS syntax, let/const variables, DOM event handling, Forms validation, LocalStorage API, Promises, async/await, and REST Fetch API.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Interactive Quiz & Task Tracker Dashboard</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-8')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-8" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Dynamic DOM mutation, Event Delegation, Async/Await API calls, LocalStorage.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Interactive Single Page Apps (SPA).
                        </div>
                    </div>
                </div>

                <!-- MONTH 03 -->
                <div class="month-banner-row motion-reveal">
                    <span class="month-badge-tag">MONTH 03</span>
                    <h3 style="color: #fff; font-size: 1.2rem; margin: 0;">MODERN REACT FRONTEND & SPRING BOOT BACKEND</h3>
                </div>

                <!-- WEEK 09 -->
                <div class="week-item-block roadmap-week-item web motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 09</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">REACT 18 COMPONENT ARCHITECTURE & STATE</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">React Vite setup, JSX syntax, functional components, props passing, useState state management, conditional rendering, and key props.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Recipe Finder & Filter Application</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-9')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-9" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Declarative UI rendering, Component composition, useState hooks.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> React Component Architecture.
                        </div>
                    </div>
                </div>

                <!-- WEEK 10 -->
                <div class="week-item-block roadmap-week-item web motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 10</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">REACT HOOKS, CLIENT ROUTING & REST INTEGRATION</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">useEffect lifecycle management, useRef, useContext, Client-side React Router navigation, Axios HTTP requests, and form state loaders.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Education Course Portal (Frontend SPA)</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-10')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-10" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Async API data fetching, React Router DOM, Central Context state.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Dynamic Production Frontend SPA.
                        </div>
                    </div>
                </div>

                <!-- WEEK 11 -->
                <div class="week-item-block roadmap-week-item backend motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 11</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">SPRING BOOT 3 REST API ARCHITECTURE</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Spring Boot architecture, Dependency Injection (IoC), Spring MVC Controllers (@RestController), HTTP methods, Request/Response DTOs, and REST standards.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Book Inventory REST API</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-11')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-11" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Inversion of Control, RestController mappings, DTO validation.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Enterprise Java Microservices.
                        </div>
                    </div>
                </div>

                <!-- WEEK 12 -->
                <div class="week-item-block roadmap-week-item backend db motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 12</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">SPRING DATA JPA, HIBERNATE ORM & MYSQL</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Spring Data JPA, @Entity mapping, JpaRepository, Service layer transactions (@Transactional), MySQL integration, and custom query methods.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Student Management Persistent REST Service</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-12')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-12" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Entity relationship mapping, HQL/JPQL queries, Repository abstraction.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Object-Relational Database Mapping.
                        </div>
                    </div>
                </div>

                <!-- MONTH 04 -->
                <div class="month-banner-row motion-reveal">
                    <span class="month-badge-tag">MONTH 04</span>
                    <h3 style="color: #fff; font-size: 1.2rem; margin: 0;">FULL STACK INTEGRATION, SECURITY & CLOUD CAPSTONE</h3>
                </div>

                <!-- WEEK 13 -->
                <div class="week-item-block roadmap-week-item backend motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 13</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">SPRING SECURITY 6 & JWT AUTHENTICATION</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Spring Security filter chains, Authentication vs Authorization, BCrypt password hashing, JWT creation & validation, and Role-Based Access Control.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Secure JWT Authentication Microservice</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-13')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-13" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Bearer Token verification, Security Filter Chains, Role Guards.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Enterprise Identity & Token Security.
                        </div>
                    </div>
                </div>

                <!-- WEEK 14 -->
                <div class="week-item-block roadmap-week-item web backend motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 14</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">FULL STACK INTEGRATION & AXIOS INTERCEPTORS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Connecting React SPA to Spring Boot REST backend, CORS headers, Axios JWT bearer token injection, global UI error toasts, and loading states.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Integrated Task & Issue Tracker</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-14')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-14" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Cross-Origin Resource Sharing, Axios Interceptors, JWT Token Lifecycle.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> End-to-End Full Stack Integration.
                        </div>
                    </div>
                </div>

                <!-- WEEK 15 -->
                <div class="week-item-block roadmap-week-item capstone backend motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 15</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">ENTERPRISE CAPSTONE LMS CORE BUILD & TESTING</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Domain modeling & feature scoping, course enrollments, progress tracking workflows, JUnit 5 unit tests, and Mockito mock assertions.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Education Algorithm LMS — Core Build</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-15')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-15" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Multi-layer architecture, Automated Unit Testing, Mocking.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Enterprise Platform Capstone Architecture.
                        </div>
                    </div>
                </div>

                <!-- WEEK 16 -->
                <div class="week-item-block roadmap-week-item capstone backend motion-reveal">
                    <div class="week-item-dot"></div>
                    <div class="week-item-card">
                        <span class="ea-eyebrow" style="margin-bottom: 0;">WEEK 16</span>
                        <h3 style="color: #fff; font-size: 1.15rem; margin: 0.4rem 0;">DOCKER CONTAINERIZATION & AWS CLOUD DEPLOYMENT</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem;">Git PR workflows, Dockerfile multi-stage container builds, AWS RDS MySQL setup, Render/Vercel cloud deployment, Swagger API docs, and portfolio showcase.</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                            <span class="tech-tag-pill cyan">Production Deployment & Portfolio Showcase</span>
                            <button type="button" class="ea-btn ea-btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;" onclick="toggleWeekInline('week-exp-16')">
                                Expand Week ▼
                            </button>
                        </div>
                        <div id="week-exp-16" class="expandable-week-content">
                            <strong style="color: #fff;">LEARN:</strong> Docker Image building, Cloud Environment variables, Swagger OpenAPI, AWS RDS.<br>
                            <strong style="color: var(--success);">UNLOCK:</strong> Production Cloud Deployment & Career Showcase.
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>

    <!-- 43 — CODE EDITOR SYNTAX COLORS -->
    <section class="ea-section">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">LIVE CODE LABS</span>
                <h2 class="section-h2">INTERACTIVE CODE SYNTAX & PREVIEW</h2>
                <p class="section-desc">Experience real code syntax highlighting with live interactive browser rendering.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;" class="motion-reveal">
                <div class="code-window-syntax">
                    <span class="code-cm">// Interactive React 18 Component</span><br>
                    <span class="code-kw">function</span> <span style="color: #fff;">CourseBadge</span>() {<br>
                    &nbsp;&nbsp;<span class="code-kw">const</span> [enrolled, setEnrolled] = useState(<span class="code-str">"Enrolled ✓"</span>);<br>
                    &nbsp;&nbsp;<span class="code-kw">return</span> (<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;&lt;<span class="code-fn">button</span>&gt;{enrolled}&lt;/<span class="code-fn">button</span>&gt;<br>
                    &nbsp;&nbsp;);<br>
                    }
                </div>

                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem;">
                    <div style="font-size: 0.75rem; color: var(--text-dim); font-weight: 700; margin-bottom: 0.75rem;">LIVE INTERACTIVE PREVIEW</div>
                    <div style="background: #080D14; border: 1px solid var(--border); padding: 1.25rem; border-radius: 10px; text-align: center;">
                        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.5rem;">Java Full Stack Mastery</h3>
                        <button type="button" class="ea-btn ea-btn-primary" style="padding: 0.4rem 1rem; font-size: 0.8rem;" onclick="this.textContent = (this.textContent === 'Enrolled ✓' ? 'Join Course' : 'Enrolled ✓');">
                            Enrolled ✓
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 27 & 28 — ARCHITECTURE & DATA FLOW EXPLORER -->
    <section class="ea-section-alt" id="architecture">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">SYSTEM ARCHITECTURE</span>
                <h2 class="section-h2">SPRING BOOT MICROSERVICE REQUEST SIMULATION</h2>
                <p class="section-desc">Click any node to inspect system layers and trigger live HTTP payloads.</p>
            </div>

            <div style="background: #080D14; border: 1px solid var(--border); border-radius: 18px; padding: 2rem 1.5rem; text-align: center;" class="motion-reveal">
                <div class="sim-node-bar">
                    <div id="sim-node-browser" class="sim-node-item arch-node-frontend" onclick="showArchNodeInfo('BROWSER', 'React 18 Single Page Application executing frontend requests.')">
                        <strong style="color: #fff; font-size: 0.82rem;">BROWSER</strong>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">React 18 SPA</div>
                    </div>
                    <span style="color: var(--tech-cyan-bright);">➔</span>
                    <div id="sim-node-api" class="sim-node-item arch-node-api" onclick="showArchNodeInfo('REST API', 'Sends JSON HTTP POST requests via Axios interceptors.')">
                        <strong style="color: #fff; font-size: 0.82rem;">REST API</strong>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">Axios Interceptor</div>
                    </div>
                    <span style="color: var(--tech-cyan-bright);">➔</span>
                    <div id="sim-node-controller" class="sim-node-item arch-node-backend" onclick="showArchNodeInfo('CONTROLLER', 'Receives incoming requests in Spring Boot @RestController.')">
                        <strong style="color: #fff; font-size: 0.82rem;">CONTROLLER</strong>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">@RestController</div>
                    </div>
                    <span style="color: var(--tech-cyan-bright);">➔</span>
                    <div id="sim-node-service" class="sim-node-item arch-node-backend" onclick="showArchNodeInfo('SERVICE', 'Executes application business logic and security rules.')">
                        <strong style="color: #fff; font-size: 0.82rem;">SERVICE</strong>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">Business Logic</div>
                    </div>
                    <span style="color: var(--tech-cyan-bright);">➔</span>
                    <div id="sim-node-db" class="sim-node-item arch-node-db" onclick="showArchNodeInfo('MYSQL DB', 'Communicates with MySQL relational tables via Spring Data JPA ORM.')">
                        <strong style="color: #fff; font-size: 0.82rem;">MYSQL DB</strong>
                        <div style="font-size: 0.7rem; color: var(--text-dim);">Spring Data JPA</div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; background: #070A0F; border: 1px solid var(--border); padding: 0.85rem 1.15rem; border-radius: 10px; flex-wrap: wrap; gap: 0.5rem;">
                    <span style="color: var(--text-secondary); font-size: 0.85rem;" id="simStatusMsg">Status: Waiting to trigger request...</span>
                    <button type="button" class="ea-btn ea-btn-primary" style="padding: 0.4rem 1rem; font-size: 0.78rem;" onclick="triggerLiveRequestSim()">
                        ⚡ Trigger POST /api/v1/auth/login
                    </button>
                </div>
            </div>
        </div>
    </section>

    <!-- 25 — PROJECT COLORS & FLAGSHIP CASE STUDY CARDS -->
    <section class="ea-section" id="projects">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">PORTFOLIO BUILDS</span>
                <h2 class="section-h2">DON'T JUST SAY YOU KNOW JAVA. SHOW WHAT YOU BUILT.</h2>
                <p class="section-desc">Walk into tech interviews with working software deployed on Cloud servers.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.75rem;" class="motion-reveal">
                <!-- Project 01 -->
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <span class="ea-eyebrow">PROJECT 01</span>
                        <h3 style="color: #fff; font-size: 1.3rem; margin: 0.4rem 0;">Amazon-Style E-Commerce Platform</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">Multi-tenant online store featuring React state management, Spring Boot REST API cart logic, Stripe checkout, and MySQL relational order tracking.</p>
                    </div>
                    <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                        <button type="button" class="ea-btn ea-btn-secondary" style="width: 100%; font-size: 0.8rem;" onclick="openCaseStudyModal('Amazon-Style E-Commerce Platform', 'React 18 • Spring Boot • Stripe • MySQL', 'Problem: High-concurrency cart state synchronization.\n\nSolution: Spring Boot REST API backed by Redis caching & MySQL transactional order locks.')">
                            EXPLORE CASE STUDY →
                        </button>
                    </div>
                </div>

                <!-- Project 02 -->
                <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 18px; padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <span class="ea-eyebrow">PROJECT 02</span>
                        <h3 style="color: #fff; font-size: 1.3rem; margin: 0.4rem 0;">NetBanking & Digital Wallet Portal</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">Secure fintech core managing Checking/Savings accounts, instant money transfers, audit logs, and BCrypt password encryption.</p>
                    </div>
                    <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                        <button type="button" class="ea-btn ea-btn-secondary" style="width: 100%; font-size: 0.8rem;" onclick="openCaseStudyModal('NetBanking & Digital Wallet Portal', 'Core Java 21 • Spring Security • JWT', 'Problem: Atomic transaction consistency.\n\nSolution: Spring @Transactional ACID isolation preventing race conditions during balance transfers.')">
                            EXPLORE CASE STUDY →
                        </button>
                    </div>
                </div>

                <!-- Project 03 -->
                <div style="background: var(--bg-card); border: 1px solid var(--premium-violet); border-radius: 18px; padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <span class="ea-eyebrow" style="border-color: var(--premium-violet); color: var(--premium-violet-bright);">CAPSTONE BUILD</span>
                        <h3 style="color: #fff; font-size: 1.3rem; margin: 0.4rem 0;">Education Algorithm LMS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.88rem; line-height: 1.6;">Capstone LMS platform with course video progress tracking, interactive quizzes, automated unit tests, and AWS deployment.</p>
                    </div>
                    <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                        <button type="button" class="ea-btn ea-btn-secondary" style="width: 100%; font-size: 0.8rem;" onclick="openCaseStudyModal('Education Algorithm LMS', 'JUnit 5 • Mockito • AWS Docker', 'Full Capstone architecture deployed using Docker multi-stage containers on AWS cloud.')">
                            EXPLORE CASE STUDY →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 26 — SKILL UNLOCK SYSTEM -->
    <section class="ea-section-alt" id="skills">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">VERIFIED COMPETENCIES</span>
                <h2 class="section-h2">DEVELOPER SKILL PROGRESSION SYSTEM</h2>
                <p class="section-desc">Track skills unlocked progressively throughout the 16 weeks.</p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem;" class="motion-reveal">
                <div class="skill-card-unlocked" style="border-radius: 14px; padding: 1.25rem;">
                    <strong style="color: var(--tech-cyan-bright); font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">CORE PROGRAMMING</strong>
                    <div style="font-size: 0.8rem; color: #fff; line-height: 1.8;">
                        <span style="color: var(--success);">✓</span> Java 21 Syntax<br>
                        <span style="color: var(--success);">✓</span> OOP Inheritance & Interfaces<br>
                        <span style="color: var(--success);">✓</span> HashMap O(1) Hashing
                    </div>
                </div>
                <div class="skill-card-unlocked" style="border-radius: 14px; padding: 1.25rem;">
                    <strong style="color: var(--brand-blue-bright); font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">FRONTEND WEB</strong>
                    <div style="font-size: 0.8rem; color: #fff; line-height: 1.8;">
                        <span style="color: var(--success);">✓</span> React 18 SPA Hooks<br>
                        <span style="color: var(--success);">✓</span> JavaScript ES6+ Async<br>
                        <span style="color: var(--success);">✓</span> HTML5 & CSS Grid Layouts
                    </div>
                </div>
                <div class="skill-card-unlocked" style="border-radius: 14px; padding: 1.25rem;">
                    <strong style="color: var(--premium-violet-bright); font-size: 0.85rem; display: block; margin-bottom: 0.5rem;">BACKEND ENGINEERING</strong>
                    <div style="font-size: 0.8rem; color: #fff; line-height: 1.8;">
                        <span style="color: var(--success);">✓</span> Spring Boot 3 REST APIs<br>
                        <span style="color: var(--success);">✓</span> Spring Security JWT Auth<br>
                        <span style="color: var(--success);">✓</span> Spring Data JPA ORM
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ ACCORDION SYSTEM -->
    <section class="ea-section-alt" id="faq">
        <div class="ea-container">
            <div class="section-header motion-reveal">
                <span class="ea-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
                <h2 class="section-h2">FREQUENTLY ASKED QUESTIONS</h2>
            </div>

            <div class="faq-accordion-box motion-reveal">
                <div class="faq-accordion-item">
                    <button type="button" class="faq-acc-btn" onclick="toggleFaqAccordion('faq-d1')">
                        Is this course suitable for beginners?
                        <span>▼</span>
                    </button>
                    <div id="faq-d1" class="faq-acc-body">
                        Yes! The curriculum begins with Phase 01 Programming Basics (variables, conditions, loops) before advancing to Java 21, Spring Boot, and React.
                    </div>
                </div>

                <div class="faq-accordion-item">
                    <button type="button" class="faq-acc-btn" onclick="toggleFaqAccordion('faq-d2')">
                        Do I need prior Java knowledge?
                        <span>▼</span>
                    </button>
                    <div id="faq-d2" class="faq-acc-body">
                        No prior programming experience is required. We start from ground zero and build up to full-stack engineering.
                    </div>
                </div>

                <div class="faq-accordion-item">
                    <button type="button" class="faq-acc-btn" onclick="toggleFaqAccordion('faq-d3')">
                        Will I build real projects?
                        <span>▼</span>
                    </button>
                    <div id="faq-d3" class="faq-acc-body">
                        Yes, you will build 16 weekly projects and 6 flagship enterprise applications (E-Commerce, NetBanking, LMS, etc.).
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 35 — FINAL CTA COLOR COMPOSITION -->
    <section class="ea-section">
        <div class="ea-container">
            <div class="final-cta-card motion-reveal">
                <span class="ea-eyebrow">EXCLUSIVE WEBINAR OFFER</span>
                <h2 style="font-size: 2.5rem; color: #fff; margin: 0.5rem 0;">YOUR DEVELOPER JOURNEY STARTS HERE.</h2>
                <p style="color: var(--text-secondary); font-size: 1rem; max-width: 650px; margin: 0 auto 2rem auto; line-height: 1.6;">
                    Hold your scholarship seat for <strong style="color: #fff;">₹500</strong> and lock in the <strong>₹15,000</strong> webinar price (Standard Fee: <span style="text-decoration: line-through;">₹20,000</span>).
                </p>

                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="scholarship-confirm" class="ea-btn ea-btn-primary" style="padding: 0.85rem 2rem; font-size: 1rem;">
                        START MY JOURNEY — ₹500
                    </a>
                    <a href="scholarship" class="ea-btn ea-btn-secondary" style="padding: 0.85rem 1.75rem; font-size: 0.92rem;">
                        EXPLORE THE ROADMAP
                    </a>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1.25rem;">No prior programming experience required.</div>
            </div>
        </div>
    </section>

    <!-- PERMANENTLY VISIBLE LIVE SOCIAL PROOF TICKER -->
    <div class="social-proof-toast-fixed" id="fixedSocialProofToast">
        <span style="font-size: 1.2rem;">🔥</span>
        <div>
            <strong style="color: #fff;" id="proofNameText">Rahul K. from Bangalore</strong>
            <div style="color: var(--text-secondary); font-size: 0.75rem;" id="proofMsgText">Just reserved a scholarship seat 2 mins ago</div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer style="padding: 2.5rem 0; border-top: 1px solid var(--border-subtle); text-align: center; color: var(--text-muted); font-size: 0.85rem;">
        <div class="ea-container">
            <p>© <?php echo date('Y'); ?> Education Algorithm. All rights reserved. | <a href="scholarship" style="color: var(--tech-cyan-bright); text-decoration: none; font-weight: 700;">← Return to Webinar Scholarship Page</a></p>
        </div>
    </footer>

    <!-- CASE STUDY MODAL -->
    <div class="modal-backdrop" id="caseStudyModal">
        <div class="modal-card-case">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <span id="caseTechTag" class="ea-eyebrow">Tech Stack</span>
                    <h3 id="caseTitle" style="color: #fff; font-size: 1.35rem; margin: 0.3rem 0;">Project Case Study</h3>
                </div>
                <button type="button" onclick="closeCaseStudyModal()" style="background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer;">&times;</button>
            </div>
            <div id="caseBody" style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin-top: 1rem; white-space: pre-wrap;">
                Case Study details...
            </div>
            <div style="text-align: right; margin-top: 1.5rem;">
                <button type="button" onclick="closeCaseStudyModal()" class="ea-btn ea-btn-secondary" style="padding: 0.4rem 1rem; font-size: 0.8rem;">Close Case Study</button>
            </div>
        </div>
    </div>

    <!-- FLOATING MOBILE CTA BAR -->
    <div class="floating-mobile-cta">
        <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">WEBINAR OFFER ACTIVE</div>
            <div style="font-size: 0.85rem; color: #fff; font-weight: 800;">₹15,000 <span style="font-size: 0.72rem; color: var(--text-muted); text-decoration: line-through;">₹20,000</span></div>
        </div>
        <a href="scholarship-confirm" class="ea-btn ea-btn-primary" style="padding: 0.45rem 0.85rem; font-size: 0.78rem;">
            🔒 HOLD SEAT — ₹500
        </a>
    </div>

    <!-- ENGINE SCRIPTS -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Top Reading Progress Bar Listener
            const progressBar = document.getElementById('topScrollProgress');
            window.addEventListener('scroll', function() {
                const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                if (totalHeight > 0 && progressBar) {
                    const progress = (window.scrollY / totalHeight) * 100;
                    progressBar.style.width = progress + '%';
                }
            });

            // Intersection Observer
            const revealObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) entry.target.classList.add('is-visible');
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.motion-reveal').forEach(el => revealObserver.observe(el));

            // Precision Cursor Engine
            initCustomCursor();

            // Hero Headline Staged Word Transformation
            initHeroTransformation();

            // Hero Workstation Canvas Engine
            initHeroWorkstationCanvas();

            // Count-Up Numbers
            initStatCounters();

            // Social Proof Ticker
            initSocialProofTicker();

            // Keyboard Shortcut Search Trigger
            document.addEventListener('keydown', function(e) {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                    e.preventDefault();
                    const input = document.getElementById('roadmapSearchInput');
                    if (input) input.focus();
                }
            });
        });

        // Stage Scroller Tool Engine
        function scrollYahTrack(amount) {
            const track = document.getElementById('yahTrackScroll');
            if (track) track.scrollBy({ left: amount, behavior: 'smooth' });
        }

        // Scroll to Section Helper
        function scrollToSection(id) {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }

        // Custom Cursor Engine
        function initCustomCursor() {
            const cursor = document.getElementById('customCursorDot');
            if (!cursor || window.innerWidth < 1024) return;

            document.addEventListener('mousemove', function(e) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            });

            document.querySelectorAll('a, button, .starting-point-card').forEach(el => {
                el.addEventListener('mouseenter', () => cursor.classList.add('expand'));
                el.addEventListener('mouseleave', () => cursor.classList.remove('expand'));
            });
        }

        // Hero Staged Word Transformation
        function initHeroTransformation() {
            const words = ["ZERO", "JAVA", "WEB", "BACKEND", "FULL STACK DEVELOPER"];
            const target = document.getElementById('heroTransformWord');
            let idx = 0;
            if (!target) return;

            const timer = setInterval(() => {
                idx++;
                if (idx < words.length) {
                    target.textContent = words[idx];
                } else {
                    clearInterval(timer);
                }
            }, 600);
        }

        // Count-Up Engine
        function initStatCounters() {
            const counterObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const finalVal = parseInt(el.getAttribute('data-val'), 10);
                        let cur = 0;
                        const timer = setInterval(() => {
                            cur += 1;
                            el.textContent = cur;
                            if (cur >= finalVal) clearInterval(timer);
                        }, 40);
                        counterObserver.unobserve(el);
                    }
                });
            }, { threshold: 0.5 });

            document.querySelectorAll('.count-num').forEach(el => counterObserver.observe(el));
        }

        // Hero Workstation Canvas Engine
        function initHeroWorkstationCanvas() {
            const canvas = document.getElementById('heroCanvas3D');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const width = canvas.width = canvas.parentElement.clientWidth - 40;
            const height = canvas.height = 320;

            let rot = 0;

            function render() {
                ctx.clearRect(0, 0, width, height);
                rot += 0.015;

                const cx = width / 2;
                const cy = height / 2;

                ctx.fillStyle = "#101923";
                ctx.beginPath();
                ctx.arc(cx, cy, 38, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = "#2563EB";
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = "#fff";
                ctx.font = "bold 12px Inter";
                ctx.textAlign = "center";
                ctx.fillText("JAVA 21", cx, cy + 4);

                const techNodes = [
                    { label: "React 18", angle: rot },
                    { label: "MySQL 8", angle: rot + Math.PI / 2 },
                    { label: "Spring 3", angle: rot + Math.PI },
                    { label: "Docker", angle: rot + 3 * Math.PI / 2 }
                ];

                techNodes.forEach(node => {
                    const nx = cx + Math.cos(node.angle) * 105;
                    const ny = cy + Math.sin(node.angle) * 75;

                    ctx.strokeStyle = "rgba(6, 182, 212, 0.25)";
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(nx, ny);
                    ctx.stroke();

                    ctx.fillStyle = "#141F2C";
                    ctx.beginPath();
                    ctx.arc(nx, ny, 22, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = "#06B6D4";
                    ctx.stroke();

                    ctx.fillStyle = "#22D3EE";
                    ctx.font = "10px Inter";
                    ctx.fillText(node.label, nx, ny + 3);
                });

                requestAnimationFrame(render);
            }

            render();
        }

        // Starting Point Personalization Selector
        function selectStartingPoint(card, type) {
            document.querySelectorAll('.starting-point-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const label = document.getElementById('yahCurrentLabel');
            if (type === 'new' && label) label.innerHTML = '<span style="color: var(--success);">●</span> YOU ARE HERE: PROGRAMMING FOUNDATIONS';
            if (type === 'basics' && label) label.innerHTML = '<span style="color: var(--success);">●</span> YOU ARE HERE: JAVA & OOP ARCHITECTURE';
            if (type === 'projects' && label) label.innerHTML = '<span style="color: var(--success);">●</span> YOU ARE HERE: FULL STACK CAPSTONE PROJECTS';
        }

        // Transformation Slider Engine
        function updateTransformationSlider(val) {
            const s1 = document.getElementById('tfState1');
            const s2 = document.getElementById('tfState2');
            const s3 = document.getElementById('tfState3');

            s1.style.opacity = 0.4; s2.style.opacity = 0.4; s3.style.opacity = 0.4;
            s1.style.color = '#fff'; s2.style.color = '#fff'; s3.style.color = '#fff';

            if (val == 1 && s1) { s1.style.opacity = 1; s1.style.color = 'var(--brand-blue-bright)'; }
            if (val == 2 && s2) { s2.style.opacity = 1; s2.style.color = 'var(--brand-blue-bright)'; }
            if (val == 3 && s3) { s3.style.opacity = 1; s3.style.color = 'var(--brand-blue-bright)'; }
        }

        // Live Request Simulation
        function triggerLiveRequestSim() {
            const nodes = ["browser", "api", "controller", "service", "db"];
            const status = document.getElementById('simStatusMsg');

            nodes.forEach(n => {
                const el = document.getElementById('sim-node-' + n);
                if (el) el.classList.remove('active-glow');
            });

            nodes.forEach((n, idx) => {
                setTimeout(() => {
                    const el = document.getElementById('sim-node-' + n);
                    if (el) el.classList.add('active-glow');
                    if (status) status.textContent = `Processing Step ${idx + 1}/5: Traversing ${n.toUpperCase()} node...`;

                    if (idx === nodes.length - 1) {
                        setTimeout(() => {
                            if (status) status.textContent = "✅ SUCCESS: 200 OK — JSON User Session Authenticated & Token Issued!";
                        }, 400);
                    }
                }, idx * 450);
            });
        }

        // Architecture Node Explainer
        function showArchNodeInfo(nodeName, desc) {
            const status = document.getElementById('simStatusMsg');
            if (status) status.textContent = `NODE SELECTED (${nodeName}): ${desc}`;
        }

        // Filter Roadmap
        function filterRoadmap(cat, btn) {
            document.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
            if (btn) btn.classList.add('active');

            document.querySelectorAll('.roadmap-week-item').forEach(item => {
                if (cat === 'all' || item.classList.contains(cat)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        }

        // Search Roadmap Filter
        const searchInput = document.getElementById('roadmapSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const term = e.target.value.toLowerCase().trim();
                document.querySelectorAll('.roadmap-week-item').forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = (term === '' || text.includes(term)) ? 'block' : 'none';
                });
            });
        }

        // Toggle Expandable Content
        function toggleWeekInline(id) {
            const content = document.getElementById(id);
            if (content) content.classList.toggle('active');
        }

        // FAQ Toggle
        function toggleFaqAccordion(id) {
            const body = document.getElementById(id);
            if (body) {
                body.classList.toggle('active');
                const btn = body.previousElementSibling;
                if (btn) btn.classList.toggle('active');
            }
        }

        // Case Study Modal
        function openCaseStudyModal(title, tech, body) {
            document.getElementById('caseTitle').textContent = title;
            document.getElementById('caseTechTag').textContent = tech;
            document.getElementById('caseBody').textContent = body;
            document.getElementById('caseStudyModal').style.display = 'flex';
        }

        function closeCaseStudyModal() {
            document.getElementById('caseStudyModal').style.display = 'none';
        }

        // Social Proof Ticker Loop
        function initSocialProofTicker() {
            const proofNames = ["Rahul K. from Bangalore", "Sneha M. from Hyderabad", "Priya R. from Chennai", "Ankit S. from Pune"];
            const proofMsgs = ["Just reserved a scholarship seat 2 mins ago", "Unlocked Full Stack Roadmap", "Claimed webinar offer price ₹15,000"];
            let idx = 0;

            setInterval(() => {
                idx = (idx + 1) % proofNames.length;
                document.getElementById('proofNameText').textContent = proofNames[idx];
                document.getElementById('proofMsgText').textContent = proofMsgs[idx % proofMsgs.length];
            }, 4000);
        }
    </script>
    <script src="assets/chatbot.js?v=5.0.0" defer></script>
</body>
</html>
