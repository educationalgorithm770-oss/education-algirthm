import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { calculateCoursePrice, activateEnrollmentTransaction, EnrollmentIntentRow } from '@/lib/enrollment';
import { setAuthCookie } from '@/lib/auth';
import { sendEnrollmentConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const CreatePaymentSchema = z.object({
  intentId: z.string().min(5, 'Invalid intent ID'),
  couponCode: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreatePaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { intentId, couponCode } = parsed.data;

    // 1. Fetch Enrollment Intent
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

    // 2. Ensure Email is Verified
    if (intent.status === 'PENDING_EMAIL_VERIFICATION') {
      return NextResponse.json(
        { success: false, error: 'Please verify your email address first before proceeding to payment.' },
        { status: 403 }
      );
    }

    // 3. Re-calculate price strictly from MySQL database
    const effectiveCoupon = couponCode || intent.coupon_code || undefined;
    const priceCalculation = await calculateCoursePrice(intent.course_id, effectiveCoupon);

    if (!priceCalculation.course) {
      return NextResponse.json(
        { success: false, error: 'Course not found.' },
        { status: 404 }
      );
    }

    const { course, basePrice, discountAmount, finalPrice, appliedCoupon } = priceCalculation;

    // Update intent with fresh calculations if coupon changed
    if (finalPrice !== intent.final_amount || appliedCoupon !== intent.coupon_code) {
      await execute(
        'UPDATE enrollment_intents SET course_price = ?, discount_amount = ?, final_amount = ?, coupon_code = ? WHERE id = ?',
        [basePrice, discountAmount, finalPrice, appliedCoupon, intent.id]
      );
      intent.final_amount = finalPrice;
      intent.coupon_code = appliedCoupon;
    }

    // 4. Handle 100% Free / Scholarship Waived Case (0 INR)
    if (finalPrice === 0) {
      const activation = await activateEnrollmentTransaction(intent, {
        razorpay_order_id: `free_${Date.now()}`,
        razorpay_payment_id: `pay_waived_${Date.now()}`,
      });

      if (!activation.success) {
        return NextResponse.json(
          { success: false, error: activation.error || 'Failed to activate free enrollment.' },
          { status: 500 }
        );
      }

      await sendEnrollmentConfirmationEmail(
        intent.email,
        intent.full_name,
        course.title,
        activation.enrollmentCode,
        0,
        intent.batch_name
      );

      const response = NextResponse.json({
        success: true,
        zeroAmount: true,
        enrollmentCode: activation.enrollmentCode,
        enrollmentId: activation.enrollmentId,
        courseTitle: course.title,
        redirectUrl: '/dashboard',
        step: 4,
      });

      return setAuthCookie(response, activation.authToken);
    }

    // 5. Initialize Razorpay Client
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error('[/api/enrollment/create-payment] Razorpay keys not configured');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration missing.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // 6. Create Razorpay Order (amount in paise)
    const amountInPaise = Math.round(finalPrice * 100);
    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `ei_${intent.id}_${Date.now().toString().slice(-6)}`,
      notes: {
        intent_id: intent.intent_id,
        student_name: intent.full_name,
        student_email: intent.email,
        student_phone: intent.phone,
        course_id: String(intent.course_id),
        course_title: course.title,
        coupon_code: appliedCoupon || '',
      },
    });

    // 7. Update Intent with razorpay_order_id
    await execute(
      'UPDATE enrollment_intents SET razorpay_order_id = ?, status = "PAYMENT_PENDING" WHERE id = ?',
      [order.id, intent.id]
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      courseTitle: course.title,
      batchName: intent.batch_name,
      basePrice,
      discountAmount,
      finalAmount: finalPrice,
      appliedCoupon,
      studentName: intent.full_name,
      studentEmail: intent.email,
      studentPhone: intent.phone,
    });
  } catch (err: any) {
    console.error('[/api/enrollment/create-payment] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to initiate payment gateway. Please try again.' },
      { status: 500 }
    );
  }
}
