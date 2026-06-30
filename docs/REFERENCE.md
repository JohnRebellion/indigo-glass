# Lime Glass — Cross-Platform Design System
**Full reference for from-scratch rebuild + troubleshooting**

**Scope:** KDE Plasma 6.6 desktop, GTK apps, terminal (Konsole + Starship + Fastfetch), portfolio web (`~/portfolio/web` — SvelteKit + Tailwind v4)

*Last updated: 2026-04-26*
*Tested on: Nobara Linux 43, Plasma 6.6.4, KDE Frameworks 6.25.0, Wayland, AMD RX 7600 XT*

---

## Aesthetic Goal

**Hybrid:** brutalist-glass + Linear app dark discipline + Neumorphism 2.0 (selective tactility)

**Core formula:**
- Deep dark base (`#0F0F12`)
- Frosted glass layers floating in z-depth
- Sharp geometric typography (Linear-style)
- Soft pillowy widgets (neumorphic, selective)
- Indigo `#5E6AD2` single accent
- Amber `#FBBF24` semantic warning only

---

## Color Palette (canonical — used by all layers)

```
Base:            #0F0F12     Dark surface
Surface:         #1C1C21     Window bg
Surface+1:       #1F2028     Elevated panels, glass base
Sidebar:         #18181C     Sidebar bg
Glass border:    rgba(255,255,255,0.06)
Glass border+:   rgba(255,255,255,0.10)
Indigo:          #5E6AD2     Linear primary — selection, buttons
Indigo+1:        #818CF8     Hover, focus, active link
Violet:          #A78BFA     Visited link, accent decoration
Amber:           #FBBF24     Semantic warning
Positive:        #71F79F     Success
Negative:        #ED254E     Error, destructive
Text primary:    #F8F8F8
Text muted:      #6B7280
```

### Where each color lives

| Color | KDE | GTK4 | Konsole | Starship | Fastfetch | Klassy | Portfolio (Tailwind) |
|---|---|---|---|---|---|---|---|
| `#0F0F12` Base | View bg | view_bg | bg | bg_0 | - | - | --color-base |
| `#1C1C21` Surface | Window bg | window_bg | - | bg_1 | - | - | --color-surface |
| `#1F2028` Surface+1 | Window alt | headerbar | - | bg_2 | - | - | --color-surface-elevated |
| `#5E6AD2` Indigo | Selection | accent_bg | - | indigo | - | (via scheme) | --color-indigo |
| `#818CF8` Indigo+1 | Decoration | accent | Color4 | indigo_light | keys | OnAllDesktops btn | --color-indigo-light |
| `#A78BFA` Violet | Link | violet_color | Color5 | violet | title | - | --color-violet |
| `#FBBF24` Amber | Neutral | warning | Color3 | amber | - | Min btn | --color-amber |
| `#ED254E` Negative | Negative | destructive | Color1 | - | - | Close btn | --color-negative |
| `#71F79F` Positive | Positive | success | Color2 | - | - | Max btn | --color-positive |

**RGB equivalents (for KDE color schemes):**
- `#5E6AD2` = `94,106,210`
- `#818CF8` = `129,140,248`
- `#A78BFA` = `167,139,250`
- `#FBBF24` = `251,191,36`

---

## Component Stack — Full Layer Diagram

