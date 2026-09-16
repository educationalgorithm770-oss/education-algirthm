'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface QuizQuestion {
  id: string;
  rawId?: number;
  text: string;
  options: string[];
  correctIndex: number;
  correctOption?: string;
  explanation?: string;
}

interface InstructorQuiz {
  id: string;
  rawId: number;
  title: string;
  course: string;
  module?: string;
  passingScore: number;
  timeLimitMins: number;
  isPublished: boolean;
  questions: QuizQuestion[];
}

export default function InstructorQuizzesPage() {
  const [quizzes, setQuizzes] = useState<InstructorQuiz[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal State: AI / Manual Quiz Creator
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<'ai' | 'manual'>('ai');
  
  // AI Generator Form
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuizQuestion[]>([]);

  // Common Quiz Fields
  const [qTitle, setQTitle] = useState('');
  const [courseId, setCourseId] = useState('1');
  const [qPass, setQPass] = useState('80');
  const [qTime, setQTime] = useState('20');
  const [modalError, setModalError] = useState('');

  // Manual questions list in creator
  const [manualQuestions, setManualQuestions] = useState<Array<{ text: string; options: string[]; correctIndex: number }>>([
    { text: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);

  // Add Question to Existing Quiz Modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [addMode, setAddMode] = useState<'ai' | 'manual'>('ai');
  const [singleAiTopic, setSingleAiTopic] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '', '', '']);
  const [newCorrectIndex, setNewCorrectIndex] = useState(0);
  const [addQError, setAddQError] = useState('');

  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch quizzes and assigned courses for instructor
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const [quizRes, courseRes] = await Promise.all([
        fetch('/api/instructor/quizzes'),
        fetch('/api/instructor/courses'),
      ]);
      const [quizData, courseData] = await Promise.all([
        quizRes.json(),
        courseRes.json(),
      ]);
      if (quizData.success && Array.isArray(quizData.quizzes)) {
        setQuizzes(quizData.quizzes);
        if (quizData.quizzes.length > 0 && (!selectedQuizId || !quizData.quizzes.find((q: any) => q.id === selectedQuizId))) {
          setSelectedQuizId(quizData.quizzes[0].id);
        }
      }
      if (courseData.success && Array.isArray(courseData.courses)) {
        setAvailableCourses(courseData.courses);
        if (courseData.courses.length > 0) {
          setCourseId(String(courseData.courses[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const selectedQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0] || null;
  const selectedCourseObj = availableCourses.find((c) => String(c.id) === String(courseId)) || availableCourses[0];

  // AI Generation Handler
  const handleGenerateWithAI = async () => {
    if (!aiTopic.trim()) {
      setModalError('Please enter a topic for AI quiz generation.');
      return;
    }

    try {
      setAiGenerating(true);
      setModalError('');

      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          difficulty: aiDifficulty,
          count: Number(aiCount) || 5,
          courseContext: selectedCourseObj?.title || '',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const parsed: QuizQuestion[] = data.questions.map((q: any, i: number) => ({
          id: `gen_${Date.now()}_${i}`,
          text: q.question,
          options: q.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctIndex: q.correct ?? 0,
          explanation: q.explanation || '',
        }));

        setGeneratedQuestions(parsed);
        if (!qTitle.trim()) {
          setQTitle(`${aiTopic.trim()} Assessment`);
        }
      } else {
        setModalError(data.message || 'AI generation failed. Please retry.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Connection error with AI service.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Generate Single Question for Existing Quiz
  const handleGenerateSingleQuestionAI = async () => {
    if (!singleAiTopic.trim()) {
      setAddQError('Please enter a specific topic or concept for AI question.');
      return;
    }

    try {
      setAiGenerating(true);
      setAddQError('');
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: singleAiTopic.trim(),
          difficulty: 'medium',
          count: 1,
          courseContext: selectedQuiz?.course || '',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const q = data.questions[0];
        setNewQuestionText(q.question);
        setNewOptions(q.options || ['Option A', 'Option B', 'Option C', 'Option D']);
        setNewCorrectIndex(q.correct ?? 0);
      } else {
        setAddQError('AI could not generate question.');
      }
    } catch (err: any) {
      setAddQError(err.message || 'AI Generation error.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit Brand New Quiz (AI or Manual)
  const handleSaveAndPublishQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim() || qTitle.length < 3) {
      setModalError('Quiz title must be at least 3 characters.');
      return;
    }

    let questionsToSubmit: Array<{ text: string; options: string[]; correctIndex: number }> = [];

    if (createMode === 'ai') {
      if (generatedQuestions.length === 0) {
        setModalError('Please click "Generate Questions with AI" first to create your question set.');
        return;
      }
      questionsToSubmit = generatedQuestions.map((q) => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
      }));
    } else {
      const valid = manualQuestions.filter((q) => q.text.trim().length > 0);
      if (valid.length === 0) {
        setModalError('Please write at least one question with options.');
        return;
      }
      questionsToSubmit = valid.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((opt, i) => opt.trim() || `Option ${String.fromCharCode(65 + i)}`),
        correctIndex: q.correctIndex,
      }));
    }

    try {
      setSubmitting(true);
      setModalError('');

      const res = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: qTitle.trim(),
          courseId: Number(courseId) || 1,
          passingScore: qPass,
          timeLimitMins: qTime,
          questions: questionsToSubmit,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setQTitle('');
        setAiTopic('');
        setGeneratedQuestions([]);
        setManualQuestions([{ text: '', options: ['', '', '', ''], correctIndex: 0 }]);
        setSuccessBanner(`✨ AI-Generated Quiz "${qTitle}" published to MySQL successfully!`);
        setTimeout(() => setSuccessBanner(''), 6000);
        await fetchQuizzes();
        if (data.quizId) setSelectedQuizId(data.quizId);
      } else {
        setModalError(data.error || 'Failed to publish quiz.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error saving quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add Question to Existing Quiz Submit
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;
    if (!newQuestionText.trim() || newQuestionText.length < 5) {
      setAddQError('Question prompt must be at least 5 characters.');
      return;
    }
    if (!newOptions[0]?.trim() || !newOptions[1]?.trim()) {
      setAddQError('Please provide at least Option A and Option B.');
      return;
    }

    try {
      setSubmitting(true);
      setAddQError('');
      const res = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_question',
          quizId: selectedQuiz.id,
          newQuestion: {
            text: newQuestionText.trim(),
            options: [
              newOptions[0].trim(),
              newOptions[1].trim(),
              newOptions[2].trim() || 'Option C',
              newOptions[3].trim() || 'Option D',
            ],
            correctIndex: newCorrectIndex,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddQuestionModal(false);
        setNewQuestionText('');
        setNewOptions(['', '', '', '']);
        setNewCorrectIndex(0);
        setSingleAiTopic('');
        setSuccessBanner('New MCQ question added to quiz successfully!');
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchQuizzes();
      } else {
        setAddQError(data.error || 'Failed to add question.');
      }
    } catch (err: any) {
      setAddQError(err.message || 'Error adding question.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Quiz
  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to permanently delete this assessment quiz?')) return;
    try {
      const res = await fetch(`/api/instructor/quizzes?quizId=${encodeURIComponent(quizId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner('Quiz deleted successfully.');
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchQuizzes();
      } else {
        alert(data.error || 'Failed to delete quiz.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting quiz.');
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to remove this question?')) return;
    try {
      const res = await fetch(`/api/instructor/quizzes?questionId=${encodeURIComponent(questionId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner('Question removed from quiz.');
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchQuizzes();
      } else {
        alert(data.error || 'Failed to delete question.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting question.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              <i className="fa-solid fa-brain"></i>
              <span>AI-Powered Quiz Studio (Assigned Tracks)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              AI Quiz Generator &amp; Assessments
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Instantly generate rigorous, technically accurate MCQ exams using Gemini AI, configure pass criteria, and publish to your assigned cohorts.
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setModalError('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span>+ AI Quiz Generator</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Quizzes List & Detail View */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            <i className="fa-solid fa-circle-notch fa-spin text-emerald-600 text-xl block mb-2"></i>
            Loading assigned quizzes &amp; questions...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mx-auto shadow-sm">
              <i className="fa-solid fa-brain"></i>
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">No Quizzes Created Yet</h3>
              <p className="font-medium text-slate-500 max-w-md mx-auto">
                Click "+ AI Quiz Generator" above to generate a full technical assessment for your assigned courses in seconds.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Quiz Selector Pills */}
            <div className="flex items-center space-x-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-x-auto no-scrollbar">
              {quizzes.map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuizId(q.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-2 ${
                    selectedQuizId === q.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <i className="fa-solid fa-list-check text-xs"></i>
                  <span>{q.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    selectedQuizId === q.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {q.questions?.length || 0} Qs
                  </span>
                </button>
              ))}
            </div>

            {selectedQuiz && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                
                {/* Quiz Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {selectedQuiz.course}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Pass Score: {selectedQuiz.passingScore}%
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        ⏱️ {selectedQuiz.timeLimitMins} Mins Limit
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{selectedQuiz.title}</h2>
                  </div>

                  {/* Actions: Add Question & Delete Quiz */}
                  <div className="flex items-center space-x-2.5 shrink-0">
                    <button
                      onClick={() => {
                        setShowAddQuestionModal(true);
                        setAddQError('');
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Add Question</span>
                    </button>
                    <button
                      onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200 transition flex items-center space-x-1.5"
                      title="Delete Entire Quiz"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      <span className="hidden sm:inline">Delete Quiz</span>
                    </button>
                  </div>
                </div>

                {/* Questions Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                      <i className="fa-solid fa-layer-group text-emerald-600"></i>
                      <span>Questions in Assessment ({selectedQuiz.questions?.length || 0})</span>
                    </h3>
                  </div>

                  {(!selectedQuiz.questions || selectedQuiz.questions.length === 0) ? (
                    <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-xs space-y-2">
                      <p className="font-bold text-slate-600">No questions in this quiz.</p>
                      <p>Click "Add Question" above to attach MCQ items.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedQuiz.questions.map((quest, idx) => (
                        <div key={quest.id || idx} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="font-black text-sm text-slate-900 flex items-start space-x-2">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                                Q{idx + 1}
                              </span>
                              <span className="leading-snug">{quest.text}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(quest.id)}
                              className="text-slate-400 hover:text-rose-600 text-xs p-1 transition shrink-0"
                              title="Delete Question"
                            >
                              <i className="fa-solid fa-trash text-xs"></i>
                            </button>
                          </div>

                          {/* Options Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {quest.options?.map((opt, oIdx) => {
                              const isCorrect = oIdx === quest.correctIndex;
                              return (
                                <div
                                  key={oIdx}
                                  className={`p-3 rounded-xl border text-xs flex items-center justify-between font-medium ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span>{opt}</span>
                                  </div>
                                  {isCorrect && (
                                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* ── Modal 1: AI Quiz Generator & Creator ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-600/30">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">AI Quiz Generator &amp; Builder</h3>
                  <p className="text-xs text-slate-500">Generate technical assessment questions with Gemini AI</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Mode Switcher: AI vs Manual */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setCreateMode('ai')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  createMode === 'ai' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-brain text-emerald-600"></i>
                <span>✨ Generate with Gemini AI</span>
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('manual')}
                className={`py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                  createMode === 'manual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-pen-to-square"></i>
                <span>Custom Manual Authoring</span>
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{modalError}</span>
              </div>
            )}

            {/* AI Generator Panel */}
            {createMode === 'ai' && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3 text-xs">
                <div className="font-extrabold text-emerald-900 flex items-center space-x-1.5">
                  <i className="fa-solid fa-bolt text-emerald-600"></i>
                  <span>AI Prompt &amp; Topic Configuration</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Assessment Topic</label>
                    <input
                      type="text"
                      placeholder="e.g. Spring Boot 3 Virtual Threads, Docker Swarm, LLM RAG Pipelines"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Difficulty</label>
                    <select
                      value={aiDifficulty}
                      onChange={(e: any) => setAiDifficulty(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                    >
                      <option value="easy">Beginner / Fundamentals</option>
                      <option value="medium">Intermediate / Real-world</option>
                      <option value="hard">Advanced / Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-700">Question Count:</span>
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setAiCount(num)}
                        className={`px-2.5 py-1 rounded-lg font-extrabold text-xs transition ${
                          aiCount === num ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-300 text-slate-700'
                        }`}
                      >
                        {num} Qs
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={aiGenerating || !aiTopic.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-md shadow-emerald-600/25 transition flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                        <span>Generating with AI...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>Generate Questions ✨</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Quiz General Settings Form */}
            <form onSubmit={handleSaveAndPublishQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Assigned Course</label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                  >
                    {availableCourses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Microservices Distributed Architecture Quiz"
                    value={qTitle}
                    onChange={(e) => setQTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pass Score (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={qPass}
                    onChange={(e) => setQPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time Limit (mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={qTime}
                    onChange={(e) => setQTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Questions Preview for AI Mode */}
              {createMode === 'ai' && generatedQuestions.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                      AI-Generated Questions Preview ({generatedQuestions.length})
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      ✨ Ready to publish
                    </span>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                    {generatedQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="font-bold text-slate-900">
                          <span className="text-emerald-600 font-extrabold mr-1.5">Q{idx + 1}.</span>
                          {q.text}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          {q.options?.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-1.5 rounded-lg border ${
                                oIdx === q.correctIndex
                                  ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                  : 'bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}. {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Question Authoring */}
              {createMode === 'manual' && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                      Custom Questions ({manualQuestions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setManualQuestions([...manualQuestions, { text: '', options: ['', '', '', ''], correctIndex: 0 }])}
                      className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center space-x-1"
                    >
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Add Question Slot</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50">
                    {manualQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                        <div className="font-bold text-slate-800">Question {qIdx + 1} Prompt</div>
                        <input
                          type="text"
                          placeholder="e.g. What is the time complexity of QuickSort average case?"
                          value={q.text}
                          onChange={(e) => {
                            const updated = [...manualQuestions];
                            updated[qIdx].text = e.target.value;
                            setManualQuestions(updated);
                          }}
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                            <input
                              key={letter}
                              type="text"
                              placeholder={`Option ${letter}`}
                              value={q.options[optIdx] || ''}
                              onChange={(e) => {
                                const updated = [...manualQuestions];
                                updated[qIdx].options[optIdx] = e.target.value;
                                setManualQuestions(updated);
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="font-bold text-slate-600">Correct Option:</span>
                          <select
                            value={q.correctIndex}
                            onChange={(e) => {
                              const updated = [...manualQuestions];
                              updated[qIdx].correctIndex = Number(e.target.value);
                              setManualQuestions(updated);
                            }}
                            className="px-2 py-1 bg-emerald-50 border border-emerald-300 font-bold text-emerald-900 rounded-lg"
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (createMode === 'ai' && generatedQuestions.length === 0)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-cloud-arrow-up"></i>
                  <span>{submitting ? 'Publishing to Database...' : 'Save & Publish Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Add Question to Existing Quiz (AI or Manual) ── */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">Add Question to Quiz</h3>
                <p className="text-xs text-slate-500">{selectedQuiz?.title}</p>
              </div>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Quick AI Auto-Draft for this question */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2 text-xs">
              <div className="font-bold text-emerald-900 flex items-center space-x-1">
                <i className="fa-solid fa-wand-magic-sparkles text-emerald-600"></i>
                <span>Auto-Generate Prompt with AI (Optional)</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Distributed Consensus in Kafka"
                  value={singleAiTopic}
                  onChange={(e) => setSingleAiTopic(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleGenerateSingleQuestionAI}
                  disabled={aiGenerating || !singleAiTopic.trim()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50 whitespace-nowrap"
                >
                  {aiGenerating ? 'Generating...' : 'Draft with AI ✨'}
                </button>
              </div>
            </div>

            {addQError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                {addQError}
              </div>
            )}

            <form onSubmit={handleAddQuestionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Which design pattern is used to decouple an abstraction from its implementation?"
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                  <div key={letter}>
                    <label className="block font-bold text-slate-700 mb-1">Option {letter}</label>
                    <input
                      type="text"
                      placeholder={`Option ${letter} text`}
                      value={newOptions[optIdx] || ''}
                      onChange={(e) => {
                        const updated = [...newOptions];
                        updated[optIdx] = e.target.value;
                        setNewOptions(updated);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      required={optIdx < 2}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correct Answer</label>
                <select
                  value={newCorrectIndex}
                  onChange={(e) => setNewCorrectIndex(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>Option A (Correct Answer)</option>
                  <option value={1}>Option B (Correct Answer)</option>
                  <option value={2}>Option C (Correct Answer)</option>
                  <option value={3}>Option D (Correct Answer)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Saving Question...' : 'Add Question'}
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
