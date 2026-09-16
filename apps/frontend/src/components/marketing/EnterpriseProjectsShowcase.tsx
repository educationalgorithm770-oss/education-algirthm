'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ArchitectureNode {
  id: string;
  name: string;
  tech: string;
  icon: string;
  color: string;
  codeSnippet: string;
  chaosSimulation: string;
  interviewDefenseQ: string;
  interviewDefenseA: string;
}

interface EnterpriseProject {
  id: string;
  title: string;
  badge: string;
  targetRole: string;
  averagePackage: string;
  description: string;
  architectureNodes: ArchitectureNode[];
  recruiterData: {
    atsScore: number;
    complexityLevel: string;
    verifiedSkills: string[];
    staffSdeRubric: {
      concurrency: string;
      idempotency: string;
      scalability: string;
    };
  };
  engineerData: {
    testCoverage: string;
    dockerComposeSnippet: string;
    githubRepoStats: {
      stars: string;
      testsPassed: string;
      benchmarks: string;
    };
  };
}

interface CompanyHiringTrack {
  id: string;
  companyName: string;
  logo: string;
  salaryTier: string;
  targetRole: string;
  rounds: {
    roundNumber: number;
    roundName: string;
    description: string;
    cutoffBenchmark: string;
    sampleQuestion: string;
    howWePrepare: string;
  }[];
}

