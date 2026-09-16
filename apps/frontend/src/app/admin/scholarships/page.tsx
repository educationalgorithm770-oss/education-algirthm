'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface ScholarshipApplication {
  id: string;
  rawId: number;
  studentName: string;
  email: string;
  phone: string;
  course: string;
  originalFee: number;
  scholarshipAmount: number;
  finalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminScholarshipsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/scholarships');
      const data = await res.json();
      if (data.success && data.applications) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to load scholarships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (rawId: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch('/api/admin/scholarships', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Scholarship marked as ${status}.`);
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchApplications();
      }
    } catch (err) {
      console.error('Failed to update scholarship status:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
            <i className="fa-solid fa-award"></i>
            <span>Financial Aid &amp; Scholarships (Live MySQL)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Merit Scholarship Reservations
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Review student financial aid applications, verify eligibility criteria, and approve discounted course fee waivers.
          </p>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Applications Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Scholarship Applications ({applications.length})</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading scholarship applications from database...</div>
          ) : applications.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No scholarship applications found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Applicant</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Standard Fee</th>
                  <th className="py-3 px-4">Waiver Granted</th>
                  <th className="py-3 px-4">Payable Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{app.studentName}</div>
                      <div className="text-[11px] text-slate-400">{app.email} • {app.phone}</div>
                    </td>
                    <td className="py-3 px-4 text-purple-700 font-bold">{app.course}</td>
                    <td className="py-3 px-4 line-through text-slate-400">₹{app.originalFee.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">₹{app.scholarshipAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 font-black text-slate-900">₹{app.finalPrice.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleUpdateStatus(app.rawId, 'APPROVED')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(app.rawId, 'REJECTED')}
                        className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
