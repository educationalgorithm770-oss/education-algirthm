import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { generateSecureOtp, hashOtp, EnrollmentIntentRow } from '@/lib/enrollment';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const ResendOtpSchema = z.object({
  intentId: z.string().min(5, 'Invalid intent ID'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ResendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { intentId } = parsed.data;

    // 1. Fetch Intent
    const intents = await query<EnrollmentIntentRow[]>(
      'SELECT * FROM enrollment_intents WHERE intent_id = ? LIMIT 1',
      [intentId]
    );

    if (intents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Enrollment session not found.' },
        { status: 404 }
      );
    }

    const intent = intents[0];

    // 2. Check if already verified
    if (intent.status === 'EMAIL_VERIFIED' || intent.status === 'ENROLLMENT_ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Email has already been verified.' },
        { status: 400 }
      );
    }

    // 3. Cooldown check (60 seconds)
    if (intent.last_otp_sent_at) {
      const elapsedSeconds = (Date.now() - new Date(intent.last_otp_sent_at).getTime()) / 1000;
      if (elapsedSeconds < 60) {
        const wait = Math.ceil(60 - elapsedSeconds);
        return NextResponse.json(
          { success: false, error: `Please wait ${wait} seconds before requesting a new code.` },
          { status: 429 }
        );
      }
    }

    // 4. Max resends limit (5)
    if (intent.otp_resend_count >= 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum resend limit reached. Please start a new registration.' },
        { status: 429 }
      );
    }

    // 5. Generate fresh OTP
    const newOtp = generateSecureOtp();
    const newOtpHash = hashOtp(newOtp);
    const newExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await execute(
      `UPDATE enrollment_intents 
       SET otp_hash = ?, 
           otp_expires_at = ?, 
           otp_attempts = 0, 
           otp_resend_count = otp_resend_count + 1, 
           last_otp_sent_at = NOW(), 
           status = 'PENDING_EMAIL_VERIFICATION' 
       WHERE id = ?`,
      [newOtpHash, newExpiresAt, intent.id]
    );

    // 6. Dispatch Email
    await sendOtpEmail(intent.email, intent.full_name, newOtp);

    return NextResponse.json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email.',
      devOtp: process.env.NODE_ENV !== 'production' ? newOtp : undefined,
    });
  } catch (err: any) {
    console.error('[/api/enrollment/resend-otp] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to resend code. Please try again.' },
      { status: 500 }
    );
  }
}
