'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Flame, 
  Layers, 
  Info 
} from 'lucide-react';

interface VulnerabilityItem {
  id: string;
  title: string;
  severity: 'P0' | 'P1' | 'P2';
  category: 'Admin Access Control' | 'Payment & Enrollment' | 'Remote Code Execution' | 'Authentication & OTP' | 'AI & Resource Quotas' | 'Data Privacy & Exposure';
  file: string;
  endpoints: string[];
  summary: string;
  rootCause: string;
  impact: string;
  remediation: string;
  badSnippet?: string;
  fixSnippet?: string;
}

const AUDIT_DATA: VulnerabilityItem[] = [
  {
    id: 'VULN-001',
    title: 'Admin Faculty Management Account Takeover & Deletion',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/instructors/route.ts',
    endpoints: ['GET /api/admin/instructors', 'POST /api/admin/instructors', 'PUT /api/admin/instructors', 'DELETE /api/admin/instructors'],
    summary: 'All HTTP methods on this route are completely open without any session authentication or admin role verification.',
    rootCause: 'The route handler lacks session extraction (getSessionFromRequest) and does not verify if session.role === "admin".',
    impact: 'Anyone can call PUT with an instructor ID to reset their password and take over the account, delete all faculty members, or view instructor personal phone numbers.',
    remediation: 'Wrap GET, POST, PUT, DELETE, and PATCH with strict admin role verification before executing database queries.',
    badSnippet: `export async function PUT(req: Request) {
  const body = await req.json();
  const { rawId, password, name } = body;
  // Updates instructor password in DB with NO session check!
}`,
    fixSnippet: `export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
  }
  // Proceed with authorized update
}`
  },
  {
    id: 'VULN-002',
    title: 'Unauthenticated Forged Certificate Minting',
    severity: 'P0',
    category: 'Payment & Enrollment',
    file: 'apps/frontend/src/app/api/certificates/generate/route.ts',
    endpoints: ['POST /api/certificates/generate'],
    summary: 'Public endpoint creates genuine cryptographically signed certificates for any arbitrary student and course name.',
    rootCause: 'Accepts studentId, studentName, courseId, and courseName directly from the request body without checking course enrollment or 100% video completion.',
    impact: 'Undermines the credibility of all platform certificates. Anyone can generate official certificates without paying or taking classes.',
    remediation: 'Enforce authenticated student session, verify active paid enrollment in MySQL, and confirm 100% lesson completions before issuing certificate hashes.',
    badSnippet: `export async function POST(request: Request) {
  const { studentId, studentName, courseId, courseName } = await request.json();
  const rawData = \`\${studentId}:\${courseId}:\${certificateId}:\${issueDate}:EA_SECRET_KEY_2026\`;
  const hashDigest = crypto.createHash('sha256').update(rawData).digest('hex');
  return NextResponse.json({ success: true, certificate: { hash: hashDigest, ... } });
}`,
    fixSnippet: `export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  // Verify enrollment & 100% completion in MySQL before generating hash
}`
  },
  {
    id: 'VULN-003',
    title: 'Admin Financial Data Exposure & Rogue Coupon Creation',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/finance/route.ts',
    endpoints: ['GET /api/admin/finance', 'POST /api/admin/finance', 'PATCH /api/admin/finance'],
    summary: 'Exposes financial revenues and allows unauthenticated creation of 100% discount coupons.',
    rootCause: 'No getSessionFromRequest check on GET, POST, or PATCH.',
    impact: 'Confidential platform revenue, GST breakdown, and transaction logs are publicly visible. Malicious actors can generate 100% discount coupons and get free course access.',
    remediation: 'Enforce admin-only authentication guard on GET, POST, and PATCH.',
    badSnippet: `export async function POST(req: Request) {
  const { code, type, value, maxUses } = await req.json();
  // Inserts coupon into MySQL with zero authentication!
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-004',
    title: 'Admin Assignment Grading & Submission Data Leak',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/assignments/route.ts',
    endpoints: ['GET /api/admin/assignments', 'POST /api/admin/assignments'],
    summary: 'Student assignment submissions are publicly readable, and grades can be changed by anyone.',
    rootCause: 'Missing session authentication and role validation.',
    impact: 'Student source code and assignments are leaked. Anyone can assign themselves 100% marks or change other students\' feedback.',
    remediation: 'Restrict GET and POST to verified admin and instructor roles.',
    badSnippet: `export async function POST(req: Request) {
  const { rawId, marks, feedback } = await req.json();
  await execute('UPDATE assignment_submissions SET marks = ? WHERE id = ?', [marks, rawId]);
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-005',
    title: 'Admin Live Classes Schedule Manipulation & Phishing Risk',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/live-classes/route.ts',
    endpoints: ['GET /api/admin/live-classes', 'POST /api/admin/live-classes', 'DELETE /api/admin/live-classes'],
    summary: 'Unauthenticated users can delete real live class schedules or inject fake meetings.',
    rootCause: 'No session verification on live class management mutations.',
    impact: 'Disruption of live lectures, deletion of class schedules, and injection of malicious external links into student dashboards.',
    remediation: 'Require admin or instructor authorization on POST and DELETE.',
    badSnippet: `export async function POST(req: Request) {
  const { title, meetLink, scheduledAt } = await req.json();
  // Inserts live meeting without verifying admin identity
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-006',
    title: 'Admin Webinars Attendee PII Leak & Open Management',
    severity: 'P0',
    category: 'Data Privacy & Exposure',
    file: 'apps/frontend/src/app/api/admin/webinars/route.ts',
    endpoints: ['GET /api/admin/webinars', 'POST /api/admin/webinars', 'PUT /api/admin/webinars', 'DELETE /api/admin/webinars'],
    summary: 'Exposes student lead personal information (names, emails, phone numbers) and allows open webinar manipulation.',
    rootCause: 'No admin session validation on GET, POST, PUT, or DELETE.',
    impact: 'Direct breach of attendee data privacy (phone numbers and emails). Allows unauthenticated deletion and editing of webinars.',
    remediation: 'Add admin session checks to protect attendee lead details and webinar modification routes.',
    badSnippet: `export async function GET() {
  const attendees = await query('SELECT name, email, phone FROM crm_leads WHERE source = "webinar_landing"');
  return NextResponse.json({ success: true, attendees });
}`,
    fixSnippet: `export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-007',
    title: 'Admin Support Ticket Spoofing & Communication Tampering',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/support/route.ts',
    endpoints: ['GET /api/admin/support', 'PATCH /api/admin/support'],
    summary: 'Anyone can read student complaints and reply masquerading as system administrators.',
    rootCause: 'Lacks session authentication on support messages.',
    impact: 'Confidential student inquiries are exposed, and attackers can send unauthorized communications to users as the support team.',
    remediation: 'Guard support routes with admin authorization.',
    badSnippet: `export async function PATCH(req: Request) {
  const { rawId, status, adminReply } = await req.json();
  await execute('UPDATE support_messages SET admin_reply = ? WHERE id = ?', [adminReply, rawId]);
}`,
    fixSnippet: `export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-008',
    title: 'Admin Global Notifications Broadcast Spoofing',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/notifications/route.ts',
    endpoints: ['POST /api/admin/notifications'],
    summary: 'Public endpoint allows broadcasting system-wide announcements to all students.',
    rootCause: 'No session verification on notification insertion.',
    impact: 'Spam, defacement, or phishing announcements can be broadcast across all student dashboards.',
    remediation: 'Require admin authentication before inserting into notifications table.',
    badSnippet: `export async function POST(req: Request) {
  const { title, message } = await req.json();
  await execute('INSERT INTO notifications (title, message) VALUES (?, ?)', [title, message]);
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-009',
    title: 'Admin Scholarships PII Exposure & Unapproved Granting',
    severity: 'P0',
    category: 'Payment & Enrollment',
    file: 'apps/frontend/src/app/api/admin/scholarships/route.ts',
    endpoints: ['GET /api/admin/scholarships', 'PATCH /api/admin/scholarships'],
    summary: 'Exposes scholarship applicant phone numbers and allows setting scholarship status to APPROVED without admin verification.',
    rootCause: 'Missing session check on GET and PATCH.',
    impact: 'PII leakage and unauthorized price discounts granted to unapproved accounts.',
    remediation: 'Enforce admin role checks on all scholarship routes.',
    badSnippet: `export async function PATCH(req: Request) {
  const { rawId, status } = await req.json();
  await execute('UPDATE scholarship_reservations SET scholarship_status = ? WHERE id = ?', [status, rawId]);
}`,
    fixSnippet: `export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-010',
    title: 'Database System Telemetry & Schema Discovery',
    severity: 'P0',
    category: 'Data Privacy & Exposure',
    file: 'apps/frontend/src/app/api/admin/system/route.ts',
    endpoints: ['GET /api/admin/system'],
    summary: 'Exposes database structure, table sizes, row counts, and admin audit logs to the public.',
    rootCause: 'Direct query execution against information_schema without authentication.',
    impact: 'Reconnaissance advantage for attackers discovering internal table structures and admin IPs.',
    remediation: 'Protect with admin role verification.',
    badSnippet: `export async function GET() {
  const tables = await query('SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = "education_local"');
  return NextResponse.json({ success: true, tables });
}`,
    fixSnippet: `export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-011',
    title: 'Batch Course Modules Injection',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/admin/courses/[id]/batch-modules/route.ts',
    endpoints: ['POST /api/admin/courses/[id]/batch-modules'],
    summary: 'Allows unauthenticated insertion of curriculum modules into any course.',
    rootCause: 'No session verification on batch module insertion.',
    impact: 'Corrupts curriculum data and inserts unauthorized content into published courses.',
    remediation: 'Require admin authentication before inserting modules.',
    badSnippet: `export async function POST(request: NextRequest, { params }) {
  const { modules } = await request.json();
  // Inserts into modules table without authentication
}`,
    fixSnippet: `export async function POST(request: NextRequest, { params }) {
  const session = await getSessionFromRequest(request);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-012',
    title: 'Free Paid Enrollment Bypass Route',
    severity: 'P0',
    category: 'Payment & Enrollment',
    file: 'apps/frontend/src/app/api/enroll/route.ts',
    endpoints: ['POST /api/enroll'],
    summary: 'Directly provisions active paid enrollments without Razorpay payment signature validation.',
    rootCause: 'Legacy endpoint marks enrollments as paid immediately upon receiving a student email.',
    impact: 'Users can enroll into ₹18,000+ courses for free by hitting this endpoint.',
    remediation: 'Lock down or delete legacy route; require cryptographic payment verification (/api/enrollment/payment/verify).',
    badSnippet: `await execute(
  'INSERT INTO enrollments (student_id, course_id, payment_status, status) VALUES (?, ?, "paid", "active")',
  [studentId, courseId]
);`,
    fixSnippet: `// Require HMAC-SHA256 signature verification via Razorpay before granting paid status
const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(\`\${orderId}|\${paymentId}\`).digest('hex');
if (expectedSign !== signature) return NextResponse.json({ error: 'Invalid payment' }, { status: 400 });`
  },
  {
    id: 'VULN-013',
    title: 'Project Targets Schedule Manipulation',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/projects/targets/route.ts',
    endpoints: ['POST /api/projects/targets', 'PUT /api/projects/targets', 'DELETE /api/projects/targets'],
    summary: 'Unauthenticated users can add, modify, or delete 16-week cohort project specifications.',
    rootCause: 'Missing session checks in POST, PUT, and DELETE methods.',
    impact: 'Curriculum targets can be wiped or modified, disrupting student learning paths.',
    remediation: 'Require admin authorization for creating, editing, or deleting cohort targets.',
    badSnippet: `export async function DELETE(req: NextRequest) {
  const idParam = url.searchParams.get('id');
  await execute('DELETE FROM cohort_weekly_targets WHERE id = ?', [idParam]);
}`,
    fixSnippet: `export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-014',
    title: 'Project Submission Review & Student Self-Grading',
    severity: 'P0',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/projects/review/route.ts',
    endpoints: ['GET /api/projects/review', 'POST /api/projects/review'],
    summary: 'GET leaks all student project reviews; POST allows students to grade themselves 100/100.',
    rootCause: 'POST extracts session but does not check if session.role is instructor or admin.',
    impact: 'Students can mark their own project submissions as APPROVED and award themselves 500 XP.',
    remediation: 'Restrict GET and POST to instructor and admin roles.',
    badSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  // Missing check: if (session.role !== 'admin' && session.role !== 'instructor')
  await execute('UPDATE student_project_submissions SET status = ?, score = ? WHERE id = ?', [status, score, id]);
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || (session.role !== 'admin' && session.role !== 'instructor')) {
    return NextResponse.json({ success: false, error: 'Instructor/Admin only' }, { status: 403 });
  }
}`
  },
  {
    id: 'VULN-015',
    title: 'Dev Mode Bypass on Bunny.net CDN Video Deletions',
    severity: 'P1',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/videos/[id]/route.ts',
    endpoints: ['DELETE /api/videos/[id]'],
    summary: 'Checks if NODE_ENV !== "production" and skips authentication checks, allowing unauthenticated video purging.',
    rootCause: 'Flawed conditional logic: if (!session?.role && !isDev)',
    impact: 'If NODE_ENV is unset or in staging, anyone can delete videos from Bunny.net CDN storage.',
    remediation: 'Remove the dev mode bypass and strictly enforce admin authentication in all environments.',
    badSnippet: `const isDev = process.env.NODE_ENV !== 'production';
if (!session?.role && !isDev) {
  return NextResponse.json({ message: 'Admin required' }, { status: 403 });
}`,
    fixSnippet: `if (!session || session.role !== 'admin') {
  return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
}`
  },
  {
    id: 'VULN-016',
    title: 'Dev Mode Bypass on Course Deletions & Price Updates',
    severity: 'P1',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/courses/[id]/route.ts',
    endpoints: ['PATCH /api/courses/[id]', 'DELETE /api/courses/[id]'],
    summary: 'Course prices can be updated or deleted without credentials when not in strict production mode.',
    rootCause: 'Insecure isDev exemption in route authorization guard.',
    impact: 'Courses can be deleted or prices changed to ₹0 by unauthenticated callers in development/staging.',
    remediation: 'Enforce strict admin verification unconditionally.',
    badSnippet: `const isDev = process.env.NODE_ENV !== 'production';
if (!session?.role && !isDev) {
  return NextResponse.json({ message: 'Admin required' }, { status: 403 });
}`,
    fixSnippet: `if (!session || session.role !== 'admin') {
  return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
}`
  },
  {
    id: 'VULN-017',
    title: 'Dev Mode Bypass on Course Module Creation',
    severity: 'P1',
    category: 'Admin Access Control',
    file: 'apps/frontend/src/app/api/courses/[id]/modules/route.ts',
    endpoints: ['POST /api/courses/[id]/modules'],
    summary: 'Modules can be injected into any course without authentication when isDev is active.',
    rootCause: 'Presence of isDev bypass logic in module creation endpoint.',
    impact: 'Arbitrary module injection into existing course structures.',
    remediation: 'Require admin session checks unconditionally.',
    badSnippet: `if (!session?.role && !isDev) return NextResponse.json({ message: 'Admin required' });`,
    fixSnippet: `if (!session || session.role !== 'admin') return NextResponse.json({ message: 'Admin required' }, { status: 403 });`
  },
  {
    id: 'VULN-018',
    title: 'Public AI Resume Engine Quota Draining',
    severity: 'P1',
    category: 'AI & Resource Quotas',
    file: 'apps/frontend/src/app/api/ai/resume/route.ts',
    endpoints: ['POST /api/ai/resume'],
    summary: '9 heavy generative AI features (ATS audits, cover letter generation, full resume prompt builder) lack session checks.',
    rootCause: 'No user session extraction or rate limiting on expensive Gemini API calls.',
    impact: 'Bots can exhaust your Google Gemini API token quota and cause financial charges.',
    remediation: 'Require authenticated student login and apply a per-user rate limit (e.g. 10 resume AI requests/day).',
    badSnippet: `export async function POST(req: NextRequest) {
  const body = await req.json();
  // Directly invokes Gemini API with high token limits
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
  // Check and decrement user daily AI quota
}`
  },
  {
    id: 'VULN-019',
    title: 'Unmetered AI Code Coach Access',
    severity: 'P1',
    category: 'AI & Resource Quotas',
    file: 'apps/frontend/src/app/api/ai/code-coach/route.ts',
    endpoints: ['POST /api/ai/code-coach'],
    summary: 'AI code hints and debugging endpoints are accessible without login or quota restrictions.',
    rootCause: 'Lacks user identification and per-student quota enforcement.',
    impact: 'API rate limits and Gemini quotas can be exhausted by external traffic.',
    remediation: 'Require authenticated student session and limit to 20 hints/hour.',
    badSnippet: `export async function POST(req: NextRequest) {
  const { action, code } = await req.json();
  const aiFeedback = await callGeminiWithRotation({ ... });
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
}`
  },
  {
    id: 'VULN-020',
    title: 'Unauthenticated Curriculum AI Syllabus Parsing',
    severity: 'P1',
    category: 'AI & Resource Quotas',
    file: 'apps/frontend/src/app/api/admin/courses/parse-syllabus/route.ts',
    endpoints: ['POST /api/admin/courses/parse-syllabus'],
    summary: 'Large PDF and text syllabus parsing with Gemini AI is publicly open without admin login.',
    rootCause: 'No session verification on curriculum parsing endpoint.',
    impact: 'Heavy PDF processing and high Gemini token consumption triggered by unauthenticated callers.',
    remediation: 'Require admin authentication.',
    badSnippet: `export async function POST(req: Request) {
  const { pdfBase64, text } = await req.json();
  // Sends up to 25k chars to Gemini
}`,
    fixSnippet: `export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
}`
  },
  {
    id: 'VULN-021',
    title: 'Mock Interview Booking Spoofing & Flooding',
    severity: 'P1',
    category: 'Data Privacy & Exposure',
    file: 'apps/frontend/src/app/api/mock-interviews/book/route.ts',
    endpoints: ['POST /api/mock-interviews/book'],
    summary: 'Accepts arbitrary studentEmail in request body without checking authentication.',
    rootCause: 'const studentEmail = session?.email || body.studentEmail || fallback;',
    impact: 'Interview slots can be flooded, and attackers can schedule interviews under other students\' identities.',
    remediation: 'Require active student session and bind email strictly to session.email.',
    badSnippet: `const studentEmail = (session?.email || body.studentEmail || 'student@education-algorithm.com');`,
    fixSnippet: `const session = await getSessionFromRequest(req);
if (!session) return NextResponse.json({ error: 'Login required' }, { status: 401 });
const studentEmail = session.email;`
  },
  {
    id: 'VULN-022',
    title: 'Admin & Instructor Login Plaintext Fallback',
    severity: 'P1',
    category: 'Authentication & OTP',
    file: 'apps/frontend/src/app/api/auth/admin-login/route.ts & instructor-login/route.ts',
    endpoints: ['POST /api/auth/admin-login', 'POST /api/auth/instructor-login'],
    summary: 'Both routes retain plaintext password fallback comparisons.',
    rootCause: 'if (!isValid && password === admin.password) isValid = true;',
    impact: 'Allows unhashed passwords to authenticate rather than strictly enforcing BCrypt verification.',
    remediation: 'Remove plaintext fallback and enforce strict bcrypt.compare().',
    badSnippet: `if (!isValid && password === admin.password) {
  isValid = true;
}`,
    fixSnippet: `const isValid = await bcrypt.compare(password, admin.password_hash || admin.password);
if (!isValid) return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 });`
  },
  {
    id: 'VULN-023',
    title: 'Insecure OTP Generation & Plaintext Storage',
    severity: 'P1',
    category: 'Authentication & OTP',
    file: 'apps/frontend/src/app/api/auth/forgot-password/route.ts',
    endpoints: ['POST /api/auth/forgot-password'],
    summary: 'OTPs generated via Math.random(), stored in plain text, and 404 response enables user enumeration.',
    rootCause: 'Uses non-cryptographic RNG and inserts raw OTP into password_resets.token.',
    impact: 'Predictable OTPs, database breach exposes all active OTPs, and user email enumeration.',
    remediation: 'Use crypto.randomInt(100000, 999999), store SHA-256 hash of OTP, and return generic 200 response.',
    badSnippet: `const otp = Math.floor(100000 + Math.random() * 900000).toString();
await execute('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, otp, expiresAt]);`,
    fixSnippet: `const otp = crypto.randomInt(100000, 999999).toString();
const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
await execute('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, hashedOtp, expiresAt]);`
  },
  {
    id: 'VULN-024',
    title: 'Interactive Code Arena PTY Host Process Execution',
    severity: 'P1',
    category: 'Remote Code Execution',
    file: 'apps/frontend/src/lib/sandbox/interactiveSessionManager.ts',
    endpoints: ['PTY / Code Arena Interactive Session'],
    summary: 'Interactive terminal sessions spawn javac, g++, and python processes directly on the host OS.',
    rootCause: 'Uses child_process.spawn directly on host rather than inside isolated Docker container.',
    impact: 'Untrusted user code executes directly on the server operating system.',
    remediation: 'Route interactive PTY sessions through isolated Docker sandbox containers with CPU/memory limits.',
    badSnippet: `child = spawn(cmd, args, {
  cwd: tempDir,
  env: { ...process.env, PATH: envPath }
});`,
    fixSnippet: `// Spawn inside Docker container:
child = spawn('docker', ['run', '-i', '--rm', '--memory=256m', '--cpus=0.5', 'ea-sandbox-runner', cmd, ...args]);`
  },
  {
    id: 'VULN-025',
    title: 'Public Job Scraper Trigger & Referral Data Leak',
    severity: 'P1',
    category: 'Data Privacy & Exposure',
    file: 'apps/frontend/src/app/api/jobs/sync/route.ts & referrals/route.ts',
    endpoints: ['POST /api/jobs/sync', 'GET /api/jobs/referrals', 'PATCH /api/jobs/referrals'],
    summary: 'Scraper can be triggered openly; candidate resumes and contact details are publicly exposed.',
    rootCause: 'Missing admin session validation.',
    impact: 'Resource exhaustion via scraper spam and student resume/PII exposure.',
    remediation: 'Protect both routes with admin session authorization.',
    badSnippet: `export async function GET() {
  const referrals = await query('SELECT * FROM lms_job_referrals');
  return NextResponse.json({ success: true, referrals });
}`,
    fixSnippet: `export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
}`
  },
  {
    id: 'VULN-026',
    title: 'Ghost Certificate Fallback on Course Progress',
    severity: 'P1',
    category: 'Payment & Enrollment',
    file: 'apps/frontend/src/app/api/student/certificates/route.ts',
    endpoints: ['GET /api/student/certificates'],
    summary: 'Falls back to courses LIMIT 1 if student has no enrollments, issuing certificates upon completing free lessons.',
    rootCause: 'Fallback query selects default course if enrollments array is empty.',
    impact: 'Non-enrolled users can obtain official verified certificates.',
    remediation: 'Remove the fallback and only issue certificates for courses with active paid enrollment status.',
    badSnippet: `if (coursesList.length === 0) {
  coursesList = await query('SELECT DISTINCT c.id AS course_id, c.title AS course_title FROM courses c LIMIT 1');
}`,
    fixSnippet: `if (coursesList.length === 0) {
  return NextResponse.json({ success: true, courses: [] }); // No enrollments = no certificates
}`
  },
  {
    id: 'VULN-027',
    title: 'Project Submission Email Spoofing',
    severity: 'P1',
    category: 'Data Privacy & Exposure',
    file: 'apps/frontend/src/app/api/projects/submit/route.ts',
    endpoints: ['POST /api/projects/submit'],
    summary: 'Trusts studentEmail in the request body instead of taking it securely from the JWT session.',
    rootCause: 'effectiveEmail = studentEmail || "student@education-algorithm.com";',
    impact: 'Students can submit projects and trigger evaluations under other students\' accounts.',
    remediation: 'Extract email and studentId directly from the verified JWT session.',
    badSnippet: `const { studentEmail, studentName } = body;
const effectiveEmail = studentEmail || 'student@education-algorithm.com';`,
    fixSnippet: `const session = await getSessionFromRequest(req);
if (!session) return NextResponse.json({ error: 'Auth required' }, { status: 401 });
const effectiveEmail = session.email;`
  },
  {
    id: 'VULN-028',
    title: 'Hardcoded Fallback JWT Secret in Production',
    severity: 'P1',
    category: 'Authentication & OTP',
    file: 'apps/frontend/src/lib/auth.ts',
    endpoints: ['JWT Signing & Verification'],
    summary: 'Falls back to ea_dev_secret_change_in_production_2026 if JWT_SECRET environment variable is missing.',
    rootCause: 'process.env.JWT_SECRET ?? "ea_dev_secret_change_in_production_2026"',
    impact: 'If the environment variable fails to load, attackers can forge valid JWT tokens for any admin or student.',
    remediation: 'Throw an error on startup if JWT_SECRET is not configured in production.',
    badSnippet: `const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'ea_dev_secret_change_in_production_2026'
);`,
    fixSnippet: `if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
}`
  },
  {
    id: 'VULN-029',
    title: 'CRM Lead Table Flooding via Public AI Chat',
    severity: 'P2',
    category: 'AI & Resource Quotas',
    file: 'apps/frontend/src/app/api/ai/public-chat/route.ts',
    endpoints: ['POST /api/ai/public-chat'],
    summary: 'Inserts leadData into crm_leads without CAPTCHA, verification, or IP rate limiting.',
    rootCause: 'Unrestricted database insert on public chatbot endpoint.',
    impact: 'Spam bots can flood the CRM leads table with millions of junk records.',
    remediation: 'Implement Cloudflare Turnstile CAPTCHA and IP-based rate limiting.',
    badSnippet: `if (leadData && leadData.email) {
  await execute('INSERT INTO crm_leads (name, email, phone) VALUES (?, ?, ?)', [name, email, phone]);
}`,
    fixSnippet: `// Validate rate limit and CAPTCHA token before creating CRM lead`
  },
  {
    id: 'VULN-030',
    title: 'Missing Password Reset Attempt Throttling',
    severity: 'P2',
    category: 'Authentication & OTP',
    file: 'apps/frontend/src/app/api/auth/forgot-password/route.ts',
    endpoints: ['POST /api/auth/forgot-password (reset-password)'],
    summary: 'No limit on failed OTP validation attempts before token is invalidated.',
    rootCause: 'Does not track failed attempts in password_resets table.',
    impact: 'Increases exposure to automated 6-digit OTP guessing attacks.',
    remediation: 'Lock out and delete reset token after 5 failed attempts.',
    badSnippet: `if (tokenRows.length === 0) {
  return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
}`,
    fixSnippet: `await execute('UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?', [cleanEmail]);
// Invalidate if attempts >= 5`
  }
];

export default function SecurityAuditPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('VULN-001');

  const categories = useMemo(() => {
    return ['ALL', ...Array.from(new Set(AUDIT_DATA.map(i => i.category)))];
  }, []);

  const filteredData = useMemo(() => {
    return AUDIT_DATA.filter(item => {
      const matchSeverity = selectedSeverity === 'ALL' || item.severity === selectedSeverity;
      const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.endpoints.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSeverity && matchCategory && matchSearch;
    });
  }, [selectedSeverity, selectedCategory, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: AUDIT_DATA.length,
      p0: AUDIT_DATA.filter(i => i.severity === 'P0').length,
      p1: AUDIT_DATA.filter(i => i.severity === 'P1').length,
      p2: AUDIT_DATA.filter(i => i.severity === 'P2').length,
    };
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-rose-500 selection:text-white">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Education Algorithm Security Audit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono font-medium">
                  30 Discovered Issues
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Full-Stack Architecture & API Vulnerability Breakdown (Zero-Execution Local Inspection)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link 
              href="/dashboard"
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Back to LMS
            </Link>
            <Link 
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-sm"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">{stats.total}</div>
              <div className="text-xs text-slate-400 font-medium">Total Issues Identified</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-900/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-900/40 flex items-center justify-center text-rose-400">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-400">{stats.p0}</div>
              <div className="text-xs text-rose-300 font-medium">Critical (P0) Breaches</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-900/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-900/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-amber-400">{stats.p1}</div>
              <div className="text-xs text-amber-300 font-medium">High Severity (P1)</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-900/40 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-900/40 flex items-center justify-center text-blue-400">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-blue-400">{stats.p2}</div>
              <div className="text-xs text-blue-300 font-medium">Medium / Hygiene (P2)</div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by vulnerability, file or endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
            />
          </div>

          {/* Severity Badges */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-400 mr-1 font-medium flex items-center gap-1">
              <Filter className="w-3 h-3" /> Severity:
            </span>
            {(['ALL', 'P0', 'P1', 'P2'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedSeverity === sev 
                    ? sev === 'P0'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : sev === 'P1'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : sev === 'P2'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-200 text-slate-900 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-750'
                }`}
              >
                {sev === 'ALL' ? 'All Severities' : `${sev} (${AUDIT_DATA.filter(i => i.severity === sev).length})`}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full md:w-auto bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories (6)' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-slate-400 font-medium">
            Showing <span className="text-slate-200 font-bold">{filteredData.length}</span> of {AUDIT_DATA.length} vulnerabilities
          </div>
          <div className="text-xs text-slate-500">
            Click any item to inspect the root cause, impact, and defensive code fix.
          </div>
        </div>

        {/* Vulnerability Items Accordion */}
        <div className="space-y-3">
          {filteredData.map((item) => {
            const isExpanded = expandedId === item.id;
            const isP0 = item.severity === 'P0';
            const isP1 = item.severity === 'P1';

            return (
              <div 
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? isP0 
                      ? 'bg-slate-900/90 border-rose-500/50 shadow-lg shadow-rose-950/20' 
                      : isP1
                      ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/90 border-blue-500/50 shadow-lg shadow-blue-950/20'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-black tracking-wider ${
                        isP0 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : isP1
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {item.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{item.id}</span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {item.file}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-800/80 space-y-5">
                    {/* Endpoints */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Affected API Routes
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.endpoints.map((ep) => (
                          <span key={ep} className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-emerald-400 font-medium">
                            {ep}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Summary & Impact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> What Is Happening (Root Cause)
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                        <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-900 p-2 rounded border border-slate-800">
                          {item.rootCause}
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                        <div className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" /> Security & Business Impact
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.impact}</p>
                        <div className="mt-3 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fix Target: {item.remediation}
                        </div>
                      </div>
                    </div>

                    {/* Code Diff Demonstration */}
                    {item.badSnippet && item.fixSnippet && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                        {/* Flawed Code */}
                        <div className="rounded-xl border border-rose-950 bg-slate-950 p-3.5">
                          <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-2 font-mono">
                            <XCircle className="w-3.5 h-3.5" /> Vulnerable Code Pattern
                          </div>
                          <pre className="text-xs font-mono text-rose-300/90 overflow-x-auto p-2.5 rounded bg-rose-950/20 border border-rose-900/30 whitespace-pre">
                            {item.badSnippet}
                          </pre>
                        </div>

                        {/* Remediated Code */}
                        <div className="rounded-xl border border-emerald-950 bg-slate-950 p-3.5">
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-2 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Recommended Defensive Fix
                          </div>
                          <pre className="text-xs font-mono text-emerald-300/90 overflow-x-auto p-2.5 rounded bg-emerald-950/20 border border-emerald-900/30 whitespace-pre">
                            {item.fixSnippet}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
