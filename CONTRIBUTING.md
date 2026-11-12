# Contributing to NoxaPlus Glyph

Thank you for contributing to the public [NoxaPlus Glyph repository](https://github.com/noxaplus-star/noxaplus-glyph). Please follow the [Code of Conduct](CODE_OF_CONDUCT.md). Repository documentation is maintained in English; the application interface is Persian and RTL. Keep the brand name **NoxaPlus** intact in text, UI, and notices.

## Before opening an issue or pull request

- Search existing [issues](https://github.com/noxaplus-star/noxaplus-glyph/issues) and pull requests for related work.
- Read the [README](README.md) for current behavior and intentional limits.
- Discuss significant scope changes in an issue before implementing them. The current tool has exactly three embedded-font comparison cards and one current local project; custom-font uploads, project libraries, AI, scores, and remote services are not existing features.
- Report vulnerabilities privately using [SECURITY.md](SECURITY.md), not a public issue or pull request.

For ordinary bugs, include the application version, operating system, browser/version, whether you used hosted HTTPS, localhost, or `file://`, reproduction steps, and expected versus actual behavior. Include relevant warnings and a minimal non-sensitive sample. Remove private text from screenshots, console output, and JSON backups before posting publicly.

For typography or accessibility reports, identify the selected font and weight, sample direction, card/scale settings, viewport or zoom level, and assistive technology if relevant. Do not describe a browser/font difference as a verified universal behavior without evidence.

## Set up development

Use **Node.js 22.12 or later** and npm:

```sh
git clone https://github.com/noxaplus-star/noxaplus-glyph.git
cd noxaplus-glyph
npm ci
npm run dev
```

For contributions, fork the repository and work on a focused branch in your fork. Open the local address printed by Vite. Dependency installation uses the network; the shipped application's runtime should not require third-party requests.

### Useful source locations

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Workspace, comparison/scale views, controls, dialogs, and confirmed import/reset flows. |
| `src/core/model.ts` | Font definitions, defaults, validation, counters, and modular-scale calculation. |
| `src/core/types.ts` | Project and typography types. |
| `src/core/storage.ts` | Versioned JSON envelope, loading, raw-revision comparison, and storage validation. |
| `src/hooks/useProject.ts` | React project state, debounced autosave, Web Locks, warnings, and recovery state. |
| `src/core/export.ts` | CSS classes/tokens, escaped HTML specimens, print styles, and filenames. |
| `src/fonts.ts` | Embedded font CSS and OFL notices. |
| `src/components/` | Reusable controls, icons, and modal behavior. |
| `src/styles.css` | Responsive layout, themes, focus styling, and reduced-motion support. |
| `app/index.html` | Source entry consumed by Vite; not the standalone distribution. |
| `public/sw.js` | Production application-shell caching. |
| `scripts/sync-standalone.mjs` | Generated root HTML and production license notices. |

Follow the existing TypeScript/React style. Keep validation and export logic in the core modules rather than duplicating it in UI handlers. Validate imported data as untrusted input, preserve the sample without automatic normalization, and keep user-controlled text out of generated executable code or unescaped markup.

## Checks

Run the following before requesting review:

```sh
npm test
npm run typecheck
npm run build
```

Vitest tests live alongside the core modules as `*.test.ts`. Add or update focused tests for behavior changes, especially project validation, malformed imports, text preservation, storage conflicts, corrupt-data retention, scale rounding, export escaping, and safe filenames. Automated unit tests do not establish compatibility across all browsers.

Additional commands:

- `npm run test:watch`: rerun tests during development.
- `npm run preview`: serve an existing production build locally.
- `npm run icons`: regenerate icons when changing icon assets; do not regenerate them for unrelated changes.

Builds write `dist/`, regenerate the root `index.html`, and create `dist/THIRD-PARTY-LICENSES.txt`. Edit source files rather than the generated root HTML. For application changes, rebuild and include the updated standalone root file as appropriate so the checked-in double-click application stays in sync. Do not include `node_modules/` or unrelated generated files.

### Manual verification for relevant changes

- Open the generated root `index.html` directly from disk and check for missing assets or startup errors.
- Check a served production build on HTTPS/localhost; verify offline reload only after successful service-worker caching. Development mode does not register the production service worker.
- Check comparison and scale modes, both themes, narrow/wide layouts, and both sample directions.
- Use keyboard-only navigation, labeled controls, visible focus, modal Tab/Shift+Tab handling, Escape behavior, and focus restoration. Check reduced-motion behavior when changing animations.
- Confirm that synchronization with A preserves fonts and clamps Noto Naskh Arabic weights to 400–700.
- Verify pixel preview versus 16 px-based rem export, including rounding and the eight scale exponents. Check that compact HTML headings agree with the UI's first-nonempty-line selection, including samples with leading blank lines.
- Export CSS and use its actual classes in a page with separately loaded fonts. Open the self-contained HTML offline and test browser printing with long/mixed-direction text.
- Export/reimport JSON, reject malformed or over-limit input, and verify that canceling import/reset leaves the project unchanged.
- Test competing tabs, unavailable Web Locks/storage, and corrupt saved JSON. Confirm that ordinary autosave retains invalid raw data and that an explicitly confirmed valid import or reset repairs it without requiring a user to delete storage manually.
- Inspect production network activity for accidental remote fonts, analytics, or text transmission. Do not add third-party runtime calls without prior design discussion.

Record only the browsers and routes actually checked; do not claim all-browser verification. If a check cannot be performed, say so in the pull request.

## Pull-request guidance

Keep the change small and explain the problem, approach, tests, and any limitations. Link the related issue if there is one. Include screenshots for UI changes with non-sensitive sample content, and update English documentation when behavior changes. Avoid unrelated source formatting, configuration churn, dependency upgrades, or generated assets.

The repository has CI and GitHub Pages workflows that install dependencies, run tests, and build. Passing CI is useful but does not replace checks of the standalone file, offline behavior, exports, and accessibility for relevant changes.

Do not commit secrets, personal samples, credentials, or private project backups. Preserve license notices. Changes to bundled fonts must retain the applicable SIL Open Font License, copyright statements, and notices in both embedded artifacts and the production notice file. The application is MIT-licensed; the font licenses are separate.

Unless you explicitly state otherwise and discuss it with the maintainers, contributions you submit are offered under the repository's MIT application license. Third-party contributions must carry compatible licensing and their own required notices. Use original work or clearly identify its source and license.

## Contact

- General questions and suggestions: [GitHub Issues](https://github.com/noxaplus-star/noxaplus-glyph/issues).
- Security concerns: private email per [SECURITY.md](SECURITY.md).
- NoxaPlus contact: [NoxaPlus2025@gmail.com](mailto:NoxaPlus2025@gmail.com).
- Official website: [https://www.noxaplus.ir](https://www.noxaplus.ir).
