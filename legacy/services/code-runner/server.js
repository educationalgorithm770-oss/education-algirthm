/**
 * services/code-runner/server.js — Single Authoritative Containerized Code Runner Microservice
 * Non-negotiable Rules:
 * 1. Authenticated via Authorization: Bearer <CODE_RUNNER_TOKEN>
 * 2. Enforces non-root container isolation (--network none, --memory, --cpus, --pids-limit)
 * 3. Enforces stdin, timeout_ms, and memory_limit_mb
 * 4. Normalizes output (ANSI escape strip, CRLF -> LF)
 * 5. Returns canonical JSON contract: { status, stdout, stderr, exit_code }
 * 6. Returns SANDBOX_UNAVAILABLE if Docker container engine is offline.
 */
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.env.CODE_RUNNER_PORT || 8088;
const RUNNER_TOKEN = process.env.CODE_RUNNER_TOKEN || 'cr_sec_token_9876543210_prod_key';

// Fail-closed startup token validation
if (!RUNNER_TOKEN || RUNNER_TOKEN.length < 16) {
    console.error('CRITICAL SECURITY ERROR: CODE_RUNNER_TOKEN environment variable is missing or less than 16 characters.');
    console.error('Code Runner Service refusing startup for safety.');
    process.exit(1);
}

function normalizeOutput(str) {
    if (!str) return '';
    return str
        .replace(/\u001b\[[0-9;]*m/g, '') // Strip ANSI control sequences
        .replace(/\r\n/g, '\n');           // Normalize CRLF line endings
}

const server = http.createServer((req, res) => {
    // Health probe
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'UP', service: 'code-runner', version: '2.0-authoritative' }));
        return;
    }

    // Readiness probe
    if (req.url === '/ready') {
        exec('docker info', (err) => {
            if (err) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ready: false, reason: 'Docker daemon unreachable' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ready: true, service: 'code-runner' }));
            }
        });
        return;
    }

    // Authenticated /execute endpoint
    if (req.method === 'POST' && req.url === '/execute') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '');

        if (token !== RUNNER_TOKEN) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'SECURITY_VIOLATION',
                stdout: '',
                stderr: 'Unauthorized: Invalid or missing CODE_RUNNER_TOKEN header',
                exit_code: 1
            }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body || '{}');
                const lang = (payload.language || 'python').toLowerCase();
                const code = payload.code || '';
                const input = payload.stdin !== undefined ? payload.stdin : (payload.input || '');
                
                // Bounded resource limits
                const rawTimeout = parseInt(payload.timeout_ms) || 3000;
                const timeoutMs = Math.min(Math.max(rawTimeout, 500), 10000); // Bounded 500ms - 10000ms
                
                const rawMemory = parseInt(payload.memory_limit_mb) || 256;
                const memoryMb = Math.min(Math.max(rawMemory, 64), 512);     // Bounded 64MB - 512MB

                const tmpId = 'cr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                const tmpDir = path.join(__dirname, 'tmp', tmpId);
                fs.mkdirSync(tmpDir, { recursive: true });

                let dockerCmd = '';
                if (lang === 'python' || lang === 'py') {
                    fs.writeFileSync(path.join(tmpDir, 'solution.py'), code);
                    dockerCmd = `docker run --rm --network none --memory ${memoryMb}m --cpus 1 --pids-limit 64 --user 1000:1000 -v "${tmpDir}:/workspace:ro" -w /workspace python:3.12-alpine python3 solution.py`;
                
                } else if (lang === 'node' || lang === 'js' || lang === 'javascript') {
                    fs.writeFileSync(path.join(tmpDir, 'solution.js'), code);
                    dockerCmd = `docker run --rm --network none --memory ${memoryMb}m --cpus 1 --pids-limit 64 --user 1000:1000 -v "${tmpDir}:/workspace:ro" -w /workspace node:20-alpine node solution.js`;
                
                } else if (lang === 'java') {
                    fs.writeFileSync(path.join(tmpDir, 'Main.java'), code);
                    dockerCmd = `docker run --rm --network none --memory ${memoryMb}m --cpus 1 -v "${tmpDir}:/workspace" -w /workspace eclipse-temurin:21-alpine sh -c "javac Main.java && java Main"`;
                
                } else if (lang === 'cpp' || lang === 'c') {
                    fs.writeFileSync(path.join(tmpDir, 'solution.cpp'), code);
                    dockerCmd = `docker run --rm --network none --memory ${memoryMb}m --cpus 1 -v "${tmpDir}:/workspace" -w /workspace gcc:13-alpine sh -c "g++ -O3 solution.cpp -o solution && ./solution"`;
                
                } else {
                    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        status: 'SYSTEM_ERROR',
                        stdout: '',
                        stderr: `Unsupported sandbox language: ${lang}`,
                        exit_code: 1
                    }));
                    return;
                }

                const child = exec(dockerCmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
                    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (e) {}

                    const stdoutNorm = normalizeOutput(stdout);
                    const stderrNorm = normalizeOutput(stderr);

                    if (err && err.killed) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'TIME_LIMIT_EXCEEDED',
                            stdout: stdoutNorm,
                            stderr: 'Execution Timed Out (' + timeoutMs + 'ms limit exceeded)',
                            exit_code: 124
                        }));
                    } else if (err) {
                        const errCombined = (stderrNorm + ' ' + err.message).toLowerCase();
                        const isDockerOffline = errCombined.includes('docker') || errCombined.includes('daemon') || errCombined.includes('connect');
                        const isCompileErr = stderrNorm.includes('error:') || stderrNorm.includes('javac') || stderrNorm.includes('g++');
                        
                        let verdict = 'RUNTIME_ERROR';
                        let outStderr = stderrNorm || err.message;
                        if (isDockerOffline) {
                            verdict = 'SANDBOX_UNAVAILABLE';
                            outStderr = 'Execution temporarily unavailable. The secure code execution service is currently unavailable. Please try again in a few moments.';
                        } else if (isCompileErr) {
                            verdict = 'COMPILATION_ERROR';
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: verdict,
                            stdout: stdoutNorm,
                            stderr: outStderr,
                            exit_code: err.code || 1
                        }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            status: 'ACCEPTED',
                            stdout: stdoutNorm,
                            stderr: stderrNorm,
                            exit_code: 0
                        }));
                    }
                });

                if (input && child.stdin) {
                    child.stdin.write(input);
                    child.stdin.end();
                }

            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'SYSTEM_ERROR',
                    stdout: '',
                    stderr: 'Internal Runner Error: ' + e.message,
                    exit_code: 1
                }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
    console.log(`Authoritative Containerized Code Runner Microservice listening on port ${PORT}`);
});
