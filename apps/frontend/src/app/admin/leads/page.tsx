'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  source: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
            <i className="fa-solid fa-headset"></i>
            <span>Counseling &amp; Admissions CRM</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Student Leads &amp; Counseling Inquiries
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Manage inbound student inquiries, schedule counseling callbacks, and track converted leads directly in MySQL.
          </p>
        </div>

        {/* Lead Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
          <h2 className="text-base font-bold text-slate-900">Inbound Admission Inquiries ({leads.length})</h2>

          <table className="w-full min-w-[660px] text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 whitespace-nowrap">
              <tr>
                <th className="py-3 px-4">Lead ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Source Channel</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading leads from MySQL...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No student leads found in database.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">LD-{lead.id}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">{lead.name}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{lead.phone || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">{lead.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">{lead.source || 'Website Form'}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center ${
                          lead.status === 'converted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.status === 'contacted'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lead.status === 'converted' ? 'Enrolled Student' : lead.status === 'contacted' ? 'In Counseling' : 'New Inquiry'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {lead.status !== 'converted' ? (
                        <button
                          onClick={() => updateLeadStatus(lead.id, 'converted')}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-xs whitespace-nowrap inline-flex items-center space-x-1"
                        >
                          <span>Convert &amp; Enroll</span>
                          <span>&rarr;</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold whitespace-nowrap">Converted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
