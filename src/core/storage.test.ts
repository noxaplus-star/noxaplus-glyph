import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProject } from './model';
import { loadProject, parseProject, saveProjectIfUnchanged, serializeProject, STORAGE_KEY } from './storage';
import type { StorageLike } from './storage';

function memoryStorage(initial: string | null = null) {
  let raw = initial;
  return {
    getItem: vi.fn((key: string) => key === STORAGE_KEY ? raw : null),
    setItem: vi.fn((key: string, value: string) => { if (key === STORAGE_KEY) raw = value; }),
    removeItem: vi.fn((key: string) => { if (key === STORAGE_KEY) raw = null; }),
  } satisfies StorageLike;
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('project import/export', () => {
  it('serializes the exact versioned envelope and preserves transcript text', () => {
    const project = createProject();
    project.text = ' \tمی‌روم\r\nی ک\u0000 <script>not code</script> 😀\n ';
    const serialized = serializeProject(project);
    expect(JSON.parse(serialized)).toEqual({ app: 'NoxaPlus Glyph', version: 1, project });
    expect(parseProject(serialized)).toEqual({ ok: true, project });
  });

  it.each([
    '', ' ', '{', '{"app":', 'undefined', 'null', '[]', 'true', '1', '"text"', '{}',
    '{"app":"Other","version":1,"project":{}}',
    '{"app":"NoxaPlus Glyph","version":2,"project":{}}',
    '{"app":"NoxaPlus Glyph","version":"1","project":{}}',
    '{"app":"NoxaPlus Glyph","version":1}',
    '{"app":"NoxaPlus Glyph","project":{}}',
    '{"version":1,"project":{}}',
    '{"app":"NoxaPlus Glyph","version":1,"project":null}',
    '{"app":"NoxaPlus Glyph","version":1,"project":[]}',
  ])('rejects malformed imports and envelopes: %j', (text) => {
    expect(parseProject(text).ok).toBe(false);
  });

  it('requires an envelope even for a valid bare project', () => {
    expect(parseProject(JSON.stringify(createProject())).ok).toBe(false);
  });

  it('validates the enclosed project, rejecting ranges and JSON overflow', () => {
    const project = createProject();
    project.specimens[0].size = 97;
    expect(parseProject(serializeProject(project)).ok).toBe(false);
    const valid = serializeProject(createProject());
    for (const size of ['null', '1e999', '-1e999', '"24"']) {
      expect(parseProject(valid.replace('"size":24', `"size":${size}`)).ok).toBe(false);
    }
  });

  it('trims the imported title only', () => {
    const project = { ...createProject(), title: '  عنوان  ', text: '  متن\r\n ' };
    expect(parseProject(serializeProject(project))).toEqual({ ok: true, project: { ...project, title: 'عنوان' } });
  });
});

describe('loadProject and recovery', () => {
  it('uses the stable key and distinguishes absence from corrupt empty data', () => {
    expect(STORAGE_KEY).toBe('noxaplus-glyph-project-v1');
    const storage = memoryStorage();
    expect(loadProject(storage)).toEqual({ project: null, revision: null, warning: null, recoveryData: null });
    expect(storage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('keeps a valid raw revision exactly, including envelope whitespace', () => {
    const project = createProject();
    const raw = ` \n${JSON.stringify({ version: 1, project, app: 'NoxaPlus Glyph' }, null, 2)}\t `;
    const storage = memoryStorage(raw);
    expect(loadProject(storage)).toEqual({ project, revision: raw, warning: null, recoveryData: null });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it.each(['', ' \n\t ', '{broken', 'null', '{}', serializeProject({ ...createProject(), title: '' })])('retains corrupt data verbatim for recovery and pauses overwrites: %j', (raw) => {
    const storage = memoryStorage(raw);
    const loaded = loadProject(storage);
    expect(loaded.project).toBeNull();
    expect(loaded.revision).toBe(raw);
    expect(loaded.recoveryData).toBe(raw);
    expect(loaded.warning).toBeTruthy();
    expect(saveProjectIfUnchanged(createProject(), loaded.revision, storage)).toEqual({ status: 'conflict' });
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('reports unavailable storage without inventing recoverable data', () => {
    const storage = memoryStorage();
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError'); });
    const result = loadProject(storage);
    expect(result).toEqual({ project: null, revision: null, warning: expect.any(String), recoveryData: null });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  });
});

describe('saveProjectIfUnchanged', () => {
  it('saves only when the exact raw revision matches and returns the new raw revision', () => {
    const storage = memoryStorage();
    const first = createProject();
    const saved = saveProjectIfUnchanged(first, null, storage);
    expect(saved).toEqual({ status: 'saved', revision: serializeProject(first) });
    expect(storage.setItem).toHaveBeenCalledWith(STORAGE_KEY, serializeProject(first));
    const next = { ...first, title: 'آزمایش دوم' };
    expect(saveProjectIfUnchanged(next, serializeProject(first), storage)).toEqual({ status: 'saved', revision: serializeProject(next) });
    expect(loadProject(storage).project).toEqual(next);
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('does not treat equivalent JSON with different formatting as the same revision', () => {
    const project = createProject();
    const revision = serializeProject(project);
    const reformatted = JSON.stringify(JSON.parse(revision), null, 2);
    const storage = memoryStorage(reformatted);
    expect(saveProjectIfUnchanged(project, revision, storage)).toEqual({ status: 'conflict' });
    expect(storage.getItem(STORAGE_KEY)).toBe(reformatted);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(saveProjectIfUnchanged(project, reformatted, storage)).toEqual({ status: 'saved', revision });
  });

  it('blocks a stale tab without overwriting another tab', () => {
    const original = serializeProject(createProject());
    const storage = memoryStorage(original);
    const tabA = loadProject(storage);
    const tabB = loadProject(storage);
    const projectA = { ...createProject(), title: 'نوشتهٔ اول' };
    expect(saveProjectIfUnchanged(projectA, tabA.revision, storage).status).toBe('saved');
    storage.setItem.mockClear();
    expect(saveProjectIfUnchanged({ ...createProject(), title: 'نوشتهٔ دوم' }, tabB.revision, storage)).toEqual({ status: 'conflict' });
    expect(storage.getItem(STORAGE_KEY)).toBe(serializeProject(projectA));
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('blocks a stale empty tab and a tab whose project was removed', () => {
    const storage = memoryStorage();
    const firstTab = loadProject(storage);
    const secondTab = loadProject(storage);
    expect(saveProjectIfUnchanged(createProject(), firstTab.revision, storage).status).toBe('saved');
    storage.setItem.mockClear();
    expect(saveProjectIfUnchanged(createProject(), secondTab.revision, storage)).toEqual({ status: 'conflict' });
    expect(storage.setItem).not.toHaveBeenCalled();
    const loaded = loadProject(storage);
    storage.removeItem(STORAGE_KEY);
    expect(saveProjectIfUnchanged(createProject(), loaded.revision, storage)).toEqual({ status: 'conflict' });
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('allows confirmed recovery without deleting raw data first', () => {
    const storage = memoryStorage('{broken');
    expect(saveProjectIfUnchanged(createProject(), '{broken', storage, true).status).toBe('saved');
    expect(loadProject(storage).project).toEqual(createProject());
    expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it('cannot use recovery approval to overwrite a changed revision', () => {
    const storage = memoryStorage('{newer');
    expect(saveProjectIfUnchanged(createProject(), '{old', storage, true).status).toBe('conflict');
    expect(storage.getItem(STORAGE_KEY)).toBe('{newer');
  });

  it('skips unchanged writes', () => {
    const raw = serializeProject(createProject());
    const storage = memoryStorage(raw);
    expect(saveProjectIfUnchanged(createProject(), raw, storage).status).toBe('saved');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('allows saving after the caller explicitly resets corrupt data', () => {
    const storage = memoryStorage('{broken');
    storage.removeItem(STORAGE_KEY);
    expect(saveProjectIfUnchanged(createProject(), null, storage).status).toBe('saved');
  });

  it('returns unavailable on read errors or quota errors without modifying storage', () => {
    const raw = serializeProject(createProject());
    const storage = memoryStorage(raw);
    storage.setItem.mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(saveProjectIfUnchanged({ ...createProject(), title: 'جدید' }, raw, storage)).toEqual({ status: 'unavailable' });
    expect(storage.getItem(STORAGE_KEY)).toBe(raw);
    storage.setItem.mockClear();
    storage.getItem.mockImplementation(() => { throw new Error('SecurityError'); });
    expect(saveProjectIfUnchanged(createProject(), raw, storage)).toEqual({ status: 'unavailable' });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('uses optional browser storage and handles absent or denied storage', () => {
    const storage = memoryStorage();
    vi.stubGlobal('localStorage', storage);
    expect(loadProject().warning).toBeNull();
    expect(saveProjectIfUnchanged(createProject(), null).status).toBe('saved');
    expect(loadProject().project).toEqual(createProject());
    vi.stubGlobal('localStorage', undefined);
    expect(loadProject().warning).toBeTruthy();
    expect(saveProjectIfUnchanged(createProject(), null)).toEqual({ status: 'unavailable' });
  });
});
