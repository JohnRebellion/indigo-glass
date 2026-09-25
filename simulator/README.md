# Sage Ink - Simulator

SvelteKit visual + Playwright preview of all Sage Ink surfaces.
Consolidated from the standalone `~/grub-simulator` repo.

## Surfaces

| Route | Surface |
|---|---|
| `/` | Overview (palette + surface index) |
| `/browser/` | Mock browser w/ feed / marketplace / mail tabs |
| `/sites/` | Index of the 15 Stylus site styles in `browser/stylus/sites/` |
| `/sites/<id>/` | One page per site: the site's **stock** elements (real class names, real custom-property names, stock values) in one lane, the same markup under the shipped `.user.css` in the other. The file is imported raw and wrapped in `@scope`; `e2e/sites.spec.ts` checks every selector in the file has an element in the stock lane, that the ours lane repaints to ink, that no pair overflows, and that the ours lane obeys the Sage Ink structure contract (hard opaque shadows only, no blur or gradient, radius 0 off circles and pills, neobrutal action buttons, hard-edged dialogs and menus — see `browser/stylus/sites/README.md`) |
| `/desktop/<id>/` | One page per local layer (KDE colours, Klassy, Plasma theme, GTK, Konsole, SDDM, GRUB, fonts…): stock file beside the shipped file, coverage of every key, roles checked against the tokens (`e2e/desktop.spec.ts`) |
| `/components/<id>/` | One page per UI component (button, menu, tooltip, text field, list selection, scrollbar, checkbox, tab) drawn by every layer — Qt widgets, Plasma, GTK 3/4, VS Code, the Stylus sites — stock beside Sage Ink. Paints are read back off the DOM and judged against `docs/STATE_GRAMMAR.md` / `docs/ELEVATION.md`; unfixed defects in shipped files are listed as known gaps (`e2e/components.spec.ts`, `src/lib/components/README.md`) |
| `/vscode/` | Mock VSCode workbench (sidebar, tabs, editor, status bar) |
| `/vscode/claude-code/` | Anthropic Claude Code chat panel |
| `/grub/` | GRUB boot picker (full editor, kept from grub-simulator). Draws `share/grub-theme`'s own `menu_*.png` / `select_*.png` pixmaps in the variant its `theme.txt` header names (`orchid_light`, light, since 2026-09-23); run `scripts/sync-grub-parity.sh` after regenerating them. The preset dir is still `presets/sage` (a path, not the variant). The `sfpro-*.pf2` fonts are not in git (Apple licence): `scripts/build-sfpro-pf2.sh` renders them from your own SF Pro install, and without them the preview draws those labels in a fallback face and says so |

## Why a sim

- Visual proof the tokens + density rules + ink material look right
- Playwright snapshot regression: every commit verifies no surface drifts
- Reference target for non-installable surfaces (GRUB live testing slow)
- Single page to show a stakeholder "what Sage Ink is"

## Run

```bash
cd simulator
npm install
npm run dev                  # http://localhost:5173
npm run build && npm run preview
npm run test:e2e             # Playwright snapshots
npm run test:e2e:ui          # interactive
```

## Tokens sync

The simulator reads CSS variables from `tokens/out/css-vars.css`.
After editing `tokens/indigo-glass.tokens.toml`:

```bash
python3 ../tokens/codegen.py    # regenerate tokens/out/*
npm run tokens:sync             # copy generated CSS into src/lib/styles/
```

## Snapshot baselines

Snapshots stored at `e2e/__snapshots__/<test>/<name>-<browser>-<os>.png`.
Update on intentional design change:

```bash
npm run test:e2e -- --update-snapshots
```

## Architecture

- SvelteKit 2 + Svelte 5 (runes mode)
- Static adapter (no SSR runtime)
- Tokens injected as CSS custom properties on `:root`
- Each surface = its own route w/ its own component tree
- No external font loading (uses local OS fonts via CSS stack)
- `prefers-reduced-motion` + `prefers-reduced-transparency` honored

## GRUB simulator lineage

Forked from `~/grub-simulator` (standalone). Original kept for now; this repo
copy is the canonical going forward. Old repo will be archived once snapshot
parity is verified.
