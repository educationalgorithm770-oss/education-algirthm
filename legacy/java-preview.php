<?php
// java-preview.php — Live Interactive Java Spring Boot 3 + React 18 Architecture Preview
require_once __DIR__ . '/config.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java Full Stack (Spring Boot 3 + React 18) Live Architecture Preview | Education Algorithm</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet">
    
    <!-- React 18 & Babel for Live In-Browser React SPA Execution -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        :root {
            --bg-base: #070A0F;
            --bg-card: #0B1017;
            --bg-elevated: #101923;
            --border: rgba(255, 255, 255, 0.08);
            --border-glow: rgba(59, 130, 246, 0.35);
            --primary: #2563EB;
            --primary-light: #3B82F6;
            --cyan: #06B6D4;
            --cyan-bright: #22D3EE;
            --violet: #7C3AED;
            --violet-light: #A78BFA;
            --text-main: #F8FAFC;
            --text-sub: #94A3B8;
            --text-muted: #64748B;
            --font-body: 'Inter', system-ui, sans-serif;
            --font-heading: 'Manrope', system-ui, sans-serif;
            --font-mono: 'JetBrains Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg-base);
            color: var(--text-main);
            font-family: var(--font-body);
            line-height: 1.6;
            padding-bottom: 5rem;
        }

        .preview-nav {
            background: rgba(11, 16, 23, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 0;
            z-index: 100;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.65rem;
            text-decoration: none;
            color: #fff;
            font-family: var(--font-heading);
            font-weight: 800;
            font-size: 1.15rem;
        }
        .tech-badge {
            background: rgba(37, 99, 235, 0.15);
            border: 1px solid var(--primary-light);
            color: #60A5FA;
            padding: 0.25rem 0.75rem;
            border-radius: 999px;
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .hero-banner {
            max-width: 1280px;
            margin: 3rem auto 2rem;
            padding: 0 1.5rem;
            text-align: center;
        }
        .hero-banner h1 {
            font-family: var(--font-heading);
            font-size: 2.5rem;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 0.75rem;
            background: linear-gradient(135deg, #FFFFFF 0%, #94A3B8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero-banner p {
            color: var(--text-sub);
            font-size: 1.1rem;
            max-width: 760px;
            margin: 0 auto 1.75rem;
        }

        .main-layout {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
        }

        @media (max-width: 992px) {
            .main-layout { grid-template-columns: 1fr; }
        }

        .panel-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 1.75rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }
        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
            border-bottom: 1px solid var(--border);
            padding-bottom: 0.85rem;
        }
        .panel-title {
            font-family: var(--font-heading);
            font-size: 1.1rem;
            font-weight: 700;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .btn-action {
            background: linear-gradient(135deg, var(--primary), #1D4ED8);
            color: #fff;
            border: none;
            padding: 0.65rem 1.25rem;
            border-radius: 8px;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            text-decoration: none;
        }
        .btn-action:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
        }

        .code-console {
            background: #030712;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px;
            padding: 1rem;
            font-family: var(--font-mono);
            font-size: 0.82rem;
            color: #34D399;
            overflow-x: auto;
            max-height: 380px;
        }

        .endpoint-selector {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            margin-bottom: 1rem;
        }
        .endpoint-btn {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            color: var(--text-sub);
            padding: 0.45rem 0.85rem;
            border-radius: 6px;
            font-family: var(--font-mono);
            font-size: 0.78rem;
            cursor: pointer;
            transition: all 0.2s;
        }
        .endpoint-btn.active {
            background: rgba(6, 182, 212, 0.15);
            border-color: var(--cyan);
            color: var(--cyan-bright);
            font-weight: 700;
        }

        /* React Live Card Styles */
        .react-course-card {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1rem;
            transition: all 0.25s ease;
        }
        .react-course-card:hover {
            border-color: var(--border-glow);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>

    <header class="preview-nav">
        <a href="./" class="brand-pill">
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.5 23.4v6.8c0 3.6 5 6.1 11 6.1s11-2.5 11-6.1v-6.8" stroke="#3B82F6" stroke-width="3.4" stroke-linecap="round"/>
                <path d="M22.5 6.5 43 16 22.5 25.5 2 16Z" fill="#3B82F6"/>
            </svg>
            <span>Education Algorithm</span>
        </a>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
            <span class="tech-badge">⚡ Java 21</span>
            <span class="tech-badge" style="border-color: #10B981; color: #34D399; background: rgba(16,185,129,0.15);">🍃 Spring Boot 3</span>
            <span class="tech-badge" style="border-color: #61DAFB; color: #61DAFB; background: rgba(97,218,251,0.15);">⚛️ React 18 SPA</span>
        </div>
    </header>

    <section class="hero-banner">
        <h1>Live Java Full Stack Architecture Preview</h1>
        <p>Experience how your platform operates with a live **React 18 Single Page Application (SPA)** consuming real-time **Spring Boot 3 REST API Microservices**.</p>
    </section>

    <main class="main-layout">
        <!-- LEFT PANEL: React 18 Live UI Component -->
        <div class="panel-box">
            <div class="panel-header">
                <div class="panel-title">
                    <span>⚛️</span> React 18 Dynamic Frontend Component
                </div>
                <span style="font-size: 0.75rem; color: var(--cyan-bright); font-family: var(--font-mono);">Client SPA View</span>
            </div>

            <!-- Container where Babel renders live React component -->
            <div id="react-live-root"></div>
        </div>

        <!-- RIGHT PANEL: Spring Boot 3 REST API Simulator -->
        <div class="panel-box">
            <div class="panel-header">
                <div class="panel-title">
                    <span>☕</span> Spring Boot 3 REST API Microservice Simulator
                </div>
                <span style="font-size: 0.75rem; color: #34D399; font-family: var(--font-mono);">Port: 8080 (HTTPS)</span>
            </div>

            <p style="font-size: 0.85rem; color: var(--text-sub); margin-bottom: 1rem;">
                Click a Spring MVC Controller endpoint below to simulate live REST API JSON payloads:
            </p>

            <div class="endpoint-selector">
                <button class="endpoint-btn active" onclick="simulateEndpoint('courses')">GET /api/v1/courses</button>
                <button class="endpoint-btn" onclick="simulateEndpoint('roadmap')">GET /api/v1/roadmap/16-weeks</button>
                <button class="endpoint-btn" onclick="simulateEndpoint('finance')">GET /api/v1/admin/finance</button>
                <button class="endpoint-btn" onclick="simulateEndpoint('otp')">POST /api/v1/enrollment/send-otp</button>
            </div>

            <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
                <span>SPRING MVC CONTROLLER RESPONSE</span>
                <span id="responseStatus" style="color: #34D399;">HTTP 200 OK (9ms)</span>
            </div>

            <pre class="code-console" id="jsonConsoleOutput">// Click an endpoint above to execute Spring Boot REST request...</pre>
        </div>
    </main>

    <!-- LIVE IN-BROWSER REACT 18 COMPONENT CODE -->
    <script type="text/babel">
        function LiveReactCohortApp() {
            const [selectedTrack, setSelectedTrack] = React.useState('all');

            const courses = [
                {
                    id: 1,
                    title: "Java Full Stack Masterclass (Spring Boot 3 + React 18)",
                    level: "Beginner to Enterprise Architect",
                    duration: "16 Weeks • 4 Months",
                    price: "₹19,999",
                    tags: ["Java 21", "Spring Boot 3", "React 18", "AWS"],
                    seats: 4
                },
                {
                    id: 2,
                    title: "Data Science & Generative AI Specialist",
                    level: "Intermediate",
                    duration: "12 Weeks • 3 Months",
                    price: "₹24,999",
                    tags: ["Python", "PyTorch", "LLMs", "FastAPI"],
                    seats: 2
                },
                {
                    id: 3,
                    title: "Data Structures, Algorithms & System Design",
                    level: "All Levels",
                    duration: "10 Weeks • 2.5 Months",
                    price: "₹14,999",
                    tags: ["LeetCode 300+", "HLD/LLD", "Distributed Systems"],
                    seats: 6
                }
            ];

            const filteredCourses = selectedTrack === 'all' 
                ? courses 
                : courses.filter(c => c.id.toString() === selectedTrack);

            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
                            Active Cohorts: <strong style={{ color: '#fff' }}>{filteredCourses.length} Tracks Available</strong>
                        </div>

                        <select 
                            value={selectedTrack} 
                            onChange={(e) => setSelectedTrack(e.target.value)}
                            style={{ background: '#101923', border: '1px solid var(--border)', color: '#fff', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontFamily: 'inherit' }}
                        >
                            <option value="all">All Learning Tracks</option>
                            <option value="1">Java Full Stack</option>
                            <option value="2">Data Science & AI</option>
                            <option value="3">DSA & System Design</option>
                        </select>
                    </div>

                    {filteredCourses.map(course => (
                        <div key={course.id} className="react-course-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                <span style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid var(--primary-light)', color: '#93C5FD', padding: '0.15rem 0.55rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '800' }}>
                                    ● BATCH ADMISSIONS OPEN
                                </span>
                                <span style={{ color: '#F59E0B', fontSize: '0.8rem', fontWeight: '700' }}>
                                    🔥 {course.seats} Seats Left
                                </span>
                            </div>

                            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', margin: '0.35rem 0 0.2rem' }}>
                                {course.title}
                            </h3>
                            
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', marginBottom: '0.85rem' }}>
                                {course.duration} • {course.level}
                            </p>

                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {course.tags.map((t, idx) => (
                                    <span key={idx} style={{ background: '#101923', border: '1px solid var(--border)', color: 'var(--cyan-bright)', fontSize: '0.73rem', padding: '0.15rem 0.5rem', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                        {t}
                                    </span>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tuition Fee</span>
                                    <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{course.price}</strong>
                                </div>

                                <a href={`enroll?course_id=${course.id}`} className="btn-action">
                                    Instant Enrollment →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // Render React 18 Component into DOM
        const rootNode = document.getElementById('react-live-root');
        if (rootNode) {
            const root = ReactDOM.createRoot(rootNode);
            root.render(<LiveReactCohortApp />);
        }
    </script>

    <!-- SPRING BOOT REST SIMULATION SCRIPT -->
    <script>
        const endpointsData = {
            'courses': {
                status: 'HTTP 200 OK (9ms)',
                json: [
                    {
                        "id": 1,
                        "title": "Java Full Stack Masterclass",
                        "slug": "java-full-stack-roadmap",
                        "price": 19999,
                        "status": "published",
                        "architecture": "Spring Boot 3 + React 18 SPA",
                        "database": "MySQL 8.0 RDS",
                        "modulesCount": 16
                    },
                    {
                        "id": 2,
                        "title": "Data Science & Generative AI",
                        "price": 24999,
                        "status": "published",
                        "architecture": "Python FastAPI + PyTorch",
                        "modulesCount": 12
                    }
                ]
            },
            'roadmap': {
                status: 'HTTP 200 OK (14ms)',
                json: {
                    "program": "Java Full Stack Development",
                    "totalWeeks": 16,
                    "totalMonths": 4,
                    "months": [
                        { "month": 1, "title": "Core Java 21 & OOP Foundations", "weeks": [1, 2, 3, 4] },
                        { "month": 2, "title": "Database Management & MySQL 8.0", "weeks": [5, 6, 7, 8] },
                        { "month": 3, "title": "Modern React 18 & Spring Boot 3 REST", "weeks": [9, 10, 11, 12] },
                        { "month": 4, "title": "Spring Security JWT & AWS Cloud Capstone", "weeks": [13, 14, 15, 16] }
                    ]
                }
            },
            'finance': {
                status: 'HTTP 200 OK (12ms) [ROLE_ADMIN]',
                json: {
                    "totalPlatformRevenue": 485000,
                    "paidEnrollmentsCount": 24,
                    "averageOrderValue": 20208,
                    "activePromotionalCoupons": [
                        { "code": "WORKSHOP2026", "discountType": "fixed", "discountValue": 5000, "isActive": true },
                        { "code": "NICKY", "discountType": "fixed", "discountValue": 19799, "isActive": true }
                    ]
                }
            },
            'otp': {
                status: 'HTTP 200 OK (21ms)',
                json: {
                    "success": true,
                    "verification_id": "VER_9f82a1b4c3e5d7f8",
                    "enrollment_session_id": "ESESS_1a2b3c4d5e6f7a8b",
                    "email": "student@educationalgorithm.com",
                    "message": "Verification code sent to email inbox."
                }
            }
        };

        function simulateEndpoint(key) {
            document.querySelectorAll('.endpoint-btn').forEach(b => b.classList.remove('active'));
            if (event && event.target) event.target.classList.add('active');

            const data = endpointsData[key] || endpointsData['courses'];
            document.getElementById('responseStatus').textContent = data.status;
            document.getElementById('jsonConsoleOutput').textContent = JSON.stringify(data.json, null, 2);
        }

        // Initial trigger
        simulateEndpoint('courses');
    </script>

</body>
</html>
