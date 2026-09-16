'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function PercentageSlicer() {
  const [percentage, setPercentage] = useState<number>(37.5);

  const presets = [
    { label: '1/2', val: 50, desc: '50% (Half)' },
    { label: '1/3', val: 33.33, desc: '33.33% (One Third)' },
    { label: '1/4', val: 25, desc: '25% (Quarter)' },
    { label: '1/6', val: 16.66, desc: '16.66% (1/6 Fraction)' },
    { label: '1/7', val: 14.28, desc: '14.28% (Vedic 1/7)' },
    { label: '3/8', val: 37.5, desc: '37.5% (3 * 1/8)' },
    { label: '1/9', val: 11.11, desc: '11.11% (1/9 Periodic)' },
    { label: '1/11', val: 9.09, desc: '9.09% (1/11 Periodic)' }
  ];

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPercentage(parseFloat(e.target.value));
  };

  const angle = (percentage / 100) * 360;
  const rad = (angle * Math.PI) / 180;
  const x = 100 + 80 * Math.sin(rad);
  const y = 100 - 80 * Math.cos(rad);
  const largeArcFlag = percentage > 50 ? 1 : 0;
  const pathData = percentage >= 100
    ? 'M100,20 A80,80 0 1,1 99.9,20 Z'
    : `M100,100 L100,20 A80,80 0 ${largeArcFlag},1 ${x},${y} Z`;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-pizza-slice"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Visual Percentage & Reciprocal Slicer</h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">No-Pen Fraction Intuition</span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-black text-sm">
          {percentage.toFixed(1)}%
        </span>
      </div>

      {/* Main Graphic Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* SVG Pie Slicer Graphic */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
            {/* Background Full Circle */}
            <circle cx="100" cy="100" r="80" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="6" />
            
            {/* Active Slice */}
            {percentage > 0 && (
              <path
                d={pathData}
                fill="url(#emeraldGradient)"
                stroke="#10B981"
                strokeWidth="2"
                className="transition-all duration-200"
              />
            )}

            <defs>
              <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>

            {/* Center Hub Indicator */}
            <circle cx="100" cy="100" r="14" fill="#ECFDF5" stroke="#10B981" strokeWidth="3" />
          </svg>
        </div>

        {/* Live Fraction Equivalents Grid */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Decimal Equivalent:</span>
              <span className="font-mono font-bold text-slate-900">{(percentage / 100).toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Angle in Pie Chart (360°):</span>
              <span className="font-mono font-bold text-amber-700">{(percentage * 3.6).toFixed(1)}°</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Vedic Reciprocal Fraction:</span>
              <span className="font-mono font-extrabold text-emerald-700">
                {percentage === 50 ? '1/2' : percentage === 25 ? '1/4' : percentage === 37.5 ? '3/8' : percentage === 33.33 ? '1/3' : percentage === 12.5 ? '1/8' : percentage === 14.28 ? '1/7' : `≈ ${(percentage / 100).toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Slider Control */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>0%</span>
              <span className="text-emerald-600 font-bold">Drag to Slice</span>
              <span>100%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={percentage}
              onChange={handleSlider}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Reciprocal Preset Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
          High-Yield Exam Reciprocals (Click to Visualize):
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => { setPercentage(p.val); sounds.playClick(); }}
              className={`py-1.5 rounded-xl font-mono text-xs font-black transition border ${
                Math.abs(percentage - p.val) < 0.5
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
