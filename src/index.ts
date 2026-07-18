#!/usr/bin/env node

import { Command } from 'commander';
import { buildPrompt } from './prompt/index.js';
import { resolveOptions } from './config/index.js';
import { getEngine } from './engine/index.js';
import {
  isLevel,
  isEngine,
  LEVELS,
  ENGINES,
  type Engine,
  type Level,
} from './types.js';

const program = new Command();

program
  .name('text-polisher')
  .description('適当な日本語を丁寧な文章に変換するCLIツール')
  .version('0.1.0')
  .argument('[text]', '変換するテキスト')
  .option('--level <level>', `丁寧さレベル (${LEVELS.join('|')})`, 'formal')
  .option('--format <format>', '出力フォーマット (email|slack|document|カスタム名)')
  .option('--engine <engine>', `AIエンジン (${ENGINES.join('|')})`)
  .action(async (text: string | undefined, opts: { level: string; format?: string; engine?: string }) => {
    try {
      // Resolve input text (argument or stdin pipe)
      const inputText = await resolveInputText(text);

      // Validate level
      if (!isLevel(opts.level)) {
        console.error(
          `Error: --level は ${LEVELS.join(', ')} のいずれかを指定してください`
        );
        process.exit(1);
      }

      // Resolve engine
      const engineName = resolveEngineName(opts.engine);

      // Validate engine
      if (!isEngine(engineName)) {
        console.error(
          `Error: --engine は ${ENGINES.join(', ')} のいずれかを指定してください`
        );
        process.exit(1);
      }

      // Resolve options (including custom format lookup)
      const resolved = resolveOptions({
        text: inputText,
        level: opts.level as Level,
        format: opts.format,
        engine: engineName as Engine,
      });

      // Check engine availability
      const engine = getEngine(resolved.engine);
      const available = await engine.isAvailable();
      if (!available) {
        printEngineNotFound(resolved.engine);
        process.exit(1);
      }

      // Build prompt
      const prompt = buildPrompt(resolved);

      // Execute engine
      const result = await engine.execute(prompt);

      if (result.exitCode !== 0) {
        console.error(`Error: エンジンの実行に失敗しました: ${result.output}`);
        process.exit(1);
      }

      // Output result
      console.log(result.output);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parseAsync();

// --- Helper functions ---

async function resolveInputText(argText: string | undefined): Promise<string> {
  // If text provided as argument, use it
  if (argText && argText.trim()) {
    return argText.trim();
  }

  // Try reading from stdin (pipe)
  const stdinText = await readStdin();
  if (stdinText && stdinText.trim()) {
    return stdinText.trim();
  }

  throw new Error('テキストを入力してください');
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    // If stdin is a TTY (no pipe), resolve immediately with empty string
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    let data = '';
    let receivedData = false;

    // Timeout only fires if no data arrives at all (e.g., fd open but no writer)
    const timeout = setTimeout(() => {
      if (!receivedData) {
        cleanup();
        resolve('');
      }
    }, 2000);

    const onData = (chunk: string) => {
      receivedData = true;
      clearTimeout(timeout);
      data += chunk;
    };

    const onEnd = () => {
      cleanup();
      resolve(data);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
    };

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
  });
}

function resolveEngineName(optEngine?: string): string {
  if (optEngine) return optEngine;
  return process.env.TEXT_POLISHER_ENGINE || 'claude';
}

function printEngineNotFound(engine: Engine): void {
  const installGuides: Record<Engine, string> = {
    claude: `Error: claude コマンドが見つかりません。

Claude Code をインストールしてください:
  npm install -g @anthropic-ai/claude-code

詳細: https://docs.claude.com/en/docs/claude-code`,

    kiro: `Error: kiro-cli コマンドが見つかりません。

Kiro CLI をインストールしてください:
  npm install -g @anthropic-ai/kiro-cli

認証設定:
  export KIRO_API_KEY=ksk_your_api_key

詳細: https://kiro.dev/docs/cli/`,
  };

  console.error(installGuides[engine]);
}
