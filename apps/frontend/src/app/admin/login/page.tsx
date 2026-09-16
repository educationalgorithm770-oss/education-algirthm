'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = '/admin';
      } else {
        setErrorMsg(data.message || 'Invalid administrator credentials.');
      }
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="bg-[#0e1422] border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative z-10">

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-600/30 mx-auto">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            <span>Platform Governance</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Console Login</h1>
          <p className="text-slate-400 text-xs">Authorized sign-in for Education Algorithm System Administrators &amp; Operations.</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center space-x-2">
            <i className="fa-solid fa-circle-exclamation text-sm"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
              Admin Username / Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <i className="fa-solid fa-user-shield"></i>
              </span>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com or admin"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5 uppercase tracking-wider text-[11px]">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <i className="fa-solid fa-lock"></i>
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold shadow-lg shadow-purple-600/30 transition disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>Authenticating Admin Access...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>Sign In to Admin Console</span>
              </>
            )}
          </button>
        </form>

        {/* Clean Footer Link */}
        <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <Link href="/login" className="text-slate-400 hover:text-slate-200 font-bold transition">
            &larr; Switch to Student Login
          </Link>
        </div>

      </div>
    </div>
  );
}
