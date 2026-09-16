import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { EnrollmentIntentRow, CourseData } from '@/lib/enrollment';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const intentId = searchParams.get('intentId');

    if (!intentId) {
      return NextResponse.json(
        { success: false, error: 'Intent ID is required' },
        { status: 400 }
      );
    }

    const intents = await query<EnrollmentIntentRow[]>(
      'SELECT * FROM enrollment_intents WHERE intent_id = ? LIMIT 1',
      [intentId]
    );

    if (!intents.length) {
      return NextResponse.json(
        { success: false, error: 'Enrollment session not found.' },
        { status: 404 }
      );
    }

    const intent = intents[0];

    // Fetch Course details
    const courses = await query<CourseData[]>(
      'SELECT id, title, price, slug, duration, level FROM courses WHERE id = ? LIMIT 1',
      [intent.course_id]
    );
    const course = courses[0] || null;

    let step = 1;
    if (intent.status === 'PENDING_EMAIL_VERIFICATION') {
      step = 2;
    } else if (intent.status === 'EMAIL_VERIFIED' || intent.status === 'PAYMENT_PENDING') {
      step = 3;
    } else if (intent.status === 'ENROLLMENT_ACTIVE' || intent.status === 'PAYMENT_SUCCESS') {
      step = 4;
    }

    return NextResponse.json({
      success: true,
      intentId: intent.intent_id,
      status: intent.status,
      step,
      fullName: intent.full_name,
      email: intent.email,
      phone: intent.phone,
      courseId: intent.course_id,
      courseTitle: course?.title || 'Selected Cohort Program',
      batchName: intent.batch_name,
      coursePrice: intent.course_price,
      discountAmount: intent.discount_amount,
      finalAmount: intent.final_amount,
      couponCode: intent.coupon_code,
      enrollmentCode: intent.enrollment_code,
      enrollmentId: intent.enrollment_id,
      razorpayOrderId: intent.razorpay_order_id,
    });
  } catch (err: any) {
    console.error('[/api/enrollment/status] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve enrollment status.' },
      { status: 500 }
    );
  }
}
