'use client';

import React, { useState, useEffect } from 'react';

interface PulseAlert {
  id: string;
  company: string;
  role: string;
  package: string;
  location: string;
  timeAgo: string;
  type: 'drive' | 'referral' | 'package';
}

const PULSE_ALERTS: PulseAlert[] = [
  { id: '1', company: 'Cisco India', role: 'Software Engineer Trainee', package: '₹14 – ₹20 LPA', location: 'Bengaluru', timeAgo: '3m ago', type: 'drive' },
  { id: '2', company: 'Capgemini', role: 'Exceller Fresher Drive', package: '₹4.5 – ₹7.5 LPA', location: 'Pune / Hyderabad', timeAgo: '7m ago', type: 'drive' },
  { id: '3', company: 'Persistent Systems', role: 'Associate Java Engineer', package: '₹5.5 – ₹8.5 LPA', location: 'Nagpur / Pune', timeAgo: '12m ago', type: 'drive' },
  { id: '4', company: 'Google India', role: 'Software Engineer III Full Stack', package: '₹28 – ₹42 LPA', location: 'Hyderabad', timeAgo: '18m ago', type: 'package' },
  { id: '5', company: 'Rapid7', role: 'DevOps & Cloud SRE', package: '₹16 – ₹26 LPA', location: 'Pune', timeAgo: '24m ago', type: 'drive' },
  { id: '6', company: 'Wipro', role: 'Elite National Talent Hunt', package: '₹4.0 – ₹7.0 LPA', location: 'Pan India', timeAgo: '32m ago', type: 'drive' },
];

export default function LiveHiringPulse() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PULSE_ALERTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = PULSE_ALERTS[activeIdx];

  return (
    <div className="bg-slate-900 text-white py-2.5 px-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2 overflow-hidden">
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
          Live Hiring Pulse
        </span>
        <span className="text-slate-600 hidden sm:inline">|</span>
      </div>

      <div className="flex-1 text-center sm:text-left min-w-0 transition-all duration-300">
        <span className="text-xs font-bold text-slate-300">
          <strong className="text-white font-black">{current.company}</strong> just verified{' '}
          <span className="text-indigo-300 font-extrabold">{current.role}</span> ({current.package}) in{' '}
          <span className="text-slate-400">{current.location}</span>
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-400 font-semibold">
        <i className="fa-regular fa-clock text-indigo-400"></i>
        <span>{current.timeAgo}</span>
      </div>
    </div>
  );
}
