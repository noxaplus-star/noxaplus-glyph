export type FontId = 'vazirmatn' | 'noto-sans' | 'noto-naskh';
export type Alignment = 'start' | 'center' | 'end' | 'justify';
export type TextDirection = 'rtl' | 'ltr';
export type Theme = 'light' | 'dark';
export type View = 'compare' | 'scale';

export interface FontDefinition {
  id: FontId;
  name: string;
  family: string;
  category: string;
  minWeight: number;
  maxWeight: number;
}

export interface Specimen {
  id: 'a' | 'b' | 'c';
  font: FontId;
  size: number;
  weight: number;
  lineHeight: number;
  letterSpacing: number;
  align: Alignment;
}

export interface ScaleSettings {
  base: number;
  ratio: number;
  font: FontId;
  weight: number;
}

export interface GlyphProject {
  version: 1;
  title: string;
  text: string;
  direction: TextDirection;
  specimens: Specimen[];
  scale: ScaleSettings;
  theme: Theme;
  view: View;
}

export interface TextSample {
  id: string;
  name: string;
  label: string;
  text: string;
}

export interface ScaleStep {
  name: string;
  exponent: number;
  pixels: number;
  rem: number;
}

export type ValidationResult = { ok: true; project: GlyphProject } | { ok: false; error: string };
