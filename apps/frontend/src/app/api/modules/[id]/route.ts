import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const moduleId = parseInt(params.id, 10);
    if (isNaN(moduleId)) {
      return NextResponse.json({ success: false, message: 'Invalid module ID.' }, { status: 400 });
    }

    await execute('DELETE FROM modules WHERE id = ?', [moduleId]);

    return NextResponse.json({ success: true, message: 'Module deleted successfully.' });

  } catch (error) {
    console.error('[/api/modules/[id] DELETE]', error);
    return NextResponse.json({ success: false, message: 'Failed to delete module.' }, { status: 500 });
  }
}
