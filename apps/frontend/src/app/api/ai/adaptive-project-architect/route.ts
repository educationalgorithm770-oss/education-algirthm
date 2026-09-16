import { NextRequest, NextResponse } from 'next/server';
import { callGeminiWithRotation } from '@/lib/gemini';
import { query } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

export interface StudentProfile {
  studentName?: string;
  assessmentScore?: number;
  completedModules?: string[];
  currentModule?: string;
  failedConcepts?: string[];
  previousProjectScore?: number;
  previousProjects?: { title: string; score: number; status: string }[];
}

export interface AdaptiveProjectBlueprint {
  projectTitle: string;
  course: string;
  module: string;
  difficulty: 'BEGINNER' | 'BASIC' | 'FOUNDATION' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | 'CAPSTONE';
  projectLevel: string;
  problemStatement: string;
  whyThisProject: string;
  learningObjectives: string[];
  prerequisites: string[];
  technologies: string[];
  conceptsCovered: string[];
  architecture: string[];
  implementationPhases: { phase: string; title: string; tasks: string[] }[];
  expectedOutput: string;
  testingRequirements: string[];
  githubSubmissionRequirements: string[];
  evaluationRubric: { criterion: string; points: number; description: string }[];
  commonMistakes: string[];
  nextRecommendedProject: string;
  studentReadiness?: {
    status: 'READY' | 'READY_WITH_PREPARATION' | 'NOT_READY';
    reason: string;
    missingPrerequisites: string[];
    recommendedPrepTask?: string;
    recommendedFoundationProject?: string;
  };
}

// Canonical Difficulty-to-Level Mapping
const DIFFICULTY_LEVEL_MAP: Record<string, string> = {
  BEGINNER: 'LEVEL 1: BEGINNER / BASICS',
  BASIC: 'LEVEL 1: BEGINNER / BASICS',
  FOUNDATION: 'LEVEL 2: FOUNDATION',
  INTERMEDIATE: 'LEVEL 3: INTERMEDIATE',
  ADVANCED: 'LEVEL 4: ADVANCED',
  EXPERT: 'LEVEL 5: EXPERT',
  CAPSTONE: 'LEVEL 6: ENTERPRISE CAPSTONE'
};

