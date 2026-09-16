'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface QuizQuestion {
  id: string;
  rawId?: number;
  question: string;
  options: string[];
  correctAnswer: number;
  correctOption?: string;
}

interface Quiz {
  id: string;
  rawId: number;
  title: string;
  courseId?: number;
  course: string;
  module: string;
  questionsCount: number;
  passingScore: string;
  timeLimit: string;
  isPublished: boolean;
  questions?: QuizQuestion[];
}

interface CourseOption {
  id: number;
  title: string;
  modules: Array<{ id: number; title: string }>;
}

const REAL_COURSES = [
  'Java Full Stack & Cloud Engineering',
  'Data Science, Machine Learning & GenAI',
  'DevOps & Multi-Cloud Architecture',
];

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [coursesData, setCoursesData] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    passingScore: '80%',
    timeLimit: '20 mins',
    isPublished: true,
  });

  const [manualQuestions, setManualQuestions] = useState<Array<{
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: number;
  }>>([
    {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 0,
    },
  ]);

  // AI Generator Modal State
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'basic' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<QuizQuestion[]>([]);

  // Fetch Quizzes from MySQL Database
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/quizzes');
      const data = await res.json();
      if (data.success && Array.isArray(data.quizzes)) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error('Failed to load admin quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();

    // Fetch real courses and their modules
    async function fetchCourseList() {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          const list: CourseOption[] = data.courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            modules: Array.isArray(c.modules) ? c.modules.map((m: any) => ({ id: m.id, title: m.title })) : [],
          }));
          setCoursesData(list);
          if (list.length > 0) {
            setSelectedCourseId(list[0].id);
            if (list[0].modules.length > 0) {
              setSelectedModuleId(list[0].modules[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load courses with modules:', err);
      }
    }
    fetchCourseList();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCourseChange = (courseId: number) => {
    setSelectedCourseId(courseId);
    const found = coursesData.find((c) => c.id === courseId);
    if (found && found.modules.length > 0) {
      setSelectedModuleId(found.modules[0].id);
    } else {
      setSelectedModuleId('');
    }
  };

  const currentCourse = coursesData.find((c) => c.id === selectedCourseId) || coursesData[0];
  const currentModules = currentCourse?.modules || [];

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz from MySQL and Student LMS?')) return;
    try {
      const res = await fetch(`/api/admin/quizzes?quizId=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Quiz deleted from MySQL successfully.');
        await fetchQuizzes();
      } else {
        alert(data.error || 'Failed to delete quiz.');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting quiz.');
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Please enter a quiz title.');
      return;
    }

    const validQuestions = manualQuestions.filter((q) => q.question.trim());
    if (validQuestions.length === 0) {
      alert('Please add at least 1 question.');
      return;
    }

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      if (!q.optionA.trim() || !q.optionB.trim()) {
        alert(`Question #${i + 1} must have at least Option A and Option B.`);
        return;
      }
    }

    const payloadQuestions = validQuestions.map((q) => ({
      question: q.question.trim(),
      options: [
        q.optionA.trim(),
        q.optionB.trim(),
        q.optionC.trim() || 'N/A',
        q.optionD.trim() || 'N/A',
      ],
      correctAnswer: q.correctAnswer,
    }));

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          course: currentCourse?.title || 'General Engineering',
          courseId: selectedCourseId,
          moduleId: selectedModuleId || undefined,
          passingScore: formData.passingScore,
          timeLimit: formData.timeLimit,
          questions: payloadQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Quiz published to MySQL and Student LMS successfully!');
        setShowCreateModal(false);
        setFormData({
          title: '',
          passingScore: '80%',
          timeLimit: '20 mins',
          isPublished: true,
        });
        setManualQuestions([{ question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 0 }]);
        await fetchQuizzes();
      } else {
        alert(data.error || 'Failed to create quiz.');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate AI Questions & Publish Directly
  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      alert('Please enter a topic.');
      return;
    }

    try {
      setAiLoading(true);
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          count: aiCount,
          courseContext: currentCourse?.title || 'Java Full Stack & Cloud Engineering',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const mapped = data.questions.map((q: any, idx: number) => ({
          id: `ai_${idx}`,
          question: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswer: typeof q.correct === 'number' ? q.correct : 0,
        }));
        setAiGeneratedQuestions(mapped);
      } else {
        alert(data.message || 'AI generation failed.');
      }
    } catch (err: any) {
      alert(err.message || 'AI generation error.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublishAiQuiz = async () => {
    if (aiGeneratedQuestions.length === 0) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: aiTopic.trim(),
          course: currentCourse?.title || 'Java Full Stack & Cloud Engineering',
          courseId: selectedCourseId,
          moduleId: selectedModuleId || undefined,
          passingScore: '80%',
          timeLimit: '20 mins',
          questions: aiGeneratedQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('AI Assessment saved & published directly to MySQL and Student LMS!');
        setShowAiModal(false);
        setAiTopic('');
        setAiGeneratedQuestions([]);
        await fetchQuizzes();
      } else {
        alert(data.error || 'Failed to publish AI assessment.');
      }
    } catch (e: any) {
      alert(e.message || 'Error publishing AI assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Toast */}
        {toastMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-in fade-in zoom-in-95 duration-150">
            <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              <span>Platform Assessment Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Admin Quiz Studio &amp; LMS Publishing</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              All quizzes created or generated here are stored in MySQL and immediately accessible by students in the LMS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs transition shadow-md shadow-emerald-600/30 flex items-center space-x-2"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>AI Quiz Generator</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-md shadow-purple-600/30 flex items-center space-x-2"
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create Custom Quiz</span>
            </button>
          </div>
        </div>

        {/* Quizzes Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
              <i className="fa-solid fa-layer-group text-purple-600"></i>
              <span>Published Quizzes in MySQL ({quizzes.length})</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Live sync with `/dashboard/quizzes`</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-2">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl text-purple-600"></i>
              <div>Loading quizzes from MySQL...</div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs space-y-3">
              <i className="fa-solid fa-clipboard-question text-3xl text-slate-300"></i>
              <div>No quizzes found in MySQL. Click "AI Quiz Generator" to publish your first assessment.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">
                    <th className="py-3 px-5">Quiz Title</th>
                    <th className="py-3 px-4">Assigned Course</th>
                    <th className="py-3 px-4">Questions</th>
                    <th className="py-3 px-4">Pass / Time</th>
                    <th className="py-3 px-4">LMS Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {quizzes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">{q.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">ID: {q.id} • {q.module}</div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 inline-block">
                          {q.course}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {q.questionsCount} Questions
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div>Pass: <strong className="text-emerald-700">{q.passingScore}</strong></div>
                        <div className="text-slate-400 font-mono text-[11px]">{q.timeLimit}</div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 inline-flex items-center space-x-1 w-max">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Live in Student LMS</span>
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right space-x-2 whitespace-nowrap">
                        <Link
                          href={`/dashboard/quizzes?topic=${encodeURIComponent(q.title)}`}
                          target="_blank"
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition text-[11px] inline-flex items-center space-x-1"
                          title="Open as Student Preview"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                          <span>Student View</span>
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition text-[11px] inline-flex items-center space-x-1"
                          title="Delete from MySQL"
                        >
                          <i className="fa-solid fa-trash text-[10px]"></i>
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create Custom Quiz */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-black">
                    <i className="fa-solid fa-file-pen"></i>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Create &amp; Publish Custom Quiz</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleCreateQuiz} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Quiz Title / Topic</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Java Concurrency & Multi-Threading Assessment"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Target Course</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => handleCourseChange(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                    >
                      {coursesData.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Target Module</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                    >
                      {currentModules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Passing Score (%)</label>
                    <input
                      type="text"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Time Limit (mins)</label>
                    <input
                      type="text"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>

                {/* Question Builder Section */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">Quiz Questions ({manualQuestions.length})</span>
                    <button
                      type="button"
                      onClick={() =>
                        setManualQuestions((prev) => [
                          ...prev,
                          { question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 0 },
                        ])
                      }
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl font-extrabold hover:bg-purple-100 flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {manualQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-800 text-xs">Question #{qIdx + 1}</span>
                          {manualQuestions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setManualQuestions((prev) => prev.filter((_, idx) => idx !== qIdx))}
                              className="text-rose-500 hover:text-rose-700 font-bold text-[11px]"
                            >
                              <i className="fa-solid fa-trash-can mr-1"></i> Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          required
                          placeholder="e.g. What is the time complexity of QuickSort average case?"
                          value={q.question}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManualQuestions((prev) =>
                              prev.map((item, idx) => (idx === qIdx ? { ...item, question: val } : item))
                            );
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-purple-600"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[10px] font-extrabold text-slate-500">Option A</label>
                              <label className="text-[10px] font-bold text-slate-600 flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctAnswer === 0}
                                  onChange={() =>
                                    setManualQuestions((prev) =>
                                      prev.map((item, idx) => (idx === qIdx ? { ...item, correctAnswer: 0 } : item))
                                    )
                                  }
                                />
                                <span className={q.correctAnswer === 0 ? 'text-emerald-600 font-extrabold' : ''}>Correct</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Option A answer"
                              value={q.optionA}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualQuestions((prev) =>
                                  prev.map((item, idx) => (idx === qIdx ? { ...item, optionA: val } : item))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[10px] font-extrabold text-slate-500">Option B</label>
                              <label className="text-[10px] font-bold text-slate-600 flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctAnswer === 1}
                                  onChange={() =>
                                    setManualQuestions((prev) =>
                                      prev.map((item, idx) => (idx === qIdx ? { ...item, correctAnswer: 1 } : item))
                                    )
                                  }
                                />
                                <span className={q.correctAnswer === 1 ? 'text-emerald-600 font-extrabold' : ''}>Correct</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              required
                              placeholder="Option B answer"
                              value={q.optionB}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualQuestions((prev) =>
                                  prev.map((item, idx) => (idx === qIdx ? { ...item, optionB: val } : item))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[10px] font-extrabold text-slate-500">Option C</label>
                              <label className="text-[10px] font-bold text-slate-600 flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctAnswer === 2}
                                  onChange={() =>
                                    setManualQuestions((prev) =>
                                      prev.map((item, idx) => (idx === qIdx ? { ...item, correctAnswer: 2 } : item))
                                    )
                                  }
                                />
                                <span className={q.correctAnswer === 2 ? 'text-emerald-600 font-extrabold' : ''}>Correct</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="Option C answer"
                              value={q.optionC}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualQuestions((prev) =>
                                  prev.map((item, idx) => (idx === qIdx ? { ...item, optionC: val } : item))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[10px] font-extrabold text-slate-500">Option D</label>
                              <label className="text-[10px] font-bold text-slate-600 flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct_${qIdx}`}
                                  checked={q.correctAnswer === 3}
                                  onChange={() =>
                                    setManualQuestions((prev) =>
                                      prev.map((item, idx) => (idx === qIdx ? { ...item, correctAnswer: 3 } : item))
                                    )
                                  }
                                />
                                <span className={q.correctAnswer === 3 ? 'text-emerald-600 font-extrabold' : ''}>Correct</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              placeholder="Option D answer"
                              value={q.optionD}
                              onChange={(e) => {
                                const val = e.target.value;
                                setManualQuestions((prev) =>
                                  prev.map((item, idx) => (idx === qIdx ? { ...item, optionD: val } : item))
                                );
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-900"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold shadow-md transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <span>{submitting ? 'Publishing to MySQL...' : 'Save & Publish to LMS'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI Quiz Generator */}
        {showAiModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-black">
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">AI Assessment Generator (Gemini Engine)</h3>
                </div>
                <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <form onSubmit={handleGenerateAiQuiz} className="space-y-4 text-xs">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Assessment Topic</label>
                  <input
                    type="text"
                    required
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Java 21 Virtual Threads & Concurrency"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Target Course</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => handleCourseChange(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      {coursesData.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Target Module</label>
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      {currentModules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Difficulty Level</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      <option value="basic">Basic</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-extrabold text-slate-700 block mb-1">Question Count</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      <option value={3}>3 Questions</option>
                      <option value={5}>5 Questions</option>
                      <option value={10}>10 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={aiLoading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {aiLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      <span>Generating Rigorous Assessment via Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Generate Assessment Questions</span>
                    </>
                  )}
                </button>
              </form>

              {/* Preview Generated Questions */}
              {aiGeneratedQuestions.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs">
                      Generated Questions Preview ({aiGeneratedQuestions.length})
                    </span>
                    <button
                      onClick={handlePublishAiQuiz}
                      disabled={submitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {submitting ? 'Publishing...' : 'Save & Publish to Database &rarr;'}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {aiGeneratedQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                        <div className="font-bold text-slate-900">
                          {idx + 1}. {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={oIdx === q.correctAnswer ? 'text-emerald-700 font-bold' : ''}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctAnswer && '✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <StudentFooter />
    </div>
  );
}
