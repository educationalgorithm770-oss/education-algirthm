'use client';

import React, { useState } from 'react';
import { SITE_DATA, CohortGalleryItem } from '@/config/site-data';

export default function CohortLifeGallery() {
  const [selectedItem, setSelectedItem] = useState<CohortGalleryItem | null>(null);
  const items: CohortGalleryItem[] = (SITE_DATA as any).cohortLifeGallery || [];

  return (
    <section className="py-14 sm:py-20 px-3 sm:px-6 lg:px-8 bg-slate-900 text-white relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-14 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
              <i className="fa-solid fa-camera-retro"></i>
              <span>Inside The Cohort Experience</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Real Engineers. Real Code. <span className="text-blue-400">Zero Superficial Theory.</span>
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-normal leading-relaxed">
              Step inside our daily engineering rituals—from 1-on-1 GitHub pull request dissections to live 50,000 req/sec stress tests and employer demo days.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-200 font-bold">Bangalore Campus &amp; Remote</span>
            </div>
          </div>
        </div>

        {/* 4-Card Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group relative bg-slate-800/80 rounded-2xl border border-slate-700/80 hover:border-blue-500/60 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between"
            >
              {/* Card Image Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out brightness-90 group-hover:brightness-100"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/30"></div>
                
                {/* Highlight Floating Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold tracking-wider shadow-sm">
                    {item.highlightPill}
                  </span>
                </div>

                {/* Quick Zoom Indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/90 text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-md">
                  <i className="fa-solid fa-expand"></i>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                    {item.category}
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white group-hover:text-blue-300 transition-colors leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Metric Strip */}
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{item.metricLabel}:</span>
                  <span className="text-emerald-400 font-bold">{item.metricValue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Proof Strip */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-3 text-slate-300">
            <i className="fa-solid fa-shield-halved text-blue-400 text-lg"></i>
            <div>
              <strong className="text-white font-bold">100% Transparent Pedagogy Guarantee:</strong> All projects, PR diffs, and live test runs are publicly auditable by hiring partners.
            </div>
          </div>
          <button
            onClick={() => setSelectedItem(items[0])}
            className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs font-mono transition flex items-center space-x-2 shrink-0"
          >
            <span>Inspect Gallery Photos</span>
            <i className="fa-solid fa-arrow-right text-[10px]"></i>
          </button>
        </div>

      </div>

      {/* Lightbox Expander Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl space-y-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[11px] font-mono font-bold border border-blue-700/40">
                  {selectedItem.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">• {selectedItem.location}</span>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Modal Image */}
            <div className="relative aspect-[16/9] w-full bg-black overflow-hidden">
              <img
                src={selectedItem.imageUrl}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3">
                <span className="px-3 py-1 rounded-xl bg-slate-950/90 text-emerald-400 font-mono text-xs font-bold border border-slate-700">
                  {selectedItem.metricLabel}: {selectedItem.metricValue}
                </span>
              </div>
            </div>

            {/* Modal Details */}
            <div className="p-5 sm:p-6 space-y-3">
              <h3 className="text-xl font-black text-white">
                {selectedItem.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                {selectedItem.description}
              </p>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">Education Algorithm Engineering Rigor</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
                >
                  Close Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
