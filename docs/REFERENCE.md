# Sage Ink — Cross-Platform Design System
**Full reference for from-scratch rebuild + troubleshooting**

**Scope:** KDE Plasma 6.6 desktop, GTK apps, terminal (Konsole + Starship + Fastfetch), portfolio web (`~/portfolio/web` — SvelteKit + Tailwind v4)

*Last updated: 2026-08-28*
*Tested on: Nobara Linux 43, Plasma 6.6.4, KDE Frameworks 6.25.0, Wayland, AMD RX 7600 XT*

---

## Aesthetic Goal

**Neobrutalist ink** + Linear app dark discipline. Reference: The Verge's `DESIGN.md` (see [Sources](#sources-used)).

**Core formula:**
- Deep dark base (`#07080A`) — near-black, not pure black
- **Opaque flat fields.** No blur, no translucency, no tint film, no grain, no ambient orbs
- **Colour-as-elevation** — depth is a fill colour or a 1px hairline
- **A hard offset shadow** — `8px 8px 0 0`, zero blur radius
- **Square corners** — radius `0` everywhere, with a pill step for the CTA and `2px` for tags
- Sharp geometric typography (Linear-style)
- Sage `#A6C9A6` single accent (OKLCH `L 0.80 / C 0.06 / H 145.0`), fill-only
- Amber `#FBBF24` semantic warning only

The design intent behind each of these is in [PHILOSOPHY.md](PHILOSOPHY.md); the numbers are in `tokens/indigo-glass.tokens.toml`, which is the single source of truth for every value on this page.

---

## Color Palette (Sage default — canonical, used by all layers)

> Values here are the Sage default variant, from `tokens/out/css-vars.sage.css`. The Lime and Indigo heritage variants ship alongside — see the root README "Variants" section. A variant chooses a hue, not a material: all three render in ink.

```
Base:            #07080A     Deep near-black
Surface:         #0D0D10     Window bg
Surface+1:       #121216     Elevated panels
Sidebar:         #0A0A0D     Sidebar bg
Border:          rgba(255,255,255,0.06)   hairline
Border+:         rgba(255,255,255,0.10)   hairline, hover
Accent:          #A6C9A6     Sage primary — selection, button fills
Accent+1:        #C0E3C0     Hover, focus, active link
Accent-alt:      #89A889     Visited link, accent decoration, ink_accent shadow
Amber:           #FBBF24     Semantic warning
Positive:        #3FFABB     Success  (sage-only hue nudge — see below)
Negative:        #ED254E     Error, destructive
Text primary:    #F8F8F8
Text muted:      #6B7280
Text dim:        #4B5563
```

Sage accent OKLCH hue is **145.0** at chroma **0.06** — deliberately low-chroma and pale, where lime ran chroma `0.2049`. Contrast on base is **11.00:1**.

**Sage is fill-only.** It is `1.72:1` against `--text`, so it can never carry body text. Text on an accent fill is contrast-picked to near-black `#07080A` (codegen enforces this per variant — see the `[Colors:Selection]` group below).

`positive` is `#3FFABB` in this variant only: at the shared hue `152.51` it sat 7.5° from sage and stopped reading as a distinct status colour, so it was nudged +12.49° to `165.0`. Lime and Indigo keep `#71F79F` — their accents already clear it.

### Where each color lives

| Color | KDE | GTK4 | Konsole | Starship | Fastfetch | Klassy | Portfolio (Tailwind) |
|---|---|---|---|---|---|---|---|
| `#07080A` Base | View bg | view_bg | bg | bg_0 | - | - | --color-base |
| `#0D0D10` Surface | Window bg | window_bg | - | bg_1 | - | - | --color-surface |
| `#121216` Surface+1 | Window alt | headerbar, card, popover, dialog | - | bg_2 | - | - | --color-surface-elevated |
| `#A6C9A6` Accent | Selection | accent_bg | - | accent | - | (via scheme) | --color-accent |
| `#C0E3C0` Accent+1 | Decoration | accent | Color4 | accent_light | keys | OnAllDesktops btn | --color-accent-hi |
| `#89A889` Accent-alt | Link | link_color, violet_color | Color5 | accent_alt | title | Shadow colour | --color-accent-alt |
| `#FBBF24` Amber | Neutral | warning | Color3 | amber | - | Min btn | --color-amber |
| `#ED254E` Negative | Negative | destructive | Color1 | - | - | Close btn | --color-negative |
| `#3FFABB` Positive | Positive | success | Color2 | - | - | Max btn | --color-positive |

**RGB equivalents (for KDE color schemes and Klassy):**
- `#A6C9A6` = `166,201,166`
- `#C0E3C0` = `192,227,192`
- `#89A889` = `137,168,137`
- `#FBBF24` = `251,191,36`

### Material tokens

| Token | Value | Use |
|---|---|---|
| `shadow.ink` | `8px 8px 0 0 #000000` | The default — card, button, terminal |
| `shadow.ink_lg` | `14px 14px 0 0 #000000` | Feature tiles, hero cards |
| `shadow.ink_press` | `0 0 0 0 #000000` | Pressed — shadow collapses as the object travels into it |
| `shadow.ink_accent` | `8px 8px 0 0 #89A889` | Hazard-coloured ink shadow (derived from `accent_alt`) |
| `shadow.hairline` | `0 0 0 1px rgba(255,255,255,0.10)` | Quiet dividers where even ink is too loud |
| `radius.default` | `0` | Every material surface |
| `radius.xs` | `2` | Tags, small badges — the one soft step ink permits |
| `radius.full` | `9999` | Circles, pill CTA only |
| `opacity.window_active/inactive` | `1.00` | Ink windows are opaque |
| `motion.roles.ink_press` | `60ms steps(2, end)` | "A stamp, not a spring" |

> **On the shadow offsets.** They were doubled on 2026-08-28 (4px → 8px, 7px → 14px). The token file is explicit that this is a **taste call** — a deliberately chunkier read at normal viewing distance on a 27in 1440p / ~109ppi panel — and **not** a DPI-accuracy correction, which would have warranted only ~1.13x over a 96dpi baseline since this display runs at Plasma scale 1. The same doubling was applied to the CSS strings, codegen's `ink_accent` literal, and the Klassy C++ patch, so all three stay consistent.

