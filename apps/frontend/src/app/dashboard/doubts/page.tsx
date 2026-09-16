'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Doubt {
  id: string;
  topic: string;
  questionText: string;
  codeSnippet: string;
  course: string;
  submittedAt: string;
  status: 'pending' | 'resolved';
  answerText?: string;
}

export default function StudentDoubtsPage() {
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDoubts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/student/doubts');
      const data = await res.json();
      if (data.success && Array.isArray(data.doubts)) {
        setDoubts(data.doubts);
      }
    } catch (err) {
      console.error('Failed to fetch student doubts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoubts();
  }, []);

  const handleSubmitDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || topic.length < 5) { setFormError('Topic must be at least 5 characters.'); return; }
    if (!questionText.trim() || questionText.length < 15) { setFormError('Please describe your doubt in at least 15 characters.'); return; }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await fetch('/api/student/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          questionText: questionText.trim(),
          codeSnippet: codeSnippet.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTopic('');
        setQuestionText('');
        setCodeSnippet('');
        setSuccessBanner('Your doubt has been submitted to the faculty desk! Your instructor will respond within 24 hours.');
        setTimeout(() => setSuccessBanner(''), 6000);
        await fetchDoubts();
      } else {
        setFormError(data.error || 'Failed to submit doubt.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error submitting doubt.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoubts = doubts.filter((d) => {
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'resolved') return d.status === 'resolved';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              <i className="fa-solid fa-comments"></i>
              <span>Student Q&amp;A Desk (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Doubt Submission Portal</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Submit code bugs, architecture questions, or conceptual doubts — your faculty responds within 24 hours.</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5">
            <i className="fa-solid fa-arrow-left text-[10px]"></i><span>Back to Dashboard</span>
          </Link>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i><span>{successBanner}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Submission Form */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Submit a New Doubt</h2>
            {formError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center space-x-2">
                <i className="fa-solid fa-triangle-exclamation"></i><span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSubmitDoubt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Doubt Subject / Topic</label>
                <input type="text" placeholder="e.g. Spring Security Filter Chain NullPointerException" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Detailed Question Description</label>
                <textarea rows={5} placeholder="Describe what you are trying to do, expected behavior, and what error you are seeing..." value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 leading-relaxed" required></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Code Snippet (Optional)</label>
                <textarea rows={4} placeholder="Paste relevant code snippet or stack trace here..." value={codeSnippet} onChange={(e) => setCodeSnippet(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-emerald-300 font-mono focus:ring-2 focus:ring-indigo-500 leading-relaxed"></textarea>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/25 flex items-center space-x-2 disabled:opacity-50">
                  <i className="fa-solid fa-paper-plane"></i><span>{submitting ? 'Submitting...' : 'Submit to Faculty Desk'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Previous Doubts Feed */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">My Question History</h2>
              <div className="flex space-x-1 text-[10px]">
                {(['all', 'pending', 'resolved'] as const).map((tab) => (
                  <button key={tab} onClick={() => setFilter(tab)} className={`px-2 py-0.5 rounded-md font-bold capitalize ${filter === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading questions...</div>
            ) : filteredDoubts.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">No questions found.</div>
            ) : (
              <div className="space-y-3">
                {filteredDoubts.map((doubt) => (
                  <div key={doubt.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400">{doubt.submittedAt ? new Date(doubt.submittedAt).toLocaleDateString() : 'Recent'}</span>
                      <span className={`px-2 py-0.5 rounded-full ${doubt.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doubt.status === 'resolved' ? 'Answered' : 'In Review'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">{doubt.topic}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">{doubt.questionText}</p>
                    {doubt.answerText && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium mt-1">
                        <span className="font-bold block text-emerald-800">Faculty Reply:</span>
                        {doubt.answerText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
      <StudentFooter />
    </div>
  );
}
