# Whiteboard

A minimal, offline-first whiteboard for system design. Single HTML file, no dependencies, works anywhere.

**Live:** [jfinite.com/whiteboard](https://jfinite.com/whiteboard)

## Features

- **Boxes** — Click and drag to create. Double-click (or double-tap on mobile) to edit text.
- **Arrows** — Drag from edge handles to connect boxes. 3 connection points per side.
- **Free Text** — Press `T` to toggle text mode, click anywhere to place text.
- **Step Connectors** — Arrows route with clean right-angle bends.
- **Infinite Canvas** — Pan with space+drag or middle mouse. Zoom with pinch or Ctrl+scroll.
- **29 Themes** — Light, Nord, Dracula, Monokai, Solarized, Solarized Light, Gruvbox, Catppuccin, Tokyo Night, Rose Pine, Matrix, Kanagawa Dragon/Lotus/Wave, One Dark, One Light, GitHub Dark/Light, Ayu Dark/Light, Everforest, Night Owl, Palenight, Synthwave 84, Cobalt2, Vitesse Dark, Poimandres, Vesper, Midnight.
- **Undo/Redo** — `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`, also in the toolbar.
- **Selection** — Marching ants on selected boxes and arrows. Delete with `Backspace`.
- **Save/Load** — Export as JSON or SVG. Import from JSON. Auto-saves to localStorage.
- **Share via URL** — Copy a share link that encodes the full whiteboard state in the URL.
- **Mobile Ready** — Touch support for pan, zoom, drag, and text editing.
- **Fully Offline** — No server, no build step. Just one HTML file.

## Development

```
npm install
npm run build
open dist/index.html
```

This runs formatting, linting, tests, and builds a minified single-file bundle to `dist/index.html`.
