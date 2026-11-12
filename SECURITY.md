# Security Policy

## Scope and supported versions

This policy covers the public [NoxaPlus Glyph project](https://github.com/noxaplus-star/noxaplus-glyph), its generated standalone application, hosted application, project import/storage handling, and exports.

| Version | Security maintenance |
| --- | --- |
| 1.0.x | Current release line; use the latest available release. |
| Other versions or modified builds | No security-maintenance commitment. |

Security fixes are prioritized according to impact and available maintainer capacity. There is no guaranteed response time, support term, bounty program, or independent security certification.

## Report a vulnerability privately

Email **[NoxaPlus2025@gmail.com](mailto:NoxaPlus2025@gmail.com)** with a subject such as **“NoxaPlus Glyph security report”**. Do not publish a vulnerability, exploit, or sensitive sample in GitHub Issues or a pull request before coordinated disclosure.

Please include:

- The affected application version and whether it is the root standalone file, hosted production app, or a development/custom build.
- Browser/version, operating system, and origin type: HTTPS, localhost, or `file://`.
- A concise impact description, reproduction steps, and a minimal non-sensitive proof of concept.
- Relevant import, export, or storage behavior, and whether user interaction is required.
- Any suggested mitigation and your preferred attribution, if you want credit.

Use synthetic sample text. Do not send passwords, credentials, private project backups, or another person's data. Ordinary email is not an encrypted reporting channel; contact NoxaPlus before sharing particularly sensitive material. Keep testing limited to your own files, browser profiles, or environments you are authorized to assess. Do not target GitHub infrastructure or other users.

NoxaPlus will assess reports, investigate reproducible issues, and coordinate mitigation and disclosure where feasible. Please allow investigation before publishing technical details. If you do not receive a reply, send a follow-up to the same address; no fixed response deadline is promised.

## Security and privacy model

NoxaPlus Glyph is local-first, not a secure vault:

- Sample text, settings, and JSON imports are processed in the browser. There are no accounts, analytics, uploads, AI services, or automatic third-party runtime requests.
- The hosted application must initially be downloaded from GitHub Pages. Production service-worker requests are same-origin; hosting and external links have their own privacy/security policies.
- The root standalone HTML contains the application and fonts. The application itself executes JavaScript; exported **specimen** HTML is distinct and contains no executable scripts.
- Browser `localStorage`, downloaded JSON, and specimen HTML are **not encrypted**. People or software with access to the device, profile, or files may read them. Untrusted extensions and compromised browsers/devices are outside the application's protection boundary.
- JSON imports are schema-validated, the file input is limited to 2 MiB, and replacement requires explicit confirmation. Validation reduces malformed-input risk but is not a guarantee that every possible issue has been excluded.
- HTML export escapes user-controlled sample text and titles. Font CSS is trusted internal build input, not an arbitrary user upload. CSS exports contain typography settings rather than free-form sample text or titles.
- Autosave uses Web Locks and exact raw-revision comparisons to avoid accidental competing-tab overwrites. These are consistency safeguards, not encryption, authentication, access control, or collaborative conflict resolution.
- Invalid stored data is retained for recovery and ordinary autosave pauses. Keep raw-data and current-project backups before confirming an import or reset.
- Service-worker caching enables offline operation on supported HTTPS/localhost production origins. `file://` storage and browser APIs vary, and cached versions can persist until updated.

Never assume that a local-only workflow makes confidential content safe on a shared or compromised device. Review exported HTML/JSON before sharing; they contain the sample text. Dependency installation and build tools are separate from the shipped runtime and may access package registries.

## Safe handling and updates

Use releases from the [official repository](https://github.com/noxaplus-star/noxaplus-glyph) or the [hosted application](https://noxaplus-star.github.io/noxaplus-glyph/), and keep your browser updated. Back up the project as JSON before replacing the standalone file, clearing browser storage, or clearing a service-worker cache. Imported backups are data, not executable extensions; there is no custom-font upload or plugin system.

For non-security bugs, including ordinary font rendering or browser-print differences, use [GitHub Issues](https://github.com/noxaplus-star/noxaplus-glyph/issues) with a non-sensitive reproduction. Report potentially exploitable import/export handling or unauthorized data exposure privately instead.

**NoxaPlus** · [https://www.noxaplus.ir](https://www.noxaplus.ir) · [NoxaPlus2025@gmail.com](mailto:NoxaPlus2025@gmail.com)
