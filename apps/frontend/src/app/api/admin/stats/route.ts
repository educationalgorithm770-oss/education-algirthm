import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const studentsCount = await query<({ total: number } & RowDataPacket)[]>(
      'SELECT COUNT(*) as total FROM students'
    );

    const activeEnrollments = await query<({ total: number } & RowDataPacket)[]>(
      "SELECT COUNT(*) as total FROM enrollments WHERE payment_status = 'paid'"
    );

    const totalRevenue = await query<({ total: number } & RowDataPacket)[]>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'success'"
    );

    const crmLeadsCount = await query<({ total: number } & RowDataPacket)[]>(
      'SELECT COUNT(*) as total FROM crm_leads'
    );

    const recentStudents = await query<RowDataPacket[]>(
      'SELECT id, name, email, created_at, status FROM students ORDER BY id DESC LIMIT 5'
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: studentsCount[0]?.total ?? 0,
        activeEnrollments: activeEnrollments[0]?.total ?? 0,
        totalRevenue: totalRevenue[0]?.total ?? 0,
        totalLeads: crmLeadsCount[0]?.total ?? 0,
        recentStudents,
      },
    });

  } catch (error) {
    console.error('[/api/admin/stats GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch admin stats.' }, { status: 500 });
  }
}
