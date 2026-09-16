'use client';

import React from 'react';

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  streak: number;
  xp: number;
  tier: string;
  isCurrentUser?: boolean;
}

interface LeaderboardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRank: number;
  currentXp: number;
  totalStudents?: number;
}

export default function LeaderboardDrawer({
  isOpen,
  onClose,
  currentRank,
  currentXp,
  totalStudents = 22,
}: LeaderboardDrawerProps) {
  if (!isOpen) return null;

  const mockLeaderboard: LeaderboardUser[] = [
    { rank: 1, name: 'You (Student)', avatar: 'ST', streak: 1, xp: currentXp || 450, tier: 'Silver League', isCurrentUser: true },
    { rank: 2, name: 'Aarav Sharma', avatar: 'AS', streak: 21, xp: 420, tier: 'Silver League' },
    { rank: 3, name: 'Pooja Iyer', avatar: 'PI', streak: 18, xp: 380, tier: 'Silver League' },
    { rank: 4, name: 'Rahul Verma', avatar: 'RV', streak: 12, xp: 350, tier: 'Silver League' },
    { rank: 5, name: 'Neha Patel', avatar: 'NP', streak: 6, xp: 310, tier: 'Bronze League' },
    { rank: 6, name: 'Siddharth Rao', avatar: 'SR', streak: 9, xp: 290, tier: 'Bronze League' },
    { rank: 7, name: 'Ananya Deshmukh', avatar: 'AD', streak: 4, xp: 250, tier: 'Bronze League' },
    { rank: 8, name: 'Vikram Joshi', avatar: 'VJ', streak: 5, xp: 220, tier: 'Bronze League' },
    { rank: 9, name: 'Kavita Menon', avatar: 'KM', streak: 3, xp: 190, tier: 'Bronze League' },
    { rank: 10, name: 'Rohan Gupta', avatar: 'RG', streak: 2, xp: 150, tier: 'Bronze League' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Drawer Body */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <i className="fa-solid fa-trophy"></i>
              <span>Cohort Standings 2026</span>
            </div>
            <h2 className="text-xl font-black tracking-tight">Leaderboard &amp; Ranks</h2>
            <p className="text-xs text-indigo-200">Top performers across {totalStudents} active batch students.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Current Student Highlight Banner */}
        <div className="p-4 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md">
              #{currentRank || 4}
            </div>
            <div>
              <div className="text-xs font-extrabold text-indigo-950">Your Standing</div>
              <div className="text-[11px] text-indigo-600 font-bold">Top 8% • +120 XP to Rank #3</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-900">{currentXp || 1450} XP</div>
            <div className="text-[10px] font-bold text-emerald-600 uppercase">Promotion Zone</div>
          </div>
        </div>

        {/* Scrollable Leaderboard List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mockLeaderboard.map((student) => (
            <div
              key={student.rank}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition ${
                student.isCurrentUser
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]'
                  : student.rank === 1
                  ? 'bg-amber-500/10 border-amber-300/40 text-slate-900'
                  : student.rank === 2
                  ? 'bg-slate-100 border-slate-200 text-slate-900'
                  : student.rank === 3
                  ? 'bg-amber-700/10 border-amber-600/30 text-slate-900'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    student.rank === 1
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : student.rank === 2
                      ? 'bg-slate-300 text-slate-800'
                      : student.rank === 3
                      ? 'bg-amber-600 text-white'
                      : student.isCurrentUser
                      ? 'bg-white text-indigo-600 font-extrabold'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {student.rank === 1 ? '🥇' : student.rank === 2 ? '🥈' : student.rank === 3 ? '🥉' : student.rank}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-black truncate flex items-center gap-1.5">
                    <span>{student.name}</span>
                    {student.isCurrentUser && (
                      <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[9px] uppercase tracking-wider font-extrabold">You</span>
                    )}
                  </div>
                  <div className={`text-[10px] font-medium ${student.isCurrentUser ? 'text-indigo-100' : 'text-slate-400'}`}>
                    🔥 {student.streak}d streak • {student.tier}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-xs font-black">
                  {student.xp.toLocaleString('en-IN')} XP
                </div>
                <div className={`text-[9px] font-bold ${student.isCurrentUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Level {Math.floor(student.xp / 300) + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-xs text-slate-500 font-medium">
          Rankings update live every 24 hours at midnight IST.
        </div>

      </div>
    </div>
  );
}
