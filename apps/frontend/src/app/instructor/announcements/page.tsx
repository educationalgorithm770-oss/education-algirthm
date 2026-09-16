'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface Announcement {
  id: string;
  rawId: number;
  title: string;
  body: string;
  targetCohort: string;
  sentAt: string;
  sentTo: number;
}

export default function InstructorAnnouncementsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('normal');
  const [courseId, setCourseId] = useState('1');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const [annRes, courseRes] = await Promise.all([
        fetch('/api/instructor/announcements'),
        fetch('/api/instructor/courses'),
      ]);
      const [annData, courseData] = await Promise.all([
        annRes.json(),
        courseRes.json(),
      ]);
      if (annData.success && Array.isArray(annData.announcements)) {
        setAnnouncements(annData.announcements);
      }
      if (courseData.success && Array.isArray(courseData.courses)) {
        setAvailableCourses(courseData.courses);
        if (courseData.courses.length > 0) {
          setCourseId(String(courseData.courses[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) { setFormError('Announcement title must be at least 5 characters.'); return; }
    if (!body.trim() || body.length < 10) { setFormError('Message body must be at least 10 characters.'); return; }

    try {
      setSubmitting(true);
      setFormError('');
      const res = await fetch('/api/instructor/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: Number(courseId) || 1,
          title: title.trim(),
          body: body.trim(),
          priority,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTitle('');
        setBody('');
        setSuccessBanner('Announcement broadcasted and saved to MySQL track_announcements!');
        setTimeout(() => setSuccessBanner(''), 6000);
        await fetchAnnouncements();
      } else {
        setFormError(data.error || 'Failed to send announcement.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error sending announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
            <i className="fa-solid fa-bullhorn"></i>
            <span>Cohort Communications (Live MySQL)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Batch Announcements &amp; Broadcasts</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Compose targeted messages to your enrolled student cohorts — deadline reminders, resource drops, rescheduling notices.</p>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i><span>{successBanner}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Compose Panel */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Compose New Announcement</h2>
            {formError && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center space-x-2">
                <i className="fa-solid fa-triangle-exclamation"></i><span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Course / Cohort</label>
                <CustomDropdown
                  value={courseId}
                  onChange={(val) => setCourseId(val)}
                  options={availableCourses.map((c) => ({
                    value: String(c.id),
                    label: `${c.title} (${c.level || 'Cohort Track'})`,
                    icon: '🎓'
                  }))}
                  variant="emerald"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Announcement Title</label>
                <input type="text" placeholder="e.g. Live Session Rescheduled to 7:30 PM IST" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Broadcast Priority</label>
                <CustomDropdown
                  value={priority}
                  onChange={(val) => setPriority(val)}
                  options={[
                    { value: 'normal', label: 'Standard Notification', icon: '📢' },
                    { value: 'urgent', label: 'Urgent / Important Alert', icon: '⚡', badge: 'URGENT' }
                  ]}
                  variant="emerald"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Message Body</label>
                <textarea rows={6} placeholder="Write your announcement message here..." value={body} onChange={(e) => setBody(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 leading-relaxed" required></textarea>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/25 flex items-center space-x-2 disabled:opacity-50">
                  <i className="fa-solid fa-paper-plane"></i><span>{submitting ? 'Broadcasting...' : 'Send Announcement'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* History Panel */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-h-[540px] overflow-y-auto">
            <h2 className="text-base font-bold text-slate-900">Broadcast History</h2>
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading history...</div>
            ) : announcements.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">No announcements broadcasted yet.</div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-emerald-600">{ann.targetCohort}</span>
                      <span className="text-slate-400">{ann.sentAt}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{ann.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">{ann.body}</p>
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
