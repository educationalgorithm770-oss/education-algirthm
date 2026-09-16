'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function SeatingCouncilTable() {
  const [seats, setSeats] = useState<string[]>(['P', 'S', 'W', 'T', 'Q', 'U', 'R', 'V']);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // 8 Seat Positions around a circle
  const seatPositions = [
    { x: 100, y: 24, label: 'Seat 1 (Top)' },
    { x: 154, y: 46, label: 'Seat 2 (Top-Right)' },
    { x: 176, y: 100, label: 'Seat 3 (Right)' },
    { x: 154, y: 154, label: 'Seat 4 (Bottom-Right)' },
    { x: 100, y: 176, label: 'Seat 5 (Bottom)' },
    { x: 46, y: 154, label: 'Seat 6 (Bottom-Left)' },
    { x: 24, y: 100, label: 'Seat 7 (Left)' },
    { x: 46, y: 46, label: 'Seat 8 (Top-Left)' }
  ];

  const handleSeatClick = (idx: number) => {
    sounds.playClick();
    if (selectedSeat === null) {
      setSelectedSeat(idx);
    } else {
      // Swap seats
      const newSeats = [...seats];
      const temp = newSeats[selectedSeat];
      newSeats[selectedSeat] = newSeats[idx];
      newSeats[idx] = temp;
      setSeats(newSeats);
      setSelectedSeat(null);
    }
  };

  const resetToDefault = () => {
    sounds.playClick();
    setSeats(['P', 'S', 'W', 'T', 'Q', 'U', 'R', 'V']);
    setSelectedSeat(null);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-users-between-lines"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">8-Person Circular Council Seating Table</h3>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Clockwise Left/Right & Opposite Solver</span>
          </div>
        </div>

        <button
          onClick={resetToDefault}
          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition border border-slate-200"
        >
          Reset Seats
        </button>
      </div>

      {/* Main Table Graphic & Clues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* SVG Circular Table with Clickable Nodes */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
            {/* Center Table Surface */}
            <circle cx="100" cy="100" r="50" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="4" />
            <text x="100" y="97" fill="#4F46E5" fontSize="8" fontWeight="black" textAnchor="middle">
              FACING CENTER
            </text>
            <text x="100" y="108" fill="#64748B" fontSize="6" fontWeight="bold" textAnchor="middle">
              Clockwise = Right
            </text>

            {/* Seat Circles */}
            {seatPositions.map((pos, idx) => {
              const isSelected = selectedSeat === idx;
              const letter = seats[idx];

              return (
                <g
                  key={idx}
                  onClick={() => handleSeatClick(idx)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-110"
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="15"
                    fill={isSelected ? '#4F46E5' : '#EEF2FF'}
                    stroke={isSelected ? '#312E81' : '#6366F1'}
                    strokeWidth="2.5"
                    className="transition-all"
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    fill={isSelected ? '#FFFFFF' : '#312E81'}
                    fontSize="11"
                    fontWeight="black"
                    textAnchor="middle"
                  >
                    {letter}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Live Constraint Clues Grid */}
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="text-[10px] uppercase font-black tracking-wider text-indigo-700">
              Arrangement Rules (Click 2 seats to swap):
            </div>
            <div className="text-slate-700 flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
              <span><strong>Q</strong> sits directly opposite to <strong>P</strong> (4 seats gap).</span>
            </div>
            <div className="text-slate-700 flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
              <span><strong>R</strong> sits 2nd to the left of <strong>Q</strong>.</span>
            </div>
            <div className="text-slate-700 flex items-center space-x-2">
              <i className="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
              <span><strong>W</strong> sits opposite to <strong>R</strong>!</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-amber-900">Exam Shortcut:</div>
            <p className="text-amber-950 leading-relaxed font-medium">
              In any 8-person circle, "opposite" is always <code className="text-amber-800 bg-amber-100/60 px-1 py-0.5 rounded border border-amber-200 font-mono">(Index + 4) % 8</code>. Never redraw the entire circle for simple opposite queries!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