| Layer | Tool/Setting | File |
|---|---|---|
| Window decoration | **Klassy** v6.5.3 | `~/.config/kwinrc [org.kde.kdecoration2]` |
| Window button layout | XAM left, I right | same — `ButtonsOnLeft=XAM, ButtonsOnRight=I` |
| Window button style | Traffic lights / rounded rect | `~/.config/klassyrc` |
| Plasma desktop theme | **breeze-dark** (safe — see Bug 7) | `~/.config/plasmarc [Theme] name=breeze-dark` |
| Color scheme | **IndigoGlass** (custom) | `~/.local/share/color-schemes/IndigoGlass.colors` |
| Widget style (Qt) | **Klassy** | `~/.config/kdeglobals [KDE] widgetStyle=Klassy` |
| LookAndFeel | **org.kde.breezedark.desktop** (neutral) | `~/.config/kdeglobals [KDE] LookAndFeelPackage` |
| KWin blur engine | **kwin-effects-better-blur-dx** (xarblu fork — stock blur broken on 6.6) | `~/.config/kwinrc [Effect-better-blur-dx]` |
| Blur params | strength 13, noise 4, brightness 96, saturation 110 | same |
| Force-blur scope | all windows + decorations + menus + docks | `BlurNonMatching=true, BlurDecorations=true, BlurMenus=true, BlurDocks=true` |
| Window opacity rule | active 88%, inactive 85% (global wmclass=.*) | `~/.config/kwinrulesrc` |
| Rounded corners | **DISABLED** — Klassy titlebar handles top corners | `~/.config/kwinrc [Plugins] kwin4_effect_shapecornersEnabled=false` |
| Icon theme | **Tela-circle-purple-dark** | `~/.config/kdeglobals [Icons] Theme` |
| Cursor theme | breeze_cursors (optional Bibata Modern Ice) | `~/.config/kcminputrc` |
| GTK theme | **WhiteSur-Dark-purple** | `~/.config/gtk-3.0/settings.ini`, `~/.config/gtk-4.0/settings.ini` |
| GTK env override | `GTK_THEME=WhiteSur-Dark-purple` | `~/.zshrc`, `~/.bashrc`, `~/.profile`, `~/.config/plasma-workspace/env/gtk.sh` |
| libadwaita accent | indigo override CSS | `~/.config/gtk-4.0/gtk.css` |
| Konsole color scheme | IndigoGlass | `~/.local/share/konsole/IndigoGlass.colorscheme` |
| Konsole profile | IndigoGlass (Iosevka 13pt, violet cursor) | `~/.local/share/konsole/IndigoGlass.profile` |
| Shell prompt | Starship (replaces P10K) | `~/.config/starship.toml` |
| Greeter | Fastfetch (replaces neofetch) | `~/.config/fastfetch/config.jsonc` |
| Edge launch flags | Wayland + system decorations | `~/.local/share/applications/microsoft-edge.desktop` |
| Panel widgets | windowbuttons (id=43), appmenu (id=44), windowtitle (id=26) | `~/.config/plasma-org.kde.plasma.desktop-appletsrc` |

---

## Fonts

| Role | Font | Size | Reason |
|---|---|---|---|
| General UI | **Carlito** | 11pt | Humanist with double-storey loop-tail g (matches Iosevka mono) |
| Window title | **SF Pro Display** | 11pt | Apple-system, glass-aware |
| Menu | SF Pro Display | 11pt | Match titlebar |
| Toolbar | SF Pro Display | 10pt | Hierarchy |
| Smallest | SF Pro Display | 9pt | Hierarchy |
| Fixed/Mono | **Iosevka Custom Condensed** | 11pt | Coding |
| Konsole | Iosevka Custom Condensed | 13pt | Terminal |

**Two-family discipline:**
- Carlito (humanist, double-storey loop-tail g) → app content
- SF Pro Display (geometric Apple) → window chrome

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

### `~/.local/share/color-schemes/IndigoGlass.colors`

Full file: see `~/.config/_backup-20260425-161425-indigo-glass/color-schemes/IndigoGlass.colors`

Key values (all groups):
```ini
[General]
ColorScheme=IndigoGlass
Name=Lime Glass

[Colors:Selection]
BackgroundNormal=94,106,210      # #5E6AD2
BackgroundAlternate=129,140,248  # #818CF8
DecorationFocus=129,140,248
DecorationHover=129,140,248

[Colors:Window]
BackgroundNormal=28,28,33        # #1C1C21
BackgroundAlternate=42,46,58     # #1F2028 (depth)
ForegroundNormal=211,218,227     # text
ForegroundActive=129,140,248     # indigo accent
ForegroundNeutral=251,191,36     # AMBER (warning) — semantic

[WM]
activeBackground=31,32,40
activeForeground=248,248,248
inactiveBackground=28,28,33
inactiveForeground=107,114,128
```

### `~/.config/kwinrc` — KWin

```ini
[org.kde.kdecoration2]
library=org.kde.klassy
theme=Klassy
ButtonsOnLeft=XAM
ButtonsOnRight=I
BorderSize=None
BorderSizeAuto=false

[Plugins]
blurEnabled=true
backgroundcontrastEnabled=true
kwin4_effect_translucencyEnabled=true
kwin4_effect_shapecornersEnabled=false
fadedesktopEnabled=true
truely-maximizedEnabled=true

[Effect-blur]
# DISABLED — using better-blur-dx instead
BlurStrength=10
NoiseStrength=0
TransparentBlur=true

[Effect-better-blur-dx]
# Active blur engine (xarblu fork — Plasma 6.6 stable compatible)
BlurStrength=13
NoiseStrength=4
Brightness=96
Saturation=110
Contrast=100
BlurMatching=false
BlurNonMatching=true
BlurDecorations=true
BlurMenus=true
BlurDocks=true
ForceContrastParams=true
CornerRadius=8.0
WindowClasses=

[Windows]
BorderlessMaximizedWindows=true
FocusStealingPreventionLevel=2
```

