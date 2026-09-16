'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface WebinarItem {
  id: string;
  rawId: number;
  title: string;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseLevel: string;
  speaker: string;
  speakerRole: string;
  speakerAvatar?: string | null;
  meetLink: string;
  scheduledAt: string | null;
  duration: string;
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
  isLive: boolean;
  category: string;
  date: string;
  time: string;
  registrationOpen: boolean;
}

export default function WebinarsPage() {
  const [webinars, setWebinars] = useState<WebinarItem[]>([]);
  const [nextSession, setNextSession] = useState<WebinarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'recorded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal reservation state
  const [selectedWebinar, setSelectedWebinar] = useState<WebinarItem | null>(null);
  const [booked, setBooked] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookEmail, setBookEmail] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Dynamic countdown timer based on nextSession.scheduledAt
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  const fetchWebinars = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/webinars');
      const data = await res.json();
      if (data.success && Array.isArray(data.webinars)) {
        setWebinars(data.webinars);
        setNextSession(data.nextSession || null);
      }
    } catch (err) {
      console.error('Failed to fetch webinars:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebinars();
  }, []);

  // Countdown calculation
  useEffect(() => {
    if (!nextSession?.scheduledAt) {
      setTimeLeft({ days: 0, hours: 48, minutes: 30, seconds: 0, isPast: false });
      return;
    }

    const targetTime = new Date(nextSession.scheduledAt).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds, isPast: false });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextSession]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    webinars.forEach((w) => {
      if (w.courseTitle) set.add(w.courseTitle);
    });
    return ['all', ...Array.from(set)];
  }, [webinars]);

  const filteredWebinars = useMemo(() => {
    return webinars.filter((item) => {
      // Tab filter
      if (activeTab === 'upcoming' && item.status !== 'upcoming' && item.status !== 'live') return false;
      if (activeTab === 'recorded' && item.status !== 'completed') return false;

      // Category filter
      if (selectedCategory !== 'all' && item.courseTitle !== selectedCategory) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSpeaker = item.speaker.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSpeaker && !matchCategory) return false;
      }

      return true;
    });
  }, [webinars, activeTab, selectedCategory, searchQuery]);

  const handleBookSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWebinar) return;

    setBookingLoading(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookName.trim(),
          email: bookEmail.trim(),
          phone: bookPhone.trim() || 'N/A',
          webinarId: selectedWebinar.id,
          webinarTitle: selectedWebinar.title,
          courseId: selectedWebinar.courseId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReservationCode(data.reservationCode || 'WB-' + Math.random().toString(36).substring(2, 8).toUpperCase());
        setBooked(true);
      } else {
        setBookingError(data.error || 'Failed to reserve seat. Please try again.');
      }
    } catch (err: any) {
      console.error('Lead registration error:', err);
      setBookingError('Network error. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <HeaderNavbar />

      {/* Hero Header */}
      <section className="bg-white py-16 px-6 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        <div className="max-w-5xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live FAANG Architect Masterclasses &amp; Workshops</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            System Design, GenAI &amp; Distributed Architecture Webinars
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Directly connect with senior engineering leaders. Attend interactive live coding masterclasses or stream our recorded technical archives.
          </p>

          {/* Countdown Timer Widget (Connected to MySQL live_classes) */}
          {nextSession && (
            <div className="pt-4 flex flex-col items-center">
              <div className="inline-flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white px-7 py-4 rounded-3xl border border-indigo-900/50 shadow-xl">
                <div className="text-left">
                  <div className="text-[11px] font-black uppercase tracking-widest text-indigo-300 flex items-center">
                    <i className="fa-solid fa-bolt text-amber-400 me-2 animate-pulse"></i>
                    {nextSession.status === 'live' ? 'Live Streaming Right Now' : 'Next Live Masterclass Starting In:'}
                  </div>
                  <div className="text-xs font-bold text-slate-300 line-clamp-1 max-w-xs mt-0.5">
                    {nextSession.title}
                  </div>
                </div>

                {nextSession.status === 'live' ? (
                  <a
                    href={nextSession.meetLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-red-600/30 transition flex items-center space-x-2 animate-bounce"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                    <span>Join Live Session Now &rarr;</span>
                  </a>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-2.5 text-center items-center">
                      {timeLeft.days > 0 && (
                        <>
                          <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                            <div className="text-xl font-mono font-black text-indigo-200">{timeLeft.days}</div>
                            <div className="text-[9px] font-extrabold text-slate-400 uppercase">Days</div>
                          </div>
                          <div className="text-slate-500 font-black text-xl">:</div>
                        </>
                      )}
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                        <div className="text-xl font-mono font-black text-indigo-200">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </div>
                        <div className="text-[9px] font-extrabold text-slate-400 uppercase">Hours</div>
                      </div>
                      <div className="text-slate-500 font-black text-xl">:</div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                        <div className="text-xl font-mono font-black text-indigo-200">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </div>
                        <div className="text-[9px] font-extrabold text-slate-400 uppercase">Mins</div>
                      </div>
                      <div className="text-slate-500 font-black text-xl">:</div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
                        <div className="text-xl font-mono font-black text-amber-400">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </div>
                        <div className="text-[9px] font-extrabold text-slate-400 uppercase">Secs</div>
                      </div>
                    </div>

                    <a
                      href={nextSession.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border border-indigo-400/40 shrink-0"
                      title="Direct Google Meet / Conference Link"
                    >
                      <i className="fa-solid fa-video text-amber-300 text-xs"></i>
                      <span className="hidden md:inline">Meeting Link</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 py-12 px-6 max-w-6xl mx-auto w-full space-y-10">
        {/* Controls: Search, Tabs & Categories */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Masterclasses ({webinars.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Upcoming Live ({webinars.filter((w) => w.status === 'upcoming' || w.status === 'live').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('recorded')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition whitespace-nowrap ${
                activeTab === 'recorded'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Past Recordings ({webinars.filter((w) => w.status === 'completed').length})
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search webinars or speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900"
              />
            </div>

            {categories.length > 2 && (
              <CustomDropdown
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={[
                  { value: 'all', label: 'All Tracks' },
                  ...categories.filter((c) => c !== 'all').map((cat) => ({
                    value: cat,
                    label: cat,
                  })),
                ]}
                theme="light"
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Webinars Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Live Masterclasses from Database...</p>
          </div>
        ) : filteredWebinars.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-regular fa-calendar-xmark"></i>
            </div>
            <h3 className="text-lg font-black text-slate-800">No Masterclasses Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No webinars matched your current filters. Try changing your search keywords or switching tabs.
            </p>
            <button
              onClick={() => {
                setActiveTab('all');
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredWebinars.map((webinar) => (
              <div
                key={webinar.id}
                className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group hover:border-indigo-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold">
                      {webinar.category}
                    </span>

                    {webinar.status === 'live' ? (
                      <span className="flex items-center text-xs font-extrabold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping me-1.5"></span> LIVE NOW
                      </span>
                    ) : webinar.status === 'upcoming' ? (
                      <span className="flex items-center text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        <i className="fa-solid fa-calendar-check me-1.5"></i> UPCOMING LIVE
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 flex items-center">
                        <i className="fa-solid fa-video me-1.5 text-slate-400"></i> Recorded Masterclass
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                    {webinar.title}
                  </h2>

                  <div className="space-y-3 text-sm text-slate-700 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center text-slate-800 font-bold">
                      <i className="fa-regular fa-calendar text-indigo-600 me-2.5 text-base"></i>
                      <span>{webinar.date} at {webinar.time}</span>
                      <span className="ms-auto text-xs text-slate-400 font-semibold">({webinar.duration})</span>
                    </div>
                    <div className="flex items-center text-slate-700">
                      <i className="fa-solid fa-user-tie text-indigo-600 me-2.5 text-base"></i>
                      <span>Speaker: <strong className="ms-1 text-slate-900">{webinar.speaker}</strong></span>
                    </div>
                    <div className="text-xs text-slate-500 ps-7">{webinar.speakerRole}</div>

                    {/* Direct Meeting Link Preview in Card */}
                    <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-200/70">
                      <span className="text-slate-500 font-medium flex items-center">
                        <i className="fa-solid fa-video text-indigo-600 me-1.5"></i> Meeting Conference Room:
                      </span>
                      <a
                        href={webinar.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 rounded-lg text-xs font-bold border border-slate-200 transition shadow-2xs"
                      >
                        <span>Open Meet Room</span>
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      </a>
                    </div>
                  </div>

                  {/* Course Syllabus Link */}
                  {webinar.courseTitle && (
                    <div className="text-xs text-slate-500 flex items-center space-x-1.5 pt-1">
                      <i className="fa-solid fa-graduation-cap text-indigo-500"></i>
                      <span>Part of:</span>
                      <Link
                        href={`/courses/${webinar.courseSlug || webinar.courseId}`}
                        className="text-indigo-600 font-bold hover:underline hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <span>{webinar.courseTitle}</span>
                        <span>&rarr;</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  {webinar.status === 'live' ? (
                    <a
                      href={webinar.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-red-600/20 transition flex items-center justify-center space-x-2"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      <span>Join Live Meeting Room Now</span>
                      <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
                    </a>
                  ) : webinar.status === 'upcoming' ? (
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        onClick={() => {
                          setSelectedWebinar(webinar);
                          setBooked(false);
                          setBookingError(null);
                        }}
                        className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-1.5"
                      >
                        <i className="fa-solid fa-ticket text-xs"></i>
                        <span>Reserve Free Seat</span>
                      </button>

                      <a
                        href={webinar.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center space-x-1.5"
                      >
                        <i className="fa-solid fa-video text-indigo-600 text-xs"></i>
                        <span>Meeting Link ↗</span>
                      </a>
                    </div>
                  ) : (
                    <a
                      href={webinar.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                    >
                      <i className="fa-solid fa-play text-xs text-amber-400"></i>
                      <span>Watch Masterclass Recording</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Booking Dialog */}
        {selectedWebinar && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    <i className="fa-solid fa-ticket"></i>
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Reserve Free Masterclass Seat</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedWebinar(null);
                    setBooked(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {booked ? (
                <div className="text-center py-2 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black shadow-inner">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Seat Confirmed #{reservationCode}
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-lg pt-1">You are Registered!</h4>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                      Calendar invite and room pass dispatched to <strong className="text-slate-900">{bookEmail || 'your email'}</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-1.5 text-xs">
                    <div className="font-extrabold text-slate-800 line-clamp-1">{selectedWebinar.title}</div>
                    <div className="text-slate-600 flex items-center">
                      <i className="fa-regular fa-calendar text-indigo-600 me-2"></i> {selectedWebinar.date} at {selectedWebinar.time}
                    </div>
                  </div>

                  {/* Direct Meeting Link inside Confirmation */}
                  {(() => {
                    let cleanUrl = selectedWebinar.meetLink.trim();
                    const doubleProtocolMatch = cleanUrl.match(/(https?:\/\/[^\/]+)\/(https?:\/\/.+)/i);
                    if (doubleProtocolMatch && doubleProtocolMatch[2]) {
                      cleanUrl = doubleProtocolMatch[2];
                    }
                    cleanUrl = cleanUrl.replace(/^https?:\/\/meet\.google\.com\/(https?:\/\/)/i, '$1');
                    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                      cleanUrl = 'https://' + cleanUrl;
                    }
                    const isZoom = cleanUrl.includes('zoom.us');

                    return (
                      <a
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 block text-center"
                      >
                        <i className="fa-solid fa-video text-amber-300"></i>
                        <span>{isZoom ? 'Enter Live Zoom Meeting Room Now ↗' : 'Enter Google Meet Room Now ↗'}</span>
                      </a>
                    );
                  })()}

                  <button
                    onClick={() => {
                      setSelectedWebinar(null);
                      setBooked(false);
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookSeat} className="space-y-4 text-xs">
                  {bookingError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold">
                      {bookingError}
                    </div>
                  )}

                  <div>
                    <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                      Masterclass Session
                    </label>
                    <input
                      type="text"
                      value={selectedWebinar.title}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={bookEmail}
                      onChange={(e) => setBookEmail(e.target.value)}
                      placeholder="rahul@example.com"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-1">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={bookPhone}
                      onChange={(e) => setBookPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white"
                    />
                  </div>

                  {/* Conference Room Preview */}
                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-indigo-900 font-bold flex items-center">
                      <i className="fa-solid fa-video text-indigo-600 me-1.5"></i> Google Meet Room:
                    </span>
                    <a
                      href={selectedWebinar.meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Preview Link ↗
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center space-x-2"
                  >
                    {bookingLoading ? (
                      <span>
                        <i className="fa-solid fa-spinner fa-spin me-2"></i>Reserving Seat in Database...
                      </span>
                    ) : (
                      <span>Confirm Free Seat Registration &rarr;</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
