import { validateProject } from './model';
import type { GlyphProject, ValidationResult } from './types';

export const STORAGE_KEY = 'noxaplus-glyph-project-v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function serializeProject(project: GlyphProject): string {
  return JSON.stringify({ app: 'NoxaPlus Glyph', version: 1, project });
}

export function parseProject(text: string): ValidationResult {
  let envelope: unknown;
  try {
    envelope = JSON.parse(text);
  } catch {
    return { ok: false, error: 'فایل پروژه JSON معتبر نیست.' };
  }
  if (
    typeof envelope !== 'object' || envelope === null || Array.isArray(envelope) ||
    !('app' in envelope) || envelope.app !== 'NoxaPlus Glyph' ||
    !('version' in envelope) || envelope.version !== 1 || !('project' in envelope)
  ) {
    return { ok: false, error: 'فایل متعلق به NoxaPlus Glyph نسخهٔ ۱ نیست.' };
  }
  return validateProject(envelope.project);
}

export function loadProject(storage?: StorageLike): {
  project: GlyphProject | null;
  revision: string | null;
  warning: string | null;
  recoveryData: string | null;
} {
  let raw: string | null;
  try {
    raw = (storage ?? globalThis.localStorage).getItem(STORAGE_KEY);
  } catch {
    return {
      project: null,
      revision: null,
      warning: 'ذخیره‌سازی محلی در دسترس نیست. یک نسخهٔ پشتیبان از پروژه بگیرید.',
      recoveryData: null,
    };
  }
  if (raw === null) return { project: null, revision: null, warning: null, recoveryData: null };
  const result = parseProject(raw);
  if (!result.ok) {
    return {
      project: null,
      revision: raw,
      warning: `${result.error} ذخیرهٔ خودکار متوقف است؛ دادهٔ اصلی را بازیابی یا پروژه را بازنشانی کنید.`,
      recoveryData: raw,
    };
  }
  return { project: result.project, revision: raw, warning: null, recoveryData: null };
}

export function saveProjectIfUnchanged(
  project: GlyphProject,
  revision: string | null,
  storage?: StorageLike,
  allowRecovery = false,
): { status: 'saved'; revision: string } | { status: 'conflict' | 'unavailable' } {
  try {
    const target = storage ?? globalThis.localStorage;
    const current = target.getItem(STORAGE_KEY);
    if (current !== revision || (!allowRecovery && current !== null && !parseProject(current).ok)) return { status: 'conflict' };
    const nextRevision = serializeProject(project);
    if (nextRevision !== current) target.setItem(STORAGE_KEY, nextRevision);
    return { status: 'saved', revision: nextRevision };
  } catch {
    return { status: 'unavailable' };
  }
}
