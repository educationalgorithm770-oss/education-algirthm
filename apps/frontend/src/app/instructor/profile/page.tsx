'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

export default function InstructorProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [github, setGithub] = useState('');
  const [loading, setLoading] = useState(true);
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch('/api/instructor/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          setName(data.profile.name || '');
          setEmail(data.profile.email || '');
          setPhone(data.profile.phone || '');
          setTitle(data.profile.title || '');
          setBio(data.profile.bio || '');
          setLinkedIn(data.profile.linkedIn || '');
          setGithub(data.profile.github || '');
        }
      } catch (err) {
        console.error('Failed to load instructor profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorBanner('Full name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorBanner('');
      const res = await fetch('/api/instructor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          title: title.trim(),
          bio: bio.trim(),
          linkedIn: linkedIn.trim(),
          github: github.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessBanner('Profile updated and saved to MySQL instructors table!');
        setTimeout(() => setSuccessBanner(''), 5000);
      } else {
        setErrorBanner(data.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorBanner(err.message || 'Error updating profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (name || 'Faculty')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        <div>
          <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
            <i className="fa-solid fa-id-badge"></i>
            <span>Instructor Identity &amp; Bio (Live MySQL)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Instructor Profile Editor</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Your profile is displayed on all course pages and student-facing LMS portals.</p>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i><span>{successBanner}</span>
          </div>
        )}

        {errorBanner && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {errorBanner}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading profile from MySQL...</div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Avatar Preview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                {initials}
              </div>
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl font-black text-slate-900">{name || 'Faculty Member'}</h2>
                <p className="text-xs text-emerald-600 font-bold">{title || 'Senior Faculty & Track Architect'}</p>
                <p className="text-xs text-slate-500">{email}</p>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Contact Email</label>
                  <input type="email" value={email} disabled className="w-full px-4 py-2.5 border border-slate-200 bg-slate-100 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile Number</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Professional Title</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 font-bold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Professional Bio</label>
                <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 leading-relaxed" required></textarea>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Professional Links</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"><i className="fa-brands fa-linkedin text-blue-600 mr-1"></i>LinkedIn Profile</label>
                  <input type="url" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500" placeholder="https://linkedin.com/in/..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"><i className="fa-brands fa-github text-slate-800 mr-1"></i>GitHub Profile</label>
                  <input type="url" value={github} onChange={(e) => setGithub(e.target.value)} className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500" placeholder="https://github.com/..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 flex items-center space-x-2 disabled:opacity-50">
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <span>{submitting ? 'Saving Profile...' : 'Save & Publish Profile'}</span>
              </button>
            </div>
          </form>
        )}

      </main>
      <StudentFooter />
    </div>
  );
}
