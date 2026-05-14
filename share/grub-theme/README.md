# Indigo Glass — GRUB Theme

Custom GRUB2 boot theme matching the Indigo Glass design system.

## Contents

- `theme.txt` — GRUB theme definition (Amber v3 layout)
- `background.jpg` — desktop background
- `sfpro-*.pf2` — SF Pro Display fonts at multiple sizes
- `assets/` — menu, terminal, progress-bar 9-slice tiles
- `icons/` — OS class icons (fedora, nobara, windows, uefi, etc.)

## Install

From repo root:

```bash
bash scripts/install.sh --with-grub --themes-only
```

This copies the theme to `/boot/grub2/themes/indigo-glass/`, backs up
`/etc/default/grub`, points `GRUB_THEME` + `GRUB_BACKGROUND` at it, and
regenerates `grub.cfg` (BIOS or UEFI Fedora path).

## Manual install

```bash
sudo cp -r share/grub-theme /boot/grub2/themes/indigo-glass
sudo cp /etc/default/grub /etc/default/grub.bak
sudo sed -i "s|^GRUB_THEME=.*|GRUB_THEME='/boot/grub2/themes/indigo-glass/theme.txt'|" /etc/default/grub
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

For UEFI Fedora/Nobara, regenerate at `/boot/efi/EFI/fedora/grub.cfg` instead.

## Fonts

SF Pro Display `.pf2` files were generated with:

```bash
grub2-mkfont -s <size> -o sfpro-<size>.pf2 /path/to/SF-Pro-Display-Regular.otf
```
