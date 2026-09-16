'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import AlgoBotMascot from '@/components/aptitude/AlgoBotMascot';
import ConfettiBurst from '@/components/aptitude/ConfettiBurst';
import { sounds } from '@/components/aptitude/SoundManager';

interface RoadmapDay {
  dayNumber: number;
  title: string;
  topicSlug?: string;
  mockSlug?: string;
  goalQuestions: number;
  visualLab?: string | null;
  status: 'LOCKED' | 'AVAILABLE' | 'COMPLETED';
  scorePercentage: number;
  completedAt: string | null;
}

interface ActiveTrack {
  trackSlug: string;
  title: string;
  durationDays: number;
  targetAudience: string;
  badgeName: string;
  xpReward: number;
  completedDaysCount: number;
  completionPercentage: number;
  days: RoadmapDay[];
}

interface TrackOverview {
  trackSlug: string;
  title: string;
  durationDays: number;
  targetAudience: string;
  badgeName: string;
  xpReward: number;
}

export default function AptitudeRoadmapPage() {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<TrackOverview[]>([]);
  const [activeTrack, setActiveTrack] = useState<ActiveTrack | null>(null);
  const [selectedTrackSlug, setSelectedTrackSlug] = useState('30-day-pro');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    async function loadRoadmap() {
      try {
        setLoading(true);
        const res = await fetch(`/api/aptitude/roadmap?trackSlug=${selectedTrackSlug}`);
        const data = await res.json();
        if (data.success) {
          setTracks(data.tracks || []);
          setActiveTrack(data.activeTrack || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, [selectedTrackSlug]);

  const handleTrackChange = (slug: string) => {
    sounds.playClick();
    setSelectedTrackSlug(slug);
  };

  const handleCompleteDay = async (dayNum: number) => {
    sounds.playClick();
    try {
      const res = await fetch('/api/aptitude/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackSlug: selectedTrackSlug,
          dayNumber: dayNum,
          scorePercentage: 100
        })
      });
      const data = await res.json();
      if (data.success) {
        sounds.playLevelUp();
        setShowConfetti(true);
        // Reload roadmap
        const refRes = await fetch(`/api/aptitude/roadmap?trackSlug=${selectedTrackSlug}`);
        const refData = await refRes.json();
        if (refData.success) {
          setActiveTrack(refData.activeTrack);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !activeTrack) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <StudentNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-500">Loading Adaptive Roadmap Tree...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-600 selection:text-white pb-16 font-sans">
      <StudentNavbar />
      <ConfettiBurst active={showConfetti} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Top Header Bar & Track Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-200/90 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <Link
              href="/dashboard/aptitude"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center text-xs sm:text-sm transition shrink-0"
              title="Return to Aptitude Hub"
            >
              <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 truncate">
                Placement Mastery Roadmap
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900 truncate">
                {activeTrack.title}
              </h1>
            </div>
          </div>

          {/* 3 Track Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {tracks.map(t => (
              <button
                key={t.trackSlug}
                onClick={() => handleTrackChange(t.trackSlug)}
                className={`flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition whitespace-nowrap text-center ${
                  selectedTrackSlug === t.trackSlug
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Progress HUD */}
        <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 border border-indigo-100/90 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="w-full md:flex-1 min-w-0">
              <AlgoBotMascot
                mood={activeTrack.completionPercentage > 50 ? 'EXCITED' : 'HAPPY'}
                customQuote={`You have completed ${activeTrack.completedDaysCount} of ${activeTrack.durationDays} days. Keep the momentum going!`}
                size="md"
              />
            </div>

            {/* Overall Progress Gauge */}
            <div className="w-full md:w-72 bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Track Completion</span>
                <span className="text-emerald-600 font-mono font-black">{activeTrack.completionPercentage}%</span>
              </div>
              <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(5, activeTrack.completionPercentage)}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between font-semibold">
                <span>{activeTrack.completedDaysCount} Days Done</span>
                <span>{activeTrack.durationDays - activeTrack.completedDaysCount} Days Left</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Roadmap Node Tree */}
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-route text-indigo-600"></i>
              <span>Daily Milestones & Interactive Drills</span>
            </h2>
            <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">
              Complete each day to unlock the next milestone!
            </span>
          </div>

          {/* Node Cards List */}
          <div className="space-y-2.5 sm:space-y-3">
            {activeTrack.days.map((day) => {
              const isLocked = day.status === 'LOCKED';
              const isCompleted = day.status === 'COMPLETED';
              const isAvailable = day.status === 'AVAILABLE';

              return (
                <div
                  key={day.dayNumber}
                  className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
                    isCompleted
                      ? 'bg-emerald-50/60 border-emerald-200/90 shadow-xs'
                      : isAvailable
                      ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/15 shadow-sm'
                      : 'bg-slate-50/60 border-slate-200 opacity-60'
                  }`}
                >
                  {/* Left: Day Badge & Info */}
                  <div className="flex items-center space-x-3 sm:space-x-3.5 min-w-0 flex-1">
                    {/* Status Circle */}
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 border ${
                      isCompleted
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isAvailable
                        ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}>
                      {isCompleted ? (
                        <i className="fa-solid fa-check"></i>
                      ) : isLocked ? (
                        <i className="fa-solid fa-lock text-[10px] sm:text-xs"></i>
                      ) : (
                        `D${day.dayNumber}`
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Day {day.dayNumber}
                        </span>
                        {day.visualLab && (
                          <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded bg-purple-50 text-purple-700 text-[8px] sm:text-[9px] font-bold border border-purple-200">
                            Motion Lab
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-base font-black text-slate-900 mt-0.5 truncate">
                        {day.title}
                      </h3>
                      <div className="text-[11px] sm:text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span><i className="fa-solid fa-list-check text-indigo-500 me-1"></i>{day.goalQuestions} Questions</span>
                        {isCompleted && (
                          <span className="text-emerald-700 font-bold">• 100% Score</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-stretch sm:justify-end pt-1 sm:pt-0">
                    {day.topicSlug && (
                      <Link
                        href={`/dashboard/aptitude/practice/${day.topicSlug}`}
                        className={`flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 sm:py-2 rounded-xl text-[11px] sm:text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                          isAvailable || isCompleted
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 pointer-events-none'
                        }`}
                      >
                        <span>{isCompleted ? 'Review' : 'Start Practice'}</span>
                        <i className="fa-solid fa-arrow-right text-[9px] sm:text-[10px]"></i>
                      </Link>
                    )}

                    {day.mockSlug && (
                      <Link
                        href={`/dashboard/aptitude/mock/${day.mockSlug}`}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition flex items-center space-x-1.5 ${
                          isAvailable || isCompleted
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 pointer-events-none'
                        }`}
                      >
                        <span>Launch Mock OA</span>
                        <i className="fa-solid fa-shield-halved text-[10px]"></i>
                      </Link>
                    )}

                    {!isCompleted && isAvailable && (
                      <button
                        onClick={() => handleCompleteDay(day.dayNumber)}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold transition"
                        title="Mark Complete"
                      >
                        <i className="fa-solid fa-check"></i>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
