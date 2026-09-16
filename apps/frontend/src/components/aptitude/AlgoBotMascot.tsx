'use client';

import React, { useState, useEffect } from 'react';

export type MascotMood = 'HAPPY' | 'EXCITED' | 'THINKING' | 'SAD' | 'NINJA' | 'CELEBRATING';

interface AlgoBotMascotProps {
  mood?: MascotMood;
  customQuote?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DEFAULT_QUOTES: Record<MascotMood, string[]> = {
  HAPPY: [
    "Ready to solve some rapid brain teasers today?",
    "Every shortcut you learn saves you 45 seconds in the real exam!",
    "Math is just a puzzle with clear rules. Let's crack it!",
    "Brain cells warming up nicely!"
  ],
  EXCITED: [
    "BOOM! You're on fire today! 🔥",
    "Calculated to perfection! Pure genius!",
    "TCS NQT selectors would applaud this speed!",
    "Streak multiplier active! Keep rolling!"
  ],
  THINKING: [
    "Hmm... Try looking for the LCM or unit trick!",
    "Eliminate the two obviously ridiculous options first.",
    "Is there a reciprocal fraction hidden here?",
    "Take a breath! You know this concept."
  ],
  SAD: [
    "Ah, a tricky trap! Don't worry, see the 10s shortcut below.",
    "Mistakes are just data points on the path to 100% accuracy.",
    "Reset and attack the next one with full focus!",
    "Even Ramanujan had rough scratch drafts!"
  ],
  NINJA: [
    "⚡ 10-Second Mental Math Mode Activated!",
    "Vedic speed unlocked. No pen, no paper needed!",
    "Speed duelist in the arena! Slay the timer!",
    "Fast and furious problem solving!"
  ],
  CELEBRATING: [
    "🎉 LEGENDARY RUN! You totally crushed this set!",
    "Brain gems and XP raining from the sky! 💎",
    "Company OA level: MASTERED!",
    "AlgoBot is dancing for your victory!"
  ]
};

export default function AlgoBotMascot({
  mood = 'HAPPY',
  customQuote,
  size = 'md',
  className = ''
}: AlgoBotMascotProps) {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    if (customQuote) {
      setQuote(customQuote);
    } else {
      const list = DEFAULT_QUOTES[mood] || DEFAULT_QUOTES.HAPPY;
      setQuote(list[Math.floor(Math.random() * list.length)]);
    }
  }, [mood, customQuote]);

  const sizeClasses = {
    sm: 'w-12 h-12 sm:w-16 sm:h-16',
    md: 'w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24',
    lg: 'w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32'
  };

  return (
    <div className={`flex items-center space-x-2.5 sm:space-x-4 w-full min-w-0 ${className}`}>
      {/* Animated SVG Robot Character */}
      <div className={`relative ${sizeClasses[size]} shrink-0 transition-transform duration-300 hover:scale-105 select-none`}>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Glowing Aura */}
          <circle cx="60" cy="60" r="50" fill={mood === 'EXCITED' || mood === 'CELEBRATING' ? '#4F46E5' : '#312E81'} opacity="0.3" className="animate-pulse" />
          
          {/* Antenna */}
          <line x1="60" y1="18" x2="60" y2="30" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="60" cy="14" r="6" fill={mood === 'NINJA' ? '#F59E0B' : '#6366F1'} className="animate-ping opacity-75" />
          <circle cx="60" cy="14" r="5" fill={mood === 'NINJA' ? '#F59E0B' : '#818CF8'} />

          {/* Ears */}
          <rect x="18" y="48" width="8" height="20" rx="4" fill="#4338CA" />
          <rect x="94" y="48" width="8" height="20" rx="4" fill="#4338CA" />

          {/* Robot Head */}
          <rect x="24" y="30" width="72" height="60" rx="18" fill="#1E1B4B" stroke="#6366F1" strokeWidth="3" />

          {/* Screen Visor */}
          <rect x="32" y="42" width="56" height="34" rx="10" fill="#0F172A" stroke="#3730A3" strokeWidth="1.5" />

          {/* Eyes based on Mood */}
          {mood === 'HAPPY' && (
            <>
              <path d="M42 56 Q48 50 54 56" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M66 56 Q72 50 78 56" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {mood === 'EXCITED' && (
            <>
              <circle cx="48" cy="58" r="6" fill="#FBBF24" />
              <circle cx="72" cy="58" r="6" fill="#FBBF24" />
              <circle cx="46" cy="56" r="2" fill="#FFFFFF" />
              <circle cx="70" cy="56" r="2" fill="#FFFFFF" />
            </>
          )}

          {mood === 'THINKING' && (
            <>
              <circle cx="48" cy="54" r="5" fill="#38BDF8" />
              <path d="M66 58 Q72 54 78 58" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Question bubble */}
              <circle cx="86" cy="32" r="3" fill="#38BDF8" opacity="0.6" />
              <circle cx="94" cy="24" r="5" fill="#38BDF8" opacity="0.8" />
            </>
          )}

          {mood === 'SAD' && (
            <>
              <path d="M42 58 Q48 64 54 58" stroke="#F87171" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M66 58 Q72 64 78 58" stroke="#F87171" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {mood === 'NINJA' && (
            <>
              {/* Ninja Headband */}
              <rect x="24" y="34" width="72" height="12" rx="4" fill="#EF4444" />
              <circle cx="60" cy="40" r="3" fill="#FBBF24" />
              <line x1="42" y1="58" x2="54" y2="54" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="66" y1="54" x2="78" y2="58" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}

          {mood === 'CELEBRATING' && (
            <>
              {/* Party Hat */}
              <polygon points="60,6 46,28 74,28" fill="#EC4899" />
              <circle cx="60" cy="6" r="4" fill="#FBBF24" />
              <circle cx="48" cy="56" r="5" fill="#EC4899" />
              <circle cx="72" cy="56" r="5" fill="#EC4899" />
              <path d="M50 68 Q60 76 70 68" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* Cheeks Blush */}
          {(mood === 'HAPPY' || mood === 'EXCITED' || mood === 'CELEBRATING') && (
            <>
              <ellipse cx="38" cy="66" rx="4" ry="2" fill="#F472B6" opacity="0.6" />
              <ellipse cx="82" cy="66" rx="4" ry="2" fill="#F472B6" opacity="0.6" />
            </>
          )}

          {/* Mouth */}
          {mood !== 'CELEBRATING' && mood !== 'SAD' && (
            <path d="M52 68 Q60 74 68 68" stroke="#818CF8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          {mood === 'SAD' && (
            <path d="M52 72 Q60 67 68 72" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}

          {/* Body neck */}
          <rect x="52" y="90" width="16" height="8" rx="2" fill="#4338CA" />
          <rect x="40" y="98" width="40" height="16" rx="6" fill="#1E1B4B" stroke="#6366F1" strokeWidth="2" />
          {/* Medal/Core Light */}
          <circle cx="60" cy="106" r="4" fill="#10B981" className="animate-pulse" />
        </svg>
      </div>

      {/* Speech Dialogue Bubble */}
      <div className="relative bg-white border border-indigo-100/90 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-xs flex-1 min-w-0">
        <div className="text-[10px] sm:text-[11px] font-extrabold text-indigo-600 tracking-wider uppercase mb-0.5 sm:mb-1 flex items-center space-x-1.5 truncate">
          <i className="fa-solid fa-sparkles text-amber-500 text-[10px] sm:text-xs"></i>
          <span>AlgoBot AI Companion</span>
        </div>
        <p className="text-[11px] sm:text-xs md:text-sm font-medium text-slate-700 leading-snug sm:leading-relaxed italic break-words">
          &ldquo;{quote}&rdquo;
        </p>
        {/* Chat pointer triangle */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 sm:border-t-6 border-t-transparent border-b-4 sm:border-b-6 border-b-transparent border-r-6 sm:border-r-8 border-r-indigo-100"></div>
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-3 sm:border-t-5 border-t-transparent border-b-3 sm:border-b-5 border-b-transparent border-r-5 sm:border-r-7 border-r-white"></div>
      </div>
    </div>
  );
}
