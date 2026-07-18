import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import type { CustomFormat } from '../types.js';

interface FormatsFile {
  formats?: Record<string, CustomFormat>;
}

function getConfigPath(): string {
  return join(homedir(), '.text-polisher', 'formats.yaml');
}

export function loadCustomFormats(): Record<string, CustomFormat> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return {};
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const parsed = parseYaml(content) as FormatsFile;

    if (!parsed || !parsed.formats) {
      return {};
    }

    return parsed.formats;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `~/.text-polisher/formats.yaml の解析に失敗しました: ${message}`
    );
  }
}

export function getCustomFormat(name: string): CustomFormat | null {
  const formats = loadCustomFormats();
  return formats[name] ?? null;
}

export function listCustomFormatNames(): string[] {
  const formats = loadCustomFormats();
  return Object.keys(formats);
}
