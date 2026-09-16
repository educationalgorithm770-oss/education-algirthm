'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface WebinarItem {
  id: number;
  courseId: number;
  title: string;
  courseTitle: string;
  courseSlug: string;
  instructor: string;
  instructorTitle: string;
  meetLink: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  createdAt: string;
}

interface AttendeeLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  notes: string;
  createdAt: string;
}

interface CourseOption {
  id: number;
  title: string;
}

export default function AdminWebinarsPage() {
  const [webinars, setWebinars] = useState<WebinarItem[]>([]);
  const [attendees, setAttendees] = useState<AttendeeLead[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, live: 0, completed: 0, totalAttendees: 0 });
  const [loading, setLoading] = useState(true);

  // View tabs
  const [viewMode, setViewMode] = useState<'sessions' | 'attendees'>('sessions');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState<WebinarItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCourseId, setFormCourseId] = useState<number>(1);
  const [formInstructor, setFormInstructor] = useState('Dr. Sarah Jenkins');
  const [formMeetLink, setFormMeetLink] = useState('https://meet.google.com/new');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formDuration, setFormDuration] = useState('60');
  const [formStatus, setFormStatus] = useState<'upcoming' | 'live' | 'completed'>('upcoming');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [webRes, courseRes] = await Promise.all([
        fetch('/api/admin/webinars'),
        fetch('/api/courses'),
      ]);

      const webData = await webRes.json();
      if (webData.success) {
        setWebinars(webData.webinars || []);
        setAttendees(webData.attendees || []);
        if (webData.stats) setStats(webData.stats);
      }

      const courseData = await courseRes.json();
      if (courseData.success && Array.isArray(courseData.courses)) {
        setCourses(courseData.courses);
        if (courseData.courses.length > 0 && !formCourseId) {
          setFormCourseId(courseData.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load admin webinars data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenScheduleModal = () => {
    setEditingWebinar(null);
    setFormTitle('');
    setFormMeetLink('https://meet.google.com/');
    setFormInstructor('Dr. Sarah Jenkins');
    setFormDuration('60');
    setFormStatus('upcoming');
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    setFormScheduledAt(d.toISOString().slice(0, 16));
    setErrorMsg('');
    setShowScheduleModal(true);
  };

  const handleOpenEditModal = (w: WebinarItem) => {
    setEditingWebinar(w);
    setFormTitle(w.title);
    setFormCourseId(w.courseId);
    setFormInstructor(w.instructor);
    setFormMeetLink(w.meetLink);
    setFormDuration(String(w.durationMinutes || 60));
    setFormStatus(w.status === 'cancelled' ? 'upcoming' : w.status);
    if (w.scheduledAt) {
      const d = new Date(w.scheduledAt);
      setFormScheduledAt(d.toISOString().slice(0, 16));
    } else {
      setFormScheduledAt('');
    }
    setErrorMsg('');
    setShowScheduleModal(true);
  };

  const handleSaveWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMeetLink.trim() || !formScheduledAt) {
      setErrorMsg('Please fill in title, meet link, and date/time.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      if (editingWebinar) {
        // PUT update
        const res = await fetch('/api/admin/webinars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingWebinar.id,
            title: formTitle,
            courseId: formCourseId,
            instructorName: formInstructor,
            meetLink: formMeetLink,
            scheduledAt: formScheduledAt,
            durationMinutes: parseInt(formDuration) || 60,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowScheduleModal(false);
          setSuccessBanner(`Masterclass "${formTitle}" updated successfully.`);
          setTimeout(() => setSuccessBanner(''), 5000);
          await fetchData();
        } else {
          setErrorMsg(data.error || 'Failed to update webinar.');
        }
      } else {
        // POST create
        const res = await fetch('/api/admin/webinars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            courseId: formCourseId,
            instructorName: formInstructor,
            meetLink: formMeetLink,
            scheduledAt: formScheduledAt,
            durationMinutes: parseInt(formDuration) || 60,
            status: formStatus,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setShowScheduleModal(false);
          setSuccessBanner(`Masterclass "${formTitle}" scheduled successfully.`);
          setTimeout(() => setSuccessBanner(''), 5000);
          await fetchData();
        } else {
          setErrorMsg(data.error || 'Failed to schedule webinar.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (w: WebinarItem, newStatus: 'live' | 'upcoming' | 'completed') => {
    try {
      const res = await fetch('/api/admin/webinars', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: w.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessBanner(`Webinar status switched to "${newStatus.toUpperCase()}".`);
        setTimeout(() => setSuccessBanner(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDeleteWebinar = async (id: number) => {
    if (!confirm('Are you sure you want to remove this webinar session?')) return;
    try {
      const res = await fetch(`/api/admin/webinars?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setWebinars((prev) => prev.filter((w) => w.id !== id));
        setSuccessBanner('Webinar deleted successfully.');
        setTimeout(() => setSuccessBanner(''), 4000);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to delete webinar:', err);
    }
  };

  const handleCopyEmails = () => {
    const emails = attendees.map((a) => a.email).filter(Boolean).join(', ');
    if (emails) {
      navigator.clipboard.writeText(emails);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const filteredWebinars = useMemo(() => {
    return webinars.filter((w) => {
      if (selectedCourseFilter !== 'all' && w.courseId !== selectedCourseFilter) return false;
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(q);
        const matchInstructor = w.instructor.toLowerCase().includes(q);
        const matchCourse = w.courseTitle.toLowerCase().includes(q);
        if (!matchTitle && !matchInstructor && !matchCourse) return false;
      }
      return true;
    });
  }, [webinars, selectedCourseFilter, statusFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              <i className="fa-solid fa-tower-broadcast"></i>
              <span>Live Masterclass Broadcasting Hub (MySQL Connected)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Webinars &amp; Live Masterclasses Studio
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Control public masterclass schedules, toggle live broadcasting rooms, and manage attendee lead registrations.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/webinars"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-2 border border-slate-200"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-xs text-indigo-600"></i>
              <span>View Public Page ↗</span>
            </Link>

            <button
              onClick={handleOpenScheduleModal}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 flex items-center space-x-2"
            >
              <i className="fa-solid fa-calendar-plus"></i>
              <span>Schedule Masterclass</span>
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
            <i className="fa-solid fa-circle-check text-base"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Top KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase">
              <span>Total Masterclasses</span>
              <i className="fa-solid fa-video text-indigo-600"></i>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.total}</div>
            <div className="text-[11px] text-slate-400 font-medium">Across all engineering tracks</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase">
              <span>Upcoming Scheduled</span>
              <i className="fa-solid fa-calendar-day text-blue-600"></i>
            </div>
            <div className="text-2xl font-black text-blue-600">{stats.upcoming}</div>
            <div className="text-[11px] text-slate-400 font-medium">Active on countdown timer</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase">
              <span>Live Broadcasting</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            </div>
            <div className="text-2xl font-black text-red-600">{stats.live}</div>
            <div className="text-[11px] text-slate-400 font-medium">Currently streaming to students</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500 text-xs font-extrabold uppercase">
              <span>Seat Reservations</span>
              <i className="fa-solid fa-user-check text-emerald-600"></i>
            </div>
            <div className="text-2xl font-black text-emerald-600">{stats.totalAttendees}</div>
            <div className="text-[11px] text-slate-400 font-medium">High-intent prospective leads</div>
          </div>
        </div>

        {/* View Mode Switcher (Sessions vs Attendees CRM) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center space-x-2 ${
                viewMode === 'sessions'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-chalkboard-user"></i>
              <span>Masterclasses ({webinars.length})</span>
            </button>
            <button
              onClick={() => setViewMode('attendees')}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition flex items-center space-x-2 ${
                viewMode === 'attendees'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="fa-solid fa-users"></i>
              <span>Registered Leads &amp; Attendees ({attendees.length})</span>
            </button>
          </div>

          {viewMode === 'sessions' && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-60">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  placeholder="Filter sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <CustomDropdown
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'upcoming', label: 'Upcoming', icon: '📅' },
                  { value: 'live', label: 'Live Streaming', icon: '🔴' },
                  { value: 'completed', label: 'Completed / Archive', icon: '🏁' },
                ]}
                theme="light"
                size="sm"
              />
            </div>
          )}

          {viewMode === 'attendees' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyEmails}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center space-x-1.5"
              >
                <i className="fa-solid fa-copy text-indigo-600"></i>
                <span>{copySuccess ? 'Copied Emails!' : 'Copy All Emails'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── SESSIONS VIEW ── */}
        {viewMode === 'sessions' && (
          <div className="space-y-6">
            {/* Course Filter Tabs */}
            <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex items-center space-x-2 overflow-x-auto">
              <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-3 shrink-0 flex items-center space-x-1.5">
                <i className="fa-solid fa-filter text-indigo-500"></i>
                <span>Track:</span>
              </div>

              <button
                onClick={() => setSelectedCourseFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center space-x-2 shrink-0 ${
                  selectedCourseFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>All Courses</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-mono font-bold">
                  {webinars.length}
                </span>
              </button>

              {courses.map((course) => {
                const count = webinars.filter((w) => w.courseId === course.id).length;
                const isSelected = selectedCourseFilter === course.id;

                return (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseFilter(course.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap flex items-center space-x-2 shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <i className="fa-solid fa-graduation-cap text-[11px] text-indigo-400"></i>
                    <span className="truncate max-w-[200px]">{course.title}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sessions Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-slate-400 text-xs space-y-2">
                <i className="fa-solid fa-spinner fa-spin text-2xl text-indigo-600"></i>
                <div>Loading live webinars from database...</div>
              </div>
            ) : filteredWebinars.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm space-y-3">
                <i className="fa-solid fa-tower-broadcast text-3xl text-indigo-300 block"></i>
                <p className="font-bold text-slate-700">No masterclasses found matching the selected filters.</p>
                <p className="text-slate-400 text-[11px]">Click "Schedule Masterclass" above to create an interactive lecture.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredWebinars.map((w) => (
                  <div
                    key={w.id}
                    className={`bg-white border rounded-3xl p-6 shadow-sm space-y-5 hover:shadow-md transition flex flex-col justify-between ${
                      w.status === 'live'
                        ? 'border-red-300 border-l-4 border-l-red-600 ring-2 ring-red-50'
                        : 'border-slate-200/80 border-l-4 border-l-indigo-600'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                        <div className="space-y-1">
                          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold">
                            <i className="fa-solid fa-book-open text-[9px]"></i>
                            <span className="truncate max-w-xs">{w.courseTitle}</span>
                          </div>
                          <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                            <i className="fa-solid fa-chalkboard-user text-indigo-500"></i>
                            <span>{w.instructor}</span>
                            <span className="text-[10px] text-slate-400 font-medium">({w.instructorTitle})</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 ${
                              w.status === 'live'
                                ? 'bg-red-100 text-red-700 animate-pulse'
                                : w.status === 'upcoming'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {w.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping mr-1"></span>}
                            <span>{w.status}</span>
                          </span>

                          <button
                            onClick={() => handleOpenEditModal(w)}
                            className="text-slate-400 hover:text-indigo-600 p-1.5 transition"
                            title="Edit Masterclass"
                          >
                            <i className="fa-solid fa-pen text-xs"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteWebinar(w.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 transition"
                            title="Delete Masterclass"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-extrabold text-slate-900 leading-snug">{w.title}</h4>

                      {/* Details Box */}
                      <div className="text-xs text-slate-600 space-y-2 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-slate-700">
                            <i className="fa-regular fa-clock text-indigo-600 mr-2"></i>
                            <span>
                              {w.scheduledAt
                                ? new Date(w.scheduledAt).toLocaleString('en-US', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'Upcoming'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-slate-500 text-[11px] bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {w.durationMinutes || 60} mins
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">Google Meet / Zoom:</span>
                          <a
                            href={w.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-indigo-600 font-bold hover:underline"
                          >
                            <i className="fa-solid fa-video text-[10px]"></i>
                            <span>Launch Room ↗</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Quick 1-Click Status Controls */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase">Live Room Control:</div>
                      <div className="flex items-center space-x-2">
                        {w.status !== 'live' ? (
                          <button
                            onClick={() => handleStatusToggle(w, 'live')}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center space-x-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                            <span>Go Live Now</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(w, 'completed')}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition shadow-xs flex items-center space-x-1.5"
                          >
                            <i className="fa-solid fa-stop text-[10px]"></i>
                            <span>End Session</span>
                          </button>
                        )}

                        {w.status === 'completed' && (
                          <button
                            onClick={() => handleStatusToggle(w, 'upcoming')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                          >
                            <span>Re-Schedule</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ATTENDEES & LEADS VIEW ── */}
        {viewMode === 'attendees' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Registered Masterclass Attendees</h3>
                <p className="text-xs text-slate-500">
                  Prospective students who reserved seats on the public /webinars landing page.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">
                {attendees.length} Total Registrations
              </span>
            </div>

            {attendees.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                <i className="fa-solid fa-inbox text-3xl text-slate-300"></i>
                <p className="font-bold text-slate-700">No seat registrations yet.</p>
                <p className="text-slate-400 text-[11px]">When users register at /webinars, their details appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">Email Address</th>
                      <th className="py-3 px-6">WhatsApp Phone</th>
                      <th className="py-3 px-6">Masterclass Note</th>
                      <th className="py-3 px-6">Registered At</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {attendees.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-bold text-slate-900 flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 font-black text-[11px] flex items-center justify-center">
                            {a.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{a.name}</span>
                        </td>
                        <td className="py-3.5 px-6 text-indigo-600 font-semibold">{a.email}</td>
                        <td className="py-3.5 px-6 font-mono text-slate-600">{a.phone || 'N/A'}</td>
                        <td className="py-3.5 px-6 text-slate-600 max-w-xs truncate" title={a.notes}>
                          {a.notes || 'Masterclass Reservation'}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 text-[11px]">
                          {new Date(a.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700">
                            {a.status || 'new'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── SCHEDULE & EDIT MODAL ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingWebinar ? 'Edit Masterclass' : 'Schedule New Masterclass'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Synchronizes instantly with public /webinars and student dashboards.
                </p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveWebinar} className="space-y-4 text-xs">
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Target Course Track</label>
                <select
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  required
                >
                  {courses.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Masterclass Title</label>
                <input
                  type="text"
                  placeholder="e.g. Distributed Caching with Redis &amp; Kafka Deep Dive"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Lead Instructor / Speaker</label>
                <input
                  type="text"
                  placeholder="Dr. Sarah Jenkins"
                  value={formInstructor}
                  onChange={(e) => setFormInstructor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="font-extrabold text-slate-700 block mb-1">Google Meet / Zoom Conference Link</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={formMeetLink}
                  onChange={(e) => setFormMeetLink(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={formScheduledAt}
                    onChange={(e) => setFormScheduledAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
                  />
                </div>
              </div>

              {editingWebinar && (
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">Broadcast Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    <option value="upcoming">Upcoming (Normal Schedule)</option>
                    <option value="live">Live Broadcasting Now (Pulsing Red)</option>
                    <option value="completed">Completed (Recorded Archive)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 transition flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-calendar-check"></i>
                  <span>{submitting ? 'Saving...' : editingWebinar ? 'Save Changes' : 'Confirm Schedule'}</span>
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
