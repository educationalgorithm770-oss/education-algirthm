'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

export default function StudentSettingsPage() {
  const [studentName, setStudentName] = useState('Student Scholar');
  const [studentEmail, setStudentEmail] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('EA-2026-9427');
  const [rollNumber, setRollNumber] = useState('ROLL-9427');

  // Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.user) {
          if (data.user.name) setStudentName(data.user.name);
          if (data.user.email) setStudentEmail(data.user.email);
          if (data.user.registration_number) setRegistrationNumber(data.user.registration_number);
          if (data.user.roll_number) setRollNumber(data.user.roll_number);
        }
      } catch (_) {}
    }

    loadProfile();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || 'Password successfully updated!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMessage(data.message || 'Failed to update password. Please check your current password.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <StudentNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
              <i className="fa-solid fa-gear"></i>
              <span>Account &amp; Security Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">Student Profile &amp; Password</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage your student credentials, account password, and security preferences.</p>
          </div>
          <Link href="/dashboard" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5">
            <i className="fa-solid fa-arrow-left text-[10px]"></i><span>Back to Dashboard</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Account Profile Summary Card */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center space-x-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md">
                  {studentName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">{studentName}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[170px]">{studentEmail}</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Registration No</span>
                  <span className="font-mono font-bold text-slate-800">{registrationNumber}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Roll Number</span>
                  <span className="font-mono font-bold text-slate-800">{rollNumber}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Account Status</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                    ● Active Student
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Navigation</div>
              <div className="space-y-1.5">
                <Link href="/dashboard/payments" className="p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between transition border border-transparent hover:border-slate-200">
                  <span className="flex items-center space-x-2">
                    <i className="fa-solid fa-receipt text-indigo-600"></i>
                    <span>Payment History &amp; Invoices</span>
                  </span>
                  <i className="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
                </Link>
                <Link href="/dashboard/certificates" className="p-2.5 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between transition border border-transparent hover:border-slate-200">
                  <span className="flex items-center space-x-2">
                    <i className="fa-solid fa-award text-emerald-600"></i>
                    <span>Course Certificates</span>
                  </span>
                  <i className="fa-solid fa-arrow-right text-[10px] text-slate-400"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Change Password Card */}
          <div className="md:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-indigo-600 text-base font-black">
                  <i className="fa-solid fa-key"></i>
                  <span>Change Account Password</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your account password regularly to keep your course portal and code submissions secure.
                </p>
              </div>

              {/* Status Messages */}
              {successMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-base"></i>
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center space-x-2 animate-fade-in">
                  <i className="fa-solid fa-triangle-exclamation text-rose-600 text-base"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className={`fa-solid ${showCurrent ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 6 characters)"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className={`fa-solid ${showNew ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      <i className={`fa-solid ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span><i className="fa-solid fa-spinner fa-spin me-2"></i>Updating Password in Database...</span>
                    ) : (
                      <span>Update Password &amp; Save Credentials &rarr;</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <StudentFooter />
    </div>
  );
}
