import { describe, expect, it } from 'vitest';
import { createProject, FONT_DEFINITIONS, fontById, textStats, typographyScale, validateProject } from './model';
import { SAMPLES } from './samples';
import type { Alignment, FontId, GlyphProject } from './types';

function expectInvalid(value: unknown): void {
  const result = validateProject(value);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
}

describe('font definitions and defaults', () => {
  it('defines the three exact families, labels and weight ranges', () => {
    expect(FONT_DEFINITIONS.map(({ id, name, family, minWeight, maxWeight }) => ({ id, name, family, minWeight, maxWeight }))).toEqual([
      { id: 'vazirmatn', name: 'وزیرمتن', family: 'Vazirmatn', minWeight: 100, maxWeight: 900 },
      { id: 'noto-sans', name: 'نوتو سنس عربی', family: 'Noto Sans Arabic', minWeight: 100, maxWeight: 900 },
      { id: 'noto-naskh', name: 'نوتو نسخ عربی', family: 'Noto Naskh Arabic', minWeight: 400, maxWeight: 700 },
    ]);
    for (const font of FONT_DEFINITIONS) {
      expect(fontById(font.id)).toBe(font);
      expect(font.category).not.toBe('');
    }
  });

  it('creates a valid Persian editorial project with independent settings', () => {
    const project = createProject();
    expect(project).toEqual({
      version: 1,
      title: 'آزمایش اول',
      text: SAMPLES.find((sample) => sample.id === 'editorial')!.text,
      direction: 'rtl',
      specimens: [
        { id: 'a', font: 'vazirmatn', size: 24, weight: 400, lineHeight: 1.8, letterSpacing: 0, align: 'start' },
        { id: 'b', font: 'noto-sans', size: 24, weight: 400, lineHeight: 1.8, letterSpacing: 0, align: 'start' },
        { id: 'c', font: 'noto-naskh', size: 24, weight: 400, lineHeight: 1.8, letterSpacing: 0, align: 'start' },
      ],
      scale: { base: 16, ratio: 1.25, font: 'vazirmatn', weight: 400 },
      theme: 'light',
      view: 'compare',
    });
    expect(validateProject(project)).toEqual({ ok: true, project });
    project.specimens[0].size = 96;
    project.scale.base = 24;
    expect(createProject().specimens[0].size).toBe(24);
    expect(createProject().scale.base).toBe(16);
  });
});

