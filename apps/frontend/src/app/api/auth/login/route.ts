import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '@/lib/db';
import { signToken, setAuthCookie } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

const LoginSchema = z.object({
  email:    z.string().min(1, 'Email or username is required').max(320),
  password: z.string().min(1, 'Password is required').max(128),
});

interface StudentRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  password: string;
  status: string;
}

// Failed attempt throttle map for brute-force protection
const loginAttemptsMap = new Map<string, { failedCount: number; lockUntil: number }>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

function isLockedOut(key: string): boolean {
  const record = loginAttemptsMap.get(key);
  if (!record) return false;
  if (Date.now() < record.lockUntil) return true;
  if (Date.now() >= record.lockUntil && record.lockUntil > 0) {
    loginAttemptsMap.delete(key);
    return false;
  }
  return false;
}

function recordFailedAttempt(key: string) {
  const now = Date.now();
  const record = loginAttemptsMap.get(key) || { failedCount: 0, lockUntil: 0 };
  record.failedCount += 1;
  if (record.failedCount >= MAX_FAILED_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_MS;
  }
  loginAttemptsMap.set(key, record);
}

function clearFailedAttempts(key: string) {
  loginAttemptsMap.delete(key);
}

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const body = await request.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password format.' },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const cleanEmail = email.trim().toLowerCase();
    const throttleKey = `${clientIp}:${cleanEmail}`;

    if (isLockedOut(throttleKey)) {
      return NextResponse.json(
        { success: false, message: 'Too many failed login attempts. Please try again in 5 minutes.' },
        { status: 429 }
      );
    }

    // 1. Fetch student from DB
    const studentRows = await query<StudentRow[]>(
      'SELECT id, name, email, password, password_hash, status FROM students WHERE LOWER(email) = LOWER(?) LIMIT 1',
      [cleanEmail]
    );

    let authenticatedUser: { id: number; name: string; email: string; role: 'student' } | null = null;

    if (studentRows.length > 0) {
      const student = studentRows[0];
      const targetHash = student.password_hash || student.password || '';
      let isValid = false;
      try {
        isValid = await bcrypt.compare(password, targetHash);
      } catch {
        isValid = false;
      }

      if (isValid) {
        if (student.status !== 'active') {
          return NextResponse.json(
            { success: false, message: 'Your student account has been suspended. Please contact support.' },
            { status: 403 }
          );
        }
        authenticatedUser = {
          id: student.id,
          name: student.name,
          email: student.email,
          role: 'student',
        };
      }
    }

    // 2. If not a student, check if they are trying to log in with admin or instructor credentials
    if (!authenticatedUser) {
      const adminRows = await query<RowDataPacket[]>(
        'SELECT id FROM admins WHERE LOWER(username) = LOWER(?) LIMIT 1',
        [cleanEmail]
      );
      if (adminRows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'This login portal is for Students only. Administrators must log in at /admin/login.' },
          { status: 403 }
        );
      }

      const instRows = await query<RowDataPacket[]>(
        'SELECT id FROM instructors WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?) LIMIT 1',
        [cleanEmail, cleanEmail]
      );
      if (instRows.length > 0) {
        return NextResponse.json(
          { success: false, message: 'This login portal is for Students only. Faculty members must log in at /instructor/login.' },
          { status: 403 }
        );
      }

      recordFailedAttempt(throttleKey);
      return NextResponse.json(
        { success: false, message: 'Invalid student email or password. Please try again.' },
        { status: 401 }
      );
    }

    clearFailedAttempts(throttleKey);

    // Sign JWT
    const token = await signToken({
      sub:   String(authenticatedUser.id),
      name:  authenticatedUser.name,
      email: authenticatedUser.email,
      role:  authenticatedUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    return setAuthCookie(response, token);

  } catch (error: unknown) {
    console.error('[/api/auth/login]', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
