import type { CSSProperties } from 'react';
const paths = {
  close: 'm6 6 12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  scale: 'M4 20h16M7 16h10M9 12h6M11 8h2M12 4v0',
  type: 'M4 5h16M12 5v15M8 20h8',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload: 'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  copy: 'M9 9h12v12H9zM15 9V3H3v12h6',
  reset: 'M3 10a9 9 0 1 1 1 9M3 3v7h7',
  help: 'M9 8a3 3 0 0 1 6 0c0 2-3 2-3 5m0 4v0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  moon: 'M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z',
  settings: 'M4 7h16M4 17h16M9 4v6m6 4v6',
  shield: 'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6l-9-4Zm-4 10 3 3 5-6',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 6 5 12 0 18-5-6-5-12 0-18Z',
  print: 'M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7z',
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, size = 18, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}
