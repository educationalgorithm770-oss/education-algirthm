import React from 'react';
import type { Metadata } from 'next';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Terms of Service — Education Algorithm',
  description: 'Review the terms of service, platform usage guidelines, and student code of conduct for Education Algorithm cohorts.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <HeaderNavbar />

      <section className="bg-slate-900 text-white py-16 px-6 border-b border-slate-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-sm font-bold uppercase tracking-wider">
            Legal Terms
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-slate-400 text-base">Last Updated: September 2026</p>
        </div>
      </section>

      <main className="flex-1 py-16 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-base md:text-lg text-slate-700 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">1. Cohort Access & License Grant</h2>
            <p>
              Upon successful payment verification, students are granted a non-transferable, single-user license to access course video streams, Code Arena sandbox environments, and live masterclass recordings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">2. Code of Conduct & Code Sandbox Isolation</h2>
            <p>
              Students must adhere to academic integrity standards. Attempting malicious attacks, unauthorized data extraction, or bypassing execution sandboxes in the Docker Code Arena will result in immediate permanent account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">3. Intellectual Property & Course Materials</h2>
            <p>
              All video lessons, curriculum structures, system design blueprints, code repositories, and assessments provided by Education Algorithm are protected by intellectual property laws. Recording, redistributing, or re-publishing platform content without explicit written consent is strictly prohibited.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900">4. Platform Availability & Support</h2>
            <p>
              We strive to maintain continuous platform availability. Scheduled maintenance, cloud infrastructure updates, or unforeseen service disruptions will be communicated via the student notification centre and official support channels.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
