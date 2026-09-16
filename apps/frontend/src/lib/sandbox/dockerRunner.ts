import { z } from 'zod';
import crypto from 'crypto';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const EXTRA_COMPILER_PATHS = [
  'C:\\tools\\mingw64\\bin',
  'C:\\tools\\mingw\\bin',
  'C:\\MinGW\\bin',
  'C:\\msys64\\ucrt64\\bin',
  'C:\\msys64\\mingw64\\bin',
  'C:\\Program Files\\LLVM\\bin',
  'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.101-hotspot\\bin',
  'C:\\tools\\jdk-21.0.6+7\\bin',
  'C:\\Program Files\\Python314',
  'C:\\Program Files\\nodejs',
];

function getEnhancedPath(): string {
  const currentPath = process.env.PATH || '';
  const existingExtras = EXTRA_COMPILER_PATHS.filter((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  return [...existingExtras, currentPath].join(path.delimiter);
}

// ── Canonical Standard Execution Result Contract ───────────────────────────
export type ExecutionStatus =
  | 'Accepted'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Time Limit Exceeded'
  | 'Memory Limit Exceeded'
  | 'Wrong Answer'
  | 'Security Error'
  | 'Execution Error';

export interface TestCaseResult {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  status: ExecutionStatus;
  passed: boolean;
  executionTimeMs: number;
  isHidden?: boolean;
}

export interface NormalizedExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  compileError: string;
  runtimeError: string;
  executionTimeMs: number;
  memoryKb?: number;
  exitCode?: number;
  signal?: string;
  executionId: string;
  passed: boolean;
  engine: string;
  testCaseResults?: TestCaseResult[];
  totalTests?: number;
  passedTests?: number;
}

// ── Zod Request Payload Validation ──────────────────────────────────────────
export const RunCodeSchema = z.object({
  language: z.enum(['python', 'java', 'cpp', 'javascript']),
  code: z.string().min(1, 'Code cannot be empty').max(30000, 'Code exceeds 30,000 character limit'),
  mode: z.enum(['batch', 'interactive']).optional().default('batch'),
  problemId: z.string().optional(),
  stdin: z.string().max(32768).optional().default(''),
  testCases: z
    .array(
      z.object({
        id: z.string(),
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().optional(),
      })
    )
    .optional(),
});

export type RunCodePayload = z.infer<typeof RunCodeSchema>;

// ── Language Configuration Map ──────────────────────────────────────────────
export interface LanguageMeta {
  id: string;
  name: string;
  version: string;
  judge0Id: number;
  filename: string;
  timeoutSec: number;
  memoryLimitKb: number;
}

export const LANGUAGE_REGISTRY: Record<string, LanguageMeta> = {
  java: {
    id: 'java',
    name: 'Java (OpenJDK)',
    version: '17.0.6 / 13.0.1',
    judge0Id: 62, // Java OpenJDK
    filename: 'Main.java',
    timeoutSec: 5,
    memoryLimitKb: 128000,
  },
  cpp: {
    id: 'cpp',
    name: 'C++ (GCC)',
    version: '14.1.0',
    judge0Id: 105, // C++ GCC
    filename: 'main.cpp',
    timeoutSec: 5,
    memoryLimitKb: 128000,
  },
  python: {
    id: 'python',
    name: 'Python 3',
    version: '3.12.5',
    judge0Id: 100, // Python 3.12
    filename: 'main.py',
    timeoutSec: 5,
    memoryLimitKb: 128000,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    version: '22.08.0',
    judge0Id: 102, // Node.js 22
    filename: 'index.js',
    timeoutSec: 5,
    memoryLimitKb: 128000,
  },
};

// ── Security Filter Guard ───────────────────────────────────────────────────
const FORBIDDEN_PATTERNS = [
  /import\s+os\s*;/i,
  /import\s+subprocess/i,
  /Runtime\.getRuntime\(\)\.exec/i,
  /ProcessBuilder\s*\(/i,
  /#include\s*<cstdlib>/i,
  /child_process/i,
  /fs\.unlink/i,
  /rm\s+-rf/i,
];

// Maximum allowed stdout/stderr size (512 KB) to prevent terminal/memory flooding
const MAX_OUTPUT_BYTES = 512 * 1024;

function truncateOutput(str: string): string {
  if (!str) return '';
  if (Buffer.byteLength(str, 'utf8') > MAX_OUTPUT_BYTES) {
    return str.slice(0, MAX_OUTPUT_BYTES) + '\n\n[OUTPUT TRUNCATED: Exceeded 512 KB limit]';
  }
  return str;
}

export function normalizeOutput(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

/**
 * Executes code using a real compiler and execution sandbox.
 * Strictly adheres to standard execution result contract and never fabricates results.
 */
export async function executeCodeInSandbox(payload: RunCodePayload): Promise<NormalizedExecutionResult> {
  const { language, code, stdin = '', testCases } = payload;
  const executionId = 'EA-RUN-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  // 1. Security Inspection
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return {
        status: 'Security Error',
        stdout: '',
        stderr: '',
        compileError: 'Security policy violation: Restricted system call or process spawning detected.',
        runtimeError: '',
        executionTimeMs: 0,
        executionId,
        passed: false,
        engine: 'Security Guard',
      };
    }
  }

  // 2. Multi-Test Submission Mode
  if (testCases && testCases.length > 0) {
    return await executeTestCases(language, code, testCases, executionId);
  }

  // 3. Single Run Mode (Custom Input / Stdin)
  return await executeSingleRun(language, code, stdin, executionId);
}

/**
 * Single Execution against Stdin
 */
async function executeSingleRun(
  language: string,
  code: string,
  stdin: string,
  executionId: string
): Promise<NormalizedExecutionResult> {
  const langConfig = LANGUAGE_REGISTRY[language] || LANGUAGE_REGISTRY.java;

  // Primary Tier: Local Docker / Piston API if configured and available
  const pistonUrl = process.env.PISTON_API_URL;
  if (pistonUrl) {
    try {
      const pistonRes = await fetch(`${pistonUrl}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: langConfig.id === 'cpp' ? 'c++' : langConfig.id,
          version: '*',
          files: [{ name: langConfig.filename, content: code }],
          stdin: stdin || '',
          run_timeout: 5000,
          compile_timeout: 10000,
        }),
        signal: AbortSignal.timeout(6000),
      });

      if (pistonRes.ok) {
        const pData = await pistonRes.json();
        return normalizePistonResult(pData, executionId);
      }
    } catch {
      // Failover to Judge0 Sandbox
    }
  }

  // Secondary Tier: Judge0 Real Compiler Engine (Free Public Instance / Custom Host)
  const judge0Url = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';
  try {
    const startTime = Date.now();
    const judge0Res = await fetch(`${judge0Url}/submissions?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: langConfig.judge0Id,
        source_code: code,
        stdin: stdin || '',
        cpu_time_limit: langConfig.timeoutSec,
        memory_limit: langConfig.memoryLimitKb,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (judge0Res.ok) {
      const jData = await judge0Res.json();
      return normalizeJudge0Result(jData, executionId, startTime);
    }
  } catch (err: any) {
    // Sandbox unavailable
  }

  // Fail safely with controlled error if isolated sandbox is unavailable (No host execution)
  return {
    status: 'Execution Error',
    stdout: '',
    stderr: 'Isolated execution sandbox is temporarily offline. Code execution on the host system is disabled for security.',
    compileError: '',
    runtimeError: 'Sandbox Unavailable: Isolated execution container could not be reached.',
    executionTimeMs: 0,
    executionId,
    passed: false,
    engine: 'Sandbox Guard',
  };
}

/**
 * Execute multiple test cases (Submit Mode)
 */
async function executeTestCases(
  language: string,
  code: string,
  testCases: Array<{ id: string; input: string; expectedOutput: string; isHidden?: boolean }>,
  executionId: string
): Promise<NormalizedExecutionResult> {
  const results: TestCaseResult[] = [];
  let totalTimeMs = 0;
  let overallStatus: ExecutionStatus = 'Accepted';
  let firstCompileError = '';
  let firstRuntimeError = '';

  for (const tc of testCases) {
    const res = await executeSingleRun(language, code, tc.input, executionId);
    totalTimeMs += res.executionTimeMs;

    if (res.status === 'Compilation Error') {
      firstCompileError = res.compileError;
      overallStatus = 'Compilation Error';
      break;
    }

    const actualNormalized = normalizeOutput(res.stdout);
    const expectedNormalized = normalizeOutput(tc.expectedOutput);
    const passed = actualNormalized === expectedNormalized && res.status === 'Accepted';

    let tcStatus: ExecutionStatus = res.status;
    if (res.status === 'Accepted' && !passed) {
      tcStatus = 'Wrong Answer';
      if (overallStatus === 'Accepted') overallStatus = 'Wrong Answer';
    } else if (res.status !== 'Accepted') {
      if (overallStatus === 'Accepted' || overallStatus === 'Wrong Answer') {
        overallStatus = res.status;
      }
      if (!firstRuntimeError && res.runtimeError) {
        firstRuntimeError = res.runtimeError;
      }
    }

    results.push({
      id: tc.id,
      input: tc.isHidden ? '[HIDDEN TEST CASE]' : tc.input,
      expectedOutput: tc.isHidden ? '[HIDDEN EXPECTED OUTPUT]' : tc.expectedOutput,
      actualOutput: tc.isHidden ? (passed ? '[CORRECT]' : '[INCORRECT OUTPUT]') : res.stdout,
      status: tcStatus,
      passed,
      executionTimeMs: res.executionTimeMs,
      isHidden: tc.isHidden,
    });
  }

  const passedTests = results.filter((r) => r.passed).length;
  const isAccepted = overallStatus === 'Accepted' && passedTests === testCases.length;

  return {
    status: isAccepted ? 'Accepted' : overallStatus,
    stdout: isAccepted
      ? `All ${testCases.length} Test Cases Passed Successfully!`
      : `${passedTests} / ${testCases.length} Test Cases Passed.`,
    stderr: firstRuntimeError,
    compileError: firstCompileError,
    runtimeError: firstRuntimeError,
    executionTimeMs: totalTimeMs,
    executionId,
    passed: isAccepted,
    engine: 'Real OpenJDK/GCC Test Sandbox',
    testCaseResults: results,
    totalTests: testCases.length,
    passedTests,
  };
}

/**
 * Normalizes Judge0 Result to Canonical Result Contract
 */
function normalizeJudge0Result(jData: any, executionId: string, startTime: number): NormalizedExecutionResult {
  const statusId = jData.status?.id ?? 0;
  const statusDesc = jData.status?.description ?? 'Unknown';

  const stdout = truncateOutput(jData.stdout || '');
  const stderr = truncateOutput(jData.stderr || '');
  const compileOutput = truncateOutput(jData.compile_output || '');
  const executionTimeMs = jData.time ? Math.round(parseFloat(jData.time) * 1000) : Date.now() - startTime;
  const memoryKb = jData.memory ?? undefined;

  let status: ExecutionStatus = 'Accepted';
  let compileError = '';
  let runtimeError = '';

  if (statusId === 3) {
    // 3 = Accepted
    status = 'Accepted';
  } else if (statusId === 6) {
    // 6 = Compilation Error
    status = 'Compilation Error';
    compileError = compileOutput || stderr || 'Compilation Error';
  } else if (statusId === 5) {
    // 5 = Time Limit Exceeded
    status = 'Time Limit Exceeded';
    runtimeError = 'Time Limit Exceeded: Process execution took longer than the configured CPU limit.';
  } else if (statusId === 13 || statusId === 14) {
    // Memory Limit Exceeded
    status = 'Memory Limit Exceeded';
    runtimeError = 'Memory Limit Exceeded: Process exceeded memory quota.';
  } else if (statusId >= 7 && statusId <= 12) {
    // Runtime Error (SIGSEGV, SIGFPE, NZEC, etc.)
    status = 'Runtime Error';
    runtimeError = stderr || statusDesc;
  } else if (statusId === 4) {
    status = 'Wrong Answer';
  } else {
    status = compileOutput ? 'Compilation Error' : (stderr ? 'Runtime Error' : 'Execution Error');
    if (compileOutput) compileError = compileOutput;
    if (stderr) runtimeError = stderr;
  }

  return {
    status,
    stdout,
    stderr,
    compileError,
    runtimeError,
    executionTimeMs,
    memoryKb,
    exitCode: jData.exit_code ?? (status === 'Accepted' ? 0 : 1),
    signal: jData.exit_signal ? String(jData.exit_signal) : undefined,
    executionId,
    passed: status === 'Accepted',
    engine: 'Real OpenJDK/GCC Sandbox',
  };
}

/**
 * Normalizes Piston Result to Canonical Result Contract
 */
function normalizePistonResult(pData: any, executionId: string): NormalizedExecutionResult {
  const run = pData.run ?? {};
  const compile = pData.compile ?? {};

  const compileError = truncateOutput(compile.stderr || '');
  const stdout = truncateOutput(run.stdout || '');
  const stderr = truncateOutput(run.stderr || '');
  const exitCode = run.code ?? (compileError ? 1 : 0);
  const executionTimeMs = run.time ?? 25;

  let status: ExecutionStatus = 'Accepted';
  let runtimeError = '';

  if (compileError) {
    status = 'Compilation Error';
  } else if (run.signal === 'SIGKILL' || run.signal === 'SIGTERM') {
    status = 'Time Limit Exceeded';
    runtimeError = 'Time Limit Exceeded: Process terminated by watchdog.';
  } else if (exitCode !== 0 || stderr) {
    status = 'Runtime Error';
    runtimeError = stderr || `Process exited with non-zero exit code ${exitCode}`;
  }

  return {
    status,
    stdout,
    stderr,
    compileError,
    runtimeError,
    executionTimeMs,
    memoryKb: run.memory ? Math.round(run.memory / 1024) : undefined,
    exitCode,
    signal: run.signal,
    executionId,
    passed: status === 'Accepted',
    engine: 'Docker / Piston Container',
  };
}

// Host execution fallback is permanently disabled for security.
