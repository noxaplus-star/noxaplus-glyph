import { fontById, typographyScale } from './model';
import type { Alignment, FontId, GlyphProject, Specimen, TextDirection } from './types';

const SPECIMEN_IDS = ['a', 'b', 'c'] as const;
const SCALE_NAMES = ['caption', 'body', 'h6', 'h5', 'h4', 'h3', 'h2', 'h1'] as const;
const FONT_IDS: readonly FontId[] = ['vazirmatn', 'noto-sans', 'noto-naskh'];
const ALIGNMENTS: readonly Alignment[] = ['start', 'center', 'end', 'justify'];
const BRAND_COMMENT = 'NoxaPlus Glyph | MIT License | https://www.noxaplus.ir';

function number(value: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('Export settings must contain finite numbers.');
  }
  return String(value);
}

function direction(value: TextDirection): TextDirection {
  if (value !== 'rtl' && value !== 'ltr') throw new TypeError('Invalid text direction.');
  return value;
}

function alignment(value: Alignment): Alignment {
  if (!ALIGNMENTS.includes(value)) throw new TypeError('Invalid text alignment.');
  return value;
}

function font(id: FontId) {
  if (!FONT_IDS.includes(id)) throw new TypeError('Invalid font identifier.');
  return fontById(id);
}

