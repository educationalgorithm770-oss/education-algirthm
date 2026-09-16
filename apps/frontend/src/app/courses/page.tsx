'use client';

import React, { useState, useEffect } from 'react';
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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses)) {
          setCourses(data.courses);
        }
      } catch (err) {
        console.error('Failed to load public courses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <HeaderNavbar />

      {/* Header Banner */}
      <section className="bg-slate-900 text-white py-10 sm:py-16 px-4 sm:px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto text-center space-y-3 sm:space-y-4">
          <span className="px-3.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider">
            Industry Curated Programs
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Engineering Cohorts &amp; Syllabus</h1>
          <p className="text-slate-400 text-xs sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Master production software development. High-definition live video lessons, interactive masterclasses, and hands-on projects.
          </p>

          {/* Search Bar */}
          <div className="pt-4 sm:pt-6 max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, topic, or technology..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-base text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>
      </section>

      {/* Courses Catalog Section */}
      <main className="flex-1 py-10 sm:py-16 px-3 sm:px-6 max-w-6xl mx-auto w-full space-y-8 sm:space-y-12">
        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-600 mb-3"></i>
            <div className="text-sm font-medium">Loading live courses...</div>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">🔍</div>
            <h3 className="text-xl font-bold text-slate-800">No published courses found</h3>
            <p className="text-base text-slate-500">Check back soon for upcoming cohort releases!</p>
          </div>
        ) : (
          filteredCourses.map((course) => {
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
              <div key={course.id} id={`course-${course.id}`} className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-6 sm:space-y-8 scroll-mt-20">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                        {course.level || 'Intermediate'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        <i className="fa-regular fa-clock me-1 text-indigo-600"></i> {course.duration || '12 Weeks'}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900">{course.title}</h2>
                    <p className="text-slate-600 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed">
                      {course.description || 'Comprehensive software engineering program.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 text-center w-full md:w-64 shrink-0 shadow-2xs space-y-3">
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cohort Fee</div>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">₹{course.price.toLocaleString()}</div>
                    </div>
                    <div>
                      <RazorpayCheckout
                        courseId={course.id}
                        courseTitle={course.title}
                        price={course.price}
                      />
                    </div>
                  </div>
                </div>

                {/* Course Modules Syllabus Accordion */}
                {course.modules && course.modules.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      Detailed Curriculum Modules ({course.modules.length})
                    </h3>
                    <Accordion items={moduleAccordionItems} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <Footer />
    </div>
  );
}
