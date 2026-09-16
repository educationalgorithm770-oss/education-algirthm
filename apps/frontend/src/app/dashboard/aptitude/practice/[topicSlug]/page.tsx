'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/layout/StudentNavbar';
import AlgoBotMascot, { MascotMood } from '@/components/aptitude/AlgoBotMascot';
import OnScreenCalculator from '@/components/aptitude/OnScreenCalculator';
import ScratchPad from '@/components/aptitude/ScratchPad';
import ConfettiBurst from '@/components/aptitude/ConfettiBurst';
import AnimatedStepExplainer from '@/components/aptitude/AnimatedStepExplainer';
import PercentageSlicer from '@/components/aptitude/visualizers/PercentageSlicer';
import ProfitLossScale from '@/components/aptitude/visualizers/ProfitLossScale';
import RelativeSpeedTrack from '@/components/aptitude/visualizers/RelativeSpeedTrack';
import WorkTankFlow from '@/components/aptitude/visualizers/WorkTankFlow';
import SyllogismVennBubble from '@/components/aptitude/visualizers/SyllogismVennBubble';
import SeatingCouncilTable from '@/components/aptitude/visualizers/SeatingCouncilTable';
import ClockAngleCompass from '@/components/aptitude/visualizers/ClockAngleCompass';
import { sounds } from '@/components/aptitude/SoundManager';

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: number;
  topicId: number;
  topicTitle: string;
  topicSlug: string;
  category: string;
  title: string;
  storyHook: string;
  questionText: string;
  options: QuestionOption[];
  correctOption: string;
  difficulty: string;
  tags: string[];
  shortcutTrick: string;
  detailedSolution: string;
  timeLimitSeconds: number;
  xpReward: number;
}