function specimens(project: GlyphProject): Specimen[] {
  return SPECIMEN_IDS.map((id) => {
    const specimen = project.specimens.find((item) => item.id === id);
    if (!specimen) throw new TypeError(`Missing specimen ${id}.`);
    return specimen;
  });
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

/** Token stylesheet only: font files must be supplied by the consuming site. */
export function exportCss(project: GlyphProject): string {
  const items = specimens(project);
  const steps = typographyScale(project.scale);
  const textDirection = direction(project.direction);
  const tokens = items.flatMap((item) => [
    `  --glyph-${item.id}-font: ${JSON.stringify(font(item.font).family)}, sans-serif;`,
    `  --glyph-${item.id}-size: ${number(item.size)}px;`,
    `  --glyph-${item.id}-weight: ${number(item.weight)};`,
    `  --glyph-${item.id}-line-height: ${number(item.lineHeight)};`,
    `  --glyph-${item.id}-letter-spacing: ${number(item.letterSpacing)}px;`,
  ]);
  tokens.push(
    `  --glyph-scale-font: ${JSON.stringify(font(project.scale.font).family)}, sans-serif;`,
    `  --glyph-scale-weight: ${number(project.scale.weight)};`,
  );
  SCALE_NAMES.forEach((name, index) => {
    tokens.push(`  --glyph-${name}: ${number(steps[index].rem)}rem;`);
  });

  const specimenRules = items.map((item) => `.glyph-specimen-${item.id} {
  font-family: var(--glyph-${item.id}-font);
  font-size: var(--glyph-${item.id}-size);
  font-weight: var(--glyph-${item.id}-weight);
  line-height: var(--glyph-${item.id}-line-height);
  letter-spacing: var(--glyph-${item.id}-letter-spacing);
  text-align: ${alignment(item.align)};
  direction: ${textDirection};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`);
  const scaleRules = SCALE_NAMES.map((name) => `.glyph-type-${name} {
  font-family: var(--glyph-scale-font);
  font-size: var(--glyph-${name});
  font-weight: var(--glyph-scale-weight);
  line-height: ${name === 'body' || name === 'caption' ? '1.65' : '1.35'};
  letter-spacing: normal;
  text-align: start;
  direction: ${textDirection};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}`);

  return `/* ${BRAND_COMMENT}
   Usage: apply .glyph-specimen-a/b/c or .glyph-type-body/h1/etc to your text.
   Font families must be provided by the consuming site; this CSS contains no fonts. */
:root {
${tokens.join('\n')}
}

${[...specimenRules, ...scaleRules].join('\n\n')}
`;
}

function settings(entries: readonly (readonly [string, string])[]): string {
  return `<dl class="glyph-settings">${entries.map(([label, value]) =>
    `<div><dt>${escapeHtml(label)}</dt><dd><bdi>${escapeHtml(value)}</bdi></dd></div>`,
  ).join('')}</dl>`;
}

const DOCUMENT_CSS = `
:root { color-scheme: light; background: #f5f5f2; color: #17232c; }
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.6; }
.glyph-document { max-width: 1120px; margin: auto; padding: 32px 24px; }
.glyph-document-header, .glyph-footer { padding-block: 16px; }
h1, h2, h3, p { margin: 0 0 12px; }
.glyph-document-title { font-size: 28px; overflow-wrap: anywhere; white-space: pre-wrap; }
.glyph-brand { font-size: 14px; color: #456659; }
.glyph-note { color: #4d5d63; font-size: 14px; }
.glyph-panel { margin-block: 20px; padding: 24px; border: 1px solid #d6ded8; border-radius: 12px; background: #fff; min-width: 0; }
.glyph-panel-title { font-size: 18px; }
.glyph-settings { display: flex; flex-wrap: wrap; gap: 8px 24px; margin: 12px 0 24px; font-size: 12px; }
.glyph-settings div { min-width: 0; overflow-wrap: anywhere; }
.glyph-settings dt { color: #52635b; }
.glyph-settings dd { margin: 0; }
.glyph-scale-step { padding-block: 20px; border-top: 1px solid #e3e8e4; min-width: 0; }
.glyph-scale-step-title { font-size: 15px; }
.glyph-footer { border-top: 1px solid #d6ded8; font-size: 13px; }
a { color: #245c45; text-underline-offset: 3px; overflow-wrap: anywhere; }
@page { margin: 15mm; }
@media print {
  :root, body { background: #fff; color: #000; }
  html, body, .glyph-document { width: auto; max-width: none; min-width: 0; height: auto; max-height: none; overflow: visible; }
  .glyph-document { margin: 0; padding: 0; }
  .glyph-panel { border-radius: 0; padding: 12pt 0; break-inside: auto; page-break-inside: auto; }
  .glyph-panel header, .glyph-document-header { break-after: avoid-page; page-break-after: avoid; }
  .glyph-scale-step { break-inside: avoid-page; page-break-inside: avoid; }
  .glyph-scale-step header { break-after: avoid-page; page-break-after: avoid; }
  [class^="glyph-specimen-"], [class^="glyph-type-"] {
    height: auto; max-height: none; overflow: visible; white-space: pre-wrap; overflow-wrap: anywhere;
    break-inside: auto; page-break-inside: auto; orphans: 2; widows: 2;
  }
  .glyph-footer { break-inside: avoid-page; page-break-inside: avoid; }
}
`;

/** fontFaceCss must be trusted, internally generated CSS with bundled data-URL fonts. */
export function exportHtml(project: GlyphProject, fontFaceCss: string): string {
  const css = exportCss(project);
  const textDirection = direction(project.direction);
  let content: string;
  if (project.view === 'compare') {
    content = specimens(project).map((item) => `<section class="glyph-panel" aria-labelledby="glyph-heading-${item.id}">
<header><h2 class="glyph-panel-title" id="glyph-heading-${item.id}">نمونه ${item.id.toUpperCase()}</h2>
${settings([
  ['Font', font(item.font).name],
  ['Size', `${number(item.size)} px`],
  ['Weight', number(item.weight)],
  ['Line height', number(item.lineHeight)],
  ['Letter spacing', `${number(item.letterSpacing)} px`],
  ['Alignment', alignment(item.align)],
  ['Direction', textDirection],
])}</header>
<div class="glyph-specimen-${item.id}" dir="${textDirection}">${escapeHtml(project.text)}</div>
</section>`).join('\n');
  } else if (project.view === 'scale') {
    const steps = typographyScale(project.scale);
    const firstLine = project.text.split(/\r\n|[\r\n\u2028\u2029]/u).find((line) => line.trim()) || '';
    content = `<section class="glyph-panel" aria-labelledby="glyph-scale-heading">
<header><h2 class="glyph-panel-title" id="glyph-scale-heading">مقیاس تایپوگرافی</h2>
${settings([
  ['Font', font(project.scale.font).name],
  ['Base', `${number(project.scale.base)} px`],
  ['Ratio', number(project.scale.ratio)],
  ['Weight', number(project.scale.weight)],
  ['Direction', textDirection],
])}
<p class="glyph-note">متن اصلی، نمونهٔ کامل را نمایش می‌دهد؛ عنوان‌ها و زیرنویس از نخستین خط غیرخالی استفاده می‌کنند.</p></header>
${SCALE_NAMES.map((name, index) => `<article class="glyph-scale-step" aria-labelledby="glyph-scale-${name}">
<header><h3 class="glyph-scale-step-title" id="glyph-scale-${name}">${name}</h3>
${settings([
  ['Size', `${number(steps[index].pixels)} px / ${number(steps[index].rem)} rem`],
  ['Exponent', number(steps[index].exponent)],
])}</header>
<div class="glyph-type-${name}" dir="${textDirection}">${escapeHtml(name === 'body' ? project.text : firstLine)}</div>
</article>`).join('\n')}
</section>`;
  } else {
    throw new TypeError('Invalid project view.');
  }

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(project.title)} — NoxaPlus Glyph</title>
<!-- ${BRAND_COMMENT} -->
<style>
${fontFaceCss}
${css}
${DOCUMENT_CSS}</style>
</head>
<body>
<main class="glyph-document">
<header class="glyph-document-header">
<p class="glyph-brand">NoxaPlus Glyph</p>
<h1 class="glyph-document-title">${escapeHtml(project.title)}</h1>
<p class="glyph-note">نمونهٔ تایپوگرافی · مناسب نمایش و چاپ</p>
</header>
${content}
<footer class="glyph-footer">NoxaPlus · <a href="https://www.noxaplus.ir" rel="noopener noreferrer">https://www.noxaplus.ir</a> · MIT License</footer>
</main>
</body>
</html>
`;
}

export function exportFilename(title: string, extension: 'css' | 'html' | 'json'): string {
  if (extension !== 'css' && extension !== 'html' && extension !== 'json') {
    throw new TypeError('Invalid export extension.');
  }
  let stem = title.normalize('NFC')
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu, '')
    .trim()
    .replace(/[. ]+$/g, '')
    .replace(/\.(?:css|html|json)$/i, '')
    .replace(/^[. ]+|[. ]+$/g, '');
  // At most 60 Unicode scalars: even four-byte UTF-8 names stay below 255 bytes.
  stem = Array.from(stem).slice(0, 60).join('').replace(/[. ]+$/g, '');
  if (!stem) stem = 'NoxaPlus-Glyph';
  // Windows reserves these names even when followed by another extension.
  if (/^(?:con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?: *\.| *$)/i.test(stem)) {
    stem = `_${Array.from(stem).slice(0, 59).join('')}`;
  }
  return `${stem}.${extension}`;
}