export default function EnterpriseProjectsShowcase() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('payment_gateway');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('redis_lock');
  const [viewMode, setViewMode] = useState<'engineer' | 'recruiter'>('recruiter');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('amazon');
  const [activeRoundIdx, setActiveRoundIdx] = useState<number>(0);

  const projects: EnterpriseProject[] = [
    {
      id: 'payment_gateway',
      title: 'High-Throughput Payment Gateway & Distributed Wallet Engine',
      badge: 'Flagship Fintech Capstone',
      targetRole: 'SDE-2 Backend / Distributed Systems',
      averagePackage: '₹18 – ₹32 LPA',
      description: 'Engineered for high-concurrency flash sales (5,000+ TPS). Prevents double-spend race conditions using Redis distributed locks, Kafka event sourcing, and MySQL row-level locking.',
      architectureNodes: [
        {
          id: 'api_gateway',
          name: 'Spring Cloud API Gateway',
          tech: 'Reactive Netty + JWT Auth',
          icon: 'fa-network-wired',
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          codeSnippet: `// Rate Limiter: Token Bucket 10,000 req/sec
@Bean
public RedisRateLimiter redisRateLimiter() {
  return new RedisRateLimiter(10000, 20000, 1);
}`,
          chaosSimulation: 'DDoS Attack / 50k requests spike ➔ Token bucket sheds excess load in 2ms without degrading core DB.',
          interviewDefenseQ: 'Why choose Token Bucket over Leaky Bucket algorithm?',
          interviewDefenseA: 'Token Bucket allows sudden valid bursts of traffic up to the bucket capacity while maintaining a steady average rate, whereas Leaky Bucket strictly drops burst capacity.',
        },
        {
          id: 'redis_lock',
          name: 'Redis Distributed Lock',
          tech: 'Redisson + Auto-Lease TTL',
          icon: 'fa-lock',
          color: 'text-rose-600 bg-rose-50 border-rose-200',
          codeSnippet: `// Eliminate double-spend race condition
RLock lock = redissonClient.getLock("wallet:" + userId);
boolean acquired = lock.tryLock(3, 10, TimeUnit.SECONDS);
if (!acquired) {
  throw new ConcurrencyLockException("Wallet transaction in progress");
}`,
          chaosSimulation: 'Worker node crash mid-transaction ➔ Redis lease TTL automatically releases the lock after 10s, preventing distributed deadlocks.',
          interviewDefenseQ: 'Why use Redis Distributed Locks instead of MySQL DB row locks?',
          interviewDefenseA: 'Redis operates completely in memory with sub-millisecond acquisition time, protecting MySQL connection pools from exhausting under 10,000 concurrent checkout threads.',
        },
        {
          id: 'concurrency_core',
          name: 'Java 21 Concurrency Engine',
          tech: 'Project Loom Virtual Threads',
          icon: 'fa-microchip',
          color: 'text-amber-600 bg-amber-50 border-amber-200',
          codeSnippet: `// Zero OS Thread Overhead
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
  IntStream.range(0, 10000).forEach(i -> {
    executor.submit(() -> processPaymentItem(i));
  });
}`,
          chaosSimulation: 'Heavy blocking I/O on external payment banking APIs ➔ Virtual Threads unmount from OS carrier threads, maintaining 100% CPU utilization.',
          interviewDefenseQ: 'What happens when a Virtual Thread hits a blocking socket call?',
          interviewDefenseA: 'The JVM parks the virtual thread in heap memory and reassigns the carrier platform thread to execute other virtual threads, eliminating thread starvation.',
        },
        {
          id: 'kafka_event_bus',
          name: 'Kafka Partitioned Event Bus',
          tech: 'Event Sourcing + Exactly-Once',
          icon: 'fa-bolt',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          codeSnippet: `// Idempotent Transactional Producer
@KafkaListener(topics = "payment-events", groupId = "ledger-service")
public void onPaymentEvent(PaymentEvent event, Acknowledgment ack) {
  ledgerService.recordIdempotent(event);
  ack.acknowledge();
}`,
          chaosSimulation: 'Broker failure or Poison Pill message ➔ Event routed to Dead Letter Queue (DLQ) after 3 retries without blocking the partition stream.',
          interviewDefenseQ: 'How do you guarantee Exactly-Once Processing in Kafka consumers?',
          interviewDefenseA: 'By pairing Kafka idempotent consumer offsets with database unique transaction idempotency keys inside a local ACID transaction boundary.',
        },
        {
          id: 'mysql_sharded_db',
          name: 'MySQL Partitioned Shards',
          tech: 'Row Locks + Read Replicas',
          icon: 'fa-database',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          codeSnippet: `// Pessimistic Write Lock with Read Replication
@Query(value = "SELECT w FROM Wallet w WHERE w.id = :id")
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<Wallet> findWalletForUpdate(@Param("id") Long id);`,
          chaosSimulation: 'Database replication lag ➔ Critical balance updates route strictly to Primary Master; read-heavy analytics queries route to Read Replicas.',
          interviewDefenseQ: 'When is Pessimistic Locking preferred over Optimistic Locking?',
          interviewDefenseA: 'When write contention is extremely high (e.g. flash sale ticket count decrementing). Optimistic locking causes too many rollback retries, consuming CPU cycles.',
        },
      ],
      recruiterData: {
        atsScore: 96,
        complexityLevel: 'Level 4 (High-Throughput Enterprise)',
        verifiedSkills: ['Java 21 Virtual Threads', 'Spring Boot 3', 'Redis Redlock', 'Kafka Event Sourcing', 'MySQL Row Locks', 'Docker'],
        staffSdeRubric: {
          concurrency: '10/10 — Zero race conditions verified with JMeter multi-threaded load tests.',
          idempotency: '10/10 — Unique transaction hash tokens prevent duplicate billing on network retries.',
          scalability: '9.5/10 — Decoupled event-driven Kafka pipeline handles 5,000+ TPS gracefully.',
        },
      },
      engineerData: {
        testCoverage: '98.4% (JaCoCo Verified)',
        dockerComposeSnippet: `services:
  payment-service:
    build: .
    ports: ["8080:8080"]
    depends_on: [redis, kafka, mysql]
    environment:
      JAVA_OPTS: "-XX:+UseZGC -XX:+EnablePreview"`,
        githubRepoStats: {
          stars: '1.4k ★',
          testsPassed: '142 / 142 Unit & Integration Tests',
          benchmarks: '5,240 TPS @ 99.2% Latency < 18ms',
        },
      },
    },
    {
      id: 'ai_code_auditor',
      title: 'Autonomous AI Code Reviewer & Security Vulnerability Auditor',
      badge: 'GenAI & DevSecOps Capstone',
      targetRole: 'AI Platform Engineer / Full Stack SDE',
      averagePackage: '₹16 – ₹30 LPA',
      description: 'Autonomous agentic CI/CD system that analyzes GitHub pull requests, parses Abstract Syntax Trees (AST), runs isolated Docker sandboxes, and flags security vulnerabilities (SQLi, ReDoS, memory leaks).',
      architectureNodes: [
        {
          id: 'github_webhook',
          name: 'GitHub Webhook Ingest',
          tech: 'HMAC SHA-256 Verified',
          icon: 'fa-code-branch',
          color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
          codeSnippet: `@PostMapping("/webhook/pr")
public ResponseEntity<Void> handlePR(@RequestHeader("X-Hub-Signature-256") String sig, @RequestBody String payload) {
  webhookVerifier.validate(payload, sig);
  auditQueue.submit(payload);
  return ResponseEntity.ok().build();
}`,
          chaosSimulation: 'Forged webhook payloads ➔ Cryptographic HMAC validation drops invalid requests immediately.',
          interviewDefenseQ: 'How do you prevent webhook delivery replay attacks?',
          interviewDefenseA: 'We verify the HMAC SHA-256 signature using a shared secret and check the unique GitHub delivery UUID against Redis with a 10-minute expiry cache.',
        },
        {
          id: 'ast_parser',
          name: 'Java AST & Bytecode Parser',
          tech: 'JavaParser + ASM Bytecode',
          icon: 'fa-file-code',
          color: 'text-purple-600 bg-purple-50 border-purple-200',
          codeSnippet: `CompilationUnit cu = StaticJavaParser.parse(fileContent);
cu.findAll(MethodDeclaration.class).forEach(method -> {
  if (method.isPublic() && !method.isAnnotationPresent(Transactional.class)) {
    flagVulnerability("Missing transaction boundary on public mutating service", method);
  }
});`,
          chaosSimulation: 'Malformed syntax files ➔ AST parser catches compilation errors gracefully without crashing the analysis daemon.',
          interviewDefenseQ: 'What is the advantage of AST parsing over regex regex matching for code audits?',
          interviewDefenseA: 'AST creates a semantic hierarchy tree that understands scope, variable types, and class inheritance, completely eliminating false positives common in string regex matching.',
        },
        {
          id: 'docker_runner',
          name: 'Isolated Docker Code Sandbox',
          tech: 'gVisor Kernel Sandbox',
          icon: 'fa-box-open',
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
          codeSnippet: `// Zero Host Access Execution
DockerClient docker = DockerClientBuilder.getInstance().build();
CreateContainerResponse container = docker.createContainerCmd("openjdk:21-slim")
  .withMemory(256 * 1024 * 1024L) // 256MB hard limit
  .withCpuQuota(50000)             // 0.5 CPU limit
  .withNetworkMode("none")         // Zero egress internet
  .exec();`,
          chaosSimulation: 'Infinite while(true) loop or Fork-Bomb code ➔ Hard memory cgroup and 2-second timeout kills the container cleanly.',
          interviewDefenseQ: 'How do you prevent student code from accessing host server files in a sandbox?',
          interviewDefenseA: 'We run rootless containers with `network_mode=none`, read-only root filesystems, dropped Linux capabilities (CAP_SYS_ADMIN), and hard cgroup memory/CPU limits.',
        },
      ],
      recruiterData: {
        atsScore: 94,
        complexityLevel: 'Level 4 (Agentic AI + System Security)',
        verifiedSkills: ['RAG Agentic AI', 'Java AST Analysis', 'Docker Sandbox Security', 'GitHub API Integration', 'Spring Boot 3'],
        staffSdeRubric: {
          concurrency: '9.5/10 — Asynchronous task processing with non-blocking reactive queues.',
          idempotency: '10/10 — PR commit SHA caching prevents redundant re-audits.',
          scalability: '9.8/10 — Worker pool auto-scales Docker containers based on queue depth.',
        },
      },
      engineerData: {
        testCoverage: '96.8% (JaCoCo Verified)',
        dockerComposeSnippet: `services:
  ai-auditor:
    build: .
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro`,
        githubRepoStats: {
          stars: '920 ★',
          testsPassed: '88 / 88 Unit & Integration Tests',
          benchmarks: 'Audits 500 lines of code in < 1.4s',
        },
      },
    },
  ];

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const currentNode = currentProject.architectureNodes.find(n => n.id === selectedNodeId) || currentProject.architectureNodes[0];

  const companyTracks: CompanyHiringTrack[] = [
    {
      id: 'amazon',
      companyName: 'Amazon SDE-1 (AWS)',
      logo: 'fa-brands fa-amazon',
      salaryTier: '₹22 – ₹38 LPA',
      targetRole: 'Software Development Engineer 1',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Online Assessment (OA 1 & 2)',
          description: '2 Hard LeetCode style algorithmic questions + Amazon Work Simulation.',
          cutoffBenchmark: '100% Test Cases Passed in < 70 mins',
          sampleQuestion: 'Given high-throughput log streams, find the top K most frequent IP addresses in real-time under memory constraints.',
          howWePrepare: 'Our In-Browser Code Arena features all past Amazon OA patterns with automated memory & time profiling.',
        },
        {
          roundNumber: 2,
          roundName: 'Technical Coding & Concurrency Loop',
          description: 'Live coding with Amazon SDE-2/3 covering Trees, DP, and Java Concurrency.',
          cutoffBenchmark: 'Clean production code, edge-case handling, and O(N) complexity.',
          sampleQuestion: 'Implement a thread-safe LRU Cache with O(1) read/write using Java 21 ConcurrentHashMap and custom DoublyLinkedList.',
          howWePrepare: 'Live 1-on-1 mock interviews with Amazon SDE mentors practicing verbal architectural defense.',
        },
        {
          roundNumber: 3,
          roundName: 'Low-Level System Design (LLD)',
          description: 'Object-oriented design of a real production service (Payment Gateway, Parking Lot, Rate Limiter).',
          cutoffBenchmark: 'SOLID principles, Design Patterns (Factory, Strategy, Observer), and Concurrency safety.',
          sampleQuestion: 'Design an e-commerce Payment Gateway that handles concurrency race conditions and supports multiple payment providers.',
          howWePrepare: 'Directly defend your High-Throughput Payment Gateway capstone with Redis distributed locks.',
        },
        {
          roundNumber: 4,
          roundName: 'Bar Raiser & Leadership Principles',
          description: 'Deep dive into Customer Obsession, Bias for Action, and Technical Tradeoffs.',
          cutoffBenchmark: 'STAR format answers with quantified business and technical metrics.',
          sampleQuestion: 'Tell me about a time you made a architectural tradeoff between database consistency and latency.',
          howWePrepare: 'AI Behavioral Interviewer scores your answers on Amazon’s exact 16 Leadership Principles.',
        },
      ],
    },
    {
      id: 'razorpay',
      companyName: 'Razorpay / Swiggy (Fintech & Unicorns)',
      logo: 'fa-solid fa-credit-card',
      salaryTier: '₹18 – ₹32 LPA',
      targetRole: 'Backend Engineer (Java / Distributed Systems)',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'Machine Coding Round (2 Hours)',
          description: 'Build a working, extensible microservice from scratch with full unit tests and clean package layout.',
          cutoffBenchmark: 'Compilable code, 95%+ test coverage, clean Separation of Concerns.',
          sampleQuestion: 'Build a Splitwise Expense Sharing Engine with exact, percentage, and split-by-shares support and balance simplification.',
          howWePrepare: 'Timed machine coding drills in our Docker Sandbox with automated test harnesses.',
        },
        {
          roundNumber: 2,
          roundName: 'System Architecture & Database Deep Dive',
          description: 'Database indexing, transactions, Kafka partitioning, and distributed locks.',
          cutoffBenchmark: 'Explaining ACID isolation levels, Redis caching strategies, and DLQ handling.',
          sampleQuestion: 'How do you ensure zero double-spending when 10,000 users click "Pay Now" on a flash sale simultaneously?',
          howWePrepare: 'Defend your High-Throughput Payment Gateway with Redis Redlock and MySQL row locks.',
        },
        {
          roundNumber: 3,
          roundName: 'Engineering Culture & Hiring Manager Loop',
          description: 'Problem-solving under production incidents and code quality standards.',
          cutoffBenchmark: 'Clear communication of trade-offs and real production deployment experience.',
          sampleQuestion: 'Walk me through a production failure you simulated in your project and how your circuit breaker responded.',
          howWePrepare: 'Simulated chaos engineering and live interview coaching with top product engineers.',
        },
      ],
    },
    {
      id: 'tcs_prime',
      companyName: 'TCS Prime / Digital Cadre',
      logo: 'fa-solid fa-building',
      salaryTier: '₹9 – ₹14 LPA',
      targetRole: 'Special Cadre Systems Engineer',
      rounds: [
        {
          roundNumber: 1,
          roundName: 'TCS NQT Advanced Coding & Speed Math',
          description: 'High-speed quantitative aptitude + 2 advanced algorithmic coding questions.',
          cutoffBenchmark: '90%+ Score in Quantitative Aptitude and 2/2 Coding questions.',
          sampleQuestion: 'Given an array of server transaction loads, partition it into K clusters to minimize the maximum cluster load.',
          howWePrepare: '7 Motion Concept Labs (Zero-Algebra Speed Math) + 60s Speed Duel arena + TCS OA Simulator.',
        },
        {
          roundNumber: 2,
          roundName: 'Advanced Technical & Microservices Interview',
          description: 'Java 21, Spring Boot, REST APIs, Microservices, and SQL database design.',
          cutoffBenchmark: 'Demonstrating modern Java LTS concepts and enterprise project experience.',
          sampleQuestion: 'Explain the difference between Spring Bean scopes and how Spring Data JPA prevents N+1 query problems.',
          howWePrepare: 'Complete Java 21 LTS syllabus and RAG AI Mock Interviewer with instant rubric grading.',
        },
      ],
    },
  ];

  const currentTrack = companyTracks.find(t => t.id === selectedCompanyId) || companyTracks[0];
  const currentRound = currentTrack.rounds[activeRoundIdx] || currentTrack.rounds[0];

  return (
    <section className="py-14 sm:py-20 px-3 sm:px-6 lg:px-8 bg-white border-b border-slate-200 relative">
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto px-2">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider">
            <i className="fa-solid fa-layer-group text-indigo-600"></i>
            <span>Production-Grade Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Stop Building Toy Todo Apps.<br />
            <span className="text-indigo-600">Build Real Enterprise Microservices.</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-base font-normal leading-relaxed">
            Recruiters reject 90% of resumes because they lack enterprise distributed systems. At Education Algorithm, you architect, deploy, and defend production systems built with Java 21, Kafka, and Redis.
          </p>
        </div>

        {/* Project Selector Pills */}
        <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setSelectedNodeId(proj.architectureNodes[0]?.id || '');
              }}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 border flex items-center space-x-2 whitespace-nowrap ${
                selectedProjectId === proj.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20 scale-102'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-server text-xs"></i>
              <span>{proj.title.split('&')[0]}</span>
            </button>
          ))}
        </div>

        {/* Main Interactive Topology & Inspector Container */}
        <div className="rounded-3xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-8 space-y-8 shadow-sm">
          
          {/* Project Overview Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                  {currentProject.badge}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Target: <strong className="text-indigo-600">{currentProject.targetRole}</strong> ({currentProject.averagePackage})
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {currentProject.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {currentProject.description}
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 self-start lg:self-auto shadow-2xs">
              <button
                onClick={() => setViewMode('recruiter')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                  viewMode === 'recruiter'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-briefcase text-[11px]"></i>
                <span>Recruiter View</span>
              </button>
              <button
                onClick={() => setViewMode('engineer')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
                  viewMode === 'engineer'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-code text-[11px]"></i>
                <span>Engineer View</span>
              </button>
            </div>
          </div>

          {/* VIEW 1: INTERACTIVE TOPOLOGY & CODE INSPECTOR */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-diagram-project text-indigo-600 text-xs"></i>
                  <span>Interactive Microservices Topology (Click Any Node to Inspect)</span>
                </h4>
                <span className="text-[11px] text-slate-500">
                  Explore how traffic flows through distributed locks, event streaming, and sharded storage.
                </span>
              </div>
            </div>

            {/* Clickable Architecture Nodes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentProject.architectureNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-600/20 scale-102'
                        : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm font-bold ${node.color}`}>
                        <i className={`fa-solid ${node.icon}`}></i>
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {node.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                        {node.tech}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Node Deep-Dive Panel */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-base font-bold ${currentNode.color}`}>
                    <i className={`fa-solid ${currentNode.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900">
                      {currentNode.name}
                    </h4>
                    <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                      {currentNode.tech}
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                  Node Status: <strong className="text-emerald-700">Healthy &amp; Resilient</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Production Code Snippet */}
                <div className="lg:col-span-6 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="flex items-center space-x-1.5 text-slate-700">
                      <i className="fa-solid fa-code text-indigo-600"></i>
                      <span>Production Implementation Snippet</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Java 21 / Spring Boot 3</span>
                  </div>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
                    <code>{currentNode.codeSnippet}</code>
                  </pre>
                </div>

                {/* Right: Chaos Simulation & Interview Defense */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Chaos Resilience Box */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                    <div className="text-xs font-black text-amber-900 flex items-center space-x-1.5">
                      <i className="fa-solid fa-triangle-exclamation text-amber-600"></i>
                      <span>Chaos &amp; Failure Resilience Simulation:</span>
                    </div>
                    <p className="text-xs text-amber-950/90 leading-relaxed font-medium">
                      {currentNode.chaosSimulation}
                    </p>
                  </div>

                  {/* Staff SDE Interview Defense Box */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                    <div className="text-xs font-black text-indigo-950 flex items-center space-x-1.5">
                      <i className="fa-solid fa-shield-check text-indigo-600"></i>
                      <span>Staff SDE Interview Defense Question:</span>
                    </div>
                    <p className="text-xs font-bold text-indigo-900 italic">
                      "{currentNode.interviewDefenseQ}"
                    </p>
                    <div className="p-2.5 rounded-xl bg-white border border-indigo-100 text-[11px] text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 font-black">Model Answer:</strong> {currentNode.interviewDefenseA}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* VIEW 2: RECRUITER RADAR VS ENGINEER PROOF CARDS */}
          {viewMode === 'recruiter' ? (
            /* Recruiter Radar View */
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-file-invoice text-indigo-600 text-sm"></i>
                  <h4 className="text-sm font-black text-slate-900">
                    Recruiter ATS Scorecard &amp; Staff Engineer Rubric
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-mono font-black text-xs">
                    ATS Score: {currentProject.recruiterData.atsScore} / 100 🟢
                  </span>
                </div>
              </div>

              {/* Verified Skills Pill Grid */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Verified Technical Keywords Injected on Student Resume:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProject.recruiterData.verifiedSkills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-mono font-bold border border-slate-200"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Staff SDE Evaluation Rubric */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700">Concurrency Safety</span>
                  <p className="text-xs text-slate-700 font-medium">{currentProject.recruiterData.staffSdeRubric.concurrency}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-700">Idempotency &amp; Data Locks</span>
                  <p className="text-xs text-slate-700 font-medium">{currentProject.recruiterData.staffSdeRubric.idempotency}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700">Distributed Scalability</span>
                  <p className="text-xs text-slate-700 font-medium">{currentProject.recruiterData.staffSdeRubric.scalability}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Engineer Proof-of-Work View */
            <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-code-commit text-indigo-600 text-sm"></i>
                  <h4 className="text-sm font-black text-slate-900">
                    Production Proof-of-Work, Docker &amp; CI/CD Metrics
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 font-mono font-black text-xs">
                  JaCoCo Test Coverage: {currentProject.engineerData.testCoverage}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-2">
                  <span className="text-xs font-bold text-slate-500">Production docker-compose.yml Specification:</span>
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                    <code>{currentProject.engineerData.dockerComposeSnippet}</code>
                  </pre>
                </div>
                <div className="lg:col-span-6 space-y-3">
                  <span className="text-xs font-bold text-slate-500">Benchmark &amp; Testing Rigor:</span>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Automated Test Harness:</span>
                      <strong className="text-emerald-700">{currentProject.engineerData.githubRepoStats.testsPassed}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Throughput Benchmark:</span>
                      <strong className="text-indigo-700">{currentProject.engineerData.githubRepoStats.benchmarks}</strong>
                    </div>
                    <div className="flex justify-between text-xs text-slate-700">
                      <span>Verifiable Credential Hash:</span>
                      <strong className="text-slate-900 font-mono text-[11px]">SHA256: 8f3c...b92a</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 🏢 4-ROUND COMPANY HIRING LOOP SIMULATOR */}
        <div className="space-y-6 pt-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-black uppercase tracking-wider">
              Company-Specific Recruitment Loops
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Interactive 4-Round Hiring Simulator
            </h3>
            <p className="text-xs sm:text-sm text-slate-600">
              Select your target dream company to inspect the exact cutoff benchmarks, coding questions, and project defense rounds.
            </p>
          </div>

          {/* Company Selector Tabs */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
            {companyTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => {
                  setSelectedCompanyId(track.id);
                  setActiveRoundIdx(0);
                }}
                className={`px-4 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 border flex items-center space-x-2.5 ${
                  selectedCompanyId === track.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <i className={`${track.logo} text-base`}></i>
                <span>{track.companyName}</span>
                <span className="hidden sm:inline text-[10px] font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  {track.salaryTier}
                </span>
              </button>
            ))}
          </div>

          {/* Company Hiring Pipeline Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 space-y-6 shadow-sm">
            
            {/* Rounds Progression Navigation */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-100">
              {currentTrack.rounds.map((r, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => setActiveRoundIdx(rIdx)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition border flex items-center space-x-2 whitespace-nowrap ${
                    activeRoundIdx === rIdx
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-mono">
                    {r.roundNumber}
                  </span>
                  <span>{r.roundName.split('(')[0]}</span>
                </button>
              ))}
            </div>

            {/* Active Round Breakdown Box */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
              
              <div className="lg:col-span-7 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                    Round 0{currentRound.roundNumber} • {currentTrack.companyName}
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">
                    {currentRound.roundName}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                    {currentRound.description}
                  </p>
                </div>

                {/* Sample Interview Question Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                    <i className="fa-solid fa-circle-question text-indigo-600"></i>
                    <span>Real Technical Hiring Question Asked in This Round:</span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    "{currentRound.sampleQuestion}"
                  </p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-3 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                    Cutoff Benchmark:
                  </span>
                  <div className="text-xs font-extrabold text-slate-900">
                    {currentRound.cutoffBenchmark}
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-indigo-100">
                  <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                    How Education Algorithm Prepares You:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {currentRound.howWePrepare}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/courses"
                    className="w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
                  >
                    <span>Prepare for {currentTrack.companyName.split('(')[0]}</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
