import type { BuiltinFormat } from '../types.js';

const FORMAT_INSTRUCTIONS: Record<BuiltinFormat, string> = {
  email: `メール形式で出力してください。
以下の構造に従ってください：
1. 挨拶（「お疲れ様です。」など）
2. 本文（変換された内容）
3. 締め（「よろしくお願いいたします。」など）
件名は不要です。署名も不要です。`,

  slack: `Slack メッセージ向けに出力してください。
以下のルールに従ってください：
- 簡潔に1〜3文でまとめる
- 適度に絵文字を使ってもよい（使いすぎない）
- カジュアルすぎず、でも堅すぎない
- 改行は最小限に`,

  document: `文書形式で出力してください。
以下のルールに従ってください：
- 正式で構造的な文章にする
- 必要に応じて箇条書きを使用してもよい
- 論理的な構成を心がける
- 冗長にならず、簡潔かつ正確に`,
};

export function getFormatInstruction(format: BuiltinFormat): string {
  return FORMAT_INSTRUCTIONS[format];
}
