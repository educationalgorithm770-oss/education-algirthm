import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

const SIXTEEN_PROJECTS_CATALOG = [
  {
    weekNumber: 1,
    id: 'proj_w1',
    title: 'High-Frequency Banking Ledger CLI',
    phase: 'Phase 1: Core Java & Concurrency',
    difficulty: 'Foundations',
    techStack: ['Java 21', 'Streams API', 'Custom Checked Exceptions', 'Atomic File I/O'],
    description: 'Build a robust multi-account banking ledger with transaction audit trails, custom exception hierarchy, and atomic file-based persistence.',
    architectureNodes: ['CLI Controller', 'Account Service', 'Transaction Auditor', 'File Storage Engine'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['OOP Encapsulation & Records', 'Exception Handling', 'Immutable Audit Logs', 'Unit Tests (>80%)']
  },
  {
    weekNumber: 2,
    id: 'proj_w2',
    title: 'In-Memory Cache & Key-Value Store',
    phase: 'Phase 1: Core Java & Concurrency',
    difficulty: 'Foundations',
    techStack: ['Java Collections Framework', 'Generics', 'LRU Eviction Algorithm', 'Custom Hash Nodes'],
    description: 'Engineer an O(1) in-memory key-value cache from scratch with custom generic doubly-linked hash nodes and TTL expiration sweeps.',
    architectureNodes: ['Cache Interface', 'LRU Eviction Doubly-Linked List', 'Concurrent Hash Node Index', 'TTL Janitor Thread'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['O(1) Get/Put Operations', 'Generics Type Safety', 'LRU Eviction Accuracy', 'Memory Leak Prevention']
  },
  {
    weekNumber: 3,
    id: 'proj_w3',
    title: 'Multi-Threaded Flight Reservation Engine',
    phase: 'Phase 1: Core Java & Concurrency',
    difficulty: 'Intermediate',
    techStack: ['Java 21 Virtual Threads (Project Loom)', 'ReentrantLocks', 'Semaphores', 'Deadlock Elimination'],
    description: 'Design a concurrent ticket booking system managing 10,000 simultaneous seat reservation requests without double-booking or thread starvation.',
    architectureNodes: ['Virtual Thread Executor', 'Flight Seat Lock Matrix', 'Reservation Queue', 'Receipt Dispatcher'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Zero Double-Bookings under Concurrency', 'Virtual Thread Utilization', 'ReentrantLock Cleanup', 'Throughput Metrics']
  },
  {
    weekNumber: 4,
    id: 'proj_w4',
    title: 'Custom HTTP 1.1 Web Server from Scratch',
    phase: 'Phase 1: Core Java & Concurrency',
    difficulty: 'Intermediate',
    techStack: ['Java Sockets (java.net)', 'Java NIO Channels', 'HTTP Protocol Parser', 'Thread Pooling'],
    description: 'Build a low-level TCP/HTTP server handling GET/POST requests, HTTP header parsing, static asset streaming, and Keep-Alive connection pools.',
    architectureNodes: ['ServerSocket Ingestion', 'Byte Stream Request Parser', 'Router & Static Dispatcher', 'MIME Formatter'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['RFC 7230 HTTP Compliance', 'Header Parsing', 'Static Asset MIME Resolution', 'Concurrent Client Handling']
  },
  {
    weekNumber: 5,
    id: 'proj_w5',
    title: 'Student Academic ERP & Attendance Portal',
    phase: 'Phase 2: DB, JPA & Spring Boot',
    difficulty: 'Intermediate',
    techStack: ['Java', 'JDBC', 'HikariCP Connection Pool', 'MySQL 8', 'ACID Transactions'],
    description: 'Develop a database-backed ERP managing student enrollments, course prerequisites, and attendance logs with parameterized SQL security.',
    architectureNodes: ['HikariCP Pool', 'DAO / Repository Layer', 'Transaction Manager', 'MySQL ACID Engine'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['SQL Injection Prevention (PreparedStatements)', 'ACID Rollback on Failure', 'Connection Pool Tuning', 'Clean DAO Pattern']
  },
  {
    weekNumber: 6,
    id: 'proj_w6',
    title: 'E-Commerce Catalog & Inventory Engine',
    phase: 'Phase 2: DB, JPA & Spring Boot',
    difficulty: 'Intermediate',
    techStack: ['Hibernate 6', 'Jakarta Persistence (JPA)', 'Criteria API', 'Optimistic Locking (@Version)'],
    description: 'Implement complex entity relationships (OneToMany, ManyToMany) with 2nd-level caching, pagination, and N+1 query optimization.',
    architectureNodes: ['EntityManager Factory', 'JPA Entity Graph', 'Criteria Search Filter', 'Hibernate 2nd Level Cache'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Zero N+1 Query Warnings', 'Optimistic Lock Stock Guard', 'JPA Fetch Join Optimization', 'Clean Entity Lifecycle']
  },
  {
    weekNumber: 7,
    id: 'proj_w7',
    title: 'Enterprise Identity & Auth Microservice',
    phase: 'Phase 2: DB, JPA & Spring Boot',
    difficulty: 'Advanced',
    techStack: ['Spring Boot 3.3', 'Spring Security 6', 'JWT Stateless Auth', 'Bcrypt', 'Redis Token Blacklist'],
    description: 'Build a production authentication microservice with access/refresh token rotation, RBAC role claims, and Redis distributed token revocation.',
    architectureNodes: ['SecurityFilterChain', 'JwtAuthenticationFilter', 'UserDetailsService', 'Redis Revocation Cache'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Stateless JWT Filter Chain', 'Refresh Token Rotation', 'Role-Based Endpoint Guards', 'Bcrypt Hash Salting']
  },
  {
    weekNumber: 8,
    id: 'proj_w8',
    title: 'Multi-Vendor Food Ordering REST API',
    phase: 'Phase 2: DB, JPA & Spring Boot',
    difficulty: 'Advanced',
    techStack: ['Spring Boot 3', 'Spring Data JPA', 'PostgreSQL', 'MapStruct DTOs', 'OpenAPI 3 / Swagger'],
    description: 'Architect a clean multi-vendor food delivery REST platform with DTO mapping, global exception handlers, and interactive Swagger API documentation.',
    architectureNodes: ['REST Controller', 'MapStruct DTO Layer', 'Business Service Engine', 'OpenAPI Documentation'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Controller-Service-Repository Separation', 'Input Validation (@Valid)', 'Global @RestControllerAdvice', 'Swagger UI Coverage']
  },
  {
    weekNumber: 9,
    id: 'proj_w9',
    title: 'Full-Stack Live Stock Trading Dashboard',
    phase: 'Phase 3: Full Stack & Cloud',
    difficulty: 'Advanced',
    techStack: ['Next.js 15', 'Tailwind CSS', 'Spring Boot WebSockets', 'STOMP Protocol', 'Chart.js'],
    description: 'Connect a modern React/Next.js frontend to a reactive Spring Boot backend streaming live stock ticker prices and bid/ask orders via WebSockets.',
    architectureNodes: ['Next.js Frontend Client', 'WebSocket STOMP Broker', 'Real-Time Price Simulator', 'Chart Streaming Hook'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Full-Duplex WebSocket Streaming', 'Clean Next.js UI State', 'Reconnection Resiliency', 'STOMP Channel Routing']
  },
  {
    weekNumber: 10,
    id: 'proj_w10',
    title: 'Automated Payment & Invoice Gateway',
    phase: 'Phase 3: Full Stack & Cloud',
    difficulty: 'Advanced',
    techStack: ['Spring Boot 3', 'Razorpay Java SDK', 'HMAC-SHA256 Signatures', 'iText 7 PDF Generator'],
    description: 'Build a zero-trust payment processing gateway with webhook verification, distributed idempotency keys, and automated PDF tax invoice dispatch.',
    architectureNodes: ['Razorpay Order Gateway', 'HMAC Signature Validator', 'Idempotency Lock Manager', 'PDF Invoice Generator'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['HMAC-SHA256 Cryptographic Verification', 'Duplicate Webhook Idempotency Guard', 'Automated PDF Receipt Render', 'Nodemailer Dispatch']
  },
  {
    weekNumber: 11,
    id: 'proj_w11',
    title: 'Real-Time Ride-Hailing Dispatch Engine',
    phase: 'Phase 3: Full Stack & Cloud',
    difficulty: 'Enterprise Scale',
    techStack: ['Spring Boot 3', 'Redis Geospatial (GEOADD / GEORADIUS)', 'WebSockets', 'Haversine Math'],
    description: 'Implement a real-time driver dispatch algorithm indexing active driver GPS coordinates in Redis and broadcasting rides to the nearest 5 drivers.',
    architectureNodes: ['GPS Telemetry Ingestion', 'Redis Geospatial Index', 'Matching Algorithm Engine', 'Driver Dispatch Broadcaster'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Redis Geospatial Querying', 'Nearest Driver Radius Search', 'Driver State Transitions', 'Low-Latency Broadcast']
  },
  {
    weekNumber: 12,
    id: 'proj_w12',
    title: 'Event-Driven Telemetry & Notification Stream',
    phase: 'Phase 3: Full Stack & Cloud',
    difficulty: 'Enterprise Scale',
    techStack: ['Apache Kafka', 'Spring for Kafka', 'Consumer Groups', 'Dead Letter Queue (DLQ)'],
    description: 'Architect a high-throughput event processing pipeline handling 20,000 events/sec with partitioned topics, automatic consumer retries, and DLQ escalation.',
    architectureNodes: ['Kafka Producer Service', 'Partitioned Cluster Topics', 'Consumer Group Workers', 'Dead Letter Queue Handler'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Kafka Partition Key Strategy', 'Consumer Idempotence', 'Dead Letter Queue Recovery', 'Async Notification Delivery']
  },
  {
    weekNumber: 13,
    id: 'proj_w13',
    title: 'Distributed Cloud Microservices Suite',
    phase: 'Phase 4: Microservices & GenAI',
    difficulty: 'Enterprise Scale',
    techStack: ['Spring Cloud Gateway', 'Netflix Eureka Discovery', 'Resilience4j Circuit Breaker', 'Micrometer Tracing'],
    description: 'Assemble an enterprise microservice mesh featuring dynamic API routing, service discovery, rate limiting, and Circuit Breaker fallbacks.',
    architectureNodes: ['API Gateway Route Filter', 'Eureka Registry Center', 'Resilience4j Circuit Breaker', 'Distributed Microservice Mesh'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Eureka Service Registry Discovery', 'Circuit Breaker Fallback Execution', 'Rate Limiting Filter', 'Distributed Tracing']
  },
  {
    weekNumber: 14,
    id: 'proj_w14',
    title: 'Agentic AI Code Reviewer & RAG Assistant',
    phase: 'Phase 4: Microservices & GenAI',
    difficulty: 'Advanced AI',
    techStack: ['Spring AI / Google Gemini API', 'Vector Database (Qdrant / pgvector)', 'LangChain4j', 'AST Code Parser'],
    description: 'Build an autonomous AI engineering agent that ingests multi-file Git repositories, embeds code chunks, analyzes AST trees, and posts automated PR feedback.',
    architectureNodes: ['Git Repo Ingestion', 'AST Token Chunking Engine', 'Vector Embeddings DB', 'Gemini AI Review Agent'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Semantic Vector Search Accuracy', 'Contextual RAG Prompting', 'AST Bug Analysis', 'Structured JSON Output']
  },
  {
    weekNumber: 15,
    id: 'proj_w15',
    title: 'Containerized Microservices CI/CD Pipeline',
    phase: 'Phase 4: Microservices & GenAI',
    difficulty: 'DevOps & Cloud',
    techStack: ['Docker Multi-Stage Builds', 'Kubernetes Pods & Services', 'GitHub Actions', 'Helm Charts'],
    description: 'Containerize the full-stack microservices stack into ultra-lean distroless Docker images and deploy with rolling zero-downtime updates on Kubernetes.',
    architectureNodes: ['GitHub Actions CI Workflow', 'Docker Container Registry', 'Kubernetes Deployment Pods', 'Cluster Ingress & Secrets'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['Multi-Stage Dockerfile Optimization', 'K8s Deployment & Service Manifests', 'GitHub Actions Automated Testing', 'Health & Readiness Probes']
  },
  {
    weekNumber: 16,
    id: 'proj_w16',
    title: 'Enterprise Capstone: Multi-Tenant SaaS LMS',
    phase: 'Phase 4: Microservices & GenAI',
    difficulty: 'Production Capstone',
    techStack: ['Next.js 15', 'Java 21 Spring Cloud', 'Kafka', 'Redis', 'Docker K8s', 'Prometheus & Grafana'],
    description: 'Final Graduation Capstone: Build and deploy a complete commercial-grade EdTech SaaS platform with automated coding sandboxes, telemetry dashboards, and multi-tenancy.',
    architectureNodes: ['Multi-Tenant Frontend', 'Spring Cloud Core', 'Kafka Event Bus', 'Docker Execution Workers', 'Prometheus Telemetry'],
    githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
    rubric: ['End-to-End Architectural Integrity', 'Production Multi-Tenancy Isolation', 'Prometheus & Grafana Metrics', '100% Comprehensive Documentation']
  }
];

// Ensure DB table exists
async function ensureTargetTables() {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS cohort_weekly_targets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_name VARCHAR(100) NOT NULL DEFAULT 'Java & AI Cohort 2026',
        week_number INT NOT NULL UNIQUE,
        project_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        phase VARCHAR(150) NOT NULL,
        difficulty VARCHAR(50) NOT NULL,
        description TEXT,
        tech_stack JSON,
        architecture_nodes JSON,
        github_template VARCHAR(255),
        rubric JSON,
        due_date DATETIME NOT NULL,
        status VARCHAR(50) DEFAULT 'SCHEDULED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS student_project_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_id INT NOT NULL,
        week_number INT NOT NULL,
        student_id INT DEFAULT NULL,
        student_email VARCHAR(150) NOT NULL,
        student_name VARCHAR(150) NOT NULL,
        github_url VARCHAR(255) NOT NULL,
        commit_sha VARCHAR(100) NOT NULL,
        demo_url VARCHAR(255) DEFAULT NULL,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'SUBMITTED',
        score INT DEFAULT NULL,
        mentor_feedback TEXT,
        xp_awarded INT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at DATETIME DEFAULT NULL
      )
    `);

    // Seed targets if table is empty
    const countRows = await query<RowDataPacket[]>('SELECT COUNT(*) as cnt FROM cohort_weekly_targets');
    if (countRows[0].cnt === 0) {
      const today = new Date();
      for (const p of SIXTEEN_PROJECTS_CATALOG) {
        const targetDue = new Date(today);
        targetDue.setDate(today.getDate() + p.weekNumber * 7);

        // First 2 weeks active by default, rest scheduled
        const initStatus = p.weekNumber === 1 ? 'ACTIVE' : p.weekNumber === 2 ? 'RELEASED' : 'SCHEDULED';

        await execute(
          `INSERT INTO cohort_weekly_targets 
           (batch_name, week_number, project_id, title, phase, difficulty, description, tech_stack, architecture_nodes, github_template, rubric, due_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Java & AI Cohort 2026',
            p.weekNumber,
            p.id,
            p.title,
            p.phase,
            p.difficulty,
            p.description,
            JSON.stringify(p.techStack),
            JSON.stringify(p.architectureNodes),
            p.githubTemplate,
            JSON.stringify(p.rubric),
            targetDue.toISOString().slice(0, 19).replace('T', ' '),
            initStatus
          ]
        );
      }
    }
  } catch (err) {
    console.error('ensureTargetTables error:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureTargetTables();
    const session = await getSessionFromRequest(req);
    const email = session?.email?.toLowerCase().trim();

    // Fetch all targets
    const targetRows = await query<RowDataPacket[]>(
      `SELECT * FROM cohort_weekly_targets ORDER BY week_number ASC`
    );

    // Fetch student's submissions
    let studentSubmissions: any[] = [];
    if (email) {
      studentSubmissions = await query<RowDataPacket[]>(
        `SELECT * FROM student_project_submissions WHERE LOWER(student_email) = ? ORDER BY week_number ASC`,
        [email]
      );
    }

    const submissionsMap = new Map();
    for (const sub of studentSubmissions) {
      submissionsMap.set(sub.week_number, {
        id: sub.id,
        githubUrl: sub.github_url,
        commitSha: sub.commit_sha,
        demoUrl: sub.demo_url,
        notes: sub.notes,
        status: sub.status,
        score: sub.score,
        mentorFeedback: sub.mentor_feedback,
        submittedAt: sub.submitted_at,
        reviewedAt: sub.reviewed_at
      });
    }

    // Determine current unlocked milestone week for student
    let maxApprovedWeek = 0;
    for (const sub of studentSubmissions) {
      if (sub.status === 'APPROVED' && sub.week_number > maxApprovedWeek) {
        maxApprovedWeek = sub.week_number;
      }
    }
    const currentUnlockedWeek = Math.max(1, maxApprovedWeek + 1);

    const targets = targetRows.map((r: any) => {
      let techStack = [];
      let architectureNodes = [];
      let rubric = [];
      try { techStack = typeof r.tech_stack === 'string' ? JSON.parse(r.tech_stack) : r.tech_stack; } catch (_) {}
      try { architectureNodes = typeof r.architecture_nodes === 'string' ? JSON.parse(r.architecture_nodes) : r.architecture_nodes; } catch (_) {}
      try { rubric = typeof r.rubric === 'string' ? JSON.parse(r.rubric) : r.rubric; } catch (_) {}

      const userSub = submissionsMap.get(r.week_number) || null;
      const isTargetReleased = r.status === 'ACTIVE' || r.status === 'RELEASED';
      const isUnlockedForStudent = r.week_number <= currentUnlockedWeek && isTargetReleased;

      return {
        id: r.project_id,
        dbId: r.id,
        weekNumber: r.week_number,
        title: r.title,
        phase: r.phase,
        difficulty: r.difficulty,
        description: r.description,
        techStack: techStack || [],
        architectureNodes: architectureNodes || [],
        githubTemplate: r.github_template,
        rubric: rubric || [],
        dueDate: r.due_date,
        targetStatus: r.status, // DRAFT, SCHEDULED, RELEASED, ACTIVE, CLOSED
        isUnlocked: isUnlockedForStudent,
        submission: userSub
      };
    });

    return NextResponse.json({
      success: true,
      currentUnlockedWeek,
      targets
    });
  } catch (error: any) {
    console.error('GET /api/projects/targets error:', error);
    return NextResponse.json({ success: false, message: 'Failed to load targets.' }, { status: 500 });
  }
}

function formatToMySQLDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    const fallback = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return fallback.toISOString().slice(0, 19).replace('T', ' ');
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// POST: Create a new project target OR quick update status/dueDate
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    await ensureTargetTables();
    const body = await req.json();
    const {
      weekNumber,
      title,
      phase,
      difficulty,
      description,
      techStack,
      architectureNodes,
      githubTemplate,
      rubric,
      dueDate,
      status,
      isNewProject
    } = body;

    if (!weekNumber) {
      return NextResponse.json({ success: false, message: 'Week number is required.' }, { status: 400 });
    }

    const formattedDue = formatToMySQLDateTime(dueDate);

    // Check if creating a full new project or upserting
    if (isNewProject || title) {
      const projId = `proj_w${weekNumber}_custom_${Date.now()}`;

      // Check if this week number already exists
      const existing = await query<RowDataPacket[]>(
        `SELECT id FROM cohort_weekly_targets WHERE week_number = ?`,
        [weekNumber]
      );

      if (existing.length > 0) {
        // Update existing week
        await execute(
          `UPDATE cohort_weekly_targets 
           SET title = ?, phase = ?, difficulty = ?, description = ?, tech_stack = ?, architecture_nodes = ?, github_template = ?, rubric = ?, due_date = ?, status = ?
           WHERE week_number = ?`,
          [
            title || `Week ${weekNumber} Target Project`,
            phase || 'Phase 1: Core Java & Concurrency',
            difficulty || 'Foundations',
            description || '',
            JSON.stringify(techStack || []),
            JSON.stringify(architectureNodes || []),
            githubTemplate || 'https://github.com/spring-projects/spring-petclinic',
            JSON.stringify(rubric || []),
            formattedDue,
            status || 'SCHEDULED',
            weekNumber
          ]
        );

        return NextResponse.json({
          success: true,
          message: `Week ${weekNumber} target project updated successfully!`
        });
      } else {
        // Insert new target
        await execute(
          `INSERT INTO cohort_weekly_targets 
           (batch_name, week_number, project_id, title, phase, difficulty, description, tech_stack, architecture_nodes, github_template, rubric, due_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Java & AI Cohort 2026',
            weekNumber,
            projId,
            title || `Week ${weekNumber} Target Project`,
            phase || 'Phase 1: Core Java & Concurrency',
            difficulty || 'Foundations',
            description || '',
            JSON.stringify(techStack || []),
            JSON.stringify(architectureNodes || []),
            githubTemplate || 'https://github.com/spring-projects/spring-petclinic',
            JSON.stringify(rubric || []),
            formattedDue,
            status || 'SCHEDULED'
          ]
        );

        return NextResponse.json({
          success: true,
          message: `Week ${weekNumber} target project created successfully!`
        });
      }
    }

    // Quick status / dueDate update (from table controls)
    if (status) {
      await execute(
        `UPDATE cohort_weekly_targets SET status = ? WHERE week_number = ?`,
        [status, weekNumber]
      );
    }

    if (dueDate) {
      await execute(
        `UPDATE cohort_weekly_targets SET due_date = ? WHERE week_number = ?`,
        [formattedDue, weekNumber]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Week ${weekNumber} target updated successfully.`
    });
  } catch (error: any) {
    console.error('POST /api/projects/targets error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save target. ' + (error.message || '') }, { status: 500 });
  }
}

// PUT: Full update of an existing target project
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    await ensureTargetTables();
    const body = await req.json();
    const {
      id,
      weekNumber,
      title,
      phase,
      difficulty,
      description,
      techStack,
      architectureNodes,
      githubTemplate,
      rubric,
      dueDate,
      status
    } = body;

    if (!weekNumber && !id) {
      return NextResponse.json({ success: false, message: 'Week number or target ID is required.' }, { status: 400 });
    }

    const formattedDue = formatToMySQLDateTime(dueDate);

    await execute(
      `UPDATE cohort_weekly_targets 
       SET title = ?, phase = ?, difficulty = ?, description = ?, tech_stack = ?, architecture_nodes = ?, github_template = ?, rubric = ?, due_date = ?, status = ?
       WHERE ${id ? 'id = ?' : 'week_number = ?'}`,
      [
        title,
        phase,
        difficulty,
        description,
        JSON.stringify(techStack || []),
        JSON.stringify(architectureNodes || []),
        githubTemplate || 'https://github.com/spring-projects/spring-petclinic',
        JSON.stringify(rubric || []),
        formattedDue,
        status || 'SCHEDULED',
        id || weekNumber
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Project specs for Week ${weekNumber} updated successfully!`
    });
  } catch (error: any) {
    console.error('PUT /api/projects/targets error:', error);
    return NextResponse.json({ success: false, message: 'Failed to update project target. ' + (error.message || '') }, { status: 500 });
  }
}

// DELETE: Remove a project target and clean up its submissions
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    await ensureTargetTables();
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    const weekParam = url.searchParams.get('week');

    if (!idParam && !weekParam) {
      return NextResponse.json({ success: false, message: 'Target ID or Week Number is required for deletion.' }, { status: 400 });
    }

    if (idParam) {
      // Find the week number first to cascade submissions
      const rows = await query<RowDataPacket[]>(`SELECT week_number FROM cohort_weekly_targets WHERE id = ?`, [idParam]);
      if (rows.length > 0) {
        const weekNum = rows[0].week_number;
        await execute(`DELETE FROM student_project_submissions WHERE week_number = ?`, [weekNum]);
      }
      await execute(`DELETE FROM cohort_weekly_targets WHERE id = ?`, [idParam]);
    } else if (weekParam) {
      const weekNum = parseInt(weekParam, 10);
      await execute(`DELETE FROM student_project_submissions WHERE week_number = ?`, [weekNum]);
      await execute(`DELETE FROM cohort_weekly_targets WHERE week_number = ?`, [weekNum]);
    }

    return NextResponse.json({
      success: true,
      message: `Target Project (Week ${weekParam || idParam}) deleted successfully from schedule.`
    });
  } catch (error: any) {
    console.error('DELETE /api/projects/targets error:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete target. ' + (error.message || '') }, { status: 500 });
  }
}

