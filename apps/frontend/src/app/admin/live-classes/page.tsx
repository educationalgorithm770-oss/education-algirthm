'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface LiveClass {
  id: number;
  courseId: number;
  title: string;
  courseTitle: string;
  instructor: string;
  meetLink: string;
  scheduledAt: string;
  duration: string;
  status: string;
}

interface CourseOption {
  id: number;
  title: string;
}

export default function AdminLiveClassesPage() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [formCourseId, setFormCourseId] = useState<number>(1);
  const [instructor, setInstructor] = useState('Prof. Lead Faculty');
  const [meetLink, setMeetLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState('60');
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClassesAndCourses = async () => {
    try {
      setLoading(true);
      const [classRes, courseRes] = await Promise.all([
        fetch('/api/admin/live-classes'),
        fetch('/api/courses'),
      ]);

      const classData = await classRes.json();
      if (classData.success && classData.classes) {
        setClasses(classData.classes);
      }

      const courseData = await courseRes.json();
      if (courseData.success && Array.isArray(courseData.courses)) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0) {
          setFormCourseId(courseData.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load live classes & courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndCourses();
  }, []);

  const handleScheduleClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !meetLink.trim() || !scheduledAt) {
      setErrorMsg('Please fill in title, meeting link, and scheduled date/time.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/admin/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          courseId: formCourseId,
          instructorName: instructor,
          meetLink,
          scheduledAt,
          durationMinutes: parseInt(duration) || 60,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setTitle(''); setMeetLink(''); setScheduledAt('');
        setSuccessBanner(`Live class "${title}" scheduled successfully.`);
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchClassesAndCourses();
      } else {
        setErrorMsg(data.error || 'Failed to schedule class.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this live class?')) return;
    try {
      const res = await fetch(`/api/admin/live-classes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setClasses((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete class:', err);
    }
  };

  // Filter classes by course
  const filteredClasses = selectedCourseFilter === 'all'
    ? classes
    : classes.filter((c) => c.courseId === selectedCourseFilter);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>Global Faculty Broadcasting Monitor (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Live Masterclasses &amp; Webinars
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Course-separated live schedules, Google Meet / Zoom conference rooms, and student attendance streaming.
            </p>
          </div>

          <button
            onClick={() => { setShowModal(true); setErrorMsg(''); }}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center space-x-2"
          >
            <i className="fa-solid fa-calendar-plus"></i>
            <span>Schedule Live Class</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-in fade-in">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* ── COURSE-BASED SEPARATION TABS FILTER ── */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-2 shadow-xs flex items-center space-x-2 overflow-x-auto">
          <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-3 shrink-0 flex items-center space-x-1.5">
            <i className="fa-solid fa-filter text-purple-500"></i>
            <span>Course Track:</span>
          </div>

          <button
            onClick={() => setSelectedCourseFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center space-x-2 shrink-0 ${
              selectedCourseFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>All Courses</span>
            <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono font-bold">
              {classes.length}
            </span>
          </button>

          {courses.map((course) => {
            const count = classes.filter((c) => c.courseId === course.id).length;
            const isSelected = selectedCourseFilter === course.id;

            return (
              <button
                key={course.id}
                onClick={() => setSelectedCourseFilter(course.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center space-x-2 shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <i className="fa-solid fa-graduation-cap text-[11px] text-purple-400"></i>
                <span className="truncate max-w-[200px]">{course.title}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Classes Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-2">
            <i className="fa-solid fa-spinner fa-spin text-2xl text-purple-600"></i>
            <div>Loading live class schedules from database...</div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
            <i className="fa-solid fa-tower-broadcast text-3xl text-purple-300 block"></i>
            <p className="font-bold text-slate-700">No live classes found for this course track.</p>
            <p className="text-slate-400 text-[11px]">Click "Schedule Live Class" above to create an interactive lecture.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredClasses.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4 hover:shadow-md transition border-l-4 border-l-purple-600"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-extrabold">
                      <i className="fa-solid fa-book-open text-[9px]"></i>
                      <span className="truncate max-w-xs">{c.courseTitle}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                      <i className="fa-solid fa-chalkboard-user text-purple-500"></i>
                      <span>{c.instructor}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      c.status === 'live' ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {c.status}
                    </span>
                    <button
                      onClick={() => handleDeleteClass(c.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                      title="Cancel Live Session"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-extrabold text-slate-900 leading-snug">{c.title}</h4>
                  <div className="mt-3 text-xs text-slate-600 space-y-2 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-slate-700">
                        <i className="fa-regular fa-clock text-purple-600 mr-2"></i>
                        <span>{new Date(c.scheduledAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-500 text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {c.duration}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Meeting Conference Room</span>
                      <a
                        href={c.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        <i className="fa-solid fa-video text-[10px]"></i>
                        <span>Launch Session ↗</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* Schedule Modal with Course Selector */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Schedule Live Session</h3>
                <p className="text-[11px] text-slate-500">Associate with a specific course track and faculty</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleScheduleClass} className="space-y-4 text-xs">
              
              {/* Target Course Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course Track</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                >
                  {courses.length === 0 ? (
                    <option value="1">Full-Stack Java Enterprise Mastery</option>
                  ) : (
                    courses.map((cr) => (
                      <option key={cr.id} value={cr.id}>
                        {cr.title}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enrolled students in this course will see this live session on their course dashboard.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Session Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Caching with Redis &amp; Kafka Deep Dive"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lead Instructor</label>
                <input
                  type="text"
                  placeholder="Prof. Sarah Jenkins"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Meeting / Webinar URL</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij or Zoom URL"
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-calendar-check"></i>
                  <span>{submitting ? 'Scheduling...' : 'Confirm Schedule'}</span>
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

