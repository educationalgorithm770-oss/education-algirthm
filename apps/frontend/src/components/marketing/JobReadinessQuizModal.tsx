'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface QuizQuestion {
  id: number;
  category: string;
  badge: string;
  question: string;
  options: {
    label: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

interface JobReadinessQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JobReadinessQuizModal({ isOpen, onClose }: JobReadinessQuizModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [questionId: number]: number }>({});
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const questions: QuizQuestion[] = [
    {
      id: 1,
      category: 'Core Java & Concurrency',
      badge: 'Java 21 Virtual Threads',
      question: 'In high-concurrency systems, how do Java 21 Virtual Threads (Project Loom) differ from traditional Platform Threads?',
      options: [
        {
          label: 'A',
          text: 'Virtual threads map 1:1 with OS kernel threads and consume 1MB stack memory each.',
          isCorrect: false,
          explanation: 'Incorrect. Platform threads map 1:1 to OS threads and consume large memory.',
        },
        {
          label: 'B',
          text: 'Virtual threads are lightweight user-mode threads managed by the JVM with near-zero memory footprint (a few KB).',
          isCorrect: true,
          explanation: 'Correct! JVM schedules millions of virtual threads over carrier platform threads without OS context-switch overhead.',
        },
        {
          label: 'C',
          text: 'Virtual threads can only execute single-threaded while-loops.',
          isCorrect: false,
          explanation: 'Incorrect. Virtual threads execute standard concurrent tasks seamlessly.',
        },
      ],
    },
    {
      id: 2,
      category: 'System Design & Distributed Systems',
      badge: 'High-Throughput Caching',
      question: 'When 50,000 requests hit an e-commerce flash sale simultaneously, how do you prevent a "Cache Breakdown" (Dogpile Effect) in Redis?',
      options: [
        {
          label: 'A',
          text: 'Use a Redis Distributed Mutex Lock (e.g. Redlock/SETNX with TTL) so only one thread queries the database while others wait.',
          isCorrect: true,
          explanation: 'Correct! A distributed lock ensures only one worker rebuilds the cache entry while others read the updated value.',
        },
        {
          label: 'B',
          text: 'Restart the Redis master node immediately.',
          isCorrect: false,
          explanation: 'Incorrect. Restarting drops active connections and amplifies the spike.',
        },
        {
          label: 'C',
          text: 'Disable all caching and send all 50,000 queries directly to MySQL database.',
          isCorrect: false,
          explanation: 'Incorrect. This causes an immediate database connection pool exhaustion deadlock.',
        },
      ],
    },
    {
      id: 3,
      category: 'Placement Aptitude & Vedic Math',
      badge: 'Company OA Speed Math',
      question: 'Two trains running at 72 km/h and 36 km/h in opposite directions cross each other in 10 seconds. What is the sum of their lengths?',
      options: [
        {
          label: 'A',
          text: '200 meters',
          isCorrect: false,
          explanation: 'Incorrect. Relative speed = 72 + 36 = 108 km/h = 30 m/s. Distance = 30 * 10 = 300m.',
        },
        {
          label: 'B',
          text: '300 meters',
          isCorrect: true,
          explanation: 'Correct! Opposite direction => Relative Speed = 108 * (5/18) = 30 m/s. Total length = 30 m/s * 10s = 300 meters.',
        },
        {
          label: 'C',
          text: '450 meters',
          isCorrect: false,
          explanation: 'Incorrect. Check the km/h to m/s conversion factor (5/18).',
        },
      ],
    },
    {
      id: 4,
      category: 'Career & Salary Target',
      badge: 'Target Placement Goal',
      question: 'What is your primary tech career placement target for the upcoming hiring season?',
      options: [
        {
          label: 'A',
          text: 'Crack Tier-1 Product Company (₹18 LPA – ₹35+ LPA) as Java Full Stack & Microservices Engineer.',
          isCorrect: true,
          explanation: 'Our Flagship Java 21 & Distributed Systems Cohort is specifically engineered for this tier.',
        },
        {
          label: 'B',
          text: 'Crack Service Leader Special Cadre (TCS Prime / Infosys DSE / Cognizant GenC Next @ ₹9 – ₹14 LPA).',
          isCorrect: true,
          explanation: 'Our Company OA Simulators and Concept Labs guarantee clearing these competitive assessment rounds.',
        },
        {
          label: 'C',
          text: 'High-Growth AI Startup SDE (₹12 LPA – ₹24 LPA) building Generative AI & Agentic Systems.',
          isCorrect: true,
          explanation: 'Our AI Agentic & RAG Interview modules provide the exact production projects needed.',
        },
      ],
    },
  ];

  const currentQ = questions[currentStep];

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQ.id]: optionIndex });
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setIsAnswered(selectedAnswers[questions[currentStep + 1]?.id] !== undefined);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setIsAnswered(true);
    }
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setCurrentStep(0);
    setIsAnswered(false);
    setIsCompleted(false);
  };

  // Calculate score
  const correctCount = questions.slice(0, 3).reduce((acc, q) => {
    const selectedIdx = selectedAnswers[q.id];
    if (selectedIdx !== undefined && q.options[selectedIdx]?.isCorrect) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const readinessScore = Math.round(55 + (correctCount / 3) * 40);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-base font-bold shadow-2xs">
              <i className="fa-solid fa-bullseye"></i>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                2-Minute Tech Job-Readiness Diagnostic
              </h2>
              <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">
                Benchmark Your Skills for Top Tech Hiring Loops
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition shrink-0"
            aria-label="Close modal"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {!isCompleted ? (
          <div className="space-y-6">
            {/* Progress Bar & Question Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="text-indigo-600 uppercase tracking-wider">
                  Question {currentStep + 1} of {questions.length} • {currentQ.category}
                </span>
                <span>{Math.round(((currentStep + 1) / questions.length) * 100)}% Complete</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Question Card */}
            <div className="space-y-4">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-extrabold uppercase text-slate-600">
                {currentQ.badge}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(oIdx)}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-600 text-indigo-950 shadow-xs ring-2 ring-indigo-600/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-semibold leading-relaxed block">
                          {opt.text}
                        </span>
                        {isSelected && opt.explanation && (
                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed bg-white/80 p-2 rounded-xl border border-indigo-100 font-normal">
                            💡 {opt.explanation}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation CTA Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 text-xs font-extrabold transition flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-arrow-left text-[10px]"></i>
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                disabled={selectedAnswers[currentQ.id] === undefined}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold transition shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
              >
                <span>{currentStep === questions.length - 1 ? 'Calculate My Score 🎉' : 'Next Question'}</span>
                <i className="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        ) : (
          /* RESULT SCORECARD */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Score Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 via-purple-50 to-slate-50 border border-indigo-200 text-center space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                <i className="fa-solid fa-trophy"></i>
                <span>Your Diagnostic Assessment Report</span>
              </div>

              <div className="flex items-center justify-center space-x-3">
                <div className="text-4xl sm:text-5xl font-black text-indigo-900 font-mono tracking-tight">
                  {readinessScore}
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-500 font-bold block">/ 100</span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    High Placement Potential
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                You answered <strong>{correctCount} of 3</strong> technical benchmark questions correctly. With structured microservices capstones and visual OA drills, you are ready to target <strong>₹14.5 – ₹25 LPA</strong> roles.
              </p>
            </div>

            {/* Diagnostic Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">Core Java Concurrency</div>
                <div className="text-sm font-black text-indigo-700">85% Ready</div>
                <span className="text-[10px] text-slate-400">Virtual Threads & JVM</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">System Architecture</div>
                <div className="text-sm font-black text-purple-700">Needs Kafka & Redis</div>
                <span className="text-[10px] text-slate-400">Distributed Locks</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-500">OA Placement Aptitude</div>
                <div className="text-sm font-black text-emerald-700">TCS/Amazon Ready</div>
                <span className="text-[10px] text-slate-400">Motion Concept Labs</span>
              </div>
            </div>

            {/* Recommended Cohort Roadmap */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 block">
                  Recommended Path For You
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Java Full Stack & Distributed Systems Accelerator
                </h4>
                <p className="text-xs text-slate-500">
                  Includes in-browser Docker Sandboxes, 7 Motion Concept Labs, and 24/7 AI Mock Interviewer.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                >
                  Retake
                </button>
                <Link
                  href="/courses"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-1.5"
                >
                  <span>Explore Cohort</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
