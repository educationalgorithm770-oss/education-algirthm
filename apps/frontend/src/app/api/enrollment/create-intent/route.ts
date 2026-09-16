import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { execute, query } from '@/lib/db';
import {
  generateSecureOtp,
  hashOtp,
  calculateCoursePrice,
  EnrollmentIntentRow,
} from '@/lib/enrollment';
import { sendOtpEmail } from '@/lib/email';
import { getSessionFromRequest, signToken, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const CreateIntentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(7, 'Valid mobile number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  courseId: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]),
  batchId: z.union([z.number(), z.string().transform((v) => parseInt(v, 10))]).optional(),
  batchName: z.string().optional(),
  couponCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateIntentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, phone, password, courseId, batchId, batchName, couponCode } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Calculate price and validate course server-side
    const priceCalculation = await calculateCoursePrice(Number(courseId), couponCode);
    if (!priceCalculation.course) {
      return NextResponse.json(
        { success: false, error: 'Selected course track not found or inactive.' },
        { status: 404 }
      );
    }

    const { course, basePrice, discountAmount, finalPrice, appliedCoupon } = priceCalculation;

    // 1b. Check if already actively enrolled in this course to prevent duplicate payment
    const existingEnrollments = await query<any[]>(
      `SELECT id, enrollment_code, payment_status 
       FROM enrollments 
       WHERE LOWER(email) = ? 
         AND course_id = ? 
         AND payment_status IN ('paid', 'completed', 'active', 'waived', 'partial') 
         AND (status = 'active' OR status = 'approved' OR status IS NULL) 
       LIMIT 1`,
      [normalizedEmail, course.id]
    );

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          alreadyEnrolled: true,
          enrollmentCode: existingEnrollments[0].enrollment_code,
          error: `You already have an active enrollment in "${course.title}". Double payment is blocked. Please access your learning classroom directly.`,
        },
        { status: 400 }
      );
    }

    // 2. Resolve Batch Info
    let resolvedBatchName = batchName || 'Fall 2026 Live Cohort (Batch A)';
    if (batchId) {
      const batches = await query<any[]>(
        'SELECT name FROM batches WHERE id = ? LIMIT 1',
        [batchId]
      );
      if (batches.length > 0) {
        resolvedBatchName = batches[0].name;
      }
    }

    // 3. Check if User is Already Authenticated or Verified
    const session = await getSessionFromRequest(request);
    let isAlreadyVerified = false;
    let studentId: number | null = null;
    let newAuthToken: string | null = null;
    let effectivePasswordHash = '';

    // Check 3a: Valid active student session matching this exact email
    const isMatchingStudentSession = Boolean(
      session &&
      session.role === 'student' &&
      session.email &&
      session.email.toLowerCase() === normalizedEmail
    );

    // Check 3b: Existing active student record in database
    const existingStudents = await query<any[]>(
      'SELECT id, name, email, password, password_hash, status FROM students WHERE LOWER(email) = ? AND status = "active" LIMIT 1',
      [normalizedEmail]
    );

    if (isMatchingStudentSession) {
      isAlreadyVerified = true;
      studentId = (session?.sub ? Number(session.sub) : null) || (existingStudents.length > 0 ? existingStudents[0].id : null);
      if (existingStudents.length > 0) {
        effectivePasswordHash = existingStudents[0].password_hash || existingStudents[0].password || '';
      }
    } else if (existingStudents.length > 0) {
      // Existing student but not in active matching session — requires their password
      const existingStudent = existingStudents[0];
      effectivePasswordHash = existingStudent.password_hash || existingStudent.password || '';

      if (!password) {
        return NextResponse.json(
          {
            success: false,
            isExistingAccount: true,
            error: 'An account with this email already exists. Please enter your password to continue.',
          },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(password, effectivePasswordHash);
      if (!isMatch) {
        return NextResponse.json(
          {
            success: false,
            isExistingAccount: true,
            error: 'Incorrect password for this registered email address. Please try again.',
          },
          { status: 401 }
        );
      }

      isAlreadyVerified = true;
      studentId = existingStudent.id;
      newAuthToken = await signToken({
        sub: String(existingStudent.id),
        name: existingStudent.name || fullName.trim(),
        email: normalizedEmail,
        role: 'student',
      });
    }

    const intentId = `ei_${crypto.randomBytes(16).toString('hex')}`;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // 4. Case A: ALREADY VERIFIED (Skip OTP & password creation, go straight to Step 3 Payment)
    if (isAlreadyVerified) {
      await execute(
        `INSERT INTO enrollment_intents 
         (intent_id, student_id, course_id, batch_id, batch_name, full_name, email, phone, password_hash, 
          status, course_price, discount_amount, final_amount, coupon_code, otp_hash, 
          otp_expires_at, otp_attempts, otp_resend_count, last_otp_sent_at, email_verified_at, ip_address, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'EMAIL_VERIFIED', ?, ?, ?, ?, NULL, NULL, 0, 0, NOW(), NOW(), ?, NOW())`,
        [
          intentId,
          studentId,
          course.id,
          batchId || null,
          resolvedBatchName,
          fullName.trim(),
          normalizedEmail,
          phone.trim(),
          effectivePasswordHash || null,
          basePrice,
          discountAmount,
          finalPrice,
          appliedCoupon,
          ipAddress,
        ]
      );

      const response = NextResponse.json({
        success: true,
        message: 'Student account verified. Proceeding directly to payment.',
        intentId,
        email: normalizedEmail,
        courseId: course.id,
        courseTitle: course.title,
        batchName: resolvedBatchName,
        basePrice,
        discountAmount,
        finalPrice,
        appliedCoupon,
        skipOtp: true,
        step: 3,
      });

      if (newAuthToken) {
        setAuthCookie(response, newAuthToken);
      }

      return response;
    }

    // 4. Case B: NEW / UNVERIFIED USER (Generate Cryptographic OTP and Hash Password)
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long to secure your account.' },
        { status: 400 }
      );
    }

    const otp = generateSecureOtp();
    const otpHashValue = hashOtp(otp);
    const passwordHash = await bcrypt.hash(password, 12);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await execute(
      `INSERT INTO enrollment_intents 
       (intent_id, student_id, course_id, batch_id, batch_name, full_name, email, phone, password_hash, 
        status, course_price, discount_amount, final_amount, coupon_code, otp_hash, 
        otp_expires_at, otp_attempts, otp_resend_count, last_otp_sent_at, ip_address, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'PENDING_EMAIL_VERIFICATION', ?, ?, ?, ?, ?, ?, 0, 0, NOW(), ?, NOW())`,
      [
        intentId,
        course.id,
        batchId || null,
        resolvedBatchName,
        fullName.trim(),
        normalizedEmail,
        phone.trim(),
        passwordHash,
        basePrice,
        discountAmount,
        finalPrice,
        appliedCoupon,
        otpHashValue,
        otpExpiresAt,
        ipAddress,
      ]
    );

    // Dispatch Verification Email with 6-digit OTP
    await sendOtpEmail(normalizedEmail, fullName.trim(), otp);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email.',
      intentId,
      email: normalizedEmail,
      courseId: course.id,
      courseTitle: course.title,
      batchName: resolvedBatchName,
      basePrice,
      discountAmount,
      finalPrice,
      appliedCoupon,
      skipOtp: false,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      step: 2,
    });
  } catch (err: any) {
    console.error('[/api/enrollment/create-intent] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Unable to initiate enrollment. Please try again.' },
      { status: 500 }
    );
  }
}
