'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import StudentNavbar from '@/components/layout/StudentNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface CourseCertificateStatus {
  courseId: number;
  courseTitle: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  isCompleted: boolean;
  certificate: {
    certificateCode: string;
    studentName: string;
    courseTitle: string;
    instructorName: string;
    issueDate: string;
    hash: string;
    verificationUrl: string;
  } | null;
}

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseCertificateStatus[]>([]);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch('/api/student/certificates');
        const data = await res.json();
        if (data.success && data.courses) {
          setCourses(data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch certificate status:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCertificates();
  }, []);

  const currentCourse = courses[selectedCourseIndex] ?? null;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleCopyVerificationLink = async (verifyUrl: string) => {
    const fullUrl = `${window.location.origin}${verifyUrl}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      }
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLinkedInShare = (verifyUrl: string) => {
    const fullUrl = encodeURIComponent(`${window.location.origin}${verifyUrl}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${fullUrl}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans print:bg-white print:p-0">
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, footer, nav, .print\\:hidden {
            display: none !important;
          }
          .certificate-card {
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="print:hidden">
        <StudentNavbar />
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-10 w-full space-y-6 print:p-0 print:m-0 print:max-w-none">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4 print:hidden">
          <div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-extrabold uppercase tracking-wide">
              Official Course Credentials
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-2">Verified Course Certificates</h1>
            <p className="text-slate-600 text-xs md:text-sm mt-0.5">
              Certificates are unlocked and issued automatically once you complete 100% of the lessons in a cohort program.
            </p>
          </div>

          <Link href="/dashboard" className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs md:text-sm rounded-xl transition">
            &larr; Back to Student Hub
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            <div className="h-64 bg-slate-100 rounded-2xl"></div>
          </div>
        )}

        {/* No Enrolled Courses State */}
        {!loading && courses.length === 0 && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              <i className="fa-solid fa-graduation-cap"></i>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">No Active Course Enrollments</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Enroll in a cohort or track to begin your learning journey and earn verified cryptographic certificates.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              <span>Explore Course Catalog</span>
              <i className="fa-solid fa-arrow-right text-[10px]"></i>
            </Link>
          </div>
        )}

        {/* Course Selector Tabs (If multiple enrolled courses) */}
        {!loading && courses.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2 print:hidden">
            {courses.map((c, idx) => (
              <button
                key={c.courseId}
                onClick={() => setSelectedCourseIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 whitespace-nowrap ${
                  selectedCourseIndex === idx
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{c.courseTitle}</span>
                {c.isCompleted ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold">
                    {c.percentage}%
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Course Progress & Certificate Display */}
        {!loading && currentCourse && (
          <div className="space-y-6">
            
            {/* Locked State: When Course is NOT 100% completed */}
            {!currentCourse.isCompleted ? (
              <div className="space-y-6">
                {/* Progress Status Banner */}
                <div className="bg-amber-50/90 border-2 border-amber-200 p-5 md:p-6 rounded-3xl shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-lg shadow-md shrink-0">
                        <i className="fa-solid fa-lock"></i>
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-amber-800 uppercase tracking-wide">
                          Course in Progress &bull; Certificate Locked
                        </div>
                        <h2 className="text-lg md:text-xl font-extrabold text-slate-900 mt-0.5">
                          {currentCourse.courseTitle}
                        </h2>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/learn/${currentCourse.courseId}`}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-2 shrink-0"
                    >
                      <span>Continue Learning</span>
                      <i className="fa-solid fa-play text-[10px]"></i>
                    </Link>
                  </div>

                  {/* Progress Bar & Stats */}
                  <div className="space-y-2 pt-2 border-t border-amber-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Completion Progress</span>
                      <span className="text-amber-800 font-extrabold">
                        {currentCourse.completedLessons} of {currentCourse.totalLessons} Lessons ({currentCourse.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-amber-200/60 rounded-full h-3.5 p-0.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(currentCourse.percentage, 4)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-amber-900/80 font-medium">
                      <i className="fa-solid fa-circle-info me-1"></i>
                      Complete all <strong>{currentCourse.totalLessons - currentCourse.completedLessons} remaining lessons</strong> in this course to unlock your official verified certificate.
                    </p>
                  </div>
                </div>

                {/* Locked Certificate Preview Placeholder */}
                <div className="relative bg-white p-8 rounded-3xl border-2 border-dashed border-slate-300 text-center space-y-4 opacity-75 select-none pointer-events-none">
                  <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-white shadow-xl border border-slate-200 flex items-center justify-center text-slate-700 text-2xl mb-2">
                      <i className="fa-solid fa-lock text-amber-500"></i>
                    </div>
                    <div className="text-base font-extrabold text-slate-900">Certificate Unlocks at 100% Completion</div>
                    <div className="text-xs text-slate-600 max-w-sm mt-1">
                      Your certificate will be automatically generated with cryptographic proof once you finish all video lessons and assignments.
                    </div>
                  </div>

                  {/* Blurred Background Dummy Certificate Frame */}
                  <div className="h-64 border-4 border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div className="font-extrabold text-slate-400">EDUCATION ALGORITHM</div>
                      <div className="text-xs text-slate-300 font-mono">EA-CERT-LOCKED</div>
                    </div>
                    <div className="space-y-2 py-4">
                      <div className="h-6 bg-slate-100 rounded w-1/2 mx-auto"></div>
                      <div className="h-4 bg-slate-50 rounded w-2/3 mx-auto"></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 pt-3 border-t border-slate-100">
                      <div>ISSUE DATE: LOCKED</div>
                      <div>STATUS: IN PROGRESS</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Unlocked Official Certificate Card */
              currentCourse.certificate && (
                <div className="space-y-6">
                  <div className="certificate-card bg-white p-6 md:p-8 rounded-3xl border-4 border-indigo-600 shadow-2xl space-y-5 relative overflow-hidden print:border-4 print:border-indigo-600 print:shadow-none print:rounded-2xl print:p-6 print:m-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-bl-full pointer-events-none print:hidden"></div>

                    {/* Certificate Header */}
                    <div className="flex flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
                          EA
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">EDUCATION ALGORITHM</div>
                          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Institute of Software Engineering</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">CREDENTIAL ID</div>
                        <div className="text-xs font-bold text-slate-800 font-mono">{currentCourse.certificate.certificateCode}</div>
                      </div>
                    </div>

                    {/* Certificate Core Statement */}
                    <div className="text-center space-y-2 py-2">
                      <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">Certificate of Completion</div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">{currentCourse.certificate.studentName}</h2>
                      <p className="text-slate-600 text-xs max-w-xl mx-auto">
                        has successfully completed all required coursework, live code reviews, and capstone evaluations (100% completion) for:
                      </p>
                      <div className="text-base md:text-lg font-extrabold text-indigo-900 bg-indigo-50/80 py-2 px-4 rounded-xl border border-indigo-100 max-w-xl mx-auto">
                        {currentCourse.certificate.courseTitle}
                      </div>
                    </div>

                    {/* Certificate Metadata */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div className="space-y-1">
                        <div className="text-[10px] text-slate-400 font-semibold">ISSUE DATE</div>
                        <div className="text-xs font-bold text-slate-800">{currentCourse.certificate.issueDate}</div>
                        <div className="text-[10px] text-slate-400 font-semibold pt-1">LEAD FACULTY SIGNATURE</div>
                        <div className="text-xs font-bold text-slate-900 font-serif italic">{currentCourse.certificate.instructorName}</div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-800 flex items-center justify-between text-[11px]">
                          <span className="flex items-center">
                            <i className="fa-solid fa-shield-halved text-emerald-600 me-1"></i>
                            SHA-256 Verification Hash
                          </span>
                          <Link
                            href={currentCourse.certificate.verificationUrl}
                            target="_blank"
                            className="text-indigo-600 hover:underline font-bold text-[10px] print:hidden"
                          >
                            Verify &rarr;
                          </Link>
                        </div>
                        <div className="font-mono text-[9px] text-slate-600 break-all bg-white p-1.5 rounded-md border border-slate-200 mt-0.5 leading-tight">
                          {currentCourse.certificate.hash}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center gap-4 print:hidden pt-2">
                    <button
                      onClick={handlePrintPdf}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      <i className="fa-solid fa-print"></i>
                      <span>Print / Save PDF Certificate</span>
                    </button>

                    <button
                      onClick={() => handleLinkedInShare(currentCourse.certificate!.verificationUrl)}
                      className="px-6 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-2"
                    >
                      <i className="fa-brands fa-linkedin text-blue-400"></i>
                      <span>Share on LinkedIn</span>
                    </button>

                    <button
                      onClick={() => handleCopyVerificationLink(currentCourse.certificate!.verificationUrl)}
                      className="px-6 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm rounded-xl transition flex items-center space-x-2"
                    >
                      <i className="fa-solid fa-link"></i>
                      <span>{copied ? 'Verification Link Copied!' : 'Copy Public Verification Link'}</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      <div className="print:hidden">
        <StudentFooter />
      </div>
    </div>
  );
}
