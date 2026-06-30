# Lime Glass - Discord (Vencord / BetterDiscord)

Single `.theme.css` file w/ `@name` `@description` metadata. Works on Vencord, BetterDiscord, Goosemod.

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

## What it overrides

- Discord's `theme-dark` / `theme-darker` / `theme-pureBlack` CSS vars
- All `--background-*` -> Lime Glass palette
- `--brand-experiment-*` (blurple) -> `#5E6AD2` indigo
- Compact channel list (1px gaps, 4/8 padding)
- Compact message list (8px horizontal)
- Code blocks -> Iosevka Custom Condensed
- Prose -> Carlito w/ IndigoLoopTail loop-tail g/a
- Selection + scrollbar + focus ring -> indigo
- Honors `prefers-reduced-transparency: reduce`

## Notes

- Discord's Vencord ships its own theme schema. We follow the standard BetterDiscord `.theme.css` header (works in both).
- Does NOT replace the Discord client mascot/logo (theme-only, not asset-swap).
- Mentioned messages get a soft indigo backdrop instead of blurple.
