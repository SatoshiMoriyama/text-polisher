import type { Engine, EngineResult } from '../types.js';
import { ClaudeEngine } from './claude.js';
import { KiroEngine } from './kiro.js';

export interface EngineAdapter {
  name: Engine;
  isAvailable(): Promise<boolean>;
  execute(prompt: string): Promise<EngineResult>;
}

export function getEngine(engine: Engine): EngineAdapter {
  switch (engine) {
    case 'claude':
      return new ClaudeEngine();
    case 'kiro':
      return new KiroEngine();
  }
}

export { ClaudeEngine } from './claude.js';
export { KiroEngine } from './kiro.js';
