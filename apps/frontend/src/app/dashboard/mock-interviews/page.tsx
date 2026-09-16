'use client';

import React, { useState, useEffect } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import Link from 'next/link';

interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  bg: string;
  track: string[];
  bio: string;
  slotsAvailable: number;
}

interface Booking {
  id: string;
  mentorName: string;
  track: string;
  date: string;
  time: string;
  meetLink: string;
  status: string;
  createdAt?: string;
}

interface Scorecard {
  id: string;
  mentorName: string;
  track: string;
  date: string;
  problemSolving: number;
  systemDesign: number;
  communication: number;
  overallScore: number;
  verdict: string;
  feedback: string;
}

export default function MockInterviewsPage() {
  const [activeTab, setActiveTab] = useState<'mentors' | 'my-mocks' | 'scorecards'>('mentors');
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [track, setTrack] = useState('System Design & Architecture');
  
  // Tomorrow's date as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(tomorrowStr);
  const [time, setTime] = useState('19:00 IST');
  const [bookingStatus, setBookingStatus] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myScorecards, setMyScorecards] = useState<Scorecard[]>([]);
  const [fetchingData, setFetchingData] = useState(true);

  const mentors: Mentor[] = [
    {
      id: 'm_1',
      name: 'Rahul Sharma',
      role: 'Senior SDE 2',
      company: 'Amazon AWS',
      avatar: 'fa-solid fa-user-tie',
      bg: 'bg-indigo-600',
      track: ['DSA', 'System Design', 'LLD'],
      bio: 'Ex-Flipkart, 7+ years building distributed Java microservices and high-throughput transaction pipelines.',
      slotsAvailable: 2
    },
    {
      id: 'm_2',
      name: 'Priya Patel',
      role: 'Staff Systems Architect',
      company: 'Google Cloud',
      avatar: 'fa-solid fa-user-astronaut',
      bg: 'bg-purple-600',
      track: ['System Design', 'GenAI RAG', 'Resume Review'],
      bio: 'Leads AI Infrastructure at GCP. Specialized in LLM orchestration, vector databases, and scaleup architecture.',
      slotsAvailable: 3
    },
    {
      id: 'm_3',
      name: 'Amit Verma',
      role: 'Lead Backend Engineer',
      company: 'Swiggy Tech',
      avatar: 'fa-solid fa-user-gear',
      bg: 'bg-amber-600',
      track: ['DSA', 'Concurrency', 'Behavioral'],
      bio: 'Built real-time dispatch systems handling 200k orders/min. Expert in LeetCode Hard DSA and STAR interviews.',
      slotsAvailable: 1
    }
  ];

  // Load Bookings & Scorecards
  useEffect(() => {
    async function fetchBookings() {
      try {
        setFetchingData(true);
        const res = await fetch('/api/mock-interviews/book');
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.bookings) && data.bookings.length > 0) {
            setMyBookings(data.bookings);
          } else {
            // Check localStorage fallback
            const cached = localStorage.getItem('student_mock_bookings');
            if (cached) setMyBookings(JSON.parse(cached));
          }

          if (Array.isArray(data.scorecards) && data.scorecards.length > 0) {
            setMyScorecards(data.scorecards);
          } else {
            // Default sample scorecard for rich display
            setMyScorecards([
              {
                id: 'MOCK-9842',
                mentorName: 'Rahul Sharma (Amazon SDE 2)',
                track: 'System Design & Distributed Systems',
                date: 'Sep 02, 2026',
                problemSolving: 5,
                systemDesign: 5,
                communication: 4,
                overallScore: 94,
                verdict: 'Strong Hire • SDE 2',
                feedback: 'Exceptional grasp on database row locking, idempotent payment webhook handling, and Redis cluster caching. Demonstrated deep knowledge of virtual threads in Java 21.'
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setFetchingData(false);
      }
    }

    fetchBookings();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/mock-interviews/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorName: selectedMentor, track, date, time })
      });
      const data = await res.json();
      if (data.success && data.booking) {
        setBookingStatus(data.booking);
        setMyBookings((prev) => {
          const updated = [data.booking, ...prev];
          localStorage.setItem('student_mock_bookings', JSON.stringify(updated));
          return updated;
        });
      } else {
        setErrorMessage(data.message || 'Could not schedule mock interview. Please try again.');
      }
    } catch (err) {
      setErrorMessage('Network error while scheduling. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      <section className="bg-white py-10 px-6 border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="text-xs font-bold text-indigo-600 hover:underline flex items-center space-x-1">
              <i className="fa-solid fa-arrow-left text-[10px]"></i>
              <span>Back to Student Dashboard</span>
            </Link>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                👨‍💼 1-on-1 SDE Mock Interviews
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
                Senior FAANG Mentor Mock Interviews
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mt-1 leading-relaxed">
                Schedule a 60-minute simulated live technical interview round with Staff & Senior Engineers. Receive line-by-line rubric scorecards and hiring evaluations.
              </p>
            </div>

            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('mentors')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'mentors' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-regular fa-calendar-plus"></i>
                <span>Book Mentor</span>
              </button>
              <button
                onClick={() => setActiveTab('my-mocks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 relative ${
                  activeTab === 'my-mocks' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-video"></i>
                <span>My Scheduled Mocks</span>
                {myBookings.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center ml-1">
                    {myBookings.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('scorecards')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  activeTab === 'scorecards' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <i className="fa-solid fa-chart-simple"></i>
                <span>Scorecards</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 py-10 px-6 max-w-6xl mx-auto w-full space-y-8">
        {/* TAB 1: MENTOR ROSTER */}
        {activeTab === 'mentors' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mentors.map((m) => (
                <div key={m.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-2xl ${m.bg} text-white flex items-center justify-center text-xl font-bold shadow-md`}>
                        <i className={m.avatar}></i>
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-base">{m.name}</h3>
                        <div className="text-xs text-slate-500 font-bold">{m.role} @ <span className="text-indigo-600">{m.company}</span></div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{m.bio}</p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.track.map((t, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-extrabold">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Availability:</span>
                      <span className="text-emerald-600 font-extrabold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{m.slotsAvailable} slots this week</span>
                      </span>
                    </div>
                    <button
                      onClick={() => { setSelectedMentor(m.name); setBookingStatus(null); setErrorMessage(null); }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Schedule 1-on-1 Session</span>
                      <i className="fa-solid fa-arrow-right text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MY SCHEDULED MOCKS */}
        {activeTab === 'my-mocks' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">Your Scheduled 1-on-1 Sessions</h3>
                <p className="text-xs text-slate-500">Join your live video call link at the scheduled time.</p>
              </div>
              <button
                onClick={() => setActiveTab('mentors')}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition"
              >
                + Schedule Another Mock
              </button>
            </div>

            {myBookings.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl mx-auto">
                  <i className="fa-regular fa-calendar-xmark"></i>
                </div>
                <h4 className="text-base font-extrabold text-slate-900">No Scheduled Mocks Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pick a senior mentor from Amazon, Google, or Swiggy and schedule your first 60-minute mock round.
                </p>
                <button
                  onClick={() => setActiveTab('mentors')}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                >
                  Browse Available Mentors &rarr;
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {myBookings.map((b) => (
                  <div key={b.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold">
                          ● {b.status || 'CONFIRMED'}
                        </span>
                        <h4 className="font-black text-slate-900 text-base mt-2">{b.track}</h4>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">Mentor: <span className="text-indigo-600 font-extrabold">{b.mentorName}</span></p>
                      </div>
                      <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700 border border-slate-200">
                        {b.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Date</div>
                        <div className="font-extrabold text-slate-900">{b.date}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Time Slot</div>
                        <div className="font-extrabold text-slate-900">{b.time}</div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <a
                        href={b.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2"
                      >
                        <i className="fa-solid fa-video text-xs"></i>
                        <span>Join Live Google Meet Room &rarr;</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MOCK SCORECARDS */}
        {activeTab === 'scorecards' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-slate-900">FAANG SDE Evaluation Scorecards</h3>
              <p className="text-xs text-slate-500">Official technical rubric feedback and hiring committee recommendations.</p>
            </div>

            <div className="space-y-5">
              {myScorecards.map((sc) => (
                <div key={sc.id} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-extrabold uppercase">
                          {sc.track}
                        </span>
                        <span className="text-xs text-slate-400 font-mono font-bold">{sc.date}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mt-2">Mentor: {sc.mentorName}</h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Hiring Verdict</div>
                      <div className="text-base font-black text-emerald-600">{sc.verdict}</div>
                    </div>
                  </div>

                  {/* Rubric Breakdown Progress Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">Problem Solving</span>
                        <span className="text-indigo-600">{sc.problemSolving} / 5</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${(sc.problemSolving / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">System Design</span>
                        <span className="text-purple-600">{sc.systemDesign} / 5</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full" style={{ width: `${(sc.systemDesign / 5) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">Communication</span>
                        <span className="text-emerald-600">{sc.communication} / 5</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${(sc.communication / 5) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Notes */}
                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5 text-xs">
                    <div className="font-extrabold text-indigo-900 flex items-center space-x-1.5">
                      <i className="fa-solid fa-clipboard-check text-indigo-600"></i>
                      <span>Detailed Mentor Remarks</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{sc.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Booking Drawer */}
        {selectedMentor && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                    <i className="fa-regular fa-calendar-check"></i>
                  </div>
                  <h3 className="text-base font-black text-slate-900">Schedule 1-on-1 Mock</h3>
                </div>
                <button
                  onClick={() => { setSelectedMentor(null); setBookingStatus(null); setErrorMessage(null); }}
                  className="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center transition"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start space-x-2">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600 mt-0.5"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {bookingStatus ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold space-y-4">
                  <div className="text-sm font-black text-emerald-900 flex items-center space-x-2">
                    <i className="fa-solid fa-circle-check text-emerald-600"></i>
                    <span>Booking Confirmed &amp; Meet Created!</span>
                  </div>
                  <div className="space-y-1.5 text-slate-700 font-medium bg-white p-3.5 rounded-xl border border-emerald-200">
                    <div>Mentor: <strong className="text-slate-900">{bookingStatus.mentorName}</strong></div>
                    <div>Track: <strong className="text-slate-900">{bookingStatus.track}</strong></div>
                    <div>Date &amp; Time: <strong className="text-slate-900">{bookingStatus.date} at {bookingStatus.time}</strong></div>
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Google Meet Room:</span>
                      <a href={bookingStatus.meetLink} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-mono text-[11px] font-bold break-all">
                        {bookingStatus.meetLink}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedMentor(null);
                      setBookingStatus(null);
                      setActiveTab('my-mocks');
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
                  >
                    View in My Scheduled Mocks &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-4 text-xs font-medium text-slate-700">
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Selected Mentor</label>
                    <input type="text" value={selectedMentor} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold" />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 uppercase block mb-1">Interview Round Track</label>
                    <select value={track} onChange={(e) => setTrack(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold bg-white">
                      <option value="System Design & Architecture">System Design &amp; Architecture</option>
                      <option value="DSA & LeetCode Coding">DSA &amp; LeetCode Coding</option>
                      <option value="Low Level Design (LLD)">Low Level Design (LLD)</option>
                      <option value="GenAI RAG & Distributed Systems">GenAI RAG &amp; Distributed Systems</option>
                      <option value="Resume Review & Portfolio Audit">Resume Review &amp; Portfolio Audit</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 uppercase block mb-1">Date</label>
                      <input
                        type="date"
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 uppercase block mb-1">Time Slot</label>
                      <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold bg-white">
                        <option value="19:00 IST">19:00 IST</option>
                        <option value="20:30 IST">20:30 IST</option>
                        <option value="21:30 IST">21:30 IST</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span><i className="fa-solid fa-spinner fa-spin me-2"></i>Reserving Slot &amp; Generating Meet...</span>
                    ) : (
                      <span>Confirm Booking &amp; Generate Invite &rarr;</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <StudentFooter />
    </div>
  );
}
