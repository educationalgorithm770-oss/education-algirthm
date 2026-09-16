'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';

interface VerifiedCert {
  certificateId: string;
  studentName: string;
  courseName: string;
  instructor: string;
  issuedDate: string;
  hash: string;
  status: string;
  institution: string;
  skills: string[];
}

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idParam = searchParams.get('id') || searchParams.get('code') || searchParams.get('hash') || '';
  const [searchInput, setSearchInput] = useState(idParam);
  const [loading, setLoading] = useState(Boolean(idParam));
  const [certData, setCertData] = useState<VerifiedCert | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function verify() {
      if (!idParam) {
        setLoading(false);
        setCertData(null);
        setErrorMsg(null);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        const res = await fetch(`/api/certificates/verify?id=${encodeURIComponent(idParam)}&hash=${encodeURIComponent(idParam)}`);
        const data = await res.json();
        if (data.success && data.valid && data.certificate) {
          setCertData(data.certificate);
          setErrorMsg(null);
        } else {
          setCertData(null);
          setErrorMsg(data.message || 'No verified credential found for this ID.');
        }
      } catch {
        setErrorMsg('Failed to verify certificate. Please try again.');
        setCertData(null);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [idParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/verify-certificate?id=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-8 print:p-0 print:m-0 print:max-w-none">
      {/* Screen-Only Header */}
      <div className="text-center space-y-3 print:hidden">
        <span className="px-4 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-extrabold uppercase tracking-wide inline-flex items-center shadow-xs">
          <i className="fa-solid fa-shield-check text-emerald-600 text-base me-1.5"></i> Authentic Cryptographic Credential
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          Official Credential Verification
        </h1>
        <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Public cryptographic verification of course completion and skill evaluation issued by Education Algorithm.
        </p>
      </div>

      {/* Screen-Only Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto print:hidden">
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter Certificate ID (e.g. EA-F789A2B1-2026)"
              className="w-full ps-10 pe-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition shrink-0"
          >
            Verify ID
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm animate-pulse print:hidden">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-slate-700">Verifying credential against official registry...</p>
        </div>
      )}

      {/* Error / Not Found State */}
      {!loading && errorMsg && (
        <div className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl text-center space-y-3 shadow-sm print:hidden">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <h2 className="text-lg font-extrabold text-rose-900">Unverified / Invalid Credential</h2>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            {errorMsg}
          </p>
          <div className="pt-2">
            <span className="text-[11px] text-slate-500">
              Only students who complete 100% of the lessons receive authentic verified certificates.
            </span>
          </div>
        </div>
      )}

      {/* Valid Certificate Display */}
      {!loading && certData && (
        <div className="certificate-card bg-white p-6 md:p-8 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 relative overflow-hidden print:border-4 print:border-emerald-600 print:shadow-none print:rounded-2xl print:p-6 print:m-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none print:hidden"></div>

          {/* Certificate Header */}
          <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                EA
              </div>
              <div>
                <div className="font-black text-slate-900 text-base tracking-tight leading-tight">EDUCATION ALGORITHM</div>
                <div className="text-[10px] text-slate-500 font-extrabold uppercase">{certData.institution}</div>
              </div>
            </div>

            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-black text-xs flex items-center space-x-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse print:hidden"></span>
              <span>{certData.status}</span>
            </div>
          </div>

          {/* Certificate Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Student Recipient</div>
                <div className="text-xl font-black text-slate-900 mt-0.5">{certData.studentName}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cohort Program</div>
                <div className="text-sm font-extrabold text-indigo-900 bg-indigo-50/80 py-1.5 px-3 rounded-lg border border-indigo-100 mt-0.5">
                  {certData.courseName}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Credential ID</div>
                <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">{certData.certificateId}</div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Issue Date &amp; Faculty</div>
                <div className="text-xs font-bold text-slate-800 mt-0.5">{certData.issuedDate} &bull; {certData.instructor}</div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <div className="font-bold text-slate-800 flex items-center space-x-1 text-[11px]">
              <i className="fa-solid fa-fingerprint text-indigo-600"></i>
              <span>SHA-256 Ledger Digest</span>
            </div>
            <div className="font-mono text-[9px] text-slate-600 break-all bg-white p-2 rounded-lg border border-slate-200">
              {certData.hash}
            </div>
          </div>

          {/* Print button */}
          <div className="pt-2 text-center print:hidden">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center space-x-2"
            >
              <i className="fa-solid fa-print"></i>
              <span>Print Verified Credential</span>
            </button>
          </div>
        </div>
      )}

      {/* Initial state with no query */}
      {!loading && !idParam && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-2 text-xs text-slate-500">
          <i className="fa-solid fa-magnifying-glass text-slate-400 text-2xl mb-1"></i>
          <p>Enter any Certificate ID or Scan QR Code to verify authentic completion.</p>
        </div>
      )}
    </div>
  );
}

export default function VerifyCertificatePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans print:bg-white print:p-0">
      <div className="print:hidden">
        <HeaderNavbar />
      </div>

      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center text-sm font-bold">Loading Verification...</div>}>
          <VerifyCertificateContent />
        </Suspense>
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
