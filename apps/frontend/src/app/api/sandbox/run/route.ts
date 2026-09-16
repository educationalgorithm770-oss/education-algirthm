import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RunCodeSchema, executeCodeInSandbox, NormalizedExecutionResult } from '@/lib/sandbox/dockerRunner';
import { InteractiveSessionManager } from '@/lib/sandbox/interactiveSessionManager';
import { QUESTION_BANK_DATA } from '@/config/question-bank-data';
import { getSessionFromRequest } from '@/lib/auth';

const STORE_PATH = path.join(process.cwd(), 'src/data/rag-knowledge-store.json');

function resolveAuthoritativeMode(problemId?: string, fallbackMode?: 'batch' | 'interactive'): 'batch' | 'interactive' {
  if (!problemId) {
    return fallbackMode || 'batch';
  }

  // 1. Check persistent RAG store
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
      const found = data.documents?.find((d: any) => d.id === problemId);
      if (found && found.executionMode) {
        return found.executionMode === 'interactive' ? 'interactive' : 'batch';
      }
    }
  } catch {}

  // 2. Check static question bank registry
  const staticFound = QUESTION_BANK_DATA.find((q) => q.id === problemId);
  if (staticFound && staticFound.executionMode) {
    return staticFound.executionMode === 'interactive' ? 'interactive' : 'batch';
  }

  // Default for existing/unspecified problems is ALWAYS 'batch'
  return fallbackMode || 'batch';
}

// In-Memory Rate Limiter: max 30 requests per 10 seconds per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 10000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }

  record.count += 1;
  return false;
}

// Guest Rate Limiter: Option B (max 3 demo runs per hour per IP)
const guestDemoMap = new Map<string, { count: number; resetTime: number }>();
const GUEST_MAX_RUNS = 3;
const GUEST_WINDOW_MS = 60 * 60 * 1000;

function checkGuestQuota(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = guestDemoMap.get(ip);
  if (!record || now > record.resetTime) {
    guestDemoMap.set(ip, { count: 1, resetTime: now + GUEST_WINDOW_MS });
    return { allowed: true, remaining: GUEST_MAX_RUNS - 1 };
  }
  if (record.count >= GUEST_MAX_RUNS) {
    return { allowed: false, remaining: 0 };
  }
  record.count += 1;
  return { allowed: true, remaining: GUEST_MAX_RUNS - record.count };
}

export async function POST(request: NextRequest) {
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate Limiting Guard
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      {
        status: 'Execution Error',
        stdout: '',
        stderr: 'Rate limit exceeded. Please wait a few seconds before running code again.',
        compileError: '',
        runtimeError: 'Too many execution requests.',
        executionTimeMs: 0,
        executionId: 'EA-RATE-LIMIT',
        passed: false,
        engine: 'Rate Limiter',
      } as NormalizedExecutionResult,
      { status: 429 }
    );
  }

  // 2. Authentication & Guest Demo Quota Check (Option B)
  const session = await getSessionFromRequest(request);
  const isAuthenticated = Boolean(session?.sub);

  if (!isAuthenticated) {
    const quota = checkGuestQuota(clientIp);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          status: 'Execution Error',
          stdout: '',
          stderr: 'Guest demo limit reached (3 runs per hour). Please log in or register for full Code Arena access.',
          compileError: '',
          runtimeError: 'Guest execution quota exceeded. Please sign in.',
          executionTimeMs: 0,
          executionId: 'EA-GUEST-LIMIT',
          passed: false,
          engine: 'Access Control',
        } as NormalizedExecutionResult,
        { status: 429 }
      );
    }
  }

  try {
    const body = await request.json();

    // 3. Strict Zod Payload Validation
    const validationResult = RunCodeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          status: 'Execution Error',
          stdout: '',
          stderr: 'Invalid payload: ' + validationResult.error.issues.map((i) => i.message).join(', '),
          compileError: '',
          runtimeError: 'Request validation failed',
          executionTimeMs: 0,
          executionId: 'EA-VAL-ERR',
          passed: false,
          engine: 'Validator',
        } as NormalizedExecutionResult,
        { status: 400 }
      );
    }

    const payload = validationResult.data;

    // Authoritative Server-Side Execution Mode Resolution
    const effectiveMode = resolveAuthoritativeMode(payload.problemId, payload.mode);

    // 4. True Interactive Console Execution Routing (Logged-in Students Only)
    if (effectiveMode === 'interactive') {
      if (!isAuthenticated) {
        return NextResponse.json(
          {
            status: 'Execution Error',
            stdout: '',
            stderr: 'Interactive terminal execution requires a student login. Please sign in to launch interactive console.',
            compileError: '',
            runtimeError: 'Authentication required for interactive sessions.',
            executionTimeMs: 0,
            executionId: 'EA-AUTH-REQ',
            passed: false,
            engine: 'Access Control',
          } as NormalizedExecutionResult,
          { status: 401 }
        );
      }

      try {
        const ownerId = String(session?.sub || 'student');
        const startResult = await InteractiveSessionManager.startSession(payload.language, payload.code, ownerId);

        if (startResult.compileError) {
          return NextResponse.json({
            status: 'Compilation Error',
            stdout: '',
            stderr: startResult.compileError,
            compileError: startResult.compileError,
            runtimeError: '',
            executionTimeMs: 0,
            executionId: startResult.executionId,
            passed: false,
            engine: 'Interactive Host Engine',
          } as NormalizedExecutionResult);
        }

        return NextResponse.json({
          status: 'RUNNING',
          executionId: startResult.executionId,
          mode: 'interactive',
          engine: 'Interactive PTY Engine',
        });
      } catch (err: any) {
        return NextResponse.json({
          status: 'Execution Error',
          stdout: '',
          stderr: err?.message || 'Failed to start interactive session',
          compileError: '',
          runtimeError: err?.message || 'Process launch error',
          executionTimeMs: 0,
          executionId: 'EA-INTERACTIVE-ERR',
          passed: false,
          engine: 'Interactive Engine',
        } as NormalizedExecutionResult, { status: 500 });
      }
    }

    // 4. Batch Execution in Real Sandbox (Default)
    const result = await executeCodeInSandbox({
      ...payload,
      mode: 'batch',
    });

    console.log(
      '[SANDBOX RUN] ID=' + result.executionId + ' Lang=' + payload.language + ' Mode=batch Status=' + result.status + ' Time=' + result.executionTimeMs + 'ms'
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[SANDBOX ERROR]:', error?.message || error);
    return NextResponse.json(
      {
        status: 'Execution Error',
        stdout: '',
        stderr: 'Internal sandbox execution fault occurred.',
        compileError: '',
        runtimeError: error?.message || 'Server error',
        executionTimeMs: 0,
        executionId: 'EA-ERR-500',
        passed: false,
        engine: 'Sandbox Engine',
      } as NormalizedExecutionResult,
      { status: 500 }
    );
  }
}
