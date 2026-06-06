# Indigo Glass - Obsidian theme

Note-taking parity. Same palette, fonts, density, translucency as VSCode/KDE/browser layers.

## Install

```bash
# In your vault root:
mkdir -p .obsidian/themes
cp -r "obsidian/Indigo Glass" .obsidian/themes/
```

Then in Obsidian: Settings -> Appearance -> Themes -> pick "Indigo Glass".

Or Windows:
```pwsh
Copy-Item -Recurse "obsidian\Indigo Glass" "$env:USERPROFILE\Documents\YourVault\.obsidian\themes\"
```

## What it themes

- Editor background `#0F0F12` + foreground `#F8F8F8` (Indigo Glass canonical)
- Selection = indigo overlay `rgba(94,106,210,0.45)`
- Mono code = Iosevka Custom Condensed chain
- Body text = Carlito chain
- Interface chrome = SF Pro Display chain
- Tabs/sidebar = translucent panel w/ 13px backdrop blur + 70% surface
- Callouts: indigo/violet/amber/positive/negative per semantic
- Compact density: 3-4px row padding, 4/8 input padding, 4/10 button padding
- Reduce-transparency a11y media query: drops blur + raises opacity

## Match font sizes per host

Settings -> Appearance:
- Base font size: 16 (default) or 14 if compact desktop
- Editor font: `Iosevka Custom Condensed` size 14 (matches `_default` host VSCode)
- Interface font: `Carlito` size 14

For Aspire 5 / high-DPI 1080p hosts: bump base font size 18, editor 16.

## Notes

- Uses `prefers-reduced-transparency: reduce` to disable backdrop blur for accessibility
- No refraction filters - pure backdrop-blur translucency
- Callout colors mirror VSCode dark theme + Indigo Glass semantic palette
