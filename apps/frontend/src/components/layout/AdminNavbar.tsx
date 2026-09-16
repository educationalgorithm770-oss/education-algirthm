'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ToolItem {
  name: string;
  href: string;
  icon: string;
  desc: string;
}

interface Department {
  id: string;
  title: string;
  icon: string;
  color: string;
  tools: ToolItem[];
}

const DEPARTMENTS: Department[] = [
  {
    id: 'academics',
    title: 'Academics',
    icon: 'fa-graduation-cap',
    color: 'text-indigo-400',
    tools: [
      { name: 'Course Studio', href: '/admin/courses', icon: 'fa-book-open', desc: 'Curriculum builder & video lessons' },
      { name: 'Assignment Grading', href: '/admin/assignments', icon: 'fa-clipboard-check', desc: 'Review code submissions & issue grades' },
      { name: 'Capstones CMS', href: '/admin/projects', icon: 'fa-diagram-project', desc: 'Real-world enterprise project library' },
      { name: 'RAG Question Bank', href: '/admin/question-bank', icon: 'fa-book-bookmark', desc: 'AI-indexed technical question repository' },
      { name: 'Quiz Builder', href: '/admin/quizzes', icon: 'fa-circle-question', desc: 'Assessments, timers & automated scoring' },
    ],
  },
  {
    id: 'ai-labs',
    title: 'AI & Labs',
    icon: 'fa-brain',
    color: 'text-purple-400',
    tools: [
      { name: 'AI Studio & Playground', href: '/admin/ai-studio', icon: 'fa-robot', desc: 'Prompt engineer & test Gemini LLM models' },
      { name: 'Mock Coordinator', href: '/admin/mock-interviews', icon: 'fa-user-check', desc: 'Schedule & evaluate 1-on-1 mock interviews' },
      { name: 'Code Sandbox Arena', href: '/code-arena', icon: 'fa-terminal', desc: 'Multi-language Piston isolated runtime' },
    ],
  },
  {
    id: 'cohorts',
    title: 'Cohort & Ops',
    icon: 'fa-users-gear',
    color: 'text-emerald-400',
    tools: [
      { name: 'Student Directory', href: '/admin/students', icon: 'fa-users', desc: 'Profiles, enrollments & attendance records' },
      { name: 'Manual Enrollment', href: '/admin/enrollments', icon: 'fa-user-plus', desc: 'Enroll students into cohort tracks instantly' },
      { name: 'Webinars Studio', href: '/admin/webinars', icon: 'fa-tower-broadcast', desc: 'Manage live masterclasses & attendee leads' },
      { name: 'Live Classes Monitor', href: '/admin/live-classes', icon: 'fa-video', desc: 'Zoom & WebRTC live lecture schedule' },
      { name: 'Faculty Roster', href: '/admin/instructors', icon: 'fa-chalkboard-user', desc: 'Staff access, payouts & instructor desks' },
      { name: 'Lead CRM', href: '/admin/leads', icon: 'fa-headset', desc: 'Counseling inquiries & admission conversion' },
      { name: 'Tech Job Board CMS', href: '/admin/jobs', icon: 'fa-briefcase', desc: 'Hiring partner job openings & referrals' },
    ],
  },
  {
    id: 'finance-system',
    title: 'Finance & System',
    icon: 'fa-chart-line',
    color: 'text-amber-400',
    tools: [
      { name: 'Finance Hub', href: '/admin/finance', icon: 'fa-wallet', desc: 'Razorpay transactions, payouts & invoices' },
      { name: 'Scholarships', href: '/admin/scholarships', icon: 'fa-award', desc: 'Merit-based fee concessions & waivers' },
      { name: 'Notifications Center', href: '/admin/notifications', icon: 'fa-bullhorn', desc: 'Broadcast global alerts, emails & SMS' },
      { name: 'Support Tickets', href: '/admin/support', icon: 'fa-ticket', desc: 'Helpdesk issues & grievance resolution' },
      { name: 'System & Audit Log', href: '/admin/system', icon: 'fa-shield-halved', desc: 'Server health, MySQL telemetry & logs' },
    ],
  },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewSwitcherOpen, setViewSwitcherOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const deptNavRef = useRef<HTMLDivElement>(null);
  const viewSwitcherRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Global Keyboard shortcut: Ctrl+K / Cmd+K opens Command Palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setActiveDept(null);
        setViewSwitcherOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (deptNavRef.current && !deptNavRef.current.contains(e.target as Node)) {
        setActiveDept(null);
      }
      if (viewSwitcherRef.current && !viewSwitcherRef.current.contains(e.target as Node)) {
        setViewSwitcherOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error(err);
    } finally {
      window.location.href = '/login?switch=true';
    }
  };

  // Flattened tools list for instant search
  const allTools = DEPARTMENTS.flatMap((d) => d.tools);
  const searchResults = allTools.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="bg-[#0b1120] text-white border-b border-slate-800 sticky top-0 z-50 shadow-2xl w-full select-none">
      
      {/* ── TIER 1: BRAND, GLOBAL SEARCH & USER CONTROLS (64px) ── */}
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 sm:gap-4 border-b border-slate-800/60">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
          <Link href="/admin" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-sm font-black shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200 shrink-0">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <span className="font-black text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              Education <span className="text-purple-400">Algorithm</span>
            </span>
          </Link>

          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span>Console</span>
          </span>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full px-3.5 py-2 bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-between shadow-inner"
          >
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-magnifying-glass text-purple-400 text-xs"></i>
              <span className="font-medium">Search tools, courses, students...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-[#0b1120] text-slate-400 border border-slate-700 rounded-md">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Status, View Switcher & Profile Command Center */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden w-10 h-10 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 text-purple-400 hover:text-white transition flex items-center justify-center shrink-0"
            title="Search tools..."
            aria-label="Search"
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </button>

          {/* Live System Status Pill (Desktop only) */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#141d33] border border-slate-800 rounded-xl text-[11px] font-bold text-emerald-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>MySQL 8 Live</span>
          </div>

          {/* Unified View Switcher Dropdown (Desktop only) */}
          <div className="hidden lg:block relative" ref={viewSwitcherRef}>
            <button
              onClick={() => setViewSwitcherOpen(!viewSwitcherOpen)}
              className="px-3 py-2 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 text-slate-200 text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
              title="Switch Learning Portal View"
            >
              <i className="fa-solid fa-arrow-right-arrow-left text-indigo-400 text-[11px]"></i>
              <span>Switch View</span>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400"></i>
            </button>

            {viewSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-[#0c1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ring-1 ring-white/10">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Switch Active Role
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setViewSwitcherOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:text-white transition flex items-center space-x-2.5 group"
                >
                  <i className="fa-solid fa-graduation-cap text-indigo-400 group-hover:text-white text-xs w-4"></i>
                  <div>
                    <div>Student LMS Portal</div>
                    <div className="text-[10px] font-normal text-slate-400 group-hover:text-indigo-100">Course player &amp; labs</div>
                  </div>
                </Link>
                <Link
                  href="/instructor"
                  onClick={() => setViewSwitcherOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-emerald-600 hover:text-white transition flex items-center space-x-2.5 group"
                >
                  <i className="fa-solid fa-chalkboard-user text-emerald-400 group-hover:text-white text-xs w-4"></i>
                  <div>
                    <div>Instructor Studio</div>
                    <div className="text-[10px] font-normal text-slate-400 group-hover:text-emerald-100">Faculty desk &amp; live classes</div>
                  </div>
                </Link>
                <div className="px-3 py-2 rounded-xl text-xs font-bold bg-purple-600/20 border border-purple-500/40 text-purple-300 flex items-center space-x-2.5">
                  <i className="fa-solid fa-shield-halved text-purple-400 text-xs w-4"></i>
                  <div>
                    <div>Admin Console (Active)</div>
                    <div className="text-[10px] font-normal text-purple-300/80">Full governance &amp; curricula</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Popover (Desktop/Tablet only) */}
          <div className="hidden sm:block relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#141d33] hover:bg-[#1a2540] border border-slate-700/80 text-white transition shrink-0"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                FA
              </div>
              <div className="hidden xl:block text-left whitespace-nowrap">
                <div className="font-bold text-xs text-white leading-tight">Dr. Aris V.</div>
                <div className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider">Super Admin</div>
              </div>
              <i className="fa-solid fa-chevron-down text-[9px] text-slate-400 ml-0.5"></i>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0c1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ring-1 ring-white/10">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-white">Dr. Aris V.</div>
                  <div className="text-[10px] text-slate-400 truncate">admin@educationalgorithm.com</div>
                </div>

                <Link
                  href="/login?switch=true"
                  onClick={() => setProfileOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
                >
                  <i className="fa-solid fa-arrow-right-to-bracket text-emerald-400 text-xs w-4"></i>
                  <span>Switch / Login Account</span>
                </Link>

                <Link
                  href="/admin/system"
                  onClick={() => setProfileOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center space-x-2"
                >
                  <i className="fa-solid fa-gear text-purple-400 text-xs w-4"></i>
                  <span>System Diagnostics</span>
                </Link>

                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/50 hover:text-rose-200 transition flex items-center space-x-2 text-left"
                  >
                    <i className="fa-solid fa-right-from-bracket text-xs w-4"></i>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Sign Out Button (Desktop only) */}
          <button
            onClick={handleLogout}
            className="hidden xl:flex px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-800/50 transition items-center space-x-1.5 shrink-0 whitespace-nowrap"
            title="Sign Out of Admin Console"
          >
            <i className="fa-solid fa-right-from-bracket text-xs"></i>
            <span>Sign Out</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#141d33] text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 shrink-0 transition"
            aria-label="Toggle Navigation"
          >
            <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'} text-base`}></i>
          </button>
        </div>
      </div>

      {/* ── TIER 2: DEPARTMENT NAVIGATION TABS STRIP (38px) ── */}
      <div className="hidden lg:block bg-[#080d18] border-b border-slate-800/80">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 flex items-center justify-between" ref={deptNavRef}>
          
          {/* Department Tabs */}
          <div className="flex items-center space-x-1 py-1">
            
            {/* Overview Link */}
            <Link
              href="/admin"
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
                pathname === '/admin'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <i className="fa-solid fa-chart-pie text-xs opacity-90"></i>
              <span>Dashboard Overview</span>
            </Link>

            {/* Department Dropdowns */}
            {DEPARTMENTS.map((dept) => {
              const isDeptActive = activeDept === dept.id;
              const hasActiveChild = dept.tools.some((t) => t.href === pathname);

              return (
                <div key={dept.id} className="relative">
                  <button
                    onClick={() => setActiveDept(isDeptActive ? null : dept.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
                      hasActiveChild
                        ? 'bg-purple-900/50 text-purple-200 border border-purple-500/40 shadow-xs'
                        : isDeptActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <i className={`fa-solid ${dept.icon} text-xs ${dept.color}`}></i>
                    <span>{dept.title}</span>
                    <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono text-slate-300">
                      {dept.tools.length}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-[9px] transition-transform duration-150 ${isDeptActive ? 'rotate-180' : ''}`}></i>
                  </button>

                  {/* Department Solid Dropdown Menu */}
                  {isDeptActive && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-[#0c1322] border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 ring-1 ring-white/10">
                      <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
                        {dept.title} Management
                      </div>
                      {dept.tools.map((tool) => {
                        const isCurrent = pathname === tool.href;
                        return (
                          <Link
                            key={tool.name}
                            href={tool.href}
                            onClick={() => setActiveDept(null)}
                            className={`p-2 rounded-xl transition flex flex-col text-left ${
                              isCurrent
                                ? 'bg-purple-600 text-white shadow-md'
                                : 'hover:bg-[#141d33] text-slate-200 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <i className={`fa-solid ${tool.icon} text-xs w-4 text-center ${isCurrent ? 'text-white' : dept.color}`}></i>
                              <span className="text-xs font-bold truncate">
                                {tool.name}
                              </span>
                            </div>
                            <p className={`text-[10px] mt-0.5 line-clamp-1 font-medium pl-6 ${isCurrent ? 'text-purple-100' : 'text-slate-400'}`}>
                              {tool.desc}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right hint in Tier 2 */}
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 bg-[#141d33] border border-slate-700 rounded text-[9px] font-mono font-bold text-slate-300">
              Ctrl+K
            </kbd>
            <span>to jump to any tool</span>
          </div>

        </div>
      </div>

      {/* ── GLOBAL COMMAND PALETTE SEARCH MODAL (⌘K / Ctrl+K) ── */}
      {searchOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-[#0c1322] border border-slate-700 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 space-y-3 ring-1 ring-white/10">
            
            {/* Search Input Box */}
            <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
              <i className="fa-solid fa-magnifying-glass text-purple-400 text-sm"></i>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search across all 19 admin tools (e.g. 'course', 'quiz', 'leads', 'finance')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-white placeholder-slate-500 text-sm font-bold focus:outline-none"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs"
              >
                ESC
              </button>
            </div>

            {/* Results List */}
            <div className="p-3 max-h-80 overflow-y-auto space-y-1">
              {searchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No tools found matching "{searchQuery}".
                </div>
              ) : (
                searchResults.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    onClick={() => setSearchOpen(false)}
                    className="p-3 rounded-2xl hover:bg-[#141d33] transition flex items-center justify-between group border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-950/60 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs">
                        <i className={`fa-solid ${tool.icon}`}></i>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-purple-300">
                          {tool.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {tool.desc}
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-arrow-right text-slate-500 group-hover:text-white text-xs mr-2 transition-transform group-hover:translate-x-1"></i>
                  </Link>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#080d18] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
              <span>Navigate with arrow keys</span>
              <span>19 Total Management Modules</span>
            </div>

          </div>
        </div>
      )}

      {/* ── MOBILE DRAWER ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-[#080d18] border-t border-slate-800 px-4 py-4 space-y-4 max-h-[85vh] overflow-y-auto pb-12">
          
          {/* Quick Admin Header & Sign Out */}
          <div className="p-3 bg-[#0c1322] rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                FA
              </div>
              <div className="text-left">
                <div className="font-bold text-xs text-white">Dr. Aris V.</div>
                <div className="text-[9px] text-purple-400 font-extrabold uppercase">Super Admin</div>
              </div>
            </div>
            <button
              onClick={() => { setMobileOpen(false); handleLogout(); }}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-right-from-bracket text-xs"></i>
              <span>Sign Out</span>
            </button>
          </div>

          {DEPARTMENTS.map((dept) => (
            <div key={dept.id} className="space-y-1">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 flex items-center space-x-2">
                <i className={`fa-solid ${dept.icon} ${dept.color}`}></i>
                <span>{dept.title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {dept.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 bg-[#0c1322] border border-slate-800 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-purple-600 transition flex items-center space-x-2.5"
                  >
                    <i className={`fa-solid ${tool.icon} text-xs w-4 text-center ${dept.color}`}></i>
                    <span>{tool.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold transition flex items-center space-x-2.5"
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Switch to Student LMS</span>
            </Link>
            <Link
              href="/instructor"
              onClick={() => setMobileOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold transition flex items-center space-x-2.5"
            >
              <i className="fa-solid fa-chalkboard-user"></i>
              <span>Switch to Instructor Studio</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

