'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface WebinarOption {
  id: string;
  title: string;
  speaker: string;
  speakerRole?: string;
  date: string;
  time: string;
  meetLink: string;
  courseId: number;
  status?: string;
}

export default function LandingWebinarPopup() {
  const pathname = usePathname();

  // Hide on native mobile app, portals, auth pages & focused workspaces
  const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
  const isHiddenRoute =
    isNative ||
    !pathname ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/webinars') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/checkout') ||
    pathname === '/ai-tutor' ||
    pathname === '/code-arena';

  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isClosedInSession, setIsClosedInSession] = useState(false);
  const [webinars, setWebinars] = useState<WebinarOption[]>([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if student has already registered or dismissed in this browser session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const alreadyRegistered =
        localStorage.getItem('ea_student_webinar_registered') === 'true' ||
        sessionStorage.getItem('ea_student_webinar_registered') === 'true';
      if (alreadyRegistered) {
        setIsRegistered(true);
      }
      if (sessionStorage.getItem('ea_webinar_dismissed_session') === 'true') {
        setIsClosedInSession(true);
      }
    }
  }, []);

  // Fetch upcoming webinars
  useEffect(() => {
    const controller = new AbortController();
    async function loadWebinars() {
      try {
        const res = await fetch('/api/webinars', { signal: controller.signal });
        const data = await res.json();
        if (data.success && Array.isArray(data.webinars)) {
          const upcoming = data.webinars.filter((w: { status?: string }) => w.status === 'upcoming' || w.status === 'live');
          setWebinars(upcoming);
          if (upcoming.length > 0) {
            setSelectedWebinarId(upcoming[0].id);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Failed to load popup webinars:', err.message);
        }
      }
    }
    if (!isHiddenRoute && !isRegistered && !isClosedInSession) {
      loadWebinars();
    }
    return () => controller.abort();
  }, [isHiddenRoute, isRegistered, isClosedInSession]);

  // Click outside listener for custom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger popup after 4 seconds on landing pages
  useEffect(() => {
    if (isHiddenRoute || isRegistered || isClosedInSession) return;

    if (!isOpen) {
      const timer = setTimeout(() => {
        const currentRegistered = localStorage.getItem('ea_student_webinar_registered') === 'true';
        const dismissed = sessionStorage.getItem('ea_webinar_dismissed_session') === 'true';
        if (!currentRegistered && !dismissed) {
          setIsOpen(true);
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isRegistered, isClosedInSession, isHiddenRoute]);

  const handleClose = () => {
    setIsOpen(false);
    setIsClosedInSession(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ea_webinar_dismissed_session', 'true');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Please enter your name and email address.');
      return;
    }

    const currentWebinar = webinars.find((w) => w.id === selectedWebinarId) || webinars[0];
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || 'N/A',
          webinarId: currentWebinar?.id || 'web_general',
          webinarTitle: currentWebinar?.title || 'Experience First Live Masterclass',
          courseId: currentWebinar?.courseId || 1,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const code = data.reservationCode || 'WB-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setReservationCode(code);
        setBooked(true);

        // Permanently stop popup for this student
        setIsRegistered(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('ea_student_webinar_registered', 'true');
          sessionStorage.setItem('ea_student_webinar_registered', 'true');
        }
      } else {
        setErrorMsg(data.error || 'Failed to confirm reservation.');
      }
    } catch (err) {
      console.error('Popup booking error:', err);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedWebinar = webinars.find((w) => w.id === selectedWebinarId) || webinars[0];

  if (isHiddenRoute || isClosedInSession || !isOpen || isRegistered) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in print:hidden">
      <div className="bg-white rounded-3xl max-w-[350px] sm:max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-fade-in-up max-h-[88vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center text-[10px] transition shadow-xs"
          title="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Header Visual Banner */}
        <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16"></div>
          
          <div className="space-y-1 sm:space-y-1.5 relative z-10 pr-6">
            <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider inline-flex items-center space-x-1 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
              <span>100% Free Live Masterclass</span>
            </span>

            <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-snug">
              Experience First, <span className="text-amber-400">Decide Later.</span>
            </h3>

            <p className="text-slate-300 text-[10px] sm:text-xs leading-tight sm:leading-relaxed font-medium line-clamp-2 sm:line-clamp-none">
              Attend an interactive live coding masterclass with FAANG architects. Test our quality firsthand before paying anything.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-5 space-y-3 overflow-y-auto">
          {booked ? (
            /* ── SUCCESS SCREEN (PERMANENTLY REGISTERED) ── */
            <div className="text-center py-1 space-y-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-black shadow-inner">
                ✓
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Pass Confirmed #{reservationCode}
                </span>
                <h4 className="font-extrabold text-slate-900 text-base pt-0.5">You Are All Set!</h4>
                <p className="text-[11px] text-slate-600 leading-tight max-w-xs mx-auto">
                  Google Meet link sent to <strong className="text-slate-900">{email}</strong>.
                </p>
              </div>

              {selectedWebinar && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left space-y-1 text-[11px]">
                  <div className="font-extrabold text-slate-800 line-clamp-1">{selectedWebinar.title}</div>
                  <div className="text-slate-600 flex items-center text-[10px]">
                    <i className="fa-regular fa-calendar text-indigo-600 me-1.5"></i> {selectedWebinar.date} at {selectedWebinar.time}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                {selectedWebinar?.meetLink && (() => {
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
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-1.5 block text-center"
                    >
                      <i className="fa-solid fa-video text-amber-300 text-[10px]"></i>
                      <span>{isZoom ? 'Enter Live Zoom Room ↗' : 'Enter Google Meet Room ↗'}</span>
                    </a>
                  );
                })()}
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-lg transition"
                >
                  Close &bull; Continue Browsing
                </button>
              </div>
            </div>
          ) : (
            /* ── REGISTRATION FORM ── */
            <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
              {errorMsg && (
                <div className="p-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-[10px] font-bold">
                  {errorMsg}
                </div>
              )}

              {/* ── CUSTOM PERFECT DROPBOX UI ── */}
              {webinars.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-1 flex items-center justify-between text-[10px]">
                    <span>Select Masterclass Track</span>
                    <span className="text-[9px] text-indigo-600 font-bold lowercase">100% Free</span>
                  </label>

                  {/* Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full bg-slate-50 hover:bg-slate-100/80 border text-left rounded-xl p-2 sm:p-2.5 transition flex items-center justify-between shadow-2xs group ${
                      dropdownOpen ? 'border-indigo-600 ring-2 ring-indigo-600/10 bg-white' : 'border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-2.5 overflow-hidden">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                        <i className="fa-solid fa-video"></i>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-extrabold text-slate-900 text-[11px] sm:text-xs truncate leading-snug">
                          {selectedWebinar ? selectedWebinar.title : 'Choose a masterclass'}
                        </div>
                        {selectedWebinar && (
                          <div className="text-[10px] text-slate-500 font-medium flex items-center space-x-1.5 mt-0.5">
                            <span className="text-indigo-600 font-bold flex items-center">
                              <i className="fa-regular fa-calendar me-1"></i>
                              {selectedWebinar.date}
                            </span>
                            <span>&bull;</span>
                            <span className="truncate">{selectedWebinar.speaker}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-md bg-slate-200/60 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center text-[10px] transition-transform duration-200 shrink-0 ml-1.5 ${
                      dropdownOpen ? 'rotate-180 bg-indigo-100 text-indigo-600' : ''
                    }`}>
                      <i className="fa-solid fa-chevron-down text-[8px]"></i>
                    </div>
                  </button>

                  {/* Floating Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1 z-40 max-h-48 overflow-y-auto space-y-1 ring-1 ring-slate-900/5 animate-fade-in-up">
                      <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-0.5 flex items-center justify-between">
                        <span>Available Live Sessions</span>
                        <span>{webinars.length} Tracks</span>
                      </div>

                      {webinars.map((w) => {
                        const isSelected = w.id === selectedWebinarId;
                        return (
                          <div
                            key={w.id}
                            onClick={() => {
                              setSelectedWebinarId(w.id);
                              setDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-950 shadow-2xs'
                                : 'border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                            }`}
                          >
                            <div className="space-y-0.5 overflow-hidden pr-2">
                              <div className="font-extrabold text-[11px] leading-snug line-clamp-1">
                                {w.title}
                              </div>
                              <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-medium">
                                <span className="px-1.5 py-0.2 rounded-md bg-slate-100 font-bold text-slate-700">
                                  {w.date}
                                </span>
                                <span className="truncate">
                                  {w.speaker}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] font-black">
                                  ✓
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300"></div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-0.5 text-[10px]">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-0.5 text-[10px]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-extrabold text-slate-700 uppercase tracking-wider block mb-0.5 text-[10px]">
                  WhatsApp Number (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                />
              </div>

              {/* Highlights badge */}
              <div className="bg-amber-50/80 border border-amber-200/80 p-2 sm:p-2.5 rounded-xl flex items-center justify-between text-[10px] text-amber-900">
                <span className="font-bold flex items-center">
                  <i className="fa-solid fa-shield-halved text-amber-600 me-1.5 text-xs"></i>
                  Zero Payment &bull; 100% Free Pass
                </span>
                <span className="text-slate-400 font-semibold text-[9px]">Instant Meet Link</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {loading ? (
                  <span>
                    <i className="fa-solid fa-spinner fa-spin me-1.5"></i>Generating Pass...
                  </span>
                ) : (
                  <span>Claim Free Masterclass Pass &rarr;</span>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
