# Architecture

How the repository generates, ships and guards its theme assets. For the design
rationale see [`PHILOSOPHY.md`](PHILOSOPHY.md); for colours, install steps and
known bugs see [`REFERENCE.md`](REFERENCE.md).

## Naming

The repository is called `indigo-glass`; the design system is called **Sage Ink**.
The repo predates the rename and several filenames still carry the old name
(`windows/terminal/indigo-glass.scheme.json`, `browser/monkeytype/indigo-glass.json`)
while shipping the *active* variant, not the Indigo Glass one. `codegen.py:71-73`
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
across layers is therefore enforced by the drift guard, *not* by the generator
— which makes any gap in the guard indistinguishable, from the outside, from
having no drift at all.

That is not hypothetical. Until 2026-09-16 the guard had exactly such a gap:
changing an accent value and regenerating moved 13 files, left 31 tracked files
on the superseded hex — `config/gtk-3.0/gtk.css`, `config/gtk-4.0/gtk.css`,
`config/starship.toml` and `share/konsole/SageInk.profile` among them — and
still printed `clean`. The CURRENCY scan closes it, and
`scripts/test-drift-guard.sh` is the regression test that keeps it closed.
Treat the guard's coverage as a claim that needs its own test, not as a
property of having a guard.

All generated outputs are committed, so the installer works without ever running
`codegen.py`.

## Build and install

```bash
# 1. required after ANY change to tokens/indigo-glass.tokens.toml —
#    a changed value, not just a changed [meta].default_variant.
python3 tokens/codegen.py

# 2. required: regeneration moves 13 files; the hand-typed copies in the
#    other layers do not move with them. The guard is what finds those.
bash scripts/check-palette-drift.sh

# 3. install
bash scripts/install.sh          # 538 lines
```

Skipping step 1 leaves canonical source and committed generated assets out of
sync. Skipping step 2 leaves the generated assets correct and the hand-typed
layers stale — which is the more expensive of the two, because everything
that reports on the build still looks healthy.

## Verification

| Check | File | What it proves |
|---|---|---|
| Palette + material drift | `scripts/check-palette-drift.sh` (821 lines) | every layer config still matches the tokens; fails the build on mismatch. Six scans: colour, currency, material, alpha, parity, shadow |
| Drift-guard self-test | `scripts/test-drift-guard.sh` | the guard actually fails when a token changes and the layers do not follow. Run it after editing the guard |
| Deployment | `scripts/check-deployment.sh` (368 lines) | the theme is actually live on this system |
| Simulator | `simulator/` (SvelteKit + Playwright) | rendered palettes match the generated token files |
| Pre-commit | `scripts/git-hooks/pre-commit` | the guard ran before a commit landed — **only if** `core.hooksPath=scripts/git-hooks` is set in that clone. It is local config, untracked, so every new clone starts unguarded |

The simulator reads generated tokens directly rather than copying them —
`simulator/src/lib/palettes.ts:3` records that it is generated from
`codegen.py`, `simulator/src/lib/nb/liveTokens.ts:5` reads
`tokens/out/css-vars.css`, and `simulator/src/lib/styles/density-optin.css:9`
maps `tokens/out/density.css` to the TOML spacing section. Passing the simulator
is necessary but not sufficient: it cannot verify Qt/KWin or GTK rendering.

The drift guard is at v5 (2026-09-16). v2 (2026-08-28) was itself a rewrite,
after an audit found v1 reporting "clean" while three shipped themes were still
on Lime Glass. v5 exists because v2's successors reproduced that same failure
against a different input: a variant that keeps its name and changes its value.
The pattern is worth naming — each version of this guard has been correct about
the drift it was told to look for and silent about the drift it was not, so the
guard's own coverage is now under test rather than under review.

## Invariants

- `tokens/indigo-glass.tokens.toml` is the single source of truth.
- `scripts/check-palette-drift.sh` must pass for a build to be valid.
- Any change to the guard must keep `scripts/test-drift-guard.sh` passing.
- Generated assets are tracked in git; those tracked files are what `install.sh`
  installs.
- Variants differ in accent colour only.
- No blur, gradient or translucent surface anywhere. Because nothing is
  translucent there is nothing to blur, so the KWin blur engine was removed from
  the install path (install.sh v5, 2026-08-28 — unrelated to the drift guard's
  own v5 above).

## Tracked file counts per layer directory

```
share 107   config 40   browser 23   vscode 13   windows 7   sddm 5
hosts 4     shell 3     obsidian 3   spicetify 3 cursor 2    jetbrains 2
vencord 2   iso 0
```

`iso/` carries no tracked files — the GRUB/ISO theme is built, not committed.
`windows/` is tracked and real: the system is not KDE-only.