// Prohibited enterprise/cloud keywords for Level 1 & Level 2 Foundational projects
const FORBIDDEN_FOUNDATIONAL_KEYWORDS = [
  'kubernetes', 'k8s', 'microservice', 'microservices', 'distributed',
  'terraform', 'kafka', 'service mesh', 'cqrs', 'event-driven architecture',
  'aws eks', 'helm', 'consul', 'istio', 'redis cluster', 'multi-tenant saas',
  'enterprise capstone', 'event streaming', 'cloud mesh'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseId,
      courseTitle,
      curriculum: customCurriculum,
      difficulty,
      targetModule,
      optionalObjectives,
      studentProfile,
      generateFullPathway
    } = body;

    let targetCourse = courseTitle?.trim() || 'Software Engineering';
    let curriculumModules: string[] = [];

    // 1. If courseId provided, fetch actual modules from MySQL
    if (courseId) {
      try {
        const courseRows = await query<RowDataPacket[]>('SELECT title FROM courses WHERE id = ?', [courseId]);
        if (courseRows.length > 0) {
          targetCourse = courseRows[0].title;
        }

        const moduleRows = await query<RowDataPacket[]>(
          'SELECT title, description FROM modules WHERE course_id = ? ORDER BY sort_order ASC, id ASC',
          [courseId]
        );
        if (moduleRows.length > 0) {
          curriculumModules = moduleRows.map((m) => m.title);
        }
      } catch (dbErr) {
        console.warn('Could not load course modules from DB, using fallback/custom:', dbErr);
      }
    }

    // 2. Use custom provided curriculum if DB modules were empty
    if (curriculumModules.length === 0 && Array.isArray(customCurriculum) && customCurriculum.length > 0) {
      curriculumModules = customCurriculum.map((c) => String(c).trim()).filter(Boolean);
    }

    // 3. Fallback default curriculum if none provided
    if (curriculumModules.length === 0) {
      const lower = targetCourse.toLowerCase();
      if (lower.includes('devops')) {
        curriculumModules = ['Linux & Shell', 'Git & Version Control', 'Networking & Protocols', 'Docker & Containers', 'CI/CD Pipelines', 'Kubernetes Orchestration', 'AWS Cloud Infrastructure', 'Terraform (IaC)', 'Prometheus & Grafana Monitoring'];
      } else if (lower.includes('python')) {
        curriculumModules = ['Python Fundamentals & OOP', 'Data Structures & Algorithms', 'File I/O & Concurrency', 'FastAPI & REST APIs', 'SQLAlchemy & PostgreSQL', 'Async Workers & Celery', 'Dockerization & Deployment'];
      } else if (lower.includes('data science') || lower.includes('ai') || lower.includes('machine learning')) {
        curriculumModules = ['Python for Data Analysis (NumPy, Pandas)', 'Exploratory Data Analysis & Visualization', 'Classical Machine Learning (Scikit-Learn)', 'Feature Engineering & Cross-Validation', 'Deep Learning & Neural Networks', 'LLM Prompt Engineering & RAG', 'Model Serving & FastAPI'];
      } else if (lower.includes('cybersecurity') || lower.includes('security')) {
        curriculumModules = ['Networking Fundamentals & Wireshark', 'Linux Security & Hardening', 'Vulnerability Assessment & Nmap', 'Web Application Security (OWASP Top 10)', 'Cryptography & PKI', 'SOC Monitoring & SIEM Analysis', 'Incident Response & Threat Hunting'];
      } else if (lower.includes('mern') || lower.includes('react') || lower.includes('node')) {
        curriculumModules = ['Modern JavaScript (ES6+)', 'Node.js & Express Architecture', 'MongoDB & Mongoose Schema Design', 'React Component Architecture & State', 'JWT Auth & RBAC', 'Redux / Zustand & Next.js', 'Docker & Production Deployment'];
      } else if (lower.includes('c++')) {
        curriculumModules = ['C++ Modern Syntax (C++20)', 'Pointers & Dynamic Memory Management', 'OOP & RAII Principles', 'STL Containers & Iterators', 'Templates & Metaprogramming', 'Multithreading & Concurrency', 'High-Performance Engine Optimization'];
      } else {
        curriculumModules = ['Core Language Fundamentals & Concurrency', 'Object-Oriented Design & Design Patterns', 'Databases, ORM & Transactions', 'RESTful Microservices & Security', 'Distributed Messaging & Caching', 'Cloud Containerization & Production Capstone'];
      }
    }

    const rawDiff = (difficulty || 'INTERMEDIATE').toUpperCase();
    const requestedDifficulty = (['BEGINNER', 'BASIC', 'FOUNDATION', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'CAPSTONE'].includes(rawDiff)
      ? rawDiff
      : 'INTERMEDIATE') as AdaptiveProjectBlueprint['difficulty'];

    // Check if full 4-tier pathway requested (BASIC, INTERMEDIATE, ADVANCED, CAPSTONE)
    if (generateFullPathway) {
      const pathwayDifficulties: ('BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'CAPSTONE')[] = ['BASIC', 'INTERMEDIATE', 'ADVANCED', 'CAPSTONE'];
      const pathwayProjects: AdaptiveProjectBlueprint[] = [];

      for (const diff of pathwayDifficulties) {
        const proj = await generateSingleAdaptiveProject(targetCourse, curriculumModules, diff, optionalObjectives, studentProfile);
        pathwayProjects.push(proj);
      }

      return NextResponse.json({
        success: true,
        course: targetCourse,
        curriculum: curriculumModules,
        pathway: pathwayProjects
      });
    }

    // Single Adaptive Project Generation
    const project = await generateSingleAdaptiveProject(targetCourse, curriculumModules, requestedDifficulty, optionalObjectives, studentProfile, targetModule);

    return NextResponse.json({
      success: true,
      course: targetCourse,
      curriculum: curriculumModules,
      project
    });
  } catch (error: any) {
    console.error('POST /api/ai/adaptive-project-architect error:', error);
    return NextResponse.json(
      { success: false, message: 'Adaptive Project Architect failed: ' + (error.message || 'Internal error') },
      { status: 500 }
    );
  }
}

