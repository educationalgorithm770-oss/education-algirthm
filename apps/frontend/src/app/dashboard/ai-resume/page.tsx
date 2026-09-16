'use client';

import React, { useState, useEffect, useRef } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

// ==========================================
// 1. STARTER KITS FOR POPULAR TECH TRACKS
// ==========================================
const STARTER_TRACKS: Record<string, any> = {
  java_fullstack: {
    name: 'Java Full Stack Developer (FAANG Ready)',
    targetRole: 'Senior Java Full Stack Engineer (Java 21, Spring Boot 3 & React)',
    personal: {
      fullName: 'Rahul Sharma',
      title: 'Java Full Stack Software Engineer',
      email: 'rahul.sharma@example.com',
      phone: '+91 98765 43210',
      location: 'Bengaluru, India',
      linkedin: 'linkedin.com/in/rahul-java-fullstack',
      github: 'github.com/rahul-dev-eng',
      portfolio: 'https://rahulsharma.dev',
    },
    summary:
      'Performance-driven Java Full Stack Software Engineer with expertise in architecting high-throughput microservices using Java 21, Spring Boot 3, and React.js. Demonstrated track record of cutting database query P99 latency by 58% and designing idempotent financial payment workflows handling 20,000 requests/sec. Passionate about zero-downtime deployments, distributed caching, and clean, testable system design.',
    skills: {
      languages: ['Java 21', 'TypeScript', 'JavaScript (ES6+)', 'SQL', 'Bash'],
      frameworks: ['Spring Boot 3', 'Spring Security 6', 'Spring Data JPA', 'Hibernate', 'React.js', 'Next.js 14', 'Tailwind CSS'],
      databases: ['PostgreSQL', 'MySQL', 'Redis (Caching & Pub/Sub)', 'MongoDB'],
      cloudDevOps: ['Docker', 'Kubernetes', 'AWS (EC2, S3, RDS)', 'Kafka', 'CI/CD (GitHub Actions)', 'Linux'],
      architecture: ['Microservices', 'RESTful APIs', 'Event-Driven Systems', 'Distributed Locking', 'Idempotency', 'JUnit 5 & Mockito'],
    },
    experience: [
      {
        id: 'exp-1',
        role: 'Software Development Engineer',
        company: 'FinTech Cloud Technologies',
        location: 'Bengaluru, India',
        startDate: '2023-06',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected and deployed high-throughput financial payment microservices using Java 21 Virtual Threads and Spring Boot 3, scaling throughput to 22,000 req/sec.',
          'Engineered multi-level Redis distributed caching layer with Lua atomic scripts, slashing database P99 query latency from 340ms to 24ms across 1.8M daily active users.',
          'Implemented stateless JWT authentication filter with Spring Security 6 and RBAC, safeguarding 15+ internal microservice endpoints against CSRF and BOLA vulnerabilities.',
        ],
      },
      {
        id: 'exp-2',
        role: 'Full Stack Engineering Intern',
        company: 'Nexus Scale Systems',
        location: 'Hyderabad, India',
        startDate: '2022-08',
        endDate: '2023-05',
        current: false,
        bullets: [
          'Developed responsive real-time analytics dashboard using React 18, TypeScript, and Tailwind CSS, increasing operational telemetry visibility by 40%.',
          'Refactored legacy monolithic batch processing jobs into asynchronous Kafka consumer groups, preventing thread starvation during peak checkout spikes.',
          'Wrote 120+ comprehensive unit and integration test suites using JUnit 5 and Mockito, raising backend code coverage from 62% to 91%.',
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Distributed Payment & Billing Engine',
        techStack: 'Java 21, Spring Boot 3, Redis, Kafka, PostgreSQL, Docker',
        link: 'github.com/rahul-dev-eng/distributed-payment-engine',
        liveUrl: 'https://pay-engine.demo.io',
        bullets: [
          'Engineered distributed payment gateway with HMAC-SHA256 signature verification and Redis idempotency keys, eliminating double-charge risks.',
          'Implemented Kafka Dead-Letter Queue (DLQ) retry mechanism with exponential backoff, ensuring 99.99% transaction reliability during network partitions.',
        ],
      },
      {
        id: 'proj-2',
        title: 'AI-Powered Interactive LMS Platform',
        techStack: 'Next.js 14, React, Node.js, Spring Boot, PostgreSQL, Docker Sandbox',
        link: 'github.com/rahul-dev-eng/ai-lms-platform',
        liveUrl: 'https://ai-lms.demo.io',
        bullets: [
          'Built multi-tenant code sandbox running student code inside isolated Docker containers with strict cgroup memory and execution limits.',
          'Integrated RAG vector semantic search over course documents with sub-15ms Cosine Similarity retrieval, assisting 5,000+ students.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Technology in Computer Science & Engineering',
        institution: 'National Institute of Technology (NIT)',
        location: 'India',
        year: '2019 - 2023',
        gpa: '8.8 / 10.0 CGPA',
        honors: 'Dean’s List, President of CS Coding Club, 1st Place Smart India Hackathon',
      },
    ],
    certifications: [
      'Oracle Certified Professional: Java SE 17 Developer (1Z0-829)',
      'AWS Certified Solutions Architect – Associate',
      'Education Algorithm Certified Java Full Stack Architect',
    ],
  },
  genai_engineer: {
    name: 'GenAI & AI Systems Architect',
    targetRole: 'AI Systems & LLM Applications Engineer (Python, RAG & Vector DBs)',
    personal: {
      fullName: 'Ananya Verma',
      title: 'GenAI & Systems Engineer',
      email: 'ananya.verma@example.com',
      phone: '+91 91234 56789',
      location: 'Pune, India',
      linkedin: 'linkedin.com/in/ananya-genai-eng',
      github: 'github.com/ananya-ai-lab',
      portfolio: 'https://ananyaverma.ai',
    },
    summary:
      'AI Systems Engineer specializing in Retrieval-Augmented Generation (RAG), vector databases (Qdrant, Pinecone), and agentic workflows using LangChain and Gemini 3.5. Demonstrated capability in building enterprise knowledge search engines serving 500,000+ queries with sub-20ms semantic retrieval and zero hallucinations.',
    skills: {
      languages: ['Python 3.12', 'TypeScript', 'SQL', 'C++'],
      frameworks: ['LangChain', 'LlamaIndex', 'FastAPI', 'PyTorch', 'Next.js 14', 'React'],
      databases: ['Qdrant (Vector DB)', 'Pinecone', 'PostgreSQL (pgvector)', 'Redis'],
      cloudDevOps: ['Docker', 'AWS Bedrock', 'Hugging Face', 'Kubernetes', 'Git'],
      architecture: ['RAG Pipeline Architecture', 'Dense Embeddings', 'Agentic Workflows', 'Prompt Optimization', 'Cosine Vector Search'],
    },
    experience: [
      {
        id: 'exp-1',
        role: 'AI Solutions Engineer',
        company: 'Cognitive Matrix AI',
        location: 'Pune, India',
        startDate: '2023-07',
        endDate: 'Present',
        current: true,
        bullets: [
          'Engineered multi-modal RAG retrieval pipeline indexing 250,000+ technical PDF documents using BGE embeddings and Qdrant vector database.',
          'Reduced LLM token consumption costs by 48% through prompt compression, chunk deduplication, and semantic cache layers.',
          'Deployed scalable FastAPI microservices orchestrated with Docker, maintaining 99.9% uptime under 15,000 daily active queries.',
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Autonomous Multi-Agent Coding Assistant',
        techStack: 'Python, LangChain, Gemini API, Qdrant, Streamlit',
        link: 'github.com/ananya-ai-lab/multi-agent-coder',
        liveUrl: 'https://agent-coder.demo.ai',
        bullets: [
          'Built autonomous agent team with Planner, Code Generator, and Unit Test Validator subagents for automatic bug fixing.',
          'Achieved 92% automated pass rate on 400+ benchmark Python coding challenges.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'B.Tech in Artificial Intelligence & Data Science',
        institution: 'IIIT Hyderabad',
        location: 'India',
        year: '2019 - 2023',
        gpa: '9.1 / 10.0 CGPA',
        honors: 'Best Capstone Project in Machine Intelligence',
      },
    ],
    certifications: [
      'DeepLearning.AI Generative AI for Software Development',
      'AWS Certified AI Practitioner',
    ],
  },
  fresher_sde: {
    name: 'Fresher SDE / Campus Placement',
    targetRole: 'Software Development Engineer 1 (Core Java, DSA & Full Stack)',
    personal: {
      fullName: 'Vikram Aditya',
      title: 'Aspiring Software Development Engineer (SDE-1)',
      email: 'vikram.aditya@example.com',
      phone: '+91 99887 76655',
      location: 'Hyderabad, India',
      linkedin: 'linkedin.com/in/vikram-sde',
      github: 'github.com/vikram-aditya',
      portfolio: 'https://vikramaditya.dev',
    },
    summary:
      'Passionate Computer Science graduate with strong problem-solving fundamentals (Solved 450+ LeetCode problems in Java). Hands-on proficiency in Core Java, Spring Boot, Data Structures, Algorithms, and React. Built full-stack applications with clean MVC architecture and SQL query optimization.',
    skills: {
      languages: ['Java (Core & OOP)', 'C++', 'JavaScript', 'SQL', 'HTML5/CSS3'],
      frameworks: ['Spring Boot', 'Hibernate / JPA', 'React.js', 'Express.js', 'Tailwind CSS'],
      databases: ['MySQL', 'PostgreSQL', 'MongoDB'],
      cloudDevOps: ['Git', 'GitHub', 'Docker Basics', 'Postman', 'VS Code'],
      architecture: ['Object-Oriented Design (SOLID)', 'Data Structures & Algorithms', 'REST APIs', 'DBMS Normalization'],
    },
    experience: [
      {
        id: 'exp-1',
        role: 'Software Engineering Trainee',
        company: 'Education Algorithm Full Stack Cohort',
        location: 'Remote',
        startDate: '2023-09',
        endDate: '2024-03',
        current: false,
        bullets: [
          'Implemented 25+ real-world RESTful API endpoints in Java and Spring Boot, integrating JWT auth and MySQL database transactions.',
          'Solved 450+ algorithmic coding problems across Arrays, Dynamic Programming, Graphs, and Trees with optimal time/space complexity.',
          'Collaborated with a 4-member agile squad to build an end-to-end Course Management Portal with React frontend.',
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Algorithmic Mock Interview Evaluation Engine',
        techStack: 'Java, Spring Boot, MySQL, React, Tailwind CSS',
        link: 'github.com/vikram-aditya/interview-eval-engine',
        liveUrl: 'https://interview-eval.vercel.app',
        bullets: [
          'Engineered mock interview evaluation platform featuring 5-axis scoring (Technical Accuracy, System Design, Code Quality, Time Complexity).',
          'Optimized MySQL relational schema with composite B-Tree indexes, reducing query execution time from 180ms to 18ms.',
        ],
      },
      {
        id: 'proj-2',
        title: 'Collaborative Real-Time Code Arena',
        techStack: 'Node.js, WebSockets, React, Docker',
        link: 'github.com/vikram-aditya/code-arena-live',
        liveUrl: 'https://code-arena.vercel.app',
        bullets: [
          'Built two-player live coding duel room using WebSockets for sub-10ms keystroke synchronization.',
          'Implemented Docker sandbox execution runner to evaluate submitted Java solutions securely against 15 test cases.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Technology in Computer Science',
        institution: 'JNTU College of Engineering',
        location: 'Hyderabad, India',
        year: '2020 - 2024',
        gpa: '8.6 / 10.0 CGPA',
        honors: 'Rank 1 in College Coding Olympiad, LeetCode Guardian (1980+ Rating)',
      },
    ],
    certifications: [
      'Education Algorithm Java Full Stack Placement Track Certificate',
      'HackerRank Problem Solving (Advanced) Gold Badge',
    ],
  },
};

const SAMPLE_PROMPT_TEMPLATES = [
  {
    label: '☕ Java 21 & Spring Boot 3 SDE-2',
    prompt: 'Senior Java Full Stack Engineer with 3 years experience at a FinTech firm. Specialized in Java 21 virtual threads, Spring Boot 3 microservices, Kafka event streaming, and Redis caching. Reduced database P99 latency by 58% and handled 22k RPS. B.Tech in CS with 8.8 CGPA.',
    role: 'Senior Java Full Stack Engineer',
    expLevel: 'Mid-Level (2-4 Years)',
  },
  {
    label: '🤖 GenAI & RAG Systems Architect',
    prompt: 'AI Systems Engineer with 2 years building multi-modal RAG pipelines, Qdrant vector databases, LangChain agents, and FastAPI microservices. Cut LLM token costs by 48% and indexed 250k documents. B.Tech in AI with 9.1 CGPA.',
    role: 'GenAI & LLM Applications Engineer',
    expLevel: 'Mid-Level (2-4 Years)',
  },
  {
    label: '💻 Fresher Campus SDE (LeetCode 1900+)',
    prompt: '2024 CS Graduate with strong DSA skills (450+ LeetCode problems, 1980 rating). Built a real-time collaborative code arena with WebSockets and Docker sandbox. 6-month internship building Spring Boot REST APIs. 8.6 CGPA.',
    role: 'Associate Software Development Engineer',
    expLevel: 'Fresher / Early Career (0-1 Years)',
  },
  {
    label: '☁️ DevOps & Cloud SRE (AWS & K8s)',
    prompt: 'Cloud & DevOps Engineer with 4 years deploying microservices on AWS EKS, writing Terraform IAC modules, and setting up GitOps pipelines with ArgoCD. Achieved 99.99% uptime and reduced AWS infrastructure spend by 32%.',
    role: 'DevOps & Cloud Infrastructure Engineer',
    expLevel: 'Senior / Lead (4-7 Years)',
  },
];

export default function AdvancedAIResumeBuilderPage() {
  // State for active resume data
  const [resume, setResume] = useState<any>(STARTER_TRACKS.java_fullstack);
  const [selectedTrack, setSelectedTrack] = useState('java_fullstack');
  
  // UI & Customizer State
  const [activeTab, setActiveTab] = useState<'prompt_copilot' | 'info' | 'summary' | 'experience' | 'projects' | 'skills' | 'education' | 'ats_match' | 'cover_letter' | 'interview_prep'>('prompt_copilot');
  const [template, setTemplate] = useState<'faang_classic' | 'modern_tech' | 'architect_split' | 'fresher_academic'>('faang_classic');
  const [accentColor, setAccentColor] = useState('#1e3a8a'); // Navy default

  // AI Operation States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [activeBulletOptions, setActiveBulletOptions] = useState<{ id: string; options: any[] } | null>(null);

  // Prompt Copilot Specific State
  const [promptInput, setPromptInput] = useState('');
  const [promptTargetRole, setPromptTargetRole] = useState('Senior Java Full Stack Engineer');
  const [promptCandidateName, setPromptCandidateName] = useState('Rahul Sharma');
  const [promptExpLevel, setPromptExpLevel] = useState('Mid-Level (2-4 Years)');
  const [promptRefineInput, setPromptRefineInput] = useState('');
  const [promptChatHistory, setPromptChatHistory] = useState<Array<{ id: string; role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      id: 'init-msg',
      role: 'assistant',
      text: '👋 Welcome to the Prompt-Based AI Resume Studio! Describe your engineering background, paste your project notes or target role above, and I will generate a complete FAANG-ready resume with Google XYZ metric bullets.',
      time: 'Just now',
    },
  ]);
  const [resumeHistory, setResumeHistory] = useState<any[]>([]);

  // ATS Match State
  const [targetJobDescription, setTargetJobDescription] = useState('');
  const [atsScorecard, setAtsScorecard] = useState<any>({
    overallScore: 94,
    tierBadge: 'GOLD (FAANG Ready)',
    categoryScores: {
      keywordMatch: 92,
      actionVerbs: 96,
      quantifiableMetrics: 94,
      structureReadability: 96,
    },
    matchedKeywords: ['Java 21', 'Spring Boot 3', 'Microservices', 'PostgreSQL', 'Docker', 'React.js', 'REST APIs', 'Kafka', 'Redis'],
    missingKeywords: ['Kubernetes Deployment', 'JUnit 5 / Mockito', 'CI/CD Pipeline', 'GraphQL'],
    actionableQuickFixes: [
      { id: 'fix_kafka', title: 'Add Event Streaming Keywords', description: 'Explicitly list Kafka event consumers in your FinTech experience bullets.' },
      { id: 'fix_metrics', title: 'Quantify Scale & RPS', description: 'Include data throughput numbers (e.g. 20,000+ req/sec) in your payment engine project.' },
    ],
  });

  // Cover Letter & Interview Prep State
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [generatedInterviewQuestions, setGeneratedInterviewQuestions] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState('Auto-saved to LocalStorage');

  // Print ref
  const resumePrintRef = useRef<HTMLDivElement>(null);
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize prompt textarea
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.style.height = 'auto';
      promptInputRef.current.style.height = `${Math.min(promptInputRef.current.scrollHeight, 260)}px`;
    }
  }, [promptInput]);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ea_ai_resume_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.personal?.fullName) {
          setResume(parsed);
          setPromptCandidateName(parsed.personal?.fullName || 'Rahul Sharma');
          setPromptTargetRole(parsed.personal?.title || parsed.targetRole || 'Software Engineer');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('ea_ai_resume_data_v2', JSON.stringify(resume));
      setSaveStatus('Auto-saved just now');
      const t = setTimeout(() => setSaveStatus('Auto-saved to LocalStorage'), 3000);
      return () => clearTimeout(t);
    } catch {
      // ignore
    }
  }, [resume]);

  // Handle starter kit switch
  const handleTrackSelect = (trackKey: string) => {
    if (STARTER_TRACKS[trackKey]) {
      setSelectedTrack(trackKey);
      const trackData = STARTER_TRACKS[trackKey];
      setResume(trackData);
      setPromptCandidateName(trackData.personal?.fullName);
      setPromptTargetRole(trackData.targetRole);
      setAtsScorecard(null);
    }
  };

  // 1. PROMPT ACTION: Full Resume Creation from Prompt
  const handleGenerateResumeFromPrompt = async (customPrompt?: string) => {
    const textToUse = customPrompt || promptInput;
    if (!textToUse.trim()) {
      alert('Please enter a description or pick a starter prompt chip!');
      return;
    }

    setAiLoading(true);
    setAiMessage('✨ Gemini 1.5 Flash: Synthesizing FAANG-Grade ATS Resume...');
    
    // Save snapshot to history
    setResumeHistory((prev) => [...prev, JSON.parse(JSON.stringify(resume))]);

    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prompt_create_resume',
          userPrompt: textToUse,
          targetRole: promptTargetRole,
          candidateName: promptCandidateName,
          experienceLevel: promptExpLevel,
          cohortTrack: STARTER_TRACKS[selectedTrack]?.name,
          targetJobDescription: targetJobDescription || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.resume) {
        setResume(data.resume);
        if (data.atsScoreEstimate) {
          setAtsScorecard((prev: any) => ({
            ...prev,
            overallScore: data.atsScoreEstimate,
            tierBadge: data.atsScoreEstimate >= 90 ? 'GOLD (FAANG Ready)' : 'SILVER (Strong Match)',
            matchedKeywords: data.topKeywords || prev?.matchedKeywords || [],
          }));
        }

        // Add to prompt chat
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setPromptChatHistory((prev) => [
          ...prev,
          {
            id: `usr-${Date.now()}`,
            role: 'user',
            text: textToUse,
            time: now,
          },
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: `✅ Generated complete ${data.resume.targetRole || 'Software Engineering'} resume with Google XYZ metric bullets and ${data.topKeywords?.length || 7} ATS keywords! Review the live canvas on the right or refine specific sections below.`,
            time: now,
          },
        ]);
        setPromptInput('');
      } else {
        alert(data.message || 'Failed to generate resume from prompt.');
      }
    } catch (err) {
      console.error('Prompt generate error:', err);
      alert('Network or AI engine error while generating resume.');
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 2. PROMPT ACTION: Conversational Multi-Turn Refinement
  const handleRefineResumeChat = async (instructionText?: string) => {
    const instruction = instructionText || promptRefineInput;
    if (!instruction.trim()) return;

    setAiLoading(true);
    setAiMessage('✨ Gemini 1.5 Flash: Refining resume sections...');
    
    // Save snapshot
    setResumeHistory((prev) => [...prev, JSON.parse(JSON.stringify(resume))]);

    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_resume_chat',
          currentResume: resume,
          userInstruction: instruction,
        }),
      });

      const data = await res.json();
      if (data.success && data.updatedResume) {
        setResume(data.updatedResume);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setPromptChatHistory((prev) => [
          ...prev,
          {
            id: `usr-${Date.now()}`,
            role: 'user',
            text: instruction,
            time: now,
          },
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: `✨ ${data.changelog || 'Applied your requested updates to the resume.'}`,
            time: now,
          },
        ]);
        setPromptRefineInput('');
      } else {
        alert(data.message || 'Failed to refine resume.');
      }
    } catch (err) {
      console.error('Refine error:', err);
      alert('Error communicating with AI resume engine.');
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // Undo / Revert resume change
  const handleUndo = () => {
    if (resumeHistory.length === 0) return;
    const previous = resumeHistory[resumeHistory.length - 1];
    setResume(previous);
    setResumeHistory((prev) => prev.slice(0, prev.length - 1));
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setPromptChatHistory((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        text: '↩️ Reverted resume to previous version.',
        time: now,
      },
    ]);
  };

  // 1. AI Action: Enhance Bullet Point with XYZ Formula
  const handleAIEnhanceBullet = async (targetId: string, currentBullet: string, roleTitle: string) => {
    setAiLoading(true);
    setAiMessage('Running Google XYZ Metric Booster (Gemini 3.5 Flash)...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enhance_bullet',
          rawBullet: currentBullet,
          role: roleTitle,
          techStack: resume.skills?.frameworks?.join(', ') || 'Java, Spring Boot, React, SQL',
          tone: 'faang',
        }),
      });
      const data = await res.json();
      if (data.success && data.options?.length) {
        setActiveBulletOptions({ id: targetId, options: data.options });
      }
    } catch (err) {
      console.error('Bullet enhance error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 2. AI Action: Polish / Generate Executive Summary
  const handleAIPolishSummary = async () => {
    setAiLoading(true);
    setAiMessage('Generating FAANG-tailored Executive Summary...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_summary',
          role: resume.personal?.title || resume.targetRole,
          yearsExperience: selectedTrack === 'fresher_sde' ? 'Fresher (0-1 yrs)' : 'Senior (2-5 yrs)',
          topSkills: [...(resume.skills?.languages || []), ...(resume.skills?.frameworks || [])],
          careerTrack: STARTER_TRACKS[selectedTrack]?.name,
        }),
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setResume((prev: any) => ({ ...prev, summary: data.summary }));
      }
    } catch (err) {
      console.error('Summary generator error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 3. AI Action: Run Deep ATS Audit / Job Description Match
  const handleRunATSAudit = async () => {
    setAiLoading(true);
    setAiMessage('Auditing ATS keywords & calculating match score...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze_ats',
          resumeData: resume,
          jobDescription: targetJobDescription || undefined,
          targetRole: resume.targetRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAtsScorecard(data);
      }
    } catch (err) {
      console.error('ATS audit error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 4. AI Action: One-Click Auto-Tailor to Job Description
  const handleAutoTailorResume = async () => {
    if (!targetJobDescription.trim()) {
      alert('Please paste a Job Description first in the Target & ATS Match tab!');
      return;
    }
    setAiLoading(true);
    setAiMessage('Auto-tailoring resume keywords to match job posting...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'tailor_resume',
          resumeData: resume,
          jobDescription: targetJobDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResume((prev: any) => ({
          ...prev,
          summary: data.tailoredSummary || prev.summary,
        }));
        // Re-run ATS audit
        handleRunATSAudit();
      }
    } catch (err) {
      console.error('Auto tailor error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 5. AI Action: Generate Matching Cover Letter
  const handleGenerateCoverLetter = async () => {
    setAiLoading(true);
    setAiMessage('Crafting customized 3-paragraph Cover Letter...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_cover_letter',
          candidateName: resume.personal?.fullName,
          targetRole: resume.personal?.title || resume.targetRole,
          companyName: 'Target Engineering Organization',
          topProjects: resume.projects?.map((p: any) => p.title).join(', '),
          resumeData: resume,
        }),
      });
      const data = await res.json();
      if (data.success && data.coverLetter) {
        setGeneratedCoverLetter(data.coverLetter);
        setActiveTab('cover_letter');
      }
    } catch (err) {
      console.error('Cover letter error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 6. AI Action: Generate Resume-to-Interview Prep Pack
  const handleGenerateInterviewPrep = async () => {
    setAiLoading(true);
    setAiMessage('Generating 5 tailored interview questions from your resume...');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_interview_prep',
          resumeData: resume,
          targetRole: resume.personal?.title || resume.targetRole,
        }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setGeneratedInterviewQuestions(data.questions);
        setActiveTab('interview_prep');
      }
    } catch (err) {
      console.error('Interview prep error:', err);
    } finally {
      setAiLoading(false);
      setAiMessage('');
    }
  };

  // 1-Click Keyword Injection from ATS chips
  const handleInjectKeyword = (keyword: string) => {
    setResume((prev: any) => {
      const currentTools = prev.skills?.cloudDevOps || [];
      if (!currentTools.includes(keyword)) {
        return {
          ...prev,
          skills: {
            ...prev.skills,
            cloudDevOps: [...currentTools, keyword],
          },
        };
      }
      return prev;
    });
    // Remove from missing list
    if (atsScorecard?.missingKeywords) {
      setAtsScorecard((prev: any) => ({
        ...prev,
        missingKeywords: prev.missingKeywords.filter((k: string) => k !== keyword),
        matchedKeywords: [...(prev.matchedKeywords || []), keyword],
        overallScore: Math.min(99, (prev.overallScore || 85) + 3),
      }));
    }
  };

  // Copy Clean Plaintext to Clipboard
  const handleCopyPlaintext = async () => {
    const text = `
${resume.personal?.fullName?.toUpperCase()}
${resume.personal?.title} | ${resume.personal?.location}
Email: ${resume.personal?.email} | Phone: ${resume.personal?.phone}
LinkedIn: ${resume.personal?.linkedin} | GitHub: ${resume.personal?.github}

PROFESSIONAL SUMMARY
${resume.summary}

TECHNICAL SKILLS
- Languages: ${resume.skills?.languages?.join(', ')}
- Frameworks: ${resume.skills?.frameworks?.join(', ')}
- Databases: ${resume.skills?.databases?.join(', ')}
- Cloud & Tools: ${resume.skills?.cloudDevOps?.join(', ')}

PROFESSIONAL EXPERIENCE
${resume.experience?.map((e: any) => `
${e.role} — ${e.company} (${e.startDate} - ${e.endDate})
${e.bullets?.map((b: string) => `• ${b}`).join('\n')}
`).join('\n')}

PROJECTS
${resume.projects?.map((p: any) => `
${p.title} | ${p.techStack}
Link: ${p.link}
${p.bullets?.map((b: string) => `• ${b}`).join('\n')}
`).join('\n')}

EDUCATION
${resume.education?.map((ed: any) => `
${ed.degree} — ${ed.institution} (${ed.year})
GPA: ${ed.gpa} | ${ed.honors}
`).join('\n')}

CERTIFICATIONS
${resume.certifications?.map((c: string) => `• ${c}`).join('\n')}
    `.trim();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch {
      // Fallback
    }
    alert('✅ ATS-Clean Plaintext copied to clipboard! Ready to paste into job portals.');
  };

  // Download JSON Backup
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(resume, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${resume.personal?.fullName?.toLowerCase().replace(/\s+/g, '_')}_resume.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print PDF trigger
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-900">
      <div className="print:hidden">
        <StudentNavbar />
      </div>

      {/* Top Controls & Career Studio Bar */}
      <section className="bg-white border-b border-slate-200 py-3 px-3 sm:px-6 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          
          {/* Left Title & Status */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 min-w-0">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-bold transition shrink-0"
              title="Back to Dashboard"
            >
              &larr;
            </Link>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
                <h1 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                  AI Resume Career Studio
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black rounded-full uppercase tracking-wider whitespace-nowrap shrink-0">
                  Gemini 3.5 Flash
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                {saveStatus}
              </p>
            </div>
          </div>

          {/* Right Controls & Actions Bar */}
          <div className="flex flex-wrap items-center justify-start xl:justify-end gap-1.5 sm:gap-2">
            
            {/* Starter Kit Selector */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden md:inline">Starter Kit:</span>
              <select
                value={selectedTrack}
                onChange={(e) => handleTrackSelect(e.target.value)}
                className="text-xs font-bold py-1.5 px-2 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-600 cursor-pointer max-w-[150px] sm:max-w-[220px] truncate"
              >
                <option value="java_fullstack">☕ Java Full Stack</option>
                <option value="genai_engineer">🤖 GenAI Architect</option>
                <option value="fresher_sde">💻 Fresher SDE / Campus</option>
              </select>
            </div>

            {/* Template Picker */}
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as any)}
              className="text-xs font-bold py-1.5 px-2 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 max-w-[130px] sm:max-w-none truncate"
            >
              <option value="faang_classic">📄 FAANG Classic</option>
              <option value="modern_tech">✨ Modern Silicon</option>
              <option value="architect_split">🏗️ Architect 2-Col</option>
              <option value="fresher_academic">🎓 Fresher &amp; Academic</option>
            </select>

            {/* Accent Color Picker */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
              {[
                { color: '#1e3a8a', label: 'Navy' },
                { color: '#4338ca', label: 'Indigo' },
                { color: '#065f46', label: 'Emerald' },
                { color: '#0f172a', label: 'Slate' },
                { color: '#881337', label: 'Burgundy' },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setAccentColor(c.color)}
                  title={c.label}
                  className={`w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-md transition-transform ${accentColor === c.color ? 'scale-110 ring-2 ring-offset-1 ring-slate-900' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>

            {/* Plaintext Copy */}
            <button
              onClick={handleCopyPlaintext}
              title="Copy ATS-Safe Plaintext"
              className="py-1.5 px-2 sm:px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1 shrink-0"
            >
              <i className="fa-solid fa-copy text-[11px]"></i>
              <span className="hidden md:inline">Plaintext</span>
            </button>

            {/* JSON Export */}
            <button
              onClick={handleExportJSON}
              title="Backup JSON Resume"
              className="py-1.5 px-2 sm:px-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1 shrink-0"
            >
              <i className="fa-solid fa-download text-[11px]"></i>
              <span className="hidden md:inline">JSON</span>
            </button>

            {/* Primary Print / PDF Button */}
            <button
              onClick={handlePrintPDF}
              className="py-1.5 px-2.5 sm:px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-sm transition flex items-center space-x-1.5 shrink-0"
            >
              <i className="fa-solid fa-file-pdf text-[11px]"></i>
              <span className="text-[11px] sm:text-xs">PDF</span>
            </button>
          </div>

        </div>
      </section>
      {/* AI Loading Banner */}
      {aiLoading && (
        <div className="bg-indigo-600 text-white text-xs font-bold py-2.5 px-4 text-center animate-pulse flex items-center justify-center space-x-2 print:hidden">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span>{aiMessage || 'AI Co-Pilot Processing...'}</span>
        </div>
      )}

      {/* Main Studio Area: 2-Column Split (Left: Interactive Builder / Right: Live Canvas) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: INTERACTIVE FORM BUILDER & AI CO-PILOT (5 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col max-h-[calc(100vh-140px)] sticky top-24 overflow-hidden print:hidden">
          
          {/* Section Navigation Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto p-2 gap-1 bg-slate-50 scrollbar-none">
            {[
              { key: 'prompt_copilot', label: '🤖 AI Copilot', badge: 'NEW' },
              { key: 'info', label: '👤 Info' },
              { key: 'ats_match', label: '🎯 ATS Match' },
              { key: 'summary', label: '📝 Summary' },
              { key: 'experience', label: '💼 Experience' },
              { key: 'projects', label: '🚀 Projects' },
              { key: 'skills', label: '⚡ Skills' },
              { key: 'education', label: '🎓 Education' },
              { key: 'cover_letter', label: '✉️ Cover Letter' },
              { key: 'interview_prep', label: '🎙️ Interview Prep' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-3 text-xs font-black rounded-xl transition whitespace-nowrap flex items-center space-x-1.5 shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[9px] font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active Tab Form Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">

            {/* TAB 0: PROMPT-TO-RESUME COPILOT */}
            {activeTab === 'prompt_copilot' && (
              <div className="space-y-5">
                
                {/* Copilot Header */}
                <div className="p-3.5 bg-gradient-to-br from-indigo-50 via-purple-50 to-white rounded-2xl border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        ✨
                      </span>
                      <h3 className="text-sm font-black text-slate-900">
                        Prompt-Based Resume Creator
                      </h3>
                    </div>
                    {resumeHistory.length > 0 && (
                      <button
                        onClick={handleUndo}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center space-x-1 shadow-sm transition"
                        title="Revert last change"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    Describe your tech skills, target company or role, and project achievements. Gemini will generate a structured, FAANG-ready resume with Google XYZ metric bullets.
                  </p>
                </div>

                {/* Candidate Quick Meta */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Your Full Name</label>
                    <input
                      type="text"
                      value={promptCandidateName}
                      onChange={(e) => setPromptCandidateName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Target Role</label>
                    <input
                      type="text"
                      value={promptTargetRole}
                      onChange={(e) => setPromptTargetRole(e.target.value)}
                      placeholder="e.g. Senior Java Full Stack SDE"
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Experience Level</label>
                    <select
                      value={promptExpLevel}
                      onChange={(e) => setPromptExpLevel(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    >
                      <option value="Fresher / Early Career (0-1 Years)">🎓 Fresher / Early Career (0-1 Years)</option>
                      <option value="Mid-Level (2-4 Years)">💼 Mid-Level SDE (2-4 Years)</option>
                      <option value="Senior / Lead (4-7 Years)">🚀 Senior / Lead Engineer (4-7 Years)</option>
                      <option value="Principal / Staff (7+ Years)">🏛️ Principal / Staff Architect (7+ Years)</option>
                    </select>
                  </div>
                </div>

                {/* Fast Starter Chips */}
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-500 text-[11px] block">⚡ One-Click Starter Prompt Chips:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_PROMPT_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPromptInput(tmpl.prompt);
                          setPromptTargetRole(tmpl.role);
                          setPromptExpLevel(tmpl.expLevel);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 font-bold rounded-xl text-[11px] transition text-left"
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Natural Language Prompt Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Your Engineering Background &amp; Focus:</label>
                    <span className="text-[10px] text-slate-400">Natural language input</span>
                  </div>
                  <textarea
                    ref={promptInputRef}
                    rows={4}
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleGenerateResumeFromPrompt();
                      }
                    }}
                    placeholder="e.g. 3 years as Java backend engineer at a fintech startup. Designed payment microservices in Java 21, Spring Boot 3, Redis, and Kafka. Cut DB P99 latency by 50% for 1.8M users. Built multi-tenant LMS with Docker sandbox. NIT CS graduate with 8.8 CGPA..."
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-900 font-medium leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Tip: Press <kbd className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[9px]">Ctrl+Enter</kbd> to generate</span>
                    <button
                      onClick={() => handleGenerateResumeFromPrompt()}
                      disabled={aiLoading}
                      className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Generate Full Resume</span>
                    </button>
                  </div>
                </div>

                {/* Conversational Multi-Turn Refiner */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-xs font-black uppercase text-slate-800">
                        💬 Conversational Resume Refiner
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Multi-Turn Iteration</span>
                  </div>

                  {/* Refine History Timeline */}
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-[11px]">
                    {promptChatHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-xl space-y-0.5 ${
                          msg.role === 'user'
                            ? 'bg-indigo-600 text-white ml-6 font-medium shadow-sm'
                            : 'bg-white text-slate-800 mr-4 border border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[9px] opacity-75">
                          <span>{msg.role === 'user' ? 'Candidate' : 'AI Resume Copilot'}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="leading-relaxed">{msg.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quick Refine Chips */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      '✨ Make all bullets strictly follow Google XYZ formula',
                      '⚡ Focus project 1 heavily on Kafka & Redis idempotency',
                      '📉 Shorten summary to 2 punchy sentences',
                      '🚀 Tailor skills matrix for High-Scale FinTech SDE-2',
                      '🐳 Add Docker, Kubernetes & Terraform into Cloud skills',
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRefineResumeChat(chip)}
                        disabled={aiLoading}
                        className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold transition shadow-xs"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Refine Input */}
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={promptRefineInput}
                      onChange={(e) => setPromptRefineInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRefineResumeChat();
                        }
                      }}
                      placeholder="e.g. 'Add AWS S3 and DynamoDB to project 2' or 'Make experience bullets shorter'..."
                      className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-600"
                    />
                    <button
                      onClick={() => handleRefineResumeChat()}
                      disabled={aiLoading || !promptRefineInput.trim()}
                      className="py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl text-xs flex items-center space-x-1 transition shrink-0"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 1: PERSONAL INFO */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">Contact &amp; Header Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={resume.personal?.fullName || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, fullName: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={resume.personal?.title || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, title: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email</label>
                    <input
                      type="email"
                      value={resume.personal?.email || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, email: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={resume.personal?.phone || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, phone: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Location</label>
                    <input
                      type="text"
                      value={resume.personal?.location || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, location: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">LinkedIn URL</label>
                    <input
                      type="text"
                      value={resume.personal?.linkedin || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, linkedin: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">GitHub Profile</label>
                    <input
                      type="text"
                      value={resume.personal?.github || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, github: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Portfolio / Website</label>
                    <input
                      type="text"
                      value={resume.personal?.portfolio || ''}
                      onChange={(e) => setResume({ ...resume, personal: { ...resume.personal, portfolio: e.target.value } })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TARGET & ATS JOB MATCHER */}
            {activeTab === 'ats_match' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Target Job Description &amp; ATS Deep-Match</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black">
                    Live Diff
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Paste the job posting description below (from LinkedIn, Google Careers, Amazon, or Naukri). The AI will compare your resume, find keyword gaps, and 1-click tailor your points.
                </p>

                <textarea
                  rows={6}
                  value={targetJobDescription}
                  onChange={(e) => setTargetJobDescription(e.target.value)}
                  placeholder="Paste Target Job Description here (Requirements, Responsibilities, Tech Stack)..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono text-[11px] focus:ring-2 focus:ring-indigo-600"
                ></textarea>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRunATSAudit}
                    disabled={aiLoading}
                    className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                  >
                    <i className="fa-solid fa-magnifying-glass-chart"></i>
                    <span>Run ATS Keyword Audit</span>
                  </button>
                  <button
                    onClick={handleAutoTailorResume}
                    disabled={aiLoading}
                    className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow transition flex items-center justify-center space-x-1.5"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>1-Click Auto-Tailor</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: SUMMARY */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Executive Summary</h3>
                  <button
                    onClick={handleAIPolishSummary}
                    disabled={aiLoading}
                    className="py-1 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>✨ AI Polish Summary</span>
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={resume.summary || ''}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  placeholder="Write 2-3 high impact sentences outlining your technical specializations and metrics..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium leading-relaxed focus:ring-2 focus:ring-indigo-600 text-xs"
                ></textarea>
              </div>
            )}

            {/* TAB 4: EXPERIENCE */}
            {activeTab === 'experience' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Work Experience</h3>
                  <button
                    onClick={() => {
                      const newExp = {
                        id: `exp-${Date.now()}`,
                        role: 'Software Development Engineer',
                        company: 'Tech Enterprise Corp',
                        location: 'Bengaluru, India',
                        startDate: '2023-01',
                        endDate: 'Present',
                        current: true,
                        bullets: [
                          'Engineered scalable microservices in Java 21 & Spring Boot 3 handling 10,000+ requests/sec.',
                        ],
                      };
                      setResume({ ...resume, experience: [...(resume.experience || []), newExp] });
                    }}
                    className="py-1 px-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    + Add Role
                  </button>
                </div>

                {resume.experience?.map((exp: any, expIdx: number) => (
                  <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Job Title"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[expIdx].role = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Company Name"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[expIdx].company = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Dates (e.g. 2023-06 - Present)"
                        value={`${exp.startDate} - ${exp.endDate}`}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          const [s, end] = e.target.value.split(' - ');
                          updated[expIdx].startDate = s || '';
                          updated[expIdx].endDate = end || '';
                          setResume({ ...resume, experience: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[expIdx].location = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                    </div>

                    {/* Bullets */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 block">Achievement Bullets (Google XYZ Formula)</label>
                      {exp.bullets?.map((bullet: string, bIdx: number) => {
                        const bulletKey = `${exp.id}-${bIdx}`;
                        return (
                          <div key={bIdx} className="space-y-1.5">
                            <div className="flex items-start space-x-1.5">
                              <textarea
                                rows={2}
                                value={bullet}
                                onChange={(e) => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].bullets[bIdx] = e.target.value;
                                  setResume({ ...resume, experience: updated });
                                }}
                                className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                              />
                              <button
                                onClick={() => handleAIEnhanceBullet(bulletKey, bullet, exp.role)}
                                title="Run AI Metric Booster"
                                className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px]"
                              >
                                ✨ Boost
                              </button>
                              <button
                                onClick={() => {
                                  const updated = [...resume.experience];
                                  updated[expIdx].bullets = updated[expIdx].bullets.filter((_: any, i: number) => i !== bIdx);
                                  setResume({ ...resume, experience: updated });
                                }}
                                className="py-2 px-2 text-slate-400 hover:text-red-600 text-xs"
                              >
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>

                            {/* Active AI Suggestions Drawer for this bullet */}
                            {activeBulletOptions?.id === bulletKey && (
                              <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 animate-fade-in">
                                <div className="flex items-center justify-between text-[11px] font-black text-indigo-900">
                                  <span>✨ AI-Generated XYZ Metric Options:</span>
                                  <button
                                    onClick={() => setActiveBulletOptions(null)}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    &times;
                                  </button>
                                </div>
                                {activeBulletOptions.options.map((opt: any, optIdx: number) => (
                                  <div
                                    key={optIdx}
                                    onClick={() => {
                                      const updated = [...resume.experience];
                                      updated[expIdx].bullets[bIdx] = opt.bullet;
                                      setResume({ ...resume, experience: updated });
                                      setActiveBulletOptions(null);
                                    }}
                                    className="p-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-400 cursor-pointer text-[11px] text-slate-800 transition space-y-1 shadow-sm"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                                        {opt.actionVerb}
                                      </span>
                                      <span className="text-indigo-600 font-bold text-[10px]">
                                        {opt.metricHighlight}
                                      </span>
                                    </div>
                                    <p className="leading-tight">{opt.bullet}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      <button
                        onClick={() => {
                          const updated = [...resume.experience];
                          updated[expIdx].bullets.push('Architected distributed caching and query optimization pipelines.');
                          setResume({ ...resume, experience: updated });
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:underline"
                      >
                        + Add Bullet Point
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: PROJECTS */}
            {activeTab === 'projects' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Technical Capstone Projects</h3>
                  <button
                    onClick={() => {
                      const newProj = {
                        id: `proj-${Date.now()}`,
                        title: 'Distributed Microservices Event Hub',
                        techStack: 'Java 21, Spring Boot 3, Kafka, Redis, Docker',
                        link: 'github.com/rahul-dev-eng/project-hub',
                        liveUrl: 'https://demo.io',
                        bullets: [
                          'Architected event-driven microservices architecture handling 15,000 requests/sec with Kafka consumer groups.',
                        ],
                      };
                      setResume({ ...resume, projects: [...(resume.projects || []), newProj] });
                    }}
                    className="py-1 px-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                  >
                    + Add Project
                  </button>
                </div>

                {resume.projects?.map((proj: any, pIdx: number) => (
                  <div key={proj.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Project Title"
                        value={proj.title}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[pIdx].title = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Tech Stack (e.g. Java 21, Spring Boot, Redis)"
                        value={proj.techStack}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[pIdx].techStack = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium"
                      />
                      <input
                        type="text"
                        placeholder="GitHub Link (github.com/...)"
                        value={proj.link}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[pIdx].link = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="Live Demo URL"
                        value={proj.liveUrl || ''}
                        onChange={(e) => {
                          const updated = [...resume.projects];
                          updated[pIdx].liveUrl = e.target.value;
                          setResume({ ...resume, projects: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                    </div>

                    {/* Project Bullets */}
                    <div className="space-y-2">
                      <label className="font-bold text-slate-700 block">Project Accomplishments</label>
                      {proj.bullets?.map((bullet: string, bIdx: number) => (
                        <div key={bIdx} className="flex items-start space-x-1.5">
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const updated = [...resume.projects];
                              updated[pIdx].bullets[bIdx] = e.target.value;
                              setResume({ ...resume, projects: updated });
                            }}
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900"
                          />
                          <button
                            onClick={() => handleAIEnhanceBullet(`proj-${proj.id}-${bIdx}`, bullet, proj.title)}
                            title="Boost Metric"
                            className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold text-[11px]"
                          >
                            ✨ Boost
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 6: SKILLS MATRIX */}
            {activeTab === 'skills' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">Categorized Skills Matrix</h3>
                
                {[
                  { key: 'languages', label: 'Programming Languages' },
                  { key: 'frameworks', label: 'Frameworks & Libraries' },
                  { key: 'databases', label: 'Databases & Caching' },
                  { key: 'cloudDevOps', label: 'Cloud, DevOps & Streaming' },
                  { key: 'architecture', label: 'Architecture & System Design' },
                ].map((cat) => (
                  <div key={cat.key} className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">{cat.label}</label>
                    <input
                      type="text"
                      value={resume.skills?.[cat.key]?.join(', ') || ''}
                      onChange={(e) => {
                        const parts = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setResume({
                          ...resume,
                          skills: { ...resume.skills, [cat.key]: parts },
                        });
                      }}
                      placeholder="Comma-separated items (e.g. Java 21, Python, TypeScript)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-bold"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: EDUCATION */}
            {activeTab === 'education' && (
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase">Education &amp; Certifications</h3>
                {resume.education?.map((ed: any, edIdx: number) => (
                  <div key={ed.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Degree Name"
                        value={ed.degree}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[edIdx].degree = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Institution / University"
                        value={ed.institution}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[edIdx].institution = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <input
                        type="text"
                        placeholder="Year (e.g. 2020 - 2024)"
                        value={ed.year}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[edIdx].year = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                      <input
                        type="text"
                        placeholder="GPA / Score"
                        value={ed.gpa}
                        onChange={(e) => {
                          const updated = [...resume.education];
                          updated[edIdx].gpa = e.target.value;
                          setResume({ ...resume, education: updated });
                        }}
                        className="p-2 bg-white border border-slate-300 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>
                ))}

                <div className="space-y-1.5 pt-2">
                  <label className="font-bold text-slate-700 block">Certifications &amp; Licenses</label>
                  <textarea
                    rows={3}
                    value={resume.certifications?.join('\n') || ''}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
                      setResume({ ...resume, certifications: lines });
                    }}
                    placeholder="One certification per line..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs"
                  ></textarea>
                </div>
              </div>
            )}

            {/* TAB 8: AI COVER LETTER */}
            {activeTab === 'cover_letter' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">AI Tailored Cover Letter</h3>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={aiLoading}
                    className="py-1 px-3 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Generate Cover Letter</span>
                  </button>
                </div>

                {generatedCoverLetter ? (
                  <div className="space-y-3">
                    <textarea
                      rows={12}
                      value={generatedCoverLetter}
                      onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs leading-relaxed font-mono"
                    ></textarea>
                    <button
                      onClick={async () => {
                        try {
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(generatedCoverLetter);
                          }
                        } catch {
                          // Fallback
                        }
                        alert('✅ Cover letter copied to clipboard!');
                      }}
                      className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-copy"></i>
                      <span>Copy Cover Letter</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <i className="fa-solid fa-envelope-open-text text-2xl text-indigo-500"></i>
                    <p className="font-bold text-slate-700">No cover letter generated yet.</p>
                    <p className="text-[11px] text-slate-500">
                      Click the button above to create a tailored 3-paragraph pitch matching your resume.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 9: AI INTERVIEW PREP */}
            {activeTab === 'interview_prep' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Resume-to-Interview Bridge</h3>
                  <button
                    onClick={handleGenerateInterviewPrep}
                    disabled={aiLoading}
                    className="py-1 px-3 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1"
                  >
                    <i className="fa-solid fa-microphone"></i>
                    <span>Generate 5 Questions</span>
                  </button>
                </div>

                {generatedInterviewQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {generatedInterviewQuestions.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-black text-[10px]">
                            {q.type}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {q.difficulty}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 text-xs">{q.question}</p>
                        <p className="text-[11px] text-slate-600 italic">Target: {q.expectedFocus}</p>
                      </div>
                    ))}
                    <Link
                      href="/dashboard/ai-interview"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 block text-center"
                    >
                      <span>Practice in AI Mock Interview Arena &rarr;</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
                    <i className="fa-solid fa-headset text-2xl text-purple-500"></i>
                    <p className="font-bold text-slate-700">Interview questions based on your projects.</p>
                    <p className="text-[11px] text-slate-500">
                      Generate 5 FAANG-grade technical &amp; behavioral questions extracted from your specific resume bullets.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: LIVE ATS RADAR & PIXEL-PERFECT RESUME CANVAS (7 Cols) */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">

          {/* Gamified ATS Quality Radar Box */}
          {atsScorecard && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4 print:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-xl">
                    {atsScorecard.overallScore || 90}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">FAANG ATS Screening Index</span>
                    <h4 className="text-sm font-black text-slate-900">{atsScorecard.tierBadge || 'GOLD (FAANG Ready)'}</h4>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRunATSAudit}
                    className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    <i className="fa-solid fa-rotate-right me-1"></i> Re-Score
                  </button>
                </div>
              </div>

              {/* 4 Dimension Mini Meters */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Keywords</span>
                  <span className="text-xs font-black text-indigo-600">{atsScorecard.categoryScores?.keywordMatch || 90}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Action Verbs</span>
                  <span className="text-xs font-black text-emerald-600">{atsScorecard.categoryScores?.actionVerbs || 94}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Metrics (XYZ)</span>
                  <span className="text-xs font-black text-purple-600">{atsScorecard.categoryScores?.quantifiableMetrics || 92}%</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Readability</span>
                  <span className="text-xs font-black text-blue-600">{atsScorecard.categoryScores?.structureReadability || 96}%</span>
                </div>
              </div>

              {/* Missing High-Yield Keywords with 1-Click Injection */}
              {atsScorecard.missingKeywords?.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">Missing High-Yield Tech Keywords:</span>
                    <span className="text-[10px] text-slate-400">Click to +Add into Resume</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {atsScorecard.missingKeywords.map((kw: string, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleInjectKeyword(kw)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                      >
                        <span>+ {kw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* THE RESUME PAPER CANVAS (Exact 8.5" x 11" 1-Page Layout)   */}
          {/* ========================================================= */}
          <div
            ref={resumePrintRef}
            id="resume-printable-area"
            className="bg-white shadow-xl rounded-2xl border border-slate-200 p-8 sm:p-10 font-sans text-slate-900 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:rounded-none"
            style={{
              minHeight: '1050px',
              maxWidth: '850px',
              margin: '0 auto',
            }}
          >

            {/* ========================================== */}
            {/* TEMPLATE 1: FAANG CLASSIC (IVY LEAGUE MONO) */}
            {/* ========================================== */}
            {template === 'faang_classic' && (
              <div className="space-y-4 text-[12px] leading-relaxed">
                
                {/* Header */}
                <div className="text-center border-b pb-3" style={{ borderColor: accentColor }}>
                  <h2 className="text-2xl font-black tracking-tight" style={{ color: accentColor }}>
                    {resume.personal?.fullName?.toUpperCase()}
                  </h2>
                  <div className="text-[11px] font-medium text-slate-700 mt-1 flex flex-wrap items-center justify-center gap-2">
                    <span>{resume.personal?.location}</span>
                    <span>•</span>
                    <span className="font-bold">{resume.personal?.phone}</span>
                    <span>•</span>
                    <span className="underline">{resume.personal?.email}</span>
                    <span>•</span>
                    <span className="font-bold">{resume.personal?.linkedin}</span>
                    <span>•</span>
                    <span>{resume.personal?.github}</span>
                  </div>
                </div>

                {/* Professional Summary */}
                {resume.summary && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: '#cbd5e1' }}>
                      Professional Summary
                    </h3>
                    <p className="text-slate-800 text-[11.5px] leading-relaxed text-justify">
                      {resume.summary}
                    </p>
                  </div>
                )}

                {/* Technical Skills */}
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: '#cbd5e1' }}>
                    Technical Skills
                  </h3>
                  <div className="space-y-0.5 text-[11px]">
                    <div><strong className="text-slate-900">Languages:</strong> {resume.skills?.languages?.join(', ')}</div>
                    <div><strong className="text-slate-900">Frameworks:</strong> {resume.skills?.frameworks?.join(', ')}</div>
                    <div><strong className="text-slate-900">Databases:</strong> {resume.skills?.databases?.join(', ')}</div>
                    <div><strong className="text-slate-900">DevOps &amp; Tools:</strong> {resume.skills?.cloudDevOps?.join(', ')}</div>
                  </div>
                </div>

                {/* Work Experience */}
                {resume.experience?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: '#cbd5e1' }}>
                      Work Experience
                    </h3>
                    {resume.experience?.map((exp: any) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span>{exp.role} — <span className="font-normal italic text-slate-700">{exp.company}</span></span>
                          <span className="text-[11px] text-slate-600 font-normal">{exp.startDate} – {exp.endDate} | {exp.location}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-800">
                          {exp.bullets?.map((b: string, idx: number) => (
                            <li key={idx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {resume.projects?.length > 0 && (
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: '#cbd5e1' }}>
                      Technical Projects
                    </h3>
                    {resume.projects?.map((proj: any) => (
                      <div key={proj.id} className="space-y-1">
                        <div className="flex justify-between items-baseline font-bold text-slate-900">
                          <span>{proj.title} <span className="font-normal text-[10.5px] text-slate-600">| {proj.techStack}</span></span>
                          <span className="text-[10.5px] text-slate-500 font-normal">{proj.link}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-800">
                          {proj.bullets?.map((b: string, idx: number) => (
                            <li key={idx} className="leading-snug">{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {resume.education?.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-0.5" style={{ color: accentColor, borderColor: '#cbd5e1' }}>
                      Education &amp; Certifications
                    </h3>
                    {resume.education?.map((ed: any) => (
                      <div key={ed.id} className="flex justify-between items-baseline text-[11px]">
                        <div>
                          <strong className="text-slate-900">{ed.degree}</strong> — <span className="italic text-slate-700">{ed.institution}</span>
                          <div className="text-[10px] text-slate-600">{ed.honors}</div>
                        </div>
                        <div className="text-right font-bold text-slate-800">
                          <span>{ed.year}</span>
                          <div className="text-[10px] text-slate-600 font-normal">GPA: {ed.gpa}</div>
                        </div>
                      </div>
                    ))}
                    {resume.certifications?.length > 0 && (
                      <div className="pt-1 text-[10.5px] text-slate-700">
                        <strong>Certifications:</strong> {resume.certifications?.join(' • ')}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ========================================== */}
            {/* TEMPLATE 2: MODERN SILICON VALLEY TECH     */}
            {/* ========================================== */}
            {template === 'modern_tech' && (
              <div className="space-y-5 text-[12px]">
                
                {/* Modern Header */}
                <div className="border-l-4 pl-4 space-y-1" style={{ borderColor: accentColor }}>
                  <h2 className="text-3xl font-black tracking-tight" style={{ color: accentColor }}>
                    {resume.personal?.fullName}
                  </h2>
                  <div className="text-xs font-black uppercase tracking-wider text-slate-600">
                    {resume.personal?.title}
                  </div>
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1 pt-1 font-medium">
                    <span><i className="fa-solid fa-location-dot me-1"></i>{resume.personal?.location}</span>
                    <span><i className="fa-solid fa-phone me-1"></i>{resume.personal?.phone}</span>
                    <span><i className="fa-solid fa-envelope me-1"></i>{resume.personal?.email}</span>
                    <span><i className="fa-brands fa-linkedin me-1"></i>{resume.personal?.linkedin}</span>
                  </div>
                </div>

                {/* Summary */}
                {resume.summary && (
                  <p className="text-slate-700 text-[11.5px] leading-relaxed p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {resume.summary}
                  </p>
                )}

                {/* Skills Chips */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-black uppercase tracking-wider flex items-center space-x-1.5" style={{ color: accentColor }}>
                    <span>Technical Capabilities</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      ...(resume.skills?.languages || []),
                      ...(resume.skills?.frameworks || []),
                      ...(resume.skills?.databases || []),
                      ...(resume.skills?.cloudDevOps || []),
                    ].map((s: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded-md border border-slate-200">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                {resume.experience?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: '#e2e8f0' }}>
                      Professional Experience
                    </h3>
                    {resume.experience?.map((exp: any) => (
                      <div key={exp.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-slate-900 text-[12px]">{exp.role} <span className="text-indigo-600">@ {exp.company}</span></span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{exp.startDate} – {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-700">
                          {exp.bullets?.map((b: string, idx: number) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {resume.projects?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: '#e2e8f0' }}>
                      Featured Software Projects
                    </h3>
                    {resume.projects?.map((proj: any) => (
                      <div key={proj.id} className="space-y-1">
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-slate-900">{proj.title} <span className="text-[10px] text-slate-500 font-normal">({proj.techStack})</span></span>
                          <span className="text-[10px] text-indigo-600 underline">{proj.link}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-700">
                          {proj.bullets?.map((b: string, idx: number) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {resume.education?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider border-b pb-1" style={{ color: accentColor, borderColor: '#e2e8f0' }}>
                      Education
                    </h3>
                    {resume.education?.map((ed: any) => (
                      <div key={ed.id} className="flex justify-between text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">{ed.degree}</span> • {ed.institution}
                        </div>
                        <span className="font-bold text-slate-600">{ed.year} ({ed.gpa})</span>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ========================================== */}
            {/* TEMPLATE 3: ARCHITECT 2-COLUMN SPLIT       */}
            {/* ========================================== */}
            {template === 'architect_split' && (
              <div className="grid grid-cols-12 gap-6 text-[11.5px]">
                
                {/* Left Sidebar (4 Cols) */}
                <div className="col-span-4 space-y-4 border-r pr-4 border-slate-200">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 leading-tight">
                      {resume.personal?.fullName}
                    </h2>
                    <div className="text-[10px] font-black uppercase" style={{ color: accentColor }}>
                      {resume.personal?.title}
                    </div>
                  </div>

                  <div className="space-y-1 text-[10.5px] text-slate-600 border-t pt-2 border-slate-100">
                    <div>{resume.personal?.email}</div>
                    <div>{resume.personal?.phone}</div>
                    <div>{resume.personal?.location}</div>
                    <div className="font-bold text-indigo-600">{resume.personal?.linkedin}</div>
                    <div className="font-bold text-slate-800">{resume.personal?.github}</div>
                  </div>

                  {/* Skills Matrix Sidebar */}
                  <div className="space-y-2 border-t pt-2 border-slate-100">
                    <h4 className="text-[11px] font-black uppercase" style={{ color: accentColor }}>Core Skills</h4>
                    <div className="space-y-1 text-[10.5px]">
                      <div>
                        <strong className="block text-slate-800">Languages</strong>
                        <span className="text-slate-600">{resume.skills?.languages?.join(', ')}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-800">Frameworks</strong>
                        <span className="text-slate-600">{resume.skills?.frameworks?.join(', ')}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-800">Databases</strong>
                        <span className="text-slate-600">{resume.skills?.databases?.join(', ')}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-800">Cloud &amp; DevOps</strong>
                        <span className="text-slate-600">{resume.skills?.cloudDevOps?.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Education Sidebar */}
                  <div className="space-y-1 border-t pt-2 border-slate-100">
                    <h4 className="text-[11px] font-black uppercase" style={{ color: accentColor }}>Education</h4>
                    {resume.education?.map((ed: any) => (
                      <div key={ed.id} className="text-[10px]">
                        <div className="font-bold text-slate-900">{ed.degree}</div>
                        <div className="text-slate-600">{ed.institution}</div>
                        <div className="font-bold text-slate-500">{ed.year} | {ed.gpa}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Main Column (8 Cols) */}
                <div className="col-span-8 space-y-4">
                  {resume.summary && (
                    <div>
                      <h3 className="text-xs font-black uppercase border-b pb-0.5 mb-1" style={{ color: accentColor }}>Summary</h3>
                      <p className="text-slate-700 text-[11px] leading-relaxed">{resume.summary}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {resume.experience?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase border-b pb-0.5 mb-1" style={{ color: accentColor }}>Experience</h3>
                      {resume.experience?.map((exp: any) => (
                        <div key={exp.id} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-900 text-[11.5px]">
                            <span>{exp.role} <span className="font-normal text-slate-600">@ {exp.company}</span></span>
                            <span className="text-[10px] text-slate-500">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-[10.5px] text-slate-700">
                            {exp.bullets?.map((b: string, idx: number) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {resume.projects?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase border-b pb-0.5 mb-1" style={{ color: accentColor }}>Projects</h3>
                      {resume.projects?.map((proj: any) => (
                        <div key={proj.id} className="space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-900 text-[11.5px]">
                            <span>{proj.title}</span>
                            <span className="text-[10px] text-indigo-600">{proj.link}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 italic">{proj.techStack}</div>
                          <ul className="list-disc list-outside ml-3.5 space-y-0.5 text-[10.5px] text-slate-700">
                            {proj.bullets?.map((b: string, idx: number) => (
                              <li key={idx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ========================================== */}
            {/* TEMPLATE 4: FRESHER & ACADEMIC PLACEMENTS  */}
            {/* ========================================== */}
            {template === 'fresher_academic' && (
              <div className="space-y-4 text-[12px]">
                
                {/* Header */}
                <div className="text-center border-b-2 pb-2" style={{ borderColor: accentColor }}>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {resume.personal?.fullName}
                  </h2>
                  <p className="text-xs font-bold" style={{ color: accentColor }}>{resume.personal?.title}</p>
                  <div className="text-[11px] text-slate-600 mt-1 flex justify-center gap-3">
                    <span>{resume.personal?.email}</span>
                    <span>•</span>
                    <span>{resume.personal?.phone}</span>
                    <span>•</span>
                    <span className="font-bold">{resume.personal?.github}</span>
                  </div>
                </div>

                {/* Education First */}
                {resume.education?.length > 0 && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-black uppercase border-b pb-0.5" style={{ color: accentColor }}>Education</h3>
                    {resume.education?.map((ed: any) => (
                      <div key={ed.id} className="flex justify-between text-[11px]">
                        <div>
                          <strong className="text-slate-900">{ed.degree}</strong>
                          <div className="text-slate-600">{ed.institution}</div>
                          <div className="text-[10px] font-bold text-emerald-700">{ed.honors}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800">{ed.year}</span>
                          <div className="font-bold text-slate-600">GPA: {ed.gpa}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects Highlights */}
                {resume.projects?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase border-b pb-0.5" style={{ color: accentColor }}>Academic &amp; Capstone Projects</h3>
                    {resume.projects?.map((proj: any) => (
                      <div key={proj.id} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900 text-[11.5px]">
                          <span>{proj.title} <span className="font-normal text-slate-500 text-[10px]">[{proj.techStack}]</span></span>
                          <span className="text-[10px] text-indigo-600">{proj.link}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-700">
                          {proj.bullets?.map((b: string, idx: number) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* Technical Skills */}
                <div className="space-y-1">
                  <h3 className="text-xs font-black uppercase border-b pb-0.5" style={{ color: accentColor }}>Technical Strengths</h3>
                  <div className="space-y-0.5 text-[11px]">
                    <div><strong>Languages:</strong> {resume.skills?.languages?.join(', ')}</div>
                    <div><strong>Frameworks:</strong> {resume.skills?.frameworks?.join(', ')}</div>
                    <div><strong>Databases:</strong> {resume.skills?.databases?.join(', ')}</div>
                    <div><strong>Tools:</strong> {resume.skills?.cloudDevOps?.join(', ')}</div>
                  </div>
                </div>

                {/* Experience / Internships */}
                {resume.experience?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase border-b pb-0.5" style={{ color: accentColor }}>Internships &amp; Training</h3>
                    {resume.experience?.map((exp: any) => (
                      <div key={exp.id} className="space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-900 text-[11.5px]">
                          <span>{exp.role} — <span className="font-normal italic">{exp.company}</span></span>
                          <span className="text-[10px] text-slate-500">{exp.startDate} - {exp.endDate}</span>
                        </div>
                        <ul className="list-disc list-outside ml-4 space-y-0.5 text-[11px] text-slate-700">
                          {exp.bullets?.map((b: string, idx: number) => (
                            <li key={idx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </main>

      <div className="print:hidden">
        <StudentFooter />
      </div>

      {/* Print Specific CSS to ensure clean 1-page PDF export */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          header, footer, nav, button, select, input, textarea {
            display: none !important;
          }
          #resume-printable-area {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm 12mm 10mm;
          }
        }
      `}</style>
    </div>
  );
}
