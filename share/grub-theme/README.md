# Lime Glass — GRUB Theme

Custom GRUB2 boot theme matching the Lime Glass design system.

## Design alignment

Per `docs/PHILOSOPHY.md` spec:

| Spec | Value |
|------|-------|
| Primary accent | `#A8E635` (ghost lime) |
| Accent shifts | `#C1FF58`, `#8BC406` (luminance variants of same hue) |
| Text primary | `#F8F8F8` |
| Text muted | `#6B7280` |
| Surface base | `#07080A` |
| Surface | `#121216` |
| Radius default | `8px` |
| Chrome font | SF Pro Display (titles, brand) |
| Body font | Carlito (descriptions, menu items, footer) |

## Layout

Dashboard view (Compot-inspired):

- **Brand top-left:** "Nobara Workstation" — SF Pro 28pt
- **Stamp top-right:** "UEFI · GRUB 2.14" — SF Pro 22pt accent
- **Stat-card row:** 3 cards (ENTRIES · TIMEOUT · DEFAULT), pre-baked PNGs with rounded 8px corners + accent line + value text inline
- **Section title:** "BOOT PICKER" — SF Pro 36pt
- **Description:** Carlito 24pt muted
- **Boot menu:** Carlito body, lime glow pill, accent left-bar, "Press Enter" chip on selected
- **Footer hints:** Carlito 22pt muted

## Contents

- `theme.txt` — GRUB theme definition (multi-line, no `N+N` math, no inline blocks)
- `background.jpg` — deep `#07080A` w/ lime glow center
- `assets/card_entries.png`, `card_timeout.png`, `card_default.png` — pre-baked stat cards w/ text+borders
- `assets/select_w.png`, `select_c.png`, `select_e.png` — 3-slice selection pill (glow + accent left-bar + Press Enter chip baked in)
- `assets/progress_bar_*.png`, `progress_highlight_*.png` — top-edge progress
- `assets/terminal_box_*.png` — 9-slice terminal box (rare, edge mode)
- `assets/spin_center.png`, `spin_tick.png` — circular_progress assets
- `sfpro-*.pf2` — SF Pro Display at 18,20,22,26,28,30,32,36,38,42,64,96
- `opensans-*.pf2` — Carlito Regular at 22,24,26,28,30
- `icons/*.png` — OS class icons (nobara, gnu-linux, windows, uefi-firmware, memtest, fedora, linux)

## Real-GRUB compatibility notes

GRUB 2.12 strict parser limits:
- All components MUST be multi-line (`{` and `}` on own lines)
- No `N+N` arithmetic in coords (only `%-N` / `%+N` against parent dim)
- Image z-order takes precedence over label declaration order — labels behind images get hidden. Bake text into card PNGs to work around.
- 4+ overlapping image components can silently break render — keep stat-card count ≤ 3
- No live blur / no canvas effects: all decorative effects (glow, frosted glass) must be pre-baked into PNG assets

## Install

```bash
bash scripts/install.sh --with-grub --themes-only
```

Copies theme to `/boot/grub2/themes/indigo-glass/`, points `GRUB_THEME` at it,
regenerates `grub.cfg`.

## Manual install

```bash
sudo cp -r share/grub-theme /boot/grub2/themes/indigo-glass
sudo cp /etc/default/grub /etc/default/grub.bak
sudo sed -i "s|^GRUB_THEME=.*|GRUB_THEME='/boot/grub2/themes/indigo-glass/theme.txt'|" /etc/default/grub
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

For UEFI Fedora/Nobara, regenerate at `/boot/efi/EFI/fedora/grub.cfg` instead.

## Fonts

```bash
grub2-mkfont --no-bitmap -s 24 -o opensans-24.pf2 /usr/share/fonts/open-sans/OpenSans-Regular.ttf
grub2-mkfont --no-bitmap -s 28 -o sfpro-28.pf2 /usr/local/share/fonts/s/SF_Pro_Display_Regular.otf
```
