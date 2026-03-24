import { spawn } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';

const maxAttempts = Number(process.env.BUILD_MAX_ATTEMPTS || 3);
const retryDelayMs = Number(process.env.BUILD_RETRY_DELAY_MS || 1500);

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const nextDir = path.join(process.cwd(), '.next');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanNextArtifacts() {
  await rm(nextDir, { recursive: true, force: true });
}

function runNextBuild() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [nextBin, 'build'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let combinedOutput = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      combinedOutput += text;
      process.stderr.write(text);
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, output: combinedOutput });
    });
  });
}

let lastCode = 1;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  if (attempt > 1) {
    console.warn(`\nRetrying build (${attempt}/${maxAttempts}) after file-lock cleanup...`);
    await cleanNextArtifacts();
    await wait(retryDelayMs);
  }

  const result = await runNextBuild();
  lastCode = result.code;

  if (result.code === 0) {
    process.exit(0);
  }

  const hasBusyLock = /EBUSY|resource busy or locked/i.test(result.output);
  if (!hasBusyLock) {
    process.exit(result.code);
  }
}

process.exit(lastCode);
