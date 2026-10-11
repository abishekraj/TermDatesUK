import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Council } from './types.ts';

export const ROOT = join(import.meta.dirname, '..', '..');
export const COUNCILS_DIR = join(ROOT, 'data', 'councils');

export function loadCouncilFiles(dir = COUNCILS_DIR): { file: string; data: unknown }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ file, data: JSON.parse(readFileSync(join(dir, file), 'utf8')) }));
}

export type { Council };
