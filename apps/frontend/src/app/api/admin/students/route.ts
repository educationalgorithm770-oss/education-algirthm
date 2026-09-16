import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const students = await query<RowDataPacket[]>(
      `SELECT s.id, s.name, s.email, s.phone, s.status, s.created_at,
              COUNT(e.id) as enrolled_count
       FROM students s
       LEFT JOIN enrollments e ON s.id = e.student_id AND e.payment_status = 'paid'
       GROUP BY s.id
       ORDER BY s.id DESC`
    );

    return NextResponse.json({ success: true, students });

  } catch (error) {
    console.error('[/api/admin/students GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch students.' }, { status: 500 });
  }
}
