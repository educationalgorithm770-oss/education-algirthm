import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { InteractiveSessionManager } from '@/lib/sandbox/interactiveSessionManager';
import { getSessionFromRequest } from '@/lib/auth';

const InputSchema = z.object({
  executionId: z.string().min(1),
  input: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.sub) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = InputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input payload' }, { status: 400 });
    }

    const { executionId, input } = parsed.data;

    // Enforce session ownership
    const isOwner = InteractiveSessionManager.validateSessionOwner(executionId, String(session.sub));
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden: You do not own this execution session' }, { status: 403 });
    }

    const success = InteractiveSessionManager.writeStdin(executionId, input, String(session.sub));

    if (!success) {
      return NextResponse.json(
        { error: 'Session not found or process is not running' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error' }, { status: 500 });
  }
}
