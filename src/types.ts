export type Level = 'casual' | 'polite' | 'formal' | 'honorific';

export type BuiltinFormat = 'email' | 'slack' | 'document';

export type Engine = 'claude' | 'kiro';

export interface CustomFormat {
  prefix?: string;
  suffix?: string;
}

export interface PolishOptions {
  text: string;
  level: Level;
  format?: string;
  engine: Engine;
}

export interface ResolvedOptions {
  text: string;
  level: Level;
  builtinFormat?: BuiltinFormat;
  customFormat?: CustomFormat;
  engine: Engine;
}

export interface EngineResult {
  output: string;
  exitCode: number;
}

export const LEVELS: Level[] = ['casual', 'polite', 'formal', 'honorific'];
export const BUILTIN_FORMATS: BuiltinFormat[] = ['email', 'slack', 'document'];
export const ENGINES: Engine[] = ['claude', 'kiro'];

export function isLevel(value: string): value is Level {
  return LEVELS.includes(value as Level);
}

export function isBuiltinFormat(value: string): value is BuiltinFormat {
  return BUILTIN_FORMATS.includes(value as BuiltinFormat);
}

export function isEngine(value: string): value is Engine {
  return ENGINES.includes(value as Engine);
}
