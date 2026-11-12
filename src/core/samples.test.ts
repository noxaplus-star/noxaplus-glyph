import { describe, expect, it } from 'vitest';
import { createProject, validateProject } from './model';
import { SAMPLES } from './samples';

describe('Persian text samples', () => {
  it('provides four distinct, named samples suitable for projects', () => {
    expect(SAMPLES.map((sample) => sample.id)).toEqual(['editorial', 'interface', 'mixed', 'characters']);
    expect(new Set(SAMPLES.map((sample) => sample.text)).size).toBe(4);
    for (const sample of SAMPLES) {
      expect(sample.name.trim().length).toBeGreaterThan(0);
      expect(sample.label.trim().length).toBeGreaterThan(0);
      expect(sample.text.length).toBeGreaterThan(100);
      expect(sample.text).toMatch(/[\u0600-\u06ff]/u);
      expect(validateProject({ ...createProject(), text: sample.text }).ok).toBe(true);
    }
  });

  it('includes editorial paragraphs, interface messages and mixed-direction content', () => {
    expect(SAMPLES[0].text).toContain('\n\n');
    expect(SAMPLES[1].text).toContain('ذخیره');
    expect(SAMPLES[1].text).toContain('در دسترس نیست');
    expect(SAMPLES[2].text).toContain('NoxaPlus Glyph');
    expect(SAMPLES[2].text).toContain('https://');
    expect(SAMPLES[2].text).toMatch(/[0-9]/u);
    expect(SAMPLES[2].text).toMatch(/[۰-۹]/u);
  });

  it('exercises Persian and Arabic letters, all digit sets, punctuation, marks and ZWNJ', () => {
    const text = SAMPLES[3].text;
    for (const character of ['ی', 'ک', 'ي', 'ك', '\u200c', '،', '؛', '؟', '«', '»', '٪', '٬', '٫', 'َ', 'ِ', 'ُ', 'ٔ']) {
      expect(text).toContain(character);
    }
    for (const digit of '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩0123456789') expect(text).toContain(digit);
    expect(text).toContain('می‌روم');
    expect(text).toContain('کتاب‌ها');
  });
});