### `~/.config/klassyrc`

```ini
[Common]
ActiveTitleBarOpacity=65
InactiveTitleBarOpacity=55
OpaqueMaximizedTitleBars=true

[Windeco]
ButtonShape=1
CornerRadius=8
DrawTitleBarSeparator=false
DrawBackgroundGradient=false
ThinWindowOutlineStyle=ThinWindowOutlineContrastTitleBar
ThinWindowOutlineThickness=1
BlurTransparentTitleBars=true
```

### `~/.config/kdeglobals` (key sections)

```ini
[General]
ColorScheme=IndigoGlass
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

(Keeps translucent SVG dialogs working. Right-click context menus + tooltips will be glass.)

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

### `~/.config/gtk-4.0/gtk.css` — libadwaita indigo override

```css
@import 'colors.css';

@define-color accent_color #818CF8;
@define-color accent_bg_color #5E6AD2;
@define-color accent_fg_color #FFFFFF;

@define-color destructive_color #ED254E;
@define-color success_color #71F79F;
@define-color warning_color #FBBF24;

@define-color window_bg_color #1C1C21;
@define-color window_fg_color #F8F8F8;
@define-color view_bg_color #0F0F12;
@define-color headerbar_bg_color #1F2028;
@define-color headerbar_fg_color #F8F8F8;
@define-color card_bg_color rgba(255,255,255,0.04);
@define-color popover_bg_color #1F2028;
@define-color sidebar_bg_color #18181C;
```

### `~/.config/gtk-3.0/gtk.css`

```css
@import 'colors.css';

@define-color theme_selected_bg_color #5E6AD2;
@define-color theme_selected_fg_color #FFFFFF;
@define-color accent_color #818CF8;
@define-color accent_bg_color #5E6AD2;
@define-color accent_fg_color #FFFFFF;
@define-color link_color #818CF8;
@define-color link_visited_color #A78BFA;
```

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

`~/.local/share/konsole/IndigoGlass.profile`:
```ini
[Appearance]
ColorScheme=IndigoGlass
Font=Iosevka Custom Condensed,13,-1,5,400,0,0,0,0,0,0,0,0,0,0,1
LineSpacing=2

[Cursor Options]
CursorShape=2
UseCustomCursorColor=true
CustomCursorColor=167,139,250
CustomCursorTextColor=15,15,18

[General]
Command=/bin/zsh
Name=IndigoGlass

