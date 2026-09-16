'use client';

import React, { useState, useEffect } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';
import { QUESTION_BANK_DATA } from '@/config/question-bank-data';

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'java' | 'python'>('java');

  // Bookmarks & Solved State
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [solvedIds, setSolvedIds] = useState<string[]>([]);

  // AI Concept Explainer State
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [aiExplaining, setAiExplaining] = useState(false);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});

  // Load dynamic questions from API with fallback
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/question-bank');
        const data = await res.json();
        if (data.success && Array.isArray(data.documents) && data.documents.length > 0) {
          setQuestions(data.documents);
        } else {
          // Fallback to pre-seeded question bank items
          const formattedFallback = QUESTION_BANK_DATA.map((q) => ({
            id: q.id,
            title: q.title,
            category: q.topic,
            difficulty: q.difficulty.toUpperCase(),
            companyTags: q.companyTags,
            keywords: [q.topic.toLowerCase()],
            problemStatement: q.problemStatement,
            canonicalSolution: q.systemDesignTips?.join('\n') || '',
            codeJava: q.javaSolution,
            codePython: q.pythonSolution,
            systemDesignTips: q.systemDesignTips || [],
            pageNumber: 1,
          }));
          setQuestions(formattedFallback);
        }
      } catch (err) {
        console.error('Error loading question bank:', err);
        const formattedFallback = QUESTION_BANK_DATA.map((q) => ({
          id: q.id,
          title: q.title,
          category: q.topic,
          difficulty: q.difficulty.toUpperCase(),
          companyTags: q.companyTags,
          keywords: [q.topic.toLowerCase()],
          problemStatement: q.problemStatement,
          canonicalSolution: q.systemDesignTips?.join('\n') || '',
          codeJava: q.javaSolution,
          codePython: q.pythonSolution,
          systemDesignTips: q.systemDesignTips || [],
          pageNumber: 1,
        }));
        setQuestions(formattedFallback);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Load bookmarks and solved from localStorage
    try {
      const savedB = localStorage.getItem('ea_qb_bookmarks');
      if (savedB) setBookmarkedIds(JSON.parse(savedB));
      const savedS = localStorage.getItem('ea_qb_solved');
      if (savedS) setSolvedIds(JSON.parse(savedS));
    } catch {
      // ignore
    }
  }, []);

  const toggleBookmark = (id: string) => {
    const updated = bookmarkedIds.includes(id)
      ? bookmarkedIds.filter((b) => b !== id)
      : [...bookmarkedIds, id];
    setBookmarkedIds(updated);
    try {
      localStorage.setItem('ea_qb_bookmarks', JSON.stringify(updated));
    } catch {}
  };

  const toggleSolved = (id: string) => {
    const updated = solvedIds.includes(id)
      ? solvedIds.filter((s) => s !== id)
      : [...solvedIds, id];
    setSolvedIds(updated);
    try {
      localStorage.setItem('ea_qb_solved', JSON.stringify(updated));
    } catch {}
  };

  // AI Explain Concept (ELI5)
  const handleAIExplain = async (q: any) => {
    if (aiExplanations[q.id]) {
      setExplainingId(explainingId === q.id ? null : q.id);
      return;
    }

    setExplainingId(q.id);
    setAiExplaining(true);
    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Explain this technical concept in a simple, intuitive whiteboard analogy for a junior developer:\nTitle: ${q.title}\nQuestion: ${q.problemStatement || q.title}`,
          context: 'FAANG Question Bank ELI5 Concept Explanation',
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiExplanations((prev) => ({ ...prev, [q.id]: data.reply }));
      }
    } catch (err) {
      console.error('AI Explain error:', err);
    } finally {
      setAiExplaining(false);
    }
  };

  const topics = [
    'ALL',
    'Java Full Stack & Cloud Engineering',
    'Data Science, Machine Learning & GenAI',
    'DevOps & Multi-Cloud Architecture',
    'Core Java & JVM Internals',
    'Spring Boot 3 & Security',
    'System Design & Microservices',
    'Data Structures & Algorithms',
    'Cohort Lecture Notes',
  ];

  const filteredQuestions = questions.filter((q) => {
    const titleMatch = q.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const problemMatch = q.problemStatement?.toLowerCase().includes(searchQuery.toLowerCase());
    const solutionMatch = q.canonicalSolution?.toLowerCase().includes(searchQuery.toLowerCase());
    const companyMatch = q.companyTags?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSearch = titleMatch || problemMatch || solutionMatch || companyMatch;

    const matchesTopic = selectedTopic === 'ALL' || q.category === selectedTopic || q.topic === selectedTopic;
    const matchesDifficulty = selectedDifficulty === 'ALL' || (q.difficulty || 'MEDIUM') === selectedDifficulty;

    return matchesSearch && matchesTopic && matchesDifficulty;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      <section className="bg-white py-10 px-4 sm:px-6 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline">
              &larr; Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider">
                📚 Pillar 7: Dynamic FAANG Question Arena
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                Curated Technical Questions &amp; Solutions
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mt-0.5">
                Explore real interview scenarios with Java 21 &amp; Python reference code, AI concept explanations, and 1-click launch into the Mock Interview Arena.
              </p>
            </div>

            {/* Progress Stats */}
            <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Solved</span>
                <span className="text-sm font-black text-emerald-600">{solvedIds.length}</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Bookmarked</span>
                <span className="text-sm font-black text-amber-600">{bookmarkedIds.length}</span>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Active</span>
                <span className="text-sm font-black text-indigo-600">{questions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-8 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
        
        {/* Search & Topic Filters */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across questions, topics, solutions, or company tags (Google, Amazon, Redis)..."
                className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 shrink-0"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">🟢 Easy</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="HARD">🔴 Hard</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {topics.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedTopic === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="p-16 text-center text-xs font-bold text-slate-500">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-600 mb-2 block"></i>
            <span>Loading Technical Question Arena...</span>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
            <i className="fa-solid fa-book-open text-3xl text-slate-300"></i>
            <h3 className="font-bold text-slate-800">No questions found matching your search.</h3>
            <p className="text-xs text-slate-500">Try adjusting your keyword filter or difficulty selector.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuestions.map((q) => {
              const isSolved = solvedIds.includes(q.id);
              const isBookmarked = bookmarkedIds.includes(q.id);

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl border p-5 sm:p-6 shadow-sm space-y-4 transition ${
                    isSolved ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[11px] font-bold">
                        {q.category}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          q.difficulty === 'HARD'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : q.difficulty === 'EASY'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {q.difficulty || 'MEDIUM'}
                      </span>
                      {isSolved && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                          ✓ Solved
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex flex-wrap gap-1 me-2">
                        {(q.companyTags || ['FAANG']).map((c: string) => (
                          <span key={c} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">
                            {c}
                          </span>
                        ))}
                      </div>

                      {/* Bookmark Button */}
                      <button
                        onClick={() => toggleBookmark(q.id)}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          isBookmarked ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Bookmark for Revision"
                      >
                        <i className={`${isBookmarked ? 'fa-solid' : 'fa-regular'} fa-star`}></i>
                      </button>

                      {/* Solved Toggle */}
                      <button
                        onClick={() => toggleSolved(q.id)}
                        className={`p-1.5 rounded-lg text-xs transition ${
                          isSolved ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-emerald-600'
                        }`}
                        title="Mark as Solved"
                      >
                        <i className="fa-solid fa-circle-check"></i>
                      </button>
                    </div>
                  </div>

                  {/* Problem Details */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900">{q.title}</h3>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {q.problemStatement || q.title}
                    </p>
                  </div>

                  {/* Key Tips */}
                  {q.systemDesignTips?.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                      <div className="font-extrabold text-indigo-700 text-[10px] uppercase">Architectural Key Insights:</div>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[11px]">
                        {q.systemDesignTips.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl border border-indigo-100 transition flex items-center space-x-1.5"
                    >
                      <span>{expandedId === q.id ? 'Hide Solution' : 'View Code Solution'}</span>
                      <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${expandedId === q.id ? 'rotate-180' : ''}`}></i>
                    </button>

                    <button
                      onClick={() => handleAIExplain(q)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>✨ AI Explain Concept</span>
                    </button>

                    <Link
                      href={`/dashboard/ai-interview?difficulty=${(q.difficulty || 'medium').toLowerCase()}&track=java_fullstack`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5"
                    >
                      <i className="fa-solid fa-microphone"></i>
                      <span>Practice in AI Mock Arena &rarr;</span>
                    </Link>
                  </div>

                  {/* AI Explanation Drawer */}
                  {explainingId === q.id && (
                    <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2 text-xs animate-fade-in">
                      <div className="flex items-center justify-between font-black text-purple-900">
                        <span>✨ AI Concept Breakdown (ELI5 Analogy)</span>
                        <button onClick={() => setExplainingId(null)} className="text-slate-400 hover:text-slate-700">&times;</button>
                      </div>
                      {aiExplaining && !aiExplanations[q.id] ? (
                        <div className="text-slate-600 italic flex items-center space-x-2">
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>AI Mentor is crafting an intuitive analogy...</span>
                        </div>
                      ) : (
                        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                          {aiExplanations[q.id]}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expanded Solution Drawer */}
                  {expandedId === q.id && (
                    <div className="p-4 bg-slate-900 rounded-2xl text-slate-200 font-mono text-xs space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400 text-[11px] font-bold">Canonical Solution &amp; Implementation</span>
                        <div className="flex space-x-1.5">
                          <button
                            onClick={() => setActiveLang('java')}
                            className={`px-2.5 py-1 text-[10px] rounded font-bold transition ${
                              activeLang === 'java' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Java 21
                          </button>
                          <button
                            onClick={() => setActiveLang('python')}
                            className={`px-2.5 py-1 text-[10px] rounded font-bold transition ${
                              activeLang === 'python' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            Python 3.12
                          </button>
                        </div>
                      </div>

                      {q.canonicalSolution && (
                        <div className="text-[11px] text-slate-300 leading-relaxed font-sans pb-2">
                          <strong className="text-white block mb-0.5">Staff Engineer Analysis:</strong>
                          {q.canonicalSolution}
                        </div>
                      )}

                      <div className="overflow-x-auto text-[11px] leading-relaxed">
                        <pre className="text-indigo-300">
                          {activeLang === 'java'
                            ? q.codeJava || '// Java 21 implementation\n// See canonical solution explanation above.'
                            : q.codePython || '# Python 3.12 implementation\n# See canonical solution explanation above.'}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>

      <StudentFooter />
    </div>
  );
}
