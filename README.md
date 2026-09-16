# ?? Education Algorithm — Next-Gen LMS & Career Acceleration Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0+-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=flat&logo=mysql)](https://mysql.com/)

> **Education Algorithm** is an end-to-end full-stack Learning Management System (LMS), interactive Code Arena, Career Portal, and Mobile Platform built for students, instructors, and educational institutions.

---

## ?? Key Features

### ????? Student Learning Experience
- **Interactive Code Arena**: Multi-language real-time code execution sandbox (JavaScript, Python, C++, Java) with live test suites.
- **Curated Learning Roadmaps**: Full Stack Java, Data Science, AI/GenAI, and Aptitude masterclasses.
- **Aptitude & Speed Duel Labs**: Interactive visualizers (Clock Angle, Relative Speed, Venn Bubbles, Work Tank Flow) with instant AI explanations.
- **Live Webinars & Doubts**: Real-time doubt resolution and scheduled live sessions.
- **Gamified Achievements**: Streaks, badges, certificates, and leaderboard rankings.

### ?? Jobs & Career Hub
- **Multi-Source Job Aggregator**: Automated scrapers across LinkedIn, Instahyre, Naukri, Wellfound, Himalayas, Remotive, and Arbeitnow.
- **AI Skill Match Simulator**: Matches student resumes with live industry job requirements.
- **Company Mock Interviews**: Practice tracks for tier-1 product and service companies.

### ??? Admin & Instructor Consoles
- **Live Content Management**: Manage courses, modules, assignments, and quizzes.
- **Student Analytics**: Track progress, quiz scores, submissions, and payments.
- **Role-Based Access Control**: Strict multi-guard authentication for students, instructors, and admins.

### ?? Android Mobile App
- Native Android app powered by Capacitor with responsive mobile navigation and offline cache support.

---

## ??? Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend & APIs** | Next.js Server Components, API Route Handlers |
| **Database** | MySQL with PDO connection pooling and indexed migrations |
| **Mobile** | Capacitor Android runtime container |
| **AI Integration** | Google Gemini Flash LLM rotation with failover |

---

## ?? Getting Started (Development)

### 1. Clone the repository
`ash
git clone https://github.com/educationalgorithm770-oss/education-algirthm.git
cd education-algirthm
`

### 2. Install dependencies
`ash
npm install
`

### 3. Environment Configuration
Copy the example environment file and configure your local database:
`ash
cp .env.example .env
`

### 4. Run Development Server
`ash
npm run dev
`
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ?? Security & Privacy
- Zero-trust session fingerprinting
- CSRF protection across all forms and API endpoints
- Dynamic rate-limiting and brute-force protection
- Strictly isolated .env credentials

---

© 2026 **Education Algorithm**. All rights reserved.
