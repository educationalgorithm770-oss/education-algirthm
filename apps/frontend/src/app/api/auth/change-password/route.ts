import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import type { RowDataPacket } from 'mysql2';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword:     z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string().min(6, 'Please confirm your new password.'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation do not match.',
  path: ['confirmPassword'],
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || !session.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to change password.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Fetch existing student record from MySQL
    const rows = await query<RowDataPacket[]>(
      `SELECT id, password FROM students WHERE LOWER(email) = LOWER(?) LIMIT 1`,
      [session.email.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student account not found.' },
        { status: 404 }
      );
    }

    const student = rows[0];
    const passwordHash = student.password || '';

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect. Please check and try again.' },
        { status: 400 }
      );
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);

    // Update in MySQL database
    await execute(
      `UPDATE students SET password = ? WHERE id = ?`,
      [newHash, student.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Password successfully updated! You can now use your new password.'
    });

  } catch (error: any) {
    console.error('[/api/auth/change-password] error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while updating your password.' },
      { status: 500 }
    );
  }
}
