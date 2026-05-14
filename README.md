# Indigo Glass

> Cross-platform design system for KDE Plasma 6.6+ — a hybrid of **visionOS spatial glass**, **Linear app dark discipline**, and **Neumorphism 2.0** (selective tactility).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Plasma](https://img.shields.io/badge/KDE_Plasma-6.6%2B-1d99f3.svg)
![Wayland](https://img.shields.io/badge/Wayland-supported-5E6AD2.svg)

---

## What it is

A complete, cohesive visual identity that spans:

- **KDE Plasma desktop** — Klassy window decoration, kwin-effects-better-blur-dx, IndigoGlass color scheme
- **GTK applications** — WhiteSur-Dark-purple theme + libadwaita indigo CSS
- **Konsole terminal** — IndigoGlass profile with violet cursor, Iosevka Custom Condensed
- **Shell prompt** — Starship config with indigo segments
- **Greeter** — Fastfetch with minimal indigo display
- **GRUB bootloader** (optional) — matching amber-on-indigo theme with SF Pro fonts
- **Web frontend** (bonus) — Tailwind v4 `@theme` block for matching SvelteKit/Next.js portfolios

All layers reference the **same color tokens**, so terminal accents match window selections match GTK buttons match webapp buttons.

---

## Color palette

```
Base           #0F0F12     Dark surface
Surface        #1C1C21     Window bg
Surface+1      #1F2028     Elevated panels, glass base
Sidebar        #18181C     Sidebar bg

Indigo         #5E6AD2     Linear primary — selection, buttons
Indigo+1       #818CF8     Hover, focus, active link
Violet         #A78BFA     Visited link, accent decoration
Amber          #FBBF24     Semantic warning
Positive       #71F79F     Success
Negative       #ED254E     Error, destructive

Text primary   #F8F8F8
Text muted     #6B7280
```

---

## Aesthetic philosophy

### Three references blended

**visionOS spatial design** → Frosted glass surfaces with backdrop blur. Color applied AS A TINT to the glass material, not behind it. Depth via shadow falloff, not borders.

**Linear app discipline** → Cognitive linearity. Single accent color used sparingly. Typography hierarchy through weight, not size. Near-black `#0F0F12` (NOT pure black) base. Subtle gradients on dark surfaces.

**Neumorphism 2.0** → Soft pillowy shadows on **interactive elements only** (buttons, sliders, toggles). NEVER on text, nav, or backgrounds (accessibility lessons from 2020-2024 neumorphism collapse).

### Accent rules

- **One primary accent** (`#5E6AD2` indigo) used sparingly
- **One semantic warm accent** (`#FBBF24` amber) for warnings only — never decorative
- **Three text colors max** — primary, muted, inactive

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
6. Patches kdeglobals + kwinrc with IndigoGlass scheme + Klassy decoration + better-blur-dx settings
7. Adds global window opacity rule (88% active / 85% inactive)
8. Reloads KWin + plasmashell

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
| Color scheme | `share/color-schemes/IndigoGlass.colors` | Copy to `~/.local/share/color-schemes/` |
| Konsole scheme | `share/konsole/IndigoGlass.colorscheme` | Copy to `~/.local/share/konsole/` |
| Konsole profile | `share/konsole/IndigoGlass.profile` | Copy to `~/.local/share/konsole/` |
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

- `@theme` block with all Indigo Glass tokens
- Glass utilities: `.glass`, `.glass-subtle`, `.glass-strong`
- Neumorphic utilities: `.neu-raised`, `.neu-pressed`
- Indigo glow: `.glow-indigo`, `.glow-indigo-lg`
- Display typography: `.text-display`
- Auto scrollbar + selection + focus ring styling

```html
<!-- visionOS Liquid Glass card -->
<div class="glass p-6 rounded-lg">
  <h2 class="text-display">Hello world</h2>
  <button class="neu-raised glow-indigo">Click</button>
</div>
```

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
| General UI | **Nunito** | Humanist rounded — neumorphic-friendly |
| Window title / Menu / Toolbar | **SF Pro Display** | Apple-system, glass-aware |
| Fixed / Mono / Konsole | **JetBrainsMono Nerd Font** (or Iosevka if available) | Coding |

Two-family discipline: humanist rounded for content + geometric sharp for chrome.

> **Note:** The author's personal config uses **Iosevka Custom Condensed** for monospace and **SF Pro Display** for chrome — but both are proprietary/custom. The public version defaults to **JetBrainsMono Nerd Font** (open-source) and falls back to system Inter/SF Pro if available.

---

## Known limitations (Plasma 6.6 — April 2026)

| Issue | Workaround |
|---|---|
| Kickoff popup solid (Plasma QML hardcodes background) | Wait Plasma 6.7 (June 2026) or use Application Dashboard widget |
| Edge/Chromium context menu solid (Skia native widget) | Use Falkon/Firefox if matching aesthetic critical |
| Custom plasma themes (kite-indigo, MacSonoma-Dark) trigger FBO crashes | Stay on `breeze-dark` plasma theme — translucent context menus sacrificed |
| KDE-Rounded-Corners plugin causes GL_INVALID_VALUE crashes | Disabled; Klassy titlebar handles top corners |
| Stock KWin blur fails on Klassy titlebars | Use better-blur-dx fork |

See [`docs/REFERENCE.md`](docs/REFERENCE.md) Bugs 6-9 for full diagnoses + recovery commands.

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