/**
 * Generates an adaptive project blueprint with rigorous 7-pillar Difficulty Consistency Checks.
 */
async function generateSingleAdaptiveProject(
  course: string,
  curriculum: string[],
  difficulty: AdaptiveProjectBlueprint['difficulty'],
  optionalObjectives?: string,
  studentProfile?: StudentProfile,
  targetModule?: string
): Promise<AdaptiveProjectBlueprint> {
  const totalModules = curriculum.length;
  
  // Curriculum Slice Calculation
  let relevantModuleSlice: string[] = [];
  let primaryModule = '';

  if (targetModule && targetModule.trim() && targetModule.trim().toUpperCase() !== 'AUTO') {
    primaryModule = targetModule.trim();
    relevantModuleSlice = [primaryModule];
  } else if (difficulty === 'BEGINNER' || difficulty === 'BASIC') {
    const endIdx = Math.max(1, Math.min(3, Math.ceil(totalModules * 0.35)));
    relevantModuleSlice = curriculum.slice(0, endIdx);
    primaryModule = relevantModuleSlice[0] || curriculum[0];
  } else if (difficulty === 'FOUNDATION') {
    const endIdx = Math.max(2, Math.min(4, Math.ceil(totalModules * 0.45)));
    relevantModuleSlice = curriculum.slice(0, endIdx);
    primaryModule = relevantModuleSlice[relevantModuleSlice.length - 1] || curriculum[1] || curriculum[0];
  } else if (difficulty === 'INTERMEDIATE') {
    const startIdx = Math.max(0, Math.floor(totalModules * 0.25));
    const endIdx = Math.max(startIdx + 1, Math.ceil(totalModules * 0.7));
    relevantModuleSlice = curriculum.slice(startIdx, endIdx);
    primaryModule = relevantModuleSlice[Math.floor(relevantModuleSlice.length / 2)] || curriculum[Math.floor(totalModules / 2)];
  } else if (difficulty === 'ADVANCED' || difficulty === 'EXPERT') {
    const startIdx = Math.max(0, Math.floor(totalModules * 0.5));
    relevantModuleSlice = curriculum.slice(startIdx);
    primaryModule = relevantModuleSlice[relevantModuleSlice.length - 1] || curriculum[totalModules - 1];
  } else {
    // CAPSTONE combines foundational through advanced
    relevantModuleSlice = curriculum;
    primaryModule = `Full Curriculum Synthesis (Modules 1–${totalModules})`;
  }

  // Evaluate Student Readiness if student profile is provided
  let readinessResult: AdaptiveProjectBlueprint['studentReadiness'] | undefined = undefined;

  if (studentProfile) {
    const score = studentProfile.assessmentScore ?? 100;
    const completedCount = studentProfile.completedModules?.length ?? 0;

    const isBasic = difficulty === 'BEGINNER' || difficulty === 'BASIC' || difficulty === 'FOUNDATION';
    const isIntermediate = difficulty === 'INTERMEDIATE';
    const isAdvancedOrCapstone = difficulty === 'ADVANCED' || difficulty === 'EXPERT' || difficulty === 'CAPSTONE';

    if (isAdvancedOrCapstone && (score < 60 || completedCount < Math.floor(totalModules * 0.5))) {
      readinessResult = {
        status: 'NOT_READY',
        reason: `Student assessment score (${score}%) or completed module count (${completedCount}/${totalModules}) is below the prerequisite threshold for an ${difficulty} project in ${course}.`,
        missingPrerequisites: relevantModuleSlice.slice(0, Math.max(1, Math.floor(relevantModuleSlice.length / 2))),
        recommendedPrepTask: `Complete foundational quizzes and coding labs for: ${relevantModuleSlice[0] || 'Core Prerequisites'}.`,
        recommendedFoundationProject: `Foundational Milestone: Building a standalone prototype focused on ${curriculum[0] || 'Core Foundations'}.`
      };
    } else if (isIntermediate && (score < 50 || completedCount < 1)) {
      readinessResult = {
        status: 'READY_WITH_PREPARATION',
        reason: `Student has introductory knowledge but scored ${score}%. Recommend completing a warmup implementation before starting full architecture.`,
        missingPrerequisites: [curriculum[0] || 'Fundamental Concepts'],
        recommendedPrepTask: `Review ${curriculum[0]} syntax and complete 3 warmup exercises before repository submission.`,
        recommendedFoundationProject: `Starter Lab in ${curriculum[0] || 'Basic Foundations'}`
      };
    } else {
      readinessResult = {
        status: 'READY',
        reason: `Student meets all prerequisites (${score}% assessment, completed foundations) and is cleared to build the ${difficulty} project.`,
        missingPrerequisites: []
      };
    }
  }

  const mappedCanonicalLevel = DIFFICULTY_LEVEL_MAP[difficulty] || 'LEVEL 3: INTERMEDIATE';

  // Construct Strict Prompt for Gemini with Difficulty Consistency Guardrails
  const prompt = `You are the Education Algorithm Adaptive Project Architect.
Your mission is to construct an industry-grade, course-aware PROJECT BLUEPRINT for:

COURSE: "${course}"
CURRICULUM MODULES:
${curriculum.map((m, i) => `Module ${i + 1}: ${m}`).join('\n')}

REQUESTED DIFFICULTY: ${difficulty}
CANONICAL PROJECT LEVEL: "${mappedCanonicalLevel}"
TARGET RELEVANT MODULE SLICE: ${relevantModuleSlice.join(', ')}
PRIMARY FOCUS MODULE: ${primaryModule}
${optionalObjectives ? `ADDITIONAL OBJECTIVES: ${optionalObjectives}` : ''}

CRITICAL DIFFICULTY CONSISTENCY RULES:
1. STRICT DIFFICULTY & LEVEL CONSISTENCY:
   - If difficulty is BEGINNER or BASIC (LEVEL 1):
     * MUST USE ONLY concepts from the early foundational modules (${relevantModuleSlice.join(', ')}).
     * DO NOT use Kubernetes, Terraform, Microservices, CQRS, Kafka, Distributed Systems, or Cloud Cluster architectures.
     * Prioritize core fundamentals (e.g. CLI tool, scripting, simple file I/O, basic data structures, unit tests).
   - If difficulty is FOUNDATION (LEVEL 2):
     * Focus on single-service, local database, OOP, and unit testing.
   - If difficulty is INTERMEDIATE (LEVEL 3):
     * Focus on REST APIs, Docker container, local database/ORM, and CI pipelines.
   - If difficulty is ADVANCED (LEVEL 4) or EXPERT (LEVEL 5):
     * Focus on Microservices, distributed caching, messaging queues, and async workers.
   - If difficulty is CAPSTONE (LEVEL 6):
     * Synthesize multiple major modules into an end-to-end production architecture.

2. Output raw valid JSON strictly matching the schema (NO markdown fences, NO extra text).

JSON SCHEMA:
{
  "projectTitle": "Clear, professional, difficulty-consistent project name (e.g. for Basic: 'Linux Server Health Monitoring Script' or 'Student Grade Management CLI')",
  "course": "${course}",
  "module": "${primaryModule}",
  "difficulty": "${difficulty}",
  "projectLevel": "${mappedCanonicalLevel}",
  "problemStatement": "2-3 sentences explaining the concrete problem matching ${difficulty} scope.",
  "whyThisProject": "Why this project bridges academic learning to hands-on practice for ${difficulty} level.",
  "learningObjectives": [
    "Objective 1",
    "Objective 2",
    "Objective 3",
    "Objective 4"
  ],
  "prerequisites": [
    "Prerequisite 1 appropriate for ${difficulty}",
    "Prerequisite 2"
  ],
  "technologies": [
    "Tech 1",
    "Tech 2",
    "Tech 3"
  ],
  "conceptsCovered": [
    "Concept 1",
    "Concept 2",
    "Concept 3",
    "Concept 4"
  ],
  "architecture": [
    "Layer 1 / Node 1",
    "Layer 2 / Node 2",
    "Layer 3 / Node 3",
    "Layer 4 / Node 4"
  ],
  "implementationPhases": [
    { "phase": "Phase 1: Setup & Foundations", "title": "Scaffolding", "tasks": ["Task 1", "Task 2"] },
    { "phase": "Phase 2: Core Domain Logic", "title": "Implementation", "tasks": ["Task 1", "Task 2"] },
    { "phase": "Phase 3: Error Handling & Edge Cases", "title": "Robustness", "tasks": ["Task 1", "Task 2"] },
    { "phase": "Phase 4: Automated Testing & Packaging", "title": "Verification", "tasks": ["Task 1", "Task 2"] }
  ],
  "expectedOutput": "Specific description of working deliverable matching ${difficulty}.",
  "testingRequirements": [
    "Requirement 1 (>80% unit test coverage)",
    "Requirement 2 (Edge cases)"
  ],
  "githubSubmissionRequirements": [
    "Clean Git commit history",
    "README.md with setup and architecture instructions",
    "Automated unit test runner script"
  ],
  "evaluationRubric": [
    { "criterion": "Core Functional Accuracy", "points": 25, "description": "Meets specified functional requirements without bugs." },
    { "criterion": "Clean Code & Design", "points": 25, "description": "Structured modular code adhering to clean programming standards." },
    { "criterion": "Robust Error Handling & Edge Cases", "points": 25, "description": "Handles invalid inputs, nulls, and boundary conditions gracefully." },
    { "criterion": "Automated Unit Tests & Documentation", "points": 25, "description": "Passes automated test assertions with clear README instructions." }
  ],
  "commonMistakes": [
    "Common mistake 1",
    "Common mistake 2",
    "Common mistake 3"
  ],
  "nextRecommendedProject": "Name of the next logical project in the curriculum roadmap."
}`;

  let parsed: any = null;

  try {
    const aiResp = await callGeminiWithRotation({
      contents: prompt,
      systemInstruction: 'You are the Education Algorithm Adaptive Project Architect. Strict difficulty consistency is mandatory. Output raw valid JSON strictly matching the schema.'
    });

    if (aiResp && aiResp.text) {
      let clean = aiResp.text.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
      }
      parsed = JSON.parse(clean);
    }
  } catch (err) {
    console.warn('AI call in Adaptive Project Architect failed, synthesizing heuristic blueprint:', err);
  }

  // Fallback Heuristic Generator if AI parsing fails
  if (!parsed || !parsed.projectTitle) {
    parsed = generateHeuristicBlueprint(course, primaryModule, relevantModuleSlice, difficulty, mappedCanonicalLevel, curriculum);
  }

  // =========================================================================
  // CRITICAL PROGRAMMATIC DIFFICULTY CONSISTENCY SANITIZER & AUDITOR
  // =========================================================================
  const auditedBlueprint = auditAndEnforceDifficultyConsistency(
    {
      projectTitle: parsed.projectTitle,
      course: parsed.course || course,
      module: parsed.module || primaryModule,
      difficulty,
      projectLevel: mappedCanonicalLevel,
      problemStatement: parsed.problemStatement || `Build a robust solution for ${primaryModule} in ${course}.`,
      whyThisProject: parsed.whyThisProject || `Provides practical hands-on mastery of ${primaryModule}.`,
      learningObjectives: Array.isArray(parsed.learningObjectives) ? parsed.learningObjectives : [],
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites : [],
      technologies: Array.isArray(parsed.technologies) ? parsed.technologies : [],
      conceptsCovered: Array.isArray(parsed.conceptsCovered) ? parsed.conceptsCovered : [],
      architecture: Array.isArray(parsed.architecture) ? parsed.architecture : [],
      implementationPhases: Array.isArray(parsed.implementationPhases) ? parsed.implementationPhases : [],
      expectedOutput: parsed.expectedOutput || 'Executable software artifact with automated unit tests.',
      testingRequirements: Array.isArray(parsed.testingRequirements) ? parsed.testingRequirements : [],
      githubSubmissionRequirements: Array.isArray(parsed.githubSubmissionRequirements) ? parsed.githubSubmissionRequirements : [],
      evaluationRubric: Array.isArray(parsed.evaluationRubric) ? parsed.evaluationRubric : [],
      commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
      nextRecommendedProject: parsed.nextRecommendedProject || 'Next Module Milestone',
      studentReadiness: readinessResult
    },
    difficulty,
    course,
    curriculum
  );

  return auditedBlueprint;
}