export default function AptitudePracticePage() {
  const params = useParams();
  const router = useRouter();
  const topicSlug = params?.topicSlug as string;

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answersLog, setAnswersLog] = useState<Array<{ questionId: number; selectedOption: string; isCorrect: boolean }>>([]);
  
  // Mascot state
  const [mascotMood, setMascotMood] = useState<MascotMood>('HAPPY');
  const [mascotQuote, setMascotQuote] = useState<string | undefined>(undefined);

  // Tools & Modals
  const [showCalculator, setShowCalculator] = useState(false);
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showVisualLab, setShowVisualLab] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // AI Shortcut & Socratic Hint Drawer
  const [aiShortcutText, setAiShortcutText] = useState<string | null>(null);
  const [socraticHint, setSocraticHint] = useState<{ level: number; text: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGeneratingAIQuestions, setIsGeneratingAIQuestions] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');

  // Session summary
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    async function loadQuestions() {
      if (!topicSlug) return;
      try {
        const diffQuery = selectedDifficulty !== 'ALL' ? `&difficulty=${selectedDifficulty}` : '';
        const res = await fetch(`/api/aptitude/questions?topicSlug=${topicSlug}&limit=20${diffQuery}`);
        const data = await res.json();
        if (data.success && data.questions?.length > 0) {
          setQuestions(data.questions);
          setCurrentIndex(0);
          setSelectedOption(null);
          setIsAnswered(false);
        }
      } catch (e) {
        console.error('Failed to load questions:', e);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [topicSlug, selectedDifficulty]);

  const handleGenerateMoreAIQuestions = async () => {
    if (isGeneratingAIQuestions || !topicSlug) return;
    setIsGeneratingAIQuestions(true);
    sounds.playClick();
    setMascotMood('THINKING');
    setMascotQuote('AlgoBot AI is architecting 5 fresh, company-grade questions on this topic...');

    try {
      const res = await fetch('/api/ai/aptitude-generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicSlug,
          difficulty: selectedDifficulty === 'ALL' ? 'MEDIUM' : selectedDifficulty,
          count: 5
        })
      });
      const data = await res.json();
      if (data.success) {
        sounds.playLevelUp();
        setShowConfetti(true);
        setMascotMood('CELEBRATING');
        setMascotQuote('5 brand new questions generated and added to the drill! Let\'s solve them!');
        
        // Reload questions
        const refRes = await fetch(`/api/aptitude/questions?topicSlug=${topicSlug}&limit=30`);
        const refData = await refRes.json();
        if (refData.success && refData.questions?.length > 0) {
          setQuestions(refData.questions);
        }
      } else {
        alert(data.message || 'Could not generate questions at this moment.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to connect to AI Question Generator.');
    } finally {
      setIsGeneratingAIQuestions(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setSelectedOption(optId);
    setIsAnswered(true);

    const isCorrect = optId.toUpperCase() === currentQ.correctOption.toUpperCase();
    if (isCorrect) {
      sounds.playCorrect();
      setShowConfetti(true);
      setMascotMood('EXCITED');
      setMascotQuote('BOOM! Spot on! You unlocked the fast solution! ⚡');
    } else {
      sounds.playWrong();
      setMascotMood('SAD');
      setMascotQuote('Oops! A tiny miscalculation. Check the 10-second shortcut below!');
    }

    setAnswersLog(prev => [
      ...prev,
      { questionId: currentQ.id, selectedOption: optId, isCorrect }
    ]);
  };

  const handleAskSocraticHint = async (level: number) => {
    if (!currentQ || aiLoading) return;
    setAiLoading(true);
    sounds.playClick();
    setMascotMood('THINKING');
    setMascotQuote(`AlgoBot AI is preparing Socratic Hint Level ${level}...`);

    try {
      const res = await fetch('/api/ai/aptitude-socratic-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          topicTitle: currentQ.topicTitle,
          hintLevel: level
        })
      });
      const data = await res.json();
      if (data.success && data.hint) {
        setSocraticHint({ level, text: data.hint });
        setMascotMood('HAPPY');
        setMascotQuote('Here is your Socratic clue! Connect the pieces yourself! 🧩');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAskAlgoBotAi = async () => {
    if (!currentQ || aiLoading) return;
    setAiLoading(true);
    setAiShortcutText(null);
    sounds.playClick();
    setMascotMood('THINKING');
    setMascotQuote('AlgoBot AI is computing the 10-second mental math formula...');

    try {
      const res = await fetch('/api/ai/aptitude-shortcut', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          topic: currentQ.topicTitle
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiShortcutText(data.reply);
        setMascotMood('NINJA');
        setMascotQuote('Here is the secret shortcut! Read and memorize this trick!');
      } else {
        setAiShortcutText('Could not generate shortcut trick.');
      }
    } catch (e) {
      setAiShortcutText('Failed to reach AI shortcut generator.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNext = async () => {
    sounds.playClick();
    setAiShortcutText(null);
    setSocraticHint(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setMascotMood('HAPPY');
      setMascotQuote(undefined);
    } else {
      await finishDrill();
    }
  };

  const finishDrill = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/aptitude/submit-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: currentQ.topicId,
          mode: 'PRACTICE',
          submissions: answersLog.map(a => ({
            questionId: a.questionId,
            selectedOption: a.selectedOption,
            timeSpentSeconds: 30
          })),
          totalTimeSeconds: answersLog.length * 30
        })
      });
      const data = await res.json();
      if (data.success) {
        setSummaryData(data.results);
        setDrillCompleted(true);
        sounds.playLevelUp();
        setShowConfetti(true);
        setMascotMood('CELEBRATING');
        setMascotQuote('Drill conquered! Amazing job leveling up your cognitive skills!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to choose interactive visual lab based on topic
  const renderTopicVisualizer = () => {
    if (topicSlug.includes('percent') || topicSlug.includes('fraction')) {
      return <PercentageSlicer />;
    }
    if (topicSlug.includes('profit') || topicSlug.includes('interest')) {
      return <ProfitLossScale />;
    }
    if (topicSlug.includes('speed') || topicSlug.includes('distance')) {
      return <RelativeSpeedTrack />;
    }
    if (topicSlug.includes('work') || topicSlug.includes('pipes') || topicSlug.includes('mixture')) {
      return <WorkTankFlow />;
    }
    if (topicSlug.includes('syllogism') || topicSlug.includes('deduction')) {
      return <SyllogismVennBubble />;
    }
    if (topicSlug.includes('seating') || topicSlug.includes('puzzle')) {
      return <SeatingCouncilTable />;
    }
    if (topicSlug.includes('clock') || topicSlug.includes('direction')) {
      return <ClockAngleCompass />;
    }
    return <PercentageSlicer />;
  };

  // Generate step data from detailed solution string
  const getDerivedSteps = () => {
    if (!currentQ?.detailedSolution) return [];
    const lines = currentQ.detailedSolution.split('\n').filter(l => l.trim().length > 0);
    return lines.map((l, i) => ({
      title: `Step ${i + 1}`,
      description: l,
      formula: l.includes('=') ? l.substring(l.indexOf('=')) : undefined
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <StudentNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Setting up interactive practice lab...</p>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <StudentNavbar />
        <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center text-center p-6 space-y-4">
          <i className="fa-solid fa-file-circle-question text-4xl text-slate-400"></i>
          <h2 className="text-xl font-bold text-slate-900">No questions found for this topic</h2>
          <p className="text-sm text-slate-500">Check back shortly as new questions are added daily.</p>
          <Link href="/dashboard/aptitude" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase transition">
            Return to Arena
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white pb-16 font-sans">
      <StudentNavbar />
      <ConfettiBurst active={showConfetti} />

      {/* Floating Tools */}
      {showCalculator && <OnScreenCalculator onClose={() => setShowCalculator(false)} />}
      {showScratchpad && <ScratchPad onClose={() => setShowScratchpad(false)} />}

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6">
        
        {/* Top Breadcrumb & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200/90 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <Link
              href="/dashboard/aptitude"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition text-xs sm:text-sm shrink-0"
              title="Return to Aptitude Hub"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 truncate">
                {currentQ.category}
              </div>
              <h1 className="text-xs sm:text-base font-black text-slate-900 truncate">
                {currentQ.topicTitle}
              </h1>
            </div>
          </div>

          {/* Quick Helper Tool Buttons */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 justify-between sm:justify-end">
            <button
              onClick={() => { setShowVisualLab(!showVisualLab); sounds.playClick(); }}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                showVisualLab
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-gamepad text-amber-600"></i>
              <span>{showVisualLab ? 'Hide Lab' : 'Motion Lab'}</span>
            </button>

            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                showCalculator
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-calculator text-emerald-600"></i>
              <span>Calc</span>
            </button>

            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold border transition flex items-center justify-center space-x-1 sm:space-x-1.5 ${
                showScratchpad
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <i className="fa-solid fa-pen-ruler text-purple-600"></i>
              <span>Pad</span>
            </button>
          </div>
        </div>

        {/* Practice Control HUD: Difficulty Filter & AI Infinite Question Generator */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-white border border-slate-200/90 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-xs">
          {/* Difficulty Filter Pills */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase text-slate-400 me-0.5 shrink-0">Difficulty:</span>
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map(diff => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold transition border shrink-0 ${
                  selectedDifficulty === diff
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* AI Infinite Generator Button */}
          <button
            onClick={handleGenerateMoreAIQuestions}
            disabled={isGeneratingAIQuestions}
            className="w-full sm:w-auto px-3.5 sm:px-4 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-[11px] sm:text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-1.5 sm:space-x-2 shrink-0"
          >
            <i className={`fa-solid ${isGeneratingAIQuestions ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles text-amber-300'}`}></i>
            <span>{isGeneratingAIQuestions ? 'Generating...' : '+ 5 AI Questions'}</span>
          </button>
        </div>

        {/* Collapsible Motion Visualizer Concept Playground */}
        {showVisualLab && (
          <div className="animate-fade-in-up">
            {renderTopicVisualizer()}
          </div>
        )}

        {/* Drill Completion Summary Card */}
        {drillCompleted && summaryData ? (
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 text-center animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-4">
              <AlgoBotMascot mood={mascotMood} customQuote={mascotQuote} size="lg" className="justify-center" />
              
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                <i className="fa-solid fa-award"></i>
                <span>Drill Complete</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Practice Session Mastered!
              </h2>
            </div>

            {/* Score Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">Accuracy</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{summaryData.scorePercentage}%</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">Correct</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{summaryData.correctCount} / {summaryData.totalQuestions}</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">XP Gained</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">+{summaryData.xpEarned} ⚡</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-xs text-slate-500 font-bold">Brain Gems</div>
                <div className="text-2xl font-black text-pink-600 mt-1">+{summaryData.gemsEarned} 💎</div>
              </div>
            </div>

            {/* Return Action */}
            <div className="flex items-center justify-center space-x-4 pt-4">
              <Link
                href="/dashboard/aptitude/roadmap"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-indigo-600/20 flex items-center space-x-2"
              >
                <span>Continue on 30-Day Roadmap</span>
                <i className="fa-solid fa-route"></i>
              </Link>
            </div>
          </div>
        ) : (
          /* Active Question Card */
          <div className="space-y-4 sm:space-y-6">
            {/* Mascot Cheer Header */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xs">
              <AlgoBotMascot mood={mascotMood} customQuote={mascotQuote} size="sm" />
            </div>

            {/* Question Box */}
            <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
              
              {/* Question Header & Socratic Hint Triggers */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-3.5 sm:pb-4">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] sm:text-xs font-black uppercase">
                    Q{currentIndex + 1} of {questions.length}
                  </span>
                  <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold uppercase ${
                    currentQ.difficulty === 'EASY'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : currentQ.difficulty === 'HARD'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                {/* Socratic Hint Level Buttons */}
                {!isAnswered && (
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">Clues:</span>
                    <button
                      onClick={() => handleAskSocraticHint(1)}
                      disabled={aiLoading}
                      className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-[10px] sm:text-[11px] font-bold transition flex items-center space-x-1"
                      title="Hint 1: Intuition Spark"
                    >
                      <i className="fa-solid fa-lightbulb text-amber-500"></i>
                      <span>Hint 1</span>
                    </button>
                    <button
                      onClick={() => handleAskSocraticHint(2)}
                      disabled={aiLoading}
                      className="px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] sm:text-[11px] font-bold transition flex items-center space-x-1"
                      title="Hint 2: Formula Anchor"
                    >
                      <i className="fa-solid fa-key text-indigo-500"></i>
                      <span>Hint 2</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Socratic Hint Drawer */}
              {socraticHint && !isAnswered && (
                <div className="p-3.5 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-amber-950 space-y-1.5 animate-fade-in">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-700 flex items-center space-x-1.5">
                    <i className="fa-solid fa-lightbulb text-amber-500"></i>
                    <span>Socratic Hint (Level {socraticHint.level})</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed font-medium">
                    {socraticHint.text}
                  </div>
                </div>
              )}

              {/* Story / Meme Setup Hook */}
              {currentQ.storyHook && (
                <div className="p-3 sm:p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium text-indigo-900 leading-relaxed flex items-center space-x-2.5 sm:space-x-3">
                  <span className="text-lg sm:text-xl shrink-0">💡</span>
                  <span>{currentQ.storyHook}</span>
                </div>
              )}

              {/* Main Question Text */}
              <div className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-relaxed whitespace-pre-line">
                {currentQ.questionText}
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                {currentQ.options.map((opt) => {
                  let optStyle = 'bg-slate-50 hover:bg-indigo-50/40 border-slate-200 text-slate-800 hover:border-indigo-300';
                  if (isAnswered) {
                    if (opt.id === currentQ.correctOption) {
                      optStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20';
                    } else if (selectedOption === opt.id) {
                      optStyle = 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20';
                    } else {
                      optStyle = 'bg-slate-50 border-slate-200 opacity-40';
                    }
                  } else if (selectedOption === opt.id) {
                    optStyle = 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20';
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isAnswered}
                      className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-3 ${optStyle}`}
                    >
                      <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                        isAnswered && opt.id === currentQ.correctOption
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isAnswered && selectedOption === opt.id
                          ? 'bg-rose-600 text-white border-rose-600'
                          : selectedOption === opt.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}>
                        {opt.id}
                      </span>
                      <span className="flex-1 font-semibold break-words">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Instant Solution & 10s Shortcut Explainer Box */}
              {isAnswered && (
                <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
                  
                  {/* 10s Shortcut Trick Box */}
                  <div className="p-3.5 sm:p-5 bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-50/60 border border-amber-200 rounded-xl sm:rounded-2xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-800 flex items-center space-x-1.5">
                        <i className="fa-solid fa-bolt text-amber-500"></i>
                        <span>10-Second Mental Math Shortcut</span>
                      </div>
                      
                      {/* Ask AlgoBot AI Button */}
                      <button
                        onClick={handleAskAlgoBotAi}
                        disabled={aiLoading}
                        className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold transition flex items-center justify-center space-x-1.5"
                      >
                        <i className={`fa-solid ${aiLoading ? 'fa-spinner animate-spin' : 'fa-robot'} text-indigo-600`}></i>
                        <span>{aiLoading ? 'Thinking...' : 'Ask AlgoBot AI'}</span>
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed whitespace-pre-line pt-1">
                      {currentQ.shortcutTrick}
                    </p>
                  </div>

                  {/* AI Generated Shortcut Drawer */}
                  {aiShortcutText && (
                    <div className="p-3.5 sm:p-5 bg-indigo-50/80 border border-indigo-200 rounded-xl sm:rounded-2xl text-xs sm:text-sm text-slate-800 space-y-2.5 sm:space-y-3 animate-fade-in-up">
                      <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-700 flex items-center space-x-2">
                        <i className="fa-solid fa-sparkles text-amber-500"></i>
                        <span>AlgoBot AI Mental Math Breakdown</span>
                      </div>
                      <div className="prose prose-slate max-w-none text-xs sm:text-sm whitespace-pre-line leading-relaxed text-slate-700">
                        {aiShortcutText}
                      </div>
                    </div>
                  )}

                  {/* Animated Step-by-Step Derivation Timeline */}
                  <div className="space-y-2">
                    <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                      <i className="fa-solid fa-stairs text-indigo-600"></i>
                      <span>Interactive Step Derivation Slider</span>
                    </div>
                    <AnimatedStepExplainer
                      steps={getDerivedSteps()}
                      finalAnswer={`Option (${currentQ.correctOption})`}
                    />
                  </div>

                  {/* Next Question CTA */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleNext}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2"
                    >
                      <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Drill & Claim XP'}</span>
                      <i className="fa-solid fa-arrow-right text-[10px]"></i>
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
