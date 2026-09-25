# Sage Ink - SDDM greeter theme

Login screen w/ Sage Ink palette + mesh wallpaper. QML-based (SDDM standard).

## Install

```bash
sudo cp -r indigo-glass /usr/share/sddm/themes/
sudo kwriteconfig6 --file /etc/sddm.conf --group Theme --key Current 'indigo-glass'
```

Or via Plasma Settings -> Login Screen (SDDM) -> Theme -> select "Sage Ink".

## Preview without reboot

```bash
sddm-greeter --test-mode --theme /usr/share/sddm/themes/indigo-glass
```

## What it shows

- Mesh gradient background (`background.svg`, shipped) over the `base` fill
- Centered opaque ink panel (`base` fill, radius 0, 2px `border_strong` edge, hard 7px `accent_alt` offset shadow, no blur)
- Username combo + password field + sign-in button
- Session selector at bottom
- Clock in lower-right (Iosevka mono)
- Carlito body font, Iosevka mono for the time

## Files

| File | Purpose |
|---|---|
| `metadata.desktop` | SDDM theme metadata |
| `theme.conf` | Static config (font/color hints) |
| `Main.qml` | QML form |
| `background.svg` | Mesh gradient (copy of `assets/wallpapers/indigo-glass-mesh-3840x2160.svg`) |

## Why static SVG bg instead of QML-rendered mesh

QML can paint mesh procedurally but adds startup cost on weak CPUs. Static SVG decodes once, scales to screen, then GPU compositor handles. Lower power = faster login screen.
