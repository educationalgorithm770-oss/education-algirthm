import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.toLowerCase().trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: true,
        status: 'NEW_STUDENT',
        isRegistered: false,
        isVerified: false,
      });
    }

    const session = await getSessionFromRequest(request);
    const isSessionMatch = Boolean(
      session &&
      session.role === 'student' &&
      session.email &&
      session.email.toLowerCase() === email
    );

    const existingStudents = await query<any[]>(
      'SELECT id, name, email, phone FROM students WHERE LOWER(email) = ? AND status = "active" LIMIT 1',
      [email]
    );

    // Query enrolled course IDs for this email
    const enrolledRows = await query<any[]>(
      `SELECT DISTINCT course_id 
       FROM enrollments 
       WHERE LOWER(email) = ? 
         AND payment_status IN ('paid', 'completed', 'active', 'waived', 'partial') 
         AND (status = 'active' OR status = 'approved' OR status IS NULL)`,
      [email]
    );
    const enrolledCourseIds = enrolledRows
      .map((r) => r.course_id)
      .filter((id): id is number => typeof id === 'number');

    if (isSessionMatch && existingStudents.length > 0) {
      return NextResponse.json({
        success: true,
        status: 'VERIFIED_SESSION',
        isRegistered: true,
        isVerified: true,
        studentName: existingStudents[0].name,
        enrolledCourseIds,
      });
    }

    if (existingStudents.length > 0) {
      return NextResponse.json({
        success: true,
        status: 'EXISTING_STUDENT',
        isRegistered: true,
        isVerified: false,
        studentName: '',
        enrolledCourseIds: [],
      });
    }

    return NextResponse.json({
      success: true,
      status: 'NEW_STUDENT',
      isRegistered: false,
      isVerified: false,
      studentName: '',
      enrolledCourseIds: [],
    });
  } catch (err: any) {
    console.error('[/api/enrollment/check-email] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email status' },
      { status: 500 }
    );
  }
}
