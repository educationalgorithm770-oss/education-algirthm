'use client';

import React from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';

export default function AdminMockInterviewsPage() {
  const bookings = [
    { id: 'MOCK-9812', student: 'Rahul Sharma', mentor: 'Rahul Sharma (Amazon SDE 2)', track: 'System Design', time: 'Sep 10, 19:00 IST', meet: 'https://meet.google.com/ea-mock-1', status: 'CONFIRMED' },
    { id: 'MOCK-9813', student: 'Priya Patel', mentor: 'Priya Patel (GCP Staff Architect)', track: 'GenAI RAG', time: 'Sep 11, 20:30 IST', meet: 'https://meet.google.com/ea-mock-2', status: 'CONFIRMED' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminNavbar />

      <main className="py-10 px-6 max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-black uppercase">
              ⚙️ Admin Mock Interview Coordinator
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">1-on-1 SDE Mock Schedule &amp; Mentor Roster</h1>
          </div>
          <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5">
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Add Senior Mentor Profile</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 font-extrabold text-slate-900 text-base">
            Active Mock Interview Bookings ({bookings.length})
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">Student</th>
                  <th className="py-3.5 px-6">Assigned Mentor</th>
                  <th className="py-3.5 px-6">Track</th>
                  <th className="py-3.5 px-6">Scheduled Time</th>
                  <th className="py-3.5 px-6">Meet Link</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="py-4 px-6 font-bold text-slate-900">{b.student}</td>
                    <td className="py-4 px-6 font-bold text-indigo-900">{b.mentor}</td>
                    <td className="py-4 px-6 font-bold text-purple-700">{b.track}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">{b.time}</td>
                    <td className="py-4 px-6 font-mono text-xs text-indigo-600 underline">
                      <a href={b.meet} target="_blank" rel="noreferrer">{b.meet}</a>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-bold text-[10px]">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
