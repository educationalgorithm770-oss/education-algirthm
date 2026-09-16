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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid email or password format.' }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const cleanEmail = email.trim();

    // Query instructors table
    const instRows = await query<RowDataPacket[]>(
      'SELECT id, name, email, password, title, status FROM instructors WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1',
      [cleanEmail, cleanEmail]
    );

    if (instRows.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Invalid instructor email or password.',
      }, { status: 401 });
    }

    const inst = instRows[0];
    let isValid = false;
    try {
      isValid = await bcrypt.compare(password, inst.password);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid instructor email or password.',
      }, { status: 401 });
    }

    if (inst.status !== 'active') {
      return NextResponse.json({
        success: false,
        message: 'Faculty account is suspended or inactive. Please contact system admin.',
      }, { status: 403 });
    }

    const token = await signToken({
      sub: String(inst.id),
      name: inst.name,
      email: inst.email,
      role: 'instructor',
    });

    const response = NextResponse.json({
      success: true,
      role: 'instructor',
      redirectTo: '/instructor',
      user: {
        id: inst.id,
        name: inst.name,
        email: inst.email,
        title: inst.title,
        role: 'instructor',
      },
    });

    return setAuthCookie(response, token);
  } catch (error) {
    console.error('[/api/auth/instructor-login]', error);
    return NextResponse.json({ success: false, message: 'Server error occurred during faculty sign in.' }, { status: 500 });
  }
}
