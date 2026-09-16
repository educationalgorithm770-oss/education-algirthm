'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/layout/StudentNavbar';
import AlgoBotMascot from '@/components/aptitude/AlgoBotMascot';
import ConfettiBurst from '@/components/aptitude/ConfettiBurst';
import { sounds } from '@/components/aptitude/SoundManager';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: number;
  title: string;
  questionText: string;
  options: QuestionOption[];
  correctOption: string;
  category: string;
  difficulty: string;
  tags: string[];
}

export default function CompanyMockAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.companySlug as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60); // 45 minutes in seconds
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [scoreReport, setScoreReport] = useState<any>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function loadMockExam() {
      try {
        const res = await fetch(`/api/aptitude/questions?companySlug=${companySlug}&limit=15`);
        const data = await res.json();
        if (data.success && data.questions?.length > 0) {
          setQuestions(data.questions);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMockExam();
  }, [companySlug]);

  // Assessment countdown timer
  useEffect(() => {
    if (testSubmitted || loading || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testSubmitted, loading, questions]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optId: string) => {
    if (testSubmitted) return;
    sounds.playClick();
    setAnswers(prev => ({ ...prev, [currentQ.id]: optId }));
  };

  const handleToggleReview = () => {
    sounds.playClick();
    setMarkedForReview(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleClearResponse = () => {
    sounds.playClick();
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQ.id];
      return next;
    });
  };

  const handleSubmitTest = async () => {
    if (testSubmitted) return;
    sounds.playClick();
    setLoading(true);

    const submissions = questions.map(q => ({
      questionId: q.id,
      selectedOption: answers[q.id] || '',
      timeSpentSeconds: 60
    }));

    try {
      const res = await fetch('/api/aptitude/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'MOCK_EXAM',
          submissions,
          totalTimeSeconds: 45 * 60 - timeLeft
        })
      });
      const data = await res.json();
      if (data.success) {
        setScoreReport(data.results);
        setTestSubmitted(true);
        if (data.results.scorePercentage >= 65) {
          sounds.playLevelUp();
          setShowConfetti(true);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <StudentNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-600">Loading Assessment Environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-indigo-500 selection:text-white pb-12">
      <StudentNavbar />
      <ConfettiBurst active={showConfetti} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Test Submitted Score Card View */}
        {testSubmitted && scoreReport ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-fade-in-up">
            <div className="text-center space-y-4 max-w-lg mx-auto">
              <AlgoBotMascot
                mood={scoreReport.scorePercentage >= 65 ? 'CELEBRATING' : 'THINKING'}
                customQuote={scoreReport.scorePercentage >= 65 ? 'OA Cleared! You qualify for the technical round!' : 'Close battle! Revise the shortcut formulas and retry!'}
                size="lg"
                className="justify-center"
              />

              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                <i className="fa-solid fa-file-signature"></i>
                <span>Assessment Evaluation</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                {scoreReport.scorePercentage >= 65 ? '🎉 Congratulations! Cutoff Cleared!' : '📊 Assessment Result Report'}
              </h1>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-bold">Overall Score</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{scoreReport.scorePercentage}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-bold">Correct Answers</div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{scoreReport.correctCount} / {scoreReport.totalQuestions}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-bold">XP Gained</div>
                <div className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">+{scoreReport.xpEarned} ⚡</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="text-xs text-slate-500 font-bold">Brain Gems</div>
                <div className="text-2xl sm:text-3xl font-black text-pink-600 mt-1">+{scoreReport.gemsEarned} 💎</div>
              </div>
            </div>

            {/* Sectional Cutoff Summary */}
            <div className="max-w-2xl mx-auto p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-700">Company Benchmark Status</div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-200">
                <span className="text-slate-600">Quantitative & Logic Cutoff (65%)</span>
                <span className={`font-bold ${scoreReport.scorePercentage >= 65 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {scoreReport.scorePercentage >= 65 ? 'PASSED (Qualified)' : 'NEEDS PRACTICE'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                href="/dashboard/aptitude"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md flex items-center space-x-2"
              >
                <i className="fa-solid fa-house"></i>
                <span>Return to Aptitude Hub</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Timed Exam Environment */
          <div className="space-y-4 sm:space-y-6">
            
            {/* Top Exam Header Bar */}
            <div className="bg-white border border-slate-200/90 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-sm sm:text-lg shrink-0">
                  <i className="fa-solid fa-building-columns"></i>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">Live Assessment Mode</div>
                  <h1 className="text-xs sm:text-base font-black text-slate-900 capitalize truncate">{companySlug.replace(/-/g, ' ')}</h1>
                </div>
              </div>

              {/* Timer & Finish Button */}
              <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center space-x-2 bg-amber-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-amber-200">
                  <i className="fa-regular fa-clock text-amber-600 text-xs sm:text-sm"></i>
                  <span className="font-mono text-xs sm:text-base font-black text-amber-800">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                <button
                  onClick={handleSubmitTest}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition shadow-sm"
                >
                  Submit Test
                </button>
              </div>
            </div>

            {/* Main Split Layout: Left Question Box, Right Palette */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Question Workspace (2 Cols) */}
              <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6 flex flex-col justify-between min-h-[420px] sm:min-h-[480px]">
                
                <div className="space-y-4 sm:space-y-6">
                  {/* Question Index & Category */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-[11px] sm:text-xs font-black uppercase text-indigo-600">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {currentQ?.category || 'Aptitude'}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                    {currentQ?.questionText}
                  </div>

                  {/* Options */}
                  <div className="space-y-2.5 sm:space-y-3">
                    {currentQ?.options.map((opt) => {
                      const isSelected = answers[currentQ.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left font-medium text-xs sm:text-sm transition flex items-center space-x-3 ${
                            isSelected
                              ? 'bg-indigo-50/80 border-indigo-500 text-indigo-950 ring-2 ring-indigo-400 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {opt.id}
                          </span>
                          <span className="flex-1 break-words">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 sm:pt-6 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleToggleReview}
                      className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition flex items-center justify-center space-x-1.5 ${
                        markedForReview[currentQ?.id]
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <i className="fa-solid fa-flag"></i>
                      <span>{markedForReview[currentQ?.id] ? 'Marked' : 'Mark for Review'}</span>
                    </button>

                    <button
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-[11px] sm:text-xs font-bold transition"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentIndex === 0}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 disabled:opacity-40 text-[11px] sm:text-xs font-bold transition text-center"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentIndex === questions.length - 1}
                      className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 text-[11px] sm:text-xs font-bold transition shadow-xs text-center"
                    >
                      Save & Next
                    </button>
                  </div>
                </div>

              </div>

              {/* Question Palette Sidebar (1 Col) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-5">
                <div className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                  <i className="fa-solid fa-grid-2 text-indigo-600"></i>
                  <span>Question Palette</span>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-purple-600"></span>
                    <span>Review</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300"></span>
                    <span>Unanswered</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-md ring-2 ring-indigo-500 bg-white border border-slate-300"></span>
                    <span>Current</span>
                  </div>
                </div>

                {/* Question Buttons Grid */}
                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                  {questions.map((q, idx) => {
                    const isAnswered = Boolean(answers[q.id]);
                    const isMarked = Boolean(markedForReview[q.id]);
                    const isCurrent = idx === currentIndex;

                    let btnColor = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200';
                    if (isAnswered) btnColor = 'bg-emerald-600 text-white border-emerald-600 shadow-xs';
                    if (isMarked) btnColor = 'bg-purple-600 text-white border-purple-600 shadow-xs';
                    if (isCurrent) btnColor += ' ring-2 ring-indigo-500 scale-105';

                    return (
                      <button
                        key={q.id}
                        onClick={() => { setCurrentIndex(idx); sounds.playClick(); }}
                        className={`h-10 rounded-xl font-black text-xs border transition flex items-center justify-center ${btnColor}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
