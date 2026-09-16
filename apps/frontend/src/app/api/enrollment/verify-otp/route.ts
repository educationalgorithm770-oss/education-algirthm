import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { verifyOtpHash, EnrollmentIntentRow } from '@/lib/enrollment';
import { signToken, setAuthCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const VerifyOtpSchema = z.object({
  intentId: z.string().min(5, 'Invalid intent ID'),
  otp: z.string().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { intentId, otp } = parsed.data;

    // 1. Fetch Enrollment Intent
    const intents = await query<EnrollmentIntentRow[]>(
      'SELECT * FROM enrollment_intents WHERE intent_id = ? LIMIT 1',
      [intentId]
    );

    if (intents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollment session not found or expired.' },
        { status: 404 }
      );
    }

    const intent = intents[0];
    const normalizedEmail = intent.email.toLowerCase().trim();

    // 2. Check if already verified
    if (intent.status === 'EMAIL_VERIFIED' || intent.status === 'PAYMENT_PENDING' || intent.status === 'ENROLLMENT_ACTIVE') {
      return NextResponse.json({
        success: true,
        message: 'Email already verified.',
        intentId: intent.intent_id,
        status: intent.status,
        step: intent.status === 'ENROLLMENT_ACTIVE' ? 4 : 3,
      });
    }

    // 3. Check Attempt Rate Limit (max 5)
    if (intent.otp_attempts >= 5) {
      await execute(
        'UPDATE enrollment_intents SET status = "EMAIL_VERIFICATION_FAILED" WHERE id = ?',
        [intent.id]
      );
      return NextResponse.json(
        { success: false, error: 'Maximum verification attempts exceeded. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // 4. Check OTP Expiry
    if (intent.otp_expires_at && new Date(intent.otp_expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // 5. Verify OTP Hash
    if (!intent.otp_hash || !verifyOtpHash(otp, intent.otp_hash)) {
      // Increment attempt counter
      await execute(
        'UPDATE enrollment_intents SET otp_attempts = otp_attempts + 1 WHERE id = ?',
        [intent.id]
      );
      const remaining = 4 - intent.otp_attempts;
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Please request a new code.'}`,
        },
        { status: 400 }
      );
    }

    // 6. Provision or Resolve Student Record in Database
    const existingStudents = await query<any[]>(
      'SELECT id, name, email FROM students WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );

    let studentId: number;
    if (existingStudents.length > 0) {
      studentId = existingStudents[0].id;
      await execute(
        'UPDATE students SET phone = COALESCE(?, phone), status = "active" WHERE id = ?',
        [intent.phone, studentId]
      );
    } else {
      const generatedPass = intent.password_hash 
        ? intent.password_hash 
        : await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 12);
      const insertResult = await execute(
        'INSERT INTO students (name, email, phone, password, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, "active", NOW())',
        [intent.full_name, normalizedEmail, intent.phone, generatedPass, generatedPass]
      );
      studentId = (insertResult as any).insertId;
    }

    // 7. OTP Validated — Single-use invalidate hash and mark verified
    await execute(
      `UPDATE enrollment_intents 
       SET status = 'EMAIL_VERIFIED', 
           student_id = ?,
           otp_hash = NULL, 
           email_verified_at = NOW() 
       WHERE id = ?`,
      [studentId, intent.id]
    );

    // 8. Sign JWT auth token so student stays logged in permanently
    const token = await signToken({
      sub: String(studentId),
      name: intent.full_name,
      email: normalizedEmail,
      role: 'student',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
      intentId: intent.intent_id,
      status: 'EMAIL_VERIFIED',
      step: 3,
    });

    return setAuthCookie(response, token);
  } catch (err: any) {
    console.error('[/api/enrollment/verify-otp] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
