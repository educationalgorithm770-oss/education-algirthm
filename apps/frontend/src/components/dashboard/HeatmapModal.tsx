'use client';

import React, { useState } from 'react';

interface HeatmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
}

export default function HeatmapModal({ isOpen, onClose, currentStreak }: HeatmapModalProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: number; dateStr: string; lessons: number; minutes: number; xp: number } | null>(null);

  if (!isOpen) return null;

  // Generate 30 days of data leading up to today
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayOffset = 29 - i;
    const d = new Date();
    d.setDate(d.getDate() - dayOffset);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Active pattern matching current streak
    const isActive = dayOffset < currentStreak;
    const minutes = isActive ? 35 + ((i * 7) % 55) : 0;
    const lessons = isActive ? 1 + ((i % 3)) : 0;
    const xp = isActive ? 50 + (lessons * 40) : 0;
    const intensity = isActive ? Math.min(4, Math.max(1, Math.floor(minutes / 20))) : 0;

    return {
      day: i + 1,
      dateStr,
      isActive,
      minutes,
      lessons,
      xp,
      intensity, // 0 = none, 1 = low, 2 = med, 3 = high, 4 = max
    };
  });

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 1: return 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300';
      case 2: return 'bg-emerald-800/80 border-emerald-600/50 text-emerald-200';
      case 3: return 'bg-emerald-600 border-emerald-400 text-white';
      case 4: return 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-emerald-300 text-slate-950 font-black shadow-xs';
      default: return 'bg-slate-800/60 border-slate-700/40 text-slate-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 text-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <i className="fa-solid fa-chart-simple"></i>
              <span>Activity &amp; Study Matrix</span>
            </div>
            <h3 className="text-xl font-black tracking-tight">30-Day Learning Contributions</h3>
            <p className="text-xs text-slate-400">Track daily focus hours, video completions, and Code Arena submissions.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* 30-Day Grid */}
        <div className="space-y-2">
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {days.map((item) => (
              <div
                key={item.day}
                onMouseEnter={() => setHoveredCell(item)}
                onMouseLeave={() => setHoveredCell(null)}
                className={`h-11 sm:h-12 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition transform hover:scale-105 ${getCellColor(
                  item.intensity
                )}`}
              >
                <span className="text-[10px] font-bold opacity-80">{item.dateStr.split(' ')[1]}</span>
                <span className="text-xs mt-0.5">{item.isActive ? '🔥' : '•'}</span>
              </div>
            ))}
          </div>

          {/* Hover Status Box */}
          <div className="min-h-12 bg-slate-950/60 rounded-2xl border border-slate-800 p-3 flex items-center justify-between text-xs">
            {hoveredCell ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{hoveredCell.dateStr}:</span>
                  <span className="text-emerald-400 font-bold">{hoveredCell.minutes} mins studied</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-indigo-300">{hoveredCell.lessons} lessons completed</span>
                </div>
                <div className="font-black text-amber-400">+{hoveredCell.xp} XP</div>
              </>
            ) : (
              <div className="text-slate-400 text-xs flex items-center gap-1.5">
                <i className="fa-regular fa-hand-pointer text-slate-500"></i>
                <span>Hover over any calendar cell to view daily focus stats.</span>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span>Less</span>
            <div className="flex items-center space-x-1">
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-800 border border-slate-700"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-950 border border-emerald-800"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-800 border border-emerald-600"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600 border border-emerald-400"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 border border-emerald-300"></div>
            </div>
            <span>More Active</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
}
