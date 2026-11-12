import { describe, expect, it } from 'vitest';
import { exportCss, exportFilename, exportHtml } from './export';
import { FONT_DEFINITIONS, fontById, typographyScale } from './model';
import type { Alignment, GlyphProject, TextDirection } from './types';

const SCALE_NAMES = ['caption', 'body', 'h6', 'h5', 'h4', 'h3', 'h2', 'h1'];
const TRUSTED_FONT_CSS = '@font-face { font-family: "Vazirmatn"; src: url("data:font/woff2;base64,AA==") format("woff2"); font-weight: 100 900; }';

function project(): GlyphProject {
  return {
    version: 1,
    title: 'آزمایش تایپوگرافی',
    text: 'سلام دنیا & NoxaPlus\nخط دوم با فاصلهٔ فارسی',
    direction: 'rtl',
    specimens: [
      { id: 'a', font: 'vazirmatn', size: 24, weight: 350, lineHeight: 1.8, letterSpacing: -0.25, align: 'start' },
      { id: 'b', font: 'noto-sans', size: 32.5, weight: 600, lineHeight: 1.5, letterSpacing: 0.5, align: 'center' },
      { id: 'c', font: 'noto-naskh', size: 28, weight: 700, lineHeight: 2, letterSpacing: 1, align: 'justify' },
    ],
    scale: { base: 16, ratio: 1.25, font: 'noto-naskh', weight: 500 },
    theme: 'dark',
    view: 'compare',
  };
}

