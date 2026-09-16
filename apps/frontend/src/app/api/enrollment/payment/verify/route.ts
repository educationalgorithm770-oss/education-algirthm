import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '@/lib/db';
import { activateEnrollmentTransaction, EnrollmentIntentRow } from '@/lib/enrollment';
import { setAuthCookie, signToken } from '@/lib/auth';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const VerifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  intentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VerifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, intentId } = parsed.data;

    // 1. HMAC Signature Verification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[/api/enrollment/payment/verify] RAZORPAY_KEY_SECRET missing');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration error.' },
        { status: 500 }
      );
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isMatch =
      typeof razorpay_signature === 'string' &&
      razorpay_signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf-8'),
        Buffer.from(razorpay_signature, 'utf-8')
      );

    if (!isMatch) {
      console.warn('[/api/enrollment/payment/verify] Signature mismatch for order:', razorpay_order_id);
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Possible data tampering.' },
        { status: 400 }
      );
    }

    // 2. Locate Enrollment Intent
    let intents: EnrollmentIntentRow[] = [];

    if (intentId) {
      intents = await query<EnrollmentIntentRow[]>(
        'SELECT * FROM enrollment_intents WHERE intent_id = ? LIMIT 1',
        [intentId]
      );
    }

    if (!intents.length) {
      intents = await query<EnrollmentIntentRow[]>(
        'SELECT * FROM enrollment_intents WHERE razorpay_order_id = ? LIMIT 1',
        [razorpay_order_id]
      );
    }

    if (!intents.length) {
      return NextResponse.json(
        { success: false, error: 'Enrollment session matching this payment order was not found.' },
        { status: 404 }
      );
    }

    const intent = intents[0];

    // 3. Idempotency check: Already activated
    if (intent.status === 'ENROLLMENT_ACTIVE' && intent.student_id) {
      const authToken = await signToken({
        sub: String(intent.student_id),
        name: intent.full_name,
        email: intent.email,
        role: 'student',
      });

      const res = NextResponse.json({
        success: true,
        alreadyActive: true,
        message: 'Enrollment is active.',
        enrollmentCode: intent.enrollment_code,
        enrollmentId: intent.enrollment_id,
        redirectUrl: '/dashboard',
        step: 4,
      });

      return setAuthCookie(res, authToken);
    }

    // 4. Execute Transactional Activation
    const activation = await activateEnrollmentTransaction(intent, {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!activation.success) {
      return NextResponse.json(
        { success: false, error: activation.error || 'Failed to activate enrollment records.' },
        { status: 500 }
      );
    }

    // 5. Send Official Confirmation Email in background
    const courseRows = await query<any[]>('SELECT title FROM courses WHERE id = ? LIMIT 1', [intent.course_id]);
    const courseTitle = courseRows.length > 0 ? courseRows[0].title : 'Full Stack Engineering & Systems Track';

    sendEnrollmentConfirmationEmail(
      intent.email,
      intent.full_name,
      courseTitle,
      activation.enrollmentCode,
      intent.final_amount,
      intent.batch_name
    ).catch((e) => console.error('Confirmation email error:', e));

    // 6. Return Success with Auth Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment activated successfully!',
      enrollmentCode: activation.enrollmentCode,
      enrollmentId: activation.enrollmentId,
      courseTitle,
      studentId: activation.studentId,
      studentName: intent.full_name,
      studentEmail: intent.email,
      batchName: intent.batch_name,
      redirectUrl: '/dashboard',
      step: 4,
    });

    return setAuthCookie(response, activation.authToken);
  } catch (err: any) {
    console.error('[/api/enrollment/payment/verify] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed. Please contact admissions desk.' },
      { status: 500 }
    );
  }
}
