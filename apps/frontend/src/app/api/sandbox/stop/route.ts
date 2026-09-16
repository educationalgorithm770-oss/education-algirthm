import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InteractiveSessionManager } from '@/lib/sandbox/interactiveSessionManager';
import { getSessionFromRequest } from '@/lib/auth';

const StopSchema = z.object({
  executionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = StopSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { executionId } = parsed.data;

    // Enforce session ownership
    const isOwner = InteractiveSessionManager.validateSessionOwner(executionId, String(session.sub));
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not own this execution session' }, { status: 403 });
    }

    const success = InteractiveSessionManager.stopSession(executionId, String(session.sub));

    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
