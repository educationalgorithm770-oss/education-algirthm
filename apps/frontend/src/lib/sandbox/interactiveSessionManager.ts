import { spawn, ChildProcess, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { promisify } from 'util';
import { ExecutionStatus, LANGUAGE_REGISTRY } from './dockerRunner';

const execAsync = promisify(exec);

// Extra binary paths for Windows/Host compiler auto-detection
const EXTRA_PATHS = [
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
  const existingExtras = EXTRA_PATHS.filter((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  return [...existingExtras, currentPath].join(path.delimiter);
}

export interface InteractiveEvent {
  type: 'execution_started' | 'stdout' | 'stderr' | 'stdin_ack' | 'execution_finished' | 'execution_stopped' | 'error';
  executionId: string;
  data?: string;
  status?: ExecutionStatus | 'RUNNING' | 'Execution Stopped';
  exitCode?: number | null;
  executionTimeMs?: number;
}

export interface InteractiveSession {
  executionId: string;
  ownerId: string;
  language: string;
  childProcess: ChildProcess | null;
  tempDir: string;
  createdAt: number;
  lastActivityAt: number;
  status: 'RUNNING' | 'FINISHED' | 'STOPPED' | 'TIMEOUT';
  listeners: Array<(event: InteractiveEvent) => void>;
  bufferedEvents: InteractiveEvent[];
  timeoutTimer: NodeJS.Timeout;
  startTime: number;
}

declare global {
  var __ea_interactive_sessions: Map<string, InteractiveSession> | undefined;
}

if (!global.__ea_interactive_sessions) {
  global.__ea_interactive_sessions = new Map<string, InteractiveSession>();
}

const sessions: Map<string, InteractiveSession> = global.__ea_interactive_sessions;
const MAX_CONCURRENT_SESSIONS = 50;
const MAX_SESSION_LIFETIME_MS = 5 * 60 * 1000;

export class InteractiveSessionManager {
  static getSession(executionId: string): InteractiveSession | undefined {
    return sessions.get(executionId);
  }

  static async startSession(
    language: string,
    code: string,
    ownerId: string = 'system'
  ): Promise<{ executionId: string; compileError?: string }> {
    if (sessions.size >= MAX_CONCURRENT_SESSIONS) {
      this.cleanupStaleSessions();
      if (sessions.size >= MAX_CONCURRENT_SESSIONS) {
        throw new Error('Server interactive capacity reached. Please try again in a few moments.');
      }
    }

    const executionId = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();

    // 1. Security Inspection
    const FORBIDDEN_SESSION_PATTERNS = [
      /import\s+os/i,
      /import\s+subprocess/i,
      /Runtime\.getRuntime\(\)/i,
      /ProcessBuilder/i,
      /#include\s*<cstdlib>/i,
      /child_process/i,
      /fs\.unlink/i,
      /rm\s+-rf/i,
    ];
    for (const pattern of FORBIDDEN_SESSION_PATTERNS) {
      if (pattern.test(code)) {
        return {
          executionId,
          compileError: 'Security violation: Execution of system commands, process spawning, or OS manipulation is disabled.',
        };
      }
    }

    const tempDir = path.join(os.tmpdir(), 'ea_pty_' + executionId);
    await fs.promises.mkdir(tempDir, { recursive: true });

    const langConfig = LANGUAGE_REGISTRY[language] || LANGUAGE_REGISTRY.java;
    const filePath = path.join(tempDir, langConfig.filename);
    await fs.promises.writeFile(filePath, code, 'utf8');

    const envPath = getEnhancedPath();
    const minimalEnv: NodeJS.ProcessEnv = {
      PATH: envPath,
      SYSTEMROOT: process.env.SYSTEMROOT || '',
      TEMP: tempDir,
      TMP: tempDir,
      PYTHONUNBUFFERED: '1',
      JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8',
      NODE_OPTIONS: '--max-old-space-size=128',
      NODE_ENV: (process.env.NODE_ENV as any) || 'production',
    };

    // Compilation step for compiled languages (Java, C++)
    if (language === 'java') {
      try {
        await execAsync(`javac -encoding UTF-8 "${filePath}"`, {
          cwd: tempDir,
          timeout: 10000,
          env: minimalEnv,
        });
      } catch (err: any) {
        const compileStderr = err.stderr || err.stdout || err.message;
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        return { executionId, compileError: compileStderr };
      }
    } else if (language === 'cpp') {
      try {
        const cppCompiler = fs.existsSync('C:\\Program Files\\LLVM\\bin\\clang++.exe') ? 'clang++' : 'g++';
        await execAsync(`${cppCompiler} -O2 -std=c++20 "${filePath}" -o main`, {
          cwd: tempDir,
          timeout: 10000,
          env: minimalEnv,
        });
      } catch (err: any) {
        const compileStderr = err.stderr || err.stdout || err.message;
        await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        return { executionId, compileError: compileStderr };
      }
    }

    let cmd = 'node';
    let args: string[] = [filePath];

    if (language === 'java') {
      cmd = 'java';
      args = ['-Dfile.encoding=UTF-8', 'Main'];
    } else if (language === 'cpp') {
      cmd = process.platform === 'win32' ? path.join(tempDir, 'main.exe') : './main';
      args = [];
    } else if (language === 'python') {
      cmd = 'python';
      args = ['-u', filePath];
    } else if (language === 'javascript') {
      cmd = 'node';
      args = [filePath];
    }

    const startTime = Date.now();
    let child: ChildProcess | null = null;

    try {
      child = spawn(cmd, args, {
        cwd: tempDir,
        env: minimalEnv,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (spawnErr: any) {
      await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      return { executionId, compileError: 'Failed to spawn process: ' + spawnErr.message };
    }

    const session: InteractiveSession = {
      executionId,
      ownerId,
      language,
      childProcess: child,
      tempDir,
      createdAt: startTime,
      lastActivityAt: startTime,
      status: 'RUNNING',
      listeners: [],
      bufferedEvents: [],
      startTime,
      timeoutTimer: setTimeout(() => {
        InteractiveSessionManager.handleSessionTimeout(executionId);
      }, MAX_SESSION_LIFETIME_MS),
    };

    sessions.set(executionId, session);

    this.broadcastEvent(session, {
      type: 'execution_started',
      executionId,
      status: 'RUNNING',
    });

    child.stdout?.on('data', (chunk: Buffer) => {
      session.lastActivityAt = Date.now();
      const text = chunk.toString('utf8');
      this.broadcastEvent(session, {
        type: 'stdout',
        executionId,
        data: text,
      });
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      session.lastActivityAt = Date.now();
      const text = chunk.toString('utf8');
      this.broadcastEvent(session, {
        type: 'stderr',
        executionId,
        data: text,
      });
    });

    child.on('close', (exitCode, signal) => {
      clearTimeout(session.timeoutTimer);
      const executionTimeMs = Date.now() - session.startTime;
      session.status = 'FINISHED';

      this.broadcastEvent(session, {
        type: 'execution_finished',
        executionId,
        status: exitCode === 0 ? 'Accepted' : 'Runtime Error',
        exitCode: exitCode ?? (signal ? 130 : 0),
        executionTimeMs,
      });

      setTimeout(() => {
        InteractiveSessionManager.cleanupSession(executionId);
      }, 5000);
    });

    child.on('error', (err) => {
      clearTimeout(session.timeoutTimer);
      session.status = 'FINISHED';
      this.broadcastEvent(session, {
        type: 'error',
        executionId,
        data: err.message,
        status: 'Execution Error',
      });
      setTimeout(() => {
        InteractiveSessionManager.cleanupSession(executionId);
      }, 5000);
    });

    return { executionId };
  }

  static validateSessionOwner(executionId: string, userId?: string | null): boolean {
    const session = sessions.get(executionId);
    if (!session) return false;
    if (!session.ownerId || session.ownerId === 'system') return true;
    return Boolean(userId && String(session.ownerId) === String(userId));
  }

  static writeStdin(executionId: string, input: string, userId?: string | null): boolean {
    const session = sessions.get(executionId);
    if (!session || !session.childProcess || session.status !== 'RUNNING') {
      return false;
    }

    if (userId && session.ownerId && session.ownerId !== 'system' && String(session.ownerId) !== String(userId)) {
      return false;
    }

    try {
      session.lastActivityAt = Date.now();
      // Remove any trailing \r or \n to avoid sending blank lines/carriage returns into the process
      const cleanInput = input.replace(/[\r\n]+$/, '');
      const normalizedInput = cleanInput + '\n';
      session.childProcess.stdin?.write(normalizedInput, 'utf8');

      this.broadcastEvent(session, {
        type: 'stdin_ack',
        executionId,
        data: normalizedInput,
      });

      return true;
    } catch {
      return false;
    }
  }

  static stopSession(executionId: string, userId?: string | null): boolean {
    const session = sessions.get(executionId);
    if (!session) return false;

    if (userId && session.ownerId && session.ownerId !== 'system' && String(session.ownerId) !== String(userId)) {
      return false;
    }

    clearTimeout(session.timeoutTimer);
    session.status = 'STOPPED';

    if (session.childProcess) {
      try {
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${session.childProcess.pid} /T /F`, () => {});
        } else {
          session.childProcess.kill('SIGKILL');
        }
      } catch {}
    }

    this.broadcastEvent(session, {
      type: 'execution_stopped',
      executionId,
      status: 'Execution Stopped',
      data: '^C\nProcess terminated by user (SIGINT).',
    });

    setTimeout(() => {
      InteractiveSessionManager.cleanupSession(executionId);
    }, 2000);

    return true;
  }

  private static handleSessionTimeout(executionId: string) {
    const session = sessions.get(executionId);
    if (!session) return;

    session.status = 'TIMEOUT';
    if (session.childProcess) {
      try {
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${session.childProcess.pid} /T /F`, () => {});
        } else {
          session.childProcess.kill('SIGKILL');
        }
      } catch {}
    }

    this.broadcastEvent(session, {
      type: 'execution_finished',
      executionId,
      status: 'Time Limit Exceeded',
      data: '\nTime Limit Exceeded: Interactive session reached the 5-minute maximum lifetime.',
      exitCode: 124,
    });

    setTimeout(() => {
      InteractiveSessionManager.cleanupSession(executionId);
    }, 2000);
  }

  private static broadcastEvent(session: InteractiveSession, event: InteractiveEvent) {
    session.bufferedEvents.push(event);
    if (session.bufferedEvents.length > 500) {
      session.bufferedEvents.shift();
    }

    for (const listener of session.listeners) {
      try {
        listener(event);
      } catch {}
    }
  }

  static subscribe(executionId: string, listener: (event: InteractiveEvent) => void): () => void {
    const session = sessions.get(executionId);
    if (!session) {
      throw new Error(`Session ${executionId} not found or expired.`);
    }

    for (const pastEvent of session.bufferedEvents) {
      try {
        listener(pastEvent);
      } catch {}
    }

    session.listeners.push(listener);

    return () => {
      const idx = session.listeners.indexOf(listener);
      if (idx !== -1) {
        session.listeners.splice(idx, 1);
      }
    };
  }

  static cleanupSession(executionId: string) {
    const session = sessions.get(executionId);
    if (!session) return;

    clearTimeout(session.timeoutTimer);
    session.listeners = [];
    sessions.delete(executionId);

    fs.promises.rm(session.tempDir, { recursive: true, force: true }).catch(() => {});
  }

  private static cleanupStaleSessions() {
    const now = Date.now();
    for (const [id, session] of Array.from(sessions.entries())) {
      if (now - session.lastActivityAt > MAX_SESSION_LIFETIME_MS || session.status !== 'RUNNING') {
        this.cleanupSession(id);
      }
    }
  }
}
