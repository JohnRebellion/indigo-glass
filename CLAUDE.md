# indigo-glass

KDE Plasma first, plus GTK, Konsole, browsers, editors, SDDM, GRUB and Windows Terminal. Repo is `indigo-glass`; the design
system is **Sage Ink**.

## Names

- **Sage Ink** — the default variant. Most shipped files use this name.
- **Indigo Glass** — a selectable variant. The repo, and many paths, keep this name.
- **Lime Glass** — token-only. Values generate into `tokens/out/*.lime.*`, but
  `install.sh` ships no `LimeGlass.colors` or Konsole profile. There is no
  installable Lime option; do not treat it as one.

Name a new path after its declaration site in `codegen.py` or `install.sh`, not
after the files beside it — neighbouring `indigo-glass` names are legacy, so
proximity is not naming authority. Never rename an existing path to match this
rule: `codegen.py` resolves the "Never hand-edit" names by string.

## Source of truth

`tokens/indigo-glass.tokens.toml` (OKLCH, schema v7) is canonical.
`tokens/codegen.py` generates from it into six directories: `tokens/`, `share/`,
`config/`, `browser/`, `windows/` and `vscode/`.

```
python3 tokens/codegen.py
```

Generated output **is committed on purpose** — users install without running codegen.

## Never hand-edit

- `tokens/out/*` — wholly generated.
- `share/color-schemes/SageInk.colors` (`codegen.py:64`), `config/plasma-theme/SageInk/colors` (`:72`),
  `share/color-schemes/IndigoGlass.colors` (`:74`), `windows/terminal/indigo-glass.scheme.json` (`:79`),
  `browser/monkeytype/indigo-glass.json` (`:80`) and `.settings.json` (`:82`).
- `browser/edge-theme/edge-*/manifest.json`, `browser/darkreader/darkreader.*.json`
  and `browser/stylus/out/stylus-import.*.json` (untracked) — per-Edge-profile
  brand-hue artifacts, generated from `[edge_profiles]` in the TOML
  (`SHIPPED_EDGE_THEME_DIR`/`SHIPPED_DARKREADER_DIR`/`STYLUS_OUT_DIR`,
  `codegen.py:1457-1460`). `browser/edge-theme/indigo-glass/` stays hand-kept
  legacy; the launchers no longer load it.
- `vscode/themes/indigo-glass-dark.json` and `-light.json` (`SHIPPED_VSCODE`, `codegen.py:1433`).
  Generated since 2026-09-22 from `tokens/vscode_roles.py`, which holds the role
  MAP; the values stay in the TOML. Edit the map or the tokens, never the themes.
- `simulator/src/lib/palettes.ts` — its header marks it GENERATED.
- `cursor/.work/` — upstream vendor tree, untracked.
- Anything under `research-reports/` — never edit an audit to make an implementation
  look compliant.

## The trap that matters most

`scripts/check-palette-drift.sh:4-7` states it plainly:

> "every layer config is meant to derive from `tokens/out/*` via `codegen.py`. **In
> practice layer configs carry literals typed by hand, and nothing regenerates them.**"

So you **cannot** assume a colour literal in a layer config is generated. To change a
colour: edit the TOML → regenerate → run the drift guard → fix what it reports. Never
find-and-replace a hex value across layers.

## Verify

```
python3 tokens/codegen.py          # regenerate — required after ANY token change
scripts/check-palette-drift.sh     # drift guard — must pass
scripts/test-drift-guard.sh        # only when you have edited the guard itself
scripts/check-deployment.sh        # is the theme actually in use on this host
```

Regenerating is required after any token *value* change, not just a variant
switch — `codegen.py` moves 13 files and the hand-typed layer copies do not
follow. See `docs/ARCHITECTURE.md` for what that cost when the guard missed it.

No CI. `scripts/git-hooks/pre-commit` runs the guard on every commit, wired by
`core.hooksPath=scripts/git-hooks`. That is per-clone local config and is not
tracked, so a fresh clone is **unguarded until it is set**:

    git config core.hooksPath scripts/git-hooks

## Other traps

- Default variant is `default_variant` in the `[meta]` block of the TOML. Change it
  there and regenerate; do not edit output.
- Only accent colours are variant-specific. Spacing, radius, shadow, type and motion
  are variant-agnostic — do not create per-variant copies.
- The simulator is a **web approximation**. Passing its Playwright tests does not
  prove Qt/KWin or GTK rendering is correct.
- The aesthetic is opaque flat ink: **no blur, no gradient, no translucency**. The KWin
  blur effect was deliberately removed from the install path (v5, 2026-08-28). Do not
  reintroduce blur or translucency as an improvement.
