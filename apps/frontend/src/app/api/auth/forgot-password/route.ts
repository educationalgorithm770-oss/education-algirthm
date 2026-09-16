import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import type { RowDataPacket } from 'mysql2';

const RequestOtpSchema = z.object({
  action: z.literal('request-otp'),
  email: z.string().email('Please enter a valid email address.').max(150),
});

const ResetPasswordSchema = z.object({
  action: z.literal('reset-password'),
  email: z.string().email('Please enter a valid email address.').max(150),
  otp: z.string().min(6, 'Verification code must be 6 digits.').max(6),
  newPassword: z.string().min(6, 'Password must be at least 6 characters long.').max(128),
});

interface UserCheckRow extends RowDataPacket {
  id: number;
  name?: string;
  username?: string;
  email?: string;
}

interface ResetTokenRow extends RowDataPacket {
  id: number;
  email: string;
  token: string;
  expires_at: number;
}

// Rate limiting storage: max 3 requests per 10 minutes per email
const otpRequestLimits = new Map<string, { count: number; resetTime: number }>();
// Brute-force protection: max 5 failed attempts per email
const failedVerifyAttempts = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action;

    // ==========================================
    // ACTION 1: REQUEST OTP
    // ==========================================
    if (action === 'request-otp') {
      const parsed = RequestOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: parsed.error.errors[0]?.message || 'Invalid email address.' },
          { status: 400 }
        );
      }

      const cleanEmail = parsed.data.email.trim().toLowerCase();

      // Rate limit check
      const now = Date.now();
      const rateInfo = otpRequestLimits.get(cleanEmail);
      if (rateInfo) {
        if (now < rateInfo.resetTime) {
          if (rateInfo.count >= 3) {
            const waitMinutes = Math.ceil((rateInfo.resetTime - now) / 60000);
            return NextResponse.json(
              { success: false, message: `Too many password reset requests. Please wait ${waitMinutes} minute(s) before trying again.` },
              { status: 429 }
            );
          }
          rateInfo.count += 1;
        } else {
          otpRequestLimits.set(cleanEmail, { count: 1, resetTime: now + 10 * 60 * 1000 });
        }
      } else {
        otpRequestLimits.set(cleanEmail, { count: 1, resetTime: now + 10 * 60 * 1000 });
      }

      // Check if user exists in students, instructors, or admins
      let userDisplayName = 'User';
      let userExists = false;

      // 1. Check students
      const studentRows = await query<UserCheckRow[]>(
        'SELECT id, name, email FROM students WHERE LOWER(email) = ? LIMIT 1',
        [cleanEmail]
      );
      if (studentRows.length > 0) {
        userExists = true;
        userDisplayName = studentRows[0].name || 'Student';
      }

      // 2. Check instructors
      if (!userExists) {
        const instRows = await query<UserCheckRow[]>(
          'SELECT id, name, email FROM instructors WHERE LOWER(email) = ? OR LOWER(username) = ? LIMIT 1',
          [cleanEmail, cleanEmail]
        );
        if (instRows.length > 0) {
          userExists = true;
          userDisplayName = instRows[0].name || 'Faculty Instructor';
        }
      }

      // 3. Check admins
      if (!userExists) {
        const adminRows = await query<UserCheckRow[]>(
          'SELECT id, username FROM admins WHERE LOWER(username) = ? LIMIT 1',
          [cleanEmail]
        );
        if (adminRows.length > 0) {
          userExists = true;
          userDisplayName = adminRows[0].username || 'Administrator';
        }
      }

      // Anti-enumeration: If user does not exist, return generic success without leaking account existence
      if (!userExists) {
        return NextResponse.json({
          success: true,
          message: `If an account with ${cleanEmail} exists, a 6-digit verification code has been sent. It expires in 10 minutes.`,
        });
      }

      // Generate cryptographically secure 6-digit OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      const expiresAt = Math.floor(Date.now() / 1000) + (10 * 60); // 10 minutes expiry

      // Store hashed OTP in password_resets table
      await execute('DELETE FROM password_resets WHERE LOWER(email) = ?', [cleanEmail]);
      await execute(
        'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
        [cleanEmail, otpHash, expiresAt]
      );

      // Send Email via SendGrid / Transactional dispatcher
      const emailSent = await sendPasswordResetEmail(cleanEmail, userDisplayName, otp);

      return NextResponse.json({
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail}. It expires in 10 minutes.`,
        emailSent,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
      });
    }

    // ==========================================
    // ACTION 2: RESET PASSWORD WITH OTP
    // ==========================================
    if (action === 'reset-password') {
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { success: false, message: parsed.error.errors[0]?.message || 'Invalid input data.' },
          { status: 400 }
        );
      }

      const { email, otp, newPassword } = parsed.data;
      const cleanEmail = email.trim().toLowerCase();
      const cleanOtp = otp.trim();
      const otpHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      const nowUnix = Math.floor(Date.now() / 1000);

      // Validate OTP (match hash or legacy plaintext)
      const tokenRows = await query<ResetTokenRow[]>(
        'SELECT id, email, token, expires_at FROM password_resets WHERE LOWER(email) = ? AND (token = ? OR token = ?) LIMIT 1',
        [cleanEmail, otpHash, cleanOtp]
      );

      if (tokenRows.length === 0) {
        const attempts = (failedVerifyAttempts.get(cleanEmail) || 0) + 1;
        failedVerifyAttempts.set(cleanEmail, attempts);

        if (attempts >= 5) {
          await execute('DELETE FROM password_resets WHERE LOWER(email) = ?', [cleanEmail]);
          failedVerifyAttempts.delete(cleanEmail);
          return NextResponse.json(
            { success: false, message: 'Too many incorrect attempts. This verification code has been invalidated. Please request a new code.' },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { success: false, message: `Invalid verification code. (${5 - attempts} attempt(s) remaining)` },
          { status: 400 }
        );
      }

      // Reset failed attempts on success
      failedVerifyAttempts.delete(cleanEmail);

      const resetRecord = tokenRows[0];
      if (resetRecord.expires_at < nowUnix) {
        return NextResponse.json(
          { success: false, message: 'Verification code has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update in relevant user tables
      let updated = false;

      // Update students
      const updateStudentRes = await execute(
        'UPDATE students SET password = ?, password_hash = ? WHERE LOWER(email) = ?',
        [hashedPassword, hashedPassword, cleanEmail]
      );
      if (updateStudentRes.affectedRows > 0) {
        updated = true;
      }

      // Update instructors
      const updateInstRes = await execute(
        'UPDATE instructors SET password = ? WHERE LOWER(email) = ? OR LOWER(username) = ?',
        [hashedPassword, cleanEmail, cleanEmail]
      );
      if (updateInstRes.affectedRows > 0) {
        updated = true;
      }

      // Update admins
      const updateAdminRes = await execute(
        'UPDATE admins SET password = ? WHERE LOWER(username) = ?',
        [hashedPassword, cleanEmail]
      );
      if (updateAdminRes.affectedRows > 0) {
        updated = true;
      }

      // Delete used OTP
      await execute('DELETE FROM password_resets WHERE LOWER(email) = ?', [cleanEmail]);

      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Account could not be updated. Please try again or contact support.' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new credentials.',
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action specified.' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[/api/auth/forgot-password] Error:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
