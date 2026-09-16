'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';

interface CourseOption {
  id: number;
  title: string;
  slug?: string;
  price?: number;
}

interface Instructor {
  id: string;
  rawId: number;
  name: string;
  avatar: string;
  role: string;
  email: string;
  bio: string;
  assignedCourseIds: number[];
  assignedCourseNames: string[];
  assignedCourses: number;
  studentsTaught: number;
  rating: number;
  status: 'active' | 'on_leave';
}

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/instructors');
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.instructors)) setInstructors(data.instructors);
        if (Array.isArray(data.courses)) setCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to load instructors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const openAddModal = () => {
    setEditingInstructor(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('Lead Engineering Faculty');
    setBio('');
    setSelectedCourseIds(courses.length > 0 ? [courses[0].id] : [1]);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (ins: Instructor) => {
    setEditingInstructor(ins);
    setName(ins.name);
    setEmail(ins.email);
    setPassword('');
    setRole(ins.role);
    setBio(ins.bio);
    setSelectedCourseIds(ins.assignedCourseIds.length > 0 ? ins.assignedCourseIds : [1]);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const toggleCourseSelection = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.length > 1
          ? prev.filter((id) => id !== courseId)
          : prev // Keep at least 1 course
        : [...prev, courseId]
    );
  };

  const toggleStatus = async (rawId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'on_leave' : 'active';
    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setInstructors((prev) =>
          prev.map((ins) => (ins.rawId === rawId ? { ...ins, status: newStatus } : ins))
        );
        setSuccessBanner(`Faculty status updated to ${newStatus === 'active' ? 'Active' : 'On Leave'}.`);
        setTimeout(() => setSuccessBanner(''), 3000);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteInstructor = async (ins: Instructor) => {
    if (!confirm(`Are you sure you want to remove faculty member "${ins.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/instructors?id=${ins.rawId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInstructors((prev) => prev.filter((item) => item.rawId !== ins.rawId));
        setSuccessBanner(`Faculty member "${ins.name}" removed successfully.`);
        setTimeout(() => setSuccessBanner(''), 4000);
      } else {
        alert(data.error || 'Failed to remove faculty member.');
      }
    } catch (err) {
      console.error('Failed to delete instructor:', err);
    }
  };

  const handleSaveInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('Full name and email address are required.');
      return;
    }

    if (!editingInstructor && (!password || password.length < 6)) {
      setErrorMsg('Login password must be at least 6 characters.');
      return;
    }

    if (selectedCourseIds.length === 0) {
      setErrorMsg('Please select at least one course track to assign to this faculty.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const method = editingInstructor ? 'PUT' : 'POST';
      const bodyPayload: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim() || 'Faculty Lead',
        bio: bio.trim(),
        courseIds: selectedCourseIds,
      };

      if (editingInstructor) {
        bodyPayload.rawId = editingInstructor.rawId;
        if (password.trim()) bodyPayload.password = password.trim();
      } else {
        bodyPayload.password = password.trim();
      }

      const res = await fetch('/api/admin/instructors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (data.success) {
        setShowAddModal(false);
        setSuccessBanner(
          editingInstructor
            ? `Faculty member "${name}" updated successfully.`
            : `Faculty member "${name}" created with assigned courses.`
        );
        setTimeout(() => setSuccessBanner(''), 5000);
        await fetchInstructors();
      } else {
        setErrorMsg(data.error || 'Failed to save faculty record.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-chalkboard-user"></i>
              <span>Faculty Administration (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Faculty Roster &amp; Course Assignment Desk
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Create course-specialized faculty accounts, assign curriculum tracks, and manage faculty studio login access.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center space-x-2 cursor-pointer"
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Add Faculty Member</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md animate-fade-in">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active Faculty</div>
            <div className="text-2xl font-black text-slate-900">
              {instructors.filter((i) => i.status === 'active').length} Members
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Course Tracks</div>
            <div className="text-2xl font-black text-purple-600">{courses.length} Tracks</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faculty Portal URL</div>
            <div className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg truncate">
              /instructor/login
            </div>
          </div>
        </div>

        {/* Instructor Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-x-auto space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Faculty Roster &amp; Assigned Tracks ({instructors.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <i className="fa-solid fa-spinner fa-spin text-2xl text-purple-600"></i>
              <div>Loading faculty records from MySQL...</div>
            </div>
          ) : instructors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <i className="fa-solid fa-user-graduate text-3xl text-purple-300"></i>
              <p className="font-bold text-slate-700">No faculty records found.</p>
              <p className="text-slate-400 text-[11px]">Click "Add Faculty Member" above to create an instructor account.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Assigned Course Tracks</th>
                  <th className="py-3 px-4">Enrolled Learners</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {instructors.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {ins.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{ins.name}</div>
                          <div className="text-[11px] text-purple-600 font-mono">{ins.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{ins.role}</td>
                    <td className="py-3.5 px-4">
                      {ins.assignedCourseNames && ins.assignedCourseNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {ins.assignedCourseNames.map((cName, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-[10px] font-extrabold truncate"
                            >
                              {cName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No course assigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {ins.studentsTaught > 0 ? (
                        <span>{ins.studentsTaught} Learners</span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 Active</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          ins.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ins.status === 'active' ? 'Active' : 'On Leave'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(ins)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
                          title="Edit Faculty & Courses"
                        >
                          <i className="fa-solid fa-pen text-[10px] text-purple-600"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => toggleStatus(ins.rawId, ins.status)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                            ins.status === 'active'
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {ins.status === 'active' ? 'Leave' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteInstructor(ins)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Faculty Account"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Add / Edit Faculty Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingInstructor ? 'Edit Faculty Account' : 'Create Faculty Account (Course-Based)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingInstructor
                    ? 'Update faculty credentials, specialization, and assigned course tracks.'
                    : 'Create credentials and assign teaching tracks for instructor studio access.'}
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold flex items-center space-x-2">
                <i className="fa-solid fa-circle-exclamation shrink-0"></i>
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveInstructor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="Dr. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email (Login ID) *</label>
                  <input
                    type="email"
                    placeholder="rajesh.kumar@edualg.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {editingInstructor ? 'Reset Password (leave blank to keep current)' : 'Login Password *'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={editingInstructor ? '••••••••••••' : 'Min 6 characters (e.g. Faculty@2026)'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900 pr-10"
                    required={!editingInstructor}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Course Program Assignment (Course-Based Account Creation) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Assigned Course Programs * <span className="text-slate-400 font-normal">(Select tracks taught by this faculty)</span>
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {courses.map((cr) => {
                    const isSelected = selectedCourseIds.includes(cr.id);
                    return (
                      <button
                        key={cr.id}
                        type="button"
                        onClick={() => toggleCourseSelection(cr.id)}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-purple-50 border-purple-300 text-purple-900'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                              isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300'
                            }`}
                          >
                            {isSelected && <i className="fa-solid fa-check"></i>}
                          </span>
                          <span>{cr.title}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">ID #{cr.id}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Designation / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Java & Distributed Systems Architect"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bio / Profile Summary</label>
                <textarea
                  placeholder="10+ years experience in high-throughput enterprise systems..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-save"></i>
                  <span>{submitting ? 'Saving...' : editingInstructor ? 'Save Changes' : 'Create Faculty'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StudentFooter />
    </div>
  );
}
