'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface RecentStudent {
  id: number;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

interface AdminStats {
  totalStudents: number;
  activeEnrollments: number;
  totalRevenue: number;
  totalLeads: number;
  recentStudents: RecentStudent[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 w-full space-y-6 sm:space-y-8">
        
        {/* Admin Executive Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 sm:px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[11px] sm:text-xs font-extrabold uppercase tracking-wider">
                System Administration Hub
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span> MySQL Engine Connected
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Faculty Command &amp; Admin Console 👋
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Manage course curricula, launch published tracks, review real-time revenue, and manage student rosters.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              href="/admin/courses"
              className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-purple-600/20 transition flex items-center space-x-2"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Launch Course</span>
            </Link>

            <Link
              href="/admin/students"
              className="flex-1 sm:flex-initial justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 transition flex items-center space-x-2"
            >
              <i className="fa-solid fa-users text-purple-600 text-xs"></i>
              <span>View Roster</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Total Students</span>
              <i className="fa-solid fa-users text-purple-600"></i>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.totalStudents ?? 0).toLocaleString()} Registered
            </div>
            <div className="text-xs text-emerald-600 font-bold flex items-center">
              <i className="fa-solid fa-database me-1.5 text-xs"></i> Live Database Record
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Cohort Revenue</span>
              <i className="fa-solid fa-indian-rupee-sign text-emerald-600"></i>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {loading ? '...' : `₹${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            </div>
            <div className="text-xs text-slate-500 font-medium">Razorpay Verified Settlements</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>Paid Enrollments</span>
              <i className="fa-solid fa-graduation-cap text-indigo-600"></i>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.activeEnrollments ?? 0).toLocaleString()} Active
            </div>
            <div className="text-xs text-indigo-600 font-bold flex items-center">
              <i className="fa-solid fa-circle-check me-1.5 text-xs"></i> Verified LMS Access
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider text-slate-400">
              <span>CRM Inquiries / Leads</span>
              <i className="fa-solid fa-user-plus text-amber-500"></i>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {loading ? '...' : (stats?.totalLeads ?? 0).toLocaleString()} Leads
            </div>
            <div className="text-xs text-amber-600 font-bold flex items-center">
              <i className="fa-solid fa-bolt me-1.5 text-xs"></i> Admissions Pipeline
            </div>
          </div>
        </div>

        {/* 2-Column Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Recent Student Enrollments (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Recent Student Admissions</h2>
                <p className="text-xs text-slate-500">Real-time student registry from MySQL.</p>
              </div>
              <Link href="/admin/students" className="text-xs font-bold text-purple-600 hover:text-purple-700 transition">
                View Full Roster &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[540px] text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-extrabold border-y border-slate-200/80 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">Loading student activity...</td>
                    </tr>
                  ) : !stats?.recentStudents || stats.recentStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">No student registrations found in database.</td>
                    </tr>
                  ) : (
                    stats.recentStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[11px] text-slate-400">{student.email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(student.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center ${
                            student.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href="/admin/students"
                            className="inline-flex items-center space-x-1 whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 text-purple-700 border border-slate-200 font-bold transition text-[11px]"
                          >
                            <span>Manage</span>
                            <span>&rarr;</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: Faculty Tools & Management Shortcuts (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900">Faculty Management Tools</h2>

              <div className="space-y-3">
                <Link
                  href="/admin/courses"
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-purple-50/50 hover:border-purple-200 transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                      <i className="fa-solid fa-book-open"></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">Course Builder</div>
                      <div className="text-xs text-slate-500">Edit curriculum &amp; publish live</div>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
                </Link>

                <Link
                  href="/admin/students"
                  className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-purple-50/50 hover:border-purple-200 transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition">
                      <i className="fa-solid fa-users"></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition">Student Roster</div>
                      <div className="text-xs text-slate-500">Track progress &amp; enrollments</div>
                    </div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
                </Link>
              </div>
            </div>

            {/* System Status Note */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 to-indigo-900 text-white shadow-lg space-y-2">
              <div className="text-xs font-bold text-purple-300 uppercase tracking-wider">Database Status</div>
              <div className="text-sm font-extrabold">MySQL Engine Connected</div>
              <p className="text-xs text-purple-200 leading-relaxed">
                Live course builder, Razorpay transactions, and student authentication are synced with MySQL.
              </p>
            </div>
          </div>

        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
