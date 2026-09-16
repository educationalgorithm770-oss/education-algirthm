import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query, pool } from '@/lib/db';
import { signToken } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

const OTP_SECRET = process.env.JWT_SECRET || 'ea_enrollment_otp_secret_2026';

export interface CourseData extends RowDataPacket {
  id: number;
  title: string;
  price: number;
  slug: string;
  duration?: string;
  level?: string;
  description?: string;
}

export interface CouponData extends RowDataPacket {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  times_used: number;
}

export interface EnrollmentIntentRow extends RowDataPacket {
  id: number;
  intent_id: string;
  student_id: number | null;
  course_id: number;
  batch_id: number | null;
  batch_name: string;
  full_name: string;
  email: string;
  phone: string;
  password_hash: string | null;
  status: string;
  course_price: number;
  discount_amount: number;
  final_amount: number;
  coupon_code: string | null;
  otp_hash: string | null;
  otp_expires_at: Date | string | null;
  otp_attempts: number;
  otp_resend_count: number;
  last_otp_sent_at: Date | string | null;
  email_verified_at: Date | string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  enrollment_id: number | null;
  enrollment_code: string | null;
  ip_address: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP with HMAC-SHA256 for secure DB storage
 */
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', OTP_SECRET).update(otp.trim()).digest('hex');
}

/**
 * Verify OTP using timing-safe comparison
 */