There is no `[blur]` table and no `[glass]` / `[ambient]` block: they were deleted on 2026-08-28. Do not reintroduce them per-surface — see [Material is a constraint](PHILOSOPHY.md#material-is-a-constraint-not-a-preference).

---

## Current boundary vs planned scope

**This matters for anyone reading the screenshots and wondering why parts of the desktop are not ink.**

Sage Ink today is a **tint and configuration layer on top of third-party themes**, not a ground-up toolkit theme. Concretely:

| Toolkit | What Sage Ink owns today | What renders in someone else's material |
|---|---|---|
| **Qt / Plasma** | Colour scheme (`[Colors:*]`), Klassy window decoration (patched), fonts, density, radius | The Plasma desktop theme is **`breeze-dark`** — every SVG-driven surface it paints: the application launcher, panel popups, tooltips, OSDs, notification chrome |
| **GTK 3 / 4** | `gtk.css` colour overrides, and (new) an ink card/popover rule | The base theme is **`WhiteSur-Dark-purple`** — widget geometry, borders, and the macOS-derived rounding and shading it ships |
| **Icons** | Nothing | **`Tela-circle-purple-dark`** |

So: native desktop chrome is **not ink today**. It is Breeze and WhiteSur wearing sage-coloured paint. A Breeze popup with soft rounded corners sitting next to an inked application window is the expected current state, not a bug to hunt.

### Planned

The decision has been taken to close this gap by **taking full ownership of both toolkits**:

1. **A real Plasma Desktop Theme package** (`share/plasma/desktoptheme/sage-ink/`) — so the launcher, popups, tooltips and OSDs are painted from Sage Ink SVGs rather than Breeze's, and native chrome becomes genuinely ink.
2. **A GTK base theme** — replacing WhiteSur-Dark-purple outright rather than overriding its colours, so GTK widget geometry (corners, borders, shadows) is ink rather than macOS-derived.

**Neither exists yet.** `share/` currently contains `color-schemes/`, `konsole/`, `fonts/` and `grub-theme/` — there is no `desktoptheme/` and no GTK theme package. Until those ship, the table above is the accurate description of the system's reach. Do not read the roadmap as current state.

---

## Component Stack — Full Layer Diagram

| Layer | Tool/Setting | File |
|---|---|---|
| Window decoration | **Klassy** v6.5.3, **patched** for the hard ink shadow | `~/.config/kwinrc [org.kde.kdecoration2]` |
| Window button layout | XIA left, M right | same — `ButtonsOnLeft=XIA, ButtonsOnRight=M` |
| Window corner radius | **0** — square | `~/.config/klassyrc [Windeco] WindowCornerRadius=0` |
| Window shadow | `ShadowSmall`, strength 255, colour = `accent_alt` | `~/.config/klassyrc [ShadowStyle]` — from `tokens/out/klassy-radius.ini` |
| Plasma desktop theme | **breeze-dark** — third-party, not ink (see [scope boundary](#current-boundary-vs-planned-scope)) | `~/.config/plasmarc [Theme] name=breeze-dark` |
| Color scheme | **Sage Ink** (renamed 2026-08-28; was `LimeGlass.colors` with sage values, kept under the old name pending this rename) | `~/.local/share/color-schemes/SageInk.colors` |
| Widget style (Qt) | **Klassy** | `~/.config/kdeglobals [KDE] widgetStyle=Klassy` |
| LookAndFeel | **org.kde.breezedark.desktop** (neutral) | `~/.config/kdeglobals [KDE] LookAndFeelPackage` |
| KWin blur engine | **OFF** — `better_blur_dxEnabled=false`, `blurEnabled=false` | `~/.config/kwinrc [Plugins]` |
| KWin background contrast | **OFF** — `backgroundcontrastEnabled=false`; applies blur+contrast to any client-marked region (every Plasma popup/panel) independent of the theme's own opacity settings | `~/.config/kwinrc [Plugins]` |
| Window opacity | **100% / 100%** — ink windows are opaque | `[opacity].window_active` / `window_inactive` |
| Rounded corners | **DISABLED** — radius is 0 anyway | `~/.config/kwinrc [Plugins] kwin4_effect_shapecornersEnabled=false` |
| Icon theme | **Tela-circle-purple-dark** — third-party, not ink | `~/.config/kdeglobals [Icons] Theme` |
| Cursor theme | breeze_cursors (optional Bibata Modern Ice) | `~/.config/kcminputrc` |
| GTK theme | **WhiteSur-Dark-purple** — third-party base, not ink | `~/.config/gtk-3.0/settings.ini`, `~/.config/gtk-4.0/settings.ini` |
| GTK env override | `GTK_THEME=WhiteSur-Dark-purple` | `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.config/plasma-workspace/env/gtk.sh` |
| libadwaita accent + ink cards | sage override CSS + `box-shadow: 8px 8px 0 0` on `card`, `popover > contents` | `~/.config/gtk-4.0/gtk.css` |
| Konsole color scheme | Sage Ink | `~/.local/share/konsole/SageInk.colorscheme` |
| Konsole profile | Sage Ink (Iosevka Custom Condensed, accent cursor) | `~/.local/share/konsole/SageInk.profile` |
| Shell prompt | Starship (replaces P10K) | `~/.config/starship.toml` |
| Greeter | Fastfetch (replaces neofetch) | `~/.config/fastfetch/config.jsonc` |
| Edge launch flags | Wayland + system decorations | `~/.local/share/applications/microsoft-edge.desktop` |
| Panel widgets | windowbuttons (id=43), appmenu (id=44), windowtitle (id=26) | `~/.config/plasma-org.kde.plasma.desktop-appletsrc` |

---

## Fonts

Sizes below are the `_default` host profile (27" 1440p, 109 DPI). Other hosts scale per `hosts/*.toml` — see [TYPOGRAPHY.md](TYPOGRAPHY.md).

| Role | Font | Size | Reason |
|---|---|---|---|
| General UI | **Carlito** | 11pt | Humanist with double-storey loop-tail g (matches Iosevka mono) |
| Window title | **SF Pro Display** | 11pt | Geometric, sharp against a square titlebar |
| Menu | SF Pro Display | 11pt | Match titlebar |
| Toolbar | SF Pro Display | 10pt | Hierarchy |
| Smallest | SF Pro Display | 9pt | Hierarchy |
| Fixed/Mono | **Iosevka Custom Condensed** | 11pt | Coding |
| Konsole | Iosevka Custom Condensed | 11pt | `hosts/_default.toml [konsole] font_size = 11` — the body anchor |

> The shipped `share/konsole/SageInk.profile` currently sets `Font=…,10`, which matches neither the host profile (11) nor the value this document previously claimed (13). Treat `hosts/_default.toml` as canonical and the profile as stale.

**Two-family discipline:**
- Carlito (humanist, double-storey loop-tail g) → app content
- SF Pro Display (geometric) → window chrome

---

## Phase 1 — Package Install (Fedora/Nobara)

```bash
# Build deps for Klassy
sudo dnf install -y cmake extra-cmake-modules \
  qt6-qtbase-devel qt6-qtdeclarative-devel qt6-qtsvg-devel qt6-qttools-devel \
  kdecoration-devel kf6-kguiaddons-devel kf6-kiconthemes-devel \
  kf6-kwidgetsaddons-devel kf6-kwindowsystem-devel kf6-kcoreaddons-devel \
  kf6-kconfig-devel kf6-kcmutils-devel kf6-kglobalaccel-devel \
  kf6-kdbusaddons-devel kf6-kpackage-devel kf6-kirigami-devel \
  kf6-kirigami-addons-devel kf6-kcrash-devel kf6-kio-devel \
  kf6-knotifications-devel kwin-devel git

# Standard packages
sudo dnf install -y starship fastfetch papirus-icon-theme \
  gtk-murrine-engine gnome-themes-extra appmenu appmenu-glib-translator \
  applet-window-buttons jetbrainsmono-nerd-fonts

# COPR repos
sudo dnf copr enable -y matinlotfali/KDE-Rounded-Corners
sudo dnf install -y kwin-effect-roundcorners

# (Optional) hazel-bunny ricing repo
sudo dnf copr enable -y hazel-bunny/ricing
```

---

## Phase 2 — Build Klassy from Source

Klassy ships Plasma 6.3+ branch — works on 6.6.

```bash
mkdir -p ~/src && cd ~/src
git clone --depth 1 https://github.com/paulmcauley/klassy.git
cd klassy
mkdir build && cd build
cmake .. \
  -DCMAKE_INSTALL_PREFIX=/usr \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_TESTING=OFF \
  -DKDE_INSTALL_USE_QT_SYS_PATHS=ON \
  -DBUILD_QT5=OFF \
  -DBUILD_QT6=ON
make -j$(nproc)
sudo make install
```

**Before `make`: apply the ink-shadow patch.** Edit `~/src/klassy/kdecoration/breezedecoration.cpp` so that `s_shadowParams[1]` (the `"Small"` preset) renders a single hard `offset(8, 8)` / `radius(0)` / `opacity(1.0)` layer, with the second layer zeroed. Stock Klassy has no shadow-offset setting, so this is the only route to the ink shadow — see [`~/.config/klassyrc`](#configklassyrc) below for the full explanation. Leave `s_shadowParams[0]` (`ShadowNone`) alone.

Verify:
```bash
ls /usr/lib64/qt6/plugins/org.kde.kdecoration3/ | grep klassy
# Should show: org.kde.klassy.so
```

**If build fails:** Plasma upgrade may have broken ABI. Check Klassy's branch list — pin to one matching your Plasma version.

---

## Phase 3 — Install Themes

### WhiteSur GTK theme (purple variant)

Either use pre-installed `WhiteSur-Dark-purple` from `~/.themes/`, or rebuild:

```bash
cd /tmp && rm -rf WhiteSur-gtk-theme
git clone --depth 1 https://github.com/vinceliuice/WhiteSur-gtk-theme.git
cd WhiteSur-gtk-theme
./install.sh -c Dark -t purple -m -N glassy
```

Generates: `WhiteSur-Dark-purple` in `~/.themes/`.

> These flags are unchanged from the glass era, `-N glassy` (glassy nav buttons) included. WhiteSur is a **third-party base** whose own material Sage Ink does not currently control, so the flag choice is not load-bearing for the ink system — but it is also not ink. Replacing this theme outright is the GTK half of the [planned scope](#current-boundary-vs-planned-scope).

### Tela-circle icons (purple variant)

```bash
cd /tmp && rm -rf Tela-circle-icon-theme
git clone --depth 1 https://github.com/vinceliuice/Tela-circle-icon-theme.git
cd Tela-circle-icon-theme
./install.sh -a -d ~/.local/share/icons
```

### Plasma themes (already installed via Klassy + Vince Liuice)

Klassy installs:
- `kite-dark`, `kite-light` (auto)

Manual:
- MacSonoma-Dark (manually copied from `~/.local/share/plasma/desktoptheme/`)
- Orchis-dark from `https://github.com/vinceliuice/Orchis-kde`

### Panel Colorizer v7 plasmoid

```bash
cd /tmp && rm -rf panel-colorizer
git clone --depth 1 https://github.com/luisbocanegra/plasma-panel-colorizer.git
cd panel-colorizer
kpackagetool6 --type Plasma/Applet --remove luisbocanegra.panel.colorizer
kpackagetool6 --type Plasma/Applet -i package
```

---

## Phase 4 — Configuration Files

> **Naming lag.** The KDE colour scheme and the Konsole profile still ship under the filename and `Name=` **`LimeGlass`**, while carrying Sage values. Renaming them means every installed machine's `kdeglobals [General] ColorScheme` and `konsolerc DefaultProfile` breaks until re-applied, so the rename has not been done. The `Name=` string is heritage; the RGB triples are current. `tokens/out/kde-palette.sage.colors` is generated with `Name=SageInk` and is the file whose *values* are canonical.

### `~/.local/share/color-schemes/SageInk.colors`

Full file: see the shipped `share/color-schemes/SageInk.colors`. Values are merged from the generated `tokens/out/kde-palette.sage.colors`.

Key values (all groups):
```ini
[General]
ColorScheme=LimeGlass
Name=LimeGlass

[Colors:Selection]
BackgroundNormal=166,201,166     # #A6C9A6 sage
BackgroundAlternate=192,227,192  # #C0E3C0
ForegroundNormal=7,8,10          # #07080A — contrast-picked: sage is a light
ForegroundActive=7,8,10          #   fill, so on-accent text is near-black
DecorationFocus=166,201,166
DecorationHover=192,227,192

[Colors:Window]
BackgroundNormal=13,13,16        # #0D0D10
BackgroundAlternate=18,18,22     # #121216 (depth — colour-as-elevation)
ForegroundNormal=248,248,248     # #F8F8F8
ForegroundActive=192,227,192     # sage accent
ForegroundNeutral=251,191,36     # AMBER (warning) — semantic
ForegroundPositive=63,250,187    # #3FFABB — sage-only hue nudge
ForegroundNegative=237,37,78     # #ED254E

[WM]
activeBackground=18,18,22
activeForeground=248,248,248
inactiveBackground=13,13,16
inactiveForeground=107,114,128
```

### `~/.config/kwinrc` — KWin

Generated: `tokens/out/kwinrc-blur.ini`. **Blur is off.** The file kept its historical name after the effect it configured was switched off.

```ini
[org.kde.kdecoration2]
library=org.kde.klassy
theme=Klassy
ButtonsOnLeft=XIA
ButtonsOnRight=M
BorderSize=Normal
BorderSizeAuto=false

[Plugins]
blurEnabled=false
better_blur_dxEnabled=false
backgroundcontrastEnabled=false
fadedesktopEnabled=true
truely-maximizedEnabled=true
kwin4_effect_shapecornersEnabled=false

# decoration corner radius (radius.default) = 0.0

[Windows]
BorderlessMaximizedWindows=true
FocusStealingPreventionLevel=2
```

Note what is *absent*: there is no `[Effect-better-blur-dx]` group any more, and no window-opacity rule in `kwinrulesrc`. Ink windows are opaque (`[opacity].window_active = 1.00`), so there is nothing to blur behind them. Bugs 9 and 10 below are retained as history — they describe a blur stack that is no longer switched on.

### `~/.config/klassyrc`

Corner radius and shadow style come from the generated `tokens/out/klassy-radius.ini`:

```ini
[Windeco]
WindowCornerRadius=0

[ShadowStyle]
ShadowSize=ShadowSmall
ShadowStrength=255
ShadowColor=137, 168, 137     # accent_alt #89A889, derived per-variant
```

The rest of the shipped `config/klassy/klassyrc` (button shape, spacing, traffic-light colours) is hand-maintained.

**The Klassy source patch.** Stock Klassy's window-decoration shadow only exposes `ShadowSize` / `ShadowStrength` / `ShadowColor` — soft blurred presets with **no offset control** (confirmed from `libbreezecommon/breezesettingsdata.kcfg` and `breezeboxshadowrenderer.cpp`). The `8px 8px 0` ink shadow is therefore not reachable through any setting; the only stock option was turning the shadow off entirely.

So it is patched: `~/src/klassy/kdecoration/breezedecoration.cpp`'s `s_shadowParams[1]` (the `"Small"` preset) now renders a single hard offset(8,8) / radius(0) / opacity(1.0) layer with the second layer zeroed. That is as close to the CSS ink shadow as a KWin decoration shadow can get — `BoxShadowRenderer::calculateBlurRadius` clamps blur to a 2px floor even at radius 0, so ~2px of softness is the real floor, not 0px. `ShadowNone` (index 0) is left untouched as genuine no-shadow.

**This requires the patched `org.kde.klassy.so` to be installed.** A stock Klassy build will render `ShadowSmall` as its original soft preset, and window shadows will silently not be ink.

### `~/.config/kdeglobals` (key sections)

```ini
[General]
ColorScheme=LimeGlass
font=Carlito,11,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
fixed=Iosevka Custom Condensed,11,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
menuFont=SF Pro Display,11,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
smallestReadableFont=SF Pro Display,9,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
toolBarFont=SF Pro Display,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1

[Icons]
Theme=Tela-circle-purple-dark

[KDE]
LookAndFeelPackage=org.kde.breezedark.desktop
widgetStyle=Klassy
contrast=4
frameContrast=0.2

[Appmenu Style]
Style=Widget
```

### `~/.config/plasmarc`

```ini
[Theme]
name=breeze-dark
```

This is a **third-party** Plasma theme, and everything it paints — launcher, panel popups, tooltips, OSDs — renders in Breeze material, not ink. See [Current boundary vs planned scope](#current-boundary-vs-planned-scope). It is also the safe choice historically (Bug 7).

### `~/.config/gtk-3.0/settings.ini`

```ini
[Settings]
gtk-application-prefer-dark-theme=true
gtk-button-images=true
gtk-cursor-theme-name=breeze_cursors
gtk-cursor-theme-size=24
gtk-decoration-layout=close,keepabove,maximize:minimize
gtk-enable-animations=true
gtk-font-name=Carlito 11
gtk-icon-theme-name=Tela-circle-purple-dark
gtk-modules=colorreload-gtk-module:window-decorations-gtk-module:appmenu-gtk-module
gtk-shell-shows-menubar=1
gtk-sound-theme-name=ocean
gtk-theme-name=WhiteSur-Dark-purple
gtk-toolbar-style=3
gtk-xft-dpi=98304
```

### `~/.config/gtk-4.0/settings.ini`

Same as gtk-3.0 minus button-images, menu-images, modules, toolbar-style, shell-shows-menubar.

### `~/.config/gtk-4.0/gtk.css` — libadwaita sage override + ink cards

```css
@import 'colors.css';

@define-color accent_color #C0E3C0;
@define-color accent_bg_color #A6C9A6;
@define-color accent_fg_color #FFFFFF;

@define-color destructive_color #ED254E;
@define-color success_color #71F79F;    /* stale — sage's positive is #3FFABB */
@define-color warning_color #FBBF24;

@define-color window_bg_color #0D0D10;
@define-color window_fg_color #F8F8F8;
@define-color view_bg_color #07080A;
@define-color headerbar_bg_color #121216;
@define-color headerbar_fg_color #F8F8F8;
@define-color card_bg_color #121216;      /* opaque flat fill — was rgba(255,255,255,0.04) */
@define-color popover_bg_color #121216;
@define-color dialog_bg_color #121216;
@define-color sidebar_bg_color #0A0A0D;
@define-color link_color #89A889;

/* Ink material: hard offset shadow, square corners. GTK4 has no
   box-shadow-on-native-widgets equivalent via colour vars alone, so this is a
   literal CSS rule rather than a @define-color. */
card,
popover > contents {
  border-radius: 0;
  box-shadow: 8px 8px 0 0 rgba(0,0,0,0.9);
}
```

`card_shade_color` / `sidebar_shade_color` remain `rgba(0,0,0,0.36)`. Those are press-state darkening — functional alpha in the same family as `hover_tint` and `disabled` — not a glass material.

### `~/.config/gtk-3.0/gtk.css`

```css
@import 'colors.css';

@define-color theme_selected_bg_color #A6C9A6;
@define-color theme_selected_fg_color #07080A;
@define-color accent_color #C0E3C0;
@define-color accent_bg_color #A6C9A6;
@define-color link_color #C0E3C0;
@define-color link_visited_color #89A889;
```

> Both files override *colours* on top of WhiteSur-Dark-purple. Widget geometry — corner rounding, borders, the macOS-derived shading — is still WhiteSur's. Replacing that is the GTK half of the [planned scope](#current-boundary-vs-planned-scope).

### Shell exports — `~/.zshrc`, `~/.bashrc`, `~/.profile`

```bash
export GTK_THEME="WhiteSur-Dark-purple"
export GTK_USE_PORTAL=1
```

### `~/.config/plasma-workspace/env/gtk.sh`

```bash
export GTK_THEME=WhiteSur-Dark-purple
```

### `~/.local/share/applications/microsoft-edge.desktop`

Override of `/usr/share/applications/microsoft-edge.desktop`. Replace `Exec=` lines with:

```
Exec=/usr/bin/microsoft-edge-stable --ozone-platform=wayland --enable-features=UseOzonePlatform,WaylandWindowDecorations --enable-wayland-ime --gtk-version=4 --disable-features=WaylandFractionalScaleV1 --use-system-default-print %U
```

### `~/.config/starship.toml` + `~/.config/fastfetch/config.jsonc`

See backup directory for full files. Key choice:
- Starship replaces P10K (already in zshrc as `eval "$(starship init zsh)"`)
- Fastfetch alias replaces neofetch (`alias neofetch='fastfetch'`)

### Konsole

`~/.local/share/konsole/SageInk.profile`:
```ini
[Appearance]
ColorScheme=SageInk
Font=Iosevka Custom Condensed,10,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
LineSpacing=2

[Cursor Options]
CursorShape=2
UseCustomCursorColor=true
CustomCursorColor=166,201,166    # #A6C9A6 sage
CustomCursorTextColor=7,8,10

[General]
Command=/bin/zsh
Name=LimeGlass

[Scrolling]
HistoryMode=2
ScrollBarPosition=2
```

`~/.local/share/konsole/SageInk.colorscheme` — full sage palette (renamed from `LimeGlass.colorscheme` 2026-08-28 - the values were always sage, only the filename lagged).

**Konsole is opaque.** No background translucency, no blur — the terminal is an ink surface like everything else.

### `~/.config/konsolerc`

```ini
[Desktop Entry]
DefaultProfile=SageInk.profile
```

---

## Phase 5 — Panel Configuration

### Panel widget order (top panel, `location=3`)

```
[windowbuttons] [Kickoff] [windowlist] [spacer] [appmenu] [windowtitle] [center-spacer] [marginsep] [net-monitor] [systemtray] [clock] [show-desktop]
     43            3          40         29       44         26               28           6          32           7         21         22
```

`AppletOrder=43;3;40;29;44;26;28;6;32;7;21;22` in `~/.config/plasma-org.kde.plasma.desktop-appletsrc [Containments][2][General]`

### Key widgets

| Plugin | Role | Key config |
|---|---|---|
| `org.kde.windowbuttons` | macOS-style traffic lights in panel | `showOnlyForActiveAndMaximized=true`, `useDecorationMetrics=true` |
| `org.kde.plasma.appmenu` | Global menubar (File/Edit/View) | `compactView=true` |
| `org.kde.windowtitle` | Active window title | `style=Title`, `lengthPolicy=Maximum` |
| `org.kde.plasma.kickoff` | Start menu | (default — solid popup, Plasma 6 limitation) |
| `org.kde.plasma.systemtray` | Tray icons | (default) |
| `org.kde.plasma.digitalclock` | Clock | `fontFamily=SF Pro Display`, `fontWeight=400` |

### Borderless maximized windows

```ini
[Windows]
BorderlessMaximizedWindows=true
```

Enables macOS-style: maximized windows lose titlebar, panel windowbuttons + appmenu + windowtitle take over.

---

## Phase 6 — Apply Everything (One-Shot)

```bash
# After all configs in place + builds done:
qdbus-qt6 org.kde.KWin /KWin reconfigure
plasma-apply-colorscheme LimeGlass
plasma-apply-lookandfeel -a org.kde.breezedark.desktop
gsettings set org.gnome.desktop.interface gtk-theme 'WhiteSur-Dark-purple'
gsettings set org.gnome.desktop.interface icon-theme 'Tela-circle-purple-dark'
gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'

# Restart shell
kquitapp6 plasmashell
sleep 2
kstart plasmashell &

# Verify
grep "ColorScheme=\|widgetStyle=\|name=\|Theme=" ~/.config/plasmarc ~/.config/kdeglobals

# Verify the ink material took (all three should be 0 / false / 0)
kreadconfig6 --file klassyrc --group Windeco --key WindowCornerRadius
kreadconfig6 --file kwinrc --group Plugins --key better_blur_dxEnabled
kreadconfig6 --file kwinrc --group Plugins --key blurEnabled

# Verify no layer has drifted from the tokens (colour + material)
bash scripts/check-palette-drift.sh
```

---

## Known Limitations (Plasma 6.6 Wayland)

The limitation that dominated the glass era — *"this surface refuses to be translucent"* — is **no longer a limitation**. Ink is opaque; a stubbornly solid Kickoff popup is now the correct rendering. What remains is a different problem: those surfaces are solid in **someone else's** colours and geometry.

| Issue | Cause | Status |
|---|---|---|
| **Launcher / tray / notification popups are Breeze, not ink** | They paint from the Plasma desktop theme, which is `breeze-dark` | Planned: ship a Sage Ink desktop theme package — see [scope boundary](#current-boundary-vs-planned-scope) |
| **GTK widget geometry is WhiteSur, not ink** | `gtk.css` overrides colours only; the base theme owns corners and borders | Planned: ship a GTK base theme — same section |
| **Edge context menu is Chromium's own** | Native Skia widget, not Plasma-aware | Architectural — Chromium-side, won't fix |
| **Edge GTK mode broken with adw-gtk3-dark** | Chromium libadwaita lookup fails | Use `WhiteSur-Dark-purple` (full GTK3+4) instead |
| **Klassy window shadow needs a patched build** | Stock Klassy exposes no shadow offset control | Patch `s_shadowParams[1]` — see [klassyrc](#configklassyrc) above |
| **Icons are Tela-circle, not ink** | Third-party icon theme | No current plan; icons are out of scope for the ink material |

### Historical: the glass-era blur stack

Kvantum blur regressions, `kwin-effects-forceblur` build failures, and the better-blur-dx fork all belonged to the problem of *making surfaces translucent on Plasma 6.6*. That problem is retired. The bugs are kept below for anyone reading old commits or a machine that still has the effect loaded.

---

## Critical Bugs Encountered + Fixes

> **Read this list as history.** It was compiled during the Indigo/Lime Glass era. Bugs 4, 7, 9 and 10 are all downstream of translucency and blur, which Sage Ink no longer uses — `blurEnabled=false` and `better_blur_dxEnabled=false`. They are retained because the repo still *builds* the blur effect and installs the resume watchdog (`scripts/install.sh` has not yet caught up with the tokens), and because they explain why `plasmarc` is pinned to `breeze-dark`.

### Bug 1: Edge GTK mode renders white not dark
**Cause:** `GTK_THEME=Sweet-Ambar-Blue-Dark` env var stale; `adw-gtk3-dark` lacks GTK4/libadwaita CSS that Edge needs.
**Fix:** Switch to `WhiteSur-Dark-purple` everywhere (env vars + settings.ini + gsettings).

### Bug 2: kdeglobals selection color reverts to Breeze blue after `plasma-apply-lookandfeel`
**Cause:** LnF package writes its own `[Colors:Selection]` over scheme.
**Fix:** Re-run `plasma-apply-colorscheme LimeGlass` after every LnF change. Or manually restore `[Colors:Selection]` group via `kwriteconfig6`.

### Bug 3: kite-dark plasma theme has hardcoded Breeze blue selection
**Cause:** Theme ships `colors` file with `61,174,233` instead of reading global scheme.
**Fix:** Created `kite-indigo` (user-local copy with patched colors). Or use MacSonoma-Dark which respects scheme.

### Bug 4: Plasma popups solid even with translucent SVGs
**Cause:** Plasma 6 Kickoff QML has hardcoded `Rectangle` bg, ignores theme.
**Fix:** Right-click context menus DO respect translucent SVGs (use MacSonoma-Dark). Kickoff = use Application Dashboard widget instead, OR wait Plasma 6.7.

### Bug 5: GTK theme env not propagating to running apps
**Cause:** Plasma session env loads once at login; existing apps inherit old.
**Fix:** Logout/login OR restart specific apps with explicit env: `GTK_THEME=WhiteSur-Dark-purple <app> &`.

### Bug 6: KWin crashes — `glTexStorage2D GL_INVALID_VALUE` + plasmashell unable to start
**Cause:** `kwin4_effect_shapecorners` (KDE-Rounded-Corners plugin) allocates 0-size framebuffer → KWin spams `Failed to create offscreen framebuffer` + `GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT` → Wayland surfaces fail → plasmashell EGL init fails → enters crash loop.
**Symptoms:**
- `journalctl --user -u plasma-kwin_wayland.service` → repeated `glTexStorage2D(width, height or depth < 1)` errors
- `journalctl --user -u plasma-plasmashell.service` → `Failed to initialize EGL display 3001` + `Wayland connection broke`
- plasmashell crash-loops, panel disappears
**Fix:**
```bash
kwriteconfig6 --file kwinrc --group "Plugins" --key "kwin4_effect_shapecornersEnabled" "false"
kwriteconfig6 --file kwinrc --group "Effect-blur" --key "BlurStrength" "10"
qdbus-qt6 org.kde.KWin /KWin reconfigure
systemctl --user reset-failed plasma-plasmashell.service
systemctl --user start plasma-plasmashell.service
```
**Long-term:** Klassy titlebar already rounds top corners. Bottom square acceptable. Plasma 6.7 (June 2026) ships native rounded corners — replumb plugin then if still desired.

### Bug 7: Custom plasma themes (kite-indigo, MacSonoma-Dark) trigger continuous FBO crash spam
**Cause:** Patched SVGs in MacSonoma-Dark + custom kite-indigo trigger KWin blur to allocate 0-size FBO every frame → `Failed to create offscreen framebuffer / GL_INVALID_VALUE in glTexStorage2D`. Likely SVG layer geometry malformed after manual opacity patches.
**Symptoms:**
- Hundreds of FBO errors per second in kwin journal
- Blur effect listed as "loaded" but no actual blur rendering — windows appear flat-tinted instead of frosted
- Plasmashell may crash-loop
**Fix:**
```bash
kwriteconfig6 --file plasmarc --group "Theme" --key "name" "breeze-dark"
qdbus-qt6 org.kde.KWin /Effects unloadEffect blur
sleep 1
qdbus-qt6 org.kde.KWin /Effects loadEffect blur
# This triggers KWin self-restart → spawns fresh kwin_wayland process → clean state
```
**Trade-off (as recorded at the time):** breeze-dark plasma theme has solid (non-translucent) dialog backgrounds. Right-click context menus + tooltips lose glass.
**Under Sage Ink that trade-off no longer costs anything** — solid is correct. `plasmarc [Theme] name=breeze-dark` is now the standing configuration, and the remaining objection to it is that those surfaces are Breeze-coloured, not that they are opaque.
**Recovery from spam:** Even after fixing config, old kwin_wayland process accumulates bad state. **Force kwin restart by unloading+reloading any effect via DBus** — KWin reconnects clean. Or logout/login.

### Bug 9: Stock KWin blur silently fails on Klassy titlebars + opaque app bodies in Plasma 6.6
**Cause:** Plasma 6.6 changed blur protocol (wayland-blur-protocol-v2). Klassy 6.5.3 still uses v1 → blur registration silently fails. Stock blur effect lists as "active" but renders nothing.
**Symptoms:**
- `qdbus-qt6 org.kde.KWin /Effects activeEffects` returns `blur` ✓ but...
- Titlebars show flat translucency (text behind readable, not frosted)
- Application bodies remain opaque even with opacity rules
**Fix — install kwin-effects-better-blur-dx:**
```bash
cd /tmp && rm -rf better-blur-dx
git clone --depth 1 https://github.com/xarblu/kwin-effects-better-blur-dx.git better-blur-dx
cd better-blur-dx && mkdir -p build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=/usr
make -j$(nproc) && sudo make install
# Disable stock blur, enable better-blur-dx
kwriteconfig6 --file kwinrc --group "Plugins" --key "blurEnabled" "false"
kwriteconfig6 --file kwinrc --group "Plugins" --key "better_blur_dxEnabled" "true"
qdbus-qt6 org.kde.KWin /Effects unloadEffect blur
qdbus-qt6 org.kde.KWin /Effects loadEffect better_blur_dx
```
**Critical config keys (group is `[Effect-better-blur-dx]` with HYPHEN, not underscore — common typo):**
```ini
[Effect-better-blur-dx]
BlurStrength=13
NoiseStrength=4
BlurNonMatching=true   # blur all windows (with empty WindowClasses)
BlurDecorations=true   # blur titlebars
BlurMenus=true         # blur right-click menus
BlurDocks=true         # blur panel
ForceContrastParams=true
WindowClasses=
```
**Combined with window opacity rule** (in kwinrulesrc) for body translucency:
```ini
[uuid-here]
Description=Lime Glass — body opacity
opacityactive=88
opacityactiverule=2
opacityinactive=85
opacityinactiverule=2
wmclass=.*
wmclassmatch=3
wmclasscomplete=false
```
**Caveat:** App-painted opaque bodies (Edge, Firefox) still solid even with opacity rule — alpha applied after compositing. Real frost only on apps with native transparency (Konsole, some Plasma surfaces).

### Bug 8: Klassy decoration entries cleared from kwinrc after KWin DBus restart
**Cause:** When KWin self-restarts (e.g. after effect unload triggers it), `[org.kde.kdecoration2]` keys may not persist if kwinrc was being written concurrently.
**Fix:** Re-apply via kwriteconfig6:
```bash
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "library" "org.kde.klassy"
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "theme" "Klassy"
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "ButtonsOnLeft" "XAM"
kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "ButtonsOnRight" "I"
qdbus-qt6 org.kde.KWin /KWin reconfigure
```

### Bug 10: better_blur_dx silently unloads after suspend/resume
**Cause:** KWin drops the better_blur_dx effect across suspend/resume and never re-loads it, even though `[Plugins] better_blur_dxEnabled=true` is untouched in kwinrc. No error is logged — the effect just disappears from `loadedEffects`.
**Symptoms:**
- Blur gone after waking the laptop; windows show flat translucency
- `gdbus call --session --dest org.kde.KWin --object-path /Effects --method org.freedesktop.DBus.Properties.Get org.kde.kwin.Effects loadedEffects` — no `better_blur_dx`
- kwinrc still has the effect enabled; plugin `.so` present and ABI-matched
**Immediate fix (one-shot):**
```bash
~/.local/bin/kwin-blur-watchdog.sh --once
# or manually:
gdbus call --session --dest org.kde.KWin --object-path /Effects \
  --method org.kde.kwin.Effects.loadEffect better_blur_dx
```
**Long-term fix:** `kwin-blur-watchdog.service` (systemd user unit, installed by `scripts/install.sh`) listens for logind's `PrepareForSleep` signal and re-loads the effect after every resume. It only loads when kwinrc has an explicit `better_blur_dxEnabled=true` (fail closed), and skips loading if the plugin `.so` changed on disk since session start — dlopen'ing a replaced build into the running compositor risks a mixed-version crash; relogin activates new builds instead.
```bash
systemctl --user status kwin-blur-watchdog.service   # check it's running
journalctl --user -u kwin-blur-watchdog.service      # see reload history
```
**Pinned build:** `scripts/install.sh` builds better-blur-dx at commit `9d4177ddd9d2d22094e018f4f0d47e47d436ab43` (2026-07-31) so both machines run the same binary. Override with `BLUR_COMMIT=<hash> bash scripts/install.sh` when testing newer upstream; bump the pin here and in install.sh together.
**Nobara workstation caveat:** the workstation also runs `kde-heal-blur-desktop` machinery (dnf post-transaction hook + login autostart) that independently rebuilds/reloads blur. Watchdog and kde-heal coexist but can race — e.g. kde-heal issuing `kwin_wayland --replace` while the watchdog is mid-retry. Benign (the watchdog's retries just fail until the new compositor is up, and its start-limit tolerates it), but remember both actors exist when reading confusing journal timelines there.

---

## Backup + Restore

### Backups created during setup

```
~/.config/_backup-20260425-yolo/                   # Pre-IndigoGlass (Sweet/orange)
~/.config/_backup-20260425-161425-indigo-glass/    # Mid-setup snapshot
```

### Manual snapshot before risky changes

```bash
BACKUP=~/.config/_backup-$(date +%Y%m%d-%H%M%S)-snapshot
mkdir -p $BACKUP
cp ~/.config/{kdeglobals,kwinrc,klassyrc,plasmarc,plasma-org.kde.plasma.desktop-appletsrc,konsolerc} $BACKUP/
cp -r ~/.config/{gtk-3.0,gtk-4.0,plasma-workspace} $BACKUP/
cp -r ~/.local/share/{konsole,color-schemes,applications} $BACKUP/
cp ~/.zshrc ~/.bashrc ~/.profile ~/.p10k.zsh $BACKUP/
cp ~/.config/{starship.toml,fastfetch/config.jsonc} $BACKUP/ 2>/dev/null
echo "✓ snapshot at $BACKUP"
```

### Restore from backup

```bash
BACKUP=~/.config/_backup-XXXXXXXX-XXXXXX-snapshot
cp $BACKUP/{kdeglobals,kwinrc,klassyrc,plasmarc} ~/.config/
cp -r $BACKUP/gtk-3.0 $BACKUP/gtk-4.0 ~/.config/
cp $BACKUP/zshrc ~/.zshrc
qdbus-qt6 org.kde.KWin /KWin reconfigure
kquitapp6 plasmashell && sleep 2 && kstart plasmashell &
```

---

## Future Maintenance

### When Plasma upgrades (e.g. 6.6 → 6.7)
1. **Backup first** (snapshot script above)
2. Klassy may break — rebuild from source:
   ```bash
   cd ~/src/klassy && git pull && rm -rf build && mkdir build && cd build
   cmake .. -DCMAKE_INSTALL_PREFIX=/usr -DBUILD_QT5=OFF -DBUILD_QT6=ON
   make -j$(nproc) && sudo make install
   ```
   **Re-apply the ink shadow patch to `s_shadowParams[1]` after every pull** — `git pull` will discard it, and a stock build reverts window shadows to Klassy's soft preset without any error.
3. KDE-Rounded-Corners COPR may need rebuild too — check matinlotfali repo for updated branch
4. Re-apply the colour scheme: `plasma-apply-colorscheme LimeGlass` (heritage filename, sage values)
5. Re-apply the generated partials: `tokens/out/klassy-radius.ini` → `~/.config/klassyrc`, `tokens/out/kwinrc-blur.ini` → `~/.config/kwinrc`

### When LookAndFeel package upgraded
LnF can overwrite color scheme + plasma theme. Re-apply:
```bash
kwriteconfig6 --file kdeglobals --group "General" --key "ColorScheme" "LimeGlass"
kwriteconfig6 --file plasmarc --group "Theme" --key "name" "breeze-dark"
plasma-apply-colorscheme LimeGlass
```

### When breaking — emergency reset

```bash
# Nuke custom configs, return to KDE defaults
mv ~/.config/{kdeglobals,kwinrc,plasmarc,klassyrc} /tmp/
qdbus-qt6 org.kde.KWin /KWin reconfigure
kquitapp6 plasmashell && kstart plasmashell &
# Then restore from latest backup
```

---

## Edge Browser Setup

### Launch flags (in `~/.local/share/applications/microsoft-edge.desktop`)

```
--ozone-platform=wayland
--enable-features=UseOzonePlatform,WaylandWindowDecorations
--enable-wayland-ime
--gtk-version=4
--disable-features=WaylandFractionalScaleV1
```

### In-Edge settings

```
edge://settings/appearance:
  Overall appearance: Dark        (NOT GTK — bug)
  Theme → Colour theme → Custom eyedropper → #A6C9A6
  Show home button: off
  Show favourites bar: only on new tabs

edge://flags/:
  Enable: chrome-refresh-2023
  Enable: enable-fluent-overlay-scrollbar
  Enable: webui-tab-strip (optional)
```

---

## Build Order (from-scratch)

```
1. dnf install all packages above
2. Build Klassy (Phase 2) — INCLUDING the s_shadowParams[1] ink-shadow patch
3. Install themes — WhiteSur, Tela-circle, Panel Colorizer (Phase 3)
4. python3 tokens/codegen.py — regenerate tokens/out/* from the token file
5. Write all config files (Phase 4)
6. Configure panel widgets (Phase 5)
7. Run apply commands (Phase 6)
8. bash scripts/check-palette-drift.sh — must exit 0
9. Logout/login for env propagation
10. In Edge: configure flags + theme picker
```

Step 4 before step 5 is not optional: every concrete value in Phase 4 is meant to be derived, and hand-typing hex or a shadow string is exactly how the migrations described in [PHILOSOPHY.md](PHILOSOPHY.md#material-is-a-constraint-not-a-preference) went wrong.

---

## Sources Used

- **Klassy:** https://github.com/paulmcauley/klassy
- **WhiteSur:** https://github.com/vinceliuice/WhiteSur-gtk-theme
- **Tela-circle:** https://github.com/vinceliuice/Tela-circle-icon-theme
- **Panel Colorizer:** https://github.com/luisbocanegra/plasma-panel-colorizer
- **KDE Rounded Corners:** https://github.com/matinlotfali/KDE-Rounded-Corners
- **Linear brand:** https://linear.app/brand (color #5E6AD2 — the Indigo Glass heritage accent)
- **`DESIGN.md` / The Verge:** https://github.com/voltagent/awesome-design-md — `design-md/theverge/DESIGN.md` is the lineage reference for the ink material (colour-as-elevation, near-black canvas, hazard-tape accent)
- **Klassy plasma6 branch:** plasma6.3 (compatible with 6.6 via cmake flags)
- **Research reports** (in this project):
  - `magazine-comic-style-design-system-2026-08-27.md` — the Sage Ink lineage; Revision 2 identifies `DESIGN.md` / The Verge
  - `beyond-indigo-glass-directions-2026-06-26.md` — the earlier survey that logged the neo-brutalist lane as direction B2
  - `orange-accent-replacement-dark-ui-2026-04-25.md` — why amber is semantic-only
  - `kde-plasma-visionos-linear-neomorphism-design-system-2026-04-25.md` — **superseded**; the original three-reference glass hybrid

---

## Portfolio Web (`~/portfolio/web`) — Tailwind v4 Sage Ink

SvelteKit + Tailwind v4 portfolio inherits the same design tokens via an `@theme` block in `src/app.css`. Generate from `tokens/out/css-vars.sage.css` rather than typing values.

### Token map (Tailwind ↔ KDE)

```css
@theme {
  --color-base: #07080A;
  --color-surface: #0D0D10;
  --color-surface-elevated: #121216;
  --color-sidebar: #0A0A0D;
  --color-accent: #A6C9A6;
  --color-accent-hi: #C0E3C0;
  --color-accent-alt: #89A889;
  --color-amber: #FBBF24;
  --color-positive: #3FFABB;
  --color-negative: #ED254E;

  --font-sans: "Carlito", "SF Pro Display", system-ui, sans-serif;
  --font-display: "SF Pro Display", "Inter", -apple-system, sans-serif;
  --font-mono: "Iosevka Custom Condensed", "JetBrainsMono Nerd Font", monospace;

  /* Material */
  --radius: 0;                              /* every surface — matches Klassy */
  --radius-xs: 2px;                         /* tags, small badges */
  --radius-full: 9999px;                    /* circles, pill CTA */
  --shadow-ink: 4px 4px 0 0 #89A889;        /* accent_alt, resolved per variant */
  --shadow-ink-lg: 7px 7px 0 0 #89A889;
  --shadow-ink-press: 0 0 0 0 #89A889;
  --shadow-ink-accent: 4px 4px 0 0 #89A889;
  --shadow-hairline: 0 0 0 1px rgba(255,255,255,0.10);

  /* Motion */
  --ease-mechanical: steps(2, end);
  --dur-instant: 60ms;
  --motion-ink-press: var(--dur-instant) var(--ease-mechanical);
}
```

There is no `--blur-glass`, no `--shadow-glass*`, and no `--shadow-neu-*`. Those tokens were deleted from the source of truth.

> The legacy `--color-indigo` / `--color-indigo-light` / `--color-violet` var names still resolve as aliases for backward compatibility (codegen emits them pointing at the active accent), but prefer `--color-accent` / `--color-accent-hi` / `--color-accent-alt`.

### Ink utility patterns

```html
<!-- Ink surface: opaque fill, square corner, hard offset shadow -->
<div class="ink">…</div>              <!-- shadow-ink -->
<div class="ink-lg">…</div>           <!-- shadow-ink-lg — feature tiles, hero -->
<div class="ink-accent">…</div>       <!-- hazard-coloured shadow -->

<!-- Quiet divider where even ink is too loud -->
<hr class="hairline">

<!-- Accent focus ring -->
<input class="ring-accent">

<!-- Display text -->
<h1 class="text-display">…</h1>
```

### Usage rules

- **Elevation is fill colour first.** Reach for `surface` → `surface-elevated` before reaching for a shadow. The shadow is the second cue, not the first.
- **The shadow is hard.** `box-shadow` with a non-zero blur radius fails `scripts/check-palette-drift.sh --material`.
- **The press is mechanical.** On `:active` — never `:hover`, which is where neobrutalism.dev puts it — translate the element by the shadow's offset (`translate(4px, 4px)`) and collapse the shadow to `shadow-ink-press`. 60ms, `steps(2, end)` — a stamp, not a spring. No overshoot easing.
- **Reserve clearance.** The shadow lives outside the box, down and to the right. See [DENSITY.md](DENSITY.md#how-density-interacts-with-ink).
- **Single accent, fill-only.** `bg-accent` for primary, `text-amber` for warnings only. Sage is `1.72:1` against `--color-text` — never use it as a text colour.

### Build verification

```bash
cd ~/portfolio/web
bun run check    # svelte-check should pass with 0 errors
bun run dev      # verify ink surfaces render correctly in browser

# from this repo:
bash scripts/check-palette-drift.sh   # colour + material drift, exit 1 on any hit
```

> **Status, 2026-09-02.** `web/app.css.example` is current. The note that previously stood here described it as "still the glass-era file", carrying `--shadow-glass*`, `--shadow-neu-*`, `--blur-glass`, a 4/6/8/12/16/24px radius ladder and the pre-nudge `#71F79F`. **None of those are in the file** — it had already been rewritten to the neobrutalism.dev schema and the note was never updated. It now also carries the settled border and shadow tone rules: `--border` is `border_strong` (black measured 1.08:1 on this page and was not visible), and `--shadow` follows the element's own fill — sage for dark fills, the page colour for light ones.
