import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query, execute } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

const RegisterSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email:    z.string().email('Invalid email address').max(150),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone:    z.string().max(30).optional(),
});

interface ExistingStudent extends RowDataPacket {
  id: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if student already exists
    const existing = await query<ExistingStudent[]>(
      'SELECT id FROM students WHERE LOWER(email) = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt (cost factor 12, same as legacy PHP)
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert new student
    const result = await execute(
      'INSERT INTO students (name, email, phone, password, status) VALUES (?, ?, ?, ?, ?)',
      [name, normalizedEmail, phone ?? null, passwordHash, 'active']
    );

    const studentId = result.insertId;

    // Auto-sign in after registration
    const token = await signToken({
      sub:   String(studentId),
      name,
      email: normalizedEmail,
      role:  'student',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      user: { id: studentId, name, email: normalizedEmail, role: 'student' },
    }, { status: 201 });

    return setAuthCookie(response, token);

  } catch (error: unknown) {
    console.error('[/api/auth/register]', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
