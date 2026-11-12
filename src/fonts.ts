import vazirmatnCss from '@fontsource-variable/vazirmatn/index.css?raw';
import sansCss from '@fontsource-variable/noto-sans-arabic/index.css?raw';
import naskhCss from '@fontsource-variable/noto-naskh-arabic/index.css?raw';
import vazArabic from '@fontsource-variable/vazirmatn/files/vazirmatn-arabic-wght-normal.woff2?inline';
import vazLatin from '@fontsource-variable/vazirmatn/files/vazirmatn-latin-wght-normal.woff2?inline';
import vazLatinExt from '@fontsource-variable/vazirmatn/files/vazirmatn-latin-ext-wght-normal.woff2?inline';
import sansArabic from '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-arabic-wght-normal.woff2?inline';
import sansLatin from '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-latin-wght-normal.woff2?inline';
import sansLatinExt from '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-latin-ext-wght-normal.woff2?inline';
import sansMath from '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-math-wght-normal.woff2?inline';
import sansSymbols from '@fontsource-variable/noto-sans-arabic/files/noto-sans-arabic-symbols-wght-normal.woff2?inline';
import naskhArabic from '@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-arabic-wght-normal.woff2?inline';
import naskhLatin from '@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-latin-wght-normal.woff2?inline';
import naskhLatinExt from '@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-latin-ext-wght-normal.woff2?inline';
import naskhMath from '@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-math-wght-normal.woff2?inline';
import naskhSymbols from '@fontsource-variable/noto-naskh-arabic/files/noto-naskh-arabic-symbols-wght-normal.woff2?inline';
import vazirmatnLicense from '../node_modules/@fontsource-variable/vazirmatn/LICENSE?raw';
import notoSansLicense from '../node_modules/@fontsource-variable/noto-sans-arabic/LICENSE?raw';
import notoNaskhLicense from '../node_modules/@fontsource-variable/noto-naskh-arabic/LICENSE?raw';

const fontFiles: Record<string, string> = {
  'vazirmatn-arabic-wght-normal.woff2': vazArabic,
  'vazirmatn-latin-wght-normal.woff2': vazLatin,
  'vazirmatn-latin-ext-wght-normal.woff2': vazLatinExt,
  'noto-sans-arabic-arabic-wght-normal.woff2': sansArabic,
  'noto-sans-arabic-latin-wght-normal.woff2': sansLatin,
  'noto-sans-arabic-latin-ext-wght-normal.woff2': sansLatinExt,
  'noto-sans-arabic-math-wght-normal.woff2': sansMath,
  'noto-sans-arabic-symbols-wght-normal.woff2': sansSymbols,
  'noto-naskh-arabic-arabic-wght-normal.woff2': naskhArabic,
  'noto-naskh-arabic-latin-wght-normal.woff2': naskhLatin,
  'noto-naskh-arabic-latin-ext-wght-normal.woff2': naskhLatinExt,
  'noto-naskh-arabic-math-wght-normal.woff2': naskhMath,
  'noto-naskh-arabic-symbols-wght-normal.woff2': naskhSymbols,
};
export const FONT_LICENSES = `Vazirmatn\n${vazirmatnLicense}\n\nNoto Sans Arabic\n${notoSansLicense}\n\nNoto Naskh Arabic\n${notoNaskhLicense}`;
export const FONT_CSS = [vazirmatnCss, sansCss, naskhCss]
  .map((css) => css.replace(/url\(\.\/files\/([^)]+)\)/g, (_match, file: string) => `url("${fontFiles[file]}")`)
    .replaceAll('Vazirmatn Variable', 'Vazirmatn').replaceAll('Noto Sans Arabic Variable', 'Noto Sans Arabic').replaceAll('Noto Naskh Arabic Variable', 'Noto Naskh Arabic'))
  .join('\n') + `\n/* ${FONT_LICENSES.replaceAll('*/', '* /')} */`;
