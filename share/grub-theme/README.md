# Orchid Ink Light — GRUB Theme

GRUB2 boot theme for the Sage Ink design system, shipped in the **Orchid Ink
Light** variant (`orchid_light`: page #FAFAFC, accent #7F4995) since
2026-09-23 - the light orchid variant the laptop ran. `theme.txt` is the
canonical source; its `# variant:` header is the one colour switch, read by
both generators and the ink lint. `scripts/sync-grub-parity.sh` propagates
the theme to the simulator preset and, with `--deploy`, to
`/boot/grub2/themes/sage-ink/` (the install path keeps its legacy name).

## Design contract

Same rules as every other layer (docs/STATE_GRAMMAR.md, and the 2026-09-22 live
audit in research-reports/sage-ink-live-audit-2026-09-22):

| Rule | Here |
|------|------|
| Every colour a token of the named variant | labels use `text` #23262C, `accent_hi` #692E80, `accent` #7F4995; `desktop-color` is `base` #FAFAFC; the menu card is `card_fill` #C5ADCF; edges and shadow are `[on_light]` #000000. Ladder on base: 14.5 / 8.8 / 6.1:1; on the card: text 7.4:1, accent_hi 4.5:1 |
| Opaque fills, no translucency | every referenced PNG has a binary alpha channel (0 or 255); the selected row's interior is fully transparent so the card shows through, never a wash |
| Light mode = white page, coloured forward-facing card, black edge + hard shadow | the boot menu is the card: `card_fill` centre, 2px `#000000` edge, 4px `#000000` hard shadow baked into the `e`/`s`/`se` slices (GRUB pads each side by the W/N/E/S slice size and scales the corners to match). A dark variant bakes a `surface_alt` panel with a `border_strong` edge and no shadow instead |
| On-select = stroke, not fill | selected row `select_*.png`: 4px black stroke (2px vanishes at 2560x1440), see-through interior. Dark variants stroke in `accent` over the opaque `select_fill` wash |
| No gradient, blur or glow | flat `background.jpg` on `base` with `accent`/`accent_alt` corner brackets and `positive` corner ticks; the one deliberate soft pass is the 140px **black** feather at the physical screen edge that frames the 96px safe area (overscan safety; kept on the light variant by the user's call, recorded as intentional residue in the audit ledger) |
| Radius 0 | no rounded assets |

`scripts/check-ink-contract.py` reads all of this back from `theme.txt` and the
pixmaps it references, and runs on every commit.

## Layout (v12, 2560x1440 native)

- Five static stat cards at top=130..300: CPU / MEMORY / GPU / DISK / BOARD.
  Each is an 80x5 `accent_line.png` rule, a section label (`accent`, 24px), a
  headline (`text`, 40px), a spec sub-line (`accent_hi`, 24px) and a capability
  caption (`accent`, 22px). Values are hardware facts, nothing that drifts.
- "BOOT PICKER" header at top=360, key hint right-aligned.
- `boot_menu` at 96,470 2368x800: `menu_*.png` panel, `select_*.png` row box,
  40px icons, 72px rows.
- Footer hints centred at top=1310.
- 96px safe area on every edge.

## Contents

- `theme.txt` — GRUB theme definition (multi-line components, no `N+N` maths).
- `background.jpg`, `thumb.jpg` — baked by `generate-background.sh`.
- `assets/menu_*.png`, `assets/select_*.png`, `assets/accent_line.png` — baked by
  `generate-menu.sh`, which reads its colours from
  `tokens/out/css-vars.<variant>.css` (run `python3 tokens/codegen.py` first).
- `assets/card_*.png`, `terminal_box_*`, `progress_*`, `spin_*`, `specs_panel`,
  `sparkline`, `bars`, `dot_violet`, `version_chip` — legacy assets from earlier
  layouts; not referenced by `theme.txt`, so not rendered, not linted.
- `generate-cards.sh` — bakes the legacy `card_os/kernel/hardware.png`; unused
  by the current layout.
- `sfpro-*.pf2` — SF Pro Display at the sizes `theme.txt` names (22, 24, 29, 40,
  48) plus spares; `carlito-*.pf2` — for `GRUB_FONT`.
- `icons/*.png` — OS class icons.

## Switch variant

Edit the `# variant: <name>` line at the top of `theme.txt`, retype the label
hexes to that variant's `text` / `accent_hi` / `accent` / `base` (the lint
tells you which are wrong), then run the regenerate steps below. Any variant
with a `tokens/out/css-vars.<name>.css` works, dark or light.

## Regenerate

```bash
python3 tokens/codegen.py                    # tokens first
bash share/grub-theme/generate-menu.sh       # menu_*, select_*, accent_line
bash share/grub-theme/generate-background.sh # background.jpg + thumb.jpg
bash scripts/sync-grub-parity.sh             # -> simulator/static/presets/sage
python3 scripts/check-ink-contract.py        # contract read-back
```

## Real-GRUB compatibility notes

GRUB 2.12 strict parser limits:
- All components MUST be multi-line (`{` and `}` on own lines).
- No `N+N` arithmetic in coords (only `%-N` / `%+N` against parent dim).
- Image z-order takes precedence over label declaration order — labels behind
  images get hidden.
- No live blur / no canvas effects: every surface is a pixmap.

## Install

```bash
bash scripts/sync-grub-parity.sh --deploy   # copies to /boot, sets GRUB_THEME/FONT, regenerates grub.cfg (sudo)
```

For UEFI Fedora/Nobara the live config may be `/boot/efi/EFI/fedora/grub.cfg`;
the script probes both.

## Fonts

```bash
grub2-mkfont --no-bitmap -s 24 -o sfpro-24.pf2 /usr/local/share/fonts/s/SF_Pro_Display_Regular.otf
```