function rule(css: string, className: string): string {
  const start = css.indexOf(`.${className} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf('}', start) + 1);
}

function sample(html: string, className: string, direction: TextDirection): string {
  const opening = `<div class="${className}" dir="${direction}">`;
  const start = html.indexOf(opening);
  expect(start).toBeGreaterThanOrEqual(0);
  return html.slice(start + opening.length, html.indexOf('</div>', start));
}

describe('exportCss', () => {
  it('exports every token and independent style for all three bundled fonts', () => {
    const value = project();
    const css = exportCss(value);
    expect(css).toContain(':root {');
    expect(FONT_DEFINITIONS.map((font) => font.id)).toEqual(['vazirmatn', 'noto-sans', 'noto-naskh']);
    for (const item of value.specimens) {
      expect(css).toContain(`--glyph-${item.id}-font: ${JSON.stringify(fontById(item.font).family)}, sans-serif;`);
      expect(css).toContain(`--glyph-${item.id}-size: ${item.size}px;`);
      expect(css).toContain(`--glyph-${item.id}-weight: ${item.weight};`);
      expect(css).toContain(`--glyph-${item.id}-line-height: ${item.lineHeight};`);
      expect(css).toContain(`--glyph-${item.id}-letter-spacing: ${item.letterSpacing}px;`);
      const block = rule(css, `glyph-specimen-${item.id}`);
      for (const property of ['font', 'size', 'weight', 'line-height', 'letter-spacing']) {
        expect(block).toContain(`var(--glyph-${item.id}-${property})`);
      }
      expect(block).toContain(`text-align: ${item.align};`);
      expect(block).toContain('direction: rtl;');
      expect(block).toContain('white-space: pre-wrap;');
      expect(block).toContain('overflow-wrap: anywhere;');
    }
    expect(css).toContain('--glyph-scale-font: "Noto Naskh Arabic", sans-serif;');
    expect(css).toContain('--glyph-scale-weight: 500;');
    expect(css).toContain('NoxaPlus Glyph | MIT License');
    expect(css).toContain('Font families must be provided by the consuming site');
    expect(css).toContain('this CSS contains no fonts');
    expect(css).not.toMatch(/@import|@font-face|url\s*\(/i);
  });

  it.each<Alignment>(['start', 'center', 'end', 'justify'])('supports the validated %s alignment', (align) => {
    const value = project();
    value.specimens[0].align = align;
    expect(rule(exportCss(value), 'glyph-specimen-a')).toContain(`text-align: ${align};`);
  });

  it.each<TextDirection>(['rtl', 'ltr'])('sets %s direction on specimen and scale classes', (direction) => {
    const value = project();
    value.direction = direction;
    const css = exportCss(value);
    for (const id of ['a', 'b', 'c']) {
      expect(rule(css, `glyph-specimen-${id}`)).toContain(`direction: ${direction};`);
    }
    for (const name of SCALE_NAMES) {
      const block = rule(css, `glyph-type-${name}`);
      expect(block).toContain(`direction: ${direction};`);
      expect(block).toContain(`font-size: var(--glyph-${name});`);
      expect(block).toContain('font-family: var(--glyph-scale-font);');
      expect(block).toContain('font-weight: var(--glyph-scale-weight);');
      expect(block).toContain('white-space: pre-wrap;');
      expect(block).toContain('overflow-wrap: anywhere;');
    }
  });

  it('never places free title or sample strings into CSS', () => {
    const value = project();
    const baseline = exportCss(value);
    value.title = '</style><script>alert("title")</script> /* malicious */';
    value.text = '} @import url("https://evil.invalid/font"); <script>alert(1)</script>';
    expect(exportCss(value)).toBe(baseline);
  });

  it('serializes specimen IDs in a stable a/b/c order', () => {
    const value = project();
    const baseline = exportCss(value);
    value.specimens.reverse();
    expect(exportCss(value)).toBe(baseline);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite settings (%s)', (invalid) => {
    const value = project();
    value.specimens[0].size = invalid;
    expect(() => exportCss(value)).toThrow(TypeError);
    value.specimens[0].size = 24;
    value.scale.base = invalid;
    expect(() => exportCss(value)).toThrow(TypeError);
  });

  it('rejects forged enums and string-valued numeric CSS injection', () => {
    const badAlignment = project();
    badAlignment.specimens[0].align = 'start; color: red' as Alignment;
    expect(() => exportCss(badAlignment)).toThrow(TypeError);
    const badDirection = project();
    badDirection.direction = 'rtl; color: red' as TextDirection;
    expect(() => exportCss(badDirection)).toThrow(TypeError);
    const badFont = project();
    badFont.specimens[0].font = 'vazirmatn; color: red' as GlyphProject['scale']['font'];
    expect(() => exportCss(badFont)).toThrow(TypeError);
    const badNumber = project();
    badNumber.specimens[0].size = '24; color: red' as unknown as number;
    expect(() => exportCss(badNumber)).toThrow(TypeError);
    const missingSpecimen = project();
    missingSpecimen.specimens.pop();
    expect(() => exportCss(missingSpecimen)).toThrow(TypeError);
  });
});

describe('typography scale export contract', () => {
  it.each([
    [12, 1.125], [16, 1.2], [18, 1.25], [16, 1.333], [20, 1.414], [24, 1.5],
  ])('uses exponents -1 through 6, round2 pixels and round4 rem for base %s / ratio %s', (base, ratio) => {
    const value = project();
    value.scale.base = base;
    value.scale.ratio = ratio;
    const steps = typographyScale(value.scale);
    const css = exportCss(value);
    expect(steps).toHaveLength(8);
    steps.forEach((step, index) => {
      const exponent = index - 1;
      const pixels = Math.round(base * ratio ** exponent * 100) / 100;
      const rem = Math.round((pixels / 16) * 10_000) / 10_000;
      expect(step).toEqual({ name: SCALE_NAMES[index], exponent, pixels, rem });
      expect(css).toContain(`--glyph-${SCALE_NAMES[index]}: ${rem}rem;`);
    });
    expect(steps[1].pixels).toBe(base);
    expect(steps[1].rem).toBe(base / 16);
  });

  it('uses rounded pixels, not unrounded scale math, when calculating rem', () => {
    const value = project();
    value.scale.ratio = 1.333;
    expect(typographyScale(value.scale)[0]).toEqual({ name: 'caption', exponent: -1, pixels: 12, rem: 0.75 });
    expect(exportCss(value)).toContain('--glyph-caption: 0.75rem;');
  });
});

describe('exportHtml', () => {
  it('creates a standalone light, Persian RTL document with three complete compare sections', () => {
    const value = project();
    const html = exportHtml(value, TRUSTED_FONT_CSS);
    expect(html.startsWith('<!doctype html>\n<html lang="fa" dir="rtl">')).toBe(true);
    expect(html.trimEnd().endsWith('</html>')).toBe(true);
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain(`<title>${value.title} — NoxaPlus Glyph</title>`);
    expect(html).toContain('color-scheme: light;');
    expect(html).not.toContain('color-scheme: dark;');
    expect(html.match(/<section\b/g)).toHaveLength(3);
    expect(html).not.toContain('<article');
    for (const item of value.specimens) {
      expect(html).toContain(`aria-labelledby="glyph-heading-${item.id}"`);
      expect(html).toContain(fontById(item.font).name);
      expect(html).toContain(`${item.size} px`);
      expect(html).toContain(`<bdi>${item.weight}</bdi>`);
      expect(html).toContain(`<bdi>${item.lineHeight}</bdi>`);
      expect(html).toContain(`${item.letterSpacing} px`);
      expect(html).toContain(`<bdi>${item.align}</bdi>`);
      expect(sample(html, `glyph-specimen-${item.id}`, 'rtl')).toBe('سلام دنیا &amp; NoxaPlus\nخط دوم با فاصلهٔ فارسی');
    }
    for (const label of ['Font', 'Size', 'Weight', 'Line height', 'Letter spacing', 'Alignment', 'Direction']) {
      expect(html).toContain(`<dt>${label}</dt>`);
    }
    expect(html).toContain('NoxaPlus');
    expect(html).toContain('<a href="https://www.noxaplus.ir"');
    expect(html).toContain('MIT License');
  });

  it.each(['compare', 'scale'] as const)('escapes closing tags, ampersands and both quotes in %s view', (view) => {
    const value = project();
    value.view = view;
    const payload = '</style></script><img src=x onerror="alert(1)">& "quoted" \'single\' فارسی 🖋';
    const escaped = '&lt;/style&gt;&lt;/script&gt;&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp; &quot;quoted&quot; &#39;single&#39; فارسی 🖋';
    value.title = payload;
    value.text = payload;
    const html = exportHtml(value, '/* trusted dummy font CSS */');
    expect(html).toContain(`<title>${escaped} — NoxaPlus Glyph</title>`);
    expect(html).toContain(`<h1 class="glyph-document-title">${escaped}</h1>`);
    expect(html).not.toContain(payload);
    expect(html).not.toMatch(/<script\b|<img\b|<\/script>/i);
    expect(html.match(/<\/style>/g)).toHaveLength(1);
    expect(sample(html, view === 'compare' ? 'glyph-specimen-a' : 'glyph-type-body', 'rtl')).toBe(escaped);
  });

  it('preserves literal entity strings rather than decoding them', () => {
    const value = project();
    value.text = '&lt;script&gt; &amp; &#39;';
    expect(sample(exportHtml(value, ''), 'glyph-specimen-a', 'rtl')).toBe('&amp;lt;script&amp;gt; &amp;amp; &amp;#39;');
  });

  it.each<TextDirection>(['rtl', 'ltr'])('keeps the document RTL and sets only sample direction to %s', (direction) => {
    const value = project();
    value.direction = direction;
    for (const view of ['compare', 'scale'] as const) {
      value.view = view;
      const html = exportHtml(value, '');
      expect(html).toContain('<html lang="fa" dir="rtl">');
      const classes = view === 'compare' ? ['glyph-specimen-a', 'glyph-specimen-b', 'glyph-specimen-c'] : SCALE_NAMES.map((name) => `glyph-type-${name}`);
      for (const className of classes) {
        expect(html).toContain(`<div class="${className}" dir="${direction}">`);
      }
      expect(html).not.toContain(`<body dir="${direction}">`);
    }
  });

  it('embeds trusted font CSS verbatim, uses the exact exported stylesheet, and has no runtime fetches or controls', () => {
    const html = exportHtml(project(), TRUSTED_FONT_CSS);
    expect(html).toContain(TRUSTED_FONT_CSS);
    expect(html).toContain(exportCss(project()));
    expect(html).not.toMatch(/<script\b|<link\b|<iframe\b|<img\b|<audio\b|<video\b|<object\b|<embed\b|@import\b|\bfetch\s*\(|XMLHttpRequest|\bWebSocket\b/i);
    expect(html).not.toMatch(/url\s*\(\s*["']?(?:https?:|\/\/)/i);
    expect(html).not.toMatch(/<button\b|<input\b|<select\b|<textarea\b|<form\b/i);
    expect(html.match(/href=/g)).toHaveLength(1);
  });

  it('exports a single scale section with settings and all eight size labels', () => {
    const value = project();
    value.view = 'scale';
    const html = exportHtml(value, '/* safe dummy CSS */');
    expect(html.match(/<section\b/g)).toHaveLength(1);
    expect(html.match(/<article\b/g)).toHaveLength(8);
    expect(html).not.toContain('<div class="glyph-specimen-');
    for (const label of ['Font', 'Base', 'Ratio', 'Weight', 'Direction', 'Size', 'Exponent']) {
      expect(html).toContain(`<dt>${label}</dt>`);
    }
    expect(html).toContain('<bdi>16 px</bdi>');
    expect(html).toContain('<bdi>1.25</bdi>');
    for (const [index, step] of typographyScale(value.scale).entries()) {
      expect(html).toContain(`${step.pixels} px / ${step.rem} rem`);
      expect(html).toContain(`<bdi>${index - 1}</bdi>`);
      const text = sample(html, `glyph-type-${step.name}`, 'rtl');
      expect(text).toBe(step.name === 'body' ? 'سلام دنیا &amp; NoxaPlus\nخط دوم با فاصلهٔ فارسی' : 'سلام دنیا &amp; NoxaPlus');
    }
    expect(html).toContain('از نخستین خط غیرخالی استفاده می‌کنند');
  });

  it.each(['\n', '\r\n', '\r', '\u2028', '\u2029'])('takes the first heading line across line separator %j', (separator) => {
    const value = project();
    value.view = 'scale';
    value.text = `خط اول${separator}خط دوم`;
    const html = exportHtml(value, '');
    expect(sample(html, 'glyph-type-h1', 'rtl')).toBe('خط اول');
    expect(sample(html, 'glyph-type-body', 'rtl')).toBe(value.text);
  });

  it('uses the first nonempty heading line and preserves complete body text', () => {
    const value = project();
    value.view = 'scale';
    value.text = '\n  \r\nتیتر واقعی\nمتن کامل';
    const html = exportHtml(value, '');
    expect(sample(html, 'glyph-type-h1', 'rtl')).toBe('تیتر واقعی');
    expect(sample(html, 'glyph-type-body', 'rtl')).toBe(value.text);
  });

  it('handles an empty sample and preserves leading/trailing whitespace', () => {
    const value = project();
    value.view = 'scale';
    value.text = '';
    expect(sample(exportHtml(value, ''), 'glyph-type-h1', 'rtl')).toBe('');
    value.text = '  متن  \n\n پایان ';
    const html = exportHtml(value, '');
    expect(sample(html, 'glyph-type-body', 'rtl')).toBe(value.text);
    expect(sample(html, 'glyph-type-h1', 'rtl')).toBe('  متن  ');
  });

  it('includes print rules that wrap long text, allow long body pagination, and keep labels with samples', () => {
    const value = project();
    value.text = `${'الف'.repeat(4_000)}\n${'LongWord'.repeat(1_000)}`;
    const html = exportHtml(value, '');
    expect(sample(html, 'glyph-specimen-a', 'rtl')).toBe(value.text);
    expect(html).toContain('@page { margin: 15mm; }');
    const print = html.slice(html.indexOf('@media print'));
    expect(print).toContain('overflow: visible;');
    expect(print).toContain('white-space: pre-wrap; overflow-wrap: anywhere;');
    expect(print).toContain('height: auto; max-height: none;');
    expect(print).toContain('break-inside: auto; page-break-inside: auto;');
    expect(print).toContain('break-after: avoid-page; page-break-after: avoid;');
    expect(print).toContain('orphans: 2; widows: 2;');
    expect(html).not.toMatch(/overflow:\s*(?:hidden|clip)|(?:max-)?height:\s*\d+(?:px|vh|pt)|white-space:\s*nowrap/i);
  });
});

describe('exportFilename', () => {
  it.each(['css', 'html', 'json'] as const)('adds exactly the requested %s extension and keeps Persian Unicode', (extension) => {
    expect(exportFilename('آزمایش قلم', extension)).toBe(`آزمایش قلم.${extension}`);
    expect(exportFilename('Typography.HTML', extension)).toBe(`Typography.${extension}`);
    expect(exportFilename('طرح.json', extension)).toBe(`طرح.${extension}`);
  });

  it('strips Windows forbidden characters, ASCII/C1 controls, bidi formatting and surrogate code units', () => {
    const value = '<>:"/\\|?*نام\u0000\u0001\t\n\u001f\u007f\u0085\u009f\u202e\u2066\u200b\ufeff\ud800';
    const filename = exportFilename(value, 'css');
    expect(filename).toBe('نام.css');
    expect(filename).not.toMatch(/[<>:"/\\|?*\p{Cc}\p{Cf}\p{Cs}]/u);
  });

  it.each(['', ' ', '.', '..', '... ', '<>:"/\\|?*', '\u0000\u202e', '.css'])('uses the safe fallback for %j', (title) => {
    expect(exportFilename(title, 'html')).toBe('NoxaPlus-Glyph.html');
  });

  it.each([
    'CON', 'con', 'PRN', 'AUX', 'nul', 'COM1', 'COM9', 'LPT1', 'lpt9',
    'COM¹', 'COM²', 'COM³', 'LPT¹', 'LPT²', 'LPT³', 'CLOCK$', 'CONIN$', 'CONOUT$',
    'CON.txt', 'aux.backup', 'COM1.html', 'LPT9.json', ' NUL. ', 'CON .txt',
  ])('makes Windows reserved name %j safe', (title) => {
    const filename = exportFilename(title, 'css');
    expect(filename.startsWith('_')).toBe(true);
    expect(filename.endsWith('.css')).toBe(true);
    expect(filename).not.toMatch(/^(?:con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i);
  });

  it.each(['CONsole', 'COM10', 'COM0', 'LPT10', 'auxiliary'])('does not alter ordinary name %s', (title) => {
    expect(exportFilename(title, 'json')).toBe(`${title}.json`);
  });

  it('removes traversal dots and trailing dots/spaces without losing internal punctuation', () => {
    expect(exportFilename(' ../../My:Project...  ', 'css')).toBe('MyProject.css');
    expect(exportFilename(' v1.2 specimen. ', 'html')).toBe('v1.2 specimen.html');
    expect(exportFilename('C:\\folder\\demo', 'json')).toBe('Cfolderdemo.json');
  });

  it.each(['x', 'ق', '🖋'])('bounds long %s filenames without splitting Unicode scalars or exceeding portable byte limits', (character) => {
    const filename = exportFilename(character.repeat(1_000), 'html');
    expect(filename).toBe(`${character.repeat(60)}.html`);
    expect(Array.from(filename)).toHaveLength(65);
    expect(new TextEncoder().encode(filename).length).toBeLessThanOrEqual(255);
    expect(filename).not.toMatch(/\p{Cs}/u);
  });

  it('cleans trailing punctuation introduced by truncation and normalizes composed Unicode', () => {
    expect(exportFilename(`${'x'.repeat(59)}.suffix`, 'css')).toBe(`${'x'.repeat(59)}.css`);
    expect(exportFilename('Cafe\u0301', 'json')).toBe('Café.json');
  });

  it('rejects an untyped unsafe extension', () => {
    expect(() => exportFilename('name', '../exe' as 'css')).toThrow(TypeError);
  });
});
