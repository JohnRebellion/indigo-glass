# indigo-glass

KDE Plasma first, plus GTK, Konsole, browsers, editors, SDDM, GRUB and Windows Terminal. Repo is `indigo-glass`; the design
system is **Sage Ink**.

## Names

- **Sage Ink** — the default variant. Most shipped files use this name.
- **Indigo Glass** — a selectable variant. The repo, and many paths, keep this name.
- **Lime Glass** — token-only. Values generate into `tokens/out/*.lime.*`, but
  `install.sh` ships no `LimeGlass.colors` or Konsole profile. There is no
  installable Lime option; do not treat it as one.

When generating a new path, match the surrounding directory's name, not the repo name.

## Source of truth

`tokens/indigo-glass.tokens.toml` (OKLCH, schema v6) is canonical.
`tokens/codegen.py` generates from it into five directories: `tokens/`, `share/`,
`config/`, `browser/`, `windows/`.

```
python3 tokens/codegen.py
```

Generated output **is committed on purpose** — users install without running codegen.

## Never hand-edit

- `tokens/out/*` — wholly generated.
- `share/color-schemes/SageInk.colors` (`codegen.py:60`), `config/plasma-theme/SageInk/colors` (`:68`),
  `share/color-schemes/IndigoGlass.colors` (`:70`), `windows/terminal/indigo-glass.scheme.json` (`:75`),
  `browser/monkeytype/indigo-glass.json` (`:76`) and `.settings.json` (`:77`).
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
python3 tokens/codegen.py          # regenerate
scripts/check-palette-drift.sh     # drift guard — must pass
scripts/check-deployment.sh        # is the theme actually in use on this host
```

There is no `.github/` and no CI of any kind. Tests exist; nothing runs them but you.

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
