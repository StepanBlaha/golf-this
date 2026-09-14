# Little Links / Mini Golf Postcard

Idea #216: a minimalist isometric course builder and playable one-hole golf postcard. React, TypeScript, Vite. No accounts or backend.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:4319.

```sh
npm test
npm run build
```

Deploy `dist/` to any static host. Course data is embedded in the URL fragment, so recipients need no account and the course payload is not sent to the server. Localhost links only work on this machine; public sharing needs a deployed URL.

## Play and build

Choose a tool and click a tile. Move the tee and flag, add blocks, sand, or water. Undo supports the last 25 edits. Three starter layouts are included. Keyboard users can focus tiles and press Enter/Space.

In Play mode, drag backwards anywhere on the board and release to putt. Alternatively adjust the aim and power sliders and activate Putt. Blocks and edges bounce; sand slows; water offers a drop with one penalty stroke. A slow ball near the cup completes the hole. Send this course copies a link that opens directly in Play mode. If clipboard access is blocked, a selectable link is shown.

The course is saved locally when storage is available. Shared layouts are validated before loading. No analytics or remote fonts.

## Code

- `src/App.tsx`: builder, SVG isometric rendering, game controls, sharing.
- `src/course.ts`: types, presets, projection, link validation.
- `src/physics.ts`: bounded ball simulation and collision rules.
- `src/physics.test.ts`: course links, hazards, stopping and cup detection.


## Metadata and launch configuration

Set the production HTTPS `url`, `hostingProvider`, and `hostingPrivacyUrl` in `site.config.json`. Review the privacy page against the host's actual logging, retention, and processing practices before launching. Run `npm run check:launch` and `npm run build`. Metadata is regenerated before development and production builds. Incomplete configuration keeps robots and metadata set to noindex and the sitemap empty. No production hostname is guessed.

`npm run generate:og` regenerates the 1200 × 630 social image. Legal pages are static `/terms.html` and `/privacy.html`, with footer links. Manifest and touch icons are generated from the favicon. Course links use URL fragments and share the same static social preview.
