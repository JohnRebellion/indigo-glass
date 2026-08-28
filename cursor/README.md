# Sage Ink - Cursor

Bibata cursor (theme name `Bibata-IndigoGlass`, a heritage name kept stable
across colour migrations) recolored with `#A6C9A6` Sage Ink accent.

## Build

```bash
bash build-bibata.sh
```

Requires: `git`, `python3` w/ `clickgen`, `xcursorgen`. Script clones Bibata upstream, sed-replaces accent colors, builds via `clickgen ctgen`, outputs to `out/Bibata-IndigoGlass/`.

Takes ~3-5min on a desktop CPU.

## Install (per-user)

```bash
cp -r out/Bibata-IndigoGlass ~/.local/share/icons/
kwriteconfig6 --file kcminputrc --group Mouse --key cursorTheme 'Bibata-IndigoGlass'
# Log out + back in
```

## Notes

- Inherits from `Bibata-Modern-Classic`. Falls back gracefully if some glyphs missing.
- Default Bibata accent (`#80B4FF` / `#3F8AE5`) replaced with Sage Ink `#A6C9A6`.
- Outline color swapped to deep near-black `#07080A`; base fill to `#F8F8F8`.
- Size auto-handled by Bibata's multi-resolution PNG pipeline.

## Why a script + not pre-built tarball

Bibata SVG sources are MIT but the upstream binary releases ship with their default accent. Custom recolors are easy with sed, but redistributing pre-built XCursor binaries means tracking upstream Bibata version bumps. Script approach = always builds against latest Bibata.
