'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function SyllogismVennBubble() {
  const [activeCase, setActiveCase] = useState<'ALL_SOME' | 'ONLY_A_FEW' | 'DISJOINT_NONE'>('ONLY_A_FEW');

  const cases = [
    {
      id: 'ONLY_A_FEW',
      title: 'Only a Few A are B',
      statements: ['1. Only a few Developers are AI Experts.', '2. All AI Experts are Innovators.'],
      deduction: 'Deductions: Some Devs are AI Experts (+) AND Some Devs are NOT AI Experts (-). Conclusion: "Some Innovators are Developers" is Definite TRUE!',
      color: 'purple'
    },
    {
      id: 'ALL_SOME',
      title: 'All A are B & Some B are C',
      statements: ['1. All Engineers are Thinkers.', '2. Some Thinkers are Coffee Lovers.'],
      deduction: 'Deductions: No direct boundary link between Engineers & Coffee Lovers. Definite "All Engineers drink Coffee" is FALSE; but a "Possibility" is TRUE.',
      color: 'indigo'
    },
    {
      id: 'DISJOINT_NONE',
      title: 'No B is C (Disjoint Sets)',
      statements: ['1. All Cars are Vehicles.', '2. No Vehicle is an Airplane.'],
      deduction: 'Deductions: Since Cars are completely inside Vehicles, and Vehicles never touch Airplanes: "No Car is an Airplane" is 100% Definite TRUE!',
      color: 'pink'
    }
  ];

  const currentCase = cases.find(c => c.id === activeCase) || cases[0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-brain"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Syllogisms Glowing Neon Venn Matrix</h3>
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Definite vs Possibility Logic</span>
          </div>
        </div>

        {/* Case Switcher Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {cases.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveCase(c.id as any); sounds.playClick(); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                activeCase === c.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Venn Graphic & Statements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Glowing SVG Venn Diagram Graphic */}
        <div className="relative w-56 h-48 mx-auto flex items-center justify-center">
          <svg viewBox="0 0 300 200" className="w-full h-full drop-shadow-md">
            {activeCase === 'ONLY_A_FEW' && (
              <>
                {/* Circle A: Developers */}
                <circle cx="110" cy="100" r="65" fill="#6366F1" fillOpacity="0.25" stroke="#4F46E5" strokeWidth="3" />
                <text x="75" y="105" fill="#3730A3" fontSize="11" fontWeight="bold">Devs (A)</text>

                {/* Circle B: AI Experts */}
                <circle cx="190" cy="100" r="65" fill="#EC4899" fillOpacity="0.25" stroke="#DB2777" strokeWidth="3" />
                <text x="205" y="105" fill="#9D174D" fontSize="11" fontWeight="bold">AI (B)</text>

                {/* Glowing Intersection */}
                <path d="M150,48 A65,65 0 0,1 150,152 A65,65 0 0,1 150,48 Z" fill="#FBBF24" fillOpacity="0.4" className="animate-pulse" />
                <text x="138" y="105" fill="#B45309" fontSize="9" fontWeight="black">Some (+)</text>
              </>
            )}

            {activeCase === 'ALL_SOME' && (
              <>
                {/* Large Circle B: Thinkers */}
                <circle cx="110" cy="100" r="75" fill="#818CF8" fillOpacity="0.2" stroke="#4F46E5" strokeWidth="3" />
                <text x="65" y="55" fill="#3730A3" fontSize="10" fontWeight="bold">Thinkers (B)</text>

                {/* Inner Circle A: Engineers (Subset) */}
                <circle cx="100" cy="110" r="38" fill="#34D399" fillOpacity="0.35" stroke="#059669" strokeWidth="2.5" />
                <text x="78" y="115" fill="#065F46" fontSize="10" fontWeight="black">Engineers (A)</text>

                {/* Overlapping Circle C: Coffee */}
                <circle cx="210" cy="100" r="55" fill="#FBBF24" fillOpacity="0.25" stroke="#D97706" strokeWidth="3" />
                <text x="215" y="105" fill="#92400E" fontSize="10" fontWeight="bold">Coffee (C)</text>
              </>
            )}

            {activeCase === 'DISJOINT_NONE' && (
              <>
                {/* Circle B: Vehicles (Surrounds Cars A) */}
                <circle cx="95" cy="100" r="70" fill="#60A5FA" fillOpacity="0.2" stroke="#2563EB" strokeWidth="3" />
                <text x="55" y="55" fill="#1E40AF" fontSize="10" fontWeight="bold">Vehicles (B)</text>

                {/* Inner Circle A: Cars */}
                <circle cx="95" cy="110" r="35" fill="#34D399" fillOpacity="0.4" stroke="#059669" strokeWidth="2.5" />
                <text x="78" y="115" fill="#065F46" fontSize="10" fontWeight="black">Cars (A)</text>

                {/* Disjoint Circle C: Airplanes */}
                <circle cx="230" cy="100" r="50" fill="#F87171" fillOpacity="0.25" stroke="#DC2626" strokeWidth="3" strokeDasharray="4" />
                <text x="200" y="105" fill="#991B1B" fontSize="10" fontWeight="bold">Airplanes (C)</text>

                {/* Red Disjoint Cross line */}
                <line x1="165" y1="90" x2="180" y2="110" stroke="#DC2626" strokeWidth="3" />
                <line x1="180" y1="90" x2="165" y2="110" stroke="#DC2626" strokeWidth="3" />
              </>
            )}
          </svg>
        </div>

        {/* Premise & Deductions Analysis Box */}
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-[10px] uppercase font-black tracking-wider text-purple-700">Statement Premises:</div>
            {currentCase.statements.map((stmt, idx) => (
              <div key={idx} className="text-xs font-semibold text-slate-800 flex items-center space-x-2">
                <i className="fa-solid fa-angle-right text-purple-600 text-xs"></i>
                <span>{stmt}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl text-xs space-y-1">
            <div className="text-[10px] uppercase font-black tracking-wider text-purple-900">Exam Deduction Insight:</div>
            <p className="text-purple-950 leading-relaxed font-medium">
              {currentCase.deduction}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
