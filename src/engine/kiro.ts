import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';
import type { Engine, EngineResult } from '../types.js';
import type { EngineAdapter } from './index.js';

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 60_000;

export class KiroEngine implements EngineAdapter {
  name: Engine = 'kiro';

  async isAvailable(): Promise<boolean> {
    try {
      const cmd = platform() === 'win32' ? 'where' : 'which';
      await execFileAsync(cmd, ['kiro-cli']);
      return true;
    } catch {
      return false;
    }
  }

  async execute(prompt: string): Promise<EngineResult> {
    return new Promise((resolve, reject) => {
      // Pass prompt via stdin to avoid:
      // 1. Exposing input text in process list
      // 2. Hitting OS argument length limits on long prompts
      const child = spawn(
        'kiro-cli',
        ['chat', '--no-interactive', '--trust-tools=none'],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env },
        }
      );

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Write prompt to stdin and close
      child.stdin.write(prompt);
      child.stdin.end();

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('エンジンの応答がタイムアウトしました（60秒）'));
      }, TIMEOUT_MS);

      child.on('close', (code) => {
        clearTimeout(timeout);
        const output = this.extractResponse(stdout);
        if (code === 0) {
          resolve({ output: output.trim(), exitCode: 0 });
        } else {
          resolve({ output: stderr || output, exitCode: code ?? 1 });
        }
      });

      child.on('error', (err) => {
        clearTimeout(timeout);
        resolve({ output: err.message, exitCode: 1 });
      });
    });
  }

  private extractResponse(stdout: string): string {
    // kiro-cli output may contain metadata lines (e.g., "▸ Credits: ...")
    // Filter out lines that start with known metadata prefixes
    const lines = stdout.split('\n');
    const filteredLines = lines.filter((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('▸ Credits:')) return false;
      if (trimmed.startsWith('✓')) return false;
      if (trimmed.startsWith('All tools are now trusted')) return false;
      return true;
    });

    // Remove leading "> " prefix from response lines (kiro-cli format)
    const cleaned = filteredLines.map((line) => {
      if (line.startsWith('> ')) return line.slice(2);
      return line;
    });

    return cleaned.join('\n').trim();
  }
}
