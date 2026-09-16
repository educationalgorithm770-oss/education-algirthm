'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setErrorMsg('Please enter both title and message.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message }),
      });
      const data = await res.json();

      if (data.success) {
        setTitle('');
        setMessage('');
        setSuccessBanner('Notification broadcasted to all students successfully.');
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchNotifications();
      } else {
        setErrorMsg(data.error || 'Failed to dispatch notification.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
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
            <i className="fa-solid fa-bullhorn"></i>
            <span>System Communications (Live MySQL)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
            Broadcast Announcements &amp; Notifications
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Push real-time alert banners, maintenance notices, and webinar reminders across student portals.
          </p>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-paper-plane text-purple-600"></i>
              <span>Compose Broadcast</span>
            </h2>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. System Maintenance Window Tonight"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message Body</label>
                <textarea
                  placeholder="Type announcement message visible to students..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 transition flex items-center justify-center space-x-2"
              >
                <i className="fa-solid fa-bullhorn"></i>
                <span>{submitting ? 'Broadcasting...' : 'Broadcast to All Students'}</span>
              </button>
            </form>
          </div>

          {/* Past Notifications List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-clock-rotate-left text-purple-600"></i>
              <span>Broadcast History ({notifications.length})</span>
            </h2>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading notification logs...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No broadcast announcements sent yet.</div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>

      <StudentFooter />
    </div>
  );
}
