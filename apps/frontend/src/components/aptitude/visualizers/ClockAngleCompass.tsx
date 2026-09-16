'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function ClockAngleCompass() {
  const [hours, setHours] = useState<number>(3); // 3 o'clock
  const [minutes, setMinutes] = useState<number>(15); // 15 mins (e.g. 3:15)

  // Angle formula: |30*H - 5.5*M|
  const rawAngle = Math.abs(30 * hours - 5.5 * minutes);
  const angle = Math.min(rawAngle, 360 - rawAngle);

  // Hour hand angle: 30 * H + 0.5 * M
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  // Minute hand angle: 6 * M
  const minAngle = minutes * 6;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Analog Clock Angle & Compass Direction Physics</h3>
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Formula: |30H - 5.5M|</span>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-700 font-mono font-black text-sm border border-teal-200">
          Angle: {angle.toFixed(1)}°
        </span>
      </div>

      {/* Main Clock Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* SVG Clock Dial */}
        <div className="relative w-48 h-48 mx-auto flex items-center justify-center select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
            {/* Outer Dial */}
            <circle cx="100" cy="100" r="85" fill="#F8FAFC" stroke="#0D9488" strokeWidth="4" />

            {/* Hour Markers */}
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
              const markerAngle = (i * 30 * Math.PI) / 180;
              const mx = 100 + 70 * Math.sin(markerAngle);
              const my = 100 - 70 * Math.cos(markerAngle);
              return (
                <text
                  key={h}
                  x={mx}
                  y={my + 3}
                  fill="#475569"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {h}
                </text>
              );
            })}

            {/* Hour Hand (Thicker, Shorter, Indigo) */}
            <line
              x1="100"
              y1="100"
              x2={100 + 45 * Math.sin((hourAngle * Math.PI) / 180)}
              y2={100 - 45 * Math.cos((hourAngle * Math.PI) / 180)}
              stroke="#4F46E5"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Minute Hand (Thinner, Longer, Teal) */}
            <line
              x1="100"
              y1="100"
              x2={100 + 65 * Math.sin((minAngle * Math.PI) / 180)}
              y2={100 - 65 * Math.cos((minAngle * Math.PI) / 180)}
              stroke="#0D9488"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Center Pin */}
            <circle cx="100" cy="100" r="5" fill="#F59E0B" />
          </svg>
        </div>

        {/* Calculation & Sliders HUD */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Time Selected:</span>
              <span className="font-mono font-black text-slate-900 text-sm">
                {hours < 10 ? '0' : ''}{hours}:{minutes < 10 ? '0' : ''}{minutes}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Hour Hand Position:</span>
              <span className="font-mono text-indigo-700 font-bold">{hourAngle.toFixed(1)}°</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Minute Hand Position:</span>
              <span className="font-mono text-teal-700 font-bold">{minAngle.toFixed(1)}°</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-800 font-bold">
              <span>Calculated Angle:</span>
              <span className="font-mono text-amber-800 font-extrabold text-sm">{angle.toFixed(1)}°</span>
            </div>
          </div>

          {/* Time Sliders */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Hour (1-12): <strong className="text-indigo-700">{hours}</strong></span>
              <span>Minute (0-59): <strong className="text-teal-700">{minutes}</strong></span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={hours}
              onChange={(e) => { setHours(Number(e.target.value)); sounds.playClick(); }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <input
              type="range"
              min="0"
              max="59"
              step="1"
              value={minutes}
              onChange={(e) => { setMinutes(Number(e.target.value)); sounds.playClick(); }}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
