import { NextRequest } from 'next/server';
import { InteractiveSessionManager, InteractiveEvent } from '@/lib/sandbox/interactiveSessionManager';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session?.sub) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  if (!executionId) {
    return new Response(JSON.stringify({ error: 'executionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isOwner = InteractiveSessionManager.validateSessionOwner(executionId, String(session.sub));
  if (!isOwner) {
    return new Response(JSON.stringify({ error: 'Forbidden: You do not own this execution session' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const interactiveSession = InteractiveSessionManager.getSession(executionId);
  if (!interactiveSession) {
    return new Response(JSON.stringify({ error: 'Session not found or already terminated' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create SSE stream
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  const sendEvent = async (event: InteractiveEvent) => {
    try {
      const data = 'data: ' + JSON.stringify(event) + '\n\n';
      await writer.write(encoder.encode(data));
      if (event.type === 'execution_finished' || event.type === 'execution_stopped' || event.type === 'error') {
        try {
          await writer.close();
        } catch {}
      }
    } catch {}
  };

  const unsubscribe = InteractiveSessionManager.subscribe(executionId, (event) => {
    sendEvent(event);
  });

  // Handle client abort / disconnect
  request.signal.addEventListener('abort', () => {
    unsubscribe();
    try {
      writer.close();
    } catch {}
  });

  return new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
