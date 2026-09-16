'use client';

import React, { useState } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200"
        >
          <button
            onClick={() => toggle(item.id)}
            className="w-full p-6 md:p-7 text-left font-bold text-slate-900 text-lg md:text-xl flex items-center justify-between hover:text-indigo-600 transition-colors"
          >
            <span className="pr-4">{item.title}</span>
            <i className={`fa-solid fa-chevron-down text-base transition-transform duration-300 ${openId === item.id ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}></i>
          </button>
          {openId === item.id && (
            <div className="px-6 md:px-7 pb-6 text-base md:text-lg text-slate-700 font-normal leading-relaxed border-t border-slate-100 pt-5 animate-fade-in-up">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
