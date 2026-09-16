import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

const LoginSchema = z.object({
  email: z.string().min(1).max(320),
  password: z.string().min(1).max(128),
});

interface AdminRow extends RowDataPacket {
  id: number;
  username: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid email or password format.' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const cleanEmail = email.trim();

    // Query admins table
    const adminRows = await query<AdminRow[]>(
      'SELECT id, username, password FROM admins WHERE LOWER(username) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );

    if (adminRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No administrator account found with this email. If you are an instructor, please use the Instructor Portal login.',
      }, { status: 401 });
    }

    const admin = adminRows[0];
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, admin.password);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid administrator email or password.' }, { status: 401 });
    }

    const token = await signToken({
      sub: String(admin.id),
      name: admin.username,
      email: admin.username,
      role: 'admin',
    });

    const response = NextResponse.json({
      success: true,
      role: 'admin',
      redirectTo: '/admin',
      user: {
        id: admin.id,
        name: admin.username,
        email: admin.username,
        role: 'admin',
      },
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('[/api/auth/admin-login]', error);
    return NextResponse.json({ success: false, message: 'Server error occurred during admin sign in.' }, { status: 500 });
  }
}
