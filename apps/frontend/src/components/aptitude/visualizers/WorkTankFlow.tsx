'use client';

import React, { useState } from 'react';
import { sounds } from '../SoundManager';

export default function WorkTankFlow() {
  const [tapAHours, setTapAHours] = useState<number>(6); // Tap A takes 6h
  const [tapBHours, setTapBHours] = useState<number>(8); // Tap B takes 8h
  const [leakCHours, setLeakCHours] = useState<number>(12); // Leak C takes 12h
  const [leakActive, setLeakActive] = useState<boolean>(true);

  // Helper LCM
  const gcd = (a: number, b: number): number => (!b ? a : gcd(b, a % b));
  const lcm = (a: number, b: number): number => (a * b) / gcd(a, b);

  const tankCapacityUnits = leakActive
    ? lcm(lcm(tapAHours, tapBHours), leakCHours)
    : lcm(tapAHours, tapBHours);

  const rateA = tankCapacityUnits / tapAHours; // + units/h
  const rateB = tankCapacityUnits / tapBHours; // + units/h
  const rateC = leakActive ? tankCapacityUnits / leakCHours : 0; // - units/h

  const netRate = rateA + rateB - rateC;
  const timeToFillHours = netRate > 0 ? (tankCapacityUnits / netRate).toFixed(2) : 'Never (Leak exceeds inlets)';

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-200 flex items-center justify-center text-base">
            <i className="fa-solid fa-faucet-drip"></i>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Work Efficiency & Pipes Tank Flow</h3>
            <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">LCM Unit Method Visualizer</span>
          </div>
        </div>

        <button
          onClick={() => { setLeakActive(!leakActive); sounds.playClick(); }}
          className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center space-x-1.5 ${
            leakActive
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
        >
          <i className="fa-solid fa-droplet-slash"></i>
          <span>{leakActive ? 'Leak C Active (-)' : 'No Leak (+)'}</span>
        </button>
      </div>

      {/* Main Tank Animation Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Animated Water Tank Graphic */}
        <div className="relative w-48 h-56 mx-auto bg-slate-50 border-4 border-slate-300 rounded-b-3xl rounded-t-lg overflow-hidden flex flex-col justify-end shadow-inner">
          {/* Inlet Pipe A indicator */}
          <div className="absolute top-2 left-4 px-2 py-0.5 rounded bg-indigo-600 text-white font-mono text-[9px] shadow-xs">
            Inlet A (+{rateA} L/h)
          </div>
          {/* Inlet Pipe B indicator */}
          <div className="absolute top-2 right-4 px-2 py-0.5 rounded bg-cyan-600 text-white font-mono text-[9px] shadow-xs">
            Inlet B (+{rateB} L/h)
          </div>

          {/* Dynamic Water Wave */}
          <div
            className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 transition-all duration-500 flex items-center justify-center text-white font-mono font-black text-xs shadow-lg relative"
            style={{ height: `${Math.min(90, Math.max(25, (netRate / (rateA + rateB)) * 100))}%` }}
          >
            <div className="absolute -top-3 left-0 right-0 h-3 bg-cyan-300/60 rounded-full animate-pulse"></div>
            <span>Capacity: {tankCapacityUnits} Units</span>
          </div>

          {/* Leak C Indicator */}
          {leakActive && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[8px] animate-bounce shadow-xs">
              Leak C (-{rateC} L/h)
            </div>
          )}
        </div>

        {/* Math & Rates HUD */}
        <div className="space-y-3">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Total Work / Tank Volume (LCM):</span>
              <span className="font-mono font-bold text-amber-800">{tankCapacityUnits} Litres</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Pipe A Flow Rate ({tapAHours} hrs):</span>
              <span className="font-mono font-bold text-indigo-700">+{rateA} L/hr</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Pipe B Flow Rate ({tapBHours} hrs):</span>
              <span className="font-mono font-bold text-cyan-700">+{rateB} L/hr</span>
            </div>
            {leakActive && (
              <div className="flex justify-between items-center text-slate-600">
                <span>Leak C Outflow Rate ({leakCHours} hrs):</span>
                <span className="font-mono font-bold text-rose-600">-{rateC} L/hr</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-slate-800 font-bold">
              <span>Net Inflow Rate:</span>
              <span className="font-mono text-emerald-700">+{netRate} L/hr</span>
            </div>
          </div>

          {/* Result Time Box */}
          <div className="p-3.5 bg-cyan-50 border border-cyan-200 rounded-2xl text-center">
            <div className="text-[10px] uppercase font-bold text-cyan-800">Total Time to Fill Tank</div>
            <div className="text-xl font-black text-cyan-950 font-mono mt-0.5">
              {timeToFillHours} {typeof timeToFillHours === 'string' && timeToFillHours.includes('Never') ? '' : 'Hours'}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Pipe A Time:</span>
            <span className="text-indigo-700 font-mono">{tapAHours}h</span>
          </div>
          <input
            type="range"
            min="2"
            max="24"
            step="1"
            value={tapAHours}
            onChange={(e) => setTapAHours(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Pipe B Time:</span>
            <span className="text-cyan-700 font-mono">{tapBHours}h</span>
          </div>
          <input
            type="range"
            min="2"
            max="24"
            step="1"
            value={tapBHours}
            onChange={(e) => setTapBHours(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
          />
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Leak C Time:</span>
            <span className="text-rose-600 font-mono">{leakCHours}h</span>
          </div>
          <input
            type="range"
            min="4"
            max="30"
            step="1"
            disabled={!leakActive}
            value={leakCHours}
            onChange={(e) => setLeakCHours(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600 disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}
