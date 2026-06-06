# Indigo Glass - Simulator

SvelteKit visual + Playwright preview of all Indigo Glass surfaces.
Consolidated from the standalone `~/grub-simulator` repo.

## Surfaces

| Route | Surface |
|---|---|
| `/` | Overview (palette + surface index) |
| `/browser/` | Mock browser w/ feed / marketplace / mail tabs |
| `/vscode/` | Mock VSCode workbench (sidebar, tabs, editor, status bar) |
| `/vscode/claude-code/` | Anthropic Claude Code chat panel |
| `/grub/` | GRUB boot picker (full editor, kept from grub-simulator) |

## Why a sim

- Visual proof the tokens + density rules + glass composition look right
- Playwright snapshot regression: every commit verifies no surface drifts
- Reference target for non-installable surfaces (GRUB live testing slow)
- Single page to show a stakeholder "what Indigo Glass is"

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
