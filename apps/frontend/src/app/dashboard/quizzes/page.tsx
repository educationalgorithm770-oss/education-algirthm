'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  distractorReason?: string;
  practicalTakeaway?: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
}

interface Attempt {
  id: string;
  quizId?: number;
  topic: string;
  course?: string;
  score: number;
  total: number;
  percentage: number;
  passed?: boolean;
  date: string;
}

interface PublishedQuiz {
  id: string;
  rawId: number;
  title: string;
  courseId?: number;
  course: string;
  module: string;
  questionsCount: number;
  passingScore: string;
  passingPercent?: number;
  timeLimit: string;
  timeLimitMinutes?: number;
  isPublished: boolean;
  questions?: Question[];
}

interface UserSession {
  id: number;
  name: string;
  email: string;
  role: string;
  enrolledCourses?: string[];
  enrolledCourseIds?: number[];
}

export default function StudentQuizzesPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [publishedQuizzes, setPublishedQuizzes] = useState<PublishedQuiz[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('All');
  const [selectedQuiz, setSelectedQuiz] = useState<PublishedQuiz | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'basic' | 'medium' | 'hard'>('medium');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1200); // 20 mins default
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [activeTab, setActiveTab] = useState<'take' | 'assigned' | 'history'>('assigned');

  // Load User & Quizzes from MySQL Database
  const loadQuizzesAndUser = async () => {
    try {
      setLoading(true);
      
      // 1. User session
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.success && meData.user) {
        setUser(meData.user);
      }

      // 2. Fetch quizzes from database
      const quizRes = await fetch('/api/student/quizzes');
      const quizData = await quizRes.json();
      
      if (quizData.success && Array.isArray(quizData.quizzes) && quizData.quizzes.length > 0) {
        setPublishedQuizzes(quizData.quizzes);
        
        // Auto-select first quiz matching enrolled course or first quiz
        const userCourses = meData.user?.enrolledCourses || [];
        let defaultQuiz = quizData.quizzes[0];
        if (userCourses.length > 0) {
          const matched = quizData.quizzes.find((q: PublishedQuiz) => 
            userCourses.some((uc: string) => q.course.toLowerCase().includes(uc.toLowerCase()) || uc.toLowerCase().includes(q.course.toLowerCase()))
          );
          if (matched) defaultQuiz = matched;
        }

        setSelectedQuiz(defaultQuiz);
        loadQuestionsForQuiz(defaultQuiz, 'medium');
      }

      if (quizData.pastAttempts && Array.isArray(quizData.pastAttempts)) {
        setAttempts(quizData.pastAttempts);
      }
    } catch (e) {
      console.error('Failed to load quizzes from DB:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzesAndUser();
  }, []);

  // Distinct course list for filter tabs
  const courseOptions = useMemo(() => {
    const list = Array.from(new Set(publishedQuizzes.map(q => q.course))).filter(Boolean);
    return ['All', ...list];
  }, [publishedQuizzes]);

  // Filtered quizzes based on selected course
  const filteredQuizzes = useMemo(() => {
    if (selectedCourseFilter === 'All') return publishedQuizzes;
    return publishedQuizzes.filter(q => q.course === selectedCourseFilter);
  }, [publishedQuizzes, selectedCourseFilter]);

  // Timer countdown
  useEffect(() => {
    if (submitted || loading || timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted, loading, timeLeftSeconds]);

  const loadQuestionsForQuiz = async (quiz: PublishedQuiz, diff: 'basic' | 'medium' | 'hard' = 'medium') => {
    setLoading(true);
    setSubmitted(false);
    setSelectedAnswers({});
    
    // Set timer
    const timeMins = quiz.timeLimitMinutes || 20;
    setTimeLeftSeconds(timeMins * 60);

    // If quiz already has questions saved in MySQL by faculty, load them directly!
    if (quiz.questions && quiz.questions.length > 0) {
      setQuestions(quiz.questions);
      setLoading(false);
      return;
    }

    // Otherwise generate dynamic questions via Gemini AI
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: quiz.title,
          difficulty: diff,
          count: quiz.questionsCount || 5,
          courseContext: quiz.course,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        const parsedQuestions: Question[] = data.questions.map((q: any, idx: number) => ({
          id: q.id || `q_${idx}`,
          question: q.question || '',
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: typeof q.correct === 'number' ? q.correct : 0,
          explanation: q.explanation || '',
          distractorReason: q.distractorReason || '',
          practicalTakeaway: q.practicalTakeaway || '',
          followUpQuestion: q.followUpQuestion || '',
          followUpAnswer: q.followUpAnswer || '',
        }));
        setQuestions(parsedQuestions);
      }
    } catch (e) {
      console.error('Quiz fetch error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuiz = (quiz: PublishedQuiz) => {
    setSelectedQuiz(quiz);
    loadQuestionsForQuiz(quiz, selectedDifficulty);
    setActiveTab('take');
  };

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmitQuiz = async () => {
    if (submitted || questions.length === 0) return;

    try {
      setSubmittingAttempt(true);
      const res = await fetch('/api/student/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: selectedQuiz?.rawId || 1,
          totalQuestions: questions.length,
          answers: selectedAnswers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScore(data.score ?? 0);
        setSubmitted(true);
      } else {
        // Fallback calculation if offline
        let localCount = 0;
        questions.forEach((q, idx) => {
          if (typeof q.correctAnswer === 'number' && selectedAnswers[idx] === q.correctAnswer) {
            localCount++;
          }
        });
        setScore(localCount);
        setSubmitted(true);
      }

      // Refresh attempts list
      const quizRes = await fetch('/api/student/quizzes');
      const quizData = await quizRes.json();
      if (quizData.pastAttempts) {
        setAttempts(quizData.pastAttempts);
      }
    } catch (e) {
      console.error('Failed to record attempt:', e);
      setSubmitted(true);
    } finally {
      setSubmittingAttempt(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getCourseBadgeColor = (courseName: string) => {
    const c = courseName.toLowerCase();
    if (c.includes('java')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (c.includes('data') || c.includes('genai')) return 'bg-teal-50 text-teal-700 border-teal-200';
    if (c.includes('devops') || c.includes('cloud')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Course-Specific Assessment Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Course Knowledge Assessments</h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Solve rigorous technical assessments created for your enrolled engineering track or filter by specific courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('assigned')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
                activeTab === 'assigned'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-list-check text-xs"></i>
              <span>Quizzes by Course ({publishedQuizzes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('take')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
                activeTab === 'take'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-play text-xs"></i>
              <span>Solve Quiz</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fa-solid fa-clock-rotate-left text-xs"></i>
              <span>My History ({attempts.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Assigned Quizzes with Course Track Filters */}
        {activeTab === 'assigned' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Course Filter Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                <i className="fa-solid fa-filter text-indigo-600"></i>
                <span>Filter by Course:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {courseOptions.map((courseName) => {
                  const isSelected = selectedCourseFilter === courseName;
                  const count = courseName === 'All' ? publishedQuizzes.length : publishedQuizzes.filter(q => q.course === courseName).length;
                  return (
                    <button
                      key={courseName}
                      onClick={() => setSelectedCourseFilter(courseName)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{courseName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quizzes Grid */}
            {filteredQuizzes.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 space-y-2">
                <i className="fa-solid fa-folder-open text-3xl text-slate-300"></i>
                <div className="font-bold text-slate-700">No quizzes available for this course yet.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredQuizzes.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-500 transition flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-extrabold px-2.5 py-0.5 rounded-full border text-[10px] ${getCourseBadgeColor(q.course)}`}>
                          {q.course}
                        </span>
                        <span className="text-slate-400 font-mono">{q.timeLimit}</span>
                      </div>
                      <h3 className="font-black text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-500">{q.module}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
                        <span><i className="fa-solid fa-list-ol text-indigo-600 me-1"></i>{q.questionsCount} Questions</span>
                        <span>•</span>
                        <span><i className="fa-solid fa-bullseye text-emerald-600 me-1"></i>Pass: {q.passingScore}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectQuiz(q)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-2xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5"
                    >
                      <span>Take Assessment &rarr;</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Take Active Quiz */}
        {activeTab === 'take' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-in fade-in duration-200">
            
            {/* Left Sidebar: Quiz Selector */}
            <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Active Assessment</h3>
                <div className="font-extrabold text-sm text-slate-900 mt-1">
                  {selectedQuiz?.title || 'Knowledge Assessment'}
                </div>
                <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                  {selectedQuiz?.course || 'Engineering Cohort'}
                </div>
              </div>

              {/* Timer Pill */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-stopwatch text-emerald-400 text-base animate-pulse"></i>
                  <span className="text-xs font-bold text-slate-300">Time Remaining</span>
                </div>
                <span className="font-mono text-base font-black text-emerald-400">
                  {formatTimer(timeLeftSeconds)}
                </span>
              </div>

              {/* Select Other Quiz */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Switch Quiz:</label>
                <select
                  value={selectedQuiz?.id || ''}
                  onChange={(e) => {
                    const found = publishedQuizzes.find(q => q.id === e.target.value);
                    if (found) handleSelectQuiz(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {publishedQuizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title} ({q.course})</option>
                  ))}
                </select>
              </div>

              {/* Difficulty Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">AI Difficulty Level:</label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  {(['basic', 'medium', 'hard'] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => {
                        setSelectedDifficulty(diff);
                        if (selectedQuiz) loadQuestionsForQuiz(selectedQuiz, diff);
                      }}
                      className={`py-1.5 rounded-lg uppercase text-[10px] tracking-wider transition ${
                        selectedDifficulty === diff
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pass Threshold Pill */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <i className="fa-solid fa-shield-halved text-emerald-600"></i>
                  <span>Passing Threshold</span>
                </div>
                <div className="text-[11px]">Score at least {selectedQuiz?.passingScore || '80%'} to pass this assessment.</div>
              </div>
            </div>

            {/* Right Main Area: Questions */}
            <div className="lg:col-span-3 space-y-6">
              {loading ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mx-auto animate-spin">
                    <i className="fa-solid fa-circle-notch"></i>
                  </div>
                  <div className="font-black text-lg text-slate-900">Connecting to Faculty Quiz &amp; AI Engine...</div>
                  <p className="text-xs text-slate-500">Retrieving questions and options for {selectedQuiz?.title}...</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center space-y-4">
                  <i className="fa-solid fa-circle-info text-3xl text-indigo-600"></i>
                  <div className="font-bold text-slate-900">No questions found for this quiz yet.</div>
                  <button
                    onClick={() => selectedQuiz && loadQuestionsForQuiz(selectedQuiz, selectedDifficulty)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
                  >
                    Generate AI Questions
                  </button>
                </div>
              ) : (
                <>
                  {/* Results Banner if submitted */}
                  {submitted && (
                    <div className={`p-6 rounded-3xl border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 animate-in zoom-in-95 duration-200 ${
                      Math.round((score / questions.length) * 100) >= (selectedQuiz?.passingPercent || 80)
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
                        : 'bg-rose-500 text-white border-rose-400 shadow-rose-500/20'
                    }`}>
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="font-black text-2xl">
                          {Math.round((score / questions.length) * 100) >= (selectedQuiz?.passingPercent || 80)
                            ? '🎉 Assessment Passed!'
                            : '⚡ Need More Practice'}
                        </div>
                        <p className="text-xs text-white/90">
                          You scored <strong>{score} out of {questions.length}</strong> ({Math.round((score / questions.length) * 100)}%). Target was {selectedQuiz?.passingScore || '80%'}.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => selectedQuiz && loadQuestionsForQuiz(selectedQuiz, selectedDifficulty)}
                          className="px-4 py-2 bg-white text-slate-900 font-extrabold text-xs rounded-xl shadow-sm hover:bg-slate-100 transition"
                        >
                          Retake Quiz
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Question Cards */}
                  <div className="space-y-5">
                    {questions.map((q, qIndex) => {
                      const isAnswered = selectedAnswers[qIndex] !== undefined;
                      const studentChoice = selectedAnswers[qIndex];
                      const isCorrect = studentChoice === q.correctAnswer;

                      return (
                        <div
                          key={q.id || qIndex}
                          className={`bg-white p-6 rounded-3xl border transition shadow-sm space-y-4 ${
                            submitted
                              ? isCorrect
                                ? 'border-emerald-300 ring-1 ring-emerald-400/40 bg-emerald-50/20'
                                : 'border-rose-300 ring-1 ring-rose-400/40 bg-rose-50/20'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center space-x-2">
                              <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center">
                                {qIndex + 1}
                              </span>
                              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Question</span>
                            </div>

                            {submitted && (
                              <span className={`text-xs font-black px-3 py-1 rounded-full ${
                                isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                            )}
                          </div>

                          <h4 className="font-extrabold text-base text-slate-900 leading-relaxed">
                            {q.question}
                          </h4>

                          {/* Options */}
                          <div className="grid grid-cols-1 gap-2.5 pt-2">
                            {q.options.map((opt, optIndex) => {
                              const isSelected = studentChoice === optIndex;
                              const isTargetCorrect = optIndex === q.correctAnswer;

                              let optStyle = 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100';
                              if (submitted) {
                                if (isTargetCorrect) {
                                  optStyle = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 font-bold';
                                } else if (isSelected && !isCorrect) {
                                  optStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold line-through';
                                }
                              } else if (isSelected) {
                                optStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold ring-2 ring-indigo-500/20';
                              }

                              return (
                                <button
                                  key={optIndex}
                                  type="button"
                                  disabled={submitted}
                                  onClick={() => handleSelectOption(qIndex, optIndex)}
                                  className={`w-full p-3.5 rounded-2xl border text-left text-xs transition flex items-center space-x-3 ${optStyle}`}
                                >
                                  <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Post Submission Explanations */}
                          {submitted && (
                            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-slate-700">
                                <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                  <i className="fa-solid fa-lightbulb text-amber-500"></i>
                                  <span>Faculty Technical Explanation:</span>
                                </div>
                                <p className="leading-relaxed">{q.explanation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Submit Button */}
                  {!submitted && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={handleSubmitQuiz}
                        disabled={submittingAttempt || Object.keys(selectedAnswers).length === 0}
                        className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/30 transition disabled:opacity-50 flex items-center space-x-2"
                      >
                        {submittingAttempt ? (
                          <>
                            <i className="fa-solid fa-spinner fa-spin"></i>
                            <span>Grading Assessment...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Quiz for Grading</span>
                            <i className="fa-solid fa-check"></i>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: History & Past Attempts */}
        {activeTab === 'history' && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-xl font-black text-slate-900">Past Quiz Attempts Recorded in MySQL</h2>
              <p className="text-xs text-slate-600">Review your past scores and track mastery over time.</p>
            </div>

            {attempts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                <i className="fa-solid fa-clipboard-question text-3xl text-slate-300"></i>
                <div>No past attempts recorded in database yet. Complete your first quiz!</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[580px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider whitespace-nowrap">
                      <th className="pb-3 px-3">Assessment Title</th>
                      <th className="pb-3 px-3">Course</th>
                      <th className="pb-3 px-3">Score</th>
                      <th className="pb-3 px-3">Percentage</th>
                      <th className="pb-3 px-3">Outcome</th>
                      <th className="pb-3 px-3 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {attempts.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80">
                        <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">{att.topic}</td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold inline-block ${getCourseBadgeColor(att.course || '')}`}>
                            {att.course}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono whitespace-nowrap">{att.score} / {att.total}</td>
                        <td className="py-3.5 px-3 font-extrabold text-indigo-600 whitespace-nowrap">{att.percentage}%</td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-flex items-center ${
                            att.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {att.percentage >= 80 ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right text-slate-400 whitespace-nowrap">{att.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      <StudentFooter />
    </div>
  );
}
