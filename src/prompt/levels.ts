import type { Level } from '../types.js';

const LEVEL_INSTRUCTIONS: Record<Level, string> = {
  casual: `「です・ます」調で柔らかく変換してください。
親しみを残しつつ、最低限の丁寧さを持たせてください。
堅すぎず、フレンドリーなトーンを維持してください。`,

  polite: `標準的な丁寧語で変換してください。
「です・ます」「お願いします」「ありがとうございます」などの表現を使用してください。
一般的なビジネスメールや日常の丁寧な会話レベルの丁寧さです。`,

  formal: `ビジネス敬語で変換してください。
「いたします」「存じます」「ご〜」「〜いただく」「承知いたしました」などの表現を使用してください。
上司や取引先に送るレベルの丁寧さです。`,

  honorific: `最上級の敬語で変換してください。
「〜させていただきます」「〜賜りたく存じます」「恐れ入りますが」「何卒」「ご高配」などの表現を使用してください。
重要な顧客や役員に対するレベルの最も格式高い敬語です。`,
};

export function getLevelInstruction(level: Level): string {
  return LEVEL_INSTRUCTIONS[level];
}
