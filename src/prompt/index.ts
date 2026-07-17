import type { ResolvedOptions } from '../types.js';
import { getLevelInstruction } from './levels.js';
import { getFormatInstruction } from './formats.js';

export function buildPrompt(options: ResolvedOptions): string {
  const parts: string[] = [];

  // Base instruction
  parts.push(`以下のルールに従って、入力テキストを変換してください。
変換後のテキストのみを出力してください。説明や注釈は一切不要です。
マークダウン記法も使わないでください。プレーンテキストで出力してください。`);

  // Level instruction
  parts.push(`## 丁寧さレベル: ${options.level}
${getLevelInstruction(options.level)}`);

  // Builtin format instruction
  if (options.builtinFormat) {
    parts.push(`## フォーマット: ${options.builtinFormat}
${getFormatInstruction(options.builtinFormat)}`);
  }

  // Custom format (prefix/suffix)
  if (options.customFormat) {
    const customParts: string[] = ['## カスタム定型文'];
    if (options.customFormat.prefix) {
      customParts.push(`- 文頭に必ず以下を挿入してください: 「${options.customFormat.prefix}」`);
    }
    if (options.customFormat.suffix) {
      customParts.push(`- 文末に必ず以下を挿入してください: 「${options.customFormat.suffix}」`);
    }
    parts.push(customParts.join('\n'));
  }

  // Input text
  parts.push(`## 入力テキスト
${options.text}`);

  return parts.join('\n\n');
}

export { getLevelInstruction } from './levels.js';
export { getFormatInstruction } from './formats.js';
