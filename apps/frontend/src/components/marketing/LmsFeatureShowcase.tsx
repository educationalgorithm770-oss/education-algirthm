'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FeatureTab {
  id: string;
  name: string;
  icon: string;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  highlights: string[];
  ctaText: string;
  ctaHref: string;
  previewType: 'video_player' | 'ai_interview' | 'code_arena' | 'ai_tutor' | 'doubt_desk';
}

export default function LmsFeatureShowcase() {
  const [activeTabId, setActiveTabId] = useState<string>('ai_interview');

  const tabs: FeatureTab[] = [
    {
      id: 'ai_interview',
      name: 'AI Interview Arena',
      icon: 'fa-robot',
      badge: 'RAG-Powered AI',
      title: 'Simulate Real FAANG Technical Interviews Anytime',
      tagline: '50,000 Questions Bank with Live Staff Engineer Rubric Grading',
      description:
        'Practice coding, system design, and Java concurrency questions evaluated instantly by our specialized RAG AI engine. Get a multi-dimensional rubric scorecard on technical accuracy, edge cases, and code quality before your real interviews.',
      highlights: [
        '50,000+ real interview questions from top product companies',
        'Staff Engineer rubric grading with line-by-line code feedback',
        'Easy, Medium & Hard tiers across Java, System Design & DSA',
        'Permanent attempt history & benchmark scoring progress',
      ],
      ctaText: 'Explore Cohort & Interview Arena',
      ctaHref: '/courses',
      previewType: 'ai_interview',
    },
    {
      id: 'code_arena',
      name: 'In-Browser Code Arena',
      icon: 'fa-terminal',
      badge: 'Docker Sandbox',
      title: 'Compile & Test Code in an Isolated Cloud Sandbox',
      tagline: 'Zero Setup Required — Java 21 LTS & Python Ready',
      description:
        'Write, run, and benchmark algorithms directly in your browser. Every submission runs against automated unit test suites with memory, execution time, and algorithmic complexity analysis.',
      highlights: [
        'Pre-configured runtime for Java 21 (Virtual Threads) & Python 3.12',
        'Automated test harnesses with hidden edge-case validation',
        'Real-time execution time (ms) and memory footprint metrics',
        'Built-in AI hints when your logic fails specific test assertions',
      ],
      ctaText: 'Try Code Arena Demo',
      ctaHref: '/code-arena',
      previewType: 'code_arena',
    },
    {
      id: 'video_player',
      name: 'HD Course Player',
      icon: 'fa-circle-play',
      badge: 'BunnyCDN Streaming',
      title: 'Distraction-Free Learning with Zen Focus Mode',
      tagline: 'Ultra-Fast Zero-Buffering Edge Video Streaming',
      description:
        'Stream deep-dive architectural lectures in crystal-clear 1080p 60fps. Toggle Zen Focus Mode to hide all distractions, adjust playback speeds up to 2x, and take timestamped notes right beside the video.',
      highlights: [
        'Global low-latency edge delivery via BunnyCDN infrastructure',
        '1-Click Zen Focus Mode for deep uninterrupted studying',
        'Variable speed playback (0.75x, 1x, 1.25x, 1.5x, 2x)',
        'Integrated syllabus drawer with automated lesson progress sync',
      ],
      ctaText: 'View 16-Week Syllabus',
      ctaHref: '/courses',
      previewType: 'video_player',
    },
    {
      id: 'ai_tutor',
      name: '24/7 AI Whiteboard Tutor',
      icon: 'fa-brain',
      badge: 'Instant Explanations',
      title: 'Get Complex Technical Concepts Explained in Simple Analogies',
      tagline: 'Never Stay Blocked on an Architectural Concept Again',
      description:
        'Stuck on Java Memory Model, Kafka consumer group rebalancing, or Redis cache invalidation? Ask the AI Tutor for ELI5 whiteboard analogies, step-by-step code walkthroughs, and conceptual clarity 24/7.',
      highlights: [
        'Context-aware answers tailored to your active lecture or code snippet',
        'Whiteboard-style visual analogies for junior-to-mid developers',
        'Instant bug diagnostics for compiler & NullPointer exceptions',
        'Available around the clock with zero wait times',
      ],
      ctaText: 'See How AI Tutor Works',
      ctaHref: '/courses',
      previewType: 'ai_tutor',
    },
    {
      id: 'doubt_desk',
      name: 'Faculty Doubt Desk',
      icon: 'fa-comments',
      badge: '24-Hour SLA',
      title: 'Direct 1-on-1 Support from Experienced Faculty',
      tagline: 'Every Question Answered by Senior Engineers within 24 Hours',
      description:
        'When AI explanations aren’t enough, submit your exact code repository and bug descriptions to the private Doubt Desk. Our engineering instructors review your code and provide clear, actionable solutions.',
      highlights: [
        'Private ticket submission with syntax-highlighted code attachments',
        'Guaranteed response SLA within 24 hours from senior instructors',
        'Searchable archive of resolved doubts and conceptual Q&As',
        'Direct mentorship without getting lost in crowded chat channels',
      ],
      ctaText: 'Meet Our Faculty & Mentors',
      ctaHref: '/about',
      previewType: 'doubt_desk',
    },
  ];

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <section id="lms-tour" className="py-14 sm:py-20 px-3 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12 relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto px-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
            <i className="fa-solid fa-graduation-cap"></i>
            <span>Proprietary Learning Environment</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Take a Look Inside the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Student LMS</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-base font-normal leading-relaxed">
            We don’t just teach theory—we provide an enterprise-grade engineering workspace equipped with live AI rubrics, cloud compilers, and 24-hour faculty support.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto pb-2 gap-1.5 sm:gap-3 no-scrollbar px-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-extrabold text-[11px] sm:text-sm transition flex items-center space-x-1.5 sm:space-x-2 whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/30'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-xs ${isActive ? 'text-white' : 'text-indigo-400'}`}></i>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Feature Display Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Left Column: Natural Explanations */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[11px] font-black uppercase tracking-wider inline-block">
                {activeTab.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {activeTab.title}
              </h3>
              <div className="text-xs sm:text-sm font-bold text-indigo-400">
                {activeTab.tagline}
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
              {activeTab.description}
            </p>

            {/* Highlights List */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              {activeTab.highlights.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-2.5 text-xs text-slate-200">
                  <i className="fa-solid fa-circle-check text-emerald-400 text-xs mt-0.5 shrink-0"></i>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Link
                href={activeTab.ctaHref}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm transition shadow-md shadow-indigo-600/30"
              >
                <span>{activeTab.ctaText}</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>
            </div>
          </div>

          {/* Right Column: Realistic Mockup of the Private LMS View */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-inner font-mono text-xs text-slate-300">
            
            {/* Mock Window Topbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
                <span className="ml-2 font-sans font-extrabold text-slate-300">
                  Student LMS Portal / {activeTab.name}
                </span>
              </div>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-sans font-bold">
                ● Live Student Session
              </span>
            </div>

            {/* Mockup 1: AI Mock Interview Arena */}
            {activeTab.previewType === 'ai_interview' && (
              <div className="space-y-4 font-sans">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-indigo-400 font-extrabold">Track:</span> Java Full Stack & Concurrency
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold">
                    🟡 MEDIUM TIER
                  </span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-200">
                    Q: Explain how Java 21 Virtual Threads differ from OS Platform Threads in I/O blocking scenarios.
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-400 font-mono">
                    Virtual Threads are managed by the JVM rather than the OS kernel. When a virtual thread executes a blocking I/O operation, the carrier thread is unmounted and freed to execute other tasks...
                  </div>
                </div>

                {/* Scorecard Preview */}
                <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-800/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-800/40 pb-2">
                    <span className="text-xs font-black text-indigo-300">Staff Engineer Rubric Scorecard</span>
                    <span className="text-xs font-extrabold text-emerald-400 px-2.5 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                      Score: 94 / 100 (Strong Hire)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-slate-400">Tech Accuracy</div>
                      <div className="font-black text-emerald-400 text-xs mt-0.5">96%</div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-slate-400">Concurrency</div>
                      <div className="font-black text-indigo-300 text-xs mt-0.5">92%</div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-slate-400">Edge Cases</div>
                      <div className="font-black text-amber-300 text-xs mt-0.5">90%</div>
                    </div>
                    <div className="p-2 bg-slate-900/80 rounded-lg">
                      <div className="text-slate-400">Clarity</div>
                      <div className="font-black text-purple-300 text-xs mt-0.5">98%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mockup 2: Code Arena Sandbox */}
            {activeTab.previewType === 'code_arena' && (
              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  <div className="text-slate-500">{"// Problem: Implement Thread-Safe LRU Cache with O(1) eviction"}</div>
                  <div className="text-indigo-400 mt-1">public class <span className="text-white">DistributedLRUCache&lt;K, V&gt;</span> &#123;</div>
                  <div className="pl-4 text-slate-400">private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();</div>
                  <div className="pl-4 text-emerald-400">public V get(K key) &#123; rwLock.readLock().lock(); ... &#125;</div>
                  <div className="text-indigo-400">&#125;</div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Docker Test Suite Execution</span>
                    <span className="text-emerald-400 font-bold">✓ 12 / 12 Test Cases Passed (38ms)</span>
                  </div>
                  <div className="space-y-1 text-[10px]">
                    <div className="text-emerald-400">✓ Test 1: Basic Get/Put Operations (Passed)</div>
                    <div className="text-emerald-400">✓ Test 2: Concurrency Race Condition 1,000 Threads (Passed)</div>
                    <div className="text-emerald-400">✓ Test 3: Memory Eviction Boundary Limit (Passed)</div>
                  </div>
                </div>
              </div>
            )}

            {/* Mockup 3: HD Course Player */}
            {activeTab.previewType === 'video_player' && (
              <div className="space-y-3 font-sans">
                <div className="aspect-video bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between p-4 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-slate-300 z-10">
                    <span className="font-extrabold text-indigo-400">Lecture 4: Microservices Event Driven Architecture</span>
                    <span className="px-2 py-0.5 bg-indigo-600 rounded text-[10px] font-bold text-white">Zen Mode Active</span>
                  </div>
                  <div className="self-center text-center z-10">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg mx-auto shadow-lg shadow-indigo-600/50">
                      <i className="fa-solid fa-play ml-1"></i>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 font-mono">1080p 60fps • 0.75x 1x 1.5x 2x</div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden z-10">
                    <div className="h-full bg-indigo-500 w-3/5"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Mockup 4: AI Whiteboard Tutor */}
            {activeTab.previewType === 'ai_tutor' && (
              <div className="space-y-3 font-sans">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-[10px] font-extrabold text-indigo-400 uppercase">Student Prompt:</div>
                  <div className="text-xs text-slate-200">
                    "Can you give me an analogy to understand Kafka Partitioning vs Consumer Groups?"
                  </div>
                </div>
                <div className="p-3.5 bg-indigo-950/40 rounded-xl border border-indigo-800/40 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center space-x-2 text-[11px] text-indigo-300 font-extrabold">
                    <i className="fa-solid fa-robot"></i>
                    <span>AI Whiteboard Tutor</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    Think of a <strong>Kafka Topic</strong> as a busy restaurant kitchen. Each <strong>Partition</strong> is a separate order ticket queue. A <strong>Consumer Group</strong> is the team of chefs. Each chef takes an order ticket queue exclusively so no two chefs cook the same customer order twice!
                  </p>
                </div>
              </div>
            )}

            {/* Mockup 5: Faculty Doubt Desk */}
            {activeTab.previewType === 'doubt_desk' && (
              <div className="space-y-3 font-sans">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-extrabold text-slate-200">Ticket #D-801:</span> Spring Security Filter Exception
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                    ✓ Resolved in 4h
                  </span>
                </div>
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-slate-400">Instructor Feedback (Rahul Sharma, Ex-Amazon):</div>
                  <div className="text-[11px] text-slate-300 leading-relaxed">
                    "Make sure your `JwtAuthenticationFilter` calls `filterChain.doFilter(request, response)` *after* setting the `SecurityContextHolder`, not before. Check lines 28–34 in your repository."
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
