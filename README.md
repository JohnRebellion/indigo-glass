# Lime Glass

> Cross-platform design system for KDE Plasma 6.6+ — a hybrid of **brutalist-glass**, **Linear app dark discipline**, and **Neumorphism 2.0** (selective tactility).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Plasma](https://img.shields.io/badge/KDE_Plasma-6.6%2B-1d99f3.svg)
![Wayland](https://img.shields.io/badge/Wayland-supported-A8E635.svg)

---

## What it is

A complete, cohesive visual identity that spans:

- **KDE Plasma desktop** — Klassy window decoration, kwin-effects-better-blur-dx, LimeGlass color scheme
- **GTK applications** — WhiteSur-Dark theme + libadwaita accent CSS
- **Konsole terminal** — LimeGlass profile with lime cursor, Iosevka Custom Condensed
- **Shell prompt** — Starship config with lime segments
- **Greeter** — Fastfetch with minimal lime display
- **GRUB bootloader** (optional) — matching amber-on-lime theme with SF Pro fonts
- **Web frontend** (bonus) — Tailwind v4 `@theme` block for matching SvelteKit/Next.js portfolios

All layers reference the **same color tokens**, so terminal accents match window selections match GTK buttons match webapp buttons. The default variant is **Lime Glass**; **Indigo Glass** is preserved as a selectable variant (see [Variants](#variants)).

---

## Color palette

Default variant — **Lime Glass** (values from `tokens/out/css-vars.lime.css`):

```
Base           #07080A     Raycast-deep near-black (OLED-safe)
Surface        #0D0D10     Window bg
Surface+1      #121216     Elevated panels, glass base
Sidebar        #0A0A0D     Sidebar bg

Accent         #A8E635     Ghost-lime primary — selection, buttons
Accent+1       #C1FF58     Hover, focus, active link
Accent-alt     #8BC406     Active, decoration, visited link
Amber          #FBBF24     Semantic warning
Positive       #71F79F     Success
Negative       #ED254E     Error, destructive

Text primary   #F8F8F8
Text muted     #6B7280
```

Lime `#A8E635` on base `#07080A` = **13.39:1** (AAA). On light surfaces (the
VSCode light theme) a darker lime ladder is used — lime is illegible on white.

The Indigo Glass heritage variant (`#5E6AD2` accent) ships alongside — see
[Variants](#variants).

---

## Aesthetic philosophy

### Three references blended

**visionOS spatial design** → Frosted glass surfaces with backdrop blur. Color applied AS A TINT to the glass material, not behind it. Depth via shadow falloff, not borders.

**Linear app discipline** → Cognitive linearity. Single accent color used sparingly. Typography hierarchy through weight, not size. Near-black `#07080A` (NOT pure black) base. Subtle gradients on dark surfaces.

**Neumorphism 2.0** → Soft pillowy shadows on **interactive elements only** (buttons, sliders, toggles). NEVER on text, nav, or backgrounds (accessibility lessons from 2020-2024 neumorphism collapse).

### Accent rules

- **One primary accent** (`#A8E635` ghost-lime in the default variant) used sparingly
- **One semantic warm accent** (`#FBBF24` amber) for warnings only — never decorative
- **Three text colors max** — primary, muted, inactive
- **On-accent text is contrast-picked** — lime is light, so text sitting on the accent (selections, primary buttons) is near-black `#07080A`, not white. Codegen enforces this per variant.

The single-accent discipline is variant-relative: whichever variant is active, exactly one decorative accent hue is used. Swap the variant, and the rule still holds — just with a different hue.

---

## Installation

### Prerequisites

- Linux distro with KDE Plasma 6.6+ (tested: Fedora 43, Nobara 43)
- Wayland session (X11 untested)
- Git, build-essential

### One-shot install

```bash
git clone https://github.com/JohnRebellion/indigo-glass.git
cd indigo-glass
bash scripts/install.sh
```

The installer:

1. Installs system packages (qt6-dev, kf6-dev, starship, fastfetch, etc.)
2. Builds **Klassy** v6.5.3 from source
3. Builds **kwin-effects-better-blur-dx** from source (the only blur fork stable on Plasma 6.6)
4. Installs **WhiteSur-Dark-purple** GTK theme + **Tela-circle-purple-dark** icons
5. Copies all configs (Klassy, GTK, Konsole, Starship, Fastfetch)
6. Patches kdeglobals + kwinrc with LimeGlass scheme + Klassy decoration + better-blur-dx settings
7. Installs + enables `kwin-blur-watchdog.service` (re-loads blur after suspend — Bug 10)
8. Adds global window opacity rule (88% active / 85% inactive)
9. Reloads KWin + plasmashell

### Manual / themes-only install

If you just want themes without rebuilding compositor effects:

```bash
bash scripts/install.sh --themes-only
```

### GRUB theme (optional)

Install the matching boot screen — backs up `/etc/default/grub`, points it at the bundled theme, and runs `grub2-mkconfig`:

```bash
bash scripts/install.sh --with-grub --themes-only
```

See [share/grub-theme/README.md](share/grub-theme/README.md) for details.

### Dry run

See what would happen without making changes:

```bash
bash scripts/install.sh --dry-run
```

---

## Manual integration

For users who want to merge selectively without running the script:

| Component | File | Action |
|---|---|---|
| Color scheme (default) | `share/color-schemes/SageInk.colors` | Copy to `~/.local/share/color-schemes/` |
| Color scheme (heritage) | `share/color-schemes/IndigoGlass.colors` | Copy to `~/.local/share/color-schemes/` |
| Konsole scheme (default) | `share/konsole/SageInk.colorscheme` | Copy to `~/.local/share/konsole/` |
| Konsole scheme (heritage) | `share/konsole/IndigoGlass.colorscheme` | Copy to `~/.local/share/konsole/` |
| Konsole profile (default) | `share/konsole/SageInk.profile` | Copy to `~/.local/share/konsole/` |
| Konsole profile (heritage) | `share/konsole/IndigoGlass.profile` | Copy to `~/.local/share/konsole/` |
| Klassy config | `config/klassy/klassyrc` | Copy to `~/.config/klassyrc` |
| Starship | `config/starship.toml` | Copy to `~/.config/starship.toml` |
| Fastfetch | `config/fastfetch/config.jsonc` | Copy to `~/.config/fastfetch/config.jsonc` |
| GTK 3 settings | `config/gtk-3.0/settings.ini` | Copy to `~/.config/gtk-3.0/settings.ini` |
| GTK 3 css | `config/gtk-3.0/gtk.css` | Copy to `~/.config/gtk-3.0/gtk.css` |
| GTK 4 settings | `config/gtk-4.0/settings.ini` | Copy to `~/.config/gtk-4.0/settings.ini` |
| GTK 4 css | `config/gtk-4.0/gtk.css` | Copy to `~/.config/gtk-4.0/gtk.css` |
| Plasma session env | `config/plasma-workspace/env/gtk.sh` | Copy to `~/.config/plasma-workspace/env/gtk.sh` |
| KWin snippets | `config/kwin/kwinrc.snippets` | **Merge** into `~/.config/kwinrc` (don't replace) |
| Shell snippets | `shell/zshrc-snippet.zsh` etc. | **Append** to your shell rc |

---

## Web portfolio adoption (bonus)

If you have a SvelteKit / Next.js / Astro portfolio with Tailwind v4, copy `web/app.css.example` content into your main CSS file. Provides:

- `@theme` block with all Lime Glass tokens
- Glass utilities: `.glass`, `.glass-subtle`, `.glass-strong`
- Neumorphic utilities: `.neu-raised`, `.neu-pressed`
- Accent glow: `.glow-accent`, `.glow-accent-lg` (legacy aliases `.glow-indigo*` still resolve to the active accent)
- Display typography: `.text-display`
- Auto scrollbar + selection + focus ring styling

```html
<!-- visionOS Liquid Glass card -->
<div class="glass p-6 rounded-lg">
  <h2 class="text-display">Hello world</h2>
  <button class="neu-raised glow-accent">Click</button>
</div>
```

---

## Variants

The palette is multi-variant. Colors live only in `[variants.<name>]` in
`tokens/indigo-glass.tokens.toml`; everything else (spacing, radius, blur,
type, motion, glass) is variant-agnostic. `tokens/codegen.py` reads
`[meta].default_variant`, resolves it into the default outputs, **and** emits
one file per variant.

| Variant | Accent | Base | Status |
|---|---|---|---|
| **Lime Glass** (`lime`) | `#A8E635` ghost-lime | `#07080A` | **default** |
| **Indigo Glass** (`indigo`) | `#5E6AD2` | `#0F0F12` | heritage |

Per-variant generated files live in `tokens/out/` as `*.lime.*` / `*.indigo.*`
(e.g. `css-vars.lime.css`, `kde-palette.indigo.colors`, `wt-scheme.lime.json`).
The unsuffixed files (`css-vars.css`, …) are copies of the active default.

### Switching the default variant

1. Set `default_variant = "indigo"` in `[meta]` of `tokens/indigo-glass.tokens.toml`.
2. Regenerate: `python3 tokens/codegen.py`.
3. Re-run `bash scripts/install.sh` (or copy the per-variant files you need).

### Selecting a variant per layer (without changing the default)

- **KDE color scheme:** `plasma-apply-colorscheme LimeGlass` or `IndigoGlass`
  (both installed by `install.sh`).
- **Konsole:** pick the `LimeGlass` or `IndigoGlass` profile.
- **VSCode:** choose *Lime Glass Dark/Light* or the indigo theme in the theme picker.
- **CSS/web:** import `css-vars.lime.css` or `css-vars.indigo.css` directly.

---

## Stack

| Layer | Tool |
|---|---|
| Window decoration | [Klassy](https://github.com/paulmcauley/klassy) v6.5.3 |
| KWin blur engine | [kwin-effects-better-blur-dx](https://github.com/xarblu/kwin-effects-better-blur-dx) |
| GTK theme | [WhiteSur](https://github.com/vinceliuice/WhiteSur-gtk-theme) (purple variant) |
| Icon theme | [Tela-circle](https://github.com/vinceliuice/Tela-circle-icon-theme) (purple-dark) |
| Plasma theme | breeze-dark (safe — see [REFERENCE.md](docs/REFERENCE.md) Bug 7) |
| Shell prompt | [Starship](https://starship.rs) |
| Greeter | [Fastfetch](https://github.com/fastfetch-cli/fastfetch) |
| Cursor | breeze_cursors (default) |

---

## Fonts

| Role | Font | Reason |
|---|---|---|
| General UI | **Carlito** | Humanist with double-storey loop-tail g — matches Iosevka mono allograph |
| Window title / Menu / Toolbar | **SF Pro Display** | Apple-system, glass-aware |
| Fixed / Mono / Konsole | **Iosevka Custom Condensed** → **MesloLGS NF** → **JetBrainsMono Nerd Font** → monospace | Coding |

Two-family discipline: humanist rounded for content + geometric sharp for chrome.

### Canonical mono cascade (every coding context)

Same fallback chain everywhere code is rendered or typed:

```
Iosevka Custom Condensed   (private ss18 build — double-storey g)
→ Iosevka Custom
→ MesloLGS NF              (Powerlevel10K-default Nerd Font)
→ JetBrainsMono Nerd Font  (broad Nerd Font glyph coverage)
→ Cascadia Code
→ Fira Code
→ Consolas
→ monospace
```

Applied to:
- **VSCode** — `editor.fontFamily` (user setting)
- **VSCode Claude Code** — webview mono selectors via patch-webview-css.sh
- **Konsole** — `IndigoGlass.profile Font=`
- **KDE / kdeglobals** — `fixed=Iosevka Custom Condensed`
- **Stylus universal** — every web `code/pre/textarea/.monaco-editor/.CodeMirror/.cm-editor/.ace_editor`, plus Monkeytype `.word`, GitHub `.blob-code`, StackOverflow `.s-code-block`
- **GRUB** — N/A (boot picker is display-only, no mono content)

The fallback chain is consistent so font installation order doesn't matter; the highest-priority installed font wins.

> **Note:** The author's personal config uses **Iosevka Custom Condensed** for monospace and **SF Pro Display** for chrome — both bundled in `share/fonts/indigo-glass-fonts.zip` (see browser/README.md for install).

---

## Known limitations (Plasma 6.6 — April 2026)

| Issue | Workaround |
|---|---|
| Kickoff popup solid (Plasma QML hardcodes background) | Wait Plasma 6.7 (June 2026) or use Application Dashboard widget |
| Edge/Chromium context menu solid (Skia native widget) | Use Falkon/Firefox if matching aesthetic critical |
| Custom plasma themes (kite-indigo, MacSonoma-Dark) trigger FBO crashes | Stay on `breeze-dark` plasma theme — translucent context menus sacrificed |
| KDE-Rounded-Corners plugin causes GL_INVALID_VALUE crashes | Disabled; Klassy titlebar handles top corners |
| Stock KWin blur fails on Klassy titlebars | Use better-blur-dx fork |
| better-blur-dx silently unloads after suspend/resume | `kwin-blur-watchdog.service` re-loads it on resume (installed by install.sh) |

See [`docs/REFERENCE.md`](docs/REFERENCE.md) Bugs 6-10 for full diagnoses + recovery commands.

---

## Documentation

- [`docs/REFERENCE.md`](docs/REFERENCE.md) — Full reference: colors, layers, install steps, all known bugs, recovery
- [`docs/PHILOSOPHY.md`](docs/PHILOSOPHY.md) — Design rationale: why visionOS + Linear + Neumorphism

---

## Uninstall / rollback

```bash
# KDE — revert to defaults
plasma-apply-colorscheme BreezeDark
plasma-apply-lookandfeel -a org.kde.breezedark.desktop
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "library" "org.kde.breeze"
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "theme" "Breeze"
kwriteconfig6 --file kwinrc --group "Plugins" --key "better_blur_dxEnabled" "false"
kwriteconfig6 --file kwinrc --group "Plugins" --key "blurEnabled" "true"
qdbus-qt6 org.kde.KWin /KWin reconfigure
kquitapp6 plasmashell && kstart plasmashell &

# GTK
gsettings set org.gnome.desktop.interface gtk-theme 'Adwaita-dark'
gsettings set org.gnome.desktop.interface icon-theme 'Adwaita'

# Shell — manually remove appended snippets from ~/.zshrc / ~/.bashrc / ~/.profile
```

---

## Contributing

Pull requests welcome. Particularly interested in:

- Distro-specific installer paths (Arch AUR, openSUSE, Ubuntu/Pop!\_OS)
- Web framework adapters (Astro, Next.js, Nuxt, Solid)
- Editor themes (VSCode, Neovim, JetBrains, Sublime, Zed)
- Browser themes (Firefox userChrome.css, Edge stylesheet, Vivaldi)
- Screenshots / showcases

---

## Credits

Built on top of:

- **Klassy** by Paul McAuley
- **kwin-effects-better-blur-dx** by xarblu / Fadouse / taj-ny
- **WhiteSur** + **Tela-circle** by Vince Liuice
- **Starship** prompt
- **Fastfetch**

Design philosophy synthesizes work from:

- Apple visionOS Human Interface Guidelines
- Linear.app design system
- 2020-2025 neumorphism evolution (UX Planet, Webflow, BigHuman analyses)

---

## License

MIT. Use it, fork it, remix it.
