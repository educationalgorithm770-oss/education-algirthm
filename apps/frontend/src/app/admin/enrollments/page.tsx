'use client';

import React, { useState, useEffect } from 'react';
import AdminNavbar from '@/components/layout/AdminNavbar';
import StudentFooter from '@/components/layout/StudentFooter';
import CustomDropdown from '@/components/ui/CustomDropdown';

interface EnrollmentRecord {
  id: number;
  studentId: number | null;
  name: string;
  email: string;
  phone: string;
  courseId: number | null;
  courseTitle: string;
  amount: number;
  status: string;
  paymentStatus: string;
  paymentId: string;
  enrolledAt: string;
}

interface CourseOption {
  id: number;
  title: string;
  price: number;
  level: string;
}

interface StudentOption {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'scholarship' | 'paid'>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedExistingStudentId, setSelectedExistingStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('Student@123');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('');
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [amount, setAmount] = useState('15000');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [successBanner, setSuccessBanner] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/enrollments');
      const data = await res.json();
      if (data.success) {
        setEnrollments(data.enrollments || []);
        setCourses(data.courses || []);
        setStudents(data.students || []);
        if (data.courses && data.courses.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data.courses[0].id);
          setSelectedCourseTitle(data.courses[0].title);
          setAmount(String(data.courses[0].price || 15000));
        }
      }
    } catch (err) {
      console.error('Failed to load enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollmentData();
  }, []);

  const flash = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const handleCourseChange = (cId: number) => {
    setSelectedCourseId(cId);
    const found = courses.find((c) => c.id === cId);
    if (found) {
      setSelectedCourseTitle(found.title);
      setAmount(String(found.price || 15000));
    }
  };

  const handleSelectExistingStudent = (sIdStr: string) => {
    setSelectedExistingStudentId(sIdStr);
    if (!sIdStr) return;
    const sId = Number(sIdStr);
    const found = students.find((s) => s.id === sId);
    if (found) {
      setStudentName(found.name);
      setEmail(found.email);
      setPhone(found.phone || '');
    }
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || (!selectedCourseId && !selectedCourseTitle)) {
      setErrorMsg('Please provide student email and select a course.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedExistingStudentId ? Number(selectedExistingStudentId) : null,
          name: studentName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          courseId: selectedCourseId,
          courseTitle: selectedCourseTitle,
          password: studentPassword.trim(),
          amount: parseFloat(amount) || 0,
          paymentStatus,
          status: 'active',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setStudentName(''); setEmail(''); setPhone(''); setSelectedExistingStudentId('');
        flash(`🎉 Access granted to ${email} for ${selectedCourseTitle}! Student account active.`);
        await fetchEnrollmentData();
      } else {
        setErrorMsg(data.error || 'Failed to create enrollment.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (enrollment: EnrollmentRecord) => {
    const newStatus = enrollment.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        flash(`Access status for ${enrollment.email} switched to ${newStatus.toUpperCase()}!`);
        await fetchEnrollmentData();
      } else {
        alert(data.message || 'Failed to update status.');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number, studentEmail: string, courseTitle: string) => {
    if (!confirm(`Are you sure you want to revoke course access for ${studentEmail} (${courseTitle})?`)) return;
    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        flash(`🗑️ Enrollment for ${studentEmail} removed from database.`);
        await fetchEnrollmentData();
      } else {
        alert(data.message || 'Failed to delete enrollment.');
      }
    } catch {
      alert('Error deleting enrollment.');
    }
  };

  // KPI calculations
  const totalEnrolled = enrollments.length;
  const activeCount = enrollments.filter((e) => e.status === 'active').length;
  const scholarshipCount = enrollments.filter((e) => e.paymentStatus === 'scholarship').length;
  const totalRevenue = enrollments
    .filter((e) => e.paymentStatus === 'paid' || e.paymentStatus === 'completed')
    .reduce((sum, e) => sum + e.amount, 0);

  // Filtered enrollments
  const filteredEnrollments = enrollments.filter((en) => {
    const matchesSearch =
      en.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      en.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      en.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return en.status === 'active';
    if (statusFilter === 'suspended') return en.status === 'suspended';
    if (statusFilter === 'scholarship') return en.paymentStatus === 'scholarship';
    if (statusFilter === 'paid') return en.paymentStatus === 'paid' || en.paymentStatus === 'completed';

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-extrabold text-purple-600 uppercase tracking-wider">
              <i className="fa-solid fa-user-plus"></i>
              <span>Student Access &amp; Enrollment Engine (Live MySQL)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Enterprise Course Enrollment Desk
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Directly provision course licenses, manage scholarship grants, and monitor live student admissions.
            </p>
          </div>

          <button
            onClick={() => { setShowModal(true); setErrorMsg(''); }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 flex items-center justify-center space-x-2"
          >
            <i className="fa-solid fa-user-check"></i>
            <span>+ Enroll Student Manually</span>
          </button>
        </div>

        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center space-x-2 shadow-md">
            <i className="fa-solid fa-circle-check text-sm"></i>
            <span>{successBanner}</span>
          </div>
        )}

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Enrolled</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalEnrolled}</div>
            <span className="text-[10px] text-slate-500 font-medium">Students in database</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Active Access</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeCount}</div>
            <span className="text-[10px] text-emerald-600 font-bold">Granted LMS access</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Scholarships</span>
            <div className="text-2xl font-black text-purple-600 mt-1">{scholarshipCount}</div>
            <span className="text-[10px] text-purple-600 font-bold">Fee waivers granted</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Total Collected</span>
            <div className="text-2xl font-black text-slate-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500 font-medium">Enrolled tuition fee</span>
          </div>
        </div>

        {/* Enrollment Table & Filters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                placeholder="Search by student name, email, or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({enrollments.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('scholarship')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'scholarship' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Scholarships
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  statusFilter === 'suspended' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading enrollments from live database...</div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs space-y-2">
              <i className="fa-solid fa-users text-3xl text-slate-300 block"></i>
              <p className="font-medium text-slate-600">No enrollments match your filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Course Track</th>
                    <th className="py-3 px-4">Tuition Fee</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Access Status</th>
                    <th className="py-3 px-4">Enrolled Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEnrollments.map((en) => (
                    <tr key={en.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{en.name}</div>
                        <div className="text-[11px] text-slate-400">{en.email}</div>
                        {en.phone && en.phone !== 'N/A' && (
                          <div className="text-[10px] text-slate-400 font-mono">{en.phone}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-purple-700 block">{en.courseTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Ref: {en.paymentId}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">₹{en.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center ${
                          en.paymentStatus === 'paid' || en.paymentStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : en.paymentStatus === 'scholarship'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {en.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(en)}
                          title="Click to toggle status"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition inline-flex items-center space-x-1.5 ${
                            en.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${en.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{en.status === 'active' ? 'Active Access' : 'Suspended'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {new Date(en.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteEnrollment(en.id, en.email, en.courseTitle)}
                          title="Revoke and delete enrollment"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center"
                        >
                          <i className="fa-regular fa-trash-can text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* Modal: Grant Manual Access */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Provision Course Enrollment</h3>
                <p className="text-[11px] text-slate-500">Auto-links student account &amp; grants instant course playback access</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <i className="fa-solid fa-xmark text-base"></i>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateEnrollment} className="space-y-4 text-xs">
              
              {/* Optional: Pick Existing Registered Student */}
              {students.length > 0 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pick Existing Student (Optional)</label>
                  <CustomDropdown
                    value={selectedExistingStudentId}
                    onChange={(val) => handleSelectExistingStudent(val)}
                    placeholder="-- Or enter new student details below --"
                    options={[
                      { value: '', label: '-- Or enter new student details below --' },
                      ...students.map((s) => ({
                        value: String(s.id),
                        label: `${s.name} (${s.email})`,
                        icon: '👤'
                      }))
                    ]}
                    variant="indigo"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Student Email Address</label>
                <input
                  type="email"
                  placeholder="rahul.sharma@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Student Login Password</span>
                  <span className="text-[10px] text-purple-600 font-bold">New Account / Password Reset</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (e.g. Student@123)"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs p-1"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Default: <code className="bg-slate-100 text-purple-700 font-bold px-1 py-0.5 rounded">Student@123</code>. You can change this to any password for the student.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Course Track</label>
                <CustomDropdown
                  value={String(selectedCourseId)}
                  onChange={(val) => handleCourseChange(Number(val))}
                  options={courses.map((c) => ({
                    value: String(c.id),
                    label: `${c.title} (₹${c.price.toLocaleString('en-IN')})`,
                    icon: '📚'
                  }))}
                  variant="indigo"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                  <CustomDropdown
                    value={paymentStatus}
                    onChange={(val) => setPaymentStatus(val)}
                    options={[
                      { value: 'paid', label: 'Paid (Full Access)', icon: '✅' },
                      { value: 'scholarship', label: 'Scholarship Waiver', icon: '🎓' },
                      { value: 'partial', label: 'Partial Payment', icon: '⏳' },
                      { value: 'pending', label: 'Pending', icon: '🕒' }
                    ]}
                    variant="indigo"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold shadow-md shadow-purple-600/30"
                >
                  {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
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
