'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_DATA } from '@/config/site-data';

export default function Footer() {
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      setIsNativeApp(true);
    }
  }, []);

  if (isNativeApp) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-slate-200">
        
        {/* Col 1: Brand Info */}
        <div className="space-y-5 md:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white font-bold text-xl">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <span className="font-extrabold text-xl text-slate-900">Education Algorithm</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Production-grade Software Engineering &amp; AI Systems Accelerator.
          </p>
          <div className="flex space-x-2 text-slate-400">
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"><i className="fa-brands fa-twitter text-sm"></i></a>
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"><i className="fa-brands fa-linkedin-in text-sm"></i></a>
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"><i className="fa-brands fa-youtube text-sm"></i></a>
            <a href="#" className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition"><i className="fa-brands fa-github text-sm"></i></a>
          </div>
        </div>

        {/* Col 2: Cohorts */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Engineering Cohorts</h4>
          <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
            <li><Link href="/courses" className="hover:text-indigo-600 transition">Java Full Stack &amp; System Design</Link></li>
            <li><Link href="/courses" className="hover:text-indigo-600 transition">Data Science &amp; GenAI Systems</Link></li>
            <li><Link href="/code-arena" className="hover:text-indigo-600 transition">Live Interactive Code Arena</Link></li>
            <li><Link href="/webinars" className="hover:text-indigo-600 transition">Live FAANG Masterclasses</Link></li>
          </ul>
        </div>

        {/* Col 3: Company */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Company &amp; Outcomes</h4>
          <ul className="space-y-2.5 text-sm text-slate-700 font-medium">
            <li><Link href="/about" className="hover:text-indigo-600 transition">About Our Pedagogy</Link></li>
            <li><Link href="/jobs" className="hover:text-indigo-600 transition flex items-center gap-1.5"><span>Verified Talent Radar</span><span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">780+</span></Link></li>
            <li><Link href="/outcomes" className="hover:text-indigo-600 transition">Career Placement Outcomes</Link></li>
            <li><Link href="/contact" className="hover:text-indigo-600 transition">Contact Support &amp; Inquiries</Link></li>
            <li><Link href="/privacy" className="hover:text-indigo-600 transition">Privacy &amp; Compliance</Link></li>
            <li><Link href="/terms" className="hover:text-indigo-600 transition">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Col 4: Portals & Logins */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Student Resources</h4>
          <ul className="space-y-2.5 text-sm font-semibold">
            <li>
              <Link href="/login" className="inline-flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-700 transition">
                <i className="fa-solid fa-graduation-cap text-xs"></i>
                <span>Student LMS Login</span>
              </Link>
            </li>
            <li>
              <Link href="/courses" className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-indigo-600 transition">
                <i className="fa-solid fa-shapes text-xs text-indigo-600"></i>
                <span>Browse All Courses</span>
              </Link>
            </li>
            <li>
              <Link href="/code-arena" className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-indigo-600 transition">
                <i className="fa-solid fa-code text-xs text-indigo-600"></i>
                <span>Code Arena Sandbox</span>
              </Link>
            </li>
            <li>
              <Link href="/verify-certificate" className="inline-flex items-center space-x-1.5 text-slate-700 hover:text-indigo-600 transition">
                <i className="fa-solid fa-shield-check text-xs text-indigo-600"></i>
                <span>Verify Credential</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 5: Newsletter */}
        <div className="space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Stay Updated</h4>
          <p className="text-xs text-slate-600 font-normal leading-relaxed">Subscribe for weekly system design challenges &amp; AI updates.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-xs whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-600 font-medium gap-4 text-center md:text-left">
        <div>© 2026 Education Algorithm. Built with Next.js 14 &amp; Node.js Architecture.</div>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 font-semibold">
          <Link href="/login" className="text-indigo-600 hover:underline">Student LMS Login</Link>
          <span className="text-slate-300">•</span>
          <Link href="/courses" className="hover:text-slate-900">Course Catalog</Link>
          <span className="text-slate-300">•</span>
          <Link href="/verify-certificate" className="hover:text-slate-900">Verify Certificate</Link>
          <span className="text-slate-300">•</span>
          <Link href="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
          <span className="text-slate-300">•</span>
          <Link href="/terms" className="hover:text-slate-900">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  );
}
