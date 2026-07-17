import type { BuiltinFormat, CustomFormat, PolishOptions, ResolvedOptions } from '../types.js';
import { isBuiltinFormat, BUILTIN_FORMATS } from '../types.js';
import { getCustomFormat, listCustomFormatNames } from './custom-formats.js';

export function resolveOptions(options: PolishOptions): ResolvedOptions {
  const resolved: ResolvedOptions = {
    text: options.text,
    level: options.level,
    engine: options.engine,
  };

  if (options.format) {
    // Check custom formats first (custom takes priority over builtin)
    const customFormat = getCustomFormat(options.format);
    if (customFormat) {
      resolved.customFormat = customFormat;
    } else if (isBuiltinFormat(options.format)) {
      resolved.builtinFormat = options.format as BuiltinFormat;
    } else {
      const customNames = listCustomFormatNames();
      const allFormats = [...BUILTIN_FORMATS, ...customNames];
      throw new Error(
        `フォーマット "${options.format}" が見つかりません。利用可能: ${allFormats.join(', ')}`
      );
    }
  }

  return resolved;
}

export { loadCustomFormats, getCustomFormat, listCustomFormatNames } from './custom-formats.js';