describe('validateProject', () => {
  it.each([undefined, null, true, 1, 'project', [], {}, { version: 2 }])('rejects incomplete or non-project input: %j', (value) => {
    expectInvalid(value);
  });

  it.each(Object.keys(createProject()) as (keyof GlyphProject)[])('requires %s', (key) => {
    const project: Partial<GlyphProject> = createProject();
    delete project[key];
    expectInvalid(project);
  });

  it.each([
    ['version', '1'], ['version', 2], ['title', null], ['title', ''], ['title', ' \n\t '],
    ['title', 'ی'.repeat(121)], ['text', null], ['text', 'ی'.repeat(50_001)],
    ['direction', 'auto'], ['theme', 'system'], ['view', 'preview'],
    ['specimens', null], ['specimens', {}], ['scale', null], ['scale', []],
  ])('rejects invalid %s values', (key, value) => {
    expectInvalid({ ...createProject(), [key as string]: value });
  });

  it('trims only the title and preserves all transcript characters', () => {
    const project = createProject();
    project.title = ' \n آزمایش دوم \t ';
    project.text = ' \tمی‌روم\r\nی ك ک ي\u0000 <b>متن</b> 😀\n ';
    const result = validateProject(project);
    expect(result).toEqual({ ok: true, project: { ...project, title: 'آزمایش دوم' } });
    expect(project.title).toBe(' \n آزمایش دوم \t ');
    if (result.ok) {
      expect(result.project).not.toBe(project);
      expect(result.project.specimens[0]).not.toBe(project.specimens[0]);
      expect(result.project.scale).not.toBe(project.scale);
    }
  });

  it('accepts title and UTF-16 text boundaries, including empty text', () => {
    for (const title of ['ی', ` ${'ی'.repeat(120)} `]) {
      for (const text of ['', 'ی'.repeat(50_000), '😀'.repeat(25_000)]) {
        const result = validateProject({ ...createProject(), title, text });
        expect(result.ok).toBe(true);
        if (result.ok) expect(result.project.text).toBe(text);
      }
    }
    expectInvalid({ ...createProject(), text: '😀'.repeat(25_000) + 'ی' });
  });

  it('accepts all project and alignment enums', () => {
    for (const direction of ['rtl', 'ltr']) {
      for (const theme of ['light', 'dark']) {
        for (const view of ['compare', 'scale']) {
          for (const align of ['start', 'center', 'end', 'justify'] as Alignment[]) {
            const project = createProject();
            project.specimens.forEach((specimen) => { specimen.align = align; });
            expect(validateProject({ ...project, direction, theme, view }).ok).toBe(true);
          }
        }
      }
    }
  });

  it('requires exactly three unique a/b/c identifiers without requiring order', () => {
    const project = createProject();
    for (const specimens of [[], project.specimens.slice(0, 2), [...project.specimens, project.specimens[0]],
      [null, project.specimens[1], project.specimens[2]],
      [{ ...project.specimens[0], id: 'b' }, project.specimens[1], project.specimens[2]],
      [{ ...project.specimens[0], id: 'd' }, project.specimens[1], project.specimens[2]],
    ]) expectInvalid({ ...project, specimens });
    const specimens = [...project.specimens].reverse();
    expect(validateProject({ ...project, specimens })).toEqual({ ok: true, project: { ...project, specimens } });
  });

  it.each(['id', 'font', 'size', 'weight', 'lineHeight', 'letterSpacing', 'align'])('requires specimen %s', (key) => {
    const project = createProject();
    const specimen: Record<string, unknown> = { ...project.specimens[0] };
    delete specimen[key];
    expectInvalid({ ...project, specimens: [specimen, ...project.specimens.slice(1)] });
  });

  it.each(['base', 'ratio', 'font', 'weight'])('requires scale %s', (key) => {
    const scale: Record<string, unknown> = { ...createProject().scale };
    delete scale[key];
    expectInvalid({ ...createProject(), scale });
  });

  it.each([
    ['size', 12, 96], ['lineHeight', 1, 2.5], ['letterSpacing', -1, 4],
  ] as const)('bounds specimen %s and rejects non-finite or non-numeric values', (key, min, max) => {
    for (const value of [min, (min + max) / 2, max]) {
      const project = createProject();
      project.specimens[0][key] = value;
      expect(validateProject(project).ok).toBe(true);
    }
    for (const value of [min - 0.01, max + 0.01, NaN, Infinity, -Infinity, `${min}`, null, undefined, true]) {
      const project = createProject();
      expectInvalid({ ...project, specimens: [{ ...project.specimens[0], [key]: value }, ...project.specimens.slice(1)] });
    }
  });

  it.each(['vazirmatn', 'noto-sans', 'noto-naskh'] as FontId[])('bounds weights by %s for both specimens and scale', (font) => {
    const { minWeight, maxWeight } = fontById(font);
    for (const weight of [minWeight, (minWeight + maxWeight) / 2, maxWeight]) {
      const project = createProject();
      project.specimens[0] = { ...project.specimens[0], font, weight };
      project.scale = { ...project.scale, font, weight };
      expect(validateProject(project).ok).toBe(true);
    }
    for (const weight of [minWeight - 0.01, maxWeight + 0.01, NaN, Infinity, -Infinity, '400', null, undefined]) {
      const project = createProject();
      expectInvalid({ ...project, specimens: [{ ...project.specimens[0], font, weight }, ...project.specimens.slice(1)] });
      expectInvalid({ ...project, scale: { ...project.scale, font, weight } });
    }
  });

  it('rejects unknown fonts and alignments', () => {
    const project = createProject();
    for (const font of ['unknown', '', null, 1]) {
      expectInvalid({ ...project, specimens: [{ ...project.specimens[0], font }, ...project.specimens.slice(1)] });
      expectInvalid({ ...project, scale: { ...project.scale, font } });
    }
    for (const align of ['left', 'right', '', null, 1]) {
      expectInvalid({ ...project, specimens: [{ ...project.specimens[0], align }, ...project.specimens.slice(1)] });
    }
  });

  it('bounds scale base and accepts only the exact supported ratios', () => {
    const project = createProject();
    for (const base of [12, 16.5, 24]) {
      for (const ratio of [1.125, 1.2, 1.25, 1.333, 1.414, 1.5]) {
        expect(validateProject({ ...project, scale: { ...project.scale, base, ratio } }).ok).toBe(true);
      }
    }
    for (const base of [11.99, 24.01, NaN, Infinity, -Infinity, '16', null, undefined]) {
      expectInvalid({ ...project, scale: { ...project.scale, base } });
    }
    for (const ratio of [0, 1, 1.3, 4 / 3, Math.SQRT2, NaN, Infinity, -Infinity, '1.25', null, undefined]) {
      expectInvalid({ ...project, scale: { ...project.scale, ratio } });
    }
  });
});

describe('typographyScale', () => {
  it('returns all eight names, exponents and rounded pixel/rem values', () => {
    expect(typographyScale(createProject().scale)).toEqual([
      { name: 'caption', exponent: -1, pixels: 12.8, rem: 0.8 },
      { name: 'body', exponent: 0, pixels: 16, rem: 1 },
      { name: 'h6', exponent: 1, pixels: 20, rem: 1.25 },
      { name: 'h5', exponent: 2, pixels: 25, rem: 1.5625 },
      { name: 'h4', exponent: 3, pixels: 31.25, rem: 1.9531 },
      { name: 'h3', exponent: 4, pixels: 39.06, rem: 2.4413 },
      { name: 'h2', exponent: 5, pixels: 48.83, rem: 3.0519 },
      { name: 'h1', exponent: 6, pixels: 61.04, rem: 3.815 },
    ]);
  });

  it('uses rounded pixels for rem and a fixed 16px rem base', () => {
    const settings = { base: 24, ratio: 1.333, font: 'noto-naskh' as const, weight: 700 };
    const scale = typographyScale(settings);
    expect(scale[1].rem).toBe(1.5);
    for (const step of scale) {
      expect(step.pixels).toBe(Number((settings.base * settings.ratio ** step.exponent).toFixed(2)));
      expect(step.rem).toBe(Number((step.pixels / 16).toFixed(4)));
    }
  });
});

describe('textStats', () => {
  it.each([
    ['', { characters: 0, words: 0, lines: 0 }],
    [' \t ', { characters: 3, words: 0, lines: 1 }],
    ['\n', { characters: 1, words: 0, lines: 2 }],
    ['سلام دنیا', { characters: 9, words: 2, lines: 1 }],
    ['می‌روم', { characters: 6, words: 1, lines: 1 }],
    ['😀 یِ', { characters: 4, words: 2, lines: 1 }],
    [' a\t b\n c\r\nd\r', { characters: 12, words: 4, lines: 4 }],
    ['یک\u00a0دو\u2003سه', { characters: 8, words: 3, lines: 1 }],
  ])('counts codepoints, whitespace words and lines: %j', (text, expected) => {
    expect(textStats(text)).toEqual(expected);
  });
});
