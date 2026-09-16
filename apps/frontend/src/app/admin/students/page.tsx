'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Student {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  enrolled_count: number;
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/students');
        const data = await res.json();
        if (data.success && Array.isArray(data.students)) {
          setStudents(data.students);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
          <div>
            <span className="px-3.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-extrabold uppercase tracking-wider">
              Student Directory
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
              Student Roster &amp; Account Management
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
              Search enrolled students, view active course subscriptions, and manage account statuses directly in MySQL.
            </p>
          </div>

          <Link href="/admin" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition shrink-0">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between gap-3">
          <div className="w-full sm:w-96">
            <input
              type="text"
              placeholder="Search student by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-purple-600 font-medium"
            />
          </div>
          <div className="text-xs text-slate-500 font-bold">
            Total Registered: {filteredStudents.length}
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-extrabold border-b border-slate-200/80 whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">Student Name &amp; Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4">Paid Courses</th>
                  <th className="py-3.5 px-4">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">Loading student directory from MySQL...</td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">No students match your query.</td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-sm">{st.name}</div>
                        <div className="text-xs text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-mono whitespace-nowrap">{st.phone || 'N/A'}</td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(st.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold inline-flex items-center">
                          {st.enrolled_count} Courses Enrolled
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border inline-flex items-center ${
                          st.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
