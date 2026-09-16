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

    const tickets = await query<RowDataPacket[]>(
      `SELECT sm.id, sm.student_id, sm.subject, sm.message, sm.status, sm.admin_reply, sm.created_at,
              s.name AS student_name, s.email AS student_email
       FROM support_messages sm
       LEFT JOIN students s ON sm.student_id = s.id
       ORDER BY sm.id DESC
       LIMIT 100`
    );

    return NextResponse.json({
      success: true,
      tickets: tickets.map((t) => ({
        id: `TKT-${String(t.id).padStart(4, '0')}`,
        rawId: t.id,
        student: t.student_name || t.student_email || `Student #${t.student_id}`,
        email: t.student_email || 'student@edualg.com',
        subject: t.subject || 'Platform Inquiry',
        message: t.message,
        status: t.status || 'open',
        adminReply: t.admin_reply || '',
        createdAt: t.created_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/support GET Error:', error);
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
    const { rawId, status, adminReply } = body;

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required.' }, { status: 400 });
    }

    await execute(
      `UPDATE support_messages 
       SET status = ?, admin_reply = ? 
       WHERE id = ?`,
      [status || 'resolved', adminReply || null, Number(rawId)]
    );

    return NextResponse.json({
      success: true,
      message: 'Support ticket updated successfully.',
    });
  } catch (error: any) {
    console.error('API /api/admin/support PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
