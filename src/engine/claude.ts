import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { platform } from 'node:os';
import type { Engine, EngineResult } from '../types.js';
import type { EngineAdapter } from './index.js';

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 60_000;

export class ClaudeEngine implements EngineAdapter {
  name: Engine = 'claude';

  async isAvailable(): Promise<boolean> {
    try {
      const cmd = platform() === 'win32' ? 'where' : 'which';
      await execFileAsync(cmd, ['claude']);
      return true;
    } catch {
      return false;
    }
  }

  async execute(prompt: string): Promise<EngineResult> {
    try {
      const { stdout } = await execFileAsync(
        'claude',
        ['-p', prompt, '--output-format', 'text'],
        {
          timeout: TIMEOUT_MS,
          maxBuffer: 1024 * 1024, // 1MB
          env: { ...process.env },
        }
      );

      return {
        output: stdout.trim(),
        exitCode: 0,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'killed' in error && error.killed) {
        throw new Error('エンジンの応答がタイムアウトしました（60秒）');
      }

      const stderr =
        error && typeof error === 'object' && 'stderr' in error
          ? String((error as { stderr: unknown }).stderr)
          : '';
      const code =
        error && typeof error === 'object' && 'code' in error
          ? Number((error as { code: unknown }).code)
          : 1;

      return {
        output: stderr,
        exitCode: code,
      };
    }
  }
}
