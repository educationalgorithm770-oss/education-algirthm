import React from 'react';
import type { Metadata } from 'next';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Security — Education Algorithm',
  description: 'Learn how Education Algorithm protects your data with cryptographic encryption, Zero-Trust authentication, and fail-closed Razorpay webhook verification.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <HeaderNavbar />

      <section className="bg-slate-900 text-white py-16 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-bold uppercase tracking-wider">
            Legal Disclosures
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Privacy Policy & Data Security</h1>
          <p className="text-slate-400 text-base">Last Updated: September 2026</p>
        </div>
      </section>

      <main className="flex-1 py-16 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-base md:text-lg text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">1. Information Collection & Usage</h2>
            <p>
              Education Algorithm collects personal details including full name, email address, phone number, and payment credentials exclusively for processing cohort enrollments, course access authorization, and issuing verifiable certificates.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">2. Zero-Trust Security & Session Fingerprinting</h2>
            <p>
              We implement cryptographic SHA-256 session fingerprinting pairing user authorization tokens with User-Agent and IP headers. Session hijacking or token theft results in automatic session termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">3. Video Security & Content Encryption</h2>
            <p>
              Video streaming links are cryptographically signed with short-lived session tokens to ensure maximum content security. Unapproved downloads or redistribution are strictly monitored and logged.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">4. Third-Party Integrations & Razorpay Payments</h2>
            <p>
              Financial transactions are processed directly through Razorpay via cryptographic fail-closed HMAC webhook signatures. We do not store raw credit card or banking details on our servers.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
