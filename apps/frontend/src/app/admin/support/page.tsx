'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface SupportTicket {
  id: string;
  rawId: number;
  student: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string;
  createdAt: string;
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatus, setTicketStatus] = useState('resolved');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/support');
      const data = await res.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (err) {
      console.error('Failed to load support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawId: selectedTicket.rawId,
          status: ticketStatus,
          adminReply: replyText,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessBanner(`Ticket #${selectedTicket.id} updated and reply logged.`);
        setTimeout(() => setSuccessBanner(''), 5000);
        setSelectedTicket(null);
        setReplyText('');
        await fetchTickets();
      }
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setSubmitting(false);
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
            <span>Learner Support Desk (Live MySQL)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Support Inquiries &amp; Helpdesk
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Resolve student technical issues, respond to doubt tickets, and manage platform inquiries.
          </p>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Tickets Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Active Support Tickets ({tickets.length})</h2>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading support tickets from database...</div>
          ) : tickets.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">No active support tickets found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-purple-700">{t.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{t.student}</div>
                      <div className="text-[11px] text-slate-400">{t.email}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{t.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setReplyText(t.adminReply || '');
                          setTicketStatus(t.status || 'resolved');
                        }}
                        className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-lg text-xs font-bold transition"
                      >
                        Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Resolve Ticket {selectedTicket.id}</h3>
                <span className="text-xs text-slate-500 font-medium">From: {selectedTicket.student} ({selectedTicket.email})</span>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Student Message:</div>
              <p className="text-xs font-medium text-slate-700">{selectedTicket.message}</p>
            </div>

            <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status</label>
                <CustomDropdown
                  value={ticketStatus}
                  onChange={(val) => setTicketStatus(val)}
                  options={[
                    { value: 'open', label: 'Open (Requires Action)', icon: '🔴' },
                    { value: 'in_progress', label: 'In Progress', icon: '🟡' },
                    { value: 'resolved', label: 'Resolved & Closed', icon: '🟢' }
                  ]}
                  variant="indigo"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Admin Response / Notes</label>
                <textarea
                  placeholder="Provide resolution details or advice for the student..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Updating...' : 'Save Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
