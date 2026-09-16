import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query, pool } from '@/lib/db';
import { activateEnrollmentTransaction, EnrollmentIntentRow } from '@/lib/enrollment';
import type { RowDataPacket } from 'mysql2';

interface PaymentIntentRow extends RowDataPacket {
  id: number;
  student_id: number;
  course_id: number;
  amount: number;
  status: string;
}

// Razorpay sends a GET to verify the webhook URL is alive
export async function GET() {
  return NextResponse.json({ success: true, status: 'active', message: 'Webhook endpoint is live.' });
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';

  // Fail-closed: reject if no payload
  if (!payload) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // ── Signature verification ────────────────────────────────────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? process.env.RAZORPAY_KEY_SECRET ?? '';

  if (!webhookSecret || !signature) {
    console.error('[webhook] Missing webhook secret or signature');
    return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
  }

  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  const expBuf = Buffer.from(expectedSig, 'utf-8');
  const sigBuf = Buffer.from(signature, 'utf-8');
  const isValid = expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);

  if (!isValid) {
    console.warn('[webhook] Signature mismatch — possible spoofed request');
    return NextResponse.json({ success: false, error: 'Signature verification failed' }, { status: 400 });
  }

  // ── Parse event ───────────────────────────────────────────────────────────────
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(payload);
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const event = data['event'] as string;

  // ── Handle payment.captured / order.paid ─────────────────────────────────────
  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = (data['payload'] as Record<string, unknown>)?.['payment'] as Record<string, unknown>;
    const payment = (paymentEntity?.['entity'] as Record<string, unknown>) ?? {};

    const orderId = (payment['order_id'] as string) ?? '';
    const paymentId = (payment['id'] as string) ?? '';

    if (!orderId) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    try {
      // 1. Check enrollment_intents table
      const enrollmentIntents = await query<EnrollmentIntentRow[]>(
        'SELECT * FROM enrollment_intents WHERE razorpay_order_id = ? LIMIT 1',
        [orderId]
      );

      if (enrollmentIntents.length > 0) {
        const intent = enrollmentIntents[0];
        if (intent.status !== 'ENROLLMENT_ACTIVE') {
          await activateEnrollmentTransaction(intent, {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
          });
          console.log(`[webhook] Activated enrollment_intent for order ${orderId}`);
        }
        return NextResponse.json({ success: true }, { status: 200 });
      }

      // 2. Fallback to legacy payment_intents
      const intents = await query<PaymentIntentRow[]>(
        'SELECT * FROM payment_intents WHERE razorpay_order_id = ? LIMIT 1',
        [orderId]
      );

      if (!intents.length || intents[0].status === 'paid') {
        return NextResponse.json({ success: true }, { status: 200 });
      }

      const intent = intents[0];
      const conn = await pool.getConnection();

      try {
        await conn.beginTransaction();

        await conn.execute(
          "UPDATE payment_intents SET status = 'paid' WHERE id = ?",
          [intent.id]
        );

        await conn.execute(
          `UPDATE enrollments
              SET student_id          = ?,
                  payment_status      = 'paid',
                  status              = 'active',
                  lead_status         = 'converted',
                  razorpay_payment_id = ?,
                  enrolled_at         = NOW()
            WHERE razorpay_order_id = ?`,
          [intent.student_id, paymentId, orderId]
        );

        await conn.execute(
          `INSERT IGNORE INTO payments
             (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, status)
           VALUES (?, ?, ?, 'INR', ?, ?, 'success')`,
          [intent.student_id, intent.course_id, intent.amount, orderId, paymentId]
        );

        await conn.commit();
        console.log(`[webhook] Enrolled student ${intent.student_id} into course ${intent.course_id}`);
      } catch (txErr) {
        await conn.rollback();
        throw txErr;
      } finally {
        conn.release();
      }
    } catch (err) {
      console.error('[webhook] DB error during payment.captured:', err);
      return NextResponse.json({ success: false }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
