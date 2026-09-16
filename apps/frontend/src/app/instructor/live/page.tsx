'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface LiveSession {
  id: string;
  rawId: number;
  title: string;
  course: string;
  batch: string;
  date: string;
  time: string;
  scheduledAt: string;
  platform: 'Zoom' | 'Google Meet' | 'Live Studio';
  meetingUrl: string;
  status: 'upcoming' | 'live' | 'completed';
  enrolledStudents: number;
}

export default function InstructorLivePage() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('1');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const [liveRes, courseRes] = await Promise.all([
        fetch('/api/instructor/live'),
        fetch('/api/instructor/courses'),
      ]);
      const [liveData, courseData] = await Promise.all([
        liveRes.json(),
        courseRes.json(),
      ]);
      if (liveData.success && Array.isArray(liveData.sessions)) {
        setSessions(liveData.sessions);
      }
      if (courseData.success && Array.isArray(courseData.courses)) {
        setAvailableCourses(courseData.courses);
        if (courseData.courses.length > 0) {
          setCourseId(String(courseData.courses[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to fetch live sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.length < 5) {
      setErrorMsg('Session title must be at least 5 characters long.');
      return;
    }
    if (!date) {
      setErrorMsg('Please select a valid session date.');
      return;
    }
    if (!meetingUrl.trim()) {
      setErrorMsg('Meeting URL is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/instructor/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          courseId,
          date,
          time,
          meetingUrl: meetingUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowScheduleModal(false);
        setTitle('');
        setMeetingUrl('');
        setSuccessBanner(`Live Masterclass "${title}" scheduled and saved to MySQL live_classes!`);
        setTimeout(() => setSuccessBanner(''), 6000);
        await fetchSessions();
      } else {
        setErrorMsg(data.error || 'Failed to schedule session.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error scheduling session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>Live Masterclass Studio (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Live Session Studio & Broadcasts
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Schedule interactive webinars, generate join links, and send instant notifications to student cohorts.
            </p>
          </div>

          <button
            onClick={() => {
              setShowScheduleModal(true);
              setErrorMsg('');
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-calendar-plus"></i>
            <span>Schedule Live Class</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Sessions Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading live classes from database...</div>
        ) : sessions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
            <i className="fa-solid fa-tower-broadcast text-3xl text-emerald-300 block"></i>
            <p className="font-medium text-slate-600">No live sessions scheduled yet. Click "Schedule Live Class" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {session.course}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      session.status === 'live'
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : session.status === 'completed'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {session.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{session.title}</h3>

                  <div className="space-y-1 text-xs text-slate-500">
                    <p className="flex items-center space-x-1.5">
                      <i className="fa-regular fa-calendar text-emerald-600"></i>
                      <span>{session.scheduledAt ? new Date(session.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : session.date}</span>
                    </p>
                    <p className="flex items-center space-x-1.5">
                      <i className="fa-solid fa-video text-indigo-600"></i>
                      <span>{session.platform}</span>
                    </p>
                  </div>
                </div>

                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  <span>Launch Live Room</span>
                </a>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <i className="fa-solid fa-calendar-plus text-emerald-600"></i>
                <span>Schedule New Live Class</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Target Track / Course</label>
                <CustomDropdown
                  value={courseId}
                  onChange={(val) => setCourseId(val)}
                  options={availableCourses.map((c) => ({
                    value: String(c.id),
                    label: `${c.title} (${c.level || 'Live Track'})`,
                    icon: '📡'
                  }))}
                  variant="emerald"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Class Title</label>
                <input
                  type="text"
                  placeholder="e.g. Microservices Distributed Tracing with Zipkin"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Time (IST)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meeting Room URL (Zoom / Google Meet)</label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Save & Broadcast Session'}
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
