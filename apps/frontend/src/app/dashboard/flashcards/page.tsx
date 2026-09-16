'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Flashcard {
  id: string;
  topic: string;
  question: string;
  answer: string;
  interval: string; // e.g. Day 1, Day 3, Day 7, Day 30
}

export default function FlashcardsPage() {
  const [cards] = useState<Flashcard[]>([
    {
      id: 'fc_1',
      topic: 'Java 21 Concurrency',
      question: 'What is the key structural difference between Platform Threads and Virtual Threads in Java 21?',
      answer: 'Platform threads map 1-to-1 with operating system kernel threads (heavyweight, ~1MB RAM). Virtual threads are managed by the JVM and multiplexed onto carrier OS threads (lightweight, ~1KB RAM), allowing millions of concurrent tasks.',
      interval: 'Day 1 (Ebbinghaus Interval)'
    },
    {
      id: 'fc_2',
      topic: 'Spring Boot Security',
      question: 'How does OncePerRequestFilter ensure JWT authentication is not executed multiple times in a single request dispatch?',
      answer: 'OncePerRequestFilter guarantees single execution per request dispatch (including internal forward or include dispatches) by checking request attributes before invoking doFilterInternal().',
      interval: 'Day 3 (Ebbinghaus Interval)'
    },
    {
      id: 'fc_3',
      topic: 'GenAI RAG Architectures',
      question: 'Why are vector embeddings (e.g. text-embedding-004) stored in pgvector with HNSW indexes?',
      answer: 'HNSW (Hierarchical Navigable Small World) indexes allow sub-millisecond approximate nearest neighbor (ANN) similarity searches across high-dimensional vector spaces using cosine or L2 distance.',
      interval: 'Day 7 (Ebbinghaus Interval)'
    },
    {
      id: 'fc_4',
      topic: 'Data Structures & Algorithms',
      question: 'How do LRU Caches achieve O(1) time complexity for both get() and put() operations?',
      answer: 'By pairing a HashMap for O(1) key-to-node lookups with a Doubly Linked List for O(1) removal and insertion at the head (most recently used position).',
      interval: 'Day 30 (Ebbinghaus Interval)'
    }
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);

  const currentCard = cards[currentIndex];

  const handleNext = (mastered: boolean) => {
    if (mastered) setMasteredCount(prev => prev + 1);
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % cards.length);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase">
              Ebbinghaus Spaced Repetition Engine
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-2">Interactive Flashcards Deck</h1>
            <p className="text-slate-600 text-sm md:text-base">Scientific memory retention review scheduled at Day 1, 3, 7, and 30 intervals.</p>
          </div>

          <Link href="/dashboard" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition">
            &larr; Back to Student Hub
          </Link>
        </div>

        {/* Progress & Deck Status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-base">
              <i className="fa-solid fa-layer-group"></i>
            </span>
            <div>
              <div className="font-bold text-slate-900 text-sm">Card {currentIndex + 1} of {cards.length}</div>
              <div className="text-xs text-slate-400 font-medium">{currentCard.interval}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400 font-semibold">MASTERED TODAY</div>
            <div className="text-base font-extrabold text-emerald-600">{masteredCount} Concept Cards</div>
          </div>
        </div>

        {/* Flip Flashcard Workspace */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="min-h-[320px] bg-slate-900 text-white p-8 md:p-12 rounded-3xl border-2 border-indigo-500/50 shadow-2xl flex flex-col justify-between cursor-pointer hover:border-indigo-400 transition relative overflow-hidden group select-none"
        >
          <div className="flex justify-between items-center text-xs text-slate-400 font-mono border-b border-slate-800 pb-3">
            <span className="text-indigo-400 font-bold uppercase">{currentCard.topic}</span>
            <span>Click Card to Flip <i className="fa-solid fa-rotate ms-1"></i></span>
          </div>

          <div className="py-6 text-center space-y-4">
            {!isFlipped ? (
              <div className="space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Question</div>
                <h2 className="text-xl md:text-2xl font-extrabold text-white leading-relaxed max-w-2xl mx-auto">
                  {currentCard.question}
                </h2>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in-up">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Master Concept Answer</div>
                <p className="text-base md:text-lg font-medium text-slate-200 leading-relaxed max-w-2xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
                  {currentCard.answer}
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-500 font-medium border-t border-slate-800 pt-3">
            {!isFlipped ? 'Click card to reveal answer' : 'Card Flipped &bull; Click again to see question'}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => handleNext(false)}
            className="px-6 py-3.5 bg-amber-500/20 text-amber-800 hover:bg-amber-500/30 border border-amber-300 font-bold text-sm rounded-xl transition flex items-center space-x-2"
          >
            <i className="fa-solid fa-rotate-left"></i>
            <span>Needs Review (Review Again Tomorrow)</span>
          </button>

          <button
            onClick={() => handleNext(true)}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <i className="fa-solid fa-circle-check"></i>
            <span>Mastered Concept (+15 XP) &rarr;</span>
          </button>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