export function verifyOtpHash(enteredOtp: string, storedHash: string): boolean {
  try {
    const computed = hashOtp(enteredOtp);
    const bufA = Buffer.from(computed, 'hex');
    const bufB = Buffer.from(storedHash, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generate standard Enrollment ID (e.g. EA-2026-8742)
 */
export function generateEnrollmentCode(): string {
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, 4);
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `EA-2026-${randomDigits}`;
}

/**
 * Fetch and calculate price & discount directly from MySQL database
 */
export async function calculateCoursePrice(
  courseId: number,
  couponCode?: string
): Promise<{
  course: CourseData | null;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  appliedCoupon: string | null;
}> {
  const courses = await query<CourseData[]>(
    'SELECT id, title, price, slug, duration, level, description FROM courses WHERE id = ? AND LOWER(status) = "published" LIMIT 1',
    [courseId]
  );

  if (!courses.length) {
    return {
      course: null,
      basePrice: 0,
      discountAmount: 0,
      finalPrice: 0,
      appliedCoupon: null,
    };
  }

  const course = courses[0];
  const basePrice = Number(course.price || 18000);
  let discountAmount = 0;
  let appliedCoupon: string | null = null;

  if (couponCode && couponCode.trim().length > 0) {
    const coupons = await query<CouponData[]>(
      `SELECT * FROM coupons 
       WHERE UPPER(code) = UPPER(?) 
         AND is_active = 1 
         AND (expires_at IS NULL OR expires_at >= CURDATE()) 
         AND (max_uses = 0 OR times_used < max_uses) 
       LIMIT 1`,
      [couponCode.trim()]
    );

    if (coupons.length > 0) {
      const c = coupons[0];
      if (c.discount_type === 'percentage') {
        discountAmount = Math.floor((basePrice * Number(c.discount_value)) / 100);
      } else {
        discountAmount = Math.min(Number(c.discount_value), basePrice);
      }
      appliedCoupon = c.code;
    }
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    course,
    basePrice,
    discountAmount,
    finalPrice,
    appliedCoupon,
  };
}

/**
 * Idempotent Database Transaction to Activate Enrollment and Grant LMS Access
 */
export async function activateEnrollmentTransaction(
  intent: EnrollmentIntentRow,
  paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
  }
): Promise<{
  success: boolean;
  enrollmentId: number;
  enrollmentCode: string;
  studentId: number;
  authToken: string;
  error?: string;
}> {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const normalizedEmail = intent.email.toLowerCase().trim();

    // 1. Provision or Resolve Student Record
    const [existingStudents] = await conn.query<RowDataPacket[]>(
      'SELECT id, name, email FROM students WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );

    let studentId: number;
    if (existingStudents.length > 0) {
      studentId = existingStudents[0].id;
      // Update phone and status if needed
      await conn.execute(
        'UPDATE students SET phone = COALESCE(?, phone), status = "active" WHERE id = ?',
        [intent.phone, studentId]
      );
    } else {
      // Generate a secure random one-time initialization password hash
      const randomTempPass = crypto.randomBytes(24).toString('hex');
      const passHash = intent.password_hash || (await bcrypt.hash(randomTempPass, 12));
      const [insertStudent] = await conn.execute<any>(
        'INSERT INTO students (name, email, phone, password, password_hash, status, created_at) VALUES (?, ?, ?, ?, ?, "active", NOW())',
        [intent.full_name, normalizedEmail, intent.phone, passHash, passHash]
      );
      studentId = insertStudent.insertId;
    }

    // 2. Resolve Course Title
    const [courseRows] = await conn.query<RowDataPacket[]>(
      'SELECT id, title, price FROM courses WHERE id = ? LIMIT 1',
      [intent.course_id]
    );
    const courseTitle = courseRows.length > 0 ? courseRows[0].title : 'Full Stack Engineering';

    // 3. Generate unique enrollment code
    const enrollmentCode = intent.enrollment_code || generateEnrollmentCode();

    // 4. Upsert Enrollment Record (Idempotent by student_id + course_id or razorpay_order_id)
    const [existingEnrollments] = await conn.query<RowDataPacket[]>(
      `SELECT id, enrollment_code FROM enrollments 
       WHERE (student_id = ? AND course_id = ?) 
          OR razorpay_order_id = ? 
       LIMIT 1`,
      [studentId, intent.course_id, paymentDetails.razorpay_order_id]
    );

    let enrollmentId: number;

    if (existingEnrollments.length > 0) {
      enrollmentId = existingEnrollments[0].id;
      await conn.execute(
        `UPDATE enrollments 
         SET student_id = ?, name = ?, email = ?, phone = ?, course_id = ?, course = ?, 
             batch_name = ?, amount = ?, payment_status = 'paid', status = 'active', 
             razorpay_order_id = ?, razorpay_payment_id = ?, enrollment_code = COALESCE(enrollment_code, ?), 
             lead_status = 'converted', enrolled_at = NOW() 
         WHERE id = ?`,
        [
          studentId,
          intent.full_name,
          normalizedEmail,
          intent.phone,
          intent.course_id,
          courseTitle,
          intent.batch_name || 'Fall 2026 Live Cohort',
          intent.final_amount,
          paymentDetails.razorpay_order_id,
          paymentDetails.razorpay_payment_id,
          enrollmentCode,
          enrollmentId,
        ]
      );
    } else {
      const [insertEnrollment] = await conn.execute<any>(
        `INSERT INTO enrollments 
         (student_id, course_id, name, email, phone, course, batch_name, amount, payment_status, status, 
          razorpay_order_id, razorpay_payment_id, enrollment_code, lead_status, enrolled_at, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paid', 'active', ?, ?, ?, 'converted', NOW(), NOW())`,
        [
          studentId,
          intent.course_id,
          intent.full_name,
          normalizedEmail,
          intent.phone,
          courseTitle,
          intent.batch_name || 'Fall 2026 Live Cohort',
          intent.final_amount,
          paymentDetails.razorpay_order_id,
          paymentDetails.razorpay_payment_id,
          enrollmentCode,
        ]
      );
      enrollmentId = insertEnrollment.insertId;
    }

    // 5. Insert Payment Transaction Record (Idempotent INSERT IGNORE)
    await conn.execute(
      `INSERT IGNORE INTO payments 
       (student_id, course_id, amount, currency, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, created_at) 
       VALUES (?, ?, ?, 'INR', ?, ?, ?, 'success', NOW())`,
      [
        studentId,
        intent.course_id,
        intent.final_amount,
        paymentDetails.razorpay_order_id,
        paymentDetails.razorpay_payment_id,
        paymentDetails.razorpay_signature || null,
      ]
    );

    // 6. Update Enrollment Intent Status to ENROLLMENT_ACTIVE
    await conn.execute(
      `UPDATE enrollment_intents 
       SET student_id = ?, 
           status = 'ENROLLMENT_ACTIVE', 
           razorpay_order_id = ?, 
           razorpay_payment_id = ?, 
           razorpay_signature = COALESCE(?, razorpay_signature), 
           enrollment_id = ?, 
           enrollment_code = ? 
       WHERE id = ?`,
      [
        studentId,
        paymentDetails.razorpay_order_id,
        paymentDetails.razorpay_payment_id,
        paymentDetails.razorpay_signature || null,
        enrollmentId,
        enrollmentCode,
        intent.id,
      ]
    );

    // 7. Increment Coupon Usage if applicable
    if (intent.coupon_code) {
      await conn.execute(
        'UPDATE coupons SET times_used = times_used + 1 WHERE UPPER(code) = UPPER(?)',
        [intent.coupon_code.trim()]
      );
    }

    // 8. Insert Audit Log
    await conn.execute(
      `INSERT INTO admin_audit_logs 
       (admin_id, admin_name, action_type, description, ip_address, created_at) 
       VALUES (1, 'System Enrollment Engine', 'STUDENT_ENROLLMENT_ACTIVE', ?, ?, NOW())`,
      [
        `Activated enrollment ${enrollmentCode} for student ${normalizedEmail} in course "${courseTitle}" (Tuition: ₹${intent.final_amount})`,
        intent.ip_address || '127.0.0.1',
      ]
    );

    await conn.commit();

    // 9. Generate Signed JWT Auth Token
    const authToken = await signToken({
      sub: String(studentId),
      name: intent.full_name,
      email: normalizedEmail,
      role: 'student',
    });

    return {
      success: true,
      enrollmentId,
      enrollmentCode,
      studentId,
      authToken,
    };
  } catch (err: any) {
    await conn.rollback();
    console.error('[activateEnrollmentTransaction Error]:', err);
    return {
      success: false,
      enrollmentId: 0,
      enrollmentCode: '',
      studentId: 0,
      authToken: '',
      error: err.message || 'Transaction failed',
    };
  } finally {
    conn.release();
  }
}
