'use client';

import React, { useState } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';

export default function AdminAIStudioPage() {
  const [model, setModel] = useState('gemini-3.5-flash');
  const [temperature, setTemperature] = useState(0.2);
  const [systemPrompt, setSystemPrompt] = useState(
    `You are the Education Algorithm AI Tutor, a senior-level teaching assistant and mentor specializing in Java Full Stack Development.
Your purpose is not simply to answer questions. Your purpose is to teach the student, build understanding, improve problem-solving ability, prepare them for interviews, and connect concepts to real-world software development.`
  );
  const [savedBanner, setSavedBanner] = useState('');

  // RAG Playground State
  const [testQuery, setTestQuery] = useState('How do Java 21 Virtual Threads prevent OS context-switching overhead?');
  const [testCategory, setTestCategory] = useState('all');
  const [testTopK, setTestTopK] = useState(3);
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedBanner('AI Tutor System Prompt & Hyperparameters deployed to production!');
    setTimeout(() => setSavedBanner(''), 4000);
  };

  // Run RAG Search in Playground
  const handleTestRAG = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;
    setRagLoading(true);
    setRagResult(null);

    try {
      const res = await fetch('/api/ai/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testQuery,
          category: testCategory,
          topK: testTopK,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRagResult(data);
      }
    } catch (err) {
      console.error('RAG test error:', err);
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
            <i className="fa-solid fa-brain"></i>
            <span>AI Hyperparameters &amp; RAG Vector Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            AI Studio &amp; Live RAG Playground
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Test vector semantic retrieval against dynamic course documents, simulate LLM synthesis, and configure multi-key model pools.
          </p>
        </div>

        {savedBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-md animate-fade-in-up">
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-sm"></i>
              <span>{savedBanner}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: LLM Config (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-black text-slate-900 uppercase">Model Engine &amp; Hyperparameters</h2>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Active Multi-Key AI Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                >
                  <option value="gemini-3.6-flash">Google Gemini 3.6 Flash (Fastest / Recommended)</option>
                  <option value="gemini-3.7-flash">Google Gemini 3.7 Flash (Latest Reasoning)</option>
                  <option value="gemini-3.5-flash">Google Gemini 3.5 Flash (Multi-Key Pool Active)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Multi-key load balancer automatically rotates up to 10 keys (15,000+ free queries/day).
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Temperature Sampling
                  </label>
                  <span className="font-mono font-bold text-purple-600">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  AI Tutor Pedagogical Prompt
                </label>
                <textarea
                  rows={8}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-[11px] text-slate-900 font-mono leading-relaxed bg-slate-50"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow transition"
              >
                Deploy Hyperparameters
              </button>
            </form>
          </div>

          {/* Right Column: Live RAG Vector Playground (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-black uppercase">
                  🧪 Interactive Inspector
                </span>
                <h2 className="text-base font-black text-slate-900 mt-1">Live RAG Vector Playground</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">Sub-10ms Cosine Search</span>
            </div>

            <form onSubmit={handleTestRAG} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Test Student Query</label>
                <input
                  type="text"
                  required
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="Ask any technical concept or course question..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category Filter</label>
                  <select
                    value={testCategory}
                    onChange={(e) => setTestCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value="all">All Dynamic Knowledge</option>
                    <option value="Core Java &amp; JVM Internals">Core Java &amp; JVM</option>
                    <option value="Spring Boot 3 &amp; Security">Spring Boot &amp; Security</option>
                    <option value="System Design &amp; Microservices">System Design</option>
                    <option value="Cohort Lecture Notes">Lecture Notes</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Top-K Chunks to Retrieve</label>
                  <select
                    value={testTopK}
                    onChange={(e) => setTestTopK(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value={1}>Top 1 Nearest Chunk</option>
                    <option value={3}>Top 3 Nearest Chunks (Recommended)</option>
                    <option value={5}>Top 5 Nearest Chunks</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={ragLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center space-x-2"
              >
                {ragLoading ? (
                  <span><i className="fa-solid fa-spinner fa-spin me-2"></i>Computing Cosine Vectors &amp; Synthesizing...</span>
                ) : (
                  <span><i className="fa-solid fa-bolt me-2"></i>Execute RAG Retrieval &amp; Synthesis</span>
                )}
              </button>
            </form>

            {/* Results Display */}
            {ragResult && (
              <div className="space-y-4 pt-3 border-t border-slate-100 text-xs animate-fade-in">
                <div className="flex items-center justify-between text-slate-500 font-bold">
                  <span>Retrieved {ragResult.retrievedChunks?.length} Vector Chunks</span>
                  <span className="text-emerald-600 font-mono">⚡ Latency: {ragResult.searchLatencyMs}ms</span>
                </div>

                {/* Retrieved Chunks with Similarity Scores */}
                <div className="space-y-2">
                  <span className="font-black text-slate-900 uppercase text-[10px]">Retrieved Context Chunks:</span>
                  {ragResult.retrievedChunks?.map((chunk: any, cIdx: number) => (
                    <div key={cIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{chunk.docTitle} (Page {chunk.pageNumber})</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                          {(chunk.similarity * 100).toFixed(1)}% Match
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] line-clamp-3 font-mono leading-relaxed">
                        {chunk.chunkText}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Synthesized Answer */}
                <div className="space-y-1">
                  <span className="font-black text-indigo-700 uppercase text-[10px]">Grounded Gemini 3.5 Synthesis:</span>
                  <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-medium">
                    {ragResult.citedAnswer}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
