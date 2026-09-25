# Sage Ink - Obsidian theme

Note-taking parity with the KDE/GTK/browser/VSCode layers: same palette, fonts and
compact density. Folder and `manifest.json` are named "Indigo Glass" (the repo's
selectable-variant name, per the root `CLAUDE.md` "Names" section); the theme itself
ships the default **Sage Ink** variant's values.

## Install

```bash
# In your vault root:
mkdir -p .obsidian/themes
cp -r "obsidian/Indigo Glass" .obsidian/themes/
```

Then in Obsidian: Settings -> Appearance -> Themes -> pick "Sage Ink".

Or Windows:
```pwsh
Copy-Item -Recurse "obsidian\Indigo Glass" "$env:USERPROFILE\Documents\YourVault\.obsidian\themes\"
```

## What it themes

- Editor background `#07080A` (`base`) + foreground `#F8F8F8` (`text`)
- Selection = sage overlay `rgba(166,201,166,0.45)` (Tier A content alpha, not a fill)
- Mono code = Iosevka Custom Condensed chain
- Body text = Carlito chain
- Interface chrome = SF Pro Display chain
- Modal/popover/menu/tab-header/sidebar/status-bar = fully opaque ink panels, radius 0
- Floating surfaces (modal/popover/menu) get a hard, opaque 4px offset shadow and a
  `border_strong` (`#5E5E60`) 2px edge - no blur, no translucent shadow anywhere
- Callouts: sage/accent-alt/amber/positive/negative per semantic type
- Compact density: 3-4px row padding, 4/8 input padding, 4/10 button padding
- `*:focus-visible` and on-select rows (`.is-active`/`.is-selected`) are a solid white
  2px outline, not a filled highlight (STATE_GRAMMAR.md Tier C)

## Match font sizes per host

Settings -> Appearance:
- Base font size: 16 (default) or 14 on a compact desktop
- Editor font: `Iosevka Custom Condensed` size 14 (matches the `_default` host's VSCode)
- Interface font: `Carlito` size 14

For Aspire 5 / high-DPI 1080p hosts: bump base font size 18, editor 16.

## Notes

- No blur, no gradient, no translucency anywhere - Sage Ink is opaque flat ink with
  colour-as-elevation (hard offset shadows only). See the repo's `docs/ELEVATION.md`
  and `docs/STATE_GRAMMAR.md`.
- Callout colours mirror the VSCode dark theme's Sage Ink semantic palette.
- Obsidian is not installed on the machine this theme is developed on; verify visually
  on a host that has it before shipping a revision (see `simulator/src/lib/desktop/
  obsidian/index.ts` `live` field for the exact check).

## Previous revision

This file previously described a translucent "Lime Glass" theme (backdrop-blur
panels, a lime accent, "no refraction filters - pure backdrop-blur translucency").
That material language was removed repo-wide 2026-08-28 (see the root `CLAUDE.md`
"Other traps" - blur was deliberately dropped from the whole install path) and
`theme.css` itself has shipped the opaque Sage Ink values described above since;
this README had not been updated to match until 2026-09-25.
