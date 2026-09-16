'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkExistingSession = async () => {
      if (searchParams.get('switch') === 'true') return;
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.user) {
          const defaultDestination =
            data.user.role === 'instructor'
              ? '/instructor'
              : data.user.role === 'admin'
              ? '/admin'
              : '/dashboard';
          const next = searchParams.get('next') ?? defaultDestination;
          router.replace(next);
        }
      } catch {}
    };
    checkExistingSession();
  }, [router, searchParams]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const targetEmail = (customEmail ?? email).trim();
    const targetPass = customPass ?? password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: targetEmail, password: targetPass }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user) {
          localStorage.setItem('student_user', JSON.stringify(data.user));
        }
        if (data.token) {
          localStorage.setItem('student_token', data.token);
        }
        const next = searchParams.get('next') ?? '/dashboard';
        window.location.href = next;
      } else {
        setError(data.message || 'Invalid student email or password.');
      }
    } catch {
      setError('Network error. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md space-y-4">
      {/* Main Glassmorphic Auth Box */}
      <div className="bg-slate-900/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Instagram-Style Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl text-2xl font-black mb-1 shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Education <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Algorithm</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Student LMS &bull; AI Interview &bull; Code Arena</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-xl font-medium flex items-center space-x-2 animate-fade-in">
            <i className="fa-solid fa-circle-exclamation shrink-0 text-red-400"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300 text-xs">Student Email or Username</label>
            <div className="relative">
              <i className="fa-solid fa-envelope absolute left-3.5 top-3.5 text-slate-500 text-xs"></i>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-medium transition"
                placeholder="student@educationalgorithm.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 text-xs">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-500 text-xs"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 font-medium transition"
                placeholder="••••••••"
                autoComplete="current-password"
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
              <span><i className="fa-solid fa-spinner fa-spin me-2"></i> Signing In...</span>
            ) : (
              <>
                <span>Log In to Student LMS</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0A0D14] text-white flex flex-col justify-between items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Empty Top Space for balance */}
      <div className="pt-4"></div>

      {/* Center Auth Card */}
      <main className="w-full flex items-center justify-center py-6 z-10">
        <Suspense
          fallback={
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm sm:max-w-md w-full h-96 animate-pulse shadow-2xl" />
          }
        >
          <LoginForm />
        </Suspense>
      </main>

      {/* Discreet Bottom Copyright */}
      <div className="text-center text-[11px] text-slate-400 pb-4 z-10">
        &copy; {new Date().getFullYear()} Education Algorithm &bull; Student LMS App
      </div>
    </div>
  );
}
