import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const scholarships = await query<RowDataPacket[]>(
      `SELECT sr.id, sr.student_id, sr.course_id, sr.original_fee, sr.scholarship_amount,
              sr.scholarship_price, sr.scholarship_status, sr.payment_status, sr.created_at,
              s.name AS student_name, s.email AS student_email, s.phone AS student_phone,
              c.title AS course_title
       FROM scholarship_reservations sr
       LEFT JOIN students s ON sr.student_id = s.id
       LEFT JOIN courses c ON sr.course_id = c.id
       ORDER BY sr.id DESC
       LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      applications: scholarships.map((app) => ({
        id: `SCH-${String(app.id).padStart(4, '0')}`,
        rawId: app.id,
        studentName: app.student_name || app.student_email || `Applicant #${app.id}`,
        email: app.student_email || 'applicant@edualg.com',
        phone: app.student_phone || 'N/A',
        course: app.course_title || 'Engineering Masterclass',
        originalFee: Number(app.original_fee || 18000),
        scholarshipAmount: Number(app.scholarship_amount || 5000),
        finalPrice: Number(app.scholarship_price || 13000),
        status: app.scholarship_status || 'PENDING',
        paymentStatus: app.payment_status || 'UNPAID',
        createdAt: app.created_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/scholarships GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { rawId, status } = body;

    if (!rawId || !status) {
      return NextResponse.json({ success: false, error: 'Application ID and status are required.' }, { status: 400 });
    }

    await execute(
      `UPDATE scholarship_reservations 
       SET scholarship_status = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status.toUpperCase(), Number(rawId)]
    );

    return NextResponse.json({
      success: true,
      message: `Scholarship application marked as ${status}.`,
    });
  } catch (error: any) {
    console.error('API /api/admin/scholarships PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
