import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Engine, EngineResult } from '../types.js';
import type { EngineAdapter } from './index.js';

const execFileAsync = promisify(execFile);

const TIMEOUT_MS = 60_000;

export class KiroEngine implements EngineAdapter {
  name: Engine = 'kiro';

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync('which', ['kiro-cli']);
      return true;
    } catch {
      return false;
    }
  }

  async execute(prompt: string): Promise<EngineResult> {
    try {
      const { stdout } = await execFileAsync(
        'kiro-cli',
        ['chat', '--no-interactive', '--trust-tools=none', prompt],
        {
          timeout: TIMEOUT_MS,
          maxBuffer: 1024 * 1024, // 1MB
          env: { ...process.env },
        }
      );

      // kiro-cli may include extra output (credits info, etc.)
      // Extract the actual response content
      const output = this.extractResponse(stdout);

      return {
        output: output.trim(),
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
