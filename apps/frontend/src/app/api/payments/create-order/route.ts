import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

const CreateOrderSchema = z.object({
  courseId: z.number().int().positive('Valid course ID is required'),
  couponCode: z.string().max(30).optional(),
});

interface CourseRow extends RowDataPacket {
  id: number;
  title: string;
  price: number;
}

interface CouponRow extends RowDataPacket {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  times_used: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { courseId, couponCode } = parsed.data;

    // Fetch course from DB
    const courses = await query<CourseRow[]>(
      "SELECT id, title, price FROM courses WHERE id = ? AND status = 'published' LIMIT 1",
      [courseId]
    );

    if (!courses.length) {
      return NextResponse.json({ success: false, error: 'Course not found.' }, { status: 404 });
    }

    const course = courses[0];
    let finalAmount = course.price;
    let discountApplied = 0;
    let appliedCoupon = '';

    // Apply coupon from DB
    if (couponCode) {
      const coupons = await query<CouponRow[]>(
        `SELECT * FROM coupons
         WHERE UPPER(code) = UPPER(?)
           AND is_active = 1
           AND (expires_at IS NULL OR expires_at >= CURDATE())
           AND (max_uses = 0 OR times_used < max_uses)
         LIMIT 1`,
        [couponCode.trim()]
      );

      if (coupons.length) {
        const coupon = coupons[0];
        discountApplied = coupon.discount_type === 'percentage'
          ? Math.floor((course.price * coupon.discount_value) / 100)
          : Math.min(coupon.discount_value, course.price);
        finalAmount = Math.max(0, course.price - discountApplied);
        appliedCoupon = coupon.code;
      }
    }

    // Create real Razorpay order
    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const orderAmountPaise = Math.round(Number(finalAmount) * 100);

    const order = await razorpay.orders.create({
      amount:   orderAmountPaise,  // integer paise
      currency: 'INR',
      receipt:  `ea_${session.sub}_${courseId}_${Date.now()}`,
      notes: {
        student_id:  session.sub,
        student_email: session.email,
        course_id:   String(courseId),
        coupon_code: appliedCoupon,
      },
    });

    // Store payment intent for later verification (mirrors legacy payment_intents table)
    await execute(
      `INSERT INTO payment_intents (student_id, course_id, amount, razorpay_order_id, status)
       VALUES (?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE status = 'pending'`,
      [Number(session.sub), courseId, finalAmount, order.id]
    );

    return NextResponse.json({
      success:        true,
      orderId:        order.id,
      amount:         order.amount,
      currency:       order.currency,
      courseId,
      courseTitle:    course.title,
      keyId:          process.env.RAZORPAY_KEY_ID,
      discountApplied,
      couponApplied:  appliedCoupon,
    });

  } catch (error: unknown) {
    console.error('[/api/payments/create-order]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order. Please try again.' },
      { status: 500 }
    );
  }
}
