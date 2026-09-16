'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Do not show on auth pages or public marketing pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isStudentArea = pathname?.startsWith('/dashboard') || pathname === '/code-arena' || pathname === '/ai-tutor';

  if (isAuthPage || !isStudentArea) {
    return null;
  }

  const tabs = [
    { name: 'Home', href: '/dashboard', icon: 'fa-house' },
    { name: 'Learn', href: '/dashboard/learn/1', icon: 'fa-circle-play' },
    { name: 'AI Mocks', href: '/dashboard/ai-interview', icon: 'fa-microphone-lines' },
    { name: 'Code', href: '/code-arena', icon: 'fa-terminal' },
    { name: 'Profile', href: '/dashboard/settings', icon: 'fa-user' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/80 px-3 py-2 flex items-center justify-around md:hidden safe-area-inset-bottom shadow-2xl">
      {tabs.map((tab) => {
        const isActive =
          tab.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname?.startsWith(tab.href);

        return (
          <Link
            key={tab.name}
            href={tab.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 relative ${
              isActive
                ? 'text-indigo-400 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <i className={`fa-solid ${tab.icon} text-lg mb-0.5`}></i>
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-400"></span>
              )}
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}`}>
              {tab.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
