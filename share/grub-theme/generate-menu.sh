#!/usr/bin/env bash
# Bake the boot-menu 9-slice and the selected-item box.
#
# GRUB has no stylesheet: every surface is a pixmap sliced by filename suffix.
# This is the closest GRUB gets to neobrutalism.dev's menu components —
# a bordered container (menu_*) with a bordered selected row (select_*).
#
# Structure follows the reference (a real panel, a real per-row box); the FILL
# does not. The reference's menu is bg-main, which here would put the accent
# across 57% of a 2560x1440 screen. Sage Ink keeps surface_alt and spends the
# accent on the selection stroke instead — Tier C, outline not fill, the same
# rule the Plasma/GTK/VSCode layers use for an on-select state.
#
# The previous select_*.png were hand-made and drew partial-alpha (0.56) sage
# rules along the top and bottom edges only — a hairline, not a box, and the
# only translucent value left in the theme. Regenerating them here makes them
# reproducible and opaque.
#
# Usage: bash share/grub-theme/generate-menu.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

OUT=assets
SURFACE_ALT='#121216'   # panel fill
BORDER='#5E5E60'        # border_strong, 3.10:1 on base
ACCENT='#A6C9A6'        # selection stroke
B=2                     # border.default

mkdir -p "$OUT"

# ── Menu panel: a full 9-slice. Corners are fixed, edges stretch on one axis,
#    centre stretches on both, so one 2px border survives any menu size.
magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_nw.png"
magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_ne.png"
magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_sw.png"
magick -size ${B}x${B} xc:"$BORDER" PNG32:"$OUT/menu_se.png"
magick -size 1x${B}    xc:"$BORDER" PNG32:"$OUT/menu_n.png"
magick -size 1x${B}    xc:"$BORDER" PNG32:"$OUT/menu_s.png"
magick -size ${B}x1    xc:"$BORDER" PNG32:"$OUT/menu_e.png"
magick -size ${B}x1    xc:"$BORDER" PNG32:"$OUT/menu_w.png"
magick -size 1x1       xc:"$SURFACE_ALT" PNG32:"$OUT/menu_c.png"

# ── Selected item: horizontal-only slice (c/e/w), matching the existing
#    geometry GRUB is already configured for. Height is fixed at 60 to sit
#    inside item_height 72 with item_padding 4; the caps hold the left/right
#    strokes and every tile carries the top/bottom stroke so the box closes
#    however far the centre stretches.
H=60
CAP=45
# Transparent fill + top/bottom rule.
magick -size 1620x${H} xc:none \
  -fill "$ACCENT" \
  -draw "rectangle 0,0 1619,$((B-1))" \
  -draw "rectangle 0,$((H-B)) 1619,$((H-1))" \
  PNG32:"$OUT/select_c.png"
# West cap: adds the left stroke.
magick -size ${CAP}x${H} xc:none \
  -fill "$ACCENT" \
  -draw "rectangle 0,0 $((CAP-1)),$((B-1))" \
  -draw "rectangle 0,$((H-B)) $((CAP-1)),$((H-1))" \
  -draw "rectangle 0,0 $((B-1)),$((H-1))" \
  PNG32:"$OUT/select_w.png"
# East cap: adds the right stroke.
magick -size ${CAP}x${H} xc:none \
  -fill "$ACCENT" \
  -draw "rectangle 0,0 $((CAP-1)),$((B-1))" \
  -draw "rectangle 0,$((H-B)) $((CAP-1)),$((H-1))" \
  -draw "rectangle $((CAP-B)),0 $((CAP-1)),$((H-1))" \
  PNG32:"$OUT/select_e.png"

echo "menu 9-slice + selected-item box written to $OUT/"
