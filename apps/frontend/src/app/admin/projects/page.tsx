'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';

interface SubmissionItem {
  id: number;
  target_id: number;
  week_number: number;
  student_id: number | null;
  student_email: string;
  student_name: string;
  github_url: string;
  commit_sha: string;
  demo_url?: string;
  notes?: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_NEEDED';
  score?: number;
  mentor_feedback?: string;
  xp_awarded?: number;
  submitted_at: string;
  reviewed_at?: string;
  project_title?: string;
  phase?: string;
  difficulty?: string;
  due_date?: string;
  rubric?: any;
}

interface TargetItem {
  id: number;
  week_number: number;
  title: string;
  phase: string;
  difficulty: string;
  description?: string;
  tech_stack?: any;
  architecture_nodes?: any;
  github_template?: string;
  rubric?: any;
  status: 'DRAFT' | 'SCHEDULED' | 'RELEASED' | 'ACTIVE' | 'CLOSED';
  due_date: string;
}

export default function AdminProjectsPage() {
  const [activeTab, setActiveTab] = useState<'DISPATCHER' | 'REVIEW_QUEUE' | 'SANDBOX'>('DISPATCHER');

  // Review Queue & Dispatcher State
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [weekFilter, setWeekFilter] = useState<string>('ALL');

  // Available LMS Courses
  const [availableCourses, setAvailableCourses] = useState<{ id: number; title: string; modules?: any[] }[]>([]);

  // Selected Submission for Grading
  const [gradingSub, setGradingSub] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeStatus, setGradeStatus] = useState<'APPROVED' | 'REVISION_NEEDED' | 'UNDER_REVIEW'>('APPROVED');
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeResultMsg, setGradeResultMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Target Status & Due Date Updating
  const [updatingTargetWeek, setUpdatingTargetWeek] = useState<number | null>(null);
  const [editingDueDateWeek, setEditingDueDateWeek] = useState<number | null>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');

  // Project Creation & Editing Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [formWeekNumber, setFormWeekNumber] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formPhase, setFormPhase] = useState('Phase 1: Foundations');
  const [formDifficulty, setFormDifficulty] = useState('Foundations');
  const [formDescription, setFormDescription] = useState('');
  const [formTechStack, setFormTechStack] = useState('Java 21, Spring Boot 3, PostgreSQL, Docker');
  const [formNode1, setFormNode1] = useState('REST API Gateway & Security Filter');
  const [formNode2, setFormNode2] = useState('Domain Service & State Machine');
  const [formNode3, setFormNode3] = useState('High-Throughput Persistence Engine');
  const [formNode4, setFormNode4] = useState('Automated Test Suite & Health Metrics');
  const [formRubric1, setFormRubric1] = useState('Architectural Integrity & SOLID Principles (25 pts)');
  const [formRubric2, setFormRubric2] = useState('Thread-Safety & Exception Handling (25 pts)');
  const [formRubric3, setFormRubric3] = useState('Unit & Integration Test Coverage >80% (25 pts)');
  const [formRubric4, setFormRubric4] = useState('Docker Containerization & Documentation (25 pts)');
  const [formGithubTemplate, setFormGithubTemplate] = useState('https://github.com/spring-projects/spring-petclinic');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'SCHEDULED' | 'RELEASED' | 'ACTIVE'>('SCHEDULED');
  const [savingProject, setSavingProject] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // =========================================================================
  // ADAPTIVE PROJECT ARCHITECT STATE (Course-Agnostic AI Engine)
  // =========================================================================
  const [adaptiveModalOpen, setAdaptiveModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('custom');
  const [customCourseTitle, setCustomCourseTitle] = useState<string>('DevOps Engineering');
  const [curriculumString, setCurriculumString] = useState<string>(
    'Linux & Shell, Git & Version Control, Networking, Docker, CI/CD, Kubernetes, AWS Cloud, Terraform (IaC), Prometheus Monitoring'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('BASIC');
  const [selectedTargetModule, setSelectedTargetModule] = useState<string>('AUTO');
  const [customObjectives, setCustomObjectives] = useState<string>('');
  const [targetWeekNumber, setTargetWeekNumber] = useState<number>(1);
  const [generateFullPathway, setGenerateFullPathway] = useState<boolean>(false);
  
  // Student Adaptive Readiness Simulation Toggle
  const [enableStudentAdaptiveMode, setEnableStudentAdaptiveMode] = useState<boolean>(false);
  const [studentScoreSim, setStudentScoreSim] = useState<number>(75);
  const [studentCompletedModulesSim, setStudentCompletedModulesSim] = useState<number>(2);

  const [architectGenerating, setArchitectGenerating] = useState(false);
  const [architectError, setArchitectError] = useState<string | null>(null);
  const [generatedBlueprint, setGeneratedBlueprint] = useState<any | null>(null);
  const [generatedPathway, setGeneratedPathway] = useState<any[] | null>(null);

  // Delete Confirmation Modal State
  const [targetToDelete, setTargetToDelete] = useState<TargetItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Automated Sandbox Submissions
  const [sandboxSubmissions, setSandboxSubmissions] = useState<any[]>([]);
  const [selectedSandboxSub, setSelectedSandboxSub] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/projects/review?status=${statusFilter}${weekFilter !== 'ALL' ? `&week=${weekFilter}` : ''}`);
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.submissions || []);
        setTargets(data.targets || []);
      }

      const sbRes = await fetch('/api/projects/submit');
      const sbData = await sbRes.json();
      if (sbData.success) {
        setSandboxSubmissions(sbData.submissions || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin projects data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses?all=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setAvailableCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCourses();
  }, [statusFilter, weekFilter]);

  // When instructor changes selected course in Adaptive Architect
  const handleCourseChange = (courseIdVal: string) => {
    setSelectedCourseId(courseIdVal);
    if (courseIdVal === 'custom') {
      setCustomCourseTitle('DevOps Engineering');
      setCurriculumString('Linux & Shell, Git, Networking, Docker, CI/CD, Kubernetes, AWS Cloud, Terraform, Prometheus Monitoring');
    } else {
      const found = availableCourses.find((c) => String(c.id) === courseIdVal);
      if (found) {
        setCustomCourseTitle(found.title);
        if (found.modules && found.modules.length > 0) {
          const modTitles = found.modules.map((m: any) => m.title).join(', ');
          setCurriculumString(modTitles);
        } else {
          // Pre-populate sensible defaults based on title
          const lower = found.title.toLowerCase();
          if (lower.includes('python')) {
            setCurriculumString('Python OOP, Data Structures, FastAPI REST, SQLAlchemy & DB, Celery Async, Docker & Deployment');
          } else if (lower.includes('devops')) {
            setCurriculumString('Linux & Shell, Git, Networking, Docker, CI/CD, Kubernetes, AWS, Terraform, Prometheus');
          } else if (lower.includes('data science') || lower.includes('ai')) {
            setCurriculumString('Python & Pandas, EDA & Visualization, Scikit-Learn ML, Deep Learning & PyTorch, RAG & LLMs, FastAPI Serving');
          } else if (lower.includes('cyber')) {
            setCurriculumString('Network Protocols & Wireshark, Linux Hardening, Web App Security (OWASP), Cryptography, SIEM Monitoring, Incident Response');
          } else {
            setCurriculumString('Core Foundations, Object-Oriented Design, Database & ORM, REST APIs & Security, Distributed Architecture, Production Capstone');
          }
        }
      }
    }
  };

  // Run Adaptive Project Architect AI Engine
  const handleRunAdaptiveArchitect = async (e: React.FormEvent) => {
    e.preventDefault();
    setArchitectGenerating(true);
    setArchitectError(null);
    setGeneratedBlueprint(null);
    setGeneratedPathway(null);

    const curriculumArray = curriculumString.split(',').map((s) => s.trim()).filter(Boolean);

    try {
      const payload: any = {
        courseId: selectedCourseId !== 'custom' ? parseInt(selectedCourseId, 10) : undefined,
        courseTitle: customCourseTitle,
        curriculum: curriculumArray,
        difficulty: selectedDifficulty,
        targetModule: selectedTargetModule !== 'AUTO' ? selectedTargetModule : undefined,
        optionalObjectives: customObjectives,
        generateFullPathway
      };

      if (enableStudentAdaptiveMode) {
        payload.studentProfile = {
          studentName: 'Candidate (Adaptive Test)',
          assessmentScore: studentScoreSim,
          completedModules: curriculumArray.slice(0, studentCompletedModulesSim)
        };
      }

      const res = await fetch('/api/ai/adaptive-project-architect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (data.pathway) {
          setGeneratedPathway(data.pathway);
        } else if (data.project) {
          setGeneratedBlueprint(data.project);
        }
      } else {
        setArchitectError(data.message || 'Adaptive Project Architect generation failed.');
      }
    } catch {
      setArchitectError('Network error connecting to Adaptive Project Architect AI.');
    } finally {
      setArchitectGenerating(false);
    }
  };

  // Publish Generated Blueprint directly to Schedule / Catalog
  const handlePublishBlueprint = async (blueprint: any, customWeek?: number) => {
    try {
      const wk = customWeek || targetWeekNumber;
      const techArr = Array.isArray(blueprint.technologies) ? blueprint.technologies : ['Core Stack'];
      const nodesArr = Array.isArray(blueprint.architecture) ? blueprint.architecture : ['Component 1', 'Component 2'];
      const rubricArr = Array.isArray(blueprint.evaluationRubric) 
        ? blueprint.evaluationRubric.map((r: any) => `${r.criterion} (${r.points} pts)`)
        : ['Core Functionality (25 pts)', 'Architecture (25 pts)', 'Testing (25 pts)', 'Docs (25 pts)'];

      const defaultDue = new Date();
      defaultDue.setDate(defaultDue.getDate() + 7 * wk);

      const res = await fetch('/api/projects/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: wk,
          title: blueprint.projectTitle,
          phase: `${blueprint.course} • ${blueprint.difficulty}`,
          difficulty: blueprint.difficulty,
          description: blueprint.problemStatement,
          techStack: techArr,
          architectureNodes: nodesArr,
          githubTemplate: 'https://github.com/spring-projects/spring-petclinic',
          rubric: rubricArr,
          dueDate: defaultDue.toISOString(),
          status: 'SCHEDULED',
          isNewProject: true
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Project "${blueprint.projectTitle}" published to Week ${wk} schedule successfully!`);
        fetchData();
      } else {
        alert('Failed to publish: ' + (data.message || 'Error'));
      }
    } catch {
      alert('Network error while publishing target.');
    }
  };

  // Handle Quick Target Status Change
  const handleUpdateTargetStatus = async (weekNumber: number, newStatus: string) => {
    try {
      setUpdatingTargetWeek(weekNumber);
      const res = await fetch('/api/projects/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update target status:', err);
    } finally {
      setUpdatingTargetWeek(null);
    }
  };

  // Handle Target Due Date Update
  const handleSaveDueDate = async (weekNumber: number) => {
    if (!newDueDate) return;
    try {
      setUpdatingTargetWeek(weekNumber);
      const res = await fetch('/api/projects/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekNumber, dueDate: newDueDate })
      });
      const data = await res.json();
      if (data.success) {
        setEditingDueDateWeek(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update due date:', err);
    } finally {
      setUpdatingTargetWeek(null);
    }
  };

  // Open Create Modal (Manual)
  const openCreateModal = () => {
    const nextWeek = targets.length > 0 ? Math.max(...targets.map((t) => t.week_number)) + 1 : 1;
    setIsEditingExisting(false);
    setFormWeekNumber(nextWeek);
    setFormTitle('');
    setFormPhase(nextWeek <= 4 ? 'Phase 1: Foundations' : nextWeek <= 8 ? 'Phase 2: Core Systems' : nextWeek <= 12 ? 'Phase 3: Production Scale' : 'Phase 4: Capstone');
    setFormDifficulty(nextWeek <= 4 ? 'Foundations' : nextWeek <= 8 ? 'Intermediate' : nextWeek <= 12 ? 'Advanced' : 'Production Capstone');
    setFormDescription('');
    setFormTechStack('Java 21, Spring Boot 3, PostgreSQL, Docker');
    setFormNode1('REST API Gateway & Security Filter');
    setFormNode2('Domain Service & State Machine');
    setFormNode3('High-Throughput Persistence Engine');
    setFormNode4('Automated Test Suite & Health Metrics');
    setFormRubric1('Architectural Integrity & SOLID Principles (25 pts)');
    setFormRubric2('Thread-Safety & Exception Handling (25 pts)');
    setFormRubric3('Unit & Integration Test Coverage >80% (25 pts)');
    setFormRubric4('Docker Containerization & Documentation (25 pts)');
    setFormGithubTemplate('https://github.com/spring-projects/spring-petclinic');
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setFormDueDate(defaultDate.toISOString().split('T')[0]);
    setFormStatus('SCHEDULED');
    setFormError(null);
    setProjectModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (target: TargetItem) => {
    setIsEditingExisting(true);
    setFormWeekNumber(target.week_number);
    setFormTitle(target.title);
    setFormPhase(target.phase);
    setFormDifficulty(target.difficulty);
    setFormDescription(target.description || '');

    let techArr: string[] = [];
    try { techArr = typeof target.tech_stack === 'string' ? JSON.parse(target.tech_stack) : target.tech_stack || []; } catch (_) {}
    setFormTechStack(Array.isArray(techArr) ? techArr.join(', ') : 'Java 21, Spring Boot 3');

    let nodesArr: string[] = [];
    try { nodesArr = typeof target.architecture_nodes === 'string' ? JSON.parse(target.architecture_nodes) : target.architecture_nodes || []; } catch (_) {}
    setFormNode1(nodesArr[0] || 'Component 1');
    setFormNode2(nodesArr[1] || 'Component 2');
    setFormNode3(nodesArr[2] || 'Component 3');
    setFormNode4(nodesArr[3] || 'Component 4');

    let rubricArr: string[] = [];
    try { rubricArr = typeof target.rubric === 'string' ? JSON.parse(target.rubric) : target.rubric || []; } catch (_) {}
    setFormRubric1(rubricArr[0] || 'Criterion 1 (25 pts)');
    setFormRubric2(rubricArr[1] || 'Criterion 2 (25 pts)');
    setFormRubric3(rubricArr[2] || 'Criterion 3 (25 pts)');
    setFormRubric4(rubricArr[3] || 'Criterion 4 (25 pts)');

    setFormGithubTemplate(target.github_template || 'https://github.com/spring-projects/spring-petclinic');
    setFormDueDate(target.due_date ? target.due_date.split('T')[0] : '');
    setFormStatus(target.status as any || 'SCHEDULED');
    setFormError(null);
    setProjectModalOpen(true);
  };

  // Save Project (Create / Edit)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Project title is required.');
      return;
    }

    setSavingProject(true);
    setFormError(null);

    const techArray = formTechStack.split(',').map((s) => s.trim()).filter(Boolean);
    const nodesArray = [formNode1, formNode2, formNode3, formNode4].filter((s) => s.trim());
    const rubricArray = [formRubric1, formRubric2, formRubric3, formRubric4].filter((s) => s.trim());

    try {
      const res = await fetch('/api/projects/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: formWeekNumber,
          title: formTitle.trim(),
          phase: formPhase,
          difficulty: formDifficulty,
          description: formDescription.trim(),
          techStack: techArray,
          architectureNodes: nodesArray,
          githubTemplate: formGithubTemplate.trim(),
          rubric: rubricArray,
          dueDate: formDueDate ? new Date(formDueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: formStatus,
          isNewProject: true
        })
      });

      const data = await res.json();
      if (data.success) {
        setProjectModalOpen(false);
        fetchData();
      } else {
        setFormError(data.message || 'Failed to save project target.');
      }
    } catch {
      setFormError('Network error while saving project.');
    } finally {
      setSavingProject(false);
    }
  };

  // Delete Project Target
  const handleDeleteTarget = async () => {
    if (!targetToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/targets?week=${targetToDelete.week_number}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setTargetToDelete(null);
        fetchData();
      } else {
        alert(data.message || 'Failed to delete target.');
      }
    } catch {
      alert('Network error while deleting target.');
    } finally {
      setDeleting(false);
    }
  };

  // Open Grading Drawer
  const openGradingDrawer = (sub: SubmissionItem) => {
    setGradingSub(sub);
    setGradeScore(sub.score !== null && sub.score !== undefined ? sub.score : 85);
    setGradeStatus(sub.status === 'REVISION_NEEDED' ? 'REVISION_NEEDED' : sub.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
    setGradeFeedback(sub.mentor_feedback || 'Excellent code architecture and clean separation of concerns. Satisfies all mandatory rubric nodes.');
    setGradeResultMsg(null);
  };

  // Submit Grade
  const handleSubmitGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSub) return;
    setSavingGrade(true);
    setGradeResultMsg(null);

    try {
      const res = await fetch('/api/projects/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: gradingSub.id,
          status: gradeStatus,
          score: gradeScore,
          mentorFeedback: gradeFeedback,
          xpAwarded: gradeStatus === 'APPROVED' ? 500 : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setGradeResultMsg({ text: data.message, type: 'success' });
        setTimeout(() => {
          setGradingSub(null);
          fetchData();
        }, 1000);
      } else {
        setGradeResultMsg({ text: data.message || 'Failed to submit review.', type: 'error' });
      }
    } catch {
      setGradeResultMsg({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSavingGrade(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'UNDER_REVIEW').length;
  const approvedTotal = submissions.filter((s) => s.status === 'APPROVED').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      <AdminNavbar />

      <main className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                ⚡ Education Algorithm Adaptive Architect
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-xs font-mono font-bold">
                Universal Course Engine
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mt-2">Adaptive Project Architect &amp; Evaluation CMS</h1>
            <p className="text-xs text-slate-400 mt-1">
              Design course-aware project paths for ANY technical subject (DevOps, Python, Data Science, GenAI, Java, Security, etc.) with automated prerequisite gating.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setAdaptiveModalOpen(true)}
              className="px-4 py-2.5 bg-linear-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center space-x-2"
            >
              <span>🪄</span>
              <span>Adaptive Project Architect</span>
            </button>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Create Project</span>
            </button>

            <button
              onClick={fetchData}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
              title="Refresh"
            >
              <i className="fa-solid fa-arrows-rotate text-xs"></i>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scheduled Targets</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{targets.length} Weeks</div>
            <div className="text-[11px] text-indigo-400 mt-1">Curriculum Gated Roadmap</div>
          </div>
          <div className="bg-slate-800/80 border border-amber-500/30 rounded-2xl p-4">
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">Pending Evaluation</div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1">{pendingCount} Submissions</div>
            <div className="text-[11px] text-slate-400 mt-1">Requires instructor rubric grading</div>
          </div>
          <div className="bg-slate-800/80 border border-emerald-500/30 rounded-2xl p-4">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Approved Milestones</div>
            <div className="text-2xl font-black text-emerald-300 font-mono mt-1">{approvedTotal} Passed</div>
            <div className="text-[11px] text-slate-400 mt-1">Unlocked next milestone</div>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Supported Disciplines</div>
            <div className="text-2xl font-black text-white font-mono mt-1">All Courses</div>
            <div className="text-[11px] text-purple-400 mt-1">DevOps • GenAI • Python • Java</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('DISPATCHER')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'DISPATCHER'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-list-check text-xs"></i>
            <span>Course Target Dispatcher ({targets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('REVIEW_QUEUE')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 relative ${
              activeTab === 'REVIEW_QUEUE'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-code-pull-request text-xs"></i>
            <span>Faculty Review Queue ({submissions.length})</span>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('SANDBOX')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center space-x-2 ${
              activeTab === 'SANDBOX'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <i className="fa-solid fa-cube text-xs"></i>
            <span>Automated Docker Capstones ({sandboxSubmissions.length})</span>
          </button>
        </div>

        {/* TAB 1: Course Target Dispatcher */}
        {activeTab === 'DISPATCHER' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700/80 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">Weekly Target Release Schedule</h3>
                <p className="text-xs text-slate-400">Control which weeks are actively released, edit specifications, or delete targets.</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAdaptiveModalOpen(true)}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
                >
                  <span>🪄</span>
                  <span>Architect Path</span>
                </button>
                <button
                  onClick={openCreateModal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition"
                >
                  + Add Project
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-black uppercase border-b border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4 font-mono">Week</th>
                    <th className="py-3.5 px-4">Project Title</th>
                    <th className="py-3.5 px-4">Course / Phase</th>
                    <th className="py-3.5 px-4">Difficulty</th>
                    <th className="py-3.5 px-4">Target Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Quick Dispatch</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium text-slate-300">
                  {targets.map((t) => (
                    <tr key={t.week_number} className="hover:bg-slate-750/50 transition group">
                      <td className="py-4 px-4 font-mono font-black text-indigo-400">
                        W0{t.week_number > 9 ? t.week_number : `0${t.week_number}`}
                      </td>
                      <td className="py-4 px-4 font-bold text-white max-w-xs truncate">{t.title}</td>
                      <td className="py-4 px-4 text-slate-400">{t.phase}</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-slate-900 text-indigo-300 border border-slate-700 rounded-md text-[10px] font-mono">
                          {t.difficulty}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-300">
                        {editingDueDateWeek === t.week_number ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={newDueDate}
                              onChange={(e) => setNewDueDate(e.target.value)}
                              className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs"
                            />
                            <button
                              onClick={() => handleSaveDueDate(t.week_number)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingDueDateWeek(null)}
                              className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingDueDateWeek(t.week_number);
                              setNewDueDate(t.due_date ? t.due_date.split('T')[0] : '');
                            }}
                            className="hover:text-indigo-300 underline decoration-dotted transition"
                            title="Click to change target deadline"
                          >
                            {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Set Due Date'} ✎
                          </button>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase font-mono ${
                            t.status === 'ACTIVE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : t.status === 'RELEASED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : t.status === 'CLOSED'
                              ? 'bg-slate-800 text-slate-500'
                              : 'bg-slate-900 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-1.5">
                          {t.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateTargetStatus(t.week_number, 'ACTIVE')}
                              disabled={updatingTargetWeek === t.week_number}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] rounded-lg transition"
                            >
                              Make Active
                            </button>
                          )}
                          {t.status !== 'RELEASED' && (
                            <button
                              onClick={() => handleUpdateTargetStatus(t.week_number, 'RELEASED')}
                              disabled={updatingTargetWeek === t.week_number}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg transition"
                            >
                              Release
                            </button>
                          )}
                          {t.status !== 'DRAFT' && (
                            <button
                              onClick={() => handleUpdateTargetStatus(t.week_number, 'DRAFT')}
                              disabled={updatingTargetWeek === t.week_number}
                              className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold text-[10px] rounded-lg transition"
                            >
                              Draft
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => openEditModal(t)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Project Blueprint"
                          >
                            <i className="fa-solid fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => setTargetToDelete(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Target Project"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: Faculty Review Queue */}
        {activeTab === 'REVIEW_QUEUE' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/80 pb-4">
              <div>
                <h3 className="font-extrabold text-white text-base">Student Git Submission Review Queue</h3>
                <p className="text-xs text-slate-400">Verify code authorship against Commit SHA snapshots, award rubric scores, and approve milestones.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SUBMITTED">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REVISION_NEEDED">Revision Needed</option>
                </select>

                <select
                  value={weekFilter}
                  onChange={(e) => setWeekFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">All Weeks</option>
                  {targets.map((t) => (
                    <option key={t.week_number} value={t.week_number.toString()}>
                      Week {t.week_number}: {t.title.slice(0, 25)}...
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <div className="text-4xl">📥</div>
                <div className="font-bold text-white">No submissions found matching criteria.</div>
                <div className="text-xs">Once students submit their weekly targets, they will appear in this queue.</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-black uppercase border-b border-slate-700">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4 font-mono">Week / Milestone</th>
                      <th className="py-3.5 px-4">GitHub &amp; Commit SHA</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Faculty Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-medium text-slate-300">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-750/50 transition">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white">{sub.student_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sub.student_email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-bold text-indigo-300">Week {sub.week_number}</div>
                          <div className="text-[11px] text-slate-400 max-w-xs truncate">{sub.project_title}</div>
                        </td>
                        <td className="py-4 px-4 space-y-1">
                          <a
                            href={sub.github_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 font-mono flex items-center space-x-1 underline"
                          >
                            <i className="fa-brands fa-github text-xs"></i>
                            <span className="max-w-[150px] truncate">{sub.github_url.replace('https://github.com/', '')}</span>
                          </a>
                          <div className="font-mono text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded max-w-[170px] truncate">
                            SHA: {sub.commit_sha}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                          {new Date(sub.submitted_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 font-mono font-black text-emerald-400">
                          {sub.score !== null && sub.score !== undefined ? `${sub.score}/100` : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase font-mono ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : sub.status === 'REVISION_NEEDED'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            }`}
                          >
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => openGradingDrawer(sub)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition"
                          >
                            Evaluate &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Automated Docker Sandbox Logs */}
        {activeTab === 'SANDBOX' && (
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="border-b border-slate-700/80 pb-4">
              <h3 className="font-extrabold text-white text-base">Ephemeral Docker Execution Sandbox Logs</h3>
              <p className="text-xs text-slate-400">Automated unit test runs, runtime container logs, and static code analysis results.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-black uppercase border-b border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4 font-mono">Run ID</th>
                    <th className="py-3.5 px-4">Student</th>
                    <th className="py-3.5 px-4">Target Capstone</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Logs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium text-slate-300">
                  {sandboxSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-750/50 transition">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">{sub.id}</td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{sub.student}</div>
                        <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-200 font-bold">{sub.project}</td>
                      <td className="py-4 px-4 font-mono font-black text-emerald-400">{sub.score}/100</td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => setSelectedSandboxSub(sub)}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition"
                        >
                          View Logs &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 1: ADAPTIVE PROJECT ARCHITECT STUDIO (Course-Agnostic Engine) */}
        {/* ========================================================================= */}
        {adaptiveModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-4xl w-full shadow-2xl shadow-purple-950/60 flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-start shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-linear-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-600/30 text-white text-lg">
                    🪄
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Education Algorithm Adaptive Project Architect</h3>
                    <p className="text-xs text-purple-300">
                      Dynamically constructs curriculum-gated, difficulty-aware project blueprints for ANY technical course.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAdaptiveModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {architectError && (
                  <div className="p-3.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl font-bold">
                    {architectError}
                  </div>
                )}

                {/* Generator Form */}
                <form onSubmit={handleRunAdaptiveArchitect} className="space-y-4 bg-slate-850/60 p-5 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Course Selection */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Select Target LMS Course <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={selectedCourseId}
                        onChange={(e) => handleCourseChange(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-purple-500"
                      >
                        <option value="custom">✍️ Custom Course / Discipline</option>
                        {availableCourses.map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Course Title Input (if custom) */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Course Name / Technical Discipline <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customCourseTitle}
                        onChange={(e) => setCustomCourseTitle(e.target.value)}
                        placeholder="e.g. DevOps, Python Full Stack, Generative AI"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Curriculum Modules */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-slate-300 font-bold">
                        Course Curriculum Modules (Sequential Order) <span className="text-rose-400">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Comma-separated</span>
                    </div>
                    <textarea
                      rows={2}
                      required
                      value={curriculumString}
                      onChange={(e) => setCurriculumString(e.target.value)}
                      placeholder="e.g. Linux, Git, Networking, Docker, CI/CD, Kubernetes, AWS, Terraform, Monitoring"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono focus:outline-hidden focus:border-purple-500"
                    ></textarea>
                    <p className="text-[10px] text-slate-400 mt-1">
                      The AI inspects these modules to strictly enforce difficulty rules (e.g. Basic projects ONLY use early modules; Capstones synthesize all).
                    </p>
                  </div>

                  {/* Module, Difficulty & Target Week */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Focus Module Selector */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Focus Curriculum Module <span className="text-purple-300">*</span>
                      </label>
                      <select
                        value={selectedTargetModule}
                        onChange={(e) => setSelectedTargetModule(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-purple-500 text-xs"
                      >
                        <option value="AUTO">🎯 Auto-Select from Difficulty Scope</option>
                        {curriculumString.split(',').map((mod, idx) => {
                          const cleanMod = mod.trim();
                          if (!cleanMod) return null;
                          return (
                            <option key={idx} value={cleanMod}>
                              Module {idx + 1}: {cleanMod.length > 28 ? cleanMod.slice(0, 28) + '...' : cleanMod}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Difficulty Engine */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Requested Difficulty Engine
                      </label>
                      <select
                        value={selectedDifficulty}
                        onChange={(e) => setSelectedDifficulty(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-purple-500 text-xs"
                      >
                        <option value="BEGINNER">BEGINNER (Level 1: Core Basics)</option>
                        <option value="BASIC">BASIC (Level 1: Foundational CLI / Scripts)</option>
                        <option value="FOUNDATION">FOUNDATION (Level 2: Systems Basics & OOP)</option>
                        <option value="INTERMEDIATE">INTERMEDIATE (Level 3: REST & DB Integration)</option>
                        <option value="ADVANCED">ADVANCED (Level 4: Microservices & Queues)</option>
                        <option value="EXPERT">EXPERT (Level 5: High-Concurrency & IaC)</option>
                        <option value="CAPSTONE">CAPSTONE (Level 6: Full Production Capstone)</option>
                      </select>
                    </div>

                    {/* Target Schedule Week & Full Pathway */}
                    <div className="space-y-2">
                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Schedule Week #</label>
                        <input
                          type="number"
                          min={1}
                          max={52}
                          value={targetWeekNumber}
                          onChange={(e) => setTargetWeekNumber(parseInt(e.target.value, 10) || 1)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-hidden focus:border-purple-500 text-xs"
                        />
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={generateFullPathway}
                          onChange={(e) => setGenerateFullPathway(e.target.checked)}
                          className="accent-purple-500 rounded"
                        />
                        <span className="text-purple-300 font-bold text-[10px]">
                          Generate Full 4-Tier Pathway
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Optional Custom Objectives & Student Adaptive Simulation */}
                  <div className="pt-2 border-t border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold">Additional Instructor Directives (Optional):</span>
                      <button
                        type="button"
                        onClick={() => setEnableStudentAdaptiveMode(!enableStudentAdaptiveMode)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                          enableStudentAdaptiveMode ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {enableStudentAdaptiveMode ? '🎯 Student Adaptive Mode: ACTIVE' : '➕ Simulate Student Readiness'}
                      </button>
                    </div>

                    <input
                      type="text"
                      value={customObjectives}
                      onChange={(e) => setCustomObjectives(e.target.value)}
                      placeholder="e.g. Focus on memory leak prevention, thread safety, or automated GitHub Actions CI"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-hidden focus:border-purple-500"
                    />

                    {/* Student Adaptive Simulation Drawer */}
                    {enableStudentAdaptiveMode && (
                      <div className="p-4 bg-purple-950/30 border border-purple-500/30 rounded-2xl space-y-3">
                        <div className="font-bold text-purple-200">
                          🎓 Student Readiness Simulation Diagnostic
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-slate-400 block mb-1">
                              Student Assessment Score: <span className="text-white font-bold">{studentScoreSim}%</span>
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={studentScoreSim}
                              onChange={(e) => setStudentScoreSim(parseInt(e.target.value, 10))}
                              className="w-full accent-purple-500"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1">
                              Completed Modules: <span className="text-white font-bold">{studentCompletedModulesSim} modules</span>
                            </label>
                            <input
                              type="range"
                              min={0}
                              max={curriculumString.split(',').length}
                              value={studentCompletedModulesSim}
                              onChange={(e) => setStudentCompletedModulesSim(parseInt(e.target.value, 10))}
                              className="w-full accent-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={architectGenerating}
                      className="px-6 py-3 bg-linear-to-r from-purple-600 via-indigo-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/40 transition flex items-center space-x-2"
                    >
                      {architectGenerating && <i className="fa-solid fa-spinner animate-spin"></i>}
                      <span>{architectGenerating ? 'Synthesizing Course Blueprint...' : '🚀 Architect Adaptive Project'}</span>
                    </button>
                  </div>
                </form>

                {/* ========================================================= */}
                {/* BLUEPRINT PREVIEW: SINGLE PROJECT */}
                {/* ========================================================= */}
                {generatedBlueprint && (
                  <div className="space-y-5 bg-slate-800/90 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
                    {/* Student Readiness Banner if simulated */}
                    {generatedBlueprint.studentReadiness && (
                      <div className={`p-4 rounded-xl border flex items-start space-x-3 ${
                        generatedBlueprint.studentReadiness.status === 'READY'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : generatedBlueprint.studentReadiness.status === 'READY_WITH_PREPARATION'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}>
                        <div className="text-xl">
                          {generatedBlueprint.studentReadiness.status === 'READY' ? '✅' : generatedBlueprint.studentReadiness.status === 'READY_WITH_PREPARATION' ? '⚠️' : '🛑'}
                        </div>
                        <div className="space-y-1">
                          <div className="font-bold">
                            Adaptive Readiness Diagnostic: {generatedBlueprint.studentReadiness.status.replace('_', ' ')}
                          </div>
                          <p className="text-[11px] leading-relaxed">{generatedBlueprint.studentReadiness.reason}</p>
                          {generatedBlueprint.studentReadiness.recommendedPrepTask && (
                            <div className="text-[11px] pt-1">
                              <strong>Recommended Foundation Task:</strong> {generatedBlueprint.studentReadiness.recommendedPrepTask}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Blueprint Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/80 pb-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-black uppercase font-mono">
                            {generatedBlueprint.difficulty} • {generatedBlueprint.projectLevel}
                          </span>
                          <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold flex items-center space-x-1">
                            <span>🛡️</span>
                            <span>Difficulty Consistency Verified</span>
                          </span>
                          <span className="px-2.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px] font-bold">
                            Focus: {generatedBlueprint.module}
                          </span>
                        </div>
                        <h2 className="text-2xl font-black text-white mt-1.5">{generatedBlueprint.projectTitle}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{generatedBlueprint.course}</p>
                      </div>

                      <button
                        onClick={() => handlePublishBlueprint(generatedBlueprint)}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition shrink-0"
                      >
                        ➕ Publish to Week {targetWeekNumber} Schedule
                      </button>
                    </div>

                    {/* Problem Statement & Why */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1">
                        <span className="font-bold text-white block text-xs">Problem Statement:</span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{generatedBlueprint.problemStatement}</p>
                      </div>
                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1">
                        <span className="font-bold text-purple-300 block text-xs">Why This Project:</span>
                        <p className="text-slate-300 leading-relaxed text-[11px]">{generatedBlueprint.whyThisProject}</p>
                      </div>
                    </div>

                    {/* Tech Stack & Architecture Nodes */}
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-400 font-bold block mb-1">Scoped Technology Stack:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {generatedBlueprint.technologies.map((t: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 bg-slate-900 text-indigo-300 border border-slate-700 rounded-md font-mono text-[11px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-bold block mb-1.5">Architectural Blueprint Nodes:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {generatedBlueprint.architecture.map((arch: string, i: number) => (
                            <div key={i} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-700/60 flex items-center space-x-2 text-[11px]">
                              <span className="text-purple-400 font-black font-mono">0{i+1}</span>
                              <span className="text-slate-200 font-semibold">{arch}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Implementation Phases */}
                    {generatedBlueprint.implementationPhases && generatedBlueprint.implementationPhases.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-bold block mb-2">Implementation Phases &amp; Milestones:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {generatedBlueprint.implementationPhases.map((phase: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-900/80 rounded-xl border border-slate-700/60 space-y-1 text-[11px]">
                              <div className="font-bold text-white flex items-center justify-between">
                                <span>{phase.phase}</span>
                                <span className="text-purple-300 text-[10px]">{phase.title}</span>
                              </div>
                              <ul className="list-disc list-inside text-slate-400 space-y-0.5 pl-1 text-[10px]">
                                {phase.tasks && phase.tasks.map((task: string, tIdx: number) => (
                                  <li key={tIdx}>{task}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluation Rubric */}
                    {generatedBlueprint.evaluationRubric && (
                      <div>
                        <span className="text-slate-400 font-bold block mb-1.5">Evaluation Rubric Gating (100 Pts Total):</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {generatedBlueprint.evaluationRubric.map((r: any, i: number) => (
                            <div key={i} className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/60 flex items-start justify-between gap-2 text-[11px]">
                              <div>
                                <div className="font-bold text-white">{r.criterion}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">{r.description}</div>
                              </div>
                              <span className="text-emerald-400 font-mono font-black shrink-0">
                                {r.points} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common Mistakes & Next Project */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-700/80">
                      <div>
                        <span className="text-rose-400 font-bold block mb-1">Common Anti-Patterns / Mistakes:</span>
                        <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-[10px]">
                          {generatedBlueprint.commonMistakes && generatedBlueprint.commonMistakes.map((m: string, i: number) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-indigo-400 font-bold block mb-1">Next Recommended Milestone:</span>
                        <p className="text-slate-300 text-[11px]">{generatedBlueprint.nextRecommendedProject}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* BLUEPRINT PREVIEW: FULL 4-TIER PATHWAY */}
                {/* ========================================================= */}
                {generatedPathway && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-black text-white">
                        Full 4-Tier Adaptive Project Pathway ({customCourseTitle})
                      </h3>
                      <span className="text-purple-300 font-mono text-xs">
                        Basic &rarr; Intermediate &rarr; Advanced &rarr; Capstone
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedPathway.map((p, idx) => (
                        <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded text-[10px] font-black uppercase font-mono">
                                Tier {idx + 1}: {p.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-400">{p.module}</span>
                            </div>

                            <h4 className="font-extrabold text-white text-base leading-snug">{p.projectTitle}</h4>
                            <p className="text-slate-400 text-xs line-clamp-2">{p.problemStatement}</p>

                            <div className="flex flex-wrap gap-1 pt-1">
                              {p.technologies.slice(0, 3).map((t: string, tIdx: number) => (
                                <span key={tIdx} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px] font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-mono">Week {idx * 4 + 1}</span>
                            <button
                              onClick={() => handlePublishBlueprint(p, idx * 4 + 1)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition"
                            >
                              Publish Tier {idx + 1} &rarr;
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 2: Create / Edit Project Blueprint Modal */}
        {/* ========================================================================= */}
        {projectModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-black font-mono">
                    {isEditingExisting ? `EDIT SPECIFICATION: WEEK ${formWeekNumber}` : `CREATE TARGET PROJECT: WEEK ${formWeekNumber}`}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1.5">
                    {isEditingExisting ? 'Edit Project Blueprint' : 'New Project Target Blueprint'}
                  </h3>
                </div>
                <button
                  onClick={() => setProjectModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveProject} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Week Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={52}
                      required
                      value={formWeekNumber}
                      onChange={(e) => setFormWeekNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">
                      Project Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. In-Memory LRU Cache & Key-Value Store"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Course / Curriculum Phase</label>
                    <input
                      type="text"
                      value={formPhase}
                      onChange={(e) => setFormPhase(e.target.value)}
                      placeholder="e.g. DevOps • Linux & Docker"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Difficulty Level</label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="Foundations">Foundations</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Production Capstone">Production Capstone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Problem Description &amp; Architectural Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe real-world context, concurrency locks, data structures, and outcomes..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-hidden focus:border-indigo-500"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Tech Stack (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={formTechStack}
                    onChange={(e) => setFormTechStack(e.target.value)}
                    placeholder="Java 21, Spring Boot 3, Apache Kafka, Redis, Docker"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-indigo-300 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* 4 Architectural Blueprint Nodes */}
                <div className="space-y-2 pt-1">
                  <label className="block text-slate-300 font-bold">
                    4 Architectural Blueprint Nodes
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formNode1}
                      onChange={(e) => setFormNode1(e.target.value)}
                      placeholder="Node 1 (e.g. Ingestion API Gateway)"
                      className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formNode2}
                      onChange={(e) => setFormNode2(e.target.value)}
                      placeholder="Node 2 (e.g. Event Stream Broker)"
                      className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formNode3}
                      onChange={(e) => setFormNode3(e.target.value)}
                      placeholder="Node 3 (e.g. Persistent State Machine)"
                      className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formNode4}
                      onChange={(e) => setFormNode4(e.target.value)}
                      placeholder="Node 4 (e.g. Health & Telemetry Probes)"
                      className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 4 Evaluation Rubrics */}
                <div className="space-y-2 pt-1">
                  <label className="block text-slate-300 font-bold">
                    4 Rubric Evaluation Criteria (100 Pts Total)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formRubric1}
                      onChange={(e) => setFormRubric1(e.target.value)}
                      placeholder="Criterion 1 (25 pts)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formRubric2}
                      onChange={(e) => setFormRubric2(e.target.value)}
                      placeholder="Criterion 2 (25 pts)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formRubric3}
                      onChange={(e) => setFormRubric3(e.target.value)}
                      placeholder="Criterion 3 (25 pts)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={formRubric4}
                      onChange={(e) => setFormRubric4(e.target.value)}
                      placeholder="Criterion 4 (25 pts)"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-bold mb-1">
                      Starter GitHub Template
                    </label>
                    <input
                      type="url"
                      value={formGithubTemplate}
                      onChange={(e) => setFormGithubTemplate(e.target.value)}
                      placeholder="https://github.com/spring-projects/spring-petclinic"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Target Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setProjectModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProject}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
                  >
                    {savingProject && <i className="fa-solid fa-spinner animate-spin"></i>}
                    <span>{savingProject ? 'Saving Blueprint...' : 'Save & Publish to Schedule'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 3: Delete Confirmation Modal */}
        {/* ========================================================================= */}
        {targetToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl shadow-rose-950/40 space-y-4 animate-fade-in">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Confirm Project Deletion</h3>
                  <p className="text-xs text-rose-300">This action cannot be undone</p>
                </div>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-xs space-y-2">
                <div className="font-bold text-white">
                  Week {targetToDelete.week_number}: {targetToDelete.title}
                </div>
                <p className="text-slate-400">
                  Deleting this project target will remove it from the student curriculum road and erase any associated student submission records for Week {targetToDelete.week_number}.
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTarget}
                  disabled={deleting}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center space-x-1.5"
                >
                  {deleting && <i className="fa-solid fa-spinner animate-spin"></i>}
                  <span>{deleting ? 'Deleting...' : 'Yes, Delete Target'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL 4: Manual Submission Grading Drawer */}
        {/* ========================================================================= */}
        {gradingSub && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-black font-mono">
                    EVALUATION DESK: WEEK {gradingSub.week_number}
                  </span>
                  <h3 className="text-xl font-black text-white mt-1.5">{gradingSub.project_title}</h3>
                  <p className="text-xs text-slate-400">
                    Student: <span className="text-white font-bold">{gradingSub.student_name}</span> ({gradingSub.student_email})
                  </p>
                </div>
                <button
                  onClick={() => setGradingSub(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {gradeResultMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    gradeResultMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {gradeResultMsg.text}
                </div>
              )}

              {/* Submission Details Card */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 font-bold block">GitHub Repository:</span>
                    <a
                      href={gradingSub.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 font-mono underline break-all flex items-center space-x-1 mt-0.5"
                    >
                      <i className="fa-brands fa-github"></i>
                      <span>{gradingSub.github_url}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">Immutable Commit SHA:</span>
                    <div className="font-mono text-indigo-300 bg-slate-900 p-1.5 rounded border border-slate-700 mt-0.5 truncate">
                      {gradingSub.commit_sha}
                    </div>
                  </div>
                </div>

                {gradingSub.notes && (
                  <div>
                    <span className="text-slate-400 font-bold block">Student Implementation Notes:</span>
                    <p className="text-slate-200 mt-0.5 italic">{gradingSub.notes}</p>
                  </div>
                )}
              </div>

              {/* Grading Form */}
              <form onSubmit={handleSubmitGrade} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Evaluation Outcome Decision <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={gradeStatus}
                      onChange={(e: any) => setGradeStatus(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:outline-hidden focus:border-indigo-500"
                    >
                      <option value="APPROVED">✅ APPROVED (Unlocks Next Week + 500 XP)</option>
                      <option value="REVISION_NEEDED">⚠️ REVISION NEEDED (Request Changes)</option>
                      <option value="UNDER_REVIEW">⏳ UNDER REVIEW (In-Progress)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      Rubric Score (0–100): <span className="text-emerald-400 font-mono font-black">{gradeScore} pts</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={gradeScore}
                      onChange={(e) => setGradeScore(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Mentor Feedback &amp; Architectural Remarks <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={gradeFeedback}
                    onChange={(e) => setGradeFeedback(e.target.value)}
                    placeholder="Provide specific constructive code feedback, concurrency insights, or praise..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setGradingSub(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingGrade}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
                  >
                    {savingGrade && <i className="fa-solid fa-spinner animate-spin"></i>}
                    <span>{savingGrade ? 'Recording Grade...' : 'Publish Evaluation & Unlock'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal for Docker Logs */}
        {selectedSandboxSub && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-white text-base">Docker Sandbox Evaluation: {selectedSandboxSub.id}</h3>
                <button
                  onClick={() => setSelectedSandboxSub(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl font-mono text-indigo-300 border border-slate-800">
                  {selectedSandboxSub.feedback || 'No logs generated.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
