'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function HeaderNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      setIsNativeApp(true);
    }

    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } catch {
        // Not logged in or anonymous visitor
      }
    }
    checkAuth();
  }, []);

  if (isNativeApp) {
    return null;
  }

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
    } catch (err) {
      console.error(err);
    } finally {
      window.location.href = '/login?switch=true';
    }
  };

  const navLinks = [
    { name: 'Courses', href: '/courses' },
    { name: 'Live Jobs', href: '/jobs', badge: '780+' },
    { name: 'LMS Tour', href: '/#lms-tour' },
    { name: 'Why Us', href: '/#why-choose-us' },
    { name: 'Outcomes', href: '/outcomes' },
    { name: 'Code Arena', href: '/code-arena' },
    { name: 'Webinars', href: '/webinars' },
  ];

  return (
    <>
      {/* Top Announcement Banner */}
      <div className="bg-slate-950 text-slate-200 text-[11px] sm:text-xs font-semibold py-1.5 sm:py-2 px-3 sm:px-4 text-center border-b border-slate-800 relative z-50 flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        <span className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide border border-indigo-500/30 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping me-1"></span> Cohort Active
        </span>
        <span className="text-slate-300">
          Fall 2026 Java Full Stack &amp; GenAI.
          <Link href="/courses" className="text-indigo-400 font-bold underline hover:text-indigo-300 ml-1 transition-colors whitespace-nowrap">
            View Syllabus &rarr;
          </Link>
        </span>
      </div>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 sm:py-3.5 shadow-xs transition-all w-full overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 cursor-pointer group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
              Education <span className="text-indigo-600">Algorithm</span>
            </span>
          </Link>

          {/* Desktop Nav Links with Active Indicator */}
          <div className="hidden xl:flex items-center space-x-3 2xl:space-x-5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors py-1 border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs uppercase tracking-tight">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Action Buttons & Auth Status */}
          <div className="flex items-center space-x-2 shrink-0">
            {user ? (
              <div className="flex items-center space-x-2">
                {user.role === 'instructor' && (
                  <Link
                    href="/instructor"
                    className="hidden sm:flex px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <i className="fa-solid fa-chalkboard-user text-xs"></i>
                    <span>Instructor Studio</span>
                  </Link>
                )}
                {user.role === 'student' && (
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition items-center space-x-1.5 shadow-sm shrink-0"
                  >
                    <i className="fa-solid fa-graduation-cap text-xs"></i>
                    <span>Student LMS</span>
                  </Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin"
                      className="hidden sm:flex px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition items-center space-x-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-user-shield text-xs"></i>
                      <span>Admin</span>
                    </Link>
                    <Link
                      href="/instructor"
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition hidden md:flex items-center space-x-1.5 shadow-sm"
                    >
                      <i className="fa-solid fa-chalkboard-user text-xs"></i>
                      <span>Faculty</span>
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 text-sm font-bold transition border border-slate-200 items-center justify-center"
                  title="Sign Out"
                >
                  <i className="fa-solid fa-right-from-bracket"></i>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 text-xs font-extrabold uppercase tracking-wider transition hidden sm:flex items-center space-x-1.5 shrink-0"
                >
                  <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                  <span>Student LMS</span>
                </Link>

                <Link
                  href="/checkout"
                  className="hidden sm:flex px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-md shadow-indigo-600/20 transition whitespace-nowrap items-center space-x-1.5 shrink-0"
                >
                  <span>Enroll Now</span>
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden w-10 h-10 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition focus:outline-none shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden pt-4 pb-6 px-4 space-y-3 border-t border-slate-200 mt-3 font-bold text-sm text-slate-700">
            {/* User Profile Card on Mobile if Logged in */}
            {user && (
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm text-white truncate">{user.name || 'Active User'}</div>
                    <div className="text-xs text-slate-400 truncate">{user.email}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold uppercase shrink-0">
                    {user.role}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {user.role === 'student' && (
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-graduation-cap"></i>
                      <span>Open Student LMS Portal</span>
                    </Link>
                  )}
                  {user.role === 'instructor' && (
                    <Link
                      href="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-chalkboard-user"></i>
                      <span>Open Faculty Studio</span>
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-center rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-user-shield"></i>
                      <span>Open Admin Console</span>
                    </Link>
                  )}
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
                  >
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 hover:text-indigo-600 flex items-center justify-between"
              >
                <span>{link.name}</span>
                {link.badge && (
                  <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}

            {!user && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-extrabold flex items-center space-x-2 border border-slate-200"
                >
                  <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
                  <span>Student LMS Login</span>
                </Link>

                <Link
                  href="/checkout"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center rounded-xl font-extrabold text-xs uppercase tracking-wider block shadow-md"
                >
                  Enroll in Cohort &rarr;
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
