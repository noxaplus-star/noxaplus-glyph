import { SAMPLES } from './samples';
import type {
  Alignment,
  FontDefinition,
  FontId,
  GlyphProject,
  ScaleSettings,
  ScaleStep,
  Specimen,
  ValidationResult,
} from './types';

export const FONT_DEFINITIONS: FontDefinition[] = [
  { id: 'vazirmatn', name: 'وزیرمتن', family: 'Vazirmatn', category: 'بدون سریف', minWeight: 100, maxWeight: 900 },
  { id: 'noto-sans', name: 'نوتو سنس عربی', family: 'Noto Sans Arabic', category: 'بدون سریف', minWeight: 100, maxWeight: 900 },
  { id: 'noto-naskh', name: 'نوتو نسخ عربی', family: 'Noto Naskh Arabic', category: 'نسخ', minWeight: 400, maxWeight: 700 },
];

export function fontById(id: FontId): FontDefinition {
  const font = FONT_DEFINITIONS.find((definition) => definition.id === id);
  if (!font) throw new Error('قلم نامعتبر است.');
  return font;
}

export function createProject(): GlyphProject {
  return {
    version: 1,
    title: 'آزمایش اول',
    text: SAMPLES[0].text,
    direction: 'rtl',
    specimens: FONT_DEFINITIONS.map((font, index) => ({
      id: (['a', 'b', 'c'] as const)[index],
      font: font.id,
      size: 24,
      weight: 400,
      lineHeight: 1.8,
      letterSpacing: 0,
      align: 'start',
    })),
    scale: { base: 16, ratio: 1.25, font: 'vazirmatn', weight: 400 },
    theme: 'light',
    view: 'compare',
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function isFontId(value: unknown): value is FontId {
  return value === 'vazirmatn' || value === 'noto-sans' || value === 'noto-naskh';
}

function isAlignment(value: unknown): value is Alignment {
  return value === 'start' || value === 'center' || value === 'end' || value === 'justify';
}

export function validateProject(value: unknown): ValidationResult {
  const invalid = (error: string): ValidationResult => ({ ok: false, error });
  if (!isRecord(value) || value.version !== 1) return invalid('ساختار یا نسخهٔ پروژه معتبر نیست.');
  if (typeof value.title !== 'string' || value.title.trim().length < 1 || value.title.trim().length > 120) {
    return invalid('نام پروژه باید بین ۱ تا ۱۲۰ نویسه باشد.');
  }
  if (typeof value.text !== 'string' || value.text.length > 50_000) {
    return invalid('متن پروژه باید حداکثر ۵۰٬۰۰۰ واحد UTF-16 باشد.');
  }
  if (value.direction !== 'rtl' && value.direction !== 'ltr') return invalid('جهت متن معتبر نیست.');
  if (value.theme !== 'light' && value.theme !== 'dark') return invalid('پوستهٔ پروژه معتبر نیست.');
  if (value.view !== 'compare' && value.view !== 'scale') return invalid('نمای پروژه معتبر نیست.');
  if (!Array.isArray(value.specimens) || value.specimens.length !== 3) {
    return invalid('پروژه باید دقیقاً سه نمونه داشته باشد.');
  }

  const specimens: Specimen[] = [];
  const ids = new Set<string>();
  for (const specimen of value.specimens) {
    if (!isRecord(specimen) || (specimen.id !== 'a' && specimen.id !== 'b' && specimen.id !== 'c') || ids.has(specimen.id)) {
      return invalid('شناسه‌های نمونه‌ها باید a، b و c و یکتا باشند.');
    }
    if (!isFontId(specimen.font)) return invalid('قلم نمونه معتبر نیست.');
    const font = fontById(specimen.font);
    if (!inRange(specimen.size, 12, 96)) return invalid('اندازهٔ قلم باید بین ۱۲ تا ۹۶ باشد.');
    if (!inRange(specimen.weight, font.minWeight, font.maxWeight)) return invalid('وزن قلم خارج از محدودهٔ پشتیبانی‌شده است.');
    if (!inRange(specimen.lineHeight, 1, 2.5)) return invalid('فاصلهٔ خطوط باید بین ۱ تا ۲٫۵ باشد.');
    if (!inRange(specimen.letterSpacing, -1, 4)) return invalid('فاصلهٔ حروف باید بین منفی ۱ تا ۴ باشد.');
    if (!isAlignment(specimen.align)) return invalid('تراز متن معتبر نیست.');
    ids.add(specimen.id);
    specimens.push({
      id: specimen.id,
      font: specimen.font,
      size: specimen.size,
      weight: specimen.weight,
      lineHeight: specimen.lineHeight,
      letterSpacing: specimen.letterSpacing,
      align: specimen.align,
    });
  }

  const scale = value.scale;
  if (!isRecord(scale) || !isFontId(scale.font)) return invalid('قلم مقیاس معتبر نیست.');
  const scaleFont = fontById(scale.font);
  if (!inRange(scale.base, 12, 24)) return invalid('اندازهٔ پایه باید بین ۱۲ تا ۲۴ باشد.');
  if (typeof scale.ratio !== 'number' || !Number.isFinite(scale.ratio) || ![1.125, 1.2, 1.25, 1.333, 1.414, 1.5].includes(scale.ratio)) {
    return invalid('نسبت مقیاس معتبر نیست.');
  }
  if (!inRange(scale.weight, scaleFont.minWeight, scaleFont.maxWeight)) return invalid('وزن قلم مقیاس خارج از محدودهٔ پشتیبانی‌شده است.');

  return {
    ok: true,
    project: {
      version: 1,
      title: value.title.trim(),
      text: value.text,
      direction: value.direction,
      specimens,
      scale: { base: scale.base, ratio: scale.ratio, font: scale.font, weight: scale.weight },
      theme: value.theme,
      view: value.view,
    },
  };
}

export function typographyScale(settings: ScaleSettings): ScaleStep[] {
  return ['caption', 'body', 'h6', 'h5', 'h4', 'h3', 'h2', 'h1'].map((name, index) => {
    const exponent = index - 1;
    const pixels = Math.round(settings.base * settings.ratio ** exponent * 100) / 100;
    return { name, exponent, pixels, rem: Math.round((pixels / 16) * 10_000) / 10_000 };
  });
}

export function textStats(text: string): { characters: number; words: number; lines: number } {
  return {
    characters: Array.from(text).length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/u).length,
    lines: text === '' ? 0 : text.split(/\r\n|\r|\n/u).length,
  };
}
