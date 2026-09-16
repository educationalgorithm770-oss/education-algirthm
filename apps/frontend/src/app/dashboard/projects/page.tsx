'use client';

import React, { useState, useEffect } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

interface ProjectTarget {
  id: string;
  dbId: number;
  weekNumber: number;
  title: string;
  phase: string;
  difficulty: string;
  description: string;
  techStack: string[];
  architectureNodes: string[];
  githubTemplate: string;
  rubric: string[];
  dueDate: string;
  targetStatus: 'DRAFT' | 'SCHEDULED' | 'RELEASED' | 'ACTIVE' | 'CLOSED';
  isUnlocked: boolean;
  submission: {
    id: number;
    githubUrl: string;
    commitSha: string;
    demoUrl?: string;
    notes?: string;
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REVISION_NEEDED';
    score?: number;
    mentorFeedback?: string;
    submittedAt: string;
    reviewedAt?: string;
  } | null;
}

export default function StudentProjectsDashboard() {
  const [targets, setTargets] = useState<ProjectTarget[]>([]);
  const [currentUnlockedWeek, setCurrentUnlockedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState<string>('ALL');
  const [selectedTarget, setSelectedTarget] = useState<ProjectTarget | null>(null);
  const [reviewModalTarget, setReviewModalTarget] = useState<ProjectTarget | null>(null);

  // Submission Modal Form State
  const [submittingTarget, setSubmittingTarget] = useState<ProjectTarget | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Student Profile
  const [studentName, setStudentName] = useState('Student');
  const [studentEmail, setStudentEmail] = useState('');

  // Countdown Timer
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects/targets');
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets || []);
        setCurrentUnlockedWeek(data.currentUnlockedWeek || 1);
      }
    } catch (err) {
      console.error('Failed to load targets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTargets();
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        const d = await res.json();
        if (d.success && d.user) {
          setStudentName(d.user.name || 'Student');
          setStudentEmail(d.user.email || '');
        }
      } catch (_) {}
    }
    loadMe();
  }, []);

  // Find the primary active target for the student
  const activeTarget = targets.find(
    (t) => t.isUnlocked && (!t.submission || t.submission.status === 'REVISION_NEEDED' || t.submission.status === 'SUBMITTED')
  ) || targets.find((t) => t.isUnlocked) || targets[0];

  // Countdown effect for active target due date
  useEffect(() => {
    if (!activeTarget?.dueDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const due = new Date(activeTarget.dueDate).getTime();
      const diff = due - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTarget]);

  const phases = [
    { id: 'ALL', name: 'All 16 Weeks' },
    { id: 'Phase 1', name: 'Phase 1: Core Java' },
    { id: 'Phase 2', name: 'Phase 2: DB & Spring Boot' },
    { id: 'Phase 3', name: 'Phase 3: Microservices & Kafka' },
    { id: 'Phase 4', name: 'Phase 4: GenAI & Cloud DevOps' }
  ];

  const filteredTargets = targets.filter((t) => {
    if (activePhase === 'ALL') return true;
    return t.phase.toLowerCase().includes(activePhase.toLowerCase());
  });

  const approvedCount = targets.filter((t) => t.submission?.status === 'APPROVED').length;
  const progressPercent = Math.round((approvedCount / 16) * 100);
  const totalXp = targets.reduce((sum, t) => (t.submission?.status === 'APPROVED' ? sum + 500 : sum), 0);

  const openSubmitModal = (target: ProjectTarget) => {
    setSubmittingTarget(target);
    setGithubUrl(target.submission?.githubUrl || '');
    setCommitSha(target.submission?.commitSha || '');
    setDemoUrl(target.submission?.demoUrl || '');
    setNotes(target.submission?.notes || '');
    setSubmitMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingTarget) return;

    setSubmitting(true);
    setSubmitMsg(null);

    try {
      const res = await fetch('/api/projects/submit-target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekNumber: submittingTarget.weekNumber,
          targetId: submittingTarget.dbId,
          githubUrl,
          commitSha: commitSha || 'HEAD-' + Math.random().toString(36).substring(2, 9),
          demoUrl,
          notes,
          studentName,
          studentEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitMsg({ text: data.message, type: 'success' });
        setTimeout(() => {
          setSubmittingTarget(null);
          fetchTargets();
        }, 1200);
      } else {
        setSubmitMsg({ text: data.message || 'Submission failed.', type: 'error' });
      }
    } catch {
      setSubmitMsg({ text: 'Network error. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      <StudentNavbar />

      <main className="flex-1 py-8 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        {/* Top Hero Banner & Milestone Tracker */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                  🔥 16-Week Production Project Engine
                </span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                  Batch: Java &amp; GenAI 2026
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Enterprise Java &amp; AI Project Curriculum
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Build and deploy 16 real-world microservices, low-level concurrency engines, and GenAI systems. 
                Complete weekly instructor targets, submit immutable Git Commit SHAs, and unlock progressive milestones.
              </p>
            </div>

            {/* Live Progress Card */}
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/60 p-5 sm:min-w-[280px] space-y-3 shrink-0 shadow-lg">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                <span>Milestone Completion</span>
                <span className="text-indigo-400 font-mono font-black">{approvedCount} / 16 Completed</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-700 p-0.5">
                <div
                  className="bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.max( progressPercent, 6)}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-xs font-medium pt-1">
                <div className="flex items-center space-x-1 text-amber-400 font-bold">
                  <span>⚡</span>
                  <span>{totalXp} XP Earned</span>
                </div>
                <div className="text-indigo-300 text-[11px] font-mono">
                  Week {currentUnlockedWeek} Active
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Target Hero Card with Live Countdown */}
        {activeTarget && (
          <div className="bg-slate-800/90 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-black uppercase">
                    🎯 Current Target: Week {activeTarget.weekNumber}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold">
                    {activeTarget.phase}
                  </span>
                  <span className="px-2.5 py-1 bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 rounded-lg text-xs font-semibold">
                    {activeTarget.difficulty}
                  </span>
                  {activeTarget.submission?.status && (
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                      activeTarget.submission.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      activeTarget.submission.status === 'REVISION_NEEDED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
                    }`}>
                      {activeTarget.submission.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white">{activeTarget.title}</h2>
                <p className="text-slate-300 text-sm">{activeTarget.description}</p>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeTarget.techStack.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 bg-slate-900/90 text-indigo-300 border border-slate-700/80 rounded-md text-[11px] font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Countdown & Action Button */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 shrink-0 flex flex-col items-center text-center space-y-4 w-full lg:w-72">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ⏳ Target Submission Deadline
                </div>
                {timeLeft ? (
                  <div className="grid grid-cols-4 gap-2 w-full">
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <div className="text-xl font-black text-white font-mono">{timeLeft.days}</div>
                      <div className="text-[10px] text-slate-400 font-bold">DAYS</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <div className="text-xl font-black text-white font-mono">{timeLeft.hours}</div>
                      <div className="text-[10px] text-slate-400 font-bold">HRS</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <div className="text-xl font-black text-white font-mono">{timeLeft.mins}</div>
                      <div className="text-[10px] text-slate-400 font-bold">MIN</div>
                    </div>
                    <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <div className="text-xl font-black text-indigo-400 font-mono">{timeLeft.secs}</div>
                      <div className="text-[10px] text-slate-400 font-bold">SEC</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">Calculating schedule...</span>
                )}

                <button
                  onClick={() => openSubmitModal(activeTarget)}
                  className="w-full py-3 bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
                >
                  <i className="fa-brands fa-github text-sm"></i>
                  <span>
                    {activeTarget.submission?.status === 'REVISION_NEEDED' ? 'Re-Submit Revision' :
                     activeTarget.submission ? 'Update Submission' : 'Submit Target Code'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePhase(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition whitespace-nowrap ${
                activePhase === p.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* 16-Week Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredTargets.map((target) => {
            const isApproved = target.submission?.status === 'APPROVED';
            const isSubmitted = target.submission?.status === 'SUBMITTED' || target.submission?.status === 'UNDER_REVIEW';
            const isRevision = target.submission?.status === 'REVISION_NEEDED';
            const isLocked = !target.isUnlocked;

            return (
              <div
                key={target.weekNumber}
                className={`group rounded-2xl border p-5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                  isApproved
                    ? 'bg-slate-800/70 border-emerald-500/40 hover:border-emerald-500 shadow-lg shadow-emerald-950/20'
                    : isRevision
                    ? 'bg-slate-800/70 border-rose-500/40 hover:border-rose-500'
                    : isSubmitted
                    ? 'bg-slate-800/70 border-indigo-500/40 hover:border-indigo-500'
                    : isLocked
                    ? 'bg-slate-900/50 border-slate-800 opacity-65 cursor-not-allowed'
                    : 'bg-slate-800/90 border-slate-700 hover:border-indigo-500/80 hover:shadow-xl hover:shadow-indigo-950/40'
                }`}
              >
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono ${
                      isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      isRevision ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      isSubmitted ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      isLocked ? 'bg-slate-800 text-slate-500' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      Week {target.weekNumber}
                    </span>

                    {/* Status Badge */}
                    {isLocked ? (
                      <span className="text-slate-500 text-xs flex items-center space-x-1">
                        <i className="fa-solid fa-lock text-[10px]"></i>
                        <span className="text-[10px] font-bold">Locked</span>
                      </span>
                    ) : isApproved ? (
                      <span className="text-emerald-400 text-xs font-black flex items-center space-x-1">
                        <i className="fa-solid fa-circle-check text-[11px]"></i>
                        <span className="text-[10px]">{target.submission?.score}/100</span>
                      </span>
                    ) : isRevision ? (
                      <span className="text-rose-400 text-xs font-black flex items-center space-x-1">
                        <i className="fa-solid fa-triangle-exclamation text-[11px]"></i>
                        <span className="text-[10px]">Revision</span>
                      </span>
                    ) : isSubmitted ? (
                      <span className="text-indigo-400 text-xs font-bold flex items-center space-x-1">
                        <i className="fa-solid fa-clock text-[10px]"></i>
                        <span className="text-[10px]">Under Review</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 text-[10px] font-black uppercase">Active Target</span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-white text-base leading-snug group-hover:text-indigo-300 transition line-clamp-2">
                      {target.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{target.description}</p>
                  </div>

                  {/* Tech stack pills */}
                  <div className="flex flex-wrap gap-1">
                    {target.techStack.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-900/80 text-slate-400 border border-slate-700/60 px-2 py-0.5 rounded font-mono">
                        {t}
                      </span>
                    ))}
                    {target.techStack.length > 3 && (
                      <span className="text-[10px] text-slate-500 self-center">+{target.techStack.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-700/60 mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedTarget(target)}
                    className="text-xs font-bold text-slate-400 hover:text-indigo-300 transition flex items-center space-x-1"
                  >
                    <i className="fa-solid fa-circle-info text-[10px]"></i>
                    <span>Spec &amp; Nodes</span>
                  </button>

                  {!isLocked ? (
                    <div className="flex items-center space-x-1.5">
                      {target.submission?.mentorFeedback && (
                        <button
                          onClick={() => setReviewModalTarget(target)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold rounded-lg transition"
                          title="View Mentor Feedback"
                        >
                          Feedback
                        </button>
                      )}
                      <button
                        onClick={() => openSubmitModal(target)}
                        className={`px-3 py-1.5 text-xs font-black rounded-lg transition ${
                          isApproved ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30' :
                          isRevision ? 'bg-rose-600 text-white hover:bg-rose-500' :
                          isSubmitted ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' :
                          'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {isApproved ? 'Completed' : isRevision ? 'Re-Submit' : isSubmitted ? 'Update' : 'Submit'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-600 font-mono">Unlock Week {target.weekNumber - 1} first</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Target Details / Spec Drawer Modal */}
        {selectedTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-black font-mono">
                    WEEK {selectedTarget.weekNumber} ARCHITECTURE BLUEPRINT
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">{selectedTarget.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedTarget.phase} &bull; {selectedTarget.difficulty}</p>
                </div>
                <button
                  onClick={() => setSelectedTarget(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <i className="fa-solid fa-xmark text-base"></i>
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div>
                  <h4 className="font-extrabold text-white text-sm mb-1">Target Overview</h4>
                  <p className="leading-relaxed">{selectedTarget.description}</p>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-sm mb-2">Architectural Blueprint Components</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedTarget.architectureNodes.map((node, i) => (
                      <div key={i} className="p-3 bg-slate-800/80 border border-slate-700/60 rounded-xl flex items-center space-x-2">
                        <span className="text-indigo-400 font-black">#0{i+1}</span>
                        <span className="font-semibold text-slate-200">{node}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-sm mb-2">Evaluation Rubric Gating (100 pts)</h4>
                  <div className="space-y-1.5">
                    {selectedTarget.rubric.map((r, i) => (
                      <div key={i} className="flex items-center space-x-2 text-slate-300">
                        <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>
                        <span>{r} (25 pts)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTarget.githubTemplate && (
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Starter Code Repository</div>
                      <div className="text-[11px] text-slate-400">Clone official Spring/Java scaffolding repo</div>
                    </div>
                    <a
                      href={selectedTarget.githubTemplate}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5"
                    >
                      <i className="fa-brands fa-github"></i>
                      <span>Clone Starter</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    const t = selectedTarget;
                    setSelectedTarget(null);
                    openSubmitModal(t);
                  }}
                  disabled={!selectedTarget.isUnlocked}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black text-xs rounded-xl shadow-lg transition"
                >
                  {selectedTarget.isUnlocked ? 'Proceed to Submission &rarr;' : 'Locked (Complete Prior Week)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mentor Feedback Modal */}
        {reviewModalTarget && reviewModalTarget.submission && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xl">🎓</span>
                  <h3 className="font-black text-white text-lg">Mentor Review Scorecard</h3>
                </div>
                <button
                  onClick={() => setReviewModalTarget(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-slate-400 font-bold">Week {reviewModalTarget.weekNumber} Score</span>
                  <span className="text-emerald-400 font-mono font-black text-base">
                    {reviewModalTarget.submission.score !== null ? `${reviewModalTarget.submission.score} / 100` : 'Pending Grade'}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 font-bold">Instructor / Mentor Remarks:</div>
                  <div className="p-3 bg-slate-800 rounded-xl border border-slate-700/60 text-slate-200 leading-relaxed">
                    {reviewModalTarget.submission.mentorFeedback || 'No specific notes recorded. Great progress!'}
                  </div>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="text-slate-500">Evaluated Git Commit SHA:</div>
                  <div className="p-2 bg-slate-950 text-indigo-300 rounded-lg truncate border border-slate-800">
                    {reviewModalTarget.submission.commitSha}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setReviewModalTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
                >
                  Close Scorecard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission Modal */}
        {submittingTarget && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-5 animate-fade-in">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase">
                    Week {submittingTarget.weekNumber} Milestone Submission
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">{submittingTarget.title}</h3>
                </div>
                <button
                  onClick={() => setSubmittingTarget(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {submitMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    submitMsg.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {submitMsg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    GitHub Repository URL <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/your-org/week1-banking-ledger"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Git Commit SHA (Snapshot Verification) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={commitSha}
                    onChange={(e) => setCommitSha(e.target.value)}
                    placeholder="e.g. 7f9a2b84c8d1e2f3a4b5c6d7e8f90123456789ab"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tip: Run <code className="text-indigo-300">git rev-parse HEAD</code> in your terminal and paste the SHA.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Hosted Live Demo / Swagger URL <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={demoUrl}
                    onChange={(e) => setDemoUrl(e.target.value)}
                    placeholder="https://week1-ledger.render.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Implementation Notes &amp; Architecture Decisions
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Describe challenges solved, concurrency locks chosen, or test coverage numbers..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSubmittingTarget(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
                  >
                    {submitting && <i className="fa-solid fa-spinner animate-spin"></i>}
                    <span>{submitting ? 'Verifying & Submitting...' : 'Submit to Faculty Queue'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
