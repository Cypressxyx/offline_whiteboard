# Agents

## Project

Offline-first whiteboard for system design. Single HTML file, no server, no external dependencies.

- **Live site:** https://jfinite.com/whiteboard
- **Repo:** https://github.com/Cypressxyx/offline_whiteboard

## Architecture

- `index.html` — Main app: HTML, CSS, and stateful JS (toolbar, canvas, modals, event handlers)
- `whiteboard.js` — Pure functions extracted for testability (geometry, SVG generation, state encoding)
- `build.js` — Inlines `whiteboard.js` into `index.html`, minifies everything to `dist/index.html`
- `tests/whiteboard.test.js` — Jest tests using jsdom to load the full app and snapshot DOM state

`whiteboard.js` is loaded via `<script src>` in the browser and via `require()` in tests. The build step re-inlines it for production.

App state (boxes, arrows, freeTexts) is exposed via `window._wb` for testing.

## Workflow

Always follow this order:

1. Run `npm run build` first to confirm everything passes before making changes
2. Implement the feature or fix, editing existing files when possible
3. Add snapshot tests in `tests/whiteboard.test.js` for any new functionality
4. Run `npm run build` to verify formatting, linting, tests, and minified build all pass
5. If snapshots need updating after intentional changes: `npm run test:update` then re-run `npm run build`
6. Create a feature branch, commit, push the branch, and open a PR to `main` on GitHub

**Never push directly to `main`.** All changes go through pull requests.

## Commands

- `npm run build` — Full pipeline: format check → lint → test → minify to `dist/`
- `npm run test:update` — Update Jest snapshots after intentional changes
- `npm run format` — Auto-fix formatting
- `open dist/index.html` — Preview the production build locally

## Testing

Tests use jsdom to load the full inlined HTML and interact with the live DOM. Snapshot tests capture HTML output for regression detection.

- DOM snapshots normalize dynamic IDs: `data-id="ID"`, `ft-ID`
- New UI features need snapshot tests that verify the rendered HTML
- Pure functions in `whiteboard.js` get direct unit tests
- For state sharing: create state, encode, load in fresh jsdom instance, compare snapshots

## Code Conventions

- Keep `whiteboard.js` pure — no DOM access, no global state
- Stateful wrappers go in `index.html`'s inline `<script>`
- Expose new functions via `window._wb` for test access
- Use `var` in `whiteboard.js` for broader compatibility; `const`/`let` in `index.html`
- No external runtime dependencies — everything runs offline from a single HTML file
