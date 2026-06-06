# Indigo Glass - SDDM greeter theme

Login screen w/ Indigo Glass palette + mesh wallpaper. QML-based (SDDM standard).

## Install

```bash
sudo cp -r indigo-glass /usr/share/sddm/themes/
sudo kwriteconfig6 --file /etc/sddm.conf --group Theme --key Current 'indigo-glass'
```

Or via Plasma Settings -> Login Screen (SDDM) -> Theme -> select "Indigo Glass".

## Preview without reboot

```bash
sddm-greeter --test-mode --theme /usr/share/sddm/themes/indigo-glass
```

## What it shows

- Mesh gradient background (`background.svg`, shipped) over `#0F0F12` base
- Centered translucent login panel (12px radius, 70% surface_alt + 13px blur effect)
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
