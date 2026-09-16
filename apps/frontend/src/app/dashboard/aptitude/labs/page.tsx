'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import PercentageSlicer from '@/components/aptitude/visualizers/PercentageSlicer';
import ProfitLossScale from '@/components/aptitude/visualizers/ProfitLossScale';
import RelativeSpeedTrack from '@/components/aptitude/visualizers/RelativeSpeedTrack';
import WorkTankFlow from '@/components/aptitude/visualizers/WorkTankFlow';
import SyllogismVennBubble from '@/components/aptitude/visualizers/SyllogismVennBubble';
import SeatingCouncilTable from '@/components/aptitude/visualizers/SeatingCouncilTable';
import ClockAngleCompass from '@/components/aptitude/visualizers/ClockAngleCompass';
import { sounds } from '@/components/aptitude/SoundManager';

export default function ConceptLabsPage() {
  const [activeLab, setActiveLab] = useState<string>('PERCENTAGE');

  const labs = [
    { id: 'PERCENTAGE', name: 'Percentage Slicer', icon: 'fa-pizza-slice', color: 'emerald' },
    { id: 'PROFIT_LOSS', name: 'Profit-Loss Scale', icon: 'fa-scale-balanced', color: 'amber' },
    { id: 'RELATIVE_SPEED', name: 'Relative Speed Track', icon: 'fa-train', color: 'indigo' },
    { id: 'WORK_TANK', name: 'Pipes & Tank Flow', icon: 'fa-faucet-drip', color: 'cyan' },
    { id: 'SYLLOGISM', name: 'Neon Venn Matrix', icon: 'fa-brain', color: 'purple' },
    { id: 'SEATING', name: 'Seating Council Table', icon: 'fa-users-between-lines', color: 'rose' },
    { id: 'CLOCK', name: 'Clock Angle & Shadows', icon: 'fa-clock', color: 'teal' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white pb-16 font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xs">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/aptitude"
              className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-sm transition"
              title="Return to Aptitude Hub"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                Interactive Concept Playgrounds
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                Motion UI Aptitude & Logic Labs 🎮
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard/aptitude/roadmap"
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition flex items-center space-x-1.5 shadow-xs"
          >
            <i className="fa-solid fa-route"></i>
            <span>30-Day Roadmap</span>
          </Link>
        </div>

        {/* Lab Switcher Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200/90 shadow-xs">
          {labs.map(l => (
            <button
              key={l.id}
              onClick={() => { setActiveLab(l.id); sounds.playClick(); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                activeLab === l.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <i className={`fa-solid ${l.icon} text-xs`}></i>
              <span>{l.name}</span>
            </button>
          ))}
        </div>

        {/* Render Active Lab */}
        <div className="animate-fade-in">
          {activeLab === 'PERCENTAGE' && <PercentageSlicer />}
          {activeLab === 'PROFIT_LOSS' && <ProfitLossScale />}
          {activeLab === 'RELATIVE_SPEED' && <RelativeSpeedTrack />}
          {activeLab === 'WORK_TANK' && <WorkTankFlow />}
          {activeLab === 'SYLLOGISM' && <SyllogismVennBubble />}
          {activeLab === 'SEATING' && <SeatingCouncilTable />}
          {activeLab === 'CLOCK' && <ClockAngleCompass />}
        </div>

      </main>
    </div>
  );
}
