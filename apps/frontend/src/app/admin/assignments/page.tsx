'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface SubmissionItem {
  id: string;
  rawId: number;
  assignmentTitle: string;
  studentName: string;
  studentEmail: string;
  submissionText: string;
  filePath: string;
  status: string;
  marks: number | null;
  feedback: string;
  submittedAt: string;
}

export default function AdminAssignmentsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<SubmissionItem | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(95);
  const [feedbackText, setFeedbackText] = useState<string>('Great work! Your submission meets all technical requirements.');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/assignments');
      const data = await res.json();
      if (data.success && data.submissions) {
        setSubmissions(data.submissions);
        if (data.submissions.length > 0 && !activeSub) {
          setActiveSub(data.submissions[0]);
          setGradeScore(data.submissions[0].marks ?? 90);
          setFeedbackText(data.submissions[0].feedback || 'Well-structured implementation.');
        }
      }
    } catch (err) {
      console.error('Failed to load assignment submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSelectSubmission = (sub: SubmissionItem) => {
    setActiveSub(sub);
    setGradeScore(sub.marks ?? 90);
    setFeedbackText(sub.feedback || 'Well-structured implementation.');
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSub) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawId: activeSub.rawId,
          marks: gradeScore,
          feedback: feedbackText,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessBanner(`Grade (${gradeScore}/100) saved for ${activeSub.studentName} in database.`);
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchSubmissions();
      }
    } catch (err) {
      console.error('Failed to submit grade:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 w-full space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <div>
            <span className="px-3.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-extrabold uppercase tracking-wider">
              Faculty Evaluation Hub (Live MySQL)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Instructor Code Grading Desk
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              Review student assignment submissions, score technical proficiency, and issue faculty feedback.
            </p>
          </div>

          <Link href="/admin" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition shrink-0">
            &larr; Overview
          </Link>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Submission List */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Submissions Queue ({submissions.length})</span>
              <i className="fa-solid fa-inbox text-purple-600"></i>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No assignment submissions yet.</div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSelectSubmission(sub)}
                    className={`w-full text-left p-3.5 rounded-2xl transition border ${
                      activeSub?.id === sub.id
                        ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-600/20'
                        : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sub.status === 'graded' ? `${sub.marks}/100` : 'Pending'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-1">{sub.assignmentTitle}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submission Detail & Grading Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            {activeSub ? (
              <>
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{activeSub.assignmentTitle}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Student: <strong className="text-slate-800">{activeSub.studentName}</strong> ({activeSub.studentEmail})
                      </p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(activeSub.submittedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                    Submitted Source Code / Notes
                  </label>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-2xl overflow-x-auto max-h-60">
                    {activeSub.submissionText}
                  </pre>
                </div>

                <form onSubmit={handleGradeSubmit} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="font-bold text-slate-700 text-xs block mb-1">Score (Out of 100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gradeScore}
                        onChange={(e) => setGradeScore(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 text-xs block mb-1">Faculty Feedback</label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
                      placeholder="Add remarks on design patterns, time complexity, and clean code principles..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/30 transition flex items-center space-x-2"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>{submitting ? 'Saving...' : 'Publish Evaluation Grade'}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                Select a submission from the queue to view details and assign a grade.
              </div>
            )}
          </div>

        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
