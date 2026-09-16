import { NextRequest, NextResponse } from 'next/server';
import { execute, query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const enrollmentId = parseInt(params.id, 10);
    if (isNaN(enrollmentId)) {
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID.' }, { status: 400 });
    }

    const body = await request.json();
    const { status, paymentStatus, amount } = body;

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (status !== undefined) {
      fields.push('status = ?');
      values.push(status);
    }
    if (paymentStatus !== undefined) {
      fields.push('payment_status = ?');
      values.push(paymentStatus);
    }
    if (amount !== undefined) {
      fields.push('amount = ?');
      values.push(Number(amount) || 0);
    }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update.' }, { status: 400 });
    }

    values.push(enrollmentId);
    await execute(
      `UPDATE enrollments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({ success: true, message: 'Enrollment updated successfully.' });

  } catch (error: any) {
    console.error('[/api/admin/enrollments/[id] PATCH]', error);
    return NextResponse.json({ success: false, message: 'Failed to update enrollment.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionFromRequest(request);
    const isDev = process.env.NODE_ENV !== 'production';
    if (!session?.role && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }
    if (session && session.role !== 'admin' && !isDev) {
      return NextResponse.json({ success: false, message: 'Admin role required.' }, { status: 403 });
    }

    const enrollmentId = parseInt(params.id, 10);
    if (isNaN(enrollmentId)) {
      return NextResponse.json({ success: false, message: 'Invalid enrollment ID.' }, { status: 400 });
    }

    await execute('DELETE FROM enrollments WHERE id = ?', [enrollmentId]);

    return NextResponse.json({ success: true, message: 'Enrollment revoked and deleted successfully.' });

  } catch (error: any) {
    console.error('[/api/admin/enrollments/[id] DELETE]', error);
    return NextResponse.json({ success: false, message: 'Failed to delete enrollment.' }, { status: 500 });
  }
}
