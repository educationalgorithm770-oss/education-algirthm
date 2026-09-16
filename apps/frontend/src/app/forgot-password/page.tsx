'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpCode, setDevOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Handle Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp', email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to send verification code. Please check your email.');
      } else {
        if (data.devOtp) {
          setDevOtpCode(data.devOtp);
        }
        setSuccessMsg(data.message);
        setStep('reset');
      }
    } catch (err: any) {
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to reset password. Please verify the code.');
      } else {
        setSuccessMsg(data.message);
        setStep('success');
      }
    } catch (err: any) {
      setError('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="text-center mb-8">
          <Link href="/login" className="inline-flex items-center space-x-2 text-2xl font-black tracking-tight text-white hover:opacity-90 transition">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-base font-black shadow-lg shadow-indigo-500/30">
              EA
            </span>
            <span>Education <span className="text-indigo-400">Algorithm</span></span>
          </Link>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
            {step === 'request' && 'Reset Account Password'}
            {step === 'reset' && 'Enter Verification Code'}
            {step === 'success' && 'Password Reset Complete'}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400">
            {step === 'request' && 'Enter your registered email and we will send you a 6-digit OTP code.'}
            {step === 'reset' && `We sent a 6-digit code to ${email}.`}
            {step === 'success' && 'Your credentials have been securely updated.'}
          </p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 py-8 px-6 sm:px-8 shadow-2xl rounded-2xl">
          {error && (
            <div className="mb-6 p-3.5 bg-red-950/50 border border-red-500/50 text-red-200 text-xs sm:text-sm rounded-xl font-medium flex items-center space-x-2.5">
              <i className="fa-solid fa-circle-exclamation shrink-0 text-red-400"></i>
              <span>{error}</span>
            </div>
          )}

          {successMsg && step !== 'success' && (
            <div className="mb-6 p-3.5 bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm rounded-xl font-medium flex items-center space-x-2.5">
              <i className="fa-solid fa-circle-check shrink-0 text-emerald-400"></i>
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-envelope text-sm"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@educationalgorithm.com"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link href="/login" className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition inline-flex items-center space-x-1.5">
                  <i className="fa-solid fa-arrow-left text-[10px]"></i>
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFY OTP AND SET NEW PASSWORD */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {devOtpCode && (
                <div className="bg-amber-950/60 border border-amber-500/50 rounded-xl p-3 flex items-center justify-between text-xs text-amber-200">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-bolt text-amber-400"></i>
                    <span>
                      <strong>Local Test OTP:</strong>{' '}
                      <code className="bg-amber-900/80 px-2 py-0.5 rounded font-mono font-bold text-amber-300 text-sm tracking-widest">
                        {devOtpCode}
                      </code>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtp(devOtpCode)}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-[11px] transition cursor-pointer"
                  >
                    ⚡ Auto-Fill
                  </button>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="text-xs text-indigo-400 hover:underline font-semibold"
                  >
                    Resend Code
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-center tracking-widest text-lg font-mono font-bold text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-lock text-sm"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <i className="fa-solid fa-shield-halved text-sm"></i>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <i className="fa-solid fa-check text-xs"></i>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs text-slate-400 hover:text-indigo-400 font-medium transition inline-flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-arrow-left text-[10px]"></i>
                  <span>Change Email</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS STATE */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-5">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/20">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Password Changed Successfully!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  You can now log in to your student or faculty account using your new credentials.
                </p>
              </div>

              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/25"
              >
                Sign In Now &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
