'use client';

import React, { useState, useEffect } from 'react';
import { sounds } from '../SoundManager';

export default function RelativeSpeedTrack() {
  const [speedA, setSpeedA] = useState<number>(60); // 60 km/h
  const [speedB, setSpeedB] = useState<number>(40); // 40 km/h
  const [direction, setDirection] = useState<'OPPOSITE' | 'SAME'>('OPPOSITE');
  const [trackDistance, setTrackDistance] = useState<number>(500); // 500 meters
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [posA, setPosA] = useState<number>(10); // % from left
  const [posB, setPosB] = useState<number>(90); // % from left

  const relativeSpeedKmH = direction === 'OPPOSITE' ? (speedA + speedB) : Math.abs(speedA - speedB);
  const relativeSpeedMs = (relativeSpeedKmH * 5) / 18;
  const timeToCross = relativeSpeedMs > 0 ? (trackDistance / relativeSpeedMs).toFixed(1) : '∞';

  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setPosA(prev => {
        let next = prev + (speedA / 100) * 0.8;
        if (next > 90) return 10;
        return next;
      });

      setPosB(prev => {
        if (direction === 'OPPOSITE') {
          let next = prev - (speedB / 100) * 0.8;
          if (next < 10) return 90;
          return next;
        } else {
          let next = prev + (speedB / 100) * 0.8;
          if (next > 90) return 10;
          return next;
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimulating, speedA, speedB, direction]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-train"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Relative Speed & Motion Physics Track</h3>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Vector Motion & Overtake Mechanics</span>
          </div>
        </div>

        {/* Direction Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => { setDirection('OPPOSITE'); setPosA(10); setPosB(90); sounds.playClick(); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              direction === 'OPPOSITE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Opposite (Add Speeds)
          </button>
          <button
            onClick={() => { setDirection('SAME'); setPosA(10); setPosB(40); sounds.playClick(); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
              direction === 'SAME'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Same (Subtract Speeds)
          </button>
        </div>
      </div>

      {/* Visual Animation Track */}
      <div className="relative w-full h-40 bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-around overflow-hidden shadow-inner">
        {/* Track Line 1 */}
        <div className="relative w-full h-1 bg-slate-200 border-b border-dashed border-slate-300">
          {/* Train A */}
          <div
            className="absolute -top-3.5 flex items-center space-x-1 transition-all duration-75"
            style={{ left: `${posA}%` }}
          >
            <div className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-bold text-[10px] shadow-sm">
              🚆 Train A ({speedA} km/h) &rarr;
            </div>
          </div>
        </div>

        {/* Track Line 2 */}
        <div className="relative w-full h-1 bg-slate-200 border-b border-dashed border-slate-300">
          {/* Train B */}
          <div
            className="absolute -top-3.5 flex items-center space-x-1 transition-all duration-75"
            style={{ left: `${posB}%` }}
          >
            <div className="px-2 py-0.5 rounded-lg bg-pink-600 text-white font-mono font-bold text-[10px] shadow-sm">
              {direction === 'OPPOSITE' ? `&larr; 🚄 Train B (${speedB} km/h)` : `🚄 Train B (${speedB} km/h) &rarr;`}
            </div>
          </div>
        </div>
      </div>

      {/* Physics Math HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500">Relative Speed</div>
          <div className="text-base font-black text-amber-800 font-mono">
            {relativeSpeedKmH} km/h ({relativeSpeedMs.toFixed(1)} m/s)
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {direction === 'OPPOSITE' ? `${speedA} + ${speedB}` : `|${speedA} - ${speedB}|`}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500">Track Distance</div>
          <div className="text-base font-black text-indigo-700 font-mono">{trackDistance} meters</div>
          <div className="text-[10px] text-slate-400 font-mono">L_trainA + L_trainB</div>
        </div>

        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500">Time to Cross / Overtake</div>
          <div className="text-base font-black text-emerald-700 font-mono">{timeToCross} seconds</div>
          <div className="text-[10px] text-slate-400 font-mono">Distance / RelSpeed</div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Train A Speed Slider */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Train A Speed:</span>
            <span className="text-indigo-700 font-mono">{speedA} km/h</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={speedA}
            onChange={(e) => setSpeedA(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Train B Speed Slider */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Train B Speed:</span>
            <span className="text-pink-700 font-mono">{speedB} km/h</span>
          </div>
          <input
            type="range"
            min="20"
            max="120"
            step="5"
            value={speedB}
            onChange={(e) => setSpeedB(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
          />
        </div>
      </div>
    </div>
  );
}