/**
 * Heuristic Blueprint Generator adhering strictly to difficulty tiers.
 */
function generateHeuristicBlueprint(
  course: string,
  primaryModule: string,
  relevantSlice: string[],
  difficulty: AdaptiveProjectBlueprint['difficulty'],
  projectLevel: string,
  curriculum: string[]
): any {
  const isBasic = difficulty === 'BEGINNER' || difficulty === 'BASIC';
  const isFound = difficulty === 'FOUNDATION';
  const isInter = difficulty === 'INTERMEDIATE';
  const isCap = difficulty === 'CAPSTONE';

  let title = '';
  let techs: string[] = [];
  let arch: string[] = [];
  let prereqs: string[] = [];

  const lowerCourse = course.toLowerCase();

  if (isBasic || isFound) {
    if (lowerCourse.includes('devops')) {
      title = 'Linux Server Health & Process Monitoring Script';
      techs = ['Linux (Ubuntu/Debian)', 'Bash / Shell Scripting', 'Cron Scheduler', 'Standard Coreutils'];
      arch = ['CLI Argument Parser', 'System Metrics Ingestion (CPU/RAM/Disk)', 'Threshold Validator & Formatter', 'Audit Log Writer'];
      prereqs = ['Basic Linux command line navigation', 'Text editor usage (nano/vim)'];
    } else if (lowerCourse.includes('python')) {
      title = 'Student Academic Grade & Record Manager CLI';
      techs = ['Python 3.12 (Standard Library)', 'JSON / CSV Storage', 'Custom Exceptions', 'pytest / unittest'];
      arch = ['CLI Interactive Terminal', 'Grade Calculation Engine', 'File Persistence Layer', 'Unit Test Harness'];
      prereqs = ['Python variables, loops, and functions', 'Basic terminal usage'];
    } else if (lowerCourse.includes('data science') || lowerCourse.includes('ai')) {
      title = 'Automated CSV Dataset Profiler & Summary Tool';
      techs = ['Python', 'Pandas', 'NumPy', 'Matplotlib (Basic Plotting)'];
      arch = ['CSV File Parser', 'Statistical Summary Engine', 'Missing Value Detector', 'Report Formatter'];
      prereqs = ['Basic Python syntax', 'Fundamental statistics concepts'];
    } else if (lowerCourse.includes('java')) {
      title = 'High-Frequency Banking Ledger CLI';
      techs = ['Java 21 (Standard Library)', 'Streams API', 'Custom Exceptions', 'JUnit 5'];
      arch = ['CLI Input Controller', 'Account Transaction Service', 'Immutable Audit Logger', 'Unit Test Suite'];
      prereqs = ['Java variables, loops, methods', 'Basic OOP principles'];
    } else {
      title = `Foundational ${primaryModule} Script & Engine`;
      techs = [relevantSlice[0] || 'Core Language', 'Standard File I/O', 'Unit Test Framework'];
      arch = ['Input Parser Layer', 'Domain Logic Engine', 'Storage / State Layer', 'Test Verification Harness'];
      prereqs = ['Basic programming fundamentals', 'Terminal usage'];
    }
  } else if (isInter) {
    title = `Scalable REST API & Dockerized Service for ${primaryModule}`;
    techs = [relevantSlice[0] || 'Backend Framework', 'PostgreSQL / Relational DB', 'Docker', 'RESTful API', 'JUnit / Pytest'];
    arch = ['REST API Gateway / Controller', 'Service Domain Logic', 'Database ORM Repository', 'Automated Test Harness'];
    prereqs = ['Foundational language mastery', 'Basic SQL & Database queries', 'HTTP protocols'];
  } else {
    // Advanced & Capstone
    title = isCap ? `Enterprise Production Capstone: ${course} Platform` : `High-Performance Distributed ${primaryModule} Engine`;
    techs = isCap 
      ? ['Full-Stack Framework', 'Microservices', 'PostgreSQL', 'Redis Cache', 'Apache Kafka / RabbitMQ', 'Docker & Kubernetes', 'Prometheus']
      : ['Core Language Engine', 'Distributed Queue / Cache', 'Docker', 'Relational DB', 'CI/CD Pipeline'];
    arch = ['API Gateway & Auth Proxy', 'Domain Microservice Engine', 'Distributed Cache & Message Queue', 'Telemetry & Health Exporter'];
    prereqs = ['Intermediate systems architecture', 'Containerization and database design', 'Multi-threading / Async paradigms'];
  }

  return {
    projectTitle: title,
    course,
    module: primaryModule,
    difficulty,
    projectLevel,
    problemStatement: `Develop a reliable, well-tested ${difficulty.toLowerCase()} level application in ${course} centered on ${primaryModule}. Focus strictly on clean architecture and zero technical debt.`,
    whyThisProject: `Provides practical, industry-aligned mastery of ${primaryModule} appropriate for ${projectLevel}.`,
    learningObjectives: [
      `Master core paradigms of ${primaryModule}`,
      `Implement clean separation of concerns without over-engineering`,
      `Write unit tests covering normal execution and edge cases`,
      `Document and package repository according to industry best practices`
    ],
    prerequisites: prereqs,
    technologies: techs,
    conceptsCovered: [
      `${primaryModule} fundamentals`,
      'Clean code & defensive programming',
      'Structured error handling',
      'Automated testing standards'
    ],
    architecture: arch,
    implementationPhases: [
      { phase: 'Phase 1: Foundations', title: 'Setup & Domain Models', tasks: ['Set up repository structure', 'Define domain models'] },
      { phase: 'Phase 2: Core Logic', title: 'Implementation', tasks: ['Implement business operations', 'Add exception hierarchy'] },
      { phase: 'Phase 3: Robustness', title: 'Guardrails & Error Handling', tasks: ['Handle boundary conditions', 'Format output'] },
      { phase: 'Phase 4: Verification', title: 'Testing & Documentation', tasks: ['Write unit tests (>80% coverage)', 'Write README.md with run instructions'] }
    ],
    expectedOutput: isBasic || isFound 
      ? 'Clean command-line tool or script with comprehensive passing unit tests.' 
      : 'Production-ready containerized service with verified APIs, test coverage, and documentation.',
    testingRequirements: [
      'Automated test suite with >80% code coverage',
      'Boundary validation for invalid inputs and edge cases',
      'Zero unhandled runtime exceptions'
    ],
    githubSubmissionRequirements: [
      'Public or private GitHub repository link with clean commit history',
      'Immutable Git Commit SHA (40-char snapshot verification)',
      'Comprehensive README.md with setup and architecture instructions'
    ],
    evaluationRubric: [
      { criterion: 'Core Functional Accuracy', points: 25, description: 'All domain logic and problem requirements fully working.' },
      { criterion: 'Architectural Cleanliness & SOLID Principles', points: 25, description: 'Code is cleanly modularized with clear interface boundaries.' },
      { criterion: 'Defensive Programming & Error Handling', points: 25, description: 'Exceptions are caught gracefully with meaningful feedback.' },
      { criterion: 'Automated Tests & Quality Documentation', points: 25, description: 'Unit test suite passes with reproducible documentation.' }
    ],
    commonMistakes: [
      `Skipping error handling when parsing inputs in ${primaryModule}`,
      'Hardcoding configuration parameters instead of flexible arguments',
      'Neglecting unit tests for edge-case failure modes'
    ],
    nextRecommendedProject: isCap 
      ? 'Course Completed: Ready for Technical Portfolio & FAANG Interviews'
      : `Next Milestone in ${curriculum[Math.min(curriculum.length - 1, curriculum.indexOf(primaryModule) + 1)] || 'Next Module'}`
  };
}

