import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import type { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

type SqlParam = string | number | boolean | null | Buffer | Date | object;

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const leads = await query<RowDataPacket[]>(
      'SELECT id, name, email, phone, status, source, notes, created_at FROM crm_leads ORDER BY id DESC'
    );

    return NextResponse.json({ success: true, leads });

  } catch (error) {
    console.error('[/api/admin/leads GET]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch CRM leads.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Lead ID is required.' }, { status: 400 });
    }

    const fields: string[] = [];
    const values: SqlParam[] = [];

    if (status !== undefined) { fields.push('status = ?'); values.push(status); }
    if (notes !== undefined) { fields.push('notes = ?'); values.push(notes); }

    if (fields.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update.' }, { status: 400 });
    }

    values.push(id);
    await execute(`UPDATE crm_leads SET ${fields.join(', ')} WHERE id = ?`, values);

    return NextResponse.json({ success: true, message: 'Lead updated successfully.' });

  } catch (error) {
    console.error('[/api/admin/leads PATCH]', error);
    return NextResponse.json({ success: false, message: 'Failed to update lead.' }, { status: 500 });
  }
}
