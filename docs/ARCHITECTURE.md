# Architecture

How the repository generates, ships and guards its theme assets. For the design
rationale see [`PHILOSOPHY.md`](PHILOSOPHY.md); for colours, install steps and
known bugs see [`REFERENCE.md`](REFERENCE.md).

## Naming

The repository is called `indigo-glass`; the design system is called **Sage Ink**.
The repo predates the rename and several filenames still carry the old name
(`windows/terminal/indigo-glass.scheme.json`, `browser/monkeytype/indigo-glass.json`)
while shipping the *active* variant, not the Indigo Glass one. `codegen.py:71-74`
documents this explicitly. Treat `indigo-glass` as an address, not a description.

## Source of truth

```
tokens/indigo-glass.tokens.toml      schema version 6, OKLCH
```

Every layer's concrete config is meant to derive from this file.
`tokens/codegen.py` (1301 lines) reads it and writes derived assets.

Variants live only in `[variants.<name>]`. Colour is the only thing that varies —
spacing, radius, shadow, typography and motion are variant-agnostic and shared.
`[meta].default_variant` selects which variant resolves into the unsuffixed
outputs; every variant also gets its own suffixed copy.

## What codegen actually writes

`codegen.py` writes into five top-level directories: `tokens/`, `share/`,
`config/`, `browser/`, `windows/`.

Generated token outputs land in `tokens/out/` as CSS custom properties, SCSS and
JSON, once unsuffixed (the active default) and once per variant
(`css-vars.sage.css`, `css-vars.indigo.css`, `css-vars.lime.css`).

Named shipped targets, with their declaration sites:

| Target | Declared at |
|---|---|
| `share/color-schemes/SageInk.colors` | `tokens/codegen.py:60` |
| `config/plasma-theme/SageInk/colors` | `tokens/codegen.py:68` |
| `share/color-schemes/IndigoGlass.colors` | `tokens/codegen.py:70` |
| `windows/terminal/indigo-glass.scheme.json` | `tokens/codegen.py:75` |
| `browser/monkeytype/indigo-glass.json` | `tokens/codegen.py:76` |
| `browser/monkeytype/indigo-glass.settings.json` | `tokens/codegen.py:77` |

**This is the load-bearing nuance:** only the files above are regenerated.
Most layer configs carry literals typed by hand and nothing regenerates them.
`scripts/check-palette-drift.sh:4-7` says so in its own header. Consistency
across layers is enforced by the drift guard, *not* by the generator.

All generated outputs are committed, so the installer works without ever running
`codegen.py`.

## Build and install

```bash
# 1. optional — only needed after changing [meta].default_variant
python3 tokens/codegen.py

# 2. install
bash scripts/install.sh          # 535 lines
```

## Verification

| Check | File | What it proves |
|---|---|---|
| Palette + material drift | `scripts/check-palette-drift.sh` (734 lines) | every layer config still matches the tokens; fails the build on mismatch |
| Deployment | `scripts/check-deployment.sh` (368 lines) | the theme is actually live on this system |
| Simulator | `simulator/` (SvelteKit + Playwright) | rendered palettes match the generated token files |

The simulator reads generated tokens directly rather than copying them —
`simulator/src/lib/palettes.ts:3` records that it is generated from
`codegen.py`, `simulator/src/lib/nb/liveTokens.ts:5` reads
`tokens/out/css-vars.css`, and `simulator/src/lib/styles/density-optin.css:9`
maps `tokens/out/density.css` to the TOML spacing section. Passing the simulator
is necessary but not sufficient: it cannot verify Qt/KWin or GTK rendering.

The drift guard is at v2 (2026-08-28), rewritten after an audit found v1
reporting "clean" while three shipped themes were still on Lime Glass. That
failure is the reason the guard exists in its current form.

## Invariants

- `tokens/indigo-glass.tokens.toml` is the single source of truth.
- `scripts/check-palette-drift.sh` must pass for a build to be valid.
- Generated assets are tracked in git; those tracked files are what `install.sh`
  installs.
- Variants differ in accent colour only.
- No blur, gradient or translucent surface anywhere. Because nothing is
  translucent there is nothing to blur, so the KWin blur engine was removed from
  the install path (v5, 2026-08-28).

## Tracked file counts per layer directory

```
share 107   config 40   browser 23   vscode 13   windows 7   sddm 5
hosts 4     shell 3     obsidian 3   spicetify 3 cursor 2    jetbrains 2
vencord 2   iso 0
```

`iso/` carries no tracked files — the GRUB/ISO theme is built, not committed.
`windows/` is tracked and real: the system is not KDE-only.
