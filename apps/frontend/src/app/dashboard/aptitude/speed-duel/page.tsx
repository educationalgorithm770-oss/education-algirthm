'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import AlgoBotMascot from '@/components/aptitude/AlgoBotMascot';
import ConfettiBurst from '@/components/aptitude/ConfettiBurst';
import { sounds } from '@/components/aptitude/SoundManager';

interface Question {
  id: number;
  title: string;
  questionText: string;
  options: Array<{ id: string; text: string }>;
  correctOption: string;
  shortcutTrick: string;
}

export default function SpeedDuelArenaPage() {
  const [gameState, setGameState] = useState<'LOBBY' | 'DUELING' | 'GAMEOVER'>('LOBBY');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [playerScore, setPlayerScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameResult, setGameResult] = useState<{ xp: number; gems: number } | null>(null);

  useEffect(() => {
    async function loadDuelQuestions() {
      try {
        const res = await fetch('/api/aptitude/questions?mode=SPEED_DUEL&limit=5');
        const data = await res.json();
        if (data.success && data.questions?.length > 0) {
          setQuestions(data.questions);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadDuelQuestions();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (gameState !== 'DUELING') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endDuel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Simulated AlgoBot AI opponent score progression
    const botInterval = setInterval(() => {
      if (Math.random() > 0.4) {
        setBotScore(prev => prev + 20);
      }
    }, 9000);

    return () => {
      clearInterval(timer);
      clearInterval(botInterval);
    };
  }, [gameState]);

  const startDuel = () => {
    if (questions.length === 0) return;
    sounds.playClick();
    setGameState('DUELING');
    setTimeLeft(60);
    setPlayerScore(0);
    setBotScore(0);
    setCombo(1);
    setCurrentIndex(0);
    setSelectedOption(null);
    setFeedback(null);
  };

  const currentQ = questions[currentIndex];

  const handleSelect = (optId: string) => {
    if (feedback !== null) return;
    setSelectedOption(optId);

    const isCorrect = optId.toUpperCase() === currentQ.correctOption.toUpperCase();
    if (isCorrect) {
      sounds.playCorrect();
      setFeedback('CORRECT');
      const gained = Math.round(20 * combo);
      setPlayerScore(prev => prev + gained);
      setCombo(prev => Math.min(3, prev + 0.5));
    } else {
      sounds.playWrong();
      setFeedback('WRONG');
      setCombo(1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        endDuel();
      }
    }, 1000);
  };

  const endDuel = async () => {
    setGameState('GAMEOVER');
    sounds.playLevelUp();
    setShowConfetti(true);

    // Submit attempt for speed duel
    try {
      const res = await fetch('/api/aptitude/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'SPEED_DUEL',
          submissions: questions.map((q, idx) => ({
            questionId: q.id,
            selectedOption: idx <= currentIndex ? (selectedOption || 'A') : 'A',
            timeSpentSeconds: 12
          })),
          totalTimeSeconds: 60 - timeLeft
        })
      });
      const data = await res.json();
      if (data.success) {
        setGameResult({
          xp: data.results.xpEarned || 80,
          gems: data.results.gemsEarned || 10
        });
      }
    } catch (e) {
      setGameResult({ xp: 60, gems: 5 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-purple-600 selection:text-white pb-12 font-sans">
      <StudentNavbar />
      <ConfettiBurst active={showConfetti} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Lobby State */}
        {gameState === 'LOBBY' && (
          <div className="bg-white border border-purple-100 rounded-2xl sm:rounded-3xl p-4 sm:p-12 text-center shadow-md space-y-6 sm:space-y-8 animate-fade-in">
            <div className="max-w-md mx-auto space-y-3 sm:space-y-4">
              <AlgoBotMascot mood="NINJA" customQuote="60 seconds on the clock! Show me that lightning mental speed!" size="lg" className="justify-center" />
              
              <div className="inline-flex items-center space-x-2 px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <i className="fa-solid fa-bolt text-purple-600"></i>
                <span>60-Second Challenge</span>
              </div>
              <h1 className="text-xl sm:text-4xl font-black text-slate-900">
                1v1 Speed Duel Arena ⚔️
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Test your Vedic calculation reflexes against AlgoBot AI. Solve 5 rapid math & logic puzzles before the 60s countdown hits zero!
              </p>
            </div>

            {/* Duel Rules Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-xl mx-auto text-left">
              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
                <div className="text-purple-700 font-extrabold text-xs">⏱️ 60s Global Clock</div>
                <p className="text-[11px] text-slate-500">Answer as fast as possible to build combo multipliers.</p>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
                <div className="text-amber-700 font-extrabold text-xs">🔥 Combo Streak</div>
                <p className="text-[11px] text-slate-500">Chain correct answers for up to 3x Score & XP multipliers.</p>
              </div>
              <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-1">
                <div className="text-pink-700 font-extrabold text-xs">💎 Brain Gems</div>
                <p className="text-[11px] text-slate-500">Win the duel to take home exclusive Brain Gems.</p>
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-2">
              <button
                onClick={startDuel}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-600/25 hover:scale-105 active:scale-95 transition flex items-center justify-center space-x-2.5 sm:space-x-3 mx-auto"
              >
                <i className="fa-solid fa-swords text-sm sm:text-base"></i>
                <span>Start Speed Duel Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Dueling Active Game State */}
        {gameState === 'DUELING' && currentQ && (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Top Score HUD */}
            <div className="bg-white border border-slate-200/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xs flex items-center justify-between gap-2 sm:gap-4">
              {/* Player Score */}
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                  YOU
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">Your Score</div>
                  <div className="text-sm sm:text-lg font-black text-indigo-600 truncate">{playerScore} pts</div>
                </div>
              </div>

              {/* Timer Bar */}
              <div className="flex flex-col items-center shrink-0 px-2">
                <span className={`text-base sm:text-xl font-black font-mono ${timeLeft <= 15 ? 'text-red-500 animate-ping' : 'text-amber-600'}`}>
                  {timeLeft}s
                </span>
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-bold">Timer</span>
              </div>

              {/* AlgoBot Score */}
              <div className="flex items-center space-x-2 sm:space-x-3 text-right min-w-0">
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 truncate">AlgoBot AI</div>
                  <div className="text-sm sm:text-lg font-black text-purple-600 truncate">{botScore} pts</div>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-black text-xs sm:text-sm shrink-0">
                  <i className="fa-solid fa-robot"></i>
                </div>
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] sm:text-xs font-black uppercase text-indigo-600">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] sm:text-xs font-black">
                  Combo: {combo}x 🔥
                </span>
              </div>

              <div className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQ.questionText}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                {currentQ.options.map((opt) => {
                  let style = 'bg-slate-50 hover:bg-purple-50/40 border-slate-200 text-slate-800 hover:border-purple-300';
                  if (feedback) {
                    if (opt.id === currentQ.correctOption) {
                      style = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20';
                    } else if (selectedOption === opt.id) {
                      style = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20';
                    } else {
                      style = 'bg-slate-50 border-slate-200 opacity-40';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelect(opt.id)}
                      disabled={feedback !== null}
                      className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left font-medium text-xs sm:text-sm transition flex items-center space-x-3 ${style}`}
                    >
                      <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-black text-xs flex items-center justify-center shrink-0 border bg-white text-slate-700 border-slate-200">
                        {opt.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Summary State */}
        {gameState === 'GAMEOVER' && (
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-10 text-center shadow-xl space-y-8 animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-4">
              <AlgoBotMascot
                mood={playerScore >= botScore ? 'CELEBRATING' : 'HAPPY'}
                customQuote={playerScore >= botScore ? 'VICTORY! You outcalculated the AI!' : 'Good fight! You gained swift reflexes!'}
                size="lg"
                className="justify-center"
              />

              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                <i className="fa-solid fa-trophy"></i>
                <span>Duel Finished</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                {playerScore >= botScore ? '🎉 Victory! Arena Champion!' : '⚡ Duel Complete! Well Fought!'}
              </h2>
            </div>

            {/* Score HUD */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">Your Score</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">{playerScore}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">AlgoBot AI</div>
                <div className="text-2xl font-black text-purple-600 mt-1">{botScore}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">XP Awarded</div>
                <div className="text-2xl font-black text-amber-600 mt-1">+{gameResult?.xp || 60} ⚡</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">Brain Gems</div>
                <div className="text-2xl font-black text-pink-600 mt-1">+{gameResult?.gems || 5} 💎</div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <button
                onClick={startDuel}
                className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-purple-600/20 flex items-center space-x-2"
              >
                <i className="fa-solid fa-rotate-right"></i>
                <span>Play Another Duel</span>
              </button>
              <Link
                href="/dashboard/aptitude"
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider transition flex items-center space-x-2 border border-slate-200"
              >
                <i className="fa-solid fa-house"></i>
                <span>Back to Arena</span>
              </Link>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
