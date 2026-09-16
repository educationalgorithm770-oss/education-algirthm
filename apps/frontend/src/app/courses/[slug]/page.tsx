'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import HeaderNavbar from '@/components/layout/HeaderNavbar';
import Footer from '@/components/layout/Footer';
import { Accordion } from '@/components/ui/Accordion';
import RazorpayCheckout from '@/components/features/RazorpayCheckout';

interface VideoLesson {
  id: number;
  title: string;
  duration: string;
}

interface CourseModule {
  id: number;
  title: string;
  description: string;
  videos: VideoLesson[];
}

interface Course {
  id: number;
  title: string;
  slug: string;
  description: string;
  level: string;
  duration: string;
  price: number;
  status: string;
  modules: CourseModule[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        setLoading(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          const matched = data.courses.find(
            (c: Course) => c.slug === slug || String(c.id) === slug || c.title.toLowerCase().replace(/\s+/g, '-') === slug
          );
          if (matched) {
            setCourse(matched);
          } else if (data.courses.length > 0) {
            setCourse(data.courses[0]);
          } else {
            setError(true);
          }
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to load course details:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchCourse();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <HeaderNavbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-600"></i>
            <div className="text-sm font-bold text-slate-500">Loading Cohort Syllabus...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <HeaderNavbar />
        <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-2xl text-slate-400">
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800">Course Program Not Found</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The course you are looking for might have moved or been updated. Browse our complete catalog of programs.
          </p>
          <Link
            href="/courses"
            className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            &larr; Back to All Courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const moduleAccordionItems = (course.modules || []).map((mod, idx) => ({
    id: `${course.id}_mod_${idx}`,
    title: mod.title,
    content: (
      <div className="space-y-2 text-slate-700 text-xs sm:text-sm">
        {mod.description && <p className="text-slate-600 font-normal mb-2">{mod.description}</p>}
        {mod.videos && mod.videos.length > 0 ? (
          <ul className="space-y-1.5 list-disc pl-5">
            {mod.videos.map((v) => (
              <li key={v.id} className="font-semibold text-slate-800">
                {v.title} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">({v.duration || '15 mins'})</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-slate-400 italic">Curriculum content details coming soon.</div>
        )}
      </div>
    ),
  }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <HeaderNavbar />

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-12 sm:py-16 px-6 border-b border-slate-800 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center space-x-2 text-xs text-indigo-400 font-bold">
            <Link href="/courses" className="hover:underline">
              All Courses
            </Link>
            <span>&rarr;</span>
            <span className="text-slate-300 truncate max-w-xs">{course.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-wider">
              {course.level || 'Intermediate to Advanced'}
            </span>
            <span className="text-xs font-bold text-slate-400 flex items-center">
              <i className="fa-regular fa-clock me-1.5 text-indigo-400"></i> {course.duration || '16 Weeks Live'}
            </span>
            <span className="text-xs font-bold text-amber-400 flex items-center">
              <i className="fa-solid fa-star me-1"></i> 4.9 (4,200+ Reviews)
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white max-w-4xl leading-tight">
            {course.title}
          </h1>

          <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
            {course.description || 'Master modern enterprise architectures, cloud systems, and hands-on production code.'}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 px-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Syllabus & Highlights */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Highlights */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <i className="fa-solid fa-trophy text-amber-500"></i>
              <span>What You Will Master in this Program</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-medium text-slate-700">
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-1 shrink-0"></i>
                <span>Hands-on enterprise system design with FAANG mentors</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-1 shrink-0"></i>
                <span>Automated code sandbox &amp; live test-case evaluation</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-1 shrink-0"></i>
                <span>10+ Production microservice capstones &amp; portfolio projects</span>
              </div>
              <div className="flex items-start space-x-2">
                <i className="fa-solid fa-circle-check text-emerald-600 mt-1 shrink-0"></i>
                <span>1-on-1 Mock Technical Interviews &amp; Placement Referral</span>
              </div>
            </div>
          </div>

          {/* Curriculum Accordion */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">Comprehensive Curriculum</h3>
                <p className="text-xs text-slate-500">Step-by-step syllabus designed for senior software engineering roles.</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-extrabold">
                {course.modules?.length || 0} Modules
              </span>
            </div>

            {course.modules && course.modules.length > 0 ? (
              <Accordion items={moduleAccordionItems} />
            ) : (
              <div className="text-xs text-slate-400 p-4 bg-slate-50 rounded-2xl">
                Curriculum syllabus is currently being updated for the upcoming batch release.
              </div>
            )}
          </div>

          {/* Connected Live Webinars banner */}
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                Live Masterclasses Available
              </span>
              <h4 className="text-lg font-black">Attend Upcoming Faculty Masterclasses</h4>
              <p className="text-xs text-slate-300">
                Reserve your free seat or stream recordings hosted by lead architects.
              </p>
            </div>
            <Link
              href="/webinars"
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition whitespace-nowrap"
            >
              Browse Webinars &rarr;
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Enrollment Card & Checkout */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 sticky top-24">
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cohort Enrollment Fee</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  ₹{course.price ? course.price.toLocaleString() : '24,999'}
                </span>
                <span className="text-xs text-slate-400 line-through">₹49,999</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md">
                  50% OFF
                </span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold">
                ✓ Includes Lifetime Access + 1-on-1 Mentorship
              </div>
            </div>

            <div className="space-y-3">
              <RazorpayCheckout
                courseId={course.id}
                courseTitle={course.title}
                price={course.price || 24999}
              />
              <Link
                href="/webinars"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl transition block text-center border border-slate-200"
              >
                Attend Free Preview Masterclass &rarr;
              </Link>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 pt-2">
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-code text-indigo-600 text-sm"></i>
                <span>Interactive Cloud Sandbox &amp; Code Arena</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-certificate text-indigo-600 text-sm"></i>
                <span>Verified Industry Completion Certificate</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fa-solid fa-headset text-indigo-600 text-sm"></i>
                <span>Dedicated TA &amp; Mentor Doubts Desk</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
