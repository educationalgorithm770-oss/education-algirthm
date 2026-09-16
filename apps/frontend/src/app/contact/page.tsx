'use client';

import React, { useState } from 'react';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { SITE_DATA } from '@/config/site-data';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('Java Full-Stack Masterclass');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          course,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Inquiry submitted successfully.');
        setName(''); setEmail(''); setPhone(''); setMessage('');
      } else {
        setErrorMsg(data.message || 'Failed to submit inquiry.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <HeaderNavbar />

      {/* Header Banner */}
      <section className="bg-white py-16 px-6 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/60 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center space-x-1.5 shadow-sm">
            <i className="fa-solid fa-headset text-indigo-600 me-1"></i>
            Admissions &amp; Mentorship Support
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Talk to Senior Faculty &amp; Counselors</h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Have questions about syllabus topics, cohort schedules, EMI options, or 1-on-1 mentorship? Reach out to us.
          </p>
        </div>
      </section>

      <main className="flex-1 py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Request Admission Callback</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">
                Fill out the form below and our senior engineering admissions counselor will call you within 2 hours.
              </p>
            </div>

            {successMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation text-red-600 text-base"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">Interested Program</label>
                <CustomDropdown
                  value={course}
                  onChange={(val) => setCourse(val)}
                  options={[
                    { value: 'Java Full-Stack Masterclass', label: 'Java Full-Stack Masterclass 2026', icon: '☕' },
                    { value: 'Data Science & GenAI', label: 'Data Science & Generative AI Systems', icon: '🧠' },
                    { value: 'DSA & LeetCode Mastery', label: 'Data Structures & Algorithms Mastery', icon: '⚡' }
                  ]}
                  variant="emerald"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Message / Specific Questions</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about batch timings, EMI plans, or curriculum..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600 font-medium"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span><i className="fa-solid fa-spinner fa-spin mr-2"></i>Submitting Inquiry...</span>
                ) : (
                  <span>Submit Admission Callback Request &rarr;</span>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Campus Details & Direct Phone (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-slate-900">Direct Contact Hub</h3>

              <div className="space-y-4 text-xs font-medium text-slate-700">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold shrink-0">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">Phone / WhatsApp Support</div>
                    <div className="text-slate-600 font-bold text-sm mt-0.5">{SITE_DATA.company.supportPhone}</div>
                    <div className="text-slate-400 text-[11px]">Mon – Sat, 9:00 AM – 7:00 PM IST</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg font-bold shrink-0">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">Admissions Email</div>
                    <div className="text-slate-600 font-bold text-sm mt-0.5">{SITE_DATA.company.supportEmail}</div>
                    <div className="text-slate-400 text-[11px]">2-Hour SLA for prospective students</div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg font-bold shrink-0">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">Campus &amp; Headquarters</div>
                    <div className="text-slate-600 text-xs mt-0.5">{SITE_DATA.company.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Note */}
            <div className="p-6 rounded-3xl bg-indigo-50/70 border border-indigo-100 space-y-2">
              <div className="text-xs font-black text-indigo-600 uppercase tracking-wider">Fast Admissions SLA</div>
              <div className="text-sm font-extrabold text-slate-900">Have urgent admission questions?</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Connect directly on WhatsApp at <strong className="text-slate-900">{SITE_DATA.company.supportPhone}</strong> for instant course counseling.
              </p>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

