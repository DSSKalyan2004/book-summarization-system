import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');
const backendDir = path.resolve(frontendDir, '..', 'backend');
const healthUrl = process.env.DEV_BACKEND_HEALTH_URL || 'http://127.0.0.1:8000/api/health';
const pythonPath = path.join(backendDir, '.venv', 'Scripts', 'python.exe');
const frontendCommand = process.platform === 'win32'
  ? { command: 'cmd.exe', args: ['/d', '/s', '/c', 'npm run dev:frontend'] }
  : { command: 'npm', args: ['run', 'dev:frontend'] };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function waitForBackend(timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl, { method: 'GET' });
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.log(`[dev] Backend reachable at ${healthUrl} (${payload.database ?? 'unknown'})`);
        return true;
      }
    } catch {
      // Backend still starting.
    }

    await sleep(200);
  }

  return false;
}

const backendCommand = await exists(pythonPath)
  ? { command: pythonPath, args: ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'] }
  : { command: 'python', args: ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'] };

console.log('[dev] Starting backend...');
const backend = spawn(backendCommand.command, backendCommand.args, {
  cwd: backendDir,
  stdio: 'inherit',
  shell: false,
});

backend.on('exit', (code, signal) => {
  if (signal) {
    console.log(`[dev] Backend stopped by signal ${signal}`);
  } else if (code !== 0) {
    console.error(`[dev] Backend exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

const ready = await waitForBackend();
if (!ready) {
  console.warn('[dev] Backend health endpoint did not become reachable within 30s. Starting frontend anyway.');
}

console.log('[dev] Starting frontend...');
const frontend = spawn(frontendCommand.command, frontendCommand.args, {
  cwd: frontendDir,
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

frontend.on('exit', (code, signal) => {
  if (signal) {
    console.log(`[dev] Frontend stopped by signal ${signal}`);
  } else if (code !== 0) {
    console.error(`[dev] Frontend exited with code ${code}`);
  }

  if (!backend.killed) {
    backend.kill('SIGTERM');
  }

  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!frontend.killed) {
      frontend.kill('SIGTERM');
    }
    if (!backend.killed) {
      backend.kill('SIGTERM');
    }
  });
}