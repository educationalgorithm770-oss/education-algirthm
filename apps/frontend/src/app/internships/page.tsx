'use client';

import React, { useState } from 'react';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import { SITE_DATA } from '@/config/site-data';

export default function InternshipsPage() {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', github: '' });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          course: `Internship: ${selectedTrack}`,
          message: `GitHub: ${formData.github || 'N/A'}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Failed to submit application.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <StudentNavbar />

      {/* Hero Banner */}
      <section className="bg-white border-b border-slate-200 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase tracking-wider">
            Production Industry Experience
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Engineering Internship &amp; Capstone Tracks
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-normal">
            Work on production capstone microservices under senior FAANG mentor guidance with monthly stipends and full-time PPO opportunities.
          </p>
        </div>
      </section>

      {/* Internship Tracks Grid */}
      <main className="flex-1 py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SITE_DATA.internships.map((track) => (
            <div key={track.id} className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-bold">
                    {track.duration} Track
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Stipend: {track.stipend}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-900">{track.title}</h2>
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Production Capstone Project</div>
                  <p className="text-sm font-bold text-slate-800">{track.capstoneProject}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tech Stack</div>
                  <div className="flex flex-wrap gap-2">
                    {track.technologies.map((tech, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-mono rounded-lg border border-slate-200/80 font-bold">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedTrack(track.title); setSubmitted(false); setErrorMsg(''); }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-600/20 transition"
                >
                  Apply For Internship &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Application Drawer Modal */}
        {selectedTrack && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-5 animate-fade-in-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Admission Application</div>
                  <h3 className="text-lg font-black text-slate-900">{selectedTrack}</h3>
                </div>
                <button onClick={() => { setSelectedTrack(null); setSubmitted(false); }} className="text-slate-400 hover:text-slate-600 p-1">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              {submitted ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">Application Submitted!</h4>
                  <p className="text-xs text-slate-500">
                    Our engineering team will review your profile and contact you via WhatsApp/Email with the screening challenge.
                  </p>
                  <button
                    onClick={() => setSelectedTrack(null)}
                    className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4 text-xs font-medium text-slate-700">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">{errorMsg}</div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Phone / WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">GitHub / LinkedIn URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                      placeholder="https://github.com/janedoe"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-medium"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition"
                    >
                      {loading ? 'Submitting Application...' : 'Submit Application &rarr;'}
                    </button>
                  </div>
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
