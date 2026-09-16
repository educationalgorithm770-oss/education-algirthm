'use client';

import React from 'react';

export default function StudentFooter() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs py-4 px-4 sm:px-6 mt-auto mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center space-x-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse me-1"></span>
          <span className="text-slate-300">Education Algorithm LMS</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-mono text-[11px]">Systems Operational</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-500 font-medium">
          <span>Java &amp; AI Cohort 2026</span>
          <span>•</span>
          <a href="/dashboard/doubts" className="text-indigo-400 hover:text-indigo-300 transition">Doubt Desk</a>
          <span>•</span>
          <a href="/dashboard/doubts" className="hover:text-slate-300 transition">Help &amp; Support</a>
          <span>•</span>
          <span>© 2026 Education Algorithm</span>
        </div>
      </div>
    </footer>
  );
}
