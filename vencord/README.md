# Sage Ink - Discord (Vencord / BetterDiscord)

Single `.theme.css` file w/ `@name`/`@description` metadata. Works on Vencord,
BetterDiscord, Goosemod - same palette, fonts and compact density as the
KDE/GTK/browser/VSCode/Obsidian layers. File is named `indigo-glass.theme.css`
(the repo's selectable-variant name); the theme itself ships the default
**Sage Ink** variant's values.

## Install

### Vencord

1. Open Discord -> User Settings -> Vencord -> Themes
2. Click "Open Themes Folder"
3. Drop `indigo-glass.theme.css` in
4. Toggle on

Or via online URL:
```
https://raw.githubusercontent.com/JohnRebellion/indigo-glass/main/vencord/indigo-glass.theme.css
```
Paste into Vencord Themes -> Online -> Add URL.

### BetterDiscord

Same flow, themes folder at:
- Linux: `~/.config/BetterDiscord/themes/`
- Windows: `%APPDATA%\BetterDiscord\themes\`

## What it themes

- Discord's `.theme-dark` / `.theme-darker` / `.theme-pureBlack` CSS vars, via a
  small `--ig-*` intermediate ramp: `base` `#07080A`, `surface` `#0D0D10`,
  `surface_alt` `#121216`, `sidebar` `#0A0A0D`, `accent`/`accent_hi`
  (`#A6C9A6`/`#C0E3C0`), `accent_alt` `#89A889`, `amber` `#FBBF24`, `positive`
  `#3FFABB`, `negative` `#F42E53`, `text`/`text_muted` (`#F8F8F8`/`#7F8695`)
- `--brand-experiment-*` (Discord blurple) -> the sage accent triple
- Popouts/tooltips/modals: fully opaque, radius 0, `border_strong` (`#5E5E60`)
  2px edge, hard opaque 4px offset shadow - no blur, no translucent shadow
- Brand/danger button labels: ink (`#07080A`), not white - both fills clear
  `docs/ELEVATION.md`'s on-light luminance threshold (0.179), so a white label
  fails contrast (see `[class*="button"][class*="colorBrand/colorDanger"]`)
- Compact channel list (1px gaps, 4/8 padding) and message list (8px horizontal)
- Code blocks -> Iosevka Custom Condensed; prose -> Carlito w/ IndigoLoopTail
  loop-tail g/a
- Selection + scrollbar + focus ring -> sage/white per `docs/STATE_GRAMMAR.md`
- `--background-modifier-active`/`-selected`/`-accent`: Discord's own on-click/
  on-select clickable-item fills, kept as opaque flat composites (Tier D) since
  Discord's real DOM classes are hash-obfuscated and rotate every release -
  there is no stable selector to attach a real outline to instead, unlike
  Obsidian's `.is-active`/`.is-selected`

## Notes

- No blur, no gradient, no translucency anywhere except the one deliberate Tier
  A transient hover wash (`--background-modifier-hover`) - Sage Ink is opaque
  flat ink with colour-as-elevation. See `docs/ELEVATION.md`/`docs/STATE_GRAMMAR.md`.
- Discord is installed on the primary dev host (flatpak `com.discordapp.Discord`)
  but Vencord/BetterDiscord is not, so this theme has never been loaded in a
  real client on that machine; verify visually before shipping a revision (see
  `simulator/src/lib/desktop/vencord/index.ts`'s `live` field for the exact
  install/verify steps).
- Does NOT replace the Discord client mascot/logo (theme-only, not asset-swap).

## Previous revision

This file previously described a translucent "Lime Glass" theme (`#A8E635`
lime accent, "honors `prefers-reduced-transparency: reduce`" as if translucency
were the default). That material language was removed repo-wide 2026-08-28
(see the root `CLAUDE.md` "Other traps" - blur was deliberately dropped from
the whole install path) and `indigo-glass.theme.css` itself has shipped the
opaque Sage Ink values described above since; this README had not been updated
to match until 2026-09-25.
