'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user) {
          localStorage.setItem('student_user', JSON.stringify(data.user));
        }
        if (data.token) {
          localStorage.setItem('student_token', data.token);
        }
        router.push('/dashboard');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col justify-between items-center p-4 relative overflow-hidden font-sans">
      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="pt-4"></div>

      {/* Main Center Box */}
      <main className="w-full flex items-center justify-center py-6 z-10">
        <div className="w-full max-w-sm sm:max-w-md space-y-4">
          <div className="bg-slate-900/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl text-2xl font-black mb-1 shadow-lg shadow-indigo-600/30">
                <i className="fa-solid fa-user-plus"></i>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Create Student Account
              </h1>
              <p className="text-xs text-slate-400 font-medium">Join Education Algorithm LMS Cohort</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl font-medium flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation shrink-0 text-red-400"></i>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-xs">Full Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-3.5 top-3.5 text-slate-500 text-xs"></i>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-xs">Email Address</label>
                <div className="relative">
                  <i className="fa-solid fa-envelope absolute left-3.5 top-3.5 text-slate-500 text-xs"></i>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition"
                    placeholder="student@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-xs">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-500 text-xs"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium transition"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 text-xs focus:outline-none"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl transition shadow-lg shadow-indigo-600/25 transform active:scale-98 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <span><i className="fa-solid fa-spinner fa-spin me-2"></i> Creating Account...</span>
                ) : (
                  <>
                    <span>Create LMS Account</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-2xl p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-400 shadow-xl">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 font-extrabold hover:text-indigo-300 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </main>

      <div className="text-center text-[11px] text-slate-400 pb-4 z-10">
        &copy; {new Date().getFullYear()} Education Algorithm &bull; Student LMS App
      </div>
    </div>
  );
}
