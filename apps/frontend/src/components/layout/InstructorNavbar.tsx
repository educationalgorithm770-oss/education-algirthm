'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function InstructorNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [instructor, setInstructor] = useState<{ name: string; email: string; title?: string } | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadFaculty() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          setInstructor(data.user);
        }
      } catch {
        // Fallback
      }
    }
    loadFaculty();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (switchRef.current && !switchRef.current.contains(event.target as Node)) {
        setSwitchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = instructor?.name || 'Dr. Sarah Jenkins';
  const displayEmail = instructor?.email || 'java@educationalgorithm.com';
  const displayTitle = instructor?.title || 'Lead Faculty & Mentor';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const instructorNavLinks = [
    { name: 'Dashboard', href: '/instructor', icon: 'fa-gauge-high' },
    { name: 'Courses', href: '/instructor/courses', icon: 'fa-shapes' },
    { name: 'Live Classes', href: '/instructor/live', icon: 'fa-tower-broadcast' },
    { name: 'Doubts', href: '/instructor/doubts', icon: 'fa-comments' },
    { name: 'Quizzes', href: '/instructor/quizzes', icon: 'fa-circle-question' },
    { name: 'Announcements', href: '/instructor/announcements', icon: 'fa-bullhorn' },
  ];

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error(err);
    } finally {
      window.location.href = '/login?switch=true';
    }
  };

  return (
    <header className="w-full bg-[#0b1120] text-white border-b border-slate-800 sticky top-0 z-50 shadow-2xl select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-2 shrink-0">
          <Link href="/instructor" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <i className="fa-solid fa-chalkboard-user"></i>
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              Education <span className="text-emerald-400">Algorithm</span>
            </span>
          </Link>
          <span className="hidden 2xl:inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Faculty</span>
          </span>
        </div>

        {/* Center: Centered Segmented Navigation Bar */}
        <nav className="hidden xl:flex items-center bg-[#111928]/90 p-1 rounded-2xl border border-slate-800/90 shadow-inner space-x-0.5 shrink-0">
          {instructorNavLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`h-8 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <i className={`fa-solid ${link.icon} text-xs ${isActive ? 'text-white' : 'text-emerald-400/80'}`}></i>
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Portal Switcher & Profile Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Switch View Dropdown */}
          <div className="relative" ref={switchRef}>
            <button
              onClick={() => { setSwitchOpen(!switchOpen); setProfileOpen(false); }}
              className="hidden sm:flex items-center space-x-1.5 h-10 px-3 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 text-slate-200 text-xs font-bold transition shrink-0"
              title="Switch Active View"
            >
              <i className="fa-solid fa-arrow-right-arrow-left text-emerald-400 text-xs"></i>
              <span className="hidden md:inline">Switch</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
            </button>

            {switchOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#0c1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ring-1 ring-white/10">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Switch Active Portal
                </div>
                <div className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2.5">
                  <i className="fa-solid fa-chalkboard-user text-emerald-400 text-xs w-4"></i>
                  <div>
                    <div>Faculty Studio (Active)</div>
                    <div className="text-[10px] font-normal text-emerald-300/80">Teaching &amp; doubts desk</div>
                  </div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setSwitchOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-purple-600 hover:text-white transition flex items-center space-x-2.5 group"
                >
                  <i className="fa-solid fa-shield-halved text-purple-400 group-hover:text-white text-xs w-4"></i>
                  <div>
                    <div>Admin Console</div>
                    <div className="text-[10px] font-normal text-slate-400 group-hover:text-purple-100">Full system governance</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setSwitchOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:text-white transition flex items-center space-x-2.5 group"
                >
                  <i className="fa-solid fa-graduation-cap text-indigo-400 group-hover:text-white text-xs w-4"></i>
                  <div>
                    <div>Student LMS Portal</div>
                    <div className="text-[10px] font-normal text-slate-400 group-hover:text-indigo-100">Course viewer &amp; sandbox</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Profile Command Center Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen(!profileOpen); setSwitchOpen(false); }}
              className="flex items-center space-x-2 h-10 px-2 sm:px-3 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 transition shrink-0"
              title="Account & Profile Settings"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left max-w-[100px]">
                <div className="font-bold text-xs text-white leading-tight truncate">{displayName}</div>
              </div>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#0c1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2 ring-1 ring-white/10">
                
                {/* User Info Card */}
                <div className="p-3 bg-[#141d33] rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-md shrink-0">
                      {initials}
                    </div>
                    <div className="overflow-hidden">
                      <div className="font-bold text-xs text-white truncate">{displayName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{displayEmail}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold truncate">{displayTitle}</div>
                    </div>
                  </div>
                </div>

                {/* Profile Links */}
                <div className="space-y-1">
                  <Link
                    href="/instructor/profile"
                    onClick={() => setProfileOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2.5"
                  >
                    <i className="fa-solid fa-id-badge text-emerald-400 text-xs w-4"></i>
                    <span>Profile Editor</span>
                  </Link>
                  <Link
                    href="/instructor/doubts"
                    onClick={() => setProfileOpen(false)}
                    className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2.5"
                  >
                    <i className="fa-solid fa-comments text-indigo-400 text-xs w-4"></i>
                    <span>Doubt Resolution Desk</span>
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition flex items-center space-x-2.5 cursor-pointer"
                  >
                    <i className="fa-solid fa-right-from-bracket text-xs w-4"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Sign Out Button (Visible on Navbar) */}
          <button
            onClick={handleLogout}
            className="hidden sm:flex px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-800/50 transition items-center space-x-1.5 shrink-0 whitespace-nowrap cursor-pointer shadow-xs"
            title="Sign Out of Faculty Studio"
          >
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
            <span>Sign Out</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden w-10 h-10 rounded-xl bg-[#141d33] text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center text-base cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#0c1322] border-t border-slate-800 px-4 py-4 space-y-4 max-h-[80vh] overflow-y-auto pb-24 animate-fade-in-up">
          {/* Mobile Faculty Profile Card with Single Sign-Out */}
          <div className="p-3.5 bg-[#141d33] rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-white truncate">{displayName}</div>
                  <div className="text-xs text-slate-400 truncate max-w-[170px]">{displayEmail}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold shrink-0">
                Faculty
              </span>
            </div>

            {/* ONLY ONE Sign Out Button on Mobile */}
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Sign Out of Faculty Studio</span>
            </button>
          </div>

          {/* Primary Navigation Links */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-1">Faculty Navigation</div>
            {instructorNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-bold transition flex items-center space-x-3 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${link.icon} text-base ${isActive ? 'text-white' : 'text-emerald-400'}`}></i>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Portal Switcher in Drawer */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-1">Switch Portals</div>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-purple-300 text-xs font-bold transition flex items-center space-x-3 border border-slate-800"
            >
              <i className="fa-solid fa-shield-halved"></i>
              <span>Admin Console</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold transition flex items-center space-x-3"
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Student LMS Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
