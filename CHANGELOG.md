# Changelog

Notable changes to NoxaPlus Glyph are recorded here. Application release numbers are separate from the JSON project schema version.

## 1.0.0 - 2026-11-12

Initial public release of the local-first Persian typography lab by NoxaPlus.

### Typography workspace

- Persian RTL interface with RTL/LTR sample direction, prepared texts, a shared editor, and basic character, word, and line counters.
- Three independent comparison cards using embedded variable fonts: Vazirmatn and Noto Sans Arabic at weights 100–900, and Noto Naskh Arabic at 400–700.
- Per-card size 12–96 px, unitless line height 1–2.5, letter spacing −1–4 px, and start/center/end/justify alignment.
- Synchronization with card A that preserves font selections and clamps each weight to the selected font's range.
- An eight-step modular scale with exponents −1 through 6, base 12–24 px, and ratios 1.125, 1.2, 1.25, 1.333, 1.414, and 1.5.
- Pixel-based scale previews and exported rem values calculated against a 16 px root.
- Optional visual guides, light/dark themes, responsive layouts, labeled controls, keyboard focus styling, modal focus management, and reduced-motion styling.

### Export and project handling

- Downloadable/copyable CSS custom properties and `.glyph-specimen-*` / `.glyph-type-*` classes; destination sites supply their own font loading.
- Self-contained, current-view HTML specimens with all three fonts, OFL notices, escaped sample/title text, no executable scripts, and browser-print styling.
- Preview/print through the browser, including PDF output where the browser or operating system provides it; no custom PDF engine.
- Restorable schema-v1 JSON backups with validation and a 2 MiB file-input limit.
- Confirmation before importing a replacement project or resetting the current experiment, including repair of corrupt stored data without bypassing snapshot conflict checks.
- Local autosave after a 250 ms pause, coordinated with Web Locks and exact raw-snapshot conflict checks.
- Storage warnings and retention/download of invalid stored data instead of silent replacement; no automatic conflict merging.

### Distribution and privacy

- Generated repository-root `index.html` for standalone `file://` use, with `app/index.html` reserved for source development.
- HTTPS/localhost production service-worker caching and browser-menu PWA installation where supported.
- No accounts, analytics, uploads, AI service, runtime font CDN, or automatic third-party runtime requests.
- Unencrypted local storage and exports, with JSON backups recommended before browser cleanup or moving the standalone file.
- MIT-licensed application, copyright 2026 NoxaPlus, with separately OFL-licensed fonts and embedded third-party notices; production notice file at `dist/THIRD-PARTY-LICENSES.txt`.

This release is a manual typography comparison tool, not a custom-font uploader, project library, readability scorer, or Unicode glyph-coverage guarantee. Browser-dependent functionality is not universally verified.
