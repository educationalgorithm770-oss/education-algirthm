'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface CourseOption {
  id: number;
  title: string;
  price: number;
  slug?: string;
  duration?: string;
  level?: string;
  description?: string;
  highlights?: string[];
}

interface BatchOption {
  id: number;
  name: string;
  schedule?: string;
}


export default function EnrollmentFlow({ initialCourseId }: { initialCourseId?: string | number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIntentId = searchParams.get('intentId');
  const courseParam = searchParams.get('course') || initialCourseId;

  // ── Global Flow State ────────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailAccountStatus, setEmailAccountStatus] = useState<'NEW_STUDENT' | 'EXISTING_STUDENT' | 'VERIFIED_SESSION'>('NEW_STUDENT');
  const [verifiedStudentEmail, setVerifiedStudentEmail] = useState<string>('');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);

  // ── Courses & Batches Data ───────────────────────────────────────────────────
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([
    { id: 1, name: 'Fall 2026 Live Cohort (Batch A)', schedule: 'Sat & Sun • 10:00 AM - 1:00 PM IST' },
    { id: 2, name: 'Fall 2026 Evening Cohort (Batch B)', schedule: 'Mon & Wed • 7:00 PM - 10:00 PM IST' },
  ]);

  // ── Step 1 State (Profile & Track) ───────────────────────────────────────────
  const [selectedCourseId, setSelectedCourseId] = useState<number>(1);
  const [selectedBatchName, setSelectedBatchName] = useState('Fall 2026 Live Cohort (Batch A)');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState('');

  // ── Step 2 State (Email Verification OTP) ────────────────────────────────────
  const [intentId, setIntentId] = useState<string>('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [devOtpCode, setDevOtpCode] = useState<string>('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // ── Step 3 State (Payment) ───────────────────────────────────────────────────
  const [orderData, setOrderData] = useState<{
    orderId?: string;
    amount?: number;
    basePrice?: number;
    discountAmount?: number;
    finalAmount?: number;
    currency?: string;
    keyId?: string;
    courseTitle?: string;
    batchName?: string;
    studentName?: string;
    studentEmail?: string;
    studentPhone?: string;
    appliedCoupon?: string;
  } | null>(null);

  // ── Step 4 State (Access / Success) ──────────────────────────────────────────
  const [enrollmentResult, setEnrollmentResult] = useState<{
    enrollmentCode?: string;
    enrollmentId?: number;
    courseTitle?: string;
    studentName?: string;
    studentEmail?: string;
    batchName?: string;
  } | null>(null);

  // ── 1. Check Authenticated Session & Auto-fill Profile ──────────────────────
  useEffect(() => {
    async function checkAuthSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // Only auto-prefill for genuine student sessions (not admin)
          if (data.success && data.user && data.user.role === 'student') {
            setFullName(data.user.name || '');
            setEmail(data.user.email || '');
            if (data.user.phone) setPhone(data.user.phone);
            if (Array.isArray(data.user.enrolledCourseIds)) {
              setEnrolledCourseIds(data.user.enrolledCourseIds);
            }
            setVerifiedStudentEmail(data.user.email.toLowerCase());
            setEmailAccountStatus('VERIFIED_SESSION');
          }
        }
      } catch (err) {
        // Guest user
      }
    }
    checkAuthSession();
  }, []);

  // ── 1b. Real-time Dynamic Email Verification Lookup ─────────────────────────
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setEmailAccountStatus('NEW_STUDENT');
      return;
    }

    if (verifiedStudentEmail && trimmed === verifiedStudentEmail.toLowerCase()) {
      setEmailAccountStatus('VERIFIED_SESSION');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/enrollment/check-email?email=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.success && data.status) {
          setEmailAccountStatus(data.status);
          if (Array.isArray(data.enrolledCourseIds)) {
            setEnrolledCourseIds(data.enrolledCourseIds);
          }
          if (data.status === 'EXISTING_STUDENT' && data.studentName && !fullName) {
            setFullName(data.studentName);
          }
        } else {
          setEmailAccountStatus('NEW_STUDENT');
          setEnrolledCourseIds([]);
        }
      } catch (err) {
        setEmailAccountStatus('NEW_STUDENT');
        setEnrolledCourseIds([]);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [email, verifiedStudentEmail, fullName]);

  // ── 2. Load Razorpay SDK ─────────────────────────────────────────────────────
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // ── 3. Load Published Courses from MySQL ─────────────────────────────────────
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch('/api/courses');
        const data = await res.json();
        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          const published = data.courses.map((c: any) => ({
            id: Number(c.id),
            title: c.title,
            price: Number(c.price || 18000),
            duration: c.duration || '16 Weeks Live',
            level: c.level || 'Intermediate to Advanced',
            description: c.description || 'Production software engineering cohort with 1-on-1 code reviews and Docker sandbox.',
            highlights: [
              '1-on-1 Senior SDE Mentorship',
              'Docker Container Code Sandbox',
              '24/7 Gemini AI Assistant',
              'Verified Enterprise Certificate',
            ],
          }));
          setCourses(published);

          if (courseParam) {
            const matched = published.find(
              (p: CourseOption) =>
                String(p.id) === String(courseParam) ||
                p.title.toLowerCase().includes(String(courseParam).toLowerCase())
            );
            if (matched) setSelectedCourseId(matched.id);
            else setSelectedCourseId(published[0].id);
          } else {
            setSelectedCourseId(published[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load courses:', err);
      }
    }
    loadCourses();
  }, [courseParam]);

  // ── 4. Intent Recovery with Course Isolation ─────────────────────────────────
  useEffect(() => {
    const savedIntent = urlIntentId || (typeof window !== 'undefined' ? localStorage.getItem('ea_intent_id') : null);
    if (!savedIntent) return;

    async function recoverIntent(id: string) {
      try {
        const res = await fetch(`/api/enrollment/status?intentId=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (data.success && data.intentId) {
          // If the user navigates with a specific ?course=X that does NOT match the saved intent, discard the old intent!
          if (courseParam && data.courseId && String(data.courseId) !== String(courseParam)) {
            localStorage.removeItem('ea_intent_id');
            setIntentId('');
            return;
          }

          setIntentId(data.intentId);
          setFullName(data.fullName || '');
          setEmail(data.email || '');
          setPhone(data.phone || '');
          if (data.courseId) setSelectedCourseId(Number(data.courseId));
          if (data.batchName) setSelectedBatchName(data.batchName);
          if (data.couponCode) setCouponApplied(data.couponCode);

          if (data.step === 2) {
            setCurrentStep(2);
          } else if (data.step === 3) {
            setCurrentStep(3);
            setOrderData({
              basePrice: Number(data.coursePrice),
              discountAmount: Number(data.discountAmount),
              finalAmount: Number(data.finalAmount),
              courseTitle: data.courseTitle,
              batchName: data.batchName,
              studentName: data.fullName,
              studentEmail: data.email,
              studentPhone: data.phone,
              appliedCoupon: data.couponCode,
            });
          } else if (data.step === 4) {
            setCurrentStep(4);
            setEnrollmentResult({
              enrollmentCode: data.enrollmentCode,
              enrollmentId: data.enrollmentId,
              courseTitle: data.courseTitle,
              studentName: data.fullName,
              studentEmail: data.email,
              batchName: data.batchName,
            });
          }
        }
      } catch (err) {
        console.warn('Intent recovery skipped:', err);
      }
    }

    recoverIntent(savedIntent);
  }, [urlIntentId, courseParam]);

  // ── 5. Resend Timer Countdown ────────────────────────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 2 && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendTimer]);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0] || {
    id: 1,
    title: 'Java Full Stack & Distributed Systems Accelerator',
    price: 20000,
    duration: '16 Weeks Live',
    level: 'Intermediate to Advanced',
    description: 'Master Java 21, Spring Boot 3 Microservices, Docker sandboxes, and GenAI Agentic systems.',
    highlights: ['1-on-1 SDE Reviews', 'Code Sandbox', 'Gemini AI Tutor', 'Enterprise Certificate'],
  };

  const currentFinalPrice = Math.max(0, (selectedCourse?.price || 18000) - couponDiscount);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { score: 33, label: 'Basic', color: 'bg-amber-400' };
    if (score === 2) return { score: 66, label: 'Good', color: 'bg-indigo-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passStrength = getPasswordStrength(password);

  const handleSelectCourse = (courseId: number) => {
    setSelectedCourseId(courseId);
    // Reset any old intent from a previous track
    setIntentId('');
    localStorage.removeItem('ea_intent_id');
  };

  // ── Step 1 Handler: Submit Profile & Initiate Enrollment ──────────────────────
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please enter your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setErrorMessage('Please enter a valid mobile / WhatsApp number.');
      return;
    }

    if (emailAccountStatus === 'EXISTING_STUDENT' && !password) {
      setErrorMessage('Please enter your account password to proceed.');
      return;
    }
    if (emailAccountStatus === 'NEW_STUDENT' && (!password || password.length < 6)) {
      setErrorMessage('Password must be at least 6 characters long to secure your account.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/enrollment/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password || undefined,
          courseId: selectedCourseId,
          batchName: selectedBatchName,
          couponCode: couponCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIntentId(data.intentId);
        localStorage.setItem('ea_intent_id', data.intentId);
        setOrderData({
          basePrice: data.basePrice,
          discountAmount: data.discountAmount,
          finalAmount: data.finalPrice,
          courseTitle: data.courseTitle,
          batchName: data.batchName,
          studentName: fullName.trim(),
          studentEmail: email.trim().toLowerCase(),
          studentPhone: phone.trim(),
          appliedCoupon: data.appliedCoupon,
        });

        if (data.skipOtp || data.step === 3) {
          // Account already verified! Skip Step 2 OTP entirely!
          setVerifiedStudentEmail(email.trim().toLowerCase());
          setEmailAccountStatus('VERIFIED_SESSION');
          setCurrentStep(3);
          setSuccessMessage('Student account verified. Proceeding directly to secure payment.');
        } else {
          // New user OTP verification
          if (data.devOtp) {
            setDevOtpCode(data.devOtp);
          }
          setCurrentStep(2);
          setResendTimer(60);
          setCanResend(false);
          setSuccessMessage(`Verification code sent to ${data.email}.`);
        }
      } else {
        setErrorMessage(data.error || 'Failed to initiate enrollment. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error initiating enrollment.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 Handlers: OTP Inputs & Verification ───────────────────────────────
  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      const pastedDigits = val.replace(/\D/g, '').slice(0, 6).split('');
      const nextOtp = [...otp];
      pastedDigits.forEach((d, i) => {
        if (index + i < 6) nextOtp[index + i] = d;
      });
      setOtp(nextOtp);
      const nextFocus = Math.min(index + pastedDigits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = val.replace(/\D/g, '');
    setOtp(nextOtp);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/enrollment/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId,
          otp: fullOtp,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setVerifiedStudentEmail(email.trim().toLowerCase());
        setEmailAccountStatus('VERIFIED_SESSION');
        setSuccessMessage('Email verified successfully! Preparing your admission order...');
        setTimeout(() => {
          setCurrentStep(3);
          setSuccessMessage('');
        }, 800);
      } else {
        setErrorMessage(data.error || 'Invalid or expired verification code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error verifying code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await fetch('/api/enrollment/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.devOtp) {
          setDevOtpCode(data.devOtp);
        }
        setResendTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setSuccessMessage('A fresh verification code has been dispatched.');
      } else {
        setErrorMessage(data.error || 'Unable to resend code.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error resending code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 Handlers: Razorpay Payment & Server Verification ──────────────────
  const handleProceedToPayment = async () => {
    setErrorMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/enrollment/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || 'Failed to create payment order.');
        setLoading(false);
        return;
      }

      // Handle 100% Free / Waived
      if (data.zeroAmount) {
        setEnrollmentResult({
          enrollmentCode: data.enrollmentCode,
          enrollmentId: data.enrollmentId,
          courseTitle: data.courseTitle,
          studentName: fullName,
          studentEmail: email,
          batchName: selectedBatchName,
        });
        setCurrentStep(4);
        setLoading(false);
        return;
      }

      // Initialize Razorpay Popup Modal
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'Education Algorithm',
        description: `Enrollment: ${data.courseTitle}`,
        image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80',
        order_id: data.orderId,
        prefill: {
          name: data.studentName || fullName,
          email: data.studentEmail || email,
          contact: data.studentPhone || phone,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        handler: async (response: any) => {
          setLoading(true);
          try {
            const verifyRes = await fetch('/api/enrollment/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                intentId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setEnrollmentResult({
                enrollmentCode: verifyData.enrollmentCode,
                enrollmentId: verifyData.enrollmentId,
                courseTitle: verifyData.courseTitle,
                studentName: verifyData.studentName || fullName,
                studentEmail: email,
                batchName: selectedBatchName,
              });
              localStorage.removeItem('ea_intent_id');
              setCurrentStep(4);
            } else {
              setErrorMessage(verifyData.error || 'Payment verification failed. Please contact support.');
            }
          } catch (verifyErr: any) {
            setErrorMessage('Network error during verification. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
      };

      if (!window.Razorpay) {
        setErrorMessage('Payment gateway is loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp: any) => {
        setErrorMessage(resp && typeof resp === 'object' && 'error' in resp ? (resp as any).error?.description || 'Payment was unsuccessful.' : 'Payment was unsuccessful.');
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment initiation error.');
      setLoading(false);
    }
  };

  // Values for display in Stage 3:
  const displayCourseTitle = orderData?.courseTitle || selectedCourse.title;
  const displayBatchName = orderData?.batchName || selectedBatchName;
  const displayFinalAmount = orderData?.finalAmount !== undefined ? orderData.finalAmount : currentFinalPrice;
  const displayBasePrice = orderData?.basePrice !== undefined ? orderData.basePrice : selectedCourse.price;
  const displayStudentName = orderData?.studentName || fullName;
  const displayStudentEmail = orderData?.studentEmail || email;
  const isVerifiedStudent = emailAccountStatus === 'VERIFIED_SESSION';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* ── 4-STAGE PROGRESS HEADER ────────────────────────────────────────── */}
      <div className="mb-8 sm:mb-12">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>

          {[
            { num: 1, label: 'Profile & Track', icon: 'fa-user-graduate' },
            { num: 2, label: isVerifiedStudent ? 'Verified Account' : 'Email Verification', icon: 'fa-envelope-circle-check' },
            { num: 3, label: 'Payment', icon: 'fa-credit-card' },
            { num: 4, label: 'Access', icon: 'fa-circle-check' },
          ].map((s) => {
            const isCompleted = currentStep > s.num || (s.num === 2 && isVerifiedStudent);
            const isCurrent = currentStep === s.num;

            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xs sm:text-sm font-black transition-all ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-50'
                      : isCurrent
                      ? 'bg-indigo-600 text-white shadow-xl ring-4 ring-indigo-100 scale-110'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {isCompleted ? <i className="fa-solid fa-check"></i> : <i className={`fa-solid ${s.icon}`}></i>}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-black mt-2 tracking-wide uppercase ${
                    isCurrent ? 'text-indigo-600 font-extrabold' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NOTIFICATIONS / ALERTS ──────────────────────────────────────────── */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm font-bold flex items-start space-x-3 animate-fade-in shadow-xs">
          <i className="fa-solid fa-triangle-exclamation text-lg text-red-500 mt-0.5"></i>
          <div className="flex-1">{errorMessage}</div>
          <button onClick={() => setErrorMessage('')} className="text-red-400 hover:text-red-600 p-1">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs sm:text-sm font-bold flex items-start space-x-3 animate-fade-in shadow-xs">
          <i className="fa-solid fa-circle-check text-lg text-emerald-600 mt-0.5"></i>
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {/* ── STAGE 1: PROFILE & TRACK ────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-fade-in">
          {/* Left Column: Form Details */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                Stage 1 &bull; Profile &amp; Cohort Track
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                Personal &amp; Admission Credentials
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                {isVerifiedStudent
                  ? 'Your verified student profile is active. Select your cohort track and proceed directly to payment.'
                  : 'Enter your details to create your secure student account and reserve your cohort seat.'}
              </p>
            </div>

            {/* If Student has an Active Verified Session */}
            {isVerifiedStudent && (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-black text-slate-900">{fullName}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black flex items-center space-x-1">
                        <i className="fa-solid fa-check text-[8px]"></i>
                        <span>Verified Account</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerifiedStudentEmail('');
                      setEmailAccountStatus('NEW_STUDENT');
                      setFullName('');
                      setEmail('');
                      setPhone('');
                      setPassword('');
                      setEnrolledCourseIds([]);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs transition cursor-pointer"
                  >
                    <i className="fa-solid fa-user-pen mr-1"></i> Switch Account
                  </button>
                </div>
              </div>
            )}

            {/* If Email is an existing registered student (needs password login) */}
            {emailAccountStatus === 'EXISTING_STUDENT' && (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs">
                <i className="fa-solid fa-circle-info text-base text-amber-600 mt-0.5"></i>
                <div className="flex-1 font-medium leading-relaxed">
                  <strong className="font-extrabold text-amber-950 block mb-0.5">Registered Student Account Detected</strong>
                  This email is already registered. Enter your account password below to skip OTP and proceed directly to payment.
                </div>
              </div>
            )}

            {/* Check if user is already enrolled in this specific course */}
            {enrolledCourseIds.includes(selectedCourseId) && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-base">
                    <i className="fa-solid fa-graduation-cap"></i>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950">Active Enrollment Found</h4>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      You already have an active enrollment in this track. Duplicate payment is blocked.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/learn/${selectedCourseId}`}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition text-center shadow-xs"
                >
                  Open Classroom &rarr;
                </Link>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address (Login ID) <span className="text-indigo-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    WhatsApp / Mobile Number <span className="text-indigo-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium"
                  />
                </div>
              </div>

              {/* Password input: shown for new students OR existing students needing password */}
              {!isVerifiedStudent && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      {emailAccountStatus === 'EXISTING_STUDENT' ? 'Account Password' : 'Create LMS Password'}{' '}
                      <span className="text-indigo-600">*</span>
                    </label>
                    {emailAccountStatus === 'NEW_STUDENT' && password && (
                      <span className="text-[10px] font-extrabold text-slate-500">
                        Strength: <strong className="text-slate-900">{passStrength.label}</strong>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={emailAccountStatus === 'NEW_STUDENT' ? 6 : 1}
                      placeholder={emailAccountStatus === 'EXISTING_STUDENT' ? 'Enter your existing account password' : 'Min 6 characters (e.g. Student@2026)'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                  {/* Strength Meter Bar (only for new passwords) */}
                  {emailAccountStatus === 'NEW_STUDENT' && password && (
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full ${passStrength.color} transition-all duration-300`}
                        style={{ width: `${passStrength.score}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selected Cohort Batch &amp; Live Schedule
                </label>
                <select
                  value={selectedBatchName}
                  onChange={(e) => setSelectedBatchName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none font-medium bg-white"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name} ({b.schedule})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Referral / Scholarship Coupon Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME50, CAREER2026"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                {/* Quick Coupon Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold self-center">Available:</span>
                  {['CAREER2026', 'WELCOME50', 'EARLYBIRD'].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCouponCode(code)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-600 transition"
                    >
                      +{code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3">
                {enrolledCourseIds.includes(selectedCourseId) ? (
                  <Link
                    href={`/dashboard/learn/${selectedCourseId}`}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 text-center"
                  >
                    <i className="fa-solid fa-graduation-cap mr-1"></i>
                    <span>Already Enrolled &bull; Go to Classroom</span>
                    <i className="fa-solid fa-arrow-right text-xs"></i>
                  </Link>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>{isVerifiedStudent ? 'Preparing Checkout...' : 'Processing Admission...'}</span>
                      </>
                    ) : isVerifiedStudent ? (
                      <>
                        <span>Proceed to Secure Payment</span>
                        <i className="fa-solid fa-arrow-right text-xs"></i>
                      </>
                    ) : emailAccountStatus === 'EXISTING_STUDENT' ? (
                      <>
                        <span>Verify &amp; Proceed to Payment</span>
                        <i className="fa-solid fa-arrow-right text-xs"></i>
                      </>
                    ) : (
                      <>
                        <span>Continue to Email Verification</span>
                        <i className="fa-solid fa-arrow-right text-xs"></i>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Track Selector & Live Pricing Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl space-y-5 shadow-xl sticky top-24 border border-slate-800">
              <div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full uppercase tracking-wider">
                  Target Program Track
                </span>
                <h3 className="text-xl font-black mt-2">{selectedCourse.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedCourse.duration} &bull; {selectedCourse.level}
                </p>
              </div>

              {/* Course Selector Pills */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Program:</label>
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelectCourse(c.id)}
                    className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between text-xs ${
                      selectedCourseId === c.id
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-extrabold shadow-sm'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:border-slate-600 font-medium'
                    }`}
                  >
                    <span className="truncate max-w-[190px]">{c.title}</span>
                    <span className="font-bold text-indigo-300">₹{c.price.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              {/* Course Highlights */}
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1.5 text-xs text-slate-300">
                <div className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">Included in Tuition:</div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div>✓ 1-on-1 SDE Reviews</div>
                  <div>✓ Docker Sandbox</div>
                  <div>✓ 24/7 Gemini AI Tutor</div>
                  <div>✓ Verified Certificate</div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Base Tuition Fee:</span>
                  <span className="font-bold text-white">₹{selectedCourse.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Batch Schedule:</span>
                  <span className="font-bold text-emerald-400">{selectedBatchName.split('(')[0]}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-base sm:text-lg font-black text-white">
                  <span>Payable Amount:</span>
                  <span className="text-indigo-400">₹{selectedCourse.price.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 2: EMAIL VERIFICATION ─────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center animate-fade-in">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 text-2xl mx-auto shadow-sm">
            <i className="fa-solid fa-envelope-open-text"></i>
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
              Stage 2 of 4 &bull; Security Verification
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Verify Your Email Address
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Enter the 6-digit verification code sent to <strong className="text-slate-900">{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* Dev Mode OTP Auto-fill Helper */}
            {devOtpCode && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900 shadow-sm text-left">
                <div className="flex items-center space-x-2">
                  <i className="fa-solid fa-bolt text-amber-600"></i>
                  <span>
                    <strong>Local Test OTP:</strong>{' '}
                    <code className="bg-amber-100 px-2 py-0.5 rounded font-mono font-black text-amber-900 text-sm tracking-widest">
                      {devOtpCode}
                    </code>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const digits = devOtpCode.split('').slice(0, 6);
                    setOtp(digits);
                    otpInputRefs.current[5]?.focus();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition shadow-sm cursor-pointer"
                >
                  ⚡ Auto-Fill
                </button>
              </div>
            )}

            {/* 6 OTP Boxes */}
            <div className="flex justify-center items-center gap-2 sm:gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpInputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-10 h-12 sm:w-13 sm:h-16 text-center font-black text-xl sm:text-2xl rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none transition bg-slate-50 focus:bg-white"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Verify Email &amp; Proceed to Payment</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Code & Edit Email Links */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
            <div>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-800 underline flex items-center space-x-1"
                >
                  <i className="fa-solid fa-arrow-rotate-right"></i>
                  <span>Resend Verification Code</span>
                </button>
              ) : (
                <span className="text-slate-400 flex items-center space-x-1">
                  <i className="fa-regular fa-clock"></i>
                  <span>Resend code in {resendTimer}s</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-slate-500 hover:text-slate-800 transition underline"
            >
              Change Email Address
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: PAYMENT ────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="max-w-2xl mx-auto bg-slate-900 text-white p-6 sm:p-10 rounded-3xl shadow-2xl space-y-6 animate-fade-in border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                Stage 3 of 4 &bull; Verified Student
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">
                Order Summary &amp; Tuition Payment
              </h2>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 text-xl">
              <i className="fa-solid fa-credit-card"></i>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Student Name:</span>
              <strong className="text-white">{displayStudentName}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Verified Email ID:</span>
              <strong className="text-emerald-400 flex items-center space-x-1">
                <i className="fa-solid fa-circle-check text-xs"></i>
                <span>{displayStudentEmail}</span>
              </strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Selected Course Track:</span>
              <strong className="text-white text-right max-w-[240px] truncate">{displayCourseTitle}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Cohort Batch:</span>
              <strong className="text-indigo-300">{displayBatchName}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Base Tuition Fee:</span>
              <span className="text-slate-300">₹{displayBasePrice.toLocaleString()}</span>
            </div>
            {orderData?.appliedCoupon && (
              <div className="flex justify-between py-2 border-b border-slate-800 text-emerald-400">
                <span>Applied Coupon ({orderData.appliedCoupon}):</span>
                <span>-₹{(orderData.discountAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 text-lg sm:text-2xl font-black text-white">
              <span>Total Payable Amount:</span>
              <span className="text-indigo-400">₹{displayFinalAmount.toLocaleString()} INR</span>
            </div>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs text-slate-300">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <i className="fa-solid fa-lock"></i>
              <span>256-Bit SSL Encrypted &bull; Razorpay Secure Gateway</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Upon successful payment, our backend verifies the Razorpay cryptographic signature and instantly provisions your student LMS account.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm sm:text-base rounded-2xl transition shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Connecting to Razorpay Secure Gateway...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-bolt text-amber-300"></i>
                  <span>Pay Now &bull; ₹{displayFinalAmount.toLocaleString()} INR</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 4: ACCESS (CELEBRATION / LMS CREDENTIALS) ────────────────── */}
      {currentStep === 4 && (
        <div className="max-w-2xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-2xl space-y-6 text-center animate-fade-in">
          <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-200 rounded-3xl flex items-center justify-center text-emerald-600 text-4xl mx-auto shadow-md animate-bounce">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>

          <div className="space-y-2">
            <span className="px-4 py-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-xs font-black uppercase tracking-wider">
              Stage 4 of 4 &bull; Admission Complete
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Welcome to Education Algorithm!
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium">
              You are officially enrolled in{' '}
              <strong className="text-indigo-600">{enrollmentResult?.courseTitle || displayCourseTitle}</strong>
            </p>
          </div>

          {/* Admission Credentials Box */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Enrollment ID:</span>
              <span className="font-mono font-black text-indigo-600 text-sm sm:text-base bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
                {enrollmentResult?.enrollmentCode || 'EA-2026-ACTIVE'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">Registered Student:</span>
              <strong className="text-slate-900">{enrollmentResult?.studentName || displayStudentName}</strong>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-bold">LMS Login ID:</span>
              <strong className="text-slate-900">{enrollmentResult?.studentEmail || displayStudentEmail}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold">Cohort Batch:</span>
              <strong className="text-emerald-700">{enrollmentResult?.batchName || displayBatchName}</strong>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900 font-medium text-left flex items-start space-x-3">
            <i className="fa-solid fa-circle-info text-indigo-600 text-base mt-0.5"></i>
            <div>
              An official admission confirmation receipt has been sent to your email. You have immediate access to 1-on-1 SDE Mentorship, Code Arena Docker Sandboxes, and Gemini AI Tutor tools.
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:flex-1 py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-graduation-cap"></i>
              <span>Launch Student LMS Dashboard</span>
            </Link>

            <Link
              href="/courses"
              className="w-full sm:w-auto py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition border border-slate-200 flex items-center justify-center space-x-1"
            >
              <span>View Curriculum</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