/**
 * Audits and enforces strict consistency across all 7 pillars of the project blueprint.
 */
function auditAndEnforceDifficultyConsistency(
  blueprint: AdaptiveProjectBlueprint,
  difficulty: AdaptiveProjectBlueprint['difficulty'],
  course: string,
  curriculum: string[]
): AdaptiveProjectBlueprint {
  const isFoundational = difficulty === 'BEGINNER' || difficulty === 'BASIC' || difficulty === 'FOUNDATION';
  const canonicalLevel = DIFFICULTY_LEVEL_MAP[difficulty] || 'LEVEL 3: INTERMEDIATE';

  // 1. Enforce Exact Canonical Level
  blueprint.projectLevel = canonicalLevel;
  blueprint.difficulty = difficulty;

  // 2. Enforce Strict Anti-Contradiction for Foundational Projects (Level 1 & 2)
  if (isFoundational) {
    // Sanitize Title: Remove "Enterprise", "Microservice", "Distributed", "Cluster", "Kubernetes"
    let sanitizedTitle = blueprint.projectTitle;
    FORBIDDEN_FOUNDATIONAL_KEYWORDS.forEach((kw) => {
      const reg = new RegExp(`\\b${kw}\\b`, 'gi');
      sanitizedTitle = sanitizedTitle.replace(reg, '');
    });
    sanitizedTitle = sanitizedTitle.replace(/Enterprise|Production-Grade|Microservice|Distributed/gi, 'Foundational').trim();
    if (!sanitizedTitle || sanitizedTitle.length < 5) {
      sanitizedTitle = `Foundational ${blueprint.module} Core Application`;
    }
    blueprint.projectTitle = sanitizedTitle;

    // Sanitize Tech Stack: Filter out forbidden enterprise tools
    blueprint.technologies = blueprint.technologies.filter((tech) => {
      const lower = tech.toLowerCase();
      return !FORBIDDEN_FOUNDATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
    });

    if (blueprint.technologies.length === 0) {
      blueprint.technologies = [`${course} Core Standard Library`, 'CLI Parser', 'File I/O Engine', 'Unit Testing Framework'];
    }

    // Sanitize Architecture: Must be single-process foundational components
    blueprint.architecture = blueprint.architecture.filter((arch) => {
      const lower = arch.toLowerCase();
      return !FORBIDDEN_FOUNDATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
    });

    if (blueprint.architecture.length < 3) {
      blueprint.architecture = [
        'CLI Input Controller & Argument Parser',
        'Domain Logic & Business Rules Engine',
        'Local File / Memory State Manager',
        'Automated Unit Test & Verification Suite'
      ];
    }

    // Sanitize Prerequisites: Must NOT require advanced tools
    blueprint.prerequisites = blueprint.prerequisites.filter((p) => {
      const lower = p.toLowerCase();
      return !FORBIDDEN_FOUNDATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
    });

    if (blueprint.prerequisites.length === 0) {
      blueprint.prerequisites = [
        'Basic programming syntax and data types',
        'Command-line / Terminal navigation',
        'Basic Git version control commands'
      ];
    }

    // Sanitize Problem Statement & Why
    FORBIDDEN_FOUNDATIONAL_KEYWORDS.forEach((kw) => {
      const reg = new RegExp(`\\b${kw}\\b`, 'gi');
      blueprint.problemStatement = blueprint.problemStatement.replace(reg, 'core system components');
      blueprint.whyThisProject = blueprint.whyThisProject.replace(reg, 'foundational software engineering');
    });

    // Sanitize Rubric: Must evaluate clean code, core logic, error handling, and unit testing
    blueprint.evaluationRubric = [
      { criterion: 'Core Syntax, OOP & Functional Logic', points: 25, description: 'Correct language syntax, control flow, and accurate domain logic.' },
      { criterion: 'Clean Architecture & Modularity', points: 25, description: 'Separation of concerns, readable variable names, and zero spaghetti code.' },
      { criterion: 'Defensive Programming & Input Validation', points: 25, description: 'Graceful handling of nulls, invalid inputs, and boundary conditions.' },
      { criterion: 'Automated Unit Tests & README Documentation', points: 25, description: 'Automated unit test assertions pass with clear run instructions.' }
    ];

    blueprint.expectedOutput = 'Clean, well-documented command-line application or library with passing automated unit tests.';
  } else if (difficulty === 'CAPSTONE') {
    // Ensure Capstone reflects Level 6 Enterprise scope
    blueprint.projectLevel = 'LEVEL 6: ENTERPRISE CAPSTONE';
    if (!blueprint.projectTitle.toLowerCase().includes('capstone') && !blueprint.projectTitle.toLowerCase().includes('enterprise')) {
      blueprint.projectTitle = `Enterprise Capstone: ${blueprint.projectTitle}`;
    }
  }

  return blueprint;
}
