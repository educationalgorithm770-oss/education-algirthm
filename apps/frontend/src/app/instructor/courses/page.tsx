'use client';

import React, { useState, useEffect } from 'react';
import InstructorNavbar from '@/components/layout/InstructorNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDuration, setNewLessonDuration] = useState('20 mins');
  const [newLessonUrl, setNewLessonUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instructor/courses');
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
        if (data.courses.length > 0 && selectedCourseId === null) {
          setSelectedCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch instructor courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || null;

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim() || newLessonTitle.trim().length < 3) {
      setFormError('Lesson title must be at least 3 characters.');
      return;
    }
    if (!activeModuleId) return;

    try {
      setSubmitting(true);
      setFormError('');
      const res = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: activeModuleId,
          title: newLessonTitle.trim(),
          duration: newLessonDuration.trim() || '20 mins',
          videoUrl: newLessonUrl.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddLessonModal(false);
        setNewLessonTitle('');
        setNewLessonUrl('');
        setSuccessBanner('Lesson added successfully to module!');
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchCourses();
      } else {
        setFormError(data.error || 'Failed to add lesson.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error adding lesson.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <InstructorNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-emerald-600 uppercase tracking-wider">
              <i className="fa-solid fa-shapes"></i>
              <span>Content Engineering Studio (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Course Content &amp; Video Streams
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Organize syllabus modules, link high-definition video streams, and publish curriculum updates.
            </p>
          </div>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left: Course List */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Assigned Tracks ({courses.length})</h2>
            {loading ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading courses...</div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourseId(course.id)}
                    className={`w-full text-left p-3 rounded-2xl transition border ${
                      selectedCourseId === course.id
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold text-slate-900 text-xs truncate">{course.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                      <span>{course.sections?.length || 0} Modules</span>
                      <span className="font-bold text-slate-700">₹{Number(course.price).toLocaleString('en-IN')}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Modules & Lessons Tree */}
          <div className="lg:col-span-3 space-y-6">
            {selectedCourse ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {selectedCourse.level} • {selectedCourse.duration}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">{selectedCourse.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCourse.description}</p>
                </div>

                <div className="space-y-4">
                  {(!selectedCourse.sections || selectedCourse.sections.length === 0) ? (
                    <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100">
                      No modules currently added to this course.
                    </div>
                  ) : (
                    selectedCourse.sections.map((section: any) => (
                      <div key={section.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-2">
                          <h3 className="font-bold text-xs text-slate-900">{section.title}</h3>
                          <button
                            onClick={() => {
                              setActiveModuleId(section.rawId || section.id);
                              setShowAddLessonModal(true);
                              setFormError('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm inline-flex items-center space-x-1 shrink-0 whitespace-nowrap self-end sm:self-auto"
                          >
                            <i className="fa-solid fa-plus text-[9px]"></i>
                            <span>Add Lesson</span>
                          </button>
                        </div>

                        {section.lessons && section.lessons.length > 0 ? (
                          <div className="space-y-2">
                            {section.lessons.map((lesson: any) => (
                              <div key={lesson.id} className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-center justify-between gap-3">
                                <div className="flex items-center space-x-2 min-w-0">
                                  <i className="fa-regular fa-circle-play text-emerald-600 shrink-0"></i>
                                  <span className="font-medium text-slate-800 truncate">{lesson.title}</span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-bold shrink-0">{lesson.duration}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No video lessons uploaded in this module yet.</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">Select a course to view modules.</div>
            )}
          </div>

        </div>

      </main>

      {/* Add Lesson Modal */}
      {showAddLessonModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add Lesson to Module</h3>
            {formError && <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">{formError}</div>}
            <form onSubmit={handleCreateLesson} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lesson Title</label>
                <input type="text" value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Duration</label>
                <input type="text" value={newLessonDuration} onChange={(e) => setNewLessonDuration(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Video Stream URL</label>
                <input type="url" placeholder="https://youtube.com/watch?v=..." value={newLessonUrl} onChange={(e) => setNewLessonUrl(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddLessonModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30">{submitting ? 'Saving...' : 'Add Lesson'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
