import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us & Pedagogy — Education Algorithm',
  description: 'Learn about our engineering accelerator mission, zero-trust Docker code execution architecture, and senior FAANG faculty mentors.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <HeaderNavbar />

      {/* Hero Banner */}
      <section className="bg-white py-16 px-6 border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-50/60 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>

        <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
          <span className="px-4 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-extrabold uppercase tracking-wider inline-flex items-center space-x-1 shadow-sm">
            <i className="fa-solid fa-graduation-cap text-purple-600 me-1.5"></i>
            Engineering Excellence &amp; Pedagogy
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Our Mission &amp; Learning Model</h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            We empower software engineers to master production system architecture, Java virtual threads, distributed microservices, and Generative AI.
          </p>
        </div>
      </section>

      <main className="flex-1 py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-16">
        {/* Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              <i className="fa-solid fa-book-open text-indigo-600"></i>
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl">Industry-Curated Curriculum</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Curated by senior engineering leaders to match production distributed systems used at high-growth tech scaleups.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              <i className="fa-solid fa-microchip text-purple-600"></i>
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl">Docker Execution Sandbox</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Isolated multi-language execution runtime providing instant automated test verification and performance benchmarks.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition">
              <i className="fa-solid fa-users text-emerald-600"></i>
            </div>
            <h3 className="font-extrabold text-slate-900 text-xl">Senior SDE Mentorship</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Direct access to senior mentors for 1-on-1 code reviews, resume optimizations, and system design mocks.
            </p>
          </div>
        </div>

        {/* 4-Phase Pedagogy Roadmap */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">Step-By-Step Pedagogy</span>
            <h2 className="text-3xl font-extrabold text-slate-900">The 4-Phase Cohort Roadmap</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-indigo-300 transition">
              <div className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md inline-block">PHASE 01</div>
              <div className="font-extrabold text-slate-900 text-base">Core Computer Science</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Java 21, Virtual Threads, Data Structures &amp; LeetCode-style algorithm optimization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-purple-300 transition">
              <div className="text-xs font-mono font-black text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-md inline-block">PHASE 02</div>
              <div className="font-extrabold text-slate-900 text-base">Backend Microservices</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Spring Boot REST APIs, Spring Data JPA, Hibernate, MySQL, and Docker containerization.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-emerald-300 transition">
              <div className="text-xs font-mono font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md inline-block">PHASE 03</div>
              <div className="font-extrabold text-slate-900 text-base">GenAI &amp; RAG Systems</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Python, LLM orchestration, PyTorch, Vector Databases, and Agentic RAG workflows.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 hover:border-amber-300 transition">
              <div className="text-xs font-mono font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md inline-block">PHASE 04</div>
              <div className="font-extrabold text-slate-900 text-base">System Design &amp; Hires</div>
              <p className="text-xs text-slate-600 leading-relaxed">
                High-throughput distributed architecture, mock interviews, and 1-on-1 placement referrals.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-3xl p-10 text-center space-y-6 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-indigo-50/50 pointer-events-none"></div>
          <div className="relative z-10 space-y-4 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">Ready to Join the Next Engineering Cohort?</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Explore our Java Full Stack &amp; GenAI System Design tracks today and fast-track your tech career.</p>
            <div className="pt-2">
              <Link href="/courses" className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/20 inline-flex items-center space-x-2 transition">
                <span>Explore Cohort Programs</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

