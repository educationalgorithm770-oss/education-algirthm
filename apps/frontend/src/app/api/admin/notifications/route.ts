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

    const notifs = await query<RowDataPacket[]>(
      `SELECT id, title, message, created_at 
       FROM notifications 
       ORDER BY id DESC 
       LIMIT 50`
    );

    return NextResponse.json({
      success: true,
      notifications: notifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
      })),
    });
  } catch (error: any) {
    console.error('API /api/admin/notifications GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await req.json();
    const { title, message } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: 'Title and message are required.' }, { status: 400 });
    }

    const result = await execute(
      `INSERT INTO notifications (title, message, created_at)
       VALUES (?, ?, NOW())`,
      [title.trim(), message.trim()]
    );

    return NextResponse.json({
      success: true,
      message: 'Announcement broadcasted successfully to all students.',
      notificationId: result.insertId,
    });
  } catch (error: any) {
    console.error('API /api/admin/notifications POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
