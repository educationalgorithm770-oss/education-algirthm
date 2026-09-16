'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function StudentNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatarBadge: string } | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          const name = data.user.name || 'Student Scholar';
          const email = data.user.email || 'student@example.com';
          const badge = name
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'ST';
          setUser({ name, email, avatarBadge: badge });
          return;
        }
      } catch (e) {}

      const storedUser = localStorage.getItem('student_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const name = parsed.name && parsed.name !== 'student' ? parsed.name : 'Student Scholar';
          const email = parsed.email || 'student@example.com';
          const badge = name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'ST';
          setUser({ name, email, avatarBadge: badge });
        } catch (e) {
          setUser({ name: 'Student Scholar', email: 'student@example.com', avatarBadge: 'ST' });
        }
      } else {
        setUser({ name: 'Student Scholar', email: 'student@example.com', avatarBadge: 'ST' });
      }
    }
    loadAuth();
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = '/login?switch=true';
    }
  };

  // 5 Core Primary High-Frequency Tabs
  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: 'fa-gauge-high' },
    { name: 'Aptitude Hub', href: '/dashboard/aptitude', icon: 'fa-brain' },
    { name: 'My Courses', href: '/dashboard/learn/1', icon: 'fa-circle-play' },
    { name: 'Code Arena', href: '/code-arena', icon: 'fa-code' },
    { name: 'AI Tutor', href: '/ai-tutor', icon: 'fa-robot' },
  ];

  const secondaryTools = [
    { name: 'Aptitude & Reasoning', href: '/dashboard/aptitude', icon: 'fa-brain' },
    { name: 'Speed Duel Arena', href: '/dashboard/aptitude/speed-duel', icon: 'fa-swords' },
    { name: 'Doubt & Help Desk', href: '/dashboard/doubts', icon: 'fa-comments-question' },
    { name: 'RAG Search AI', href: '/dashboard/ai-rag', icon: 'fa-brain' },
    { name: 'Quizzes', href: '/dashboard/quizzes', icon: 'fa-list-check' },
    { name: 'Assignments', href: '/dashboard/assignments', icon: 'fa-file-code' },
    { name: 'Flashcards', href: '/dashboard/flashcards', icon: 'fa-layer-group' },
    { name: 'Certificates', href: '/dashboard/certificates', icon: 'fa-award' },
    { name: 'Billing / Invoices', href: '/dashboard/payments', icon: 'fa-receipt' },
    { name: 'Change Password', href: '/dashboard/settings', icon: 'fa-key' },
  ];

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Minimalist Clean Logo */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <Link href="/dashboard" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300 shrink-0">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              Education <span className="text-indigo-500">Algorithm</span>
            </span>
          </Link>
        </div>

        {/* Center: 4 Core Navigation Tabs (Desktop) */}
        <nav className="hidden xl:flex items-center space-x-1.5 2xl:space-x-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <i className={`fa-solid ${link.icon} text-xs opacity-90`}></i>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Notifications & Student Profile */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          
          {/* Settings & Password Shortcut (Desktop only) */}
          <Link
            href="/dashboard/settings"
            className="hidden lg:flex w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700/60 items-center justify-center text-sm"
            title="Account Settings & Change Password"
          >
            <i className="fa-solid fa-gear"></i>
          </Link>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition relative border border-slate-700/60 flex items-center justify-center"
              title="Notifications"
            >
              <i className="fa-regular fa-bell text-sm sm:text-base"></i>
              <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse"></span>
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-extrabold text-sm text-white">Notifications</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-bold">2 New</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-800/80 rounded-xl space-y-1">
                    <div className="font-bold text-slate-200">Live Masterclass Tomorrow</div>
                    <div className="text-slate-400">Kafka Microservices Architecture at 7:00 PM IST</div>
                  </div>
                  <div className="p-2.5 bg-slate-800/80 rounded-xl space-y-1">
                    <div className="font-bold text-slate-200">Assignment Graded</div>
                    <div className="text-slate-400">Capstone 1 scored 95/100</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student Profile Card (Desktop only) */}
          <Link
            href="/dashboard/payments"
            className="hidden lg:flex items-center space-x-2 bg-slate-900 hover:bg-slate-800/90 p-1.5 pr-2.5 rounded-2xl border border-slate-800 shadow-inner transition group"
            title="View Billing History & GST Invoices"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition">
              {user?.avatarBadge || 'RS'}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-extrabold text-slate-100 truncate max-w-[100px] group-hover:text-indigo-300 transition">{user?.name || 'Student Scholar'}</div>
              <div className="text-[10px] text-emerald-400 font-bold flex items-center mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 me-1"></span> Enrolled
              </div>
            </div>
          </Link>

          {/* Desktop Direct Sign Out Button */}
          <button
            onClick={handleLogout}
            className="hidden xl:flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-600/20 text-red-400 hover:text-red-300 border border-slate-700/60 transition text-xs font-bold items-center space-x-1.5 whitespace-nowrap"
            title="Sign Out"
          >
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
            <span>Sign Out</span>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-10 h-10 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
            aria-label="Toggle Navigation Menu"
          >
            <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-950 border-t border-slate-800 px-4 py-5 space-y-4 max-h-[80vh] overflow-y-auto pb-8 animate-fade-in-up">
          
          {/* Mobile Student Profile Header with the ONLY Mobile Sign Out Button */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  {user?.avatarBadge || 'RS'}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-white truncate">{user?.name || 'Student Scholar'}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[170px]">{user?.email || 'student@example.com'}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold shrink-0">
                Enrolled
              </span>
            </div>

            {/* ONLY ONE Sign Out Button on Mobile */}
            <button
              onClick={handleLogout}
              className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs transition flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Sign Out of Student Portal</span>
            </button>
          </div>

          {/* Primary Mobile Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-1">Primary Navigation</div>
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition flex items-center space-x-3 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-base`}></i>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Secondary Tools Grid */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-1">Learning Tools</div>
            <div className="grid grid-cols-2 gap-2">
              {secondaryTools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center space-x-2 border border-slate-800"
                >
                  <i className={`fa-solid ${tool.icon} text-indigo-400`}></i>
                  <span>{tool.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
