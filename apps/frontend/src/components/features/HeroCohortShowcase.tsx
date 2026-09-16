'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface VideoLesson {
  id: number;
  title: string;
  duration?: string | null;
  youtube_id?: string | null;
  bunny_video_id?: string | null;
  video_url?: string | null;
  file_path?: string | null;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  videos: VideoLesson[];
}

interface Course {
  id: number;
  title: string;
  slug?: string;
  description?: string;
  level?: string;
  duration?: string;
  price: number | string;
  modules: CourseModule[];
}

export default function HeroCohortShowcase() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'curriculum' | 'calculator' | 'architecture' | 'ai'>('curriculum');
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [currentSalary, setCurrentSalary] = useState<number>(6); // in LPA
  const [selectedNode, setSelectedNode] = useState<string>('gateway');

  // AI Tutor Quick Demo State
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
          if (data.courses.length > 0) {
            // Pick Java course or first course
            const java = data.courses.find((c: Course) => c.title.toLowerCase().includes('java')) || data.courses[0];
            setSelectedCourseId(java.id);
            if (java.modules && java.modules.length > 0) {
              setExpandedModule(java.modules[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load courses for showcase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;

  const estimatedHikeMultiple = 3.6;
  const projectedSalary = (currentSalary * estimatedHikeMultiple).toFixed(1);

  const handleAiAsk = (query: string) => {
    setAiQuestion(query);
    setAiLoading(true);
    setAiResponse(null);

    setTimeout(() => {
      if (query.includes('Virtual Threads')) {
        setAiResponse('Java 21 Virtual Threads (Loom) are lightweight threads managed by the JVM rather than the OS. They allow millions of concurrent tasks with minimal memory overhead (~a few hundred bytes vs 1MB for platform threads), eliminating thread pool starvation in high-concurrency microservices.');
      } else if (query.includes('RAG')) {
        setAiResponse('Retrieval-Augmented Generation (RAG) combines Vector Databases (e.g. Pgvector, Qdrant) with Gemini LLMs. It converts domain documents into vector embeddings so the AI retrieves context-accurate data before generating answers with zero hallucinations.');
      } else {
        setAiResponse('Distributed systems require partitioning data across microservices with event-driven messaging (Kafka) and caching (Redis). This isolates failure domains and delivers sub-20ms P99 latency at 100k+ RPS.');
      }
      setAiLoading(false);
    }, 600);
  };

  const formatPrice = (p: number | string | undefined) => {
    const num = Number(p || 18000);
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const calculateEmi = (p: number | string | undefined) => {
    const num = Number(p || 18000);
    const emi = Math.round(num / 12);
    return `₹${emi.toLocaleString('en-IN')}/mo`;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-7 shadow-xl space-y-5 sm:space-y-6 relative overflow-hidden">
      {/* Decorative ambient background glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-50/70 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3.5 relative z-10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-black text-slate-900 uppercase tracking-wider">Fall 2026 Cohort Accelerator</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">Interactive Systems Command Center</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] sm:text-xs font-extrabold shadow-2xs">
            ⚡ 4 Seats Remaining
          </span>
        </div>
      </div>

      {/* Interactive Command Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl gap-1 text-[11px] sm:text-xs font-bold relative z-10">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'curriculum'
              ? 'bg-white text-indigo-600 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-graduation-cap"></i>
          <span>Cohort Tracks</span>
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'calculator'
              ? 'bg-white text-indigo-600 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-calculator"></i>
          <span>ROI Calculator</span>
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'architecture'
              ? 'bg-white text-indigo-600 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-network-wired"></i>
          <span>Architecture</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`py-2 px-2.5 rounded-xl transition text-center flex items-center justify-center space-x-1.5 ${
            activeTab === 'ai'
              ? 'bg-white text-indigo-600 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <i className="fa-solid fa-robot text-purple-600"></i>
          <span>AI Tutor Demo</span>
        </button>
      </div>

      {/* TAB 1: CURRICULUM OVERVIEW (LIVE MYSQL DATA - CLEAN CARD) */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4 relative z-10 animate-fade-in">
          
          {/* 1. Live MySQL Course Track Switcher Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-2xl">
            {courses.map((c) => {
              const isSelected = selectedCourse?.id === c.id;
              const shortTitle = c.title.includes('Java')
                ? 'Java Full Stack'
                : c.title.includes('Data')
                ? 'Data Science & AI'
                : c.title.includes('DevOps')
                ? 'DevOps & Cloud'
                : c.title;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs transition flex items-center justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md'
                      : 'bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200'
                  }`}
                >
                  <span className="truncate">{shortTitle}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    isSelected ? 'bg-white/20 text-white font-bold' : 'bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200'
                  }`}>
                    {formatPrice(c.price)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 2. Selected Course Program Overview & Key Highlights Card */}
          {selectedCourse && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/40 border border-indigo-100 shadow-xs space-y-4">
              
              {/* Header Info & Price Tag */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100/80">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center space-x-2 text-xs font-bold text-indigo-900">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                      {selectedCourse.duration || '16 Weeks Live'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600">{selectedCourse.level || 'Intermediate to Advanced'}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-slate-900 truncate">
                    {selectedCourse.title}
                  </h4>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg sm:text-xl font-black text-slate-900">
                    {formatPrice(selectedCourse.price)}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600">
                    EMI {calculateEmi(selectedCourse.price)}
                  </div>
                </div>
              </div>

              {/* Course Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {selectedCourse.description || 'Master modern cloud engineering, high-throughput microservices, Docker containerization, and enterprise system design.'}
              </p>

              {/* 4 Core Pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs space-y-0.5">
                  <i className="fa-solid fa-code text-indigo-600 text-xs"></i>
                  <div className="text-[11px] font-black text-slate-900">Code Arena</div>
                  <div className="text-[9px] text-slate-500 font-medium">Docker Sandbox</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs space-y-0.5">
                  <i className="fa-solid fa-robot text-purple-600 text-xs"></i>
                  <div className="text-[11px] font-black text-slate-900">24/7 AI Tutor</div>
                  <div className="text-[9px] text-slate-500 font-medium">Gemini Assistant</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs space-y-0.5">
                  <i className="fa-solid fa-diagram-project text-emerald-600 text-xs"></i>
                  <div className="text-[11px] font-black text-slate-900">Live Capstones</div>
                  <div className="text-[9px] text-slate-500 font-medium">Production Ready</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-center shadow-2xs space-y-0.5">
                  <i className="fa-solid fa-award text-amber-500 text-xs"></i>
                  <div className="text-[11px] font-black text-slate-900">Certification</div>
                  <div className="text-[9px] text-slate-500 font-medium">Industry Verified</div>
                </div>
              </div>

              {/* Instant Enrollment CTA */}
              <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2">
                <Link
                  href={`/checkout?course=${selectedCourse.id}`}
                  className="w-full sm:flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-1.5"
                >
                  <i className="fa-solid fa-bolt text-amber-300 text-xs"></i>
                  <span>Enroll in this Cohort ({formatPrice(selectedCourse.price)})</span>
                </Link>
                <Link
                  href="/courses"
                  className="w-full sm:w-auto py-2.5 px-3.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 shadow-2xs"
                >
                  <span>Full Syllabus</span>
                  <i className="fa-solid fa-arrow-right text-[9px] text-slate-400"></i>
                </Link>
              </div>

            </div>
          )}

        </div>
      )}

      {/* TAB 2: LIVE SALARY ESTIMATOR */}
      {activeTab === 'calculator' && (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-5 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black text-indigo-600 uppercase tracking-wider">Interactive ROI Estimator</div>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">Project Your Salary Hike</h4>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black rounded-lg">
              Avg 3.6x Hike
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-extrabold text-slate-700">
              <span>Current Annual Salary:</span>
              <span className="text-indigo-600 text-sm">₹{currentSalary} LPA</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={currentSalary}
              onChange={(e) => setCurrentSalary(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>₹3 LPA</span>
              <span>₹14 LPA</span>
              <span>₹25 LPA</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Post-Cohort Salary</div>
              <div className="text-xl font-black text-emerald-600 mt-0.5">₹{projectedSalary} LPA</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated Net Payback Period</div>
              <div className="text-xl font-black text-indigo-600 mt-0.5">&lt; 30 Days</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM ARCHITECTURE BLUEPRINT */}
      {activeTab === 'architecture' && (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="text-xs font-black text-indigo-600 uppercase tracking-wider">Interactive Architecture Nodes</div>
            <span className="text-[10px] font-bold text-slate-500">Click node to inspect</span>
          </div>

          {/* Interactive Node Graph */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedNode('gateway')}
              className={`p-3 rounded-xl border text-center transition ${
                selectedNode === 'gateway' ? 'bg-indigo-600 text-white font-black border-indigo-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
              }`}
            >
              <i className="fa-solid fa-network-wired text-sm block mb-1"></i>
              <span className="text-[11px]">API Gateway</span>
            </button>

            <button
              onClick={() => setSelectedNode('kafka')}
              className={`p-3 rounded-xl border text-center transition ${
                selectedNode === 'kafka' ? 'bg-purple-600 text-white font-black border-purple-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
              }`}
            >
              <i className="fa-solid fa-diagram-project text-sm block mb-1"></i>
              <span className="text-[11px]">Kafka Bus</span>
            </button>

            <button
              onClick={() => setSelectedNode('docker')}
              className={`p-3 rounded-xl border text-center transition ${
                selectedNode === 'docker' ? 'bg-emerald-600 text-white font-black border-emerald-600 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 font-bold'
              }`}
            >
              <i className="fa-brands fa-docker text-sm block mb-1"></i>
              <span className="text-[11px]">Docker Runner</span>
            </button>
          </div>

          {/* Node Inspector Panel */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-xs">
            {selectedNode === 'gateway' && (
              <>
                <div className="font-extrabold text-slate-900 flex justify-between">
                  <span>Spring Cloud API Gateway + OAuth2</span>
                  <span className="text-emerald-600 font-mono">100k Req/sec</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Handles TLS termination, rate-limiting with Token Bucket algorithm, and routes JWT authenticated claims.
                </p>
              </>
            )}
            {selectedNode === 'kafka' && (
              <>
                <div className="font-extrabold text-slate-900 flex justify-between">
                  <span>Apache Kafka Event Backbone</span>
                  <span className="text-purple-600 font-mono">Sub-5ms Latency</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Decouples microservices using event-driven topics, dead-letter queues, and exactly-once processing semantics.
                </p>
              </>
            )}
            {selectedNode === 'docker' && (
              <>
                <div className="font-extrabold text-slate-900 flex justify-between">
                  <span>Zero-Trust Docker Code Sandbox</span>
                  <span className="text-emerald-600 font-mono">24ms Execution</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Spawns ephemeral isolated container instances for Python &amp; Java code evaluation with strict cgroup resource limits.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: AI TUTOR LIVE DEMO */}
      {activeTab === 'ai' && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative z-10 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-purple-600 uppercase tracking-wider flex items-center">
              <i className="fa-solid fa-robot me-1.5"></i> Gemini AI Tutor Live Demo
            </span>
            <span className="text-[10px] font-bold text-slate-400">Click prompt below</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleAiAsk('Explain Java 21 Virtual Threads')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              🚀 Virtual Threads
            </button>
            <button
              onClick={() => handleAiAsk('How does Agentic RAG work?')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              🤖 Agentic RAG
            </button>
            <button
              onClick={() => handleAiAsk('Why microservices over monolith?')}
              className="px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition shadow-2xs"
            >
              ⚡ Microservices
            </button>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs min-h-[90px] flex items-center justify-center shadow-xs">
            {aiLoading ? (
              <span className="text-indigo-600 font-bold flex items-center">
                <i className="fa-solid fa-circle-notch fa-spin me-2"></i> Querying Google Gemini AI Engine...
              </span>
            ) : aiResponse ? (
              <div className="space-y-1 text-left w-full">
                <div className="font-extrabold text-slate-900 text-[11px] text-purple-700">Q: {aiQuestion}</div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{aiResponse}</p>
              </div>
            ) : (
              <span className="text-slate-400 font-medium text-[11px] text-center">
                Click one of the prompt chips above to see live Gemini AI technical explanation.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer Summary & Action CTA */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto text-center sm:text-left">
          <div>
            <div className="text-slate-900 font-black text-xs sm:text-sm">98.4%</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Placement</div>
          </div>
          <div>
            <div className="text-slate-900 font-black text-xs sm:text-sm">3.8x</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Hike</div>
          </div>
          <div>
            <div className="text-slate-900 font-black text-xs sm:text-sm">₹14.5L</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Package</div>
          </div>
        </div>

        <Link
          href="/courses"
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5 shrink-0"
        >
          <span>Explore All Cohorts</span>
          <i className="fa-solid fa-arrow-right text-[10px]"></i>
        </Link>
      </div>
    </div>
  );
}