[Scrolling]
HistoryMode=2
ScrollBarPosition=2
```

`~/.local/share/konsole/IndigoGlass.colorscheme` — full Catppuccin-inspired indigo palette. See backup.

### `~/.config/konsolerc`

```ini
[Desktop Entry]
DefaultProfile=IndigoGlass.profile
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
plasma-apply-colorscheme IndigoGlass
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
```

---

## Known Limitations (Plasma 6.6 Wayland — April 2026)

| Issue | Cause | Status |
|---|---|---|
| **Kickoff popup solid (not translucent)** | Hardcoded QML background, ignores theme SVG | Fix in Plasma 6.7 (June 2026) |
| **System tray popup partial transparency** | Same as above | Same |
| **Notification popup partial** | Same | Same |
| **Edge context menu solid** | Chromium native Skia widget, not Plasma-aware | Architectural — Chromium-side, won't fix |
| **Edge GTK mode broken with adw-gtk3-dark** | Chromium libadwaita lookup fails | Use `WhiteSur-Dark-purple` (full GTK3+4) instead |
| **Kvantum blur broken on Plasma 6 Wayland** | Upstream regression | Don't use Kvantum — use native Breeze + KWin blur |
| **kwin-effects-forceblur build fails Plasma 6.6** | API changed from 6.4 | Repo claims 6.4 only. Wait for fork update |

### What DOES work (translucent)

- ✓ Window decoration (Klassy titlebar — full glass)
- ✓ Panel (with translucent SVG + KWin blur)
- ✓ Tooltips
- ✓ **Right-click context menus** (after MacSonoma-Dark plasma theme)
- ✓ Drop-down combos in WebUI pages (browser-rendered HTML)

---

## Critical Bugs Encountered + Fixes

### Bug 1: Edge GTK mode renders white not dark
**Cause:** `GTK_THEME=Sweet-Ambar-Blue-Dark` env var stale; `adw-gtk3-dark` lacks GTK4/libadwaita CSS that Edge needs.
**Fix:** Switch to `WhiteSur-Dark-purple` everywhere (env vars + settings.ini + gsettings).

### Bug 2: kdeglobals selection color reverts to Breeze blue after `plasma-apply-lookandfeel`
**Cause:** LnF package writes its own `[Colors:Selection]` over scheme.
**Fix:** Re-run `plasma-apply-colorscheme IndigoGlass` after every LnF change. Or manually restore `[Colors:Selection]` group via `kwriteconfig6`.

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
**Trade-off:** breeze-dark plasma theme has solid (non-translucent) dialog backgrounds. Right-click context menus + tooltips lose glass. Window titlebars + panel still glassy.
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
3. KDE-Rounded-Corners COPR may need rebuild too — check matinlotfali repo for updated branch
4. Re-apply IndigoGlass: `plasma-apply-colorscheme IndigoGlass`

### When LookAndFeel package upgraded
LnF can overwrite color scheme + plasma theme. Re-apply:
```bash
kwriteconfig6 --file kdeglobals --group "General" --key "ColorScheme" "IndigoGlass"
kwriteconfig6 --file plasmarc --group "Theme" --key "name" "MacSonoma-Dark"
plasma-apply-colorscheme IndigoGlass
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
  Theme → Colour theme → Custom eyedropper → #5E6AD2
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
2. Build Klassy (Phase 2)
3. Install themes — WhiteSur, Tela-circle, Panel Colorizer (Phase 3)
4. Write all config files (Phase 4)
5. Configure panel widgets (Phase 5)
6. Run apply commands (Phase 6)
7. Logout/login for env propagation
8. In Edge: configure flags + theme picker
```

---

## Sources Used

- **Klassy:** https://github.com/paulmcauley/klassy
- **WhiteSur:** https://github.com/vinceliuice/WhiteSur-gtk-theme
- **Tela-circle:** https://github.com/vinceliuice/Tela-circle-icon-theme
- **Panel Colorizer:** https://github.com/luisbocanegra/plasma-panel-colorizer
- **KDE Rounded Corners:** https://github.com/matinlotfali/KDE-Rounded-Corners
- **Linear brand:** https://linear.app/brand (color #5E6AD2)
- **visionOS HIG:** https://developer.apple.com/design/human-interface-guidelines/designing-for-visionos
- **Klassy plasma6 branch:** plasma6.3 (compatible with 6.6 via cmake flags)
- **Research reports** (in this project):
  - `kde-plasma-visionos-linear-neomorphism-design-system-2026-04-25.md`
  - `orange-accent-replacement-dark-ui-2026-04-25.md`

---

## Portfolio Web (`~/portfolio/web`) — Tailwind v4 Lime Glass

SvelteKit + Tailwind v4 portfolio inherits same design tokens via `@theme` block in `src/app.css`.

### Token map (Tailwind ↔ KDE)

```css
@theme {
  --color-base: #0F0F12;
  --color-surface: #1C1C21;
  --color-surface-elevated: #1F2028;
  --color-indigo: #5E6AD2;
  --color-indigo-light: #818CF8;
  --color-violet: #A78BFA;
  --color-amber: #FBBF24;
  --color-positive: #71F79F;
  --color-negative: #ED254E;

  --font-sans: "Carlito", "SF Pro Display", system-ui, sans-serif;
  --font-display: "SF Pro Display", "Inter", -apple-system, sans-serif;
  --font-mono: "Iosevka Custom Condensed", "JetBrainsMono Nerd Font", monospace;

  --radius: 8px;          /* matches Klassy CornerRadius */
  --blur-glass: blur(13px); /* matches KWin BlurStrength=13 */
}
```

### Glass utility classes

```html
<!-- visionOS Liquid Glass surface -->
<div class="glass">…</div>           <!-- standard frosted -->
<div class="glass-subtle">…</div>    <!-- light blur -->
<div class="glass-strong">…</div>    <!-- heavy frost + shadow -->

<!-- Neumorphism 2.0 (interactive only) -->
<button class="neu-raised">…</button>   <!-- raised pillow -->
<button class="neu-pressed">…</button>  <!-- pressed/inset -->

<!-- Indigo focus glow -->
<input class="glow-indigo">

<!-- Linear-style display text -->
<h1 class="text-display">…</h1>
```

### Usage rules (mirrored from Neumorphism 2.0 design philosophy)

- Use `.glass` / `.glass-strong` for: cards, modals, sidebars, hero sections
- Use `.neu-raised` / `.neu-pressed` ONLY for: buttons, sliders, toggles, knobs (interactive)
- NEVER apply neumorphism to: text, nav, backgrounds, headers (accessibility)
- Single accent: `text-indigo` for primary, `text-violet` for secondary, `text-amber` for warning only

### Build verification

```bash
cd ~/portfolio/web
bun run check    # svelte-check should pass with 0 errors
bun run dev      # verify glass renders correctly in browser
```
