'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Doubt {
  id: string;
  rawId: number;
  studentName: string;
  avatar: string;
  course: string;
  topic: string;
  questionText: string;
  codeSnippet?: string;
  submittedAt: string;
  status: 'pending' | 'resolved';
  answerText?: string;
  answeredAt?: string;
}

export default function InstructorDoubtsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDoubt, setActiveDoubt] = useState<Doubt | null>(null);
  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/instructor/doubts?filter=${filter}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.doubts)) {
        setDoubts(data.doubts);
      }
    } catch (err) {
      console.error('Failed to fetch doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, [filter]);

  const handleOpenAnswerModal = (doubt: Doubt) => {
    setActiveDoubt(doubt);
    setAnswerInput(doubt.answerText || '');
    setErrorMessage('');
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoubt || !answerInput.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage('');
      const res = await fetch('/api/instructor/doubts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubtId: activeDoubt.rawId || activeDoubt.id,
          answer: answerInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Solution dispatched to ${activeDoubt.studentName} for doubt #${activeDoubt.id}!`);
        setTimeout(() => setSuccessMessage(''), 5000);
        setActiveDoubt(null);
        await fetchDoubts();
      } else {
        setErrorMessage(data.error || 'Failed to dispatch solution.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const insertQuickTemplate = (template: string) => {
    setAnswerInput((prev) => (prev ? `${prev}\n\n${template}` : template));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              <i className="fa-solid fa-comments"></i>
              <span>Faculty Support Desk (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Real-Time Student Doubt Desk
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Review code bugs, provide architectural feedback, and answer student questions in real-time.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
            {(['all', 'pending', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  filter === tab
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Doubts Feed */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading student doubts from MySQL database...</div>
        ) : doubts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
            <i className="fa-solid fa-circle-check text-3xl text-emerald-400 block"></i>
            <p className="font-medium text-slate-600">No student doubts found for this filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {doubts.map((doubt) => (
              <div
                key={doubt.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-md">
                      {doubt.avatar}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{doubt.studentName}</span>
                        <span className="text-[10px] text-slate-400">• {doubt.course}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">Submitted {doubt.submittedAt ? new Date(doubt.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Recently'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        doubt.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {doubt.status === 'resolved' ? 'Resolved' : 'Needs Solution'}
                    </span>
                    <button
                      onClick={() => handleOpenAnswerModal(doubt)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-reply"></i>
                      <span>{doubt.status === 'resolved' ? 'Edit Answer' : 'Respond'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{doubt.topic}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{doubt.questionText}</p>
                </div>

                {doubt.codeSnippet && (
                  <div className="p-3 bg-slate-950 rounded-2xl text-[11px] font-mono text-emerald-300 overflow-x-auto border border-slate-800">
                    <pre>{doubt.codeSnippet}</pre>
                  </div>
                )}

                {doubt.answerText && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-emerald-800">
                      <i className="fa-solid fa-chalkboard-user"></i>
                      <span>Faculty Solution:</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap">{doubt.answerText}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Answer Modal */}
      {activeDoubt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Respond to Doubt #{activeDoubt.id}
                </h3>
                <p className="text-xs text-slate-500">{activeDoubt.studentName} • {activeDoubt.topic}</p>
              </div>
              <button onClick={() => setActiveDoubt(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSendAnswer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Your Solution / Architecture Guidance
                </label>
                <textarea
                  rows={6}
                  placeholder="Provide step-by-step code guidance, architecture fixes, or debug recommendations..."
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                  required
                ></textarea>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => insertQuickTemplate('Great effort! The issue is caused by missing @Autowired / dependency injection. Verify your Bean configuration.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  💡 Spring Bean Fix
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickTemplate('Check your Docker network configuration. Make sure ports are correctly mapped (e.g., 8080:8080).')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  🐳 Docker Port Mapping
                </button>
                <button
                  type="button"
                  onClick={() => insertQuickTemplate('Verify your JWT expiry claim in the token generator. The expiration time must be in milliseconds.')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  🔐 JWT Token Claim
                </button>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveDoubt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !answerInput.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  <span>{submitting ? 'Dispatching...' : 'Dispatch Solution to Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
