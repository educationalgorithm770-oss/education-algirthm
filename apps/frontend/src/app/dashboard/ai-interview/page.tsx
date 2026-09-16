'use client';

import React, { useState, useEffect } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

interface Question {
  id: string;
  title: string;
  prompt: string;
  category: string;
  company?: string;
  difficulty?: string;
  canonicalRubric?: string[];
}

interface RubricItem {
  requirement: string;
  met: boolean;
}

interface Scorecard {
  track: string;
  overallScore: number;
  technicalAccuracy: number;
  systemDesign: number;
  codeQuality: number;
  communication: number;
  timeComplexity: number;
  verdict: string;
  strengths: string[];
  improvementAreas: string[];
  companyTag?: string;
  rubricMatchPercentage?: number;
  rubricChecklist?: RubricItem[];
  canonicalSolution?: string;
}

interface Attempt {
  id: string;
  track: string;
  questionTitle: string;
  overallScore: number;
  verdict: string;
  companyTag?: string;
  difficulty?: string;
  date: string;
}

export default function AIInterviewPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [selectedTrack, setSelectedTrack] = useState<'java_fullstack' | 'system_design' | 'dsa' | 'behavioral'>('java_fullstack');
  const [inProgress, setInProgress] = useState(false);
  const [fetchingQuestion, setFetchingQuestion] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [showCanonical, setShowCanonical] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('student_ai_interview_attempts');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const fetchNextQuestion = async (diff = selectedDifficulty, track = selectedTrack) => {
    setFetchingQuestion(true);
    setScorecard(null);
    setUserAnswer('');
    setShowCanonical(false);

    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_question', difficulty: diff, track })
      });
      const data = await res.json();
      if (data.success && data.question) {
        setActiveQuestion(data.question);
      }
    } catch (e) {
      console.error('Failed to generate RAG interview question:', e);
    } finally {
      setFetchingQuestion(false);
    }
  };

  const handleStartInterview = async () => {
    setInProgress(true);
    await fetchNextQuestion(selectedDifficulty, selectedTrack);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || !activeQuestion) return;
    setEvaluating(true);

    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          track: selectedTrack,
          questionTitle: activeQuestion.title,
          questionPrompt: activeQuestion.prompt,
          responseText: userAnswer
        })
      });
      const data = await res.json();
      if (data.success && data.scorecard) {
        setScorecard(data.scorecard);
        setInProgress(false);

        const newAttempt: Attempt = {
          id: 'att_' + Date.now(),
          track: selectedTrack,
          questionTitle: activeQuestion.title,
          overallScore: data.scorecard.overallScore,
          verdict: data.scorecard.verdict,
          companyTag: data.scorecard.companyTag || activeQuestion.company,
          difficulty: activeQuestion.difficulty || selectedDifficulty.toUpperCase(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
        };

        setHistory(prev => {
          const updated = [newAttempt, ...prev];
          localStorage.setItem('student_ai_interview_attempts', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.error('Interview evaluation error:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const getDifficultyBadge = (diff?: string) => {
    const d = (diff || '').toUpperCase();
    if (d.includes('EASY')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 EASY</span>;
    }
    if (d.includes('MED')) {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">🟡 MEDIUM</span>;
    }
    return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200">🔴 HARD</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      {/* Header Banner */}
      <section className="bg-white py-10 px-6 border-b border-slate-200">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
              &larr; Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-full text-xs font-extrabold uppercase tracking-wider">
                📚 50,000 Questions PDF Bank • Easy, Medium &amp; Hard
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
                RAG-Powered AI Mock Interview Arena
              </h1>
              <p className="text-slate-600 text-sm max-w-2xl mt-1">
                Practice across 50,000 real interview questions extracted directly from our 4,312-page Java Full Stack &amp; FAANG curriculum bank with live Staff Engineer rubric grading.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-10 px-6 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Track & Difficulty Selection Mode */}
        {!inProgress && !scorecard && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-3xl mx-auto">
            
            {/* Step 1: Difficulty Tier Selector */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Step 1: Select Difficulty Tier</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'all', label: 'All Tiers', count: '50,000 Qs', icon: 'fa-globe', color: 'indigo' },
                  { id: 'easy', label: '🟢 Easy Tier', count: '20,000 Qs', icon: 'fa-seedling', color: 'emerald' },
                  { id: 'medium', label: '🟡 Medium Tier', count: '20,000 Qs', icon: 'fa-cubes', color: 'amber' },
                  { id: 'hard', label: '🔴 Hard Tier', count: '10,000 Qs', icon: 'fa-fire-flame-curved', color: 'red' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDifficulty(d.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      selectedDifficulty === d.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400/40'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-extrabold text-xs">{d.label}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedDifficulty === d.id ? 'text-purple-200' : 'text-slate-400 font-bold'}`}>
                      {d.count}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Subject Track Selector */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="text-xs font-black uppercase tracking-wider text-slate-500">Step 2: Select Technical Track</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedTrack('java_fullstack')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedTrack === 'java_fullstack'
                      ? 'bg-indigo-50 border-indigo-300 font-extrabold text-indigo-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:border-slate-300'
                  }`}
                >
                  <i className="fa-brands fa-java text-xl text-indigo-600 block mb-2"></i>
                  <div className="text-sm font-black">Java Full Stack &amp; Spring</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-1">Core Java, Spring Boot, REST, JPA, SQL, React</div>
                </button>

                <button
                  onClick={() => setSelectedTrack('system_design')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedTrack === 'system_design'
                      ? 'bg-purple-50 border-purple-300 font-extrabold text-purple-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:border-slate-300'
                  }`}
                >
                  <i className="fa-solid fa-network-wired text-lg text-purple-600 block mb-2"></i>
                  <div className="text-sm font-black">System Design &amp; Arch</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-1">Microservices, Redis, Kafka, Distributed Systems</div>
                </button>

                <button
                  onClick={() => setSelectedTrack('dsa')}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedTrack === 'dsa'
                      ? 'bg-emerald-50 border-emerald-300 font-extrabold text-emerald-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 font-bold hover:border-slate-300'
                  }`}
                >
                  <i className="fa-solid fa-code text-lg text-emerald-600 block mb-2"></i>
                  <div className="text-sm font-black">DSA &amp; Problem Solving</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-1">Arrays, Trees, Graphs, Monotonic Stacks, DP</div>
                </button>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={fetchingQuestion}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-purple-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {fetchingQuestion ? (
                <span><i className="fa-solid fa-spinner fa-spin mr-2"></i>Retrieving Question from 50,000 PDF Bank...</span>
              ) : (
                <>
                  <span>Launch Simulated {selectedDifficulty.toUpperCase()} Interview Session</span>
                  <i className="fa-solid fa-play text-xs"></i>
                </>
              )}
            </button>
          </div>
        )}

        {/* Active Interview Session Mode */}
        {inProgress && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg space-y-6 max-w-3xl mx-auto animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2 flex-wrap gap-2">
                {getDifficultyBadge(activeQuestion?.difficulty)}
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-extrabold">
                  {activeQuestion?.category || 'Java Full Stack'}
                </span>
                {activeQuestion?.company && (
                  <span className="px-2.5 py-1 bg-slate-900 text-white rounded-full text-[11px] font-bold">
                    {activeQuestion.company}
                  </span>
                )}
              </div>

              <button
                onClick={() => fetchNextQuestion(selectedDifficulty, selectedTrack)}
                disabled={fetchingQuestion}
                className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-purple-200 self-start sm:self-auto"
              >
                <i className={`fa-solid fa-rotate ${fetchingQuestion ? 'fa-spin' : ''}`}></i>
                <span>Next {selectedDifficulty.toUpperCase()} Question &rarr;</span>
              </button>
            </div>

            {fetchingQuestion ? (
              <div className="p-12 text-center space-y-3">
                <i className="fa-solid fa-spinner fa-spin text-3xl text-purple-600"></i>
                <div className="text-slate-600 text-sm font-medium">Vector RAG is pulling a scenario from 50,000 Questions PDF Bank...</div>
              </div>
            ) : activeQuestion ? (
              <>
                {/* Scenario Details */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-900">{activeQuestion.title}</h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{activeQuestion.prompt}</p>
                </div>

                {/* Candidate Form */}
                <form onSubmit={handleSubmitAnswer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                      Your Answer &amp; Architectural Approach
                    </label>
                    <textarea
                      rows={7}
                      required
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Detail your solution step-by-step. Mention key Java/Spring abstractions, production trade-offs, and failure recovery..."
                      className="w-full p-4 border border-slate-300 rounded-2xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-purple-600 bg-white leading-relaxed"
                    ></textarea>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      type="submit"
                      disabled={evaluating || !userAnswer.trim()}
                      className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {evaluating ? (
                        <span><i className="fa-solid fa-gear fa-spin me-2"></i>Scoring Against Staff Engineer Canonical Rubric...</span>
                      ) : (
                        <span>Submit Response for AI Rubric Scorecard &rarr;</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setInProgress(false); setActiveQuestion(null); }}
                      className="px-5 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        )}

        {/* Scorecard Results View */}
        {scorecard && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 max-w-3xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black uppercase">
                    RAG Rubric Scorecard
                  </span>
                  {scorecard.companyTag && (
                    <span className="px-2.5 py-0.5 bg-slate-900 text-white rounded-full text-[11px] font-bold">
                      {scorecard.companyTag}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">{scorecard.verdict}</h2>
              </div>

              <div className="text-right">
                <div className="text-3xl font-black text-purple-600">{scorecard.overallScore}/100</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">
                  Rubric Match: <span className="text-emerald-600 font-black">{scorecard.rubricMatchPercentage ?? 0}%</span>
                </div>
              </div>
            </div>

            {/* 5-Axis Score Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Technical</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{scorecard.technicalAccuracy}%</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">System Design</div>
                <div className="text-base font-black text-purple-700 mt-0.5">{scorecard.systemDesign}%</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Code Quality</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{scorecard.codeQuality}%</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Communication</div>
                <div className="text-base font-black text-emerald-700 mt-0.5">{scorecard.communication}%</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-200 col-span-2 sm:col-span-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Complexity</div>
                <div className="text-base font-black text-slate-900 mt-0.5">{scorecard.timeComplexity}%</div>
              </div>
            </div>

            {/* RAG Canonical Rubric Checklist */}
            {scorecard.rubricChecklist && scorecard.rubricChecklist.length > 0 && (
              <div className="space-y-2 pt-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="text-xs font-black uppercase text-slate-900 flex items-center justify-between">
                  <span>Canonical Rubric Requirements Checklist</span>
                  <span className="text-purple-600 font-mono text-[11px]">{scorecard.rubricMatchPercentage}% Satisfied</span>
                </div>
                <div className="space-y-1.5 pt-1">
                  {scorecard.rubricChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs">
                      {item.met ? (
                        <i className="fa-solid fa-circle-check text-emerald-600 text-sm mt-0.5 shrink-0"></i>
                      ) : (
                        <i className="fa-solid fa-circle-xmark text-red-500 text-sm mt-0.5 shrink-0"></i>
                      )}
                      <span className={item.met ? 'text-slate-800 font-medium' : 'text-slate-500 line-through'}>
                        {item.requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-emerald-700">Key Strengths Identified</div>
              <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                {scorecard.strengths.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">{s}</li>
                ))}
              </ul>
            </div>

            {/* Improvement Areas */}
            <div className="space-y-2">
              <div className="text-xs font-black uppercase text-amber-700">Recommended Improvement Areas</div>
              <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                {scorecard.improvementAreas.map((a, idx) => (
                  <li key={idx} className="leading-relaxed">{a}</li>
                ))}
              </ul>
            </div>

            {/* Toggle Canonical Solution Drawer */}
            {scorecard.canonicalSolution && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowCanonical(!showCanonical)}
                  className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center justify-center space-x-1.5"
                >
                  <i className="fa-solid fa-book-open"></i>
                  <span>{showCanonical ? 'Hide Canonical Answer' : 'View Canonical Solution from PDF Reference'}</span>
                </button>

                {showCanonical && (
                  <div className="mt-3 p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-2xl whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800 animate-fade-in">
                    {scorecard.canonicalSolution}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => handleStartInterview()}
                className="flex-1 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
              >
                Try Next {selectedDifficulty.toUpperCase()} Question &rarr;
              </button>
              <button
                onClick={() => { setScorecard(null); setInProgress(false); }}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition"
              >
                Change Tier / Track
              </button>
            </div>
          </div>
        )}

        {/* History Table */}
        {history.length > 0 && !inProgress && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Your AI Interview Practice History</h3>
            <div className="divide-y divide-slate-100">
              {history.slice(0, 5).map((att) => (
                <div key={att.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 flex items-center space-x-2">
                      {getDifficultyBadge(att.difficulty)}
                      <span>{att.questionTitle}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{att.track.toUpperCase()} &bull; {att.date}</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-700">{att.verdict}</span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 font-extrabold rounded-full border border-purple-100">
                      {att.overallScore}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <StudentFooter />
    </div>
  );
}
