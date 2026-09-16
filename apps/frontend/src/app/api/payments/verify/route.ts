import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { query, execute, pool } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

const VerifyPaymentSchema = z.object({
  razorpay_order_id:   z.string().regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid order ID format'),
  razorpay_payment_id: z.string().regex(/^[a-zA-Z0-9_\-]+$/, 'Invalid payment ID format'),
  razorpay_signature:  z.string().min(1, 'Signature is required'),
});

interface EnrollmentRow extends RowDataPacket {
  id: number;
  student_id: number | null;
  course_id: number;
  email: string;
  name: string;
  phone: string;
  amount: number;
  payment_status: string;
  razorpay_order_id: string;
}

interface PaymentIntentRow extends RowDataPacket {
  id: number;
  student_id: number;
  course_id: number;
  amount: number;
  razorpay_order_id: string;
  status: string;
}

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

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // ── 1. HMAC Signature Verification (no bypasses) ─────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[/api/payments/verify] RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway not configured.' },
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
      console.warn('[/api/payments/verify] Signature mismatch for order:', razorpay_order_id);
      return NextResponse.json(
        { success: false, error: 'Payment signature verification failed. Possible tampering detected.' },
        { status: 400 }
      );
    }

    // ── 2. Fetch payment intent ───────────────────────────────────────────────
    const intents = await query<PaymentIntentRow[]>(
      'SELECT * FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1',
      [razorpay_order_id]
    );

    if (!intents.length) {
      return NextResponse.json(
        { success: false, error: 'Payment order record not found.' },
        { status: 404 }
      );
    }

    const intent = intents[0];

    // ── 3. Idempotency: already verified → return success safely ─────────────
    if (intent.status === 'paid') {
      return NextResponse.json({
        success:          true,
        already_verified: true,
        courseId:         intent.course_id,
      });
    }

    // ── 4. Database transaction: enroll student + record payment ─────────────
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Update payment intent status
      await conn.execute(
        "UPDATE payment_intents SET status = 'paid' WHERE id = ?",
        [intent.id]
      );

      // Update enrollment row if it exists (created during the legacy flow)
      const [updateRes]: any = await conn.execute(
        `UPDATE enrollments
            SET student_id          = ?,
                payment_status      = 'paid',
                status              = 'active',
                lead_status         = 'converted',
                razorpay_payment_id = ?,
                enrolled_at         = NOW()
          WHERE razorpay_order_id = ?`,
        [intent.student_id, razorpay_payment_id, razorpay_order_id]
      );

      if (updateRes && updateRes.affectedRows === 0) {
        const [studentRows]: any = await conn.execute(
          'SELECT name, email, phone FROM students WHERE id = ? LIMIT 1',
          [intent.student_id]
        );
        const [courseRows]: any = await conn.execute(
          'SELECT title FROM courses WHERE id = ? LIMIT 1',
          [intent.course_id]
        );
        const stName = studentRows[0]?.name || 'Student';
        const stEmail = studentRows[0]?.email || '';
        const stPhone = studentRows[0]?.phone || '';
        const cTitle = courseRows[0]?.title || 'Enrolled Track';

        await conn.execute(
          `INSERT INTO enrollments 
             (student_id, course_id, name, email, phone, course, amount, payment_status, status, lead_status, razorpay_order_id, razorpay_payment_id, enrolled_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'active', 'converted', ?, ?, NOW())`,
          [intent.student_id, intent.course_id, stName, stEmail, stPhone, cTitle, intent.amount, razorpay_order_id, razorpay_payment_id]
        );
      }

      // Insert payment transaction record (IGNORE duplicate to be idempotent)
      await conn.execute(
        `INSERT IGNORE INTO payments
           (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status)
         VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success')`,
        [
          intent.student_id,
          intent.course_id,
          intent.amount,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        ]
      );

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      success:      true,
      status:       'PAYMENT_VERIFIED',
      orderId:      razorpay_order_id,
      paymentId:    razorpay_payment_id,
      courseId:     intent.course_id,
      enrolledAt:   new Date().toISOString(),
      accessGranted: true,
    });

  } catch (error: unknown) {
    console.error('[/api/payments/verify]', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed. Please contact support.' },
      { status: 500 }
    );
  }
}
